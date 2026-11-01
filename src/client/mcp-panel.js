function McpPanel({state,sessions,refresh,t}){
 const [draft,setDraft]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[tab,setTab]=useState('servers'),[search,setSearch]=useState(''),[secret,setSecret]=useState(''),[editRevision,setEditRevision]=useState(state?.revision);
 const blank=()=>({id:'server-'+Math.random().toString(36).slice(2,8),name:'',transport:'streamable-http',url:'',enabled:false,timeoutMs:10000,dailyBudget:100,sessionIds:[],sessionTypes:[],tools:{}});
 const mutate=(k,v)=>setDraft(d=>({...d,[k]:v}));
 async function action(fn){setBusy(true);setError('');try{await fn();await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 const servers=state?.servers??[],selected=servers.find(s=>s.id===draft?.id),discovered=selected?.discovered??[];
 return h('div',{className:'core-extension'},h('h2',null,t('MCP 管理中心','MCP Manager')),
  h('p',null,t('独立于平台账号。连接不等于授权：每个工具默认关闭。外部描述与输出不可信。','Independent of platform accounts. Connection grants no tool access. External descriptions and outputs are untrusted.')),
  h('button',{onClick:()=>setTab('servers')},t('服务器','Servers')),h('button',{onClick:()=>setTab('catalog')},t('服务目录','Catalog')),
  error?h('p',{role:'alert'},error):null,
  tab==='catalog'?h('article',null,h('input',{'aria-label':'Search MCP catalog',value:search,onChange:e=>setSearch(e.target.value),placeholder:t('搜索服务','Search services')}),
   /filesystem|文件|^$/i.test(search)?h('div',null,h('h3',null,t('文件系统 MCP（本地）','Filesystem MCP (local)')),h('p',null,t('Model Context Protocol 官方参考服务。需要先自行安装；Core 不运行安装脚本。可能读取或写入所选目录，请逐项授权。','Official MCP reference service. Install separately; Core runs no installation scripts. Review directory access and each tool.')),
    h('a',{href:'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',target:'_blank',rel:'noreferrer'},t('来源与安装说明','Source and installation guide')),
    h('button',{onClick:()=>{setEditRevision(state.revision);setDraft({...blank(),name:'Filesystem',transport:'stdio',command:'',args:[]});setTab('servers');}},t('配置本地服务（未部署）','Configure local service (not deployed)'))):h('p',null,t('没有匹配项，可添加自定义 MCP。','No matches. Add a custom MCP server.'))):
  h('div',null,h('button',{disabled:busy,onClick:()=>{setEditRevision(state.revision);setDraft(blank());setSecret('');}},t('添加自定义 MCP','Add custom MCP')),
   ...servers.map(s=>h('article',{key:s.id},h('h3',null,s.name),h('p',null,`${s.status} · ${s.transport} · ${s.discovered.length} tools · ${s.used}/${s.dailyBudget}`),s.error?h('p',null,s.error):null,
    h('button',{disabled:busy,onClick:()=>{const {status,error,used,discovered,...config}=s;setEditRevision(state.revision);setDraft(structuredClone(config));setSecret('');}},t('设置与工具授权','Settings and tool permissions')),
    h('button',{disabled:busy||!s.enabled,onClick:()=>action(()=>api('/mcp/connect',{id:s.id}))},t('测试连接 / 重新连接','Test / reconnect')),
    h('button',{disabled:busy,onClick:()=>action(async()=>{const {status,error,used,discovered,...config}=s;await api('/mcp/save',{revision:state.revision,server:{...config,enabled:!s.enabled}});})},s.enabled?t('停用','Disable'):t('启用','Enable')),
    h('button',{disabled:busy,onClick:()=>{if(window.confirm(t('移除此服务？保留已有调用记录。','Remove this server? Existing call records are retained.')))action(()=>api('/mcp/remove',{id:s.id,revision:state.revision}));}},t('移除','Remove')))),
   draft?h('article',null,h('h3',null,t('连接配置','Connection configuration')),
    h('label',null,t('名称 ','Name '),h('input',{value:draft.name,onChange:e=>mutate('name',e.target.value)})),
    h('label',null,' Transport ',h('select',{value:draft.transport,onChange:e=>{const transport=e.target.value;setDraft(d=>{const n={...d,transport};if(transport==='stdio'){delete n.url;delete n.credentialRef;n.command='';n.args=[];}else{delete n.command;delete n.args;delete n.cwd;delete n.envRefs;n.url='';}return n;});}},h('option',{value:'stdio'},'stdio'),h('option',{value:'streamable-http'},'Streamable HTTP'))),
    draft.transport==='stdio'?h('div',null,h('label',null,t('可执行文件绝对路径 ','Executable absolute path '),h('input',{value:draft.command??'',onChange:e=>mutate('command',e.target.value)})),h('p',null,t('不使用 shell，不自动安装。只填写已信任、已安装的程序；参数每行一项。','No shell or automatic installation. Choose an installed, trusted program; one argument per line.')),
      h('textarea',{'aria-label':'MCP arguments',value:(draft.args??[]).join('\n'),onChange:e=>mutate('args',e.target.value.split('\n').filter(Boolean))}),
      h('label',null,t('环境变量（名称=凭据引用，每行一项）','Environment (NAME=credential reference, one per line)'),h('textarea',{'aria-label':'MCP environment references',value:Object.entries(draft.envRefs??{}).map(([k,v])=>k+'='+v).join('\n'),onChange:e=>mutate('envRefs',Object.fromEntries(e.target.value.split('\n').filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)];})))}))):
      h('label',null,' URL ',h('input',{value:draft.url??'',onChange:e=>mutate('url',e.target.value),placeholder:'https://your-server.example/mcp'})),
    h('p',null,t('凭据仅保存于此隔离/用户数据目录，列表不返回内容。HTTP 使用 Bearer；stdio 使用凭据引用映射。','Credentials stay in the data directory and are never returned in lists. HTTP uses Bearer; stdio uses environment references.')),
    h('input',{type:'password',autoComplete:'new-password',value:secret,onChange:e=>setSecret(e.target.value),'aria-label':'MCP credential'}),
    h('button',{disabled:busy||!secret,onClick:()=>action(async()=>{const result=await api('/mcp/secret',{value:secret});setSecret('');if(draft.transport==='streamable-http')mutate('credentialRef',result.reference);else mutate('envRefs',{...draft.envRefs,API_KEY:result.reference});})},t('保存凭据引用','Save credential reference')),
    draft.credentialRef?h('p',null,draft.credentialRef):null,
    h('label',null,t('超时毫秒 ','Timeout ms '),h('input',{type:'number',min:100,max:60000,value:draft.timeoutMs,onChange:e=>mutate('timeoutMs',Number(e.target.value))})),
    h('label',null,t('每日请求上限 ','Daily maximum '),h('input',{type:'number',min:1,max:10000,value:draft.dailyBudget,onChange:e=>mutate('dailyBudget',Number(e.target.value))})),
    h('label',null,h('input',{type:'checkbox',checked:draft.enabled,onChange:e=>mutate('enabled',e.target.checked)}),t('启用连接','Enable connection')),
    h('h3',null,t('授权范围（仅当前 Core Workspace）','Authorization (current Core Workspace only)')),
    ...[['ordinary','普通 DSH 会话'],['qq-group','QQ 群聊'],['qq-private','QQ 私聊']].map(([type,label])=>h('label',{key:type,style:{display:'block'}},h('input',{type:'checkbox',checked:draft.sessionTypes.includes(type),onChange:e=>mutate('sessionTypes',e.target.checked?[...draft.sessionTypes,type]:draft.sessionTypes.filter(v=>v!==type))}),t(label,type))),
    h('fieldset',null,h('legend',null,t('或选择具体会话（按可信 ID 授权）','Or choose Sessions (trusted IDs)')),
      ...sessions.map(s=>h('label',{key:s.id},h('input',{type:'checkbox',checked:draft.sessionIds.includes(s.id),onChange:e=>mutate('sessionIds',e.target.checked?[...draft.sessionIds,s.id]:draft.sessionIds.filter(id=>id!==s.id))}),s.title)),
      h('details',null,h('summary',null,t('高级：Session ID 列表','Advanced: Session IDs')),h('textarea',{'aria-label':'MCP Session IDs',value:draft.sessionIds.join('\n'),onChange:e=>mutate('sessionIds',e.target.value.split('\n').map(x=>x.trim()).filter(Boolean))}))),
    h('h3',null,t('工具（首次保存并连接后发现）','Tools (discovered after saving and connecting)')),
    ...discovered.map(tool=>{const g=draft.tools[tool.name]??{enabled:false,category:'write',allowSideEffects:false};const change=(k,v)=>mutate('tools',{...draft.tools,[tool.name]:{...g,[k]:v}});return h('article',{key:tool.name},h('strong',null,tool.name),h('p',null,tool.description),h('details',null,h('summary',null,t('参数 Schema（外部数据）','Parameter schema (external data)')),h('pre',null,JSON.stringify(tool.inputSchema,null,2))),
     h('label',null,h('input',{type:'checkbox',checked:g.enabled,onChange:e=>change('enabled',e.target.checked)}),t('授权此工具','Authorize this tool')),
     h('select',{value:g.category,onChange:e=>change('category',e.target.value)},h('option',{value:'read'},t('经管理员确认只读','Admin-confirmed read only')),h('option',{value:'write'},t('写入 / 外发','Write / send')),h('option',{value:'system'},t('系统操作','System operation'))),
     h('label',null,h('input',{type:'checkbox',checked:g.allowSideEffects,onChange:e=>change('allowSideEffects',e.target.checked)}),t('明确允许副作用','Explicitly allow side effects')));}),
    h('button',{disabled:busy,onClick:()=>action(async()=>{await api('/mcp/save',{revision:editRevision,server:draft});setDraft(null);})},t('保存','Save')),
    h('button',{disabled:busy,onClick:()=>{setDraft(null);setSecret('');}},t('撤销修改','Cancel edits'))):null));
}
