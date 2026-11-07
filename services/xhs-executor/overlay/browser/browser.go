// Amadeus Windows executor adaptation. Upstream platform actions are unchanged.
package browser

import (
 "encoding/json"
 "fmt"
 "net/url"
 "os"
 "os/exec"
 "path/filepath"
 "strings"
 "sync"
 "time"
 "github.com/go-rod/rod"
 "github.com/go-rod/rod/lib/proto"
 "github.com/xpzouying/xiaohongshu-mcp/cookies"
)

type browserConfig struct {fingerprintSeed int;proxy string}
type Option func(*browserConfig)
func WithProxy(value string) Option {return func(c *browserConfig){c.proxy=value}}
func WithFingerprintSeed(value int) Option {return func(c *browserConfig){c.fingerprintSeed=value}}
func maskProxyCredentials(value string) string {u,err:=url.Parse(value);if err!=nil||u.User==nil{return value};replacement:="***";if _,ok:=u.User.Password();ok{replacement="***:***"};return strings.Replace(value,u.User.String()+"@",replacement+"@",1)}
var browserOnce sync.Once
var browserPath string
var browserErr error
func EnsureBrowser()(string,error){
 browserOnce.Do(func(){
  for _,root:=range []string{os.Getenv("ProgramFiles(x86)"),os.Getenv("ProgramFiles")} {
   if root==""{continue};candidate:=filepath.Join(root,"Microsoft","Edge","Application","msedge.exe")
   if _,err:=os.Stat(candidate);err!=nil{continue}
   // Fixed installed vendor location; no arbitrary browser/CDP endpoint fallback.
   script:=`$ErrorActionPreference='Stop'; Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1'); $s=Get-AuthenticodeSignature -LiteralPath $env:AMADEUS_VERIFY_BROWSER; if($s.Status -ne 'Valid' -or $s.SignerCertificate.Subject -notmatch 'CN=Microsoft Corporation(,|$)'){exit 1}`
   cmd:=exec.Command(filepath.Join(os.Getenv("SystemRoot"),"System32","WindowsPowerShell","v1.0","powershell.exe"),"-NoProfile","-NonInteractive","-Command",script)
   cmd.Env=append(os.Environ(),"AMADEUS_VERIFY_BROWSER="+candidate)
   hideCommand(cmd)
   if err:=cmd.Run();err!=nil{browserErr=fmt.Errorf("browser publisher verification failed");return}
   browserPath=candidate;return
  }
  browserErr=fmt.Errorf("signed Microsoft Edge required")
 });return browserPath,browserErr
}
type Browser struct {root *rod.Browser;session *rod.Browser;process *ownedProcess;dir string;once sync.Once}
func (b *Browser) NewPage()*rod.Page{return b.session.MustPage()}
func (b *Browser) Close(){b.once.Do(func(){if b.root!=nil{_ = b.root.Close()};if b.process!=nil{b.process.Close()};if b.dir!=""{_ = os.RemoveAll(b.dir)}})}
func NewBrowser(headless bool,options ...Option)*Browser {
 cfg:=&browserConfig{};for _,option:=range options{option(cfg)}
 binary,err:=EnsureBrowser();if err!=nil{panic(err)}
 dir,err:=os.MkdirTemp("","amadeus-xhs-browser-");if err!=nil{panic(err)}
 result:=&Browser{dir:dir};defer func(){if e:=recover();e!=nil{result.Close();panic(e)}}()
 args:=[]string{"--remote-debugging-port=0","--remote-debugging-address=127.0.0.1","--user-data-dir="+dir,"--no-first-run","--disable-background-networking","--incognito"}
 if headless{args=append(args,"--headless=new")};if cfg.proxy!=""{args=append(args,"--proxy-server="+cfg.proxy)};args=append(args,"about:blank")
 result.process,err=launchOwned(binary,args);if err!=nil{panic(err)}
 var endpoint string
 for deadline:=time.Now().Add(15*time.Second);time.Now().Before(deadline);{
  raw,e:=os.ReadFile(filepath.Join(dir,"DevToolsActivePort"));if e==nil{lines:=strings.Split(strings.TrimSpace(string(raw)),"\n");if len(lines)==2{endpoint="ws://127.0.0.1:"+strings.TrimSpace(lines[0])+strings.TrimSpace(lines[1]);break}}
  time.Sleep(100*time.Millisecond)
 }
 if endpoint==""{panic("browser DevTools startup timed out")}
 result.root=rod.New().ControlURL(endpoint);if err=result.root.Connect();err!=nil{panic(err)}
 result.session,err=result.root.Incognito();if err!=nil{panic(err)}
 raw,err:=cookies.NewLoadCookie(cookies.GetCookiesFilePath()).LoadCookies()
 if err==nil {var saved []*proto.NetworkCookie;if err=json.Unmarshal(raw,&saved);err!=nil{panic("invalid encrypted cookies")};result.session.MustSetCookies(saved...)} else if !os.IsNotExist(err){panic("saved credentials unavailable")}
 return result
}
