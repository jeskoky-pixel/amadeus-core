import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { atomicJson } from './store.js';
import {verifiedObservation} from '../platforms/registry.js';
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
    const trusted=verifiedObservation(observation);
    if(!platform.startsWith('simulation-')&&(!trusted||trusted.platform!==platform||trusted.operation!==operation||trusted.sessionId!==sessionId||trusted.workspaceId!==workspaceId||trusted.activityId!==activityId))throw Error('CORE_EXPERIENCE_UNTRUSTED');
    const evidenceLevel=trusted?.evidenceLevel??'simulation';
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
      const observed=observation?.observedEvidence;
      const item=observed?.item;
      const sourceUrl=typeof (item?.sourceUrl??observed?.sourceUrl)==='string'?(item?.sourceUrl??observed.sourceUrl):null;
      entry={contentId:item?.id??observed?.contentId??null,sourceUrl,observationSummary:typeof item?.title==='string'?item.title.slice(0,500):`${operation}: returned evidence only`,modelInterpretation:null,permissionScope:'session',eventId,workspaceId,sessionId,activityId,platform,operation,step,dataGeneration,occurredAt:new Date().toISOString(),status:'pending',memoryId:null,evidenceLevel,accountId:trusted?.accountId??null};
      this.state.events.push(entry);this.save();
    }
    // Evidence comes from the registry's private receipt ledger, never model fields.
    const event={...entry,evidenceLevel,visibility:'session',facts:observation,
      interpretation:null,actionReceipt:{kind:evidenceLevel,externalAction:trusted?.externalAction===true}};
    const saved=await memory.unifiedRuntime.authorize.run(session,()=>memory.service.saveWithDedupe({
      id:eventId,type:'history',title:`${evidenceLevel}: ${platform} ${operation}`,
      content:JSON.stringify(event),importance:3,tags:['amadeus-experience',evidenceLevel],
      evidence:[{kind:evidenceLevel==='simulation'?'simulated-platform':evidenceLevel==='live-action'?'platform-action':'platform-read',ref:eventId}]
    }));
    if(!saved?.memory?.id) throw Error('CORE_EXPERIENCE_MEMORY_REJECTED');
    member(r.ctx,workspaceId,sessionId);
    entry.memoryId=saved.memory.id;entry.status='stored';this.save();
    const state=r.bridges.state?.service;
    if(state&&['read','browse','search','comments','related','subtitles','images'].includes(operation)){
      try{
        const effective=state.effectiveForSession(sessionId);state.requireAccess(effective,'write');
        const result=await state.recordEvent({identity:effective.identity,type:'exploration_completed',source:'host',trust:evidenceLevel==='simulation'?'simulation':'bounded',
          summary:`${evidenceLevel}: ${platform} ${operation}; only returned evidence was observed; no visual understanding claimed.`,
          idempotencyKey:`core:${eventId}`,sourceRef:eventId,evidence:[`${evidenceLevel}:${eventId}`],
          topic:evidenceLevel==='simulation'?'模拟平台探索':'平台只读探索',interestDelta:0.5,scale:0.1,originSessionId:sessionId,occurredAt:entry.occurredAt});
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
