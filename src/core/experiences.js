import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { atomicJson } from './store.js';
import { member } from './host.js';

// Host-only facade. It is not a model tool or a writable HTTP endpoint.
// The journal holds receipt/index data; Memory remains the reader authorization boundary.
export class Experiences {
  constructor(runtime) {
    this.runtime = runtime;
    this.file = path.join(runtime.root,'experiences.json');
    this.state = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file,'utf8')) : {schema:1,events:[]};
    if(this.state.schema!==1 || !Array.isArray(this.state.events)) throw Error('CORE_EXPERIENCE_SCHEMA');
  }
  save() { atomicJson(this.file,this.state); }
  async record({platform,activityId,sessionId,operation,observation,step}) {
    const r=this.runtime, workspaceId=r.store.state.workspaceId;
    const session=member(r.ctx,workspaceId,sessionId), memory=r.bridges.memory;
    if(!memory?.unifiedRuntime) throw Error('CORE_MEMORY_UNAVAILABLE');
    if(typeof platform!=='string'||typeof activityId!=='string'||!Number.isSafeInteger(step)) throw Error('CORE_EXPERIENCE_INVALID');
    const text=JSON.stringify(observation);
    if(!text || Buffer.byteLength(text)>65536) throw Error('CORE_EXPERIENCE_LIMIT');
    const dataGeneration=r.store.state.dataGeneration??'original';
    const key=[workspaceId,sessionId,activityId,platform,step];
    if(dataGeneration!=='original')key.push(dataGeneration);
    const eventId='experience_'+createHash('sha256').update(JSON.stringify(key)).digest('hex');
    let entry=this.state.events.find(e=>e.eventId===eventId);
    if(entry?.status==='stored') return structuredClone(entry);
    if(!entry) {
      if(this.state.events.length>=10000) throw Error('CORE_EXPERIENCE_CAPACITY');
      entry={eventId,workspaceId,sessionId,activityId,platform,operation,step,dataGeneration,occurredAt:new Date().toISOString(),status:'pending',memoryId:null};
      this.state.events.push(entry);this.save();
    }
    // All current adapters are simulations. Do not let fixture content assert a real action.
    const event={...entry,evidenceLevel:'simulation',visibility:'session',facts:observation,
      interpretation:null,actionReceipt:{kind:'simulation',externalAction:false}};
    const saved=await memory.unifiedRuntime.authorize.run(session,()=>memory.service.saveWithDedupe({
      id:eventId,type:'history',title:`Simulation: ${platform} ${operation}`,
      content:JSON.stringify(event),importance:3,tags:['amadeus-experience','simulation'],
      evidence:[{kind:'simulated-platform',ref:eventId}]
    }));
    if(!saved?.memory?.id) throw Error('CORE_EXPERIENCE_MEMORY_REJECTED');
    member(r.ctx,workspaceId,sessionId);
    entry.memoryId=saved.memory.id;entry.status='stored';this.save();
    const state=r.bridges.state?.service;
    if(state&&['read','browse','search','comments','related','subtitles','images'].includes(operation)){
      try{
        const effective=state.effectiveForSession(sessionId);state.requireAccess(effective,'write');
        const result=await state.recordEvent({identity:effective.identity,type:'exploration_completed',source:'host',trust:'simulation',
          summary:`Synthetic platform exploration: ${platform} ${operation}; no real platform accessed.`,
          idempotencyKey:`core:${eventId}`,sourceRef:eventId,evidence:[`simulation:${eventId}`],
          topic:'模拟平台探索',interestDelta:0.5,scale:0.1,originSessionId:sessionId,occurredAt:entry.occurredAt});
        entry.stateEffect=result.duplicate?'duplicate':'applied';
      }catch{entry.stateEffect='unavailable-or-denied';}
      this.save();
    }
    return structuredClone(entry);
  }
  read(eventId,sessionId) {
    const r=this.runtime, session=member(r.ctx,r.store.state.workspaceId,sessionId), m=r.bridges.memory;
    const generation=r.store.state.dataGeneration??'original';
    const event=this.state.events.find(e=>e.eventId===eventId && e.status==='stored'&&(e.dataGeneration??'original')===generation);
    if(!event||!m?.unifiedRuntime) throw Error('CORE_EXPERIENCE_DENIED');
    const row=m.unifiedRuntime.authorize.run(session,()=>m.store.getById(event.memoryId));
    if(!row) throw Error('CORE_EXPERIENCE_DENIED');
    m.unifiedRuntime.authorize.delivery(session,[row],'tool');
    return {event:structuredClone(event),memory:row};
  }
  // Owner admission is performed by the Core HTTP handler, never by model parameters.
  ownerList() {const generation=this.runtime.store.state.dataGeneration??'original';return this.state.events.filter(e=>(e.dataGeneration??'original')===generation).slice(-100).reverse().map(e=>structuredClone(e));}
}
