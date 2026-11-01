function PlatformPanel({status,refresh,t}){
 const [selected,setSelected]=useState('simulation-bilibili'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[operation,setOperation]=useState('read'),[text,setText]=useState('模拟测试内容'),[target,setTarget]=useState('synthetic-user');
 const platforms=status?.simulations??[],p=platforms.find(p=>p.id===selected),social=['like','favorite','comment','reply','follow','message','publish'];
 const labels={browse:'推荐',search:'搜索',read:'读取',comments:'评论区',related:'相关内容',subtitles:'字幕 / 分镜占位',images:'图片描述',like:'点赞',favorite:'收藏',comment:'评论',reply:'回复',follow:'关注',message:'私信',publish:'发布'};
 async function action(fn){setBusy(true);setError('');try{await fn();await refresh();}catch(e){setError(e.message);await refresh();}finally{setBusy(false);}}
 const save=patch=>action(()=>api('/platform/configure',{revision:status.revision,id:p.id,config:{enabled:p.enabled,permissions:p.permissions,maxRequests:p.maxRequests,...patch}}));
 return h('div',{className:'core-extension'},h('h2',null,t('独立平台系统 · 模拟环境','Platform system · simulation')),
  h('p',null,t('未登录真实账号。以下内容、图片描述和社会操作均为合成数据；不会读取 Cookie、联网或真实外发。平台权限与 MCP 权限互不继承。','No real accounts. Content, image descriptions and social operations are synthetic. No cookies, network or external sends. Platform and MCP permissions are separate.')),
  h('nav',null,...platforms.map(item=>h('button',{key:item.id,'aria-pressed':selected===item.id,onClick:()=>{setSelected(item.id);setOperation('read');}},item.id.endsWith('bilibili')?'Bilibili':'小红书'))),
  p?h('article',null,h('h3',null,p.id),h('p',null,t('账号：未登录 · 接入：Mock · 真实能力：尚未实现','Account: not logged in · Adapter: Mock · Live integration: not implemented')),
   h('label',null,h('input',{type:'checkbox',checked:p.enabled,disabled:busy,onChange:e=>save({enabled:e.target.checked})}),t('启用此模拟平台','Enable this mock platform')),
   h('p',null,`${t('今日使用 / 上限：','Today / maximum: ')}${p.used}/${p.maxRequests}`),
   h('label',null,t('每日上限 ','Daily maximum '),h('input',{type:'number',min:1,max:1000,key:p.id+'-'+p.maxRequests,defaultValue:p.maxRequests,disabled:busy,onBlur:e=>{if(Number(e.target.value)!==p.maxRequests)save({maxRequests:Number(e.target.value)});}})),
   ...[false,true].map(writes=>h('fieldset',{key:String(writes)},h('legend',null,writes?t('社会操作（仅 Dry-run，默认关闭）','Social operations (dry-run only; off by default)'):t('浏览能力','Reading capabilities')),
    ...p.capabilities.filter(op=>social.includes(op)===writes).map(op=>h('label',{key:op,style:{display:'inline-block',margin:10}},h('input',{type:'checkbox',checked:p.permissions.includes(op),disabled:busy,onChange:e=>save({permissions:e.target.checked?[...p.permissions,op]:p.permissions.filter(v=>v!==op)})}),t(labels[op]??op,op))))),
   h('h3',null,t('受控模拟调用','Controlled simulated call')),h('select',{value:operation,onChange:e=>setOperation(e.target.value)},...p.capabilities.map(op=>h('option',{key:op,value:op},t(labels[op]??op,op)))),
   h('label',null,t('文本 / 搜索词 ','Text / search '),h('input',{value:text,onChange:e=>setText(e.target.value)})),h('label',null,t('模拟目标 ','Synthetic target '),h('input',{value:target,onChange:e=>setTarget(e.target.value)})),
   h('button',{disabled:busy,onClick:()=>action(()=>api('/platform/dry-run',{id:p.id,operation,input:{id:'robot-demo',query:text,text,target}}))},t('调用权限路由（不外发）','Run through permissions (no external send)')),
   h('p',null,t('被拒绝的调用不会执行平台动作。如活动暂停，可在设置中安全结束，然后继续测试。','Denied calls execute no platform action. If paused, safely finish in Settings before another test.'))):null,
  error?h('p',{role:'alert'},error):null);
}
