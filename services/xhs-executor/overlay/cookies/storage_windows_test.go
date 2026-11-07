//go:build windows
package cookies
import("bytes";"os";"path/filepath";"testing")
func TestDPAPISessionRoundTripAndCorruption(t *testing.T){
 file:=filepath.Join(t.TempDir(),"session.sealed")
 plain:=[]byte(`{"version":2,"seed":42,"cookies":[{"name":"synthetic","value":"test-only-secret"}]}`)
 if err:=secureWrite(file,plain);err!=nil{t.Fatal(err)}
 raw,err:=os.ReadFile(file);if err!=nil{t.Fatal(err)};if bytes.Contains(raw,[]byte("test-only-secret")){t.Fatal("plaintext on disk")}
 got,err:=secureRead(file);if err!=nil||!bytes.Equal(got,plain){t.Fatal("roundtrip",err)}
 if err=secureWrite(file,[]byte(`{"version":2,"seed":43,"cookies":[]}`));err!=nil{t.Fatal(err)}
 previous,err:=secureRead(file+".bak");if err!=nil||!bytes.Equal(previous,plain){t.Fatal("backup",err)}
 if err=os.WriteFile(file,[]byte("corrupt"),0600);err!=nil{t.Fatal(err)}
 if err=NewLoadCookie(file).SaveSeed(100);err==nil{t.Fatal("corruption silently overwritten")}
 after,_:=os.ReadFile(file);if string(after)!="corrupt"{t.Fatal("corrupt original lost")}
}
