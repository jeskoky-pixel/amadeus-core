//go:build windows

package browser
import (
 "fmt"
 "os/exec"
 "strings"
 "syscall"
 "sync"
 "unsafe"
 "golang.org/x/sys/windows"
)
func hideCommand(cmd *exec.Cmd){cmd.SysProcAttr=&syscall.SysProcAttr{HideWindow:true}}
type ownedProcess struct {job windows.Handle;process windows.Handle;once sync.Once}
func(p *ownedProcess)Close(){p.once.Do(func(){if p.job!=0{windows.CloseHandle(p.job)};if p.process!=0{windows.WaitForSingleObject(p.process,5000);windows.CloseHandle(p.process)}})}
func launchOwned(binary string,args []string)(*ownedProcess,error){
 job,err:=windows.CreateJobObject(nil,nil);if err!=nil{return nil,err}
 limits:=windows.JOBOBJECT_EXTENDED_LIMIT_INFORMATION{};limits.BasicLimitInformation.LimitFlags=windows.JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
 if _,err=windows.SetInformationJobObject(job,windows.JobObjectExtendedLimitInformation,uintptr(unsafe.Pointer(&limits)),uint32(unsafe.Sizeof(limits)));err!=nil{windows.CloseHandle(job);return nil,err}
 quoted:=[]string{syscall.EscapeArg(binary)};for _,arg:=range args{quoted=append(quoted,syscall.EscapeArg(arg))}
 command,_:=windows.UTF16PtrFromString(strings.Join(quoted," "));app,_:=windows.UTF16PtrFromString(binary)
 si:=windows.StartupInfo{Cb:uint32(unsafe.Sizeof(windows.StartupInfo{})),Flags:windows.STARTF_USESHOWWINDOW,ShowWindow:windows.SW_HIDE};var pi windows.ProcessInformation
 if err=windows.CreateProcess(app,command,nil,nil,false,windows.CREATE_SUSPENDED|windows.CREATE_UNICODE_ENVIRONMENT,nil,nil,&si,&pi);err!=nil{windows.CloseHandle(job);return nil,err}
 defer windows.CloseHandle(pi.Thread)
 if err=windows.AssignProcessToJobObject(job,pi.Process);err!=nil{windows.TerminateProcess(pi.Process,1);windows.CloseHandle(pi.Process);windows.CloseHandle(job);return nil,fmt.Errorf("browser job assignment failed: %w",err)}
 if _,err=windows.ResumeThread(pi.Thread);err!=nil{windows.CloseHandle(job);windows.CloseHandle(pi.Process);return nil,err}
 return &ownedProcess{job:job,process:pi.Process},nil
}
