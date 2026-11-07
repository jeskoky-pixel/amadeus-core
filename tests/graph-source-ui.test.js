import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/modules/memory/lib/client.js',import.meta.url),'utf8');
const nodes=tree=>tree&&typeof tree==='object'?[tree,...(tree.children??[]).flatMap(nodes)]:[];
function explorer(fetch){
 let loaded,si=0,ri=0;const states=[],refs=[];
 const react={Fragment:'fragment',createElement:(type,props,...children)=>({type,props:props??{},children:children.flat(Infinity)}),
  useState(initial){const i=si++;if(!(i in states))states[i]=i===0?'entity':typeof initial==='function'?initial():initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},
  useRef(v){return refs[ri++]??=( {current:v} );},useEffect(){},useCallback:fn=>fn,useMemo:fn=>fn()};
 const doc={hidden:false,addEventListener(){},removeEventListener(){},querySelector(){return null;},createElement(){return{dataset:{},style:{}}},head:{appendChild(){}}};
 const context={__DSH_MNEME_TEST__:true,window:{__ModuleLoader__:{load:v=>loaded=v},localStorage:{getItem:()=> 'panel-token-must-not-authorize-owner-read'},addEventListener(){},removeEventListener(){}},document:doc,navigator:{language:'zh-CN'},setTimeout,clearTimeout,setInterval,clearInterval,console,URL,fetch};
 vm.runInNewContext(source.replace('configFormTransition, workspaceCardModel,','MemoryExplorer, configFormTransition, workspaceCardModel,'),context);
 const module=loaded.factory(()=>react),render=()=>{si=0;ri=0;return module.__test.MemoryExplorer({ctx:{},t:k=>k});};
 const jump=nodes(render()).find(n=>n.type?.name==='EntityPanel')?.props.onJumpMemory;
 assert.equal(typeof jump,'function');return{jump,render};
}

test('graph source outside loaded pages fetches the full archived row through Owner auth',async()=>{
 const calls=[],row={id:'source-qa',title:'Archived source fact',content:'Actual source text',type:'history',archived:true,created_at:'2026-01-01T00:00:00Z'};
 const ui=explorer(async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({ok:true,data:row})}});
 await ui.jump({id:row.id});
 const drawer=nodes(ui.render()).find(n=>n.type?.name==='MemoryDrawer');assert.ok(drawer);assert.equal(drawer.props.memory.content,row.content);assert.equal(drawer.props.memory.title,row.title);
 assert.equal(calls[0].url,'/api/amadeus-memory/admin/memory?id=source-qa');assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.headers['x-amadeus-memory'],'1');assert.equal(calls[0].options.headers.Authorization,undefined);
});

test('denied or missing source displays its real error and never an ID-only drawer',async()=>{
 for(const[status,key]of[[403,'sourceDenied'],[404,'sourceMissing'],[500,'sourceError']]){
  const ui=explorer(async()=>({ok:false,status}));await ui.jump({id:'unreadable-source'});const tree=nodes(ui.render());
  assert.equal(tree.some(n=>n.type?.name==='MemoryDrawer'),false);assert.ok(tree.some(n=>n.props.role==='alert'&&n.children.includes('memory.graph.'+key)));
 }
});
