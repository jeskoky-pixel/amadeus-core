const {createElement:h,useState,useEffect,useRef}=require('react');
const {createPortal}=require('react-dom');
const CSS=`
.amadeus-core-shell{
 --core-accent:#0b7d5e;--core-accent-strong:#085e47;--core-accent-soft:#e6f5ef;--core-accent-line:#b9e0d0;
 --core-surface:var(--dsw-alias-bg-layer-1,#fff);
 --core-surface-2:var(--dsw-alias-bg-layer-2,#f5f8f6);
 --core-surface-3:var(--dsw-alias-bg-layer-3,#ecf2ef);
 --core-elevated:var(--dsw-alias-button-elevated-fill,#fff);
 --core-text:var(--dsw-alias-label-primary,#1c2b26);
 --core-muted:var(--dsw-alias-label-secondary,#63736d);
 --core-faint:var(--dsw-alias-label-tertiary,#87958f);
 --core-border:var(--dsw-alias-border-l2,var(--dsw-alias-border-secondary,#dce6e1));
 --core-border-strong:var(--dsw-alias-border-primary,#c5d6ce);
 --core-hover:var(--dsw-alias-interactive-bg-hover,#edf2ef);
 --core-active:var(--dsw-alias-interactive-bg-active,#e1e9e5);
 --core-danger:var(--dsw-alias-state-error-primary,#b53c44);
 --core-warn:var(--dsw-static-amber-600,#a66a12);
 --core-ok:var(--dsw-static-green-500,#1f9d6b);
 --core-radius:16px;
 --core-shadow:0 1px 2px #1931280a,0 12px 32px #1931280d;
 box-sizing:border-box;min-width:0;background:var(--core-surface);color:var(--core-text);
 font-family:inherit;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}
.amadeus-core-shell[data-core-theme=dark]{
 --core-accent:#63d6b0;--core-accent-strong:#8ce7c9;--core-accent-soft:#173a30;--core-accent-line:#2d5e4e;
 --core-surface:var(--dsw-alias-bg-layer-1,#18231f);
 --core-surface-2:var(--dsw-alias-bg-layer-2,#202c28);
 --core-surface-3:var(--dsw-alias-bg-layer-3,#283530);
 --core-elevated:var(--dsw-alias-button-elevated-fill,#202c28);
 --core-text:var(--dsw-alias-label-primary,#e8f1ed);
 --core-muted:var(--dsw-alias-label-secondary,#a7b7b1);
 --core-faint:var(--dsw-alias-label-tertiary,#81948d);
 --core-border:var(--dsw-alias-border-l2,var(--dsw-alias-border-secondary,#2f4039));
 --core-border-strong:var(--dsw-alias-border-primary,#41584e);
 --core-hover:var(--dsw-alias-interactive-bg-hover,#ffffff12);
 --core-active:var(--dsw-alias-interactive-bg-active,#ffffff1f);
 --core-shadow:0 1px 2px #0007,0 14px 38px #0004}
.amadeus-core-shell[data-core-theme=dark] .core-mark{background:linear-gradient(145deg,#0f8a68,#2f7fa0)}
.amadeus-core-shell[data-core-theme=dark] .core-btn--primary{color:#071a14}
.amadeus-core-shell[data-core-theme=dark] .core-btn--primary:hover:not(:disabled){color:#071a14}
.amadeus-core-shell[data-core-theme=dark] .core-extension button[aria-pressed=true]{color:#071a14}
.amadeus-core-shell *{box-sizing:border-box}
.amadeus-core-shell h2,.amadeus-core-shell h3,.amadeus-core-shell h4,.amadeus-core-shell p{margin-top:0}
.amadeus-core-shell h2{font-size:20px;line-height:1.25;letter-spacing:-.02em;margin:0}
.amadeus-core-shell h3{font-size:15px;line-height:1.35;letter-spacing:-.01em;margin:0}
.amadeus-core-shell h4{font-size:13px;line-height:1.4;margin:0 0 8px}
.amadeus-core-shell code,.amadeus-core-shell .core-mono{font-family:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',monospace;font-size:.92em}
.amadeus-core-shell a{color:var(--core-accent-strong);text-underline-offset:2px}
.amadeus-core-shell :where(button,input,select,textarea,summary,a):focus-visible{outline:2px solid var(--core-accent);outline-offset:2px}
.core-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:min(4vh,32px) min(4vw,40px);background:color-mix(in srgb,#0a1713 70%,transparent);backdrop-filter:blur(6px)}
.core-dialog{box-sizing:border-box;display:flex;flex-direction:column;width:min(1280px,100%);height:min(900px,92dvh);min-height:0;overflow:hidden;border:1px solid var(--dsw-alias-border-l2,#dfe9e4);border-radius:22px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1c2b26);box-shadow:0 32px 90px #07120d55,0 4px 18px #07120d2e}
.core-dialog .amadeus-core-shell{display:flex;flex-direction:column;height:100%;min-height:0;padding:20px 24px 0}
.amadeus-core-shell>.core-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex:none;padding:0 0 14px;border-bottom:1px solid var(--core-border)}
.core-brand{display:flex;align-items:center;gap:12px;min-width:0}
.core-mark{display:grid;place-items:center;flex:none;width:42px;height:42px;border-radius:13px;background:linear-gradient(145deg,var(--core-accent),#2f7fa0);color:#fff;font-size:18px;font-weight:800;letter-spacing:-.04em;box-shadow:0 8px 18px color-mix(in srgb,var(--core-accent) 28%,transparent)}
.core-brand-text{min-width:0}
.core-brand-text h2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.core-tagline{margin:3px 0 0!important;color:var(--core-muted);font-size:12px;line-height:1.4}
.core-header-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;flex:none}
.core-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:7px 13px;border:1px solid var(--core-border);border-radius:10px;background:var(--core-elevated);color:var(--core-text);font:inherit;font-size:13px;font-weight:600;line-height:1.2;white-space:nowrap;cursor:pointer;transition:background .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}
.core-btn:hover:not(:disabled){background:var(--core-hover);border-color:var(--core-border-strong)}
.core-btn:active:not(:disabled){background:var(--core-active);transform:translateY(1px)}
.core-btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.core-btn--ghost{background:transparent}
.core-btn--primary{border-color:var(--core-accent);background:var(--core-accent);color:#fff}
.core-btn--primary:hover:not(:disabled){border-color:var(--core-accent-strong);background:var(--core-accent-strong);color:#fff}
.core-btn--danger{color:var(--core-danger);border-color:color-mix(in srgb,var(--core-danger) 34%,var(--core-border))}
.core-btn--close{background:var(--core-surface-2);border-color:var(--core-border);margin-left:4px}
.core-tabs{display:flex;align-items:center;gap:4px;flex:none;padding:10px 0;overflow-x:auto;scrollbar-width:thin;border-bottom:1px solid var(--core-border)}
.core-tabs::-webkit-scrollbar{height:5px}
.core-tabs button{appearance:none;flex:none;border:1px solid transparent;border-radius:999px;padding:7px 13px;background:transparent;color:var(--core-muted);font:inherit;font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;transition:background .14s,color .14s,border-color .14s}
.core-tabs button:hover{background:var(--core-hover);color:var(--core-text)}
.core-tabs button[aria-pressed=true]{background:var(--core-accent-soft);border-color:var(--core-accent-line);color:var(--core-accent-strong)}
.core-alert{flex:none;margin:12px 0 0;padding:11px 14px;border:1px solid color-mix(in srgb,var(--core-danger) 30%,var(--core-border));border-radius:12px;background:color-mix(in srgb,var(--core-danger) 9%,var(--core-surface));color:var(--core-danger);font-size:13px;overflow-wrap:anywhere}
.core-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;flex:none;margin:12px 0 0;padding:11px 14px;border:1px solid color-mix(in srgb,var(--core-warn) 32%,var(--core-border));border-radius:12px;background:color-mix(in srgb,var(--core-warn) 8%,var(--core-surface));font-size:13px}
.core-banner .core-btn{flex:none}
.amadeus-core-shell>.core-main{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:18px 2px 26px;scrollbar-width:thin}
.amadeus-core-shell>.core-main::-webkit-scrollbar{width:8px}
.amadeus-core-shell>.core-main::-webkit-scrollbar-thumb{border-radius:8px;background:var(--dsw-alias-scrollbar-bg-l2,#cbd8d2)}
.core-main-persona,.core-main-memory{display:flex;flex-direction:column;overflow:hidden!important}
.core-main-persona{padding-bottom:18px!important}
.core-main-memory{padding-bottom:18px!important}
.core-main-memory>.mneme-x{flex:1;min-height:0;height:auto}
.core-overview{display:flex;flex-direction:column;gap:14px}
.core-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,330px);gap:20px;align-items:center;padding:22px 24px;border:1px solid var(--core-accent-line);border-radius:20px;background:linear-gradient(135deg,var(--core-accent-soft) 0%,var(--core-surface-2) 58%,var(--core-surface) 100%);box-shadow:var(--core-shadow);overflow:hidden}
.core-hero:after{content:'';position:absolute;right:-70px;top:-110px;width:280px;height:280px;border:1px solid var(--core-accent-line);border-radius:50%;pointer-events:none;opacity:.6}
.core-eyebrow{display:inline-flex;align-items:center;gap:7px;color:var(--core-accent-strong);font-size:10.5px;font-weight:800;letter-spacing:.14em}
.core-hero h2{font-size:24px;line-height:1.35;margin:9px 0 7px}
.core-hero p{margin:0;max-width:620px;color:var(--core-muted);font-size:13px}
.core-badges{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:14px}
.core-facts{display:grid;gap:0;margin:0;padding:14px 16px;border:1px solid var(--core-border);border-radius:15px;background:color-mix(in srgb,var(--core-surface) 78%,transparent);backdrop-filter:blur(4px);position:relative;z-index:1}
.core-fact{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--core-border);font-size:12px}
.core-fact:last-child{border-bottom:0}
.core-fact dt{flex:none;color:var(--core-muted)}
.core-fact dd{margin:0;min-width:0;text-align:right;font-weight:600;overflow-wrap:anywhere}
.core-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.core-stat{display:flex;flex-direction:column;gap:4px;min-width:0;padding:15px 16px;border:1px solid var(--core-border);border-radius:15px;background:var(--core-surface);box-shadow:0 1px 2px #19312808}
.core-stat-label{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--core-muted);font-size:12px;font-weight:600}
.core-stat-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--core-accent);box-shadow:0 0 0 3px var(--core-accent-soft)}
.core-stat-value{margin:3px 0 0;font-size:24px;line-height:1.2;font-weight:750;letter-spacing:-.03em;overflow-wrap:anywhere}
.core-stat-value--text{font-size:17px;line-height:1.35;letter-spacing:-.01em}
.core-stat-sub{color:var(--core-muted);font-size:11.5px;line-height:1.45;overflow-wrap:anywhere}
.core-card{min-width:0;padding:18px 19px;border:1px solid var(--core-border);border-radius:var(--core-radius);background:var(--core-surface);box-shadow:var(--core-shadow)}
.core-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:12px}
.core-card-head h2{font-size:16px}
.core-card-head h3{font-size:15px}
.core-card-sub{margin:4px 0 0!important;color:var(--core-muted);font-size:12px;line-height:1.55}
.core-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.core-module{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;padding:11px 12px;border:1px solid var(--core-border);border-radius:12px;background:var(--core-surface-2)}
.core-module-name{display:flex;align-items:baseline;gap:8px;min-width:0}
.core-module-name strong{font-size:13px;font-weight:650}
.core-module-name code{color:var(--core-faint);font-size:11px}
.core-badge{display:inline-flex;align-items:center;gap:5px;flex:none;padding:2px 8px;border:1px solid var(--core-border);border-radius:999px;background:var(--core-surface-3);color:var(--core-muted);font-size:11px;font-weight:650;line-height:1.6;white-space:nowrap}
.core-badge:before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.8}
.core-badge--ok{border-color:color-mix(in srgb,var(--core-ok) 32%,var(--core-border));background:color-mix(in srgb,var(--core-ok) 10%,var(--core-surface));color:color-mix(in srgb,var(--core-ok) 74%,var(--core-text))}
.core-badge--warn{border-color:color-mix(in srgb,var(--core-warn) 34%,var(--core-border));background:color-mix(in srgb,var(--core-warn) 10%,var(--core-surface));color:color-mix(in srgb,var(--core-warn) 76%,var(--core-text))}
.core-badge--danger{border-color:color-mix(in srgb,var(--core-danger) 34%,var(--core-border));background:color-mix(in srgb,var(--core-danger) 9%,var(--core-surface));color:var(--core-danger)}
.core-badge--accent{border-color:var(--core-accent-line);background:var(--core-accent-soft);color:var(--core-accent-strong)}
.core-badge--plain:before{display:none}
.core-settings{display:flex;flex-direction:column;gap:14px}
.core-fields{display:flex;flex-direction:column;min-width:0}
.core-field{display:grid;grid-template-columns:minmax(125px,190px) minmax(0,1fr);gap:7px 18px;align-items:center;min-width:0;padding:11px 0;border-bottom:1px solid var(--core-border)}
.core-field:last-child{border-bottom:0}
.core-field-label{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;min-width:0;color:var(--core-text);font-size:12.5px;font-weight:650;line-height:1.45}
.core-field-label code{color:var(--core-faint);font-size:10.5px;font-weight:500}
.core-field>small,.core-field-hint{grid-column:2;margin:0;color:var(--core-muted);font-size:11.5px;line-height:1.5}
.core-field>input,.core-field>select{width:100%;min-width:0}
.core-field--static>code{min-width:0;overflow-wrap:anywhere}
.core-input,.amadeus-core-shell .core-extension input:not([type=checkbox]):not([type=range]),.amadeus-core-shell .core-extension select,.amadeus-core-shell .core-extension textarea,.amadeus-core-shell>.core-main select{box-sizing:border-box;width:100%;min-height:36px;padding:8px 10px;border:1px solid var(--core-border);border-radius:9px;background:var(--core-surface-2);color:var(--core-text);font:inherit;font-size:13px;line-height:1.35;transition:border-color .14s,box-shadow .14s,background .14s}
.core-input:hover:not(:disabled),.amadeus-core-shell .core-extension input:not([type=checkbox]):hover:not(:disabled),.amadeus-core-shell .core-extension select:hover:not(:disabled),.amadeus-core-shell .core-extension textarea:hover:not(:disabled){border-color:var(--core-border-strong)}
.core-input:focus,.amadeus-core-shell .core-extension input:not([type=checkbox]):focus,.amadeus-core-shell .core-extension select:focus,.amadeus-core-shell .core-extension textarea:focus{border-color:var(--core-accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--core-accent) 16%,transparent)}
.core-input:disabled,.amadeus-core-shell .core-extension input:disabled,.amadeus-core-shell .core-extension select:disabled,.amadeus-core-shell .core-extension textarea:disabled{opacity:.5;cursor:not-allowed;background:var(--core-surface-3)}
.core-field>input[type=number]{max-width:220px}
.core-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}
.core-actions--start{margin:0 0 4px}
.core-switch{display:flex;align-items:flex-start;gap:10px;margin:8px 0;padding:10px 12px;border:1px solid var(--core-border);border-radius:11px;background:var(--core-surface-2);color:var(--core-text);font-size:12.5px;line-height:1.55;cursor:pointer}
.core-switch input[type=checkbox]{flex:none;width:17px;height:17px;margin:2px 0 0;accent-color:var(--core-accent);cursor:pointer}
.core-switch--confirm{margin-top:4px}
.core-note{margin:10px 0 0!important;color:var(--core-muted);font-size:12px;line-height:1.65}
.core-empty{padding:26px 20px;border:1px dashed var(--core-border-strong);border-radius:14px;background:var(--core-surface-2);color:var(--core-muted);font-size:13px;text-align:center}
.core-persona-host{height:72vh;min-height:520px;border:1px solid var(--core-border);border-radius:16px;overflow:hidden;background:var(--core-surface-2)}
.core-dialog .core-persona-host{height:auto;min-height:0;flex:1}
.core-persona-frame{display:block;width:100%;height:100%;min-height:520px;border:0;background:var(--core-surface)}
.core-dialog .core-persona-frame{min-height:0}
.amadeus-core-shell .core-extension{display:block;min-width:0;color:var(--core-text);font-size:13px;line-height:1.65}
.amadeus-core-shell .core-extension h2{font-size:21px;line-height:1.3;margin:0 0 8px;letter-spacing:-.02em}
.amadeus-core-shell .core-extension h3{font-size:15px;margin:14px 0 8px}
.amadeus-core-shell .core-extension h4{font-size:13px;margin:13px 0 7px}
.amadeus-core-shell .core-extension p{margin:7px 0;color:var(--core-muted)}
.amadeus-core-shell .core-extension button{appearance:none;display:inline-flex;align-items:center;justify-content:center;min-height:34px;margin:0 6px 6px 0;padding:7px 12px;border:1px solid var(--core-border);border-radius:9px;background:var(--core-elevated);color:var(--core-text);font:inherit;font-size:12.5px;font-weight:600;line-height:1.3;cursor:pointer;transition:background .14s,border-color .14s,color .14s}
.amadeus-core-shell .core-extension button:hover:not(:disabled){background:var(--core-hover);border-color:var(--core-border-strong)}
.amadeus-core-shell .core-extension button[aria-pressed=true]{background:var(--core-accent);border-color:var(--core-accent);color:#fff}
.amadeus-core-shell .core-extension button:disabled{opacity:.45;cursor:not-allowed}
.amadeus-core-shell .core-extension nav{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:10px 0}
.amadeus-core-shell .core-extension fieldset{min-width:0;margin:16px 0;padding:12px 14px;border:1px solid var(--core-border);border-radius:12px;background:var(--core-surface-2)}
.amadeus-core-shell .core-extension legend{padding:0 7px;color:var(--core-text);font-weight:650}
.amadeus-core-shell .core-extension label{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;margin:7px 12px 7px 0;color:var(--core-text)}
.amadeus-core-shell .core-extension input[type=checkbox]{accent-color:var(--core-accent)}
.amadeus-core-shell .core-extension input[type=number]{width:112px}
.amadeus-core-shell .core-extension textarea{display:block;width:min(720px,100%);min-height:92px;resize:vertical}
.amadeus-core-shell .core-extension article{min-width:0;margin:12px 0;padding:15px 16px;border:1px solid var(--core-border);border-radius:13px;background:var(--core-surface);overflow-wrap:anywhere}
.amadeus-core-shell .core-extension pre{max-height:280px;overflow:auto;padding:12px;border:1px solid var(--core-border);border-radius:10px;background:var(--core-surface-2);color:var(--core-text);white-space:pre-wrap;overflow-wrap:anywhere}
.amadeus-core-shell .core-extension .mcp-grant-warning{margin:8px 0 12px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--core-warn) 32%,var(--core-border));border-radius:10px;background:color-mix(in srgb,var(--core-warn) 8%,var(--core-surface));color:var(--core-text);font-size:12px;line-height:1.65}
.amadeus-core-shell .core-extension details{margin:8px 0}
.amadeus-core-shell .core-extension summary{cursor:pointer;font-weight:650}
.amadeus-core-shell .core-extension table{border-collapse:collapse;max-width:100%}
.amadeus-core-shell .core-extension th,.amadeus-core-shell .core-extension td{padding:7px 9px;border-bottom:1px solid var(--core-border);text-align:left;vertical-align:top}
.core-dialog .core-extension{max-width:100%}
.amadeus-core-shell .core-extension label:has(>input[type=text]),.amadeus-core-shell .core-extension label:has(>input[type=password]){display:grid;grid-template-columns:minmax(160px,220px) minmax(0,1fr);width:min(100%,800px);margin:12px 0;gap:12px}
@media(max-width:640px){.amadeus-core-shell .core-extension label:has(>input[type=text]),.amadeus-core-shell .core-extension label:has(>input[type=password]){grid-template-columns:1fr}}
.amadeus-core-shell [data-amadeus-life]{--aml-line:var(--core-border);--aml-surface:var(--core-surface);--aml-surface-2:var(--core-surface-2);--aml-text:var(--core-text);--aml-muted:var(--core-muted);--aml-accent:var(--core-accent);--aml-accent-strong:var(--core-accent-strong);--aml-accent-soft:var(--core-accent-soft);padding-bottom:0}
.amadeus-core-shell [data-amadeus-life] .topbar{border-radius:15px;box-shadow:none;background:var(--core-surface-2);padding:17px}
.amadeus-core-shell [data-amadeus-life] .card,.amadeus-core-shell [data-amadeus-life] .panel{border-radius:13px;box-shadow:none}
.amadeus-core-shell [data-amadeus-state]{--am-state-accent:var(--core-accent);--am-state-accent-strong:var(--core-accent-strong);--am-state-on-accent:#fff;padding-bottom:0}
.amadeus-core-shell [data-amadeus-state] .side{top:0;border-radius:14px;box-shadow:none}
.amadeus-core-shell [data-amadeus-state] .panel,.amadeus-core-shell [data-amadeus-state] .card{border-radius:11px}
.amadeus-core-shell .mneme-x{--mneme-accent:var(--core-accent);--dsw-alias-state-business-primary:var(--core-accent);background:var(--core-surface)}
.amadeus-core-shell .mneme-xbar,.amadeus-core-shell .mneme-xside,.amadeus-core-shell .mneme-xbrowsebar{border-color:var(--core-border)}
@media(max-width:900px){
 .core-overlay{padding:12px}
 .core-dialog{width:min(100%,980px);height:min(940px,94dvh);border-radius:18px}
 .core-dialog .amadeus-core-shell{padding:16px 18px 0}
 .core-hero{grid-template-columns:minmax(0,1fr);align-items:start}
 .core-facts{max-width:520px}
 .core-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .core-module-grid{grid-template-columns:1fr}
}
@media(max-width:640px){
 .core-overlay{padding:0;place-items:stretch}
 .core-dialog{width:100vw;height:100dvh;max-height:none;border-radius:0;border:0}
 .core-dialog .amadeus-core-shell{padding:13px 13px 0}
 .amadeus-core-shell>.core-header{gap:10px;flex-wrap:wrap;padding-bottom:11px}
 .core-mark{width:36px;height:36px;border-radius:11px;font-size:16px}
 .core-brand-text h2{font-size:18px}
 .core-tagline{display:none}
 .core-header-actions{width:100%;justify-content:flex-start;gap:6px}
 .core-btn{min-height:34px;padding:6px 11px;font-size:12px}
 .core-btn--close{margin-left:auto}
 .core-tabs{padding:8px 0;margin:0 -2px}
 .core-tabs button{padding:6px 11px;font-size:12px}
 .amadeus-core-shell>.core-main{padding:14px 0 20px}
 .core-hero{padding:17px 16px;border-radius:15px}
 .core-hero h2{font-size:20px}
 .core-hero p{font-size:12.5px}
 .core-facts{padding:11px 13px}
 .core-stat-grid{grid-template-columns:1fr;gap:9px}
 .core-stat{padding:12px 13px}
 .core-stat-value{font-size:21px}
 .core-card{padding:14px 14px;border-radius:13px}
 .core-field{grid-template-columns:1fr;gap:5px;padding:10px 0}
 .core-field>small,.core-field-hint{grid-column:1}
 .core-field>input[type=number]{max-width:none}
 .core-actions{gap:7px}
 .core-banner{align-items:flex-start}
 .core-module{flex-wrap:wrap}
 .core-persona-host{height:72vh;min-height:420px;border-radius:13px}
 .core-persona-frame{min-height:420px}
 .amadeus-core-shell .mneme-xmain{flex-direction:column}
 .amadeus-core-shell .mneme-xside{width:100%;max-height:210px;border-right:0;border-bottom:1px solid var(--core-border)}
 .amadeus-core-shell .mneme-ent{flex-direction:column}
 .amadeus-core-shell .mneme-entrail{width:100%;max-height:190px;border-right:0;border-bottom:1px solid var(--core-border)}
 .amadeus-core-shell .core-extension h2{font-size:19px}
 .amadeus-core-shell .core-extension label{align-items:flex-start}
 .amadeus-core-shell .core-extension input:not([type=checkbox]),.amadeus-core-shell .core-extension select,.amadeus-core-shell .core-extension textarea{max-width:100%}
}
`;
const ROOT='/api/amadeus-core';
async function api(path,body){const r=await fetch(ROOT+path,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'content-type':'application/json','x-amadeus-core':'1'}:{},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Request failed');return j.data;}
function forms(){const cache=new Map(),changes=new Set();return {subscribeChanges:fn=>{changes.add(fn);return()=>changes.delete(fn)},refreshAll:()=>Promise.all([...cache.values()].map(f=>f.refresh())),whileServed:(_keys,fn)=>fn(),get(id){
 const key=String(id).replace(/^amadeus-/,'').replace('dsh-mneme','memory');
 if(cache.has(key))return cache.get(key);
 let snapshot={status:'loading',writable:false},listeners=new Set();
 const notify=()=>listeners.forEach(fn=>fn());
 const refresh=async()=>{try{snapshot=await api('/forms/'+key)}catch(e){snapshot={status:'unavailable',writable:false,error:e.message}}notify()};
 const form={getSnapshot:()=>snapshot,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},mutate:async(ops,revision)=>{try{snapshot=await api('/forms/'+key,{ops,revision});notify();changes.forEach(fn=>fn());return true}catch(e){await refresh();throw e}},refresh};
 cache.set(key,form);refresh();return form;
}};}
const tabs=[['overview','总览','Overview'],['persona','人格','Persona'],['memory','记忆','Memory'],['state','状态','State'],['life','生活','Life'],['platforms','平台','Platforms'],['mcp','MCP','MCP'],['experiences','经历','Experiences'],['settings','设置','Settings']];
const CORE_MODULE_LABELS={memory:['记忆','Memory'],life:['生活','Life'],state:['状态','State'],persona:['人格','Persona']};
const CORE_IMPORT_LABELS={memory:['记忆','Memory'],life:['生活','Life'],state:['状态','State'],persona:['人格','Persona']};
function parseCssColor(value){
 const match=/^rgba?\(([^)]+)\)$/i.exec(String(value||'').trim());
 if(!match)return null;
 const parts=match[1].split(/[,\s/]+/).filter(Boolean);
 if(parts.length<3)return null;
 const channel=(part)=>part.endsWith('%')?Number(part.slice(0,-1))*2.55:Number(part);
 const r=channel(parts[0]),g=channel(parts[1]),b=channel(parts[2]),a=parts[3]===undefined?1:parts[3].endsWith('%')?Number(parts[3].slice(0,-1))/100:Number(parts[3]);
 if(![r,g,b,a].every(Number.isFinite))return null;
 return {r,g,b,a};
}
function relativeLuminance(color){
 const channel=value=>{const v=Math.max(0,Math.min(255,value))/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
 return .2126*channel(color.r)+.7152*channel(color.g)+.0722*channel(color.b);
}
function detectCoreTheme(shell){
 const probe=document.createElement('span');probe.style.cssText='position:fixed;visibility:hidden;background:var(--dsw-alias-bg-layer-1,transparent)';document.body.appendChild(probe);const hostColor=parseCssColor(getComputedStyle(probe).backgroundColor);probe.remove();if(hostColor&&hostColor.a>=.85)return relativeLuminance(hostColor)<.42?'dark':'light';
 const candidates=[document.body,document.documentElement].filter(Boolean);
 for(const element of candidates){
  const color=parseCssColor(getComputedStyle(element).backgroundColor);
  if(color&&color.a>=.85)return relativeLuminance(color)<.42?'dark':'light';
 }
 const scheme=String(getComputedStyle(document.documentElement).colorScheme||'').toLowerCase();
 if(/\bdark\b/.test(scheme)&&!/\blight\b/.test(scheme))return 'dark';
 if(/\blight\b/.test(scheme)&&!/\bdark\b/.test(scheme))return 'light';
 return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light';
}
function useCoreTheme(shellRef){
 const [theme,setTheme]=useState('light');
 useEffect(()=>{
  const update=()=>setTheme(detectCoreTheme(shellRef.current));
  update();
  const observer=new MutationObserver(update);
  const targets=new Set([document.documentElement,document.body]);
  let parent=shellRef.current?.parentElement;
  while(parent){targets.add(parent);parent=parent.parentElement}
  for(const target of targets)if(target)observer.observe(target,{attributes:true,attributeFilter:['class','style','data-theme','data-color-scheme']});
  const media=window.matchMedia?.('(prefers-color-scheme: dark)');
  media?.addEventListener?.('change',update);
  const frame=requestAnimationFrame(update);
  return()=>{observer.disconnect();media?.removeEventListener?.('change',update);cancelAnimationFrame(frame)};
 },[]);
 return theme;
}
function matchPersonaTheme(frame,theme,fontFamily){
 try{
  const doc=frame?.contentDocument,root=doc?.documentElement;
  if(!root)return;
  root.dataset.theme=theme==='dark'?'dark':'light';
  root.style.colorScheme=theme==='dark'?'dark':'light';
  const hostStyle=getComputedStyle(frame.closest('.amadeus-core-shell'));
  for(const [key,value] of Object.entries({'--bg':'--core-surface','--paper':'--core-surface','--soft':'--core-surface-2','--text':'--core-text','--text2':'--core-text','--muted':'--core-muted','--line':'--core-border','--line2':'--core-border-strong','--green':'--core-accent','--deep':'--core-accent-strong','--green-bg':'--core-accent-soft'}))root.style.setProperty(key,hostStyle.getPropertyValue(value));
  root.style.fontFamily=fontFamily||'system-ui,sans-serif';
  let style=doc.getElementById('core-persona-embed-theme');
  if(!style){style=doc.createElement('link');style.id='core-persona-embed-theme';style.rel='stylesheet';style.href='/api/amadeus-core/persona-embed.css';doc.head.appendChild(style)}
 }catch{}
}
function CorePanel({ctx,views,formsService,onClose}){
 const [tab,setTab]=useState('overview'),[status,setStatus]=useState(null),[error,setError]=useState(''),[workspace,setWorkspace]=useState(''),[busy,setBusy]=useState(false),[english,setEnglish]=useState(false);
 const [sources,setSources]=useState({memory:'',life:'',state:'',persona:''}),[offlineConfirmed,setOfflineConfirmed]=useState(false);
 const shellRef=useRef(null),personaFrame=useRef(null),theme=useCoreTheme(shellRef);
 const refresh=()=>api('/status').then(setStatus).catch(e=>setError(e.message));
 useEffect(()=>{refresh();return formsService?.subscribeChanges(refresh)},[formsService]);
 useEffect(()=>{if(status?.workspaceId)setWorkspace(status.workspaceId)},[status?.workspaceId]);
 useEffect(()=>{if(tab!=='persona'||!status?.modules?.persona?.mounted)return;const frame=personaFrame.current;if(frame)matchPersonaTheme(frame,theme,getComputedStyle(shellRef.current||frame).fontFamily)},[tab,theme,status?.modules?.persona?.mounted]);
 async function action(fn){setBusy(true);setError('');try{await fn();await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const t=(zh,en)=>english?en:zh;
 const moduleLabel=name=>t(...(CORE_MODULE_LABELS[name]??[name,name]));
 const importLabel=name=>t(...(CORE_IMPORT_LABELS[name]??[name,name]));
 const modules=Object.entries(status?.modules??{}),enabledModules=modules.filter(([,value])=>value.enabled).length,mountedModules=modules.filter(([,value])=>value.mounted).length;
 const realPlatforms=status?.platforms??[],simulations=status?.simulations??[],experiences=status?.experiences??[],mcpServers=status?.mcp?.servers??[];
 const workspaceInfo=(status?.workspaces??[]).find(item=>item.id===status?.workspaceId),workspaceName=workspaceInfo?.title||status?.workspaceId||t('未绑定','Unbound');
 const phase=status?.activity?.phase??'Idle',phaseLabel=phase==='Idle'?t('空闲','Idle'):phase==='Exploring'?t('探索中','Exploring'):phase==='Deliberating'?t('思考中','Deliberating'):phase==='Paused'?t('已暂停','Paused'):phase==='Completed'?t('已完成','Completed'):phase;
 const statusTone=value=>['ready','ok'].includes(String(value).toLowerCase())?'ok':['blocked','error','failed'].includes(String(value).toLowerCase())?'danger':['restarting','loading','paused'].includes(String(value).toLowerCase())?'warn':'plain';
 const stats=[
  {label:t('工作区','Workspace'),value:workspaceName,text:true,sub:status?.workspaceId?t('已绑定 DSH 工作区','Bound to DSH workspace'):t('在设置中选择一个工作区','Choose a workspace in Settings')},
  {label:t('模块','Modules'),value:status?`${enabledModules} / ${modules.length}`:'—',sub:status?`${mountedModules} ${t('运行中','running')}`:t('加载中','Loading')},
  {label:t('平台','Platforms'),value:status?String(realPlatforms.length):'—',sub:status?`${realPlatforms.filter(item=>item.enabled).length} ${t('已启用','enabled')} · ${simulations.length} ${t('模拟','simulated')}`:t('加载中','Loading')},
  {label:t('经历','Experiences'),value:status?String(experiences.length):'—',sub:experiences[0]?.occurredAt?t('最近 ','Latest ')+String(experiences[0].occurredAt).slice(0,16).replace('T',' '):t('暂无记录','No records')},
  {label:t('活动','Activity'),value:status?phaseLabel:'—',sub:status?`${t('预算','Budget')} ${Math.round((status.activityBudgetMs??120000)/1000)}s`:t('加载中','Loading')},
  {label:'MCP',value:status?String(mcpServers.length):'—',sub:status?`${mcpServers.filter(item=>item.enabled).length} ${t('已启用','enabled')}`:t('加载中','Loading')}
 ];
 const facts=[
  [t('运行版本','Runtime version'),status?.version??'—'],
  [t('配置修订','Config revision'),status?String(status.revision??0):'—'],
  [t('数据代','Data generation'),status?.dataGeneration??'—'],
  [t('活动会话','Activity session'),status?.activity?.sessionId??t('未准备','Not prepared')]
 ];
 let content;
 if(tab==='mcp')content=h(McpPanel,{state:status?.mcp,sessions:status?.sessions??[],refresh,t});
 else if(['memory','state','life'].includes(tab))content=status?.modules?.[tab]?.mounted?views[tab]?.():h('div',{className:'core-empty'},t('请先选择工作区并应用配置，或启用此模块。','Choose a workspace and apply configuration, or enable this module.'));
 else if(tab==='persona')content=status?.modules?.persona?.mounted?h('div',{className:'core-persona-host'},h('iframe',{ref:personaFrame,title:'Amadeus Persona',src:'/api/amadeus-persona/console',className:'core-persona-frame',onLoad:()=>matchPersonaTheme(personaFrame.current,theme,getComputedStyle(shellRef.current||personaFrame.current).fontFamily)})):h('div',{className:'core-empty'},t('请启用人格模块。','Enable the Persona module.'));
 else if(tab==='platforms')content=h(PlatformPanel,{status,refresh,t});
 else if(tab==='experiences')content=h('div',{className:'core-settings'},h('section',{className:'core-card'},h('h2',null,t('经历时间线','Experience timeline')),h('p',{className:'core-card-sub'},t('按来源区分模拟与真实读取；标题和文本不代表看过完整视频。','Evidence distinguishes simulation and live reads; metadata is not full video understanding.')),...(status?.experiences??[]).length?status.experiences.map(e=>h('article',{key:e.eventId,className:'core-module',style:{display:'block',margin:'10px 0'}},h('strong',null,e.platform),h('p',{style:{margin:'3px 0'}},`${e.occurredAt} · ${e.status}`),h('code',null,e.eventId))):h('p',{className:'core-note'},t('暂无经历记录。','No experiences yet.'))));
 else if(tab==='settings')content=h('div',{className:'core-settings'},
  h('section',{className:'core-card'},
   h('div',{className:'core-card-head'},h('div',null,h('h2',null,t('唯一工作区','Single workspace')),h('p',{className:'core-card-sub'},t('Core 只绑定一个 DSH 工作区；保存后不会合并另一套历史。','Core binds to one DSH workspace; saving never merges another history.')))),
   h('div',{className:'core-fields'},h('label',{className:'core-field'},h('span',{className:'core-field-label'},t('工作区','Workspace')),h('select',{'aria-label':'Core Workspace',className:'core-input',value:workspace,onChange:e=>setWorkspace(e.target.value)},h('option',{value:''},t('选择 DSH Workspace','Choose DSH Workspace')),...(status?.workspaces??[]).map(w=>h('option',{key:w.id,value:w.id},w.title||w.id))),h('small',{className:'core-field-hint'},t('切换工作区前请确认当前实例空闲。','Confirm the current instance is idle before switching.')))),
   h('div',{className:'core-actions'},h('button',{type:'button',className:'core-btn core-btn--primary',disabled:busy||!workspace,onClick:()=>action(()=>api('/configure',{revision:status.revision,workspaceId:workspace}))},t('保存工作区','Save workspace')))),
  h('section',{className:'core-card'},
   h('div',{className:'core-card-head'},h('div',null,h('h2',null,t('活动与探索','Activity and exploration')),h('p',{className:'core-card-sub'},t('真实平台需要单独授权；失败不会回退为模拟内容。','Live platforms need separate grants; failures never fall back to mock content.')))),
   h('div',{className:'core-actions core-actions--start'},
    h('button',{type:'button',className:'core-btn',disabled:busy||status?.status!=='ready',onClick:()=>action(()=>api('/simulate',{}))},t('运行两个模拟平台的只读验收','Run two simulated read-only platforms')),
    h('button',{type:'button',className:'core-btn',disabled:busy||status?.status!=='ready',onClick:()=>action(()=>api('/prepare-exploration',{}))},t('准备持久活动会话','Prepare persistent Activity Session'))),
   h('label',{className:'core-switch'},h('input',{type:'checkbox',checked:status?.explorationEnabled===true,disabled:busy,onChange:e=>action(()=>api('/configure',{revision:status.revision,explorationEnabled:e.target.checked}))}),h('span',null,t('允许活动会话自主使用已授权平台能力（默认关闭）','Allow Activity Session to use authorized platform capabilities (off by default)'))),
   h('div',{className:'core-fields'},
    h('label',{className:'core-field'},h('span',{className:'core-field-label'},t('单次活动总时限','Activity wall-clock limit')),h('input',{type:'number',min:10,max:300,className:'core-input',key:status?.activityBudgetMs,defaultValue:(status?.activityBudgetMs??120000)/1000,onBlur:e=>{const value=Number(e.target.value)*1000;if(value!==status.activityBudgetMs)action(()=>api('/configure',{revision:status.revision,activityBudgetMs:value}));}}),h('small',{className:'core-field-hint'},t('秒，包含模型思考；下次活动生效。','Seconds, including model thinking; next activity.'))),
    h('div',{className:'core-field core-field--static'},h('span',{className:'core-field-label'},t('活动会话','Activity session')),h('code',null,status?.activity?.sessionId??t('尚未准备','Not prepared'))),
    h('div',{className:'core-field core-field--static'},h('span',{className:'core-field-label'},t('活动状态','Activity state')),h('span',null,h('span',{className:'core-badge core-badge--'+(phase==='Paused'?'warn':phase==='Idle'?'plain':'ok')},phaseLabel)))),
   h('div',{className:'core-actions'},
    h('button',{type:'button',className:'core-btn',disabled:busy||status?.activity?.phase!=='Paused',onClick:()=>action(()=>api('/activity',{action:'resume'}))},t('在原预算内恢复活动','Resume within original budget')),
    h('button',{type:'button',className:'core-btn',disabled:busy||status?.activity?.phase==='Idle',onClick:()=>action(()=>api('/activity',{action:'finish'}))},t('安全结束当前活动','Safely finish current activity'))),
   h('p',{className:'core-note'},t('仅在上面的持久活动会话中生效。可以通过 Life 配置唤醒机会，或在 DSH 中打开该会话交谈；不会自动创建第二套调度。真实平台需要单独开启权限，失败不会切换为模拟内容。','Only the persistent Activity Session may use these tools. Configure wake opportunities in Life or open this Session in DSH. Core adds no second scheduler. Live platforms require separate permissions; errors never fall back to mock content.'))),
  h('section',{className:'core-card'},
   h('div',{className:'core-card-head'},h('div',null,h('h2',null,t('模块','Modules')),h('p',{className:'core-card-sub'},t('Life 配置保存后需应用；State 配置保存后实时生效。应用时拒绝中断活动模型回合。','Apply Life changes; State changes take effect live. Applying refuses to interrupt active model turns.')))),
   h('div',{className:'core-fields'},...modules.map(([name,value])=>h('label',{key:name,className:'core-switch'},h('input',{type:'checkbox',checked:value.enabled,disabled:busy,onChange:e=>action(()=>api('/configure',{revision:status.revision,module:name,enabled:e.target.checked}))}),h('span',{className:'core-field-label'},moduleLabel(name),h('code',null,name)),h('span',{className:'core-badge core-badge--'+(value.mounted?'ok':value.enabled?'warn':'plain')},value.mounted?t('运行中','running'):value.enabled?t('未挂载','inactive'):t('已停用','disabled')))))),
  h('section',{className:'core-card'},
   h('div',{className:'core-card-head'},h('div',null,h('h2',null,t('从原四插件导入','Import the four original modules')),h('p',{className:'core-card-sub'},t('保留原目录，先生成一致性快照，再切换到独立数据副本。四个来源必须绑定当前同一个 Workspace；不会合并两套历史。','Preserve source directories, snapshot consistently, then activate a separate copy. All sources must share this Workspace; histories are not merged.')))),
   h('p',{className:'core-note'},t('导入外部旧数据前，请在当前 DSH 保留四个已停用的旧插件条目及原配置，并确保数据路径与下方目录一致（支持已核实版本的默认路径）。缺少可核实配置时会拒绝导入，避免丢失原设置。','Keep the four disabled legacy plugin entries and their configuration in this DSH Profile. Their resolved data paths, including verified released defaults, must match the directories below. Import refuses missing or mismatched configuration.')),
   h('div',{className:'core-fields'},...Object.keys(sources).map(name=>h('label',{key:name,className:'core-field'},h('span',{className:'core-field-label'},importLabel(name),h('code',null,name)),h('input',{'aria-label':'Import '+name,className:'core-input',value:sources[name],placeholder:t('原插件数据目录绝对路径','Absolute source data directory'),onChange:e=>setSources({...sources,[name]:e.target.value})})))),
   h('label',{className:'core-switch core-switch--confirm'},h('input',{type:'checkbox',checked:offlineConfirmed,onChange:e=>setOfflineConfirmed(e.target.checked)}),h('span',null,t('我已停用原四插件，并关闭其他可能写入这些目录的 DSH 实例。','I disabled the four old plugins and closed other DSH instances writing these directories.'))),
   h('div',{className:'core-actions'},
    h('button',{type:'button',className:'core-btn core-btn--primary',disabled:busy||!offlineConfirmed||Object.values(sources).some(x=>!x.trim()),onClick:()=>action(()=>api('/import',{revision:status.revision,sources,offlineConfirmed}))},t('备份并导入','Back up and import')),
    status?.canRollback?h('button',{type:'button',className:'core-btn',disabled:busy,onClick:()=>action(()=>api('/rollback',{revision:status.revision}))},t('恢复前一个数据代（不删除数据）','Restore previous data generation (keep all data)')):null)));
 else content=h('div',{className:'core-overview'},
  h('section',{className:'core-hero'},
   h('div',null,h('span',{className:'core-eyebrow'},'AMADEUS CORE'),h('h2',null,t('一个身份，持续的记忆、状态与生活。','One identity, continuous memory, state and life.')),h('p',null,t('在同一个工作区里，管理人格、记忆、状态与跨平台生活。','Manage identity, memory, state and cross-platform life in one workspace.')),h('div',{className:'core-badges'},h('span',{className:'core-badge core-badge--'+statusTone(status?.status??'loading')},status?.status??t('加载中','loading')),h('span',{className:'core-badge core-badge--accent'},`v${status?.version??'0.2.0-alpha.2'}`),h('span',{className:'core-badge'},status?.workspaceId?t('工作区已绑定','Workspace bound'):t('尚未绑定工作区','No workspace')))),
   h('dl',{className:'core-facts'},...facts.map(([label,value])=>h('div',{className:'core-fact',key:label},h('dt',null,label),h('dd',null,value))))),
  h('div',{className:'core-stat-grid'},...stats.map(stat=>h('article',{className:'core-stat',key:stat.label},h('div',{className:'core-stat-label'},h('span',null,stat.label),h('span',{className:'core-stat-dot','aria-hidden':'true'})),h('div',{className:'core-stat-value'+(stat.text?' core-stat-value--text':'')},stat.value),h('div',{className:'core-stat-sub'},stat.sub)))),
  h('section',{className:'core-card'},h('div',{className:'core-card-head'},h('h3',null,t('模块状态','Module status')),h('span',{className:'core-badge core-badge--'+(mountedModules===modules.length&&modules.length?'ok':'plain')},`${mountedModules} / ${modules.length} ${t('运行中','running')}`)),modules.length?h('div',{className:'core-module-grid'},...modules.map(([name,value])=>h('div',{className:'core-module',key:name},h('div',{className:'core-module-name'},h('strong',null,moduleLabel(name)),h('code',null,name)),h('span',{className:'core-badge core-badge--'+(value.mounted?'ok':value.enabled?'warn':'plain')},value.mounted?t('运行中','running'):value.enabled?t('未挂载','inactive'):t('已停用','disabled'))))):h('p',{className:'core-note'},t('状态加载中。','Loading status.'))),
  h('section',{className:'core-card'},h('div',{className:'core-card-head'},h('h3',null,t('数据与衔接','Data and continuity')),h('span',{className:'core-badge core-badge--plain'},t('只读概览','Read-only'))),h('div',{className:'core-module-grid'},h('div',{className:'core-module'},h('div',{className:'core-module-name'},h('strong',null,t('经历记录','Experiences')),h('code',null,'events')),h('span',{className:'core-badge'},String(experiences.length))),h('div',{className:'core-module'},h('div',{className:'core-module-name'},h('strong',null,t('可恢复数据代','Rollback generation')),h('code',null,'data')),h('span',{className:'core-badge core-badge--'+(status?.canRollback?'ok':'plain')},status?.canRollback?t('可恢复','available'):t('无','none'))))));
 return h('section',{ref:shellRef,className:'amadeus-core-shell','data-core-theme':theme},
  h('style',null,CSS),
  h('header',{className:'core-header'},h('div',{className:'core-brand'},h('span',{className:'core-mark','aria-hidden':'true'},'A'),h('div',{className:'core-brand-text'},h('h2',null,'Amadeus Core'),h('p',{className:'core-tagline'},t('一个身份 · 持续的记忆、状态与生活','One identity · continuous memory, state and life')))),h('div',{className:'core-header-actions'},h('button',{type:'button',className:'core-btn core-btn--ghost',onClick:()=>setEnglish(!english)},english?'中文':'English'),h('button',{type:'button',className:'core-btn core-btn--ghost',onClick:refresh},t('刷新','Refresh')),onClose?h('button',{type:'button',className:'core-btn core-btn--close',onClick:onClose},'关闭 / Close'):null)),
  h('nav',{className:'core-tabs','aria-label':t('Amadeus Core 导航','Amadeus Core navigation')},...tabs.map(([id,zh,en])=>h('button',{key:id,type:'button','aria-pressed':tab===id,onClick:()=>setTab(id)},english?en:zh))),
  error||status?.problem?h('div',{className:'core-alert',role:'alert'},error||status.problem):null,
  status?.pendingRestart?h('div',{className:'core-banner'},h('span',null,t('保存的配置尚未应用。','Saved configuration is not active yet.')),h('button',{type:'button',className:'core-btn',disabled:busy,onClick:()=>action(async()=>{await api('/apply',{});await formsService?.refreshAll()})},t('应用配置','Apply configuration'))):null,
  h('main',{className:'core-main core-main-'+tab},content));
}
function CoreLauncher({ctx,views,formsService}){
 const [open,setOpen]=useState(false);
 useEffect(()=>{if(!open)return;const old=document.activeElement,fn=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',fn);return()=>{document.removeEventListener('keydown',fn);old?.focus?.()}},[open]);
 return h('div',null,h('button',{type:'button',onClick:()=>setOpen(true),style:{font:'inherit',padding:'8px 12px',borderRadius:10,border:'1px solid #78978d55',background:'transparent',color:'inherit'}},'Amadeus Core'),open?createPortal(h('div',{className:'core-overlay'},h('div',{className:'core-dialog',role:'dialog','aria-modal':true,'aria-label':'Amadeus Core'},h(CorePanel,{ctx,views,formsService,onClose:()=>setOpen(false)}))),document.body):null);
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
 ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'amadeus-core',order:23,label:()=> 'Amadeus Core'},()=>h(CorePanel,{ctx,views,formsService:configForms})));
 ctx.slots.inject('sidebar.footer.action',()=>ctx.slots.register({name:'sidebar.footer.action',id:'amadeus-core',order:5,label:()=> 'Amadeus Core'},()=>h(CoreLauncher,{ctx,views,formsService:configForms})));
}};
