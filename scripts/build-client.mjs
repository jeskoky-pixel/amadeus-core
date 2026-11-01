import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const sources = { memory: 'lib/client.js', life: 'lib/client.js', state: 'lib/client.js', persona: 'src/client.js' };
const factories = [];
for (const [n, file] of Object.entries(sources)) {
  let source = fs.readFileSync(path.join(root, 'src/modules', n, file), 'utf8');
  if (n === 'memory') source = source.replace('exports.apply = apply;', 'exports.coreView = (ctx) => h(MemoryExplorer, {ctx, t: ctx.locale.bind(NS)});\n    exports.apply = apply;');
  factories.push(`${JSON.stringify(n)}: (()=>{let descriptor; const loader={load:x=>{descriptor=x}}; const window = new Proxy(globalThis.window,{get:(target,key)=>{if(key==='__ModuleLoader__')return loader;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}});\n${source}\nreturn descriptor.factory(require);})()`);
}
const panel = ['mcp-panel.js','platform-panel.js','panel.js'].map(f=>fs.readFileSync(path.join(root,'src/client',f),'utf8')).join('\n');
fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
fs.writeFileSync(path.join(root, 'lib/client.js'), `window.__ModuleLoader__.load({id:'@fg-lab/amadeus-core',factory:(require)=>{\nconst modules={${factories.join(',\n')}};\n${panel}\n}});\n`);
console.log('One Core loader entry built from retained module views.');
