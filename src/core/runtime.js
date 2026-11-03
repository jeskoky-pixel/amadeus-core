import path from 'node:path';
import * as memory from '../modules/memory/src/index.js';
import * as life from '../modules/life/src/index.js';
import * as state from '../modules/state/src/index.js';
import * as persona from '../modules/persona/src/index.js';
import { Config as MemoryConfig } from '../modules/memory/src/config.js';
import { CONFIG_FIELDS as lifeFields } from '../modules/life/src/config-fields.js';
import { CONFIG_FIELDS as stateFields } from '../modules/state/src/config-fields.js';
import { setWorkspaceBinding } from '../modules/memory/src/workspace-binding.js';
import { CoreStore, MODULES, atomicJson } from './store.js';
import { acquireLease, legacyConflicts, installLegacyGuard } from './ownership.js';
import { host, member, assertIdle } from './host.js';
import { AccountManager } from '../platforms/accounts.js';
import {makeXhsNativeAdapter} from '../platforms/xhs-native-adapter.js';
import {socialPolicy} from '../platforms/social-journal.js';
import {BrowserVault} from '../platforms/browser-vault.js';
import {makeBilibiliAdapter} from '../platforms/bilibili.js';
import {makeXiaohongshuAdapter} from '../platforms/xiaohongshu.js';
import {createPlatformTransport} from '../platforms/transport.js';
import { PlatformRegistry, makeSimulatedAdapter } from '../platforms/registry.js';
import { Experiences } from './experiences.js';
import { CoreActivity } from './activity.js';
import { importData, rollbackData } from './import-data.js';
import { finish } from './model-exploration.js';
import { McpManager } from '../mcp/manager.js';
import {makeBilibiliMock,makeXiaohongshuMock} from '../platforms/mock-platforms.js';

const definitions = { memory, life, state, persona };
const fields = { life: lifeFields, state: stateFields };
// Structural fields exposed by the retained Memory GUI. Feature switches use
// Memory's existing override store; paths and Core policy are never form-owned.
const memoryFormFields = ['language', 'dreamThresholdCount', 'dreamThresholdChars',
  'dreamDelayMs', 'sleepIdleMinutes', 'maxInjectedItems', 'importanceThreshold',
  'injectContentMaxChars', 'injectRotationTurns', 'vectorSearchTopK',
  'vectorSearchThreshold', 'hybridSearchVectorWeight', 'autoReindexOnBoot'];
const memoryPolicy = Object.freeze({ sceneIsolationEnabled: true, sceneStrictQQ: true,
  unifiedSessionAclEnabled: true, personaEnabled: false });
function formValue(value) {
  // Schemastery volatile values are runtime refs, not JSON field values.
  if(value && typeof value.get==='function' && Symbol.for('cosmokit.volatile.write') in value)return formValue(value.get());
  if(Array.isArray(value))return value.map(formValue);
  if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,formValue(child)]));
  return value;
}
export class CoreRuntime {
  constructor(ctx, root) {
    this.ctx = ctx; this.root = root; this.store = new CoreStore(root);
    this.handles = new Map(); this.bridges = {}; this.status = 'starting'; this.problem = null;
    this.activeConfigs={};
    this.runningRevision = null; this.tail = Promise.resolve();
    this.accounts=new AccountManager({file:path.join(root,'platform-accounts.json'),workspaceId:()=>this.store.state.workspaceId});
    const real=[makeXhsNativeAdapter({root:path.join(root,'xhs-executor'),workspaceId:()=>this.store.state.workspaceId}),makeBilibiliAdapter({vault:process.platform==='win32'?new BrowserVault({root:path.join(root,'bilibili-vault'),workspaceId:()=>this.store.state.workspaceId}):null}),makeXiaohongshuAdapter({transport:createPlatformTransport({allowedOrigins:['https://openaccount.xiaohongshu.com']})})];
    this.platforms=new PlatformRegistry({budgetFile:path.join(root,'platform-budget.json'),journalFile:path.join(root,'platform-actions.json'),trustedRealAdapters:real,accounts:this.accounts,authorizeIdentity:identity=>member(this.ctx,this.store.state.workspaceId===identity?.workspaceId?identity.workspaceId:null,identity?.sessionId)});
    for(const adapter of real){this.accounts.register(adapter);this.platforms.register(adapter);}
    this.platforms.register(makeBilibiliMock());this.platforms.register(makeXiaohongshuMock());
    this.experiences=new Experiences(this);this.activity=new CoreActivity(this);
    this.mcp=new McpManager(this);
  }
  serial(fn) { const next = this.tail.then(fn, fn); this.tail = next.catch(() => {}); return next; }
  async start() {
    try {
      const conflicts = legacyConflicts(host(this.ctx, 'configEditor'));
      if (conflicts.length) throw Error('CORE_STANDALONE_CONFLICT: ' + conflicts.join(', '));
      this.release = acquireLease(this.root);
      this.removeLegacyGuard=installLegacyGuard(this.ctx,()=>!!this.release);
      await this.mount();
      await this.mcp.start();
      await this.accounts.restore();
      this.accounts.start();
    } catch (e) { this.status = 'blocked'; this.ctx.logger?.error?.('Core mount failed', this.mountingModule, e); atomicJson(path.join(this.root,'last-error.private.json'),{module:this.mountingModule,message:e.message,stack:e.stack}); this.problem = 'CORE_MOUNT_FAILED: ' + (this.mountingModule ?? 'runtime'); await this.stopModules(); }
  }
  async stopModules() {
    for (const handle of [...this.handles.values()].reverse()) await handle.dispose();
    this.handles.clear(); this.bridges = {}; this.activeConfigs={}; this.runningRevision = null;
  }
  async mount() {
    const settings = this.store.snapshot();
    if (!settings.workspaceId) { this.status = 'unconfigured'; return; }
    if (!host(this.ctx, 'workspaceRegistry')?.get(settings.workspaceId)) throw Error('CORE_WORKSPACE_MISSING');
    const conflicts = legacyConflicts(host(this.ctx, 'configEditor'));
    if (conflicts.length) throw Error('CORE_STANDALONE_CONFLICT');
    const generation=settings.dataGeneration;
    if(generation && !/^[a-f0-9-]{36}$/.test(generation))throw Error('CORE_GENERATION_INVALID');
    const moduleRoot=path.toNamespacedPath(generation?path.join(this.root,'generations',generation,'live'):this.root);
    const memoryDir = path.join(moduleRoot, 'memory');
    if (settings.modules.memory.enabled) { const binding = setWorkspaceBinding({ memoryDir, ctx: this.ctx, workspaceId: settings.workspaceId }); if (!binding.ok) throw Error('CORE_MEMORY_BINDING_FAILED: '+binding.reason); }
    for (const n of ['persona', 'memory', 'life', 'state']) {
      if (!settings.modules[n].enabled) continue;
      const module = definitions[n];
      const config = { ...this.effectiveConfig(n), __coreBridge: bridge => { this.bridges[n] = bridge; } };
      if (n === 'memory') Object.assign(config, { memoryDir, ...memoryPolicy });
      if (n === 'life') config.__coreSessionTitle = id => id === this.store.state.activitySessionId ? 'Amadeus 自主活动' : host(this.ctx, 'sessions')?.get(id)?.header?.title ?? '';
      if (n === 'life' || n === 'state') config.databasePath = path.join(moduleRoot, n, `${n}.sqlite`);
      if (n === 'persona') config.dataDirectory = path.join(moduleRoot, 'persona');
      this.activeConfigs[n]=config;
      const plugin = { name: module.name, inject: module.inject, apply: child => {
        // A module may only enumerate/bind the single Core Workspace. Other
        // services remain inherited; this override exists only in its child scope.
        const registry=host(this.ctx,'workspaceRegistry');
        const scoped=child.isolate('workspaceRegistry');
        scoped.provide('workspaceRegistry', {
          get: id => id===settings.workspaceId ? registry.get(id) : undefined,
          list: () => { const w=registry.get(settings.workspaceId); return w?[w]:[]; }
        });
        return module.apply(scoped, config);
      } };
      this.mountingModule = n; const handle = this.ctx.plugin(plugin); this.handles.set(n, handle); await handle;
      const bridge = this.bridges[n];
      if (!bridge) throw Error(`CORE_MODULE_UNAVAILABLE: ${n}`);
      const bound=n==='persona'?bridge.store.requireState().workspaceId:
        n==='life'?bridge.api.getWorkspaceView().binding?.workspaceId:
        n==='state'?bridge.service.binding()?.workspaceId:settings.workspaceId;
      if(bound&&bound!==settings.workspaceId)throw Error('CORE_MODULE_WORKSPACE_MISMATCH');
      // Binding an already-bound module mutates revision/timestamps. Preserve
      // existing binding metadata on restart and when restoring a data snapshot.
      if(!bound){
        if(n==='persona')await bridge.service.bindWorkspace(bridge.store.requireState().revision,settings.workspaceId);
        if(n==='life')bridge.api.bindWorkspace({workspaceId:settings.workspaceId});
        if(n==='state')bridge.service.bindWorkspace({workspaceId:settings.workspaceId});
      }
    }
    this.status = 'ready'; this.problem = null; this.runningRevision = settings.revision;
    this.bridges.life?.api.registerActivityProvider(this.activity);
    await this.activity.recover();
    if(this.store.state.explorationEnabled&&this.bridges.life?.api&&this.bridges.memory?.unifiedRuntime)await this.activity.session();
    this.configureExplorationPlatforms();
  }
  configureExplorationPlatforms(){
    for(const {id,simulated,social} of this.platforms.list()){const config=this.store.snapshot().platforms[id]??{enabled:simulated&&this.store.state.explorationEnabled===true,permissions:simulated?['read','search','browse']:[],maxRequests:20};if(social)config.social={...config.social,sessionIds:this.store.state.activitySessionId?[this.store.state.activitySessionId]:[]};this.platforms.configure(id,config);}
  }
  savePlatform(input){return Promise.resolve().then(()=>{
    const wasApplied=this.runningRevision===this.store.state.revision;
    const entry=this.platforms.entries.get(input.id),c=input.config;
    if(!entry||!c||(c.autonomous!==undefined&&typeof c.autonomous!=='boolean')||(c.minIntervalMs!==undefined&&(!Number.isSafeInteger(c.minIntervalMs)||c.minIntervalMs<0||c.minIntervalMs>3600000))||typeof c.enabled!=='boolean'||!Array.isArray(c.permissions)||c.permissions.some(p=>!entry.adapter.capabilities.includes(p))||!Number.isSafeInteger(c.maxRequests)||c.maxRequests<1||c.maxRequests>1000)throw Error('CORE_PLATFORM_CONFIG');
    const social=socialPolicy(c.social);
    this.store.update(input.revision,s=>{s.platforms[input.id]={enabled:c.enabled,permissions:[...new Set(c.permissions)],maxRequests:c.maxRequests,autonomous:c.autonomous??entry.adapter.simulated===true,minIntervalMs:c.minIntervalMs??0,social};});
    this.configureExplorationPlatforms();if(wasApplied)this.runningRevision=this.store.state.revision;return this.overview();
  });}
  dryRunPlatform(input){return this.serial(async()=>{
    if(this.status!=='ready')throw Error('CORE_NOT_READY');
    if(!this.platforms.entries.get(input.id)?.adapter.simulated)throw Error('CORE_PLATFORM_DENIED');
    const session=await this.activity.session();
    return this.activity.explore(({step})=>step===0?{platform:input.id,operation:input.operation,input:input.input}:null,{maxSteps:1});
  });}
  platformRead(input){return this.serial(async()=>{
    if(this.status!=='ready')throw Error('CORE_NOT_READY');
    if(!['read','browse','search','comments','related','subtitles','images'].includes(input.operation))throw Error('CORE_PLATFORM_DENIED');
    return this.activity.explore(({step})=>step===0?{platform:input.id,operation:input.operation,input:input.input}:null,{maxSteps:1});
  });}
  platformAction(input){return this.serial(async()=>{
    if(this.status!=='ready')throw Error('CORE_NOT_READY');
    if(this.platforms.entries.get(input.id)?.adapter.socialWrites!==true||!['like','comment','reply'].includes(input.operation))throw Error('CORE_PLATFORM_DENIED');
    return this.activity.explore(({step})=>step===0?{platform:input.id,operation:input.operation,input:input.input}:null,{maxSteps:1,maxDurationMs:30000});
  });}
  async accountAction(input){
    if(!['logout','revoke','clear'].includes(input.action)&&this.status!=='ready')throw Error('CORE_NOT_READY');
    const id=input.id;if(!['bilibili','xiaohongshu','xiaohongshu-browser'].includes(id))throw Error('CORE_PLATFORM_INPUT');
    // Do not queue revocation behind an active network call. Epoch checks discard in-flight results.
    if(['begin','logout','revoke','clear'].includes(input.action)){
      const wasApplied=this.runningRevision===this.store.state.revision;
      this.store.update(input.revision,s=>{s.platforms[id]={enabled:false,permissions:[],maxRequests:s.platforms[id]?.maxRequests??20};});
      this.platforms.configure(id,this.store.state.platforms[id]);
      if(wasApplied)this.runningRevision=this.store.state.revision;
    }
    switch(input.action){
      case 'begin':return this.accounts.begin(id,input.options);
      case 'poll':return this.accounts.poll(id,input.loginId);
      case 'save-login':return this.accounts.saveLogin(id,input.options);
      case 'clear-login':return this.accounts.clearLogin(id);
      case 'verify':return this.accounts.verify(id);
      case 'refresh':return this.accounts.verify(id,{refresh:true});
      case 'logout':return this.accounts.logout(id);
      case 'clear':await this.accounts.clearSession(id);return this.accounts.logout(id,{clear:true});
      case 'revoke':return this.accounts.revoke(id);
      default:throw Error('CORE_PLATFORM_INPUT');
    }
  }
  prepareExploration(){return this.serial(async()=>{
    if(this.status!=='ready')throw Error('CORE_NOT_READY');
    const session=await this.activity.session();this.configureExplorationPlatforms();return {sessionId:session.id};
  });}
  effectiveConfig(n) {
    if (!MODULES.includes(n)) throw Error('CORE_MODULE_INVALID');
    const saved = this.store.state.modules[n].config;
    if (n === 'memory') {
      const validated = MemoryConfig({ autoInject: true, autoSummarize: false, autoDream: false, ...saved, ...memoryPolicy });
      return validated;
    }
    const defaults = Object.fromEntries((fields[n] ?? []).map(f => [f.key, f.default]));
    return { ...defaults, ...saved };
  }
  form(n) {
    if(n!=='memory'&&!fields[n])throw Error('CORE_MODULE_INVALID');
    return { status: 'ready', writable: true, revision: this.store.state.revision,
      value: formValue(this.effectiveConfig(n)), pendingRestart: this.runningRevision !== this.store.state.revision };
  }
  async saveForm(n, ops, revision) {
    if ((n!=='memory'&&!fields[n]) || !Array.isArray(ops) || ops.length > 200) throw Error('CORE_CONFIG_INVALID');
    return this.serial(async () => {
    const allowed = new Set(n==='memory'?memoryFormFields:fields[n].map(f => f.key).filter(key=>key!=='databasePath'));
    const next = structuredClone(this.store.state.modules[n].config);
    for (const op of ops) {
      if (!op || !Array.isArray(op.path) || op.path.length !== 1 || !allowed.has(op.path[0])) throw Error('CORE_CONFIG_INVALID');
      if (op.op === 'set') next[op.path[0]] = op.value;
      else if (op.op === 'unset') delete next[op.path[0]];
      else throw Error('CORE_CONFIG_INVALID');
    }
    const result = (n==='memory'?MemoryConfig:definitions[n].Config)['~standard'].validate(n==='memory'?{...next,...memoryPolicy}:next);
    if (result.issues) throw Error('CORE_CONFIG_INVALID');
      const wasApplied=this.runningRevision===this.store.state.revision;
      this.store.update(revision, s => { s.modules[n].config = next; });
      if(n==='state'&&this.activeConfigs.state){
        const effective=this.effectiveConfig(n);delete effective.databasePath;
        Object.assign(this.activeConfigs.state,effective);
        if(wasApplied)this.runningRevision=this.store.state.revision;
      }
      // Keep saved and active state explicit; the Owner applies changes at a safe boundary.
      return this.form(n);
    });
  }
  configure(input) {
    return this.serial(async () => {
      const wasApplied=this.runningRevision===this.store.state.revision;
      if (input.workspaceId !== undefined && !host(this.ctx, 'workspaceRegistry')?.get(input.workspaceId)) throw Error('CORE_WORKSPACE_MISSING');
      if (input.workspaceId && this.store.state.workspaceId && input.workspaceId !== this.store.state.workspaceId) throw Error('CORE_WORKSPACE_CHANGE_REQUIRES_MIGRATION');
      this.store.update(input.revision, s => {
        if (input.workspaceId) s.workspaceId = input.workspaceId;
        if(input.explorationEnabled!==undefined){
          if(typeof input.explorationEnabled!=='boolean')throw Error('CORE_CONFIG_INVALID');
          s.explorationEnabled=input.explorationEnabled;
        }
        if(input.activityBudgetMs!==undefined){
          if(!Number.isSafeInteger(input.activityBudgetMs)||input.activityBudgetMs<10000||input.activityBudgetMs>300000)throw Error('CORE_CONFIG_INVALID');
          s.activityBudgetMs=input.activityBudgetMs;
        }
        if (input.module !== undefined) {
          if (!MODULES.includes(input.module) || typeof input.enabled !== 'boolean') throw Error('CORE_MODULE_INVALID');
          s.modules[input.module].enabled = input.enabled;
        }
      });
      if(input.explorationEnabled!==undefined)this.configureExplorationPlatforms();
      if((input.explorationEnabled!==undefined||input.activityBudgetMs!==undefined)&&wasApplied&&input.module===undefined&&input.workspaceId===undefined)this.runningRevision=this.store.state.revision;
      return this.overview();
    });
  }
  applyChanges() {
    return this.serial(async () => {
      if (!this.release) throw Error('CORE_BLOCKED');
      assertIdle(this.ctx,this.store.state.workspaceId);
      if(this.activity.busy||['Exploring','Deliberating','Paused'].includes(this.activity.saved.phase))throw Error('CORE_ACTIVITY_BUSY');
      this.status = 'restarting';
      await this.stopModules();
      try { await this.mount(); } catch (e) { this.status = 'blocked'; this.ctx.logger?.error?.('Core mount failed', this.mountingModule, e); atomicJson(path.join(this.root,'last-error.private.json'),{module:this.mountingModule,message:e.message,stack:e.stack}); this.problem = 'CORE_MOUNT_FAILED: ' + (this.mountingModule ?? 'runtime'); await this.stopModules(); throw e; }
      return this.overview();
    });
  }
  overview() {
    return { version: '0.2.0-alpha.6', status: this.status, problem: this.problem,
      workspaceId: this.store.state.workspaceId, revision: this.store.state.revision,
      runningRevision: this.runningRevision, pendingRestart: this.store.state.revision !== this.runningRevision,
      modules: Object.fromEntries(MODULES.map(n => [n, { enabled: this.store.state.modules[n].enabled, mounted: this.handles.has(n) }])),
      workspaces: (host(this.ctx, 'workspaceRegistry')?.list?.() ?? []).map(w => ({ id: w.id, title: w.title })),
      platforms:this.platforms.list().filter(p=>!p.simulated),
      simulations:this.platforms.list().filter(p=>p.simulated),activity:this.activity.summary(),experiences:this.experiences.ownerList(),
      explorationEnabled:this.store.state.explorationEnabled===true,
      activityBudgetMs:this.store.state.activityBudgetMs??120000,
      mcp:this.mcp.overview(),
      sessions:(host(this.ctx,'workspaceRegistry')?.get(this.store.state.workspaceId)?.sessionIds??[]).map(id=>{
        const s=host(this.ctx,'sessions')?.get(id);return {id,title:s?.header?.title??id};
      }),
      dataGeneration:this.store.state.dataGeneration??'original',canRollback:Object.hasOwn(this.store.state,'previousDataGeneration'),
    };
  }
  api() { return Object.freeze({ contractVersion: 1, getHealth: () => this.overview(),
    assertSession: id => member(this.ctx, this.store.state.workspaceId, id),
    readExperience:(eventId,sessionId)=>this.experiences.read(eventId,sessionId) }); }
  simulate(){return this.serial(async()=>{
    if(this.status!=='ready')throw Error('CORE_NOT_READY');
    if(this.activity.busy||(this.activity.saved.last?.mode==='model'&&this.activity.saved.phase!=='Idle'))throw Error('CORE_ACTIVITY_BUSY');
    const ids=this.platforms.list().filter(p=>p.simulated).map(p=>p.id);
    for(const id of ids)this.platforms.configure(id,{enabled:true,permissions:['read'],maxRequests:20});
    try{return await this.activity.explore(({step})=>step<ids.length?{platform:ids[step],operation:'read',input:{id:'robot-demo'}}:null);}
    finally{this.configureExplorationPlatforms();}
  });}
  controlActivity(action){return this.serial(async()=>{
    if(!['resume','finish'].includes(action))throw Error('CORE_ACTIVITY_INPUT');
    if(this.status!=='ready'||!this.bridges.life?.api)throw Error('CORE_NOT_READY');
    assertIdle(this.ctx,this.store.state.workspaceId);
    const sessionId=this.store.state.activitySessionId;
    member(this.ctx,this.store.state.workspaceId,sessionId);
    if(action==='finish')return finish(this,sessionId);
    if(!this.store.state.explorationEnabled)throw Error('CORE_EXPLORATION_DISABLED');
    const last=this.activity.saved.last;
    if(this.activity.busy||this.activity.saved.phase!=='Paused'||last?.mode!=='model')throw Error('CORE_ACTIVITY_RESUME_REQUIRED');
    return this.bridges.life.api.resumeActivity(last.activityId,`session:${sessionId}`);
  });}
  importData(input){return this.serial(()=>importData(this,input));}
  rollbackData(input){return this.serial(()=>rollbackData(this,input));}
  async dispose() { this.status='stopping';await this.accounts.dispose();await this.mcp.dispose();await this.tail; await this.stopModules(); this.release?.(); this.release = null; this.removeLegacyGuard?.();this.status = 'stopped'; }
}
