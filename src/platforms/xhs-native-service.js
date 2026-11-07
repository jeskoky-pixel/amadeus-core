import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {createHash} from 'node:crypto';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {XhsServiceSupervisor,XHS_SERVICE_VERSION} from './xhs-service-supervisor.js';
import {XhsLocalClient} from './xhs-local-client.js';
const run=promisify(execFile);
const fail=code=>{throw Error('CORE_PLATFORM_'+code);};
// Only newly owned executor directories, never existing module/Profile roots.
async function privateDirectory(dir){
 fs.mkdirSync(dir,{recursive:true});
 if(fs.lstatSync(dir).isSymbolicLink())fail('STORAGE_PATH');
 const ps=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
 await run(ps,['-NoProfile','-NonInteractive','-Command',`$ErrorActionPreference='Stop'; $d=$env:AMADEUS_PRIVATE_DIRECTORY; $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User; $acl=[Security.AccessControl.DirectorySecurity]::new(); $acl.SetAccessRuleProtection($true,$false); foreach($s in @($sid,([Security.Principal.SecurityIdentifier]::new('S-1-5-18')))){ $rule=[Security.AccessControl.FileSystemAccessRule]::new($s,'FullControl','ContainerInherit,ObjectInherit','None','Allow'); $acl.AddAccessRule($rule) }; [IO.Directory]::SetAccessControl($d,$acl)`],{windowsHide:true,timeout:15000,env:{...process.env,AMADEUS_PRIVATE_DIRECTORY:dir}});
}
export async function createNativeService({root,workspaceId,artifactRoot=path.resolve(import.meta.dirname,'../../lib/xhs')}){
 if(process.platform!=='win32')fail('NATIVE_WINDOWS_REQUIRED');
 const manifestFile=path.join(artifactRoot,'executor.json');if(!fs.existsSync(manifestFile))fail('NATIVE_PACKAGE_MISSING');
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 if(manifest.version!==XHS_SERVICE_VERSION||!/^[a-f0-9]{64}$/.test(manifest.sha256))fail('NATIVE_PACKAGE_INVALID');
 const executable=path.join(artifactRoot,'amadeus-xhs-executor.exe');
 let token=null,client=null,cookiesPath=null;
 const supervisor=new XhsServiceSupervisor({workspaceId,root,executable,expectedSha256:manifest.sha256,
  hashFile:async file=>createHash('sha256').update(await fs.promises.readFile(file)).digest('hex'),
  allocatePort:()=>new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(error=>error?reject(error):resolve(port));});}),
  spawnProcess:async config=>{
   await privateDirectory(root);await privateDirectory(path.dirname(config.env.COOKIES_PATH));
   token=config.env.AUTH_TOKEN;cookiesPath=config.env.COOKIES_PATH;
   client=new XhsLocalClient({origin:`http://127.0.0.1:${config.port}`,token:()=>token,timeoutMs:45000});
   const child=spawn(config.executable,config.args,{cwd:root,env:{...process.env,...config.env,AMADEUS_HOST_PIPE:'1'},windowsHide:true,stdio:['pipe','ignore','ignore']});
   await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});return {pid:child.pid,child};
  },
  health:async({origin,signal})=>{for(let n=0;n<40;n++){signal.throwIfAborted();try{const response=await fetch(origin+'/health',{signal,redirect:'error'});const body=await response.json();if(response.ok&&body.success)return {version:body.data.version};}catch{signal.throwIfAborted();}await new Promise(resolve=>setTimeout(resolve,100));}fail('NATIVE_START_FAILED');},
  stopTree:async({child})=>{if(child.exitCode!==null||child.signalCode!==null)return;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('CORE_PLATFORM_NATIVE_STOP_FAILED')),5000);child.once('exit',()=>{clearTimeout(timer);resolve();});child.kill();});token=null;},
  sleep:ms=>new Promise(resolve=>setTimeout(resolve,ms)),healthTimeoutMs:6000,
 });
 await supervisor.start();
 return {supervisor,client,get cookiesPath(){return cookiesPath;},stop:()=>supervisor.stop()};
}
