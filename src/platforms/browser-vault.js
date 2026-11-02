import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {atomicJson} from '../core/store.js';

// Windows CurrentUser DPAPI; plaintext travels only through child stdin/stdout,
// never command arguments, environment, logs or regular configuration files.
export function protectWindows(bytes, decrypt=false){
 if(process.platform!=='win32')return Promise.reject(Error('CORE_PLATFORM_SECURE_STORAGE_UNAVAILABLE'));
 const script=`Add-Type -AssemblyName System.Security; $b=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $r=[Security.Cryptography.ProtectedData]::${decrypt?'Unprotect':'Protect'}($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($r))`;
 return new Promise((resolve,reject)=>{
  const child=spawn(path.join(process.env.SystemRoot??'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  const chunks=[];let size=0,done=false;const fail=()=>{if(!done){done=true;clearTimeout(timer);child.kill();reject(Error('CORE_PLATFORM_SECURE_STORAGE_FAILED'));}};
  const timer=setTimeout(fail,15000);child.on('error',fail);child.stderr.on('data',()=>{});child.stdout.on('data',b=>{size+=b.length;if(size>8*1024*1024)fail();else chunks.push(b);});child.on('close',code=>{if(done)return;if(code!==0)return fail();done=true;clearTimeout(timer);resolve(Buffer.from(Buffer.concat(chunks).toString().trim(),'base64'));});child.stdin.on('error',fail);child.stdin.end(Buffer.from(bytes).toString('base64'));
 });
}
export class BrowserVault {
 constructor({root,workspaceId,codec=protectWindows}){this.root=root;this.workspaceId=workspaceId;this.codec=codec;this.epoch=0;}
 file(kind='session'){const workspace=this.workspaceId();if(typeof workspace!=='string'||!workspace)throw Error('CORE_PLATFORM_WORKSPACE_REQUIRED');if(!['session','login'].includes(kind))throw Error('CORE_PLATFORM_INPUT');return path.join(this.root,createHash('sha256').update(workspace).digest('hex')+'-'+kind+'.json');}
 has(kind='session'){try{return fs.existsSync(this.file(kind));}catch{return false;}}
 async save(value,kind='session'){const epoch=this.epoch,file=this.file(kind),plain=Buffer.from(JSON.stringify(value));if(plain.length>4*1024*1024)throw Error('CORE_PLATFORM_STORAGE_LIMIT');const sealed=await this.codec(plain,false);if(epoch!==this.epoch||file!==this.file(kind))throw Error('CORE_PLATFORM_REVOKED');atomicJson(file,{schema:1,protection:'windows-current-user-dpapi',data:sealed.toString('base64')});}
 async read(kind='session'){const file=this.file(kind);if(!fs.existsSync(file))return null;const raw=JSON.parse(fs.readFileSync(file,'utf8'));if(raw.schema!==1||raw.protection!=='windows-current-user-dpapi'||typeof raw.data!=='string'||raw.data.length>8*1024*1024)throw Error('CORE_PLATFORM_STORAGE_INVALID');const result=await this.codec(Buffer.from(raw.data,'base64'),true);if(file!==this.file(kind))throw Error('CORE_PLATFORM_REVOKED');return JSON.parse(result.toString());}
 clear(kind='session'){this.epoch++;const file=this.file(kind);if(fs.existsSync(file))fs.unlinkSync(file);}
}
