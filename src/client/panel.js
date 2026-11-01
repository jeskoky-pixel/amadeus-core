const {createElement:h,useState,useEffect}=require('react');
const {createPortal}=require('react-dom');
const CSS=`.amadeus-core-shell{font:14px/1.6 system-ui,sans-serif;min-width:0;color:var(--dsw-alias-label-primary,#213c37)}
.amadeus-core-shell>header{border-bottom:1px solid #78978d44;padding:8px 0 18px;margin-bottom:18px}
.amadeus-core-shell>header h2{margin:0 auto 0 0;letter-spacing:-.5px}.amadeus-core-shell>nav button,.amadeus-core-shell>header button,.amadeus-core-shell>main>div>button{font:inherit;color:inherit;border:1px solid #78978d55;border-radius:10px;background:transparent;padding:7px 13px;cursor:pointer}
.amadeus-core-shell>nav button[aria-pressed=true]{color:white;background:#287861;border-color:#287861}
.amadeus-core-shell [role=alert]{padding:12px;border-radius:10px;background:#c8434320;color:#b64b42}
.amadeus-core-shell>main>div>article{padding:16px;margin:12px 0;border:1px solid #78978d44;border-radius:14px;overflow-wrap:anywhere}
.amadeus-core-shell select{font:inherit;color:inherit;padding:8px;border:1px solid #78978d55;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff)}
.core-overlay{position:fixed;inset:0;background:#14251e77;z-index:9999;display:grid;place-items:center;padding:3vh 3vw}
.core-dialog{width:min(1440px,94vw);height:94vh;overflow:auto;padding:22px 30px;border-radius:22px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 25px 80px #0004}
.core-close{float:right;position:sticky;top:0;z-index:2;border:1px solid #78978d55;border-radius:9px;padding:7px 12px;cursor:pointer;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit}
.core-extension button{font:inherit;color:inherit;border:1px solid #78978d55;background:#438c7010;border-radius:9px;padding:8px 13px;margin:5px;cursor:pointer}.core-extension button:hover{background:#438c7028}.core-extension button[aria-pressed=true]{background:#287861;color:white}.core-extension button:disabled{opacity:.45;cursor:not-allowed}.core-extension fieldset{border:1px solid #78978d44;border-radius:12px;margin:16px 0;padding:12px}.core-extension legend{padding:0 8px;font-weight:600}.core-extension label{display:inline-flex;align-items:center;gap:8px;margin:8px 12px 8px 0;flex-wrap:wrap}.core-extension input:not([type=checkbox]),.core-extension textarea{font:inherit;color:inherit;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid #78978d66;border-radius:8px;padding:9px;max-width:100%}.core-extension input[type=number]{width:105px}.core-extension textarea{display:block;width:min(700px,100%);min-height:90px}.core-extension pre{max-height:260px;overflow:auto;white-space:pre-wrap;background:#78978d12;padding:12px;border-radius:10px}.core-extension article{padding:18px;border:1px solid #78978d44;border-radius:14px;margin:14px 0}.core-extension a{color:#287861}.core-extension input[type=checkbox]{accent-color:#287861}.core-extension p{color:inherit;opacity:.85}
@media(prefers-color-scheme:dark){.amadeus-core-shell{color:var(--dsw-alias-label-primary,#dceae3)}.core-dialog{background:var(--dsw-alias-bg-layer-1,#192722)}}`;
const ROOT='/api/amadeus-core';
async function api(path,body){const r=await fetch(ROOT+path,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'content-type':'application/json','x-amadeus-core':'1'}:{},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Request failed');return j.data;}
function forms(){const cache=new Map();return {whileServed:(_keys,fn)=>fn(),get(id){
 const key=String(id).replace(/^amadeus-/,'').replace('dsh-mneme','memory');
 if(cache.has(key))return cache.get(key);
 let snapshot={status:'loading',writable:false},listeners=new Set();
 const notify=()=>listeners.forEach(fn=>fn());
 const refresh=async()=>{try{snapshot=await api('/forms/'+key)}catch(e){snapshot={status:'unavailable',writable:false,error:e.message}}notify()};
 const form={getSnapshot:()=>snapshot,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},mutate:async(ops,revision)=>{try{snapshot=await api('/forms/'+key,{ops,revision});notify();return true}catch(e){await refresh();throw e}},refresh};
 cache.set(key,form);refresh();return form;
}};}
const tabs=[['overview','总览','Overview'],['persona','人格','Persona'],['memory','记忆','Memory'],['state','状态','State'],['life','生活','Life'],['platforms','平台','Platforms'],['mcp','MCP','MCP'],['experiences','经历','Experiences'],['settings','设置','Settings']];
function CorePanel({ctx,views}){
 const [tab,setTab]=useState('overview'),[status,setStatus]=useState(null),[error,setError]=useState(''),[workspace,setWorkspace]=useState(''),[busy,setBusy]=useState(false),[english,setEnglish]=useState(false);
 const [sources,setSources]=useState({memory:'',life:'',state:'',persona:''}),[offlineConfirmed,setOfflineConfirmed]=useState(false);
 const refresh=()=>api('/status').then(setStatus).catch(e=>setError(e.message));
 useEffect(()=>{refresh()},[]);
 useEffect(()=>{if(status?.workspaceId)setWorkspace(status.workspaceId)},[status?.workspaceId]);
 async function action(fn){setBusy(true);setError('');try{await fn();await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const t=(zh,en)=>english?en:zh;
 let content;
 if(tab==='mcp')content=h(McpPanel,{state:status?.mcp,sessions:status?.sessions??[],refresh,t});
 else if(['memory','state','life'].includes(tab))content=status?.modules?.[tab]?.mounted?views[tab]?.():h('p',null,t('请先选择工作区并应用配置，或启用此模块。','Choose a workspace and apply configuration, or enable this module.'));
 else if(tab==='persona')content=status?.modules?.persona?.mounted?h('iframe',{title:'Amadeus Persona',src:'/api/amadeus-persona/console',style:{width:'100%',height:'72vh',border:0,borderRadius:14}}):h('p',null,t('请启用人格模块。','Enable the Persona module.'));
 else if(tab==='platforms')content=h(PlatformPanel,{status,refresh,t});
 else if(tab==='experiences')content=h('div',null,h('h2',null,t('经历时间线','Experience timeline')),h('p',null,t('当前仅支持模拟证据；没有访问真实平台。','Simulation evidence only; no live platform access.')),...(status?.experiences??[]).map(e=>h('article',{key:e.eventId},h('strong',null,e.platform),h('p',null,`${e.occurredAt} · ${e.status}`),h('code',null,e.eventId))));
 else if(tab==='settings')content=h('div',null,h('h2',null,t('唯一工作区与模块','Workspace and modules')),
  h('select',{'aria-label':'Core Workspace',value:workspace,onChange:e=>setWorkspace(e.target.value)},h('option',{value:''},t('选择 DSH Workspace','Choose DSH Workspace')),...(status?.workspaces??[]).map(w=>h('option',{key:w.id,value:w.id},w.title||w.id))),
  h('button',{disabled:busy||!workspace,onClick:()=>action(()=>api('/configure',{revision:status.revision,workspaceId:workspace}))},t('保存工作区','Save workspace')),
  h('button',{disabled:busy||status?.status!=='ready',onClick:()=>action(()=>api('/simulate',{}))},t('运行两个模拟平台的只读验收','Run two simulated read-only platforms')),
  h('button',{disabled:busy||status?.status!=='ready',onClick:()=>action(()=>api('/prepare-exploration',{}))},t('准备持久活动会话','Prepare persistent Activity Session')),
  h('label',{style:{display:'block'}},h('input',{type:'checkbox',checked:status?.explorationEnabled===true,disabled:busy,onChange:e=>action(()=>api('/configure',{revision:status.revision,explorationEnabled:e.target.checked}))}),t('允许活动会话自主选择模拟平台读取（默认关闭）','Allow Activity Session to choose simulated platform reads (off by default)')),
  h('p',null,t('仅在上面的持久活动会话中生效。可以通过 Life 配置唤醒机会，或在 DSH 中打开该会话交谈；不会自动创建第二套调度。当前平台均为模拟。','Only the persistent Activity Session may use these tools. Configure wake opportunities in Life or open this Session in DSH. Core adds no second scheduler. All platforms are simulated.')),
  h('code',null,status?.activity?.sessionId??''),
  h('label',{style:{display:'block'}},t('单次活动总时限（秒，包含模型思考；下次活动生效）','Activity wall-clock limit (seconds, including model thinking; next activity)'),h('input',{type:'number',min:10,max:300,key:status?.activityBudgetMs,defaultValue:(status?.activityBudgetMs??120000)/1000,onBlur:e=>{const value=Number(e.target.value)*1000;if(value!==status.activityBudgetMs)action(()=>api('/configure',{revision:status.revision,activityBudgetMs:value}));}})),
  h('p',null,t('活动状态：','Activity state: ')+(status?.activity?.phase??'Idle')),
  h('button',{disabled:busy||status?.activity?.phase!=='Paused',onClick:()=>action(()=>api('/activity',{action:'resume'}))},t('在原预算内恢复活动','Resume within original budget')),
  h('button',{disabled:busy||status?.activity?.phase==='Idle',onClick:()=>action(()=>api('/activity',{action:'finish'}))},t('安全结束当前活动','Safely finish current activity')),
  ...Object.entries(status?.modules??{}).map(([name,value])=>h('label',{key:name,style:{display:'block',padding:'8px'}},h('input',{type:'checkbox',checked:value.enabled,disabled:busy,onChange:e=>action(()=>api('/configure',{revision:status.revision,module:name,enabled:e.target.checked}))}),name)),
  h('p',null,t('Life 配置保存后需应用；State 配置保存后实时生效。应用时拒绝中断活动模型回合。','Apply Life changes; State changes take effect live. Applying refuses to interrupt active model turns.')),
  h('h3',null,t('从原四插件导入','Import the four original modules')),
  h('p',null,t('导入外部旧数据前，请在当前 DSH 保留四个已停用的旧插件条目及原配置，并确保数据路径与下方目录一致（支持已核实版本的默认路径）。缺少可核实配置时会拒绝导入，避免丢失原设置。','Keep the four disabled legacy plugin entries and their configuration in this DSH Profile. Their resolved data paths, including verified released defaults, must match the directories below. Import refuses missing or mismatched configuration.')),
  h('p',null,t('保留原目录，先生成一致性快照，再切换到独立数据副本。四个来源必须绑定当前同一个 Workspace；不会合并两套历史。','Preserve source directories, snapshot consistently, then activate a separate copy. All sources must share this Workspace; histories are not merged.')),
  ...Object.keys(sources).map(name=>h('label',{key:name,style:{display:'block',margin:'10px 0'}},name+' ',h('input',{'aria-label':'Import '+name,value:sources[name],placeholder:t('原插件数据目录绝对路径','Absolute source data directory'),style:{width:'85%',padding:8},onChange:e=>setSources({...sources,[name]:e.target.value})}))),
  h('label',null,h('input',{type:'checkbox',checked:offlineConfirmed,onChange:e=>setOfflineConfirmed(e.target.checked)}),t('我已停用原四插件，并关闭其他可能写入这些目录的 DSH 实例。','I disabled the four old plugins and closed other DSH instances writing these directories.')),
  h('button',{disabled:busy||!offlineConfirmed||Object.values(sources).some(x=>!x.trim()),onClick:()=>action(()=>api('/import',{revision:status.revision,sources,offlineConfirmed}))},t('备份并导入','Back up and import')),
  status?.canRollback?h('button',{disabled:busy,onClick:()=>action(()=>api('/rollback',{revision:status.revision}))},t('恢复前一个数据代（不删除数据）','Restore previous data generation (keep all data)')):null);
 else content=h('div',null,h('h2',null,'Amadeus Core'),h('p',null,t('一个身份，持续的记忆、状态与生活。','One identity, continuous memory, state and life.')),h('p',null,`${status?.status??'loading'} · v${status?.version??'0.1.0-alpha.1'}`),h('p',null,status?.workspaceId?t('工作区已绑定','Workspace bound'):t('首次使用：前往设置选择工作区。','First use: select a workspace in Settings.')),
  ...Object.entries(status?.modules??{}).map(([name,m])=>h('span',{key:name,style:{display:'inline-block',margin:'8px',padding:'12px',border:'1px solid #8a9d9a55',borderRadius:12}},`${name}: ${m.mounted?t('运行中','running'):t('未挂载','inactive')}`)));
 return h('section',{className:'amadeus-core-shell'},h('style',null,CSS),
 h('header',{style:{display:'flex',gap:12,alignItems:'center'}},h('h2',null,'Amadeus Core'),h('button',{onClick:()=>setEnglish(!english)},english?'中文':'English'),h('button',{onClick:refresh},t('刷新','Refresh'))),
 h('nav',{style:{display:'flex',flexWrap:'wrap',gap:6,marginBottom:18}},...tabs.map(([id,zh,en])=>h('button',{key:id,'aria-pressed':tab===id,onClick:()=>setTab(id)},english?en:zh))),
 error||status?.problem?h('div',{role:'alert'},error||status.problem):null,
 status?.pendingRestart?h('div',{style:{padding:12,border:'1px solid #8a9d9a55',marginBottom:12}},t('保存的配置尚未应用。','Saved configuration is not active yet.'),h('button',{disabled:busy,onClick:()=>action(()=>api('/apply',{}))},t('应用配置','Apply configuration'))):null,
 h('main',null,content));
}
function CoreLauncher({ctx,views}){
 const [open,setOpen]=useState(false);
 useEffect(()=>{if(!open)return;const old=document.activeElement,fn=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',fn);return()=>{document.removeEventListener('keydown',fn);old?.focus?.()}},[open]);
 return h('div',null,h('button',{type:'button',onClick:()=>setOpen(true),style:{font:'inherit',padding:'8px 12px',borderRadius:10,border:'1px solid #78978d55',background:'transparent',color:'inherit'}},'Amadeus Core'),open?createPortal(h('div',{className:'core-overlay'},h('style',null,CSS),h('div',{className:'core-dialog',role:'dialog','aria-modal':true,'aria-label':'Amadeus Core'},h('button',{className:'core-close',onClick:()=>setOpen(false)},'关闭 / Close'),h(CorePanel,{ctx,views}))),document.body):null);
}
return {inject:['slots','locale','configForms'],apply(ctx){
 const views={},configForms=forms();
 for(const [n,module] of Object.entries(modules)){
  const slots={inject:(name,fn)=>name==='settings.section'||(n==='memory'&&!['sidebar.footer.action'].includes(name))?fn():()=>{},register:(spec,render)=>{
   if(spec.name==='settings.section'){views[n]=()=>h(render,{});return()=>{delete views[n]}};
   if(n==='memory'&&!['plugins.detail.section','plugins.row.config','sidebar.footer.action'].includes(spec.name))return ctx.slots.register(spec,render);
   return()=>{};
  }};
  const scoped=new Proxy(ctx,{get:(target,key)=>key==='slots'?slots:key==='configForms'?configForms:Reflect.get(target,key)});
  module.apply(scoped);
  if(n==='memory')views.memory=()=>module.coreView(scoped);
 }
 ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'amadeus-core',order:23,label:()=> 'Amadeus Core'},()=>h(CorePanel,{ctx,views})));
 ctx.slots.inject('sidebar.footer.action',()=>ctx.slots.register({name:'sidebar.footer.action',id:'amadeus-core',order:5,label:()=> 'Amadeus Core'},()=>h(CoreLauncher,{ctx,views})));
}};
