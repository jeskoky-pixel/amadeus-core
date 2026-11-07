//go:build windows
package browser
import("os";"path/filepath";"testing";"github.com/xpzouying/xiaohongshu-mcp/cookies";"golang.org/x/sys/windows")
func TestSignedBrowserNativeJob(t *testing.T){
 if os.Getenv("AMADEUS_LIVE_PREFLIGHT")!="1"{t.Skip("explicit isolated Windows browser probe only")}
 t.Setenv("COOKIES_PATH",filepath.Join(t.TempDir(),"seed.sealed"))
 if err:=cookies.NewLoadCookie(cookies.GetCookiesFilePath()).SaveSeed(1);err!=nil{t.Fatal(err)}
 b:=NewBrowser(true);defer b.Close();p:=b.NewPage();defer p.Close()
 if value:=p.MustEval("() => 1 + 1").Int();value!=2{t.Fatal("browser JS probe failed")}
 pid,err:=windows.GetProcessId(b.process.process);if err!=nil{t.Fatal(err)}
 b.Close()
 handle,err:=windows.OpenProcess(windows.SYNCHRONIZE,false,pid)
 if err==nil {defer windows.CloseHandle(handle);state,_:=windows.WaitForSingleObject(handle,5000);if state!=windows.WAIT_OBJECT_0{t.Fatal("browser still running after Job close")}}
}
