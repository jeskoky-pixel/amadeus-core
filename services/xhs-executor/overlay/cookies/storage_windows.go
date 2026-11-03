//go:build windows

// Amadeus adaptation: protect every durable byte with CurrentUser DPAPI.
package cookies

import (
 "bytes"
 "errors"
 "os"
 "path/filepath"
 "sync"
 "unsafe"
 "golang.org/x/sys/windows"
)

var diskMu sync.Mutex
var marker = []byte("AMADEUS-XHS-DPAPI-1\n")
func blob(data []byte) windows.DataBlob { b:=windows.DataBlob{Size:uint32(len(data))};if len(data)>0 {b.Data=&data[0]};return b }
func crypt(data []byte, decrypt bool) ([]byte,error) {
 in:=blob(data);var out windows.DataBlob;var err error
 if decrypt {err=windows.CryptUnprotectData(&in,nil,nil,0,nil,windows.CRYPTPROTECT_UI_FORBIDDEN,&out)} else {err=windows.CryptProtectData(&in,nil,nil,0,nil,windows.CRYPTPROTECT_UI_FORBIDDEN,&out)}
 if err!=nil{return nil,errors.New("secure session protection failed")}
 defer windows.LocalFree(windows.Handle(unsafe.Pointer(out.Data)))
 return append([]byte(nil),unsafe.Slice(out.Data,int(out.Size))...),nil
}
func secureRead(file string) ([]byte,error) {
 diskMu.Lock();defer diskMu.Unlock()
 raw,err:=os.ReadFile(file);if err!=nil{return nil,err}
 if len(raw)>8*1024*1024||!bytes.HasPrefix(raw,marker){return nil,errors.New("unsupported or plaintext session; explicit migration required")}
 return crypt(raw[len(marker):],true)
}
func secureWrite(file string, data []byte) error {
 if len(data)>4*1024*1024{return errors.New("session limit")}
 sealed,err:=crypt(data,false);if err!=nil{return err}
 diskMu.Lock();defer diskMu.Unlock()
 if err=os.MkdirAll(filepath.Dir(file),0700);err!=nil{return err}
 f,err:=os.CreateTemp(filepath.Dir(file),".sealed-*");if err!=nil{return err}
 tmp:=f.Name();defer os.Remove(tmp)
 if _,err=f.Write(append(append([]byte(nil),marker...),sealed...));err!=nil{f.Close();return err}
 if err=f.Sync();err!=nil{f.Close();return err};if err=f.Close();err!=nil{return err}
 // Backup only a validated encrypted predecessor; never overwrite a corrupt original.
 if previous,readErr:=os.ReadFile(file);readErr==nil {
  if !bytes.HasPrefix(previous,marker){return errors.New("refusing plaintext predecessor")}
  if _,err=crypt(previous[len(marker):],true);err!=nil{return err}
  if err=os.WriteFile(file+".bak",previous,0600);err!=nil{return err}
 } else if !os.IsNotExist(readErr){return readErr}
 from,_:=windows.UTF16PtrFromString(tmp);to,_:=windows.UTF16PtrFromString(file)
 return windows.MoveFileEx(from,to,windows.MOVEFILE_REPLACE_EXISTING|windows.MOVEFILE_WRITE_THROUGH)
}
