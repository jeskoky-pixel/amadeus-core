YªçŠx-®éÜj×¢ëiºÚ+Š§j[h‘éÜ¢éíã~·×N½ë®¶o+^²‰¢¶×window.__ModuleLoader__.load({id:'@fg-lab/amadeus-core',factory:(require)=>{
const modules={"memory": (()=>{let descriptor; const loader={load:x=>{descriptor=x}}; const window = new Proxy(globalThis.window,{get:(target,key)=>{if(key==='__ModuleLoader__')return loader;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}});
window.__ModuleLoader__.load({
  id: "@fg-lab/amadeus-memory",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    let react = require("react");
    let primitives = require("@deepseek-ai/dsh-client-ui-primitives");
    let { useState, useEffect, useCallback, useRef } = react;

    // #178 æ— éšœç¢æ‰¹æ¬¡ä¸€ï¼šaria-live ç½‘ç»œã€‚æ¨¡å—çº§å•ä¾‹ polite live region +
    // announce()ï¼šé¢æ¿æ‰€æœ‰ç¬æ—¶åé¦ˆï¼ˆä¿å­˜æˆåŠŸ/å¤±è´¥ã€é˜Ÿåˆ—åˆ·æ–°ã€è£å†³å®Œæˆã€
    // å¤åˆ¶æˆåŠŸï¼‰ç»æ­¤æ’­æŠ¥ï¼Œè¯»å±ç”¨æˆ·ä¸å†ä¾èµ–çº¯è§†è§‰ spanã€‚å•ä¾‹æŒ‚ <body>ï¼Œ
    // ä¸é¢æ¿ç»„ä»¶ç”Ÿå‘½å‘¨æœŸè§£è€¦ï¼›æ–‡æœ¬å…ˆæ¸…ç©ºä¸‹ä¸€å¸§å†å†™å…¥ï¼Œè®©è¿ç»­ä¸¤æ¬¡ç›¸åŒ
    // æ–‡æ¡ˆä¹Ÿèƒ½å„æ’­æŠ¥ä¸€æ¬¡ã€‚
    let liveRegion = null;
    function announce(text) {
      if (!text || typeof document === "undefined") return;
      if (!liveRegion || !liveRegion.isConnected) {
        liveRegion = document.createElement("div");
        liveRegion.setAttribute("role", "status");
        liveRegion.setAttribute("aria-live", "polite");
        liveRegion.style.cssText = "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
        document.body.appendChild(liveRegion);
      }
      liveRegion.textContent = "";
      window.requestAnimationFrame(() => { if (liveRegion) liveRegion.textContent = text; });
    }

    // #177 è¯çº§ diffï¼šç»å…¸ LCS å¯¹é½â€”â€”åˆ é™¤ç‰‡æ®µæ ‡çº¢ã€æ–°å¢æ ‡ç»¿ã€å…¬å…±éƒ¨åˆ†åŸæ ·ã€‚
    // åˆ†è¯ä¸¤æ®µå¼ï¼šHan æ®µå…ˆåˆ‡å‡ºå†é€å­—æ‰“æ•£ï¼ˆ\p{L} æŠŠæ•´å¥ä¸­æ–‡å½“ä¸€ä¸ªè¯ï¼Œå¿…é¡»å•åˆ—ï¼‰ï¼Œ
    // å…¶ä½™æŒ‰ Unicode è¯è¾¹ç•Œï¼ˆæ‹‰ä¸æŒ‰è¯ã€æ ‡ç‚¹ç‹¬ç«‹ï¼‰ã€‚ç›¸é‚»åŒä¾§ç‰‡æ®µåˆå¹¶æˆ runã€‚
    // è¾“å…¥å…ˆæˆª 800 å­—ç¬¦ï¼›O(nÂ·m) DP ä»…åœ¨å°æ–‡æœ¬å¯ç”¨ï¼ˆä»»ä¸€ä¾§ > 800 è¯æˆ– edit run
    // > 200 æ—¶è¿”å› nullï¼‰ï¼Œcaller é€€å›åŸæ–‡å±•ç¤ºï¼Œä¸ä¸ºæç«¯æ–‡æœ¬çƒ§å†…å­˜ã€‚
    function wordDiff(aText, bText) {
      const HAN = /^[\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}\u{F900}-\u{FAFF}]+$/u;
      const tokenize = (s) => (s || "")
        .split(/([\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}\u{F900}-\u{FAFF}]+)/u)
        .filter(Boolean)
        .flatMap((seg) => HAN.test(seg)
          ? [...seg]
          : seg.split(/(?=[^\p{L}\p{N}])|(?<=[^\p{L}\p{N}])/u).filter(Boolean));
      const a = tokenize((aText || "").slice(0, 800)), b = tokenize((bText || "").slice(0, 800));
      const n = a.length, m = b.length;
      if (n === 0 && m === 0) return null;
      if (n > 800 || m > 800) return null; // ponytail: O(nÂ·m) DPï¼Œ800Ã—800 å°é¡¶ï¼ˆ~2.5MB Int32ï¼‰ï¼Œè¶…é™é€€å›åŸæ–‡
      const dp = new Int32Array((n + 1) * (m + 1));
      const at = (i, j) => i * (m + 1) + j;
      for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
          dp[at(i, j)] = a[i] === b[j] ? dp[at(i + 1, j + 1)] + 1 : Math.max(dp[at(i + 1, j)], dp[at(i, j + 1)]);
        }
      }
      const ops = [];
      const push = (kind, text) => {
        const last = ops[ops.length - 1];
        if (last && last.kind === kind) last.text += text;
        else ops.push({ kind, text });
      };
      let i = 0, j = 0;
      while (i < n && j < m) {
        if (a[i] === b[j]) { push("same", a[i]); i++; j++; }
        else if (dp[at(i + 1, j)] >= dp[at(i, j + 1)]) { push("del", a[i]); i++; }
        else { push("ins", b[j]); j++; }
      }
      while (i < n) { push("del", a[i]); i++; }
      while (j < m) { push("ins", b[j]); j++; }
      if (ops.filter((o) => o.kind !== "same").length > 200) return null;
      return ops;
    }
    // --- mneme markï¼šæ’ä»¶è‡ªå·±çš„æ ‡è¯†å›¾æ ‡ -------------------------------------
    // ä¸å†å€Ÿå®¿ä¸»çš„ IconArchiveOutline*ï¼Œä¸¤ä¸ªåŸå› ï¼š
    //  Â· è¯­ä¹‰æ’è½¦â€”â€”ã€Œå½’æ¡£ç›’ã€å’Œè®°å¿†åº“é‡Œçš„å½’æ¡£åŠ¨ä½œæ˜¯åŒä¸€ä¸ªç¬¦å·ï¼Œç”¨æˆ·åé¦ˆçœ‹ä¸å‡º
    //    è¿™æ˜¯è®°å¿†æ’ä»¶ï¼ˆissue èµ°ç»´æŠ¤è€…è‡ªå¼€é€šé“ï¼‰ï¼›
    //  Â· å®¿ä¸»è€¦åˆâ€”â€”å®¿ä¸»å›¾æ ‡åä¼šæ¢ä»£ï¼ˆ#287ï¼šOutline20 â†’ OutlineRegular/Mediumï¼‰ï¼Œ
    //    åªè®¤æŸä¸€ä»£å°±å–åˆ° undefinedï¼Œh(undefined) å³ React #130 æŠŠæ•´ä¸ª slot entry
    //    å´©æ‰ã€‚æ”¹ç”¨æœ¬åœ° Lucide è·¯å¾„æ•°æ®åï¼Œä¸å†éœ€è¦ã€Œæ¢æµ‹å¤šä»£åå­— + ç¼ºåé™çº§ã€ã€‚
    // Lucide Brainï¼ˆé¡¹ç›®ç°æœ‰ Lucide 1.42 å›¾æ ‡æ•°æ®ï¼ŒISCï¼‰ï¼›é™æ€å†…åµŒè·¯å¾„ï¼Œé¿å…æ’ä»¶è¿è¡Œæ—¶åŠ è½½ ESM åŒ…ã€‚
    // å®¿ä¸»å›¾æ ‡åä¼šéšç‰ˆæœ¬æ¢ä»£ï¼Œå› æ­¤æ’ä»¶æ ‡è¯†ä»ç”±æœ¬åœ° helper æ¸²æŸ“ï¼›æ’ä»¶åˆ—è¡¨ SVG ä¸è¿™é‡Œå…±ç”¨åŒä¸€è·¯å¾„ã€‚
    const MNEME_MARK_D = "M12 18V5M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5M17.997 5.125a4 4 0 0 1 2.526 5.77M18 18a4 4 0 0 0 2-7.464M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517M6 18a4 4 0 0 1-2-7.464M6.003 5.125a4 4 0 0 0-2.526 5.77";

    /** 24 æ …æ ¼ Lucide Brain æ˜ å°„åˆ°å®¿ä¸» 16 æ …æ ¼ï¼Œé¢œè‰²ä»éšä¸»é¢˜èµ°ã€‚ */
    const MnemeMark = ({ size = 16, className }) => h("svg", {
      width: size,
      height: size,
      className,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, h("path", { d: MNEME_MARK_D, transform: "scale(0.666667)" }));

    /** æ¸²æŸ“ mneme markï¼šå››ä¸ªå…¥å£ï¼ˆæµ®å±‚æ ‡é¢˜æ  / footer å›é€€ / ä¾§è¾¹æ  portal / better-sidebar tabï¼‰å…±ç”¨åŒä¸€é¢—ã€‚ */
    const renderMnemeMark = (props) => h(MnemeMark, props);

    // Portal target for the hero fallback surface. The host whitelists
    // react-dom for its own bundles (dsh-client-ui-trajectory requires it);
    // when the runtime rejects it for plugins the overlay renders in place â€”
    // position:fixed keeps it viewport-sized either way.
    let reactDom = null;
    try { reactDom = require("react-dom"); } catch { reactDom = null; }

    // Node-graph pictogram (three nodes joined by edges). The primitives kit
    // ships no network/graph icon, and its share-style glyph reads as
    // "share" â€” exactly the confusion this custom 16px replacement avoids.
    const GraphNodesIcon = ({ size = 16, className }) => h("svg", {
      width: size,
      height: size,
      className,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    },
      h("path", {
        d: "M8 5.2 4.6 10.4M8 5.2l3.4 5.2M5.2 12h5.6",
        stroke: "currentColor",
        strokeWidth: "1.2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }),
      h("circle", { cx: 8, cy: 3.4, r: 1.8, fill: "currentColor" }),
      h("circle", { cx: 3.6, cy: 12, r: 1.8, fill: "currentColor" }),
      h("circle", { cx: 12.4, cy: 12, r: 1.8, fill: "currentColor" })
    );

    // Stroke icons, Lucide path data (ISC license) inlined as [tag, attrs]
    // tuples â€” the plugin runtime cannot require third-party libraries, so
    // the data ships with the bundle (the morphicons/lucide pairing the
    // data package documents, minus the runtime dependency). Stroke picks
    // up currentColor, so icons follow the host theme tokens.
    const ICON_PATHS = {
      database: [["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }], ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }], ["path", { d: "M3 12A9 3 0 0 0 21 12" }]],
      waypoints: [["path", { d: "m10.586 5.414-5.172 5.172" }], ["path", { d: "m18.586 13.414-5.172 5.172" }], ["path", { d: "M6 12h12" }], ["circle", { cx: "12", cy: "20", r: "2" }], ["circle", { cx: "12", cy: "4", r: "2" }], ["circle", { cx: "20", cy: "12", r: "2" }], ["circle", { cx: "4", cy: "12", r: "2" }]],
      settings: [["path", { d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" }], ["circle", { cx: "12", cy: "12", r: "3" }]],
      search: [["path", { d: "m21 21-4.34-4.34" }], ["circle", { cx: "11", cy: "11", r: "8" }]],
      refresh: [["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }], ["path", { d: "M21 3v5h-5" }], ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }], ["path", { d: "M8 16H3v5" }]],
      chevronDown: [["path", { d: "m6 9 6 6 6-6" }]],
      chevronRight: [["path", { d: "m9 18 6-6-6-6" }]],
      copy: [["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }], ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]],
      check: [["path", { d: "M20 6 9 17l-5-5" }]],
      inbox: [["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }], ["path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }]],
      activity: [["path", { d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" }]],
      flame: [["path", { d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" }]],
      // æ„è§ä¸åé¦ˆå…¥å£çš„è¡Œé¦–å›¾æ ‡ï¼ˆLucide æ•°æ®ï¼ŒåŒä¸Š ISC æƒ¯ä¾‹å†…è”ï¼‰
      bug: [["path", { d: "m8 2 1.88 1.88" }], ["path", { d: "M14.12 3.88 16 2" }], ["path", { d: "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" }], ["path", { d: "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" }], ["path", { d: "M12 20v-9" }], ["path", { d: "M6.53 9C4.6 8.8 3 7.1 3 5" }], ["path", { d: "M6 13H2" }], ["path", { d: "M3 21c0-2.1 1.7-3.9 3.8-4" }], ["path", { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4" }], ["path", { d: "M22 13h-4" }], ["path", { d: "M17.2 17c2.1.1 3.8 1.9 3.8 4" }]],
      mail: [["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }], ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }]],
      // star æ˜¯è®¾ç½®é¡µé¼“åŠ±å…¥å£çš„è¡Œé¦–å›¾æ ‡ï¼ˆLucide æ•°æ®ï¼ŒåŒä¸Š ISC æƒ¯ä¾‹å†…è”ï¼‰ã€‚
      // Icon å¯¹æœªæ³¨å†Œçš„åå­—é™é»˜ return nullâ€”â€”æ¼äº†å®ƒå°±æ˜¯ä¸€è¡Œç¼ºå›¾æ ‡ã€é—¸é—¨å…¨ç»¿ï¼Œ
      // æ‰€ä»¥è¿™æ¡è¡¨ä¸ç”¨æ³•å¿…é¡»åŒå¤„å‡ºç°ï¼ˆè§ test/client.test.js çš„å›¾æ ‡åé”ï¼‰ã€‚
      star: [["polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }]]
    };
    const Icon = ({ name, size = 16, className }) => {
      const parts = ICON_PATHS[name];
      if (!parts) return null;
      return h("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        "aria-hidden": "true"
      }, parts.map(([tag, attrs], i) => h(tag, { key: i, ...attrs })));
    };

    // Lucide v1.42 star pathï¼ˆmorphicons å®˜æ–¹é…å¥—çš„æ•°æ®åŒ…ï¼‰ã€‚morphicons æœ¬ä½“
    // æ˜¯ ESM-only çš„å˜å½¢åŠ¨ç”»å¼•æ“ã€æ’ä»¶è¿è¡Œæ—¶ä¸å…è®¸ require ç¬¬ä¸‰æ–¹åº“ï¼Œæ•…æŒ‰
    // æ—¢æœ‰æƒ¯ä¾‹å†…è”å›¾æ ‡æ•°æ®é™æ€æ¸²æŸ“ï¼›å®å¿ƒ/ç©ºå¿ƒç”± fill åŒºåˆ†ï¼Œç©ºå¿ƒé™é€æ˜åº¦ã€‚
    const STAR_PATH_D = "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";
    const ImportanceStars = ({ value = 0, size = 13, className }) => {
      const filled = Math.min(5, Math.max(0, Math.round(value || 0)));
      return h("span", { className: `mneme-stars${className ? ` ${className}` : ""}`, role: "img", "aria-label": `${filled}/5` },
        [0, 1, 2, 3, 4].map((i) => h("svg", { key: i, width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true" },
          h("path", {
            d: STAR_PATH_D,
            fill: i < filled ? "currentColor" : "none",
            stroke: "currentColor",
            strokeWidth: 1.6,
            strokeLinejoin: "round",
            opacity: i < filled ? 1 : 0.35
          }))));
    };

    // å•é¢—æ˜Ÿï¼ˆä¸ ImportanceStars åŒä¸€ä»½ Lucide è·¯å¾„ï¼‰ï¼šç­›é€‰ chipã€å®ä½“æåŠæ•°ã€
    // æ³¨å…¥é¢„è§ˆè¿™ç±»è¡Œå†…å°æŒ‡æ ‡ç”¨å®ƒæ¸²æŸ“ï¼Œæ›¿æ¢æ­¤å‰çš„æ–‡æœ¬æ˜Ÿå·â€”â€”æ–‡æœ¬æ˜Ÿå·è§’æ›´å°–é”ï¼Œ
    // ä¸å¡ç‰‡/æŠ½å±‰çš„ SVG æ˜Ÿå¹¶æ’æ—¶æ˜æ˜¾ä¸åŒå½¢ï¼ˆç”¨æˆ·åé¦ˆåå…¨çº¿ç»Ÿä¸€ï¼‰ã€‚
    const StarGlyph = ({ size = 11, filled = true }) => h("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      fill: filled ? "currentColor" : "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinejoin: "round",
      style: { verticalAlign: "-1px" }
    }, h("path", { d: STAR_PATH_D, opacity: filled ? 1 : 0.35 }));

    // çƒ­åº¦å¾½ç« ï¼ˆé˜¶æ®µäºŒï¼‰ï¼šflame å›¾æ ‡ + æ•´æ•°ç™¾åˆ†æ¯”ï¼Œä¸‰æ¡£é…è‰²ï¼ˆçƒ­/æ¸©/å†·ï¼‰ã€‚
    // /list ä»…åœ¨ heatEnabled=true æ—¶ä¸‹å‘ heat å­—æ®µâ€”â€”ç¼ºçœå³ä¸æ¸²æŸ“ï¼Œå¼€å…³å…³é—­
    // æ—¶å¾½ç« å…¨ç«™è‡ªåŠ¨æ¶ˆå¤±ï¼Œå‰ç«¯æ— éœ€æ„ŸçŸ¥å¼€å…³çŠ¶æ€ã€‚
    const HeatBadge = ({ value, size = 12 }) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return null;
      const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
      const tier = pct >= 66 ? "hot" : pct >= 33 ? "warm" : "cold";
      return h("span", { className: `mneme-heat mneme-heat--${tier}`, title: `${pct}%` },
        h(Icon, { name: "flame", size, className: "mneme-heatico" }),
        h("span", { className: "mneme-heatpct" }, `${pct}%`));
    };

    /**
     * v0.8.0 A4ï¼ˆissue #17ï¼‰ï¼šscope æ ‡æ³¨å¾½ç« â€”â€”æ¡ç›®çš„å½’å±æ¥æºä¸€è¡Œæ‘˜è¦ã€‚
     *
     * ä»…åœ¨æ¡ç›®å¸¦ä»»ä¸€ scope æ ‡æ³¨ï¼ˆagent_scope / workspace_scope / sensitivityï¼‰
     * æ—¶æ¸²æŸ“ï¼›å­—æ®µç¼ºçœè¿”å› nullï¼ˆæœªæ ‡æ³¨æ¡ç›®è§†è§‰é›¶å˜åŒ–ï¼Œå‰ç«¯ä¸æ„ŸçŸ¥å¼€å…³çŠ¶æ€ï¼Œ
     * ä¸ HeatBadge çš„ã€Œæ•°æ®ç¼ºçœå³ä¸æ¸²æŸ“ã€åŒä¸€æ¨¡å¼ï¼‰ã€‚tooltip å±•ç¤ºå®Œæ•´å½’å±ï¼Œ
     * æ ‡ç­¾å¤ç”¨è¯¦æƒ…æŠ½å±‰çš„ i18n é”®ï¼ˆäº‘ç«¯å¤éªŒè§‚å¯Ÿç‚¹ï¼štooltip æ›¾ç¡¬ç¼–ç è‹±æ–‡ï¼‰ã€‚
     *
     * @param {{m: object, t: (key: string) => string}} props
     * @param {object} props.m è®°å¿†æ¡ç›®ï¼ˆ/listã€/search é€å‡ºçš„ toApiList å½¢çŠ¶ï¼Œ
     *   scope å››å­—æ®µæ¡ä»¶å­˜åœ¨ï¼‰
     * @param {(key: string) => string} props.t i18n å–è¯å‡½æ•°ï¼ˆè°ƒç”¨ç‚¹é—­åŒ…æä¾›ï¼‰
     * @returns {object|null} å¾½ç«  vnodeï¼›æ— ä»»ä½•æ ‡æ³¨æ—¶ä¸º null
     */
    const ScopeBadge = ({ m, t }) => {
      if (!m || (!m.agent_scope && !m.workspace_scope && !m.sensitivity)) return null;
      const tip = [
        m.agent_scope ? `${t("memory.explorer.detail.agentScope")}: ${m.agent_scope}` : null,
        m.workspace_scope ? `${t("memory.explorer.detail.workspaceScope")}: ${m.workspace_scope}` : null,
        m.sensitivity ? `${t("memory.explorer.detail.sensitivity")}: ${m.sensitivity}` : null
      ].filter(Boolean).join(" Â· ");
      return h("span", { className: "mneme-badge mneme-badge--scope", title: tip },
        t("memory.explorer.scopeBadge"));
    };

    // Unified API fetcher: attaches the optional apiToken (set in the settings
    // view, persisted in localStorage) as a Bearer header. When no token has
    // been configured the header is omitted and the API stays open (default).
    const API_TOKEN_KEY = "dsh-mneme-api-token";
    function apiFetch(path, opts = {}) {
      const token = (typeof window !== "undefined" && window.localStorage)
        ? window.localStorage.getItem(API_TOKEN_KEY) || ""
        : "";
      const headers = { ...(opts.headers || {}) };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(path, { ...opts, headers });
    }

    // Native settings page data plane: same-origin owner auth, never the panel
    // API token. Writes carry the explicit marker required by the Host.
    function adminFetch(path, opts = {}) {
      const headers = { "x-amadeus-memory": "1", ...(opts.headers || {}) };
      if (opts.body !== undefined && !headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      return fetch(`/api/amadeus-memory/admin${path}`, {
        credentials: "same-origin",
        ...opts,
        headers
      });
    }

    // Shared owner-admin JSON helper. It must live at module scope: both the
    // native settings section and the portaled full explorer (a sibling
    // component) call it. Keeping it inside AmadeusMemorySettings caused
    // ReferenceError: adminJson is not defined and crashed the slot entry.
    async function adminJson(path, opts = {}) {
      const res = await adminFetch(path, opts);
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) {
        const err = new Error(body.error || `HTTP ${res.status}`);
        err.candidates = Array.isArray(body.candidates) ? body.candidates : [];
        throw err;
      }
      return body.data;
    }

    // âš ï¸ 'betterSidebar' ç»ä¸èƒ½è¿›æ¨¡å—çº§ injectï¼ˆissue #88 å®é”¤ï¼‰ï¼šloader å¯¹
    // inject å£°æ˜çš„æœåŠ¡æ˜¯ç¡¬ç­‰å¾…â€”â€”æœªå®‰è£… better-sidebar çš„ç¯å¢ƒé‡Œæ•´ä¸ª entry
    // æ°¸è¿œ pendingï¼ˆ"1 entry did not activate" â†’ Failed to load pluginsï¼‰ã€‚
    // è½¯ä¾èµ–é å†…å±‚åŠ¨æ€å­æ’ä»¶æ¢æµ‹ï¼ˆè§ apply å†… better-sidebar æŒ‚è½½å—ï¼‰ã€‚
    const inject = ["slots", "locale", "configForms"];

    const NS = "memory";

    const dictionaries = {
      zh: {
        "memory.panel.empty": "æš‚æ— è®°å¿†æ¡ç›®",
        "memory.panel.open": "è®°å¿†",
        "memory.tab.all": "å…¨éƒ¨",
        "memory.tab.preference": "åå¥½",
        "memory.tab.project": "é¡¹ç›®",
        "memory.tab.decision": "å†³ç­–",
        "memory.tab.history": "å†å²",
        "memory.tab.summary": "å°ç»“",
        "memory.am.nav": "Amadeus è®°å¿†",
        "memory.am.title": "Amadeus Memory",
        "memory.am.subtitle": "æŸ¥çœ‹è®°å¿†åº“è¿è¡ŒçŠ¶æ€ï¼Œè°ƒæ•´è®°å¿†ä¸å‘é‡æ£€ç´¢è®¾ç½®ã€‚ä¸¥æ ¼åœºæ™¯æ¨¡å¼ä¸‹å¯åœ¨ä¸‹æ–¹æŒ‰åœºæ™¯æŸ¥çœ‹å›¾è°±ã€‚",
        "memory.am.loading": "æ­£åœ¨è¯»å–çŠ¶æ€â€¦",
        "memory.am.refresh": "åˆ·æ–°çŠ¶æ€",
        "memory.am.openPanel": "æ‰“å¼€å®Œæ•´è®°å¿†ç®¡ç†",
        "memory.am.section.overview": "è¿è¡Œæ¦‚è§ˆ",
        "memory.am.section.core": "è‡ªåŠ¨è®°å¿†ä¸æ•´ç†",
        "memory.am.section.config": "æ³¨å…¥ä¸è®°å¿†å‚æ•°",
        "memory.am.section.memories": "è®°å¿†ç®¡ç†",
        "memory.am.section.backup": "å¤‡ä»½ä¸æ¢å¤",
        "memory.am.default": "é»˜è®¤",
        "memory.am.range": "èŒƒå›´",
        "memory.am.unit.items": "æ¡",
        "memory.am.unit.chars": "å­—ç¬¦",
        "memory.am.unit.ms": "æ¯«ç§’",
        "memory.am.unit.minutes": "åˆ†é’Ÿ",
        "memory.am.unit.turns": "è½®",
        "memory.am.unit.score": "åˆ†æ•°",
        "memory.am.memory.search": "æœç´¢",
        "memory.am.memory.searchPlaceholder": "æ ‡é¢˜æˆ–æ­£æ–‡â€¦",
        "memory.am.memory.archived": "æ˜¾ç¤ºå½’æ¡£",
        "memory.am.memory.new": "æ–°å»ºè®°å¿†",
        "memory.am.memory.refresh": "åˆ·æ–°",
        "memory.am.memory.empty": "æ²¡æœ‰åŒ¹é…çš„è®°å¿†",
        "memory.am.memory.edit": "ç¼–è¾‘",
        "memory.am.memory.archive": "å½’æ¡£",
        "memory.am.memory.unarchive": "å–æ¶ˆå½’æ¡£",
        "memory.am.memory.delete": "åˆ é™¤",
        "memory.am.memory.deleteConfirm": "ç¡®è®¤æ°¸ä¹…åˆ é™¤è¿™æ¡è®°å¿†ï¼Ÿ",
        "memory.am.memory.deleteHint": "åˆ é™¤ä¸å¯æ’¤é”€ï¼›å»ºè®®å…ˆåˆ›å»ºå¤‡ä»½ã€‚",
        "memory.am.memory.confirmDelete": "ç¡®è®¤åˆ é™¤",
        "memory.am.memory.cancel": "å–æ¶ˆ",
        "memory.am.memory.save": "ä¿å­˜è®°å¿†",
        "memory.am.memory.saving": "ä¿å­˜ä¸­â€¦",
        "memory.am.memory.type": "ç±»å‹",
        "memory.am.memory.typeImmutable": "å·²æœ‰è®°å¿†çš„ç±»å‹ä¸å¯ä¿®æ”¹",
        "memory.am.memory.title": "æ ‡é¢˜",
        "memory.am.memory.content": "æ­£æ–‡",
        "memory.am.memory.importance": "é‡è¦åº¦ï¼ˆ1â€“5ï¼‰",
        "memory.am.memory.tags": "æ ‡ç­¾ï¼ˆè‹±æ–‡é€—å·åˆ†éš”ï¼‰",
        "memory.am.memory.tagsHint": "æ™®é€šæ ‡ç­¾å¯æ‰‹å·¥ç¼–è¾‘ï¼›å—ä¿æŠ¤çš„äº‹ä»¶æ ‡ç­¾æ— æ³•é€šè¿‡æ™®é€šç®¡ç†ä¼ªé€ ã€‚",
        "memory.am.memory.tagsPlaceholder": "é¡¹ç›®, å·¥ä½œ",
        "memory.am.memory.type.preference": "åå¥½",
        "memory.am.memory.type.project": "é¡¹ç›®",
        "memory.am.memory.type.decision": "å†³ç­–",
        "memory.am.memory.type.history": "å†å²",
        "memory.am.memory.type.summary": "æ‘˜è¦",
        "memory.am.memory.type.pattern": "æ¨¡å¼",
        "memory.am.memory.type.rejected_solution": "è¢«æ‹’æ–¹æ¡ˆ",
        "memory.am.memory.type.pitfall": "æ•™è®­",
        "memory.am.memory.type.constraint": "çº¦æŸ",
        "memory.am.memory.titleRequired": "æ ‡é¢˜ä¸èƒ½ä¸ºç©º",
        "memory.am.memory.contentRequired": "æ­£æ–‡ä¸èƒ½ä¸ºç©º",
        "memory.am.memory.saved": "è®°å¿†å·²ä¿å­˜",
        "memory.am.memory.created": "è®°å¿†å·²åˆ›å»º",
        "memory.am.memory.merged": "å·²å¹¶å…¥åŒæ ‡é¢˜è®°å¿†",
        "memory.am.memory.autoArchived": "å·²åˆ›å»ºï¼Œä½†è´¨é‡è¿‡æ»¤å°†å…¶å½’æ¡£ï¼›æ‰“å¼€â€œæ˜¾ç¤ºå½’æ¡£â€åå¯æ¢å¤ã€‚",
        "memory.am.memory.core": "æ ¸å¿ƒè®°å¿†ï¼ˆå—ä¿æŠ¤ï¼‰",
        "memory.am.memory.coreHint": "å—ä¿æŠ¤è®°å¿†ä¸ä¼šè¢«è‡ªåŠ¨å½’æ¡£ã€é—å¿˜ã€åˆå¹¶æˆ–åˆ é™¤ï¼›è§£é™¤ä¿æŠ¤åæ‰èƒ½åˆ é™¤ã€‚",
        "memory.am.memory.coreNote": "ç¬¬ä¸€äººç§°çŸ­è®°ï¼ˆå¯é€‰ï¼‰",
        "memory.am.memory.coreBadge": "æ ¸å¿ƒ",
        "memory.am.memory.coreSaved": "æ ¸å¿ƒä¿æŠ¤çŠ¶æ€å·²æ›´æ–°",
        "memory.am.scene.title": "åœºæ™¯ä¸è¿‘æœŸä¸Šä¸‹æ–‡",
        "memory.am.scene.isolation": "åœºæ™¯éš”ç¦»",
        "memory.am.scene.strict": "ä¸¥æ ¼ QQ æ¨¡å¼",
        "memory.am.scene.hostUnavailable": "å¯ä¿¡ Host ä¸å¯ç”¨ï¼šè·¨åœºæ™¯å…±äº«ä¿æŒå…³é—­ï¼ˆå®‰å…¨é™çº§ï¼‰",
        "memory.am.scene.current": "å½“å‰åœºæ™¯",
        "memory.am.scene.unknownPolicy": "æ— æ¥æºæ—§è®°å¿†ï¼šä¸è§†ä¸ºå…¬å…±ï¼›æœ‰åœºæ™¯æ ‡è®°çš„è®°å¿†é»˜è®¤éšè—",
        "memory.am.scene.legacyNote": "æœªæ ‡è®°æ¥æºçš„æ—§è®°å¿†æå‡ä¸ºæ ¸å¿ƒåä»ä¿æŒæœªæ ‡è®°ï¼›åœ¨åŸæœ‰æ¨¡å¼ä¸‹å¯èƒ½è¢«å…¶ä»–ä¼šè¯è¯»å–ï¼Œä¸èƒ½è§†ä¸ºç§å¯†è®°å¿†",
        "memory.am.scene.legacy": "legacy/æœªæ ‡æ³¨",
        "memory.am.scene.grants": "å·²æˆæƒè¯»å–å…³ç³»",
        "memory.am.scene.noGrants": "æ²¡æœ‰è·¨åœºæ™¯æˆæƒ",
        "memory.am.scene.degraded": "ä¸¥æ ¼ Scene æ¨¡å¼ä¸‹ï¼Œæ™®é€šå›¾è°±/èº«ä»½/åå¥½è¯»å–å—é™ï¼Œç®¡ç†å‘˜åœºæ™¯å›¾è°±ä»å¯ç”¨ï¼›å·²å¯ç”¨çš„ autoDream/Sleep æŒ‰æŒä¹…åŒ– Scene åˆ†æ‰¹è¿è¡Œã€‚",
        "memory.am.recent.title": "è¿‘æœŸä¸Šä¸‹æ–‡",
        "memory.am.recent.enabled": "å·²å¯ç”¨",
        "memory.am.recent.disabled": "æœªå¯ç”¨",
        "memory.am.recent.ttl": "ä¿ç•™æ—¶é•¿ï¼ˆåˆ†é’Ÿï¼‰",
        "memory.am.recent.count": "ç¼“å†²äº‹ä»¶æ•°",
        "memory.am.recent.clear": "æ¸…ç©ºè¿‘æœŸç¼“å†²",
        "memory.am.recent.cleared": "è¿‘æœŸç¼“å†²å·²æ¸…ç©º",
        "memory.am.workspace.title": "å·¥ä½œåŒº",
        "memory.am.workspace.hint": "Amadeus Memory åŒä¸€æ—¶é—´åªä½¿ç”¨ä¸€ä¸ªå·¥ä½œåŒºã€‚åˆ‡æ¢ä¼šç«‹å³åœæ­¢æ—§å·¥ä½œåŒºæä¾›æ¨¡å‹è®°å¿†ï¼›æ—§æ•°æ®ä¿ç•™ï¼Œé‡å¯æˆ–é‡è½½æ’ä»¶åæ–°å·¥ä½œåŒºæ‰ä¼šç”Ÿæ•ˆã€‚",
        "memory.am.workspace.selectLabel": "é€‰æ‹©å·¥ä½œåŒº",
        "memory.am.workspace.choose": "è¯·é€‰æ‹©ä¸€ä¸ªå·¥ä½œåŒºâ€¦",
        "memory.am.workspace.none": "å°šæœªé€‰æ‹©å·¥ä½œåŒº",
        "memory.am.workspace.untitled": "æœªå‘½åå·¥ä½œåŒº",
        "memory.am.workspace.sessions": "Session æ•°",
        "memory.am.workspace.selected": "å·²é€‰æ‹©",
        "memory.am.workspace.active": "å½“å‰è¿è¡Œ",
        "memory.am.workspace.activeNone": "è¿è¡Œæ—¶å°šæœªç»‘å®šå·¥ä½œåŒº",
        "memory.am.workspace.selectedUnknown": "å·²é€‰æ‹©çš„å·¥ä½œåŒºä¸åœ¨å½“å‰æ³¨å†Œè¡¨ä¸­",
        "memory.am.workspace.pendingBadge": "å¾…é‡å¯",
        "memory.am.workspace.pending": "é€‰æ‹©å·²ä¿å­˜ã€‚é‡å¯æˆ–é‡è½½ Amadeus Memory æ’ä»¶åï¼Œæ–°å·¥ä½œåŒºæ‰ä¼šæ¿€æ´»ï¼›å½“å‰è¿è¡Œæ—¶ä»æŒ‡å‘æ—§å·¥ä½œåŒºï¼Œå¹¶ä¼šç«‹å³æ‹’ç»æ¨¡å‹è®°å¿†æ“ä½œã€‚æ—§å·¥ä½œåŒºæ•°æ®æœªè¢«åˆ é™¤æˆ–è¿ç§»ã€‚",
        "memory.am.workspace.save": "ä¿å­˜é€‰æ‹©",
        "memory.am.workspace.saving": "ä¿å­˜ä¸­â€¦",
        "memory.am.workspace.cancel": "å–æ¶ˆ",
        "memory.am.workspace.sameSelection": "å·²æ˜¯å½“å‰é€‰æ‹©ï¼Œæ— éœ€ä¿å­˜ã€‚",
        "memory.am.workspace.invalidSelection": "æ‰€é€‰å·¥ä½œåŒºä¸åœ¨å½“å‰æ³¨å†Œè¡¨ä¸­ï¼Œè¯·é‡æ–°é€‰æ‹©ã€‚",
        "memory.am.workspace.registryUnavailable": "å·¥ä½œåŒºæ³¨å†Œè¡¨ä¸å¯ç”¨ï¼Œæš‚æ—¶æ— æ³•åˆ‡æ¢æˆ–ä¿å­˜ã€‚",
        "memory.am.workspace.registryEmpty": "å½“å‰å·¥ä½œåŒºæ³¨å†Œè¡¨ä¸ºç©ºï¼Œæš‚æ—¶æ²¡æœ‰å¯é€‰æ‹©çš„é¡¹ç›®ã€‚",
        "memory.am.workspace.reason": "åŸå› ä»£ç ",
        "memory.am.workspace.loadFailed": "è¯»å–å·¥ä½œåŒºå¤±è´¥",
        "memory.am.workspace.saveFailed": "ä¿å­˜å·¥ä½œåŒºé€‰æ‹©å¤±è´¥",
        "memory.am.workspace.savedPending": "å·²ä¿å­˜ï¼›é‡å¯æˆ–é‡è½½æ’ä»¶åç”Ÿæ•ˆã€‚",
        "memory.am.workspace.savedNoChange": "é€‰æ‹©æœªå˜åŒ–ï¼Œæ— éœ€é‡å¯ã€‚",
        "memory.am.workspace.confirmTitle": "ç¡®è®¤åˆ‡æ¢å·¥ä½œåŒºï¼Ÿ",
        "memory.am.workspace.confirmTarget": "å°†é€‰æ‹©â€œ{title}â€ã€‚",
        "memory.am.workspace.confirmStop": "ä¿å­˜åï¼Œå½“å‰è¿è¡Œæ—¶ä¼šç«‹å³åœæ­¢ä¸ºæ—§å·¥ä½œåŒºæä¾›æ¨¡å‹è®°å¿†ã€‚",
        "memory.am.workspace.confirmRetained": "æ—§å·¥ä½œåŒºçš„æ•°æ®ä¼šä¿ç•™ï¼Œä¸ä¼šè¢«åˆ é™¤ã€åˆå¹¶æˆ–è¿ç§»ã€‚",
        "memory.am.workspace.confirmRestart": "å¿…é¡»é‡å¯æˆ–é‡è½½ Amadeus Memory æ’ä»¶ï¼Œæ–°å·¥ä½œåŒºæ‰ä¼šç”Ÿæ•ˆï¼›ä¿å­˜ä¸ä¼šè‡ªåŠ¨åˆ‡æ¢å½“å‰è¿è¡Œæ—¶ã€‚",
        "memory.am.workspace.confirmAction": "ç¡®è®¤åˆ‡æ¢",
        "memory.am.recentActivity.title": "è·¨ä¼šè¯è¿‘æœŸåŠ¨æ€",
        "memory.am.recentActivity.hint": "æŒ‰ Workspace éš”ç¦»ï¼šSession å¯é€‰æ‹©æ˜¯å¦å‚ä¸ï¼Œå¹¶å†³å®šè¿‘æœŸæ‘˜è¦çš„å…±äº«èŒƒå›´ã€‚é¢„è§ˆå§‹ç»ˆç”±æœåŠ¡å™¨æŒ‰ç›®æ ‡ Session çš„æƒé™è¿‡æ»¤ã€‚",
        "memory.am.recentActivity.summaryTitle": "è¿‘æœŸåŠ¨æ€æ¦‚è§ˆ",
        "memory.am.recentActivity.workspaceSelected": "å·²é€‰æ‹© Workspace",
        "memory.am.recentActivity.workspaceActive": "è¿è¡Œä¸­ Workspace",
        "memory.am.recentActivity.workspaceNone": "å°šæœªé€‰æ‹©å·¥ä½œåŒº",
        "memory.am.recentActivity.enabled": "å·²å¯ç”¨",
        "memory.am.recentActivity.disabled": "å·²åœç”¨",
        "memory.am.recentActivity.configuredOn": "é…ç½®ä¸ºå¯ç”¨",
        "memory.am.recentActivity.configuredOff": "é…ç½®ä¸ºåœç”¨",
        "memory.am.recentActivity.pendingBadge": "å¾…é‡å¯",
        "memory.am.recentActivity.pending": "é…ç½®å·²ä¿å­˜ï¼Œä½†å½“å‰è¿è¡Œæ—¶å°šæœªåˆ‡æ¢ï¼›é‡å¯æˆ–é‡è½½ Amadeus Memory æ’ä»¶åå®Œå…¨ç”Ÿæ•ˆã€‚",
        "memory.am.recentActivity.participating": "å‚ä¸ Session",
        "memory.am.recentActivity.summaries": "æ‘˜è¦æ¡æ•°",
        "memory.am.recentActivity.lastUpdated": "æœ€åæ›´æ–°",
        "memory.am.recentActivity.storage": "è¿‘ä¼¼å ç”¨",
        "memory.am.recentActivity.injectionBudget": "æ³¨å…¥é¢„ç®—",
        "memory.am.recentActivity.previewTokens": "ä¼°ç®—æ³¨å…¥ Token",
        "memory.am.recentActivity.policyCount": "å·²ä¿å­˜ç­–ç•¥",
        "memory.am.recentActivity.sources": "æ¥æºåˆ†å¸ƒ",
        "memory.am.recentActivity.never": "ä»æœªæ›´æ–°",
        "memory.am.recentActivity.unknown": "æœªçŸ¥",
        "memory.am.recentActivity.sessionsTitle": "Session å‚ä¸ä¸å…±äº«",
        "memory.am.recentActivity.sessionsHint": "åˆ—è¡¨æ¥è‡ª owner APIã€‚å¯æŒ‰æ ‡é¢˜æˆ–ç¨³å®š Session ID è¿‡æ»¤ï¼›ç‚¹å‡»ä¸€è¡Œç¼–è¾‘ã€‚",
        "memory.am.recentActivity.searchLabel": "æœç´¢ Session",
        "memory.am.recentActivity.searchPlaceholder": "æŒ‰æ ‡é¢˜æˆ–ç²¾ç¡® Session ID è¿‡æ»¤",
        "memory.am.recentActivity.sessionsEmpty": "å½“å‰ Workspace æ²¡æœ‰å¯ç®¡ç†çš„ Sessionã€‚",
        "memory.am.recentActivity.searchEmpty": "æ²¡æœ‰åŒ¹é…çš„ Sessionã€‚",
        "memory.am.recentActivity.sessionId": "ç¨³å®š ID",
        "memory.am.recentActivity.lastActive": "æœ€è¿‘æ´»åŠ¨",
        "memory.am.recentActivity.participatingBadge": "å‚ä¸ä¸­",
        "memory.am.recentActivity.pausedBadge": "å·²æš‚åœ",
        "memory.am.recentActivity.modeSelf": "ä»…è‡ªå·±",
        "memory.am.recentActivity.modeOwner": "ä»… Owner",
        "memory.am.recentActivity.modeShared": "æŒ‡å®š Session",
        "memory.am.recentActivity.modeOwnerGated": "ï¼ˆæœåŠ¡å™¨ç¡®è®¤ç»‘å®šåç”Ÿæ•ˆï¼‰",
        "memory.am.recentActivity.detailTitle": "Session å…±äº«è®¾ç½®",
        "memory.am.recentActivity.detailHint": "ä¿å­˜åªæäº¤æ­¤ Session çš„ç²¾ç¡®ç­–ç•¥ï¼›æƒé™ä»ç”±æœåŠ¡å™¨æ‰§è¡Œã€‚",
        "memory.am.recentActivity.participation": "å‚ä¸è·¨ä¼šè¯è¿‘æœŸåŠ¨æ€",
        "memory.am.recentActivity.participationHint": "å…³é—­åï¼Œæ­¤ Session ä¸å†å†™å…¥æˆ–è¯»å–è·¨ Session è¿‘æœŸæ‘˜è¦ã€‚",
        "memory.am.recentActivity.modeLabel": "å…±äº«æ¨¡å¼",
        "memory.am.recentActivity.modeSelfHint": "åªä¿ç•™ç»™è‡ªå·±ï¼Œä¸æä¾›ç»™å…¶ä»– Sessionã€‚",
        "memory.am.recentActivity.modeOwnerHint": "ä»…åœ¨æœåŠ¡å™¨ç¡®è®¤å¯ä¿¡ Owner ç»‘å®šæ—¶æä¾›ç»™ Owner ç›®æ ‡ï¼›å¦åˆ™å®‰å…¨é™çº§ã€‚",
        "memory.am.recentActivity.modeSharedHint": "åªæä¾›ç»™ä¸‹æ–¹å‹¾é€‰çš„ Sessionã€‚",
        "memory.am.recentActivity.ownerDegraded": "å½“å‰çŠ¶æ€æœªå£°æ˜å¯ä¿¡ Owner ç»‘å®šã€‚Owner æ¨¡å¼ç”±æœåŠ¡å™¨å®‰å…¨é™çº§ï¼›ç•Œé¢ä¸ä¼šæŠŠå®ƒæ˜¾ç¤ºä¸ºå·²ç”Ÿæ•ˆã€‚",
        "memory.am.recentActivity.sharedLabel": "å…±äº«ç»™ï¼ˆç²¾ç¡® Session IDï¼‰",
        "memory.am.recentActivity.sharedHint": "ä»…å‹¾é€‰çš„å…¶ä»– Session å¯è¯»å–æ­¤ Session çš„è¿‘æœŸæ‘˜è¦ï¼›åˆ—è¡¨æœ‰ä¸Šé™ã€‚",
        "memory.am.recentActivity.sharedEmpty": "æ²¡æœ‰å…¶ä»–å¯é€‰ Sessionã€‚",
        "memory.am.recentActivity.sharedUnknown": "æ—¢æœ‰ä½†å½“å‰åˆ—è¡¨ä¸å¯ç”¨çš„ Sessionï¼ˆä¿ç•™ç²¾ç¡® IDï¼‰",
        "memory.am.recentActivity.sharedSelected": "å·²é€‰ {count} ä¸ª Session",
        "memory.am.recentActivity.sharedLimit": "å…±äº« Session æœ€å¤š 32 ä¸ªã€‚",
        "memory.am.recentActivity.savePolicy": "ä¿å­˜å…±äº«è®¾ç½®",
        "memory.am.recentActivity.saving": "ä¿å­˜ä¸­â€¦",
        "memory.am.recentActivity.policySaved": "å…±äº«è®¾ç½®å·²ä¿å­˜ï¼Œé¢„è§ˆå·²åˆ·æ–°ã€‚",
        "memory.am.recentActivity.policyInvalid": "è¯·æ£€æŸ¥ Session å…±äº«è®¾ç½®åå†ä¿å­˜ã€‚",
        "memory.am.recentActivity.policyModeInvalid": "è¯·é€‰æ‹©æœ‰æ•ˆçš„å…±äº«æ¨¡å¼ã€‚",
        "memory.am.recentActivity.policySharedInvalid": "å…±äº«åˆ—è¡¨åŒ…å«æ— æ•ˆã€é‡å¤æˆ–è¿‡å¤šçš„ Session IDã€‚",
        "memory.am.recentActivity.selectSession": "é€‰æ‹©ä¸€ä¸ª Session ä»¥ç¼–è¾‘ã€‚",
        "memory.am.recentActivity.closeDetail": "æ”¶èµ·è®¾ç½®",
        "memory.am.recentActivity.previewTitle": "æœåŠ¡å™¨æƒé™é¢„è§ˆ",
        "memory.am.recentActivity.previewHint": "é¢„è§ˆä»¥ç›®æ ‡ Session çš„æƒé™åœ¨æœåŠ¡å™¨è¿‡æ»¤ï¼Œä»…è¿”å›å®‰å…¨æ‘˜è¦ï¼Œä¸æ˜¾ç¤ºåŸå§‹å¯¹è¯ã€‚",
        "memory.am.recentActivity.previewTarget": "é¢„è§ˆç›®æ ‡ Session",
        "memory.am.recentActivity.previewChoose": "é€‰æ‹©è¦é¢„è§ˆçš„ Sessionâ€¦",
        "memory.am.recentActivity.previewRefresh": "åˆ·æ–°é¢„è§ˆ",
        "memory.am.recentActivity.previewEmpty": "æ­¤ç›®æ ‡æš‚æ— å¯è§çš„è¿‘æœŸæ‘˜è¦ã€‚",
        "memory.am.recentActivity.previewDenied": "æœåŠ¡å™¨æœªæˆæƒæ­¤é¢„è§ˆã€‚",
        "memory.am.recentActivity.previewTruncated": "ç»“æœå·²æŒ‰æ¡æ•°æˆ– Token é¢„ç®—æˆªæ–­ã€‚",
        "memory.am.recentActivity.previewCount": "æ¡æ•°",
        "memory.am.recentActivity.previewEstimated": "ä¼°ç®— Token",
        "memory.am.recentActivity.previewSource": "æ¥æº",
        "memory.am.recentActivity.kindConversation": "å¯¹è¯æ‘˜è¦",
        "memory.am.recentActivity.kindAgentAction": "ä»£ç†æ“ä½œæ‘˜è¦",
        "memory.am.recentActivity.configTitle": "å…¨å±€é…ç½®",
        "memory.am.recentActivity.configHint": "è¿™äº›å¼€å…³åªå½±å“å½“å‰ Workspace çš„è¿‘æœŸåŠ¨æ€ï¼›ä¸ä¼šæ›´æ”¹ Session çƒ­è®°å¿†ã€‚",
        "memory.am.recentActivity.featureEnabled": "å¯ç”¨è·¨ä¼šè¯è¿‘æœŸåŠ¨æ€",
        "memory.am.recentActivity.ttlLabel": "ä¿ç•™æ—¶é•¿",
        "memory.am.recentActivity.ttl1": "1 å°æ—¶",
        "memory.am.recentActivity.ttl6": "6 å°æ—¶",
        "memory.am.recentActivity.ttl24": "24 å°æ—¶",
        "memory.am.recentActivity.ttl72": "72 å°æ—¶",
        "memory.am.recentActivity.autoInject": "è‡ªåŠ¨æ³¨å…¥è¿‘æœŸåŠ¨æ€",
        "memory.am.recentActivity.autoInjectHint": "åœ¨æˆæƒæ–¹å‘è‡ªåŠ¨æ³¨å…¥æœåŠ¡å™¨è¿‡æ»¤åçš„è¿‘æœŸæ‘˜è¦ï¼›ä¸ä¼šæ³¨å…¥åŸå§‹å¯¹è¯ã€‚",
        "memory.am.recentActivity.maxItems": "æœ€å¤šæ‘˜è¦æ¡æ•°ï¼ˆ1â€“10ï¼‰",
        "memory.am.recentActivity.maxTokens": "Token é¢„ç®—ï¼ˆ100â€“800ï¼‰",
        "memory.am.recentActivity.validationEnabled": "è¯·é€‰æ‹©æ˜¯å¦å¯ç”¨ã€‚",
        "memory.am.recentActivity.validationTtl": "ä¿ç•™æ—¶é•¿å¿…é¡»æ˜¯ 1ã€6ã€24 æˆ– 72 å°æ—¶ã€‚",
        "memory.am.recentActivity.validationAutoInject": "è¯·é€‰æ‹©æ˜¯å¦è‡ªåŠ¨æ³¨å…¥ã€‚",
        "memory.am.recentActivity.validationMaxItems": "æ‘˜è¦æ¡æ•°å¿…é¡»æ˜¯ 1â€“10 çš„æ•´æ•°ã€‚",
        "memory.am.recentActivity.validationMaxTokens": "Token é¢„ç®—å¿…é¡»æ˜¯ 100â€“800 çš„æ•´æ•°ã€‚",
        "memory.am.recentActivity.saveConfig": "ä¿å­˜å…¨å±€é…ç½®",
        "memory.am.recentActivity.configSaved": "å…¨å±€é…ç½®å·²ä¿å­˜ã€‚",
        "memory.am.recentActivity.configPendingSaved": "å…¨å±€é…ç½®å·²ä¿å­˜ï¼›é‡å¯æˆ–é‡è½½æ’ä»¶åå®Œå…¨ç”Ÿæ•ˆã€‚",
        "memory.am.recentActivity.strategyTitle": "æ‘˜è¦ç­–ç•¥ï¼ˆå›ºå®šã€ç¡®å®šæ€§ï¼‰",
        "memory.am.recentActivity.strategy": "æ¯ä¸ªå·²å®Œæˆçš„å¯¹è¯è½®æ¬¡ç»“æŸåï¼ŒæœåŠ¡å™¨æŒ‰å›ºå®šè§„åˆ™ç¡®å®šæ€§ç”Ÿæˆå—é•¿åº¦çº¦æŸçš„æ‘˜è¦ï¼›ä¸è°ƒç”¨æ¨¡å‹è‡ªç”±ç”Ÿæˆï¼Œä¸è¿”å›åŸå§‹å¯¹è¯ã€‚",
        "memory.am.recentActivity.loadFailed": "è¯»å–è·¨ä¼šè¯è¿‘æœŸåŠ¨æ€å¤±è´¥",
        "memory.am.recentActivity.saveFailed": "ä¿å­˜è·¨ä¼šè¯è¿‘æœŸåŠ¨æ€è®¾ç½®å¤±è´¥",
        "memory.am.recentActivity.previewFailed": "è¯»å–é¢„è§ˆå¤±è´¥",
        "memory.am.recentActivity.backendError": "æœåŠ¡å™¨è¿”å›é”™è¯¯ï¼›æœªæ˜¾ç¤ºå¯èƒ½åŒ…å«è·¯å¾„æˆ–æ•æ„Ÿä¿¡æ¯çš„è¯¦æƒ…ã€‚",
        "memory.am.recentActivity.reasonSourceDisabled": "ç›®æ ‡ Session å·²æš‚åœå‚ä¸",
        "memory.am.recentActivity.reasonAccessDenied": "æœåŠ¡å™¨æ‹’ç»è®¿é—®æ­¤ Session",
        "memory.am.recentActivity.reasonInvalidPolicy": "ç­–ç•¥æ— æ•ˆæˆ–ä¸å¯è¯»",
        "memory.am.recentActivity.reasonMissingSession": "ç¼ºå°‘ç›®æ ‡ Session ID",
        "memory.am.recentActivity.reasonUnavailable": "è¿‘æœŸåŠ¨æ€å­˜å‚¨æš‚ä¸å¯ç”¨",
        "memory.am.recentActivity.reasonUnknown": "æœªè¯†åˆ«çš„å®‰å…¨åŸå› ä»£ç ",
        "memory.am.graph.title": "åœºæ™¯çŸ¥è¯†å›¾è°±ï¼ˆåªè¯»ï¼‰",
        "memory.am.graph.scope": "é€‰æ‹©åœºæ™¯",
        "memory.am.graph.choose": "è¯·é€‰æ‹©åœºæ™¯",
        "memory.am.graph.chooseHint": "é€‰æ‹©ä¸€ä¸ªåœºæ™¯æŸ¥çœ‹è¯¥åœºæ™¯çš„å®ä½“ä¸å…³ç³»ï¼›ä¸ä¼šåˆå¹¶å…¶ä»–åœºæ™¯ã€‚",
        "memory.am.graph.empty": "è¯¥åœºæ™¯æ²¡æœ‰å¯æ˜¾ç¤ºçš„å®ä½“è¯æ®",
        "memory.am.graph.truncated": "ç»“æœå·²æˆªæ–­ï¼›è¯·ç¼©å°åœºæ™¯æˆ–ä½¿ç”¨æ›´å°çš„èŒƒå›´ã€‚",
        "memory.am.graph.nodes": "èŠ‚ç‚¹",
        "memory.am.graph.edges": "å…³ç³»",
        "memory.am.graph.relations": "å…³ç³»åˆ—è¡¨",
        "memory.am.graph.noRelations": "æ²¡æœ‰å…³ç³»è¯æ®",
        "memory.am.graph.related": "ç›¸å…³è®°å¿†",
        "memory.am.graph.overview": "å›¾ä¸­å±•ç¤ºå‰ {shown}/{total} ä¸ªèŠ‚ç‚¹ï¼›å®Œæ•´èŠ‚ç‚¹åˆ—è¡¨è§ä¸‹",
        "memory.am.graph.nodesList": "èŠ‚ç‚¹åˆ—è¡¨ï¼ˆé”®ç›˜å¯é€‰æ‹©ï¼‰",
        "memory.am.graph.search": "æœç´¢èŠ‚ç‚¹",
        "memory.am.graph.searchPlaceholder": "æŒ‰åç§°æˆ–ç±»å‹ç­›é€‰",
        "memory.am.graph.searchClear": "æ¸…é™¤æœç´¢",
        "memory.am.graph.searchEmpty": "æ²¡æœ‰åŒ¹é…çš„èŠ‚ç‚¹",
        "memory.am.graph.focused": "å½“å‰èšç„¦",
        "memory.explorer.title": "å®Œæ•´è®°å¿†æµè§ˆå™¨",
        "memory.explorer.close": "å…³é—­",
        "memory.explorer.all": "å…¨éƒ¨",
        "memory.explorer.allScenes": "å…¨éƒ¨åœºæ™¯",
        "memory.explorer.scopeHint": "é€‰æ‹©ä¸€ä¸ªæˆ–å¤šä¸ªåœºæ™¯ä¼šæ”¶çª„ç»“æœï¼›ç©ºé€‰è¡¨ç¤ºå…¨éƒ¨ã€‚",
        "memory.explorer.keyword": "å…³é”®è¯æœç´¢",
        "memory.explorer.searchPlaceholder": "æ ‡é¢˜/å†…å®¹/æ ‡ç­¾å…³é”®å­—",
        "memory.explorer.type": "ç±»å‹",
        "memory.explorer.allTypes": "å…¨éƒ¨ç±»å‹",
        "memory.explorer.minImportance": "æœ€ä½é‡è¦æ€§",
        "memory.explorer.date": "æ—¶é—´",
        "memory.explorer.archived": "ä»…å½’æ¡£",
        "memory.explorer.cards": "å¡ç‰‡",
        "memory.explorer.scene": "åœºæ™¯",
        "memory.explorer.editTitle": "æ ‡é¢˜",
        "memory.explorer.editContent": "å†…å®¹",
        "memory.explorer.prev": "ä¸Šä¸€é¡µ",
        "memory.explorer.next": "ä¸‹ä¸€é¡µ",
        "memory.explorer.hop1": "1 è·³",
        "memory.explorer.hop2": "2 è·³",
        "memory.explorer.hops": "è·³æ•°",
        "memory.explorer.reset": "é‡ç½®",
        "memory.explorer.statusOverview": "è¿è¡Œæ¦‚è§ˆ",
        "memory.explorer.conflicts": "å¾…ç¡®è®¤å†²çª",
        "memory.explorer.dreamRuns": "Dream è¿è¡Œ",
        "memory.explorer.audit7d": "è¿‘ 7 å¤©ç”¨é‡",
        "memory.explorer.tokenShare": "æŒ‰æ“ä½œçš„ Token å æ¯”",
        "memory.explorer.requests": "è¯·æ±‚",
        "memory.explorer.tokens": "Token",
        "memory.explorer.noData": "æš‚æ— çœŸå®æ•°æ®",
        "memory.explorer.acl": "è¯»ç™½åå•ï¼ˆæ–¹å‘æ€§ï¼‰",
        "memory.explorer.aclHint": "å…è®¸ä¸€ä¸ª QQ ç¾¤è¯»å–å¦ä¸€ä¸ªåŒ bot ç¾¤çš„é•¿è®°å¿†ï¼›åªè¯»ã€ä¸ä¼ é€’ã€ä¸å«ç§èŠ/æ—§æ•°æ®ã€‚æµè§ˆå™¨é€‰æ‹©ä¸ä¼šç›´æ¥æˆæƒã€‚",
        "memory.explorer.aclEmpty": "æš‚æ— æ‰‹åŠ¨æˆæƒ",
        "memory.explorer.revoke": "æ’¤é”€",
        "memory.explorer.reader": "è¯»å–æ–¹ç¾¤",
        "memory.explorer.grant": "æˆäºˆè¯»å–",
        "memory.explorer.bot": "æœºå™¨äºº QQ å·",
        "memory.explorer.readerGroup": "è¯»å–æ–¹ç¾¤å·",
        "memory.explorer.sourceGroup": "æ¥æºæ–¹ç¾¤å·",
        "memory.explorer.aclDirection": "ç¾¤ {reader} å¯è¯»å–ç¾¤ {source} çš„é•¿æœŸè®°å¿†",
        "memory.am.tabs.memory": "è®°å¿†",
        "memory.am.tabs.entities": "å®ä½“",
        "memory.am.tabs.status": "çŠ¶æ€",
        "memory.am.tabs.settings": "è®¾ç½®",
        "memory.am.memoryView.longTerm": "é•¿æœŸè®°å¿†",
        "memory.am.memoryView.recent": "è·¨ä¼šè¯è¿‘æœŸåŠ¨æ€",
        "memory.am.settings.general": "åŸºç¡€",
        "memory.am.settings.personalization": "ä¸ªæ€§åŒ–",
        "memory.personalization.profile": "ç”¨æˆ·ç”»åƒ",
        "memory.personalization.profileHint": "ç”»åƒä¸è§„åˆ™ç”±å½“å‰ owner è®¾ç½®ç›´æ¥è¯»å–ï¼›ä¿å­˜åä¸‹ä¸€æ¬¡æ³¨å…¥ç”Ÿæ•ˆã€‚",
        "memory.personalization.defaultCard": "é»˜è®¤äººæ ¼å¡",
        "memory.personalization.agentCards": "æŒ‰ Agent çš„äººæ ¼å¡",
        "memory.personalization.name": "åç§°",
        "memory.personalization.personality": "äººæ ¼",
        "memory.personalization.replyStyle": "å›å¤é£æ ¼",
        "memory.personalization.enabled": "å¯ç”¨",
        "memory.personalization.preview": "å®é™…æ³¨å…¥é¢„è§ˆ",
        "memory.personalization.previewHint": "ç”±æœåŠ¡ç«¯ä¸æ³¨å…¥å™¨åŒä¸€æ¸²æŸ“å‡½æ•°äº§å‡ºï¼›ä»…å±•ç¤ºç”»åƒ/äººæ ¼/è§„åˆ™ï¼Œä¸å«è·¨åœºæ™¯è®°å¿†æ­£æ–‡ã€‚",
        "memory.personalization.saveProfile": "ä¿å­˜ç”»åƒ",
        "memory.personalization.savePersona": "ä¿å­˜äººæ ¼å¡",
        "memory.personalization.saved": "ä¸ªæ€§åŒ–è®¾ç½®å·²ä¿å­˜",
        "memory.am.settings.retrieval": "æ£€ç´¢",
        "memory.am.settings.scene": "åœºæ™¯",
        "memory.am.settings.backup": "å¤‡ä»½",
        "memory.am.settings.acl": "è®¿é—®ç™½åå•",
        "memory.am.recent.hotTitle": "Session çƒ­è®°å¿†",
        "memory.am.recent.hotHint": "å½“å‰ Session æœ€è¿‘å‡ è½®åŸæ–‡ï¼Œä»…å­˜äºå†…å­˜å¹¶éš Session ç”Ÿå‘½å‘¨æœŸæ¶ˆå¤±ï¼›ä¸æ˜¯ SQLite è®°å¿†ï¼Œowner API æ— æ³•æšä¸¾æˆ–åˆ—å‡ºå…¶å†…å®¹ã€‚",
        "memory.am.recent.hotState": "çƒ­è®°å¿†æ³¨å…¥",
        "memory.am.recent.trustedTitle": "å¯ä¿¡ Scene è¿‘æœŸä¸Šä¸‹æ–‡",
        "memory.am.recent.trustedHint": "10 åˆ†é’Ÿ TTL çš„è¿›ç¨‹å†…ç¼“å†²ï¼›ç®¡ç†å‘˜å¯æŸ¥çœ‹å„ Scene çš„äº‹ä»¶æ•°ï¼Œä¸è¿”å›åŸæ–‡ã€‚",
        "memory.am.entitiesHint": "å•åœºæ™¯åªè¯»å›¾è°±ï¼Œå¿…é¡»å…ˆé€‰æ‹©åœºæ™¯ï¼›ä¸ä¼šåˆå¹¶å…¶ä»–åœºæ™¯ã€‚",
        "memory.am.entitiesFullHint": "å­˜åœ¨ Scene è®°å¿†æˆ–å¯ç”¨ä¸¥æ ¼æ¨¡å¼æ—¶ï¼Œæ—§ç‰ˆé¢æ¿çš„å›¾è°±ä¸èº«ä»½æ¥å£ä¼šåœç”¨ï¼›åˆ«åå’Œè§„èŒƒå®ä½“ç®¡ç†é¡»ç­‰åœºæ™¯å®‰å…¨å…¥å£è¡¥é½ã€‚",
        "memory.am.entitiesOpenFull": "æ‰“å¼€å®Œæ•´è®°å¿†/å®ä½“é¢æ¿",
        "memory.am.entitiesWeights": "æ ‡ç­¾/å®ä½“æƒé‡",
        "memory.am.memory.archivedDone": "å·²å½’æ¡£",
        "memory.am.memory.unarchivedDone": "å·²å–æ¶ˆå½’æ¡£",
        "memory.am.memory.deleted": "å·²åˆ é™¤",
        "memory.am.memory.stale": "è¿™æ¡è®°å¿†å·²è¢«å…¶ä»–é¡µé¢ä¿®æ”¹ï¼›è¯·é‡æ–°æ‰“å¼€åå†ä¿å­˜ã€‚",
        "memory.am.memory.loadError": "åŠ è½½è®°å¿†å¤±è´¥",
        "memory.am.memory.prev": "ä¸Šä¸€é¡µ",
        "memory.am.memory.next": "ä¸‹ä¸€é¡µ",
        "memory.am.restoreDefaultsHint": "åªé‡ç½®å‚æ•°ï¼Œä¸ä¼šåˆ é™¤è®°å¿†ã€‚",
        "memory.am.backup.create": "åˆ›å»ºå¤‡ä»½",
        "memory.am.backup.creating": "å¤‡ä»½ä¸­â€¦",
        "memory.am.backup.refresh": "åˆ·æ–°å¤‡ä»½",
        "memory.am.backup.empty": "è¿˜æ²¡æœ‰å¤‡ä»½",
        "memory.am.backup.hint": "å¤‡ä»½æ˜¯ SQLite ä¸€è‡´æ€§å¿«ç…§ï¼Œä¿å­˜åœ¨ memoryDir/backupsï¼›æ¢å¤åªåœ¨é‡å¯ååº”ç”¨ã€‚",
        "memory.am.backup.check": "æ ¡éªŒ",
        "memory.am.backup.checked": "æ ¡éªŒé€šè¿‡",
        "memory.am.backup.restore": "æš‚å­˜æ¢å¤",
        "memory.am.backup.restoreTitle": "æ¢å¤å¤‡ä»½",
        "memory.am.backup.restoreHint": "æ¢å¤ä¼šåœ¨ä¸‹æ¬¡ DSH å¯åŠ¨æ—¶æ›¿æ¢å½“å‰æ•°æ®åº“ï¼Œå¹¶å…ˆè‡ªåŠ¨ä¿ç•™ä¸€ä»½ pre-restore ç°åœºï¼›è¿è¡Œä¸­ä¸ä¼šè¦†ç›–ã€‚",
        "memory.am.backup.ack": "æˆ‘äº†è§£éœ€è¦é‡å¯å¹¶ç¡®è®¤æ¢å¤",
        "memory.am.backup.stage": "æš‚å­˜å¹¶åœ¨é‡å¯åæ¢å¤",
        "memory.am.backup.staged": "å·²æš‚å­˜ï¼›é‡å¯ DSH ååº”ç”¨ã€‚",
        "memory.am.backup.failed": "å¤‡ä»½æ“ä½œå¤±è´¥",
        "memory.am.backup.restart": "é‡å¯ DSH åç”Ÿæ•ˆ",
        "memory.am.backup.sha": "SHA-256",
        "memory.am.backup.memories": "æ¡è®°å¿†",
        "memory.am.backup.createdAt": "åˆ›å»ºæ—¶é—´",
        "memory.am.section.embedding": "å‘é‡æ£€ç´¢ä¸ Embedding",
        "memory.am.section.preferences": "Tag ä¸å®ä½“åå¥½",
        "memory.am.section.advanced": "é«˜çº§ä¸è¯Šæ–­",
        "memory.am.runState": "è®°å¿†åº“çŠ¶æ€",
        "memory.am.memories": "è®°å¿†",
        "memory.am.archived": "å·²å½’æ¡£",
        "memory.am.forgotten": "å·²é—å¿˜",
        "memory.am.running": "è¿è¡Œä¸­",
        "memory.am.paused": "å·²æš‚åœ",
        "memory.am.database": "SQLite",
        "memory.am.autoMemory": "è‡ªåŠ¨è®°å¿†/æ€»ç»“",
        "memory.am.lastError": "æœ€è¿‘é”™è¯¯",
        "memory.am.none": "æ— ",
        "memory.am.version": "ç‰ˆæœ¬",
        "memory.am.lastDream": "æœ€è¿‘è‡ªåŠ¨å·©å›º",
        "memory.am.lastSleep": "æœ€è¿‘ Sleep",
        "memory.am.never": "å°šæœªè¿è¡Œ",
        "memory.am.vector": "å‘é‡æ£€ç´¢",
        "memory.am.vectorReady": "å¯ç”¨",
        "memory.am.vectorInitializing": "åˆå§‹åŒ–ä¸­",
        "memory.am.vectorDisabled": "æœªé…ç½®/ä¸å¯ç”¨",
        "memory.am.dimension": "ç»´åº¦",
        "memory.am.coverage": "ç´¢å¼•è¦†ç›–",
        "memory.am.featureHint": "å¼€å…³æ”¹çš„æ˜¯åŒä¸€ä»½è¿è¡Œæ—¶è¦†ç›–ï¼›ä¿å­˜åæŒ‰æç¤ºé‡è½½æ’ä»¶ã€‚",
        "memory.am.configUnavailable": "å½“å‰ DSH æ²¡æœ‰æä¾› Config Formsï¼›è¯·åˆ°æ’ä»¶ç®¡ç†å™¨ä¿®æ”¹è¿™äº›å‚æ•°ã€‚",
        "memory.am.configHint": "è¿™äº›ç»“æ„å‚æ•°é€šè¿‡ Config Forms ä¿å­˜ï¼›è¯·æŒ‰å®¿ä¸»æç¤ºåº”ç”¨é…ç½®æˆ–é‡è½½æ’ä»¶åç”Ÿæ•ˆã€‚",
        "memory.am.conflict": "é…ç½®å·²è¢«å…¶ä»–é¡µé¢ä¿®æ”¹ï¼›è¯·å–æ¶ˆåé‡æ–°ç¼–è¾‘ï¼Œé¿å…è¦†ç›–åˆ«äººçš„ä¿å­˜ã€‚",
        "memory.am.save": "ä¿å­˜",
        "memory.am.cancel": "å–æ¶ˆ",
        "memory.am.restoreDefaults": "æ¢å¤é»˜è®¤",
        "memory.am.saved": "å·²ä¿å­˜ã€‚",
        "memory.am.savedRestart": "å·²ä¿å­˜ï¼›æ’ä»¶é‡è½½åç”Ÿæ•ˆã€‚",
        "memory.am.restartHint": "å·²å†™å…¥ï¼Œé‡è½½æ’ä»¶åç”Ÿæ•ˆã€‚",
        "memory.am.embedHint": "åªæ˜¾ç¤ºæœåŠ¡æ–¹ã€æ¨¡å‹ã€ç»´åº¦ä¸ç´¢å¼•çŠ¶æ€ï¼›å¯†é’¥æ°¸ä¸å›ä¼ æµè§ˆå™¨ã€‚",
        "memory.am.vectorEnabled": "å¯ç”¨å‘é‡æ£€ç´¢",
        "memory.am.vectorEnabledHint": "å…³é—­åä»å¯ä½¿ç”¨å…³é”®è¯æ£€ç´¢ã€‚",
        "memory.am.local": "æœ¬åœ° ONNX",
        "memory.am.baseUrl": "Base URL",
        "memory.am.model": "æ¨¡å‹",
        "memory.am.apiKey": "API Key",
        "memory.am.apiKeyKeep": "ç•™ç©ºæˆ–ä¿æŒæ©ç  = ä¿ç•™ç°æœ‰å¯†é’¥ã€‚",
        "memory.am.saveEmbedding": "ä¿å­˜ Embedding é…ç½®",
        "memory.am.embeddingSavedRestart": "å·²ä¿å­˜ï¼›æ¨¡å‹/æä¾›æ–¹å˜åŒ–ä¼šé‡å»ºç´¢å¼•ï¼Œé‡è½½æ’ä»¶åç”Ÿæ•ˆã€‚",
        "memory.am.test": "æµ‹è¯•è¿é€šæ€§",
        "memory.am.testing": "æµ‹è¯•ä¸­â€¦",
        "memory.am.testWarning": "ä¼šå‘èµ·ä¸€æ¬¡çœŸå®è¿œç«¯è¯·æ±‚ï¼ˆè‹¥å½“å‰æ˜¯è¿œç«¯ Providerï¼‰ã€‚",
        "memory.am.testOk": "è¿é€šæˆåŠŸ",
        "memory.am.testFailed": "è¿é€šå¤±è´¥",
        "memory.am.preferenceHint": "å¤ç”¨è®°å¿†åº“å·²æœ‰çš„æƒé‡å­˜å‚¨ï¼›æ¢å¤é»˜è®¤åªæ¸…æƒé‡ï¼Œä¸åˆ é™¤ä»»ä½•è®°å¿†ã€‚",
        "memory.am.tagWeights": "Tag æƒé‡",
        "memory.am.entityWeights": "å®ä½“æƒé‡",
        "memory.am.delete": "åˆ é™¤",
        "memory.am.reset": "æ¢å¤é»˜è®¤æƒé‡",
        "memory.am.resetConfirm": "ç¡®è®¤æ¢å¤é»˜è®¤æƒé‡",
        "memory.am.invalid": "æ•°å€¼è¶…å‡ºå…è®¸èŒƒå›´ã€‚",
        "memory.am.noChanges": "æ²¡æœ‰æ”¹åŠ¨ã€‚",
        "memory.am.package": "æ’ä»¶åŒ…",
        "memory.am.dataDir": "æ•°æ®åº“è·¯å¾„",
        "memory.am.vectorIndex": "å‘é‡ç´¢å¼•",
        "memory.am.trustedIntake": "å—ä¿¡ç»å†å…¥å£",
        "memory.am.enabled": "å·²å¯ç”¨",
        "memory.am.disabled": "æœªå¯ç”¨",
        "memory.am.advancedTitle": "å±•å¼€é«˜çº§ä¸è¯Šæ–­ä¿¡æ¯",
        "memory.am.advancedHint": "åˆ«åã€åˆå¹¶ã€ç»´æŠ¤ä¸å®¡è®¡è¯·ç”¨ã€Œæ‰“å¼€å®Œæ•´è®°å¿†ç®¡ç†ã€ï¼›ä¸¥æ ¼åœºæ™¯æ¨¡å¼ä¸‹æ™®é€šå›¾è°±ä¼šå®‰å…¨å…³é—­ï¼Œè¯·ä½¿ç”¨ä¸Šæ–¹åœºæ™¯å›¾è°±ã€‚",
        "memory.am.languageZh": "ä¸­æ–‡",
        "memory.am.languageEn": "English",
        "memory.am.field.language": "è®°å¿†è¯­è¨€",
        "memory.am.field.dreamThresholdCount": "è‡ªåŠ¨æ•´ç†è§¦å‘æ¡æ•°",
        "memory.am.field.dreamThresholdChars": "è‡ªåŠ¨æ•´ç†è§¦å‘å­—ç¬¦æ•°",
        "memory.am.field.dreamDelayMs": "è‡ªåŠ¨æ•´ç†å»¶è¿Ÿï¼ˆæ¯«ç§’ï¼‰",
        "memory.am.field.sleepIdleMinutes": "Sleep ç©ºé—²åˆ†é’Ÿæ•°",
        "memory.am.field.maxInjectedItems": "æ¯è½®æœ€å¤šæ³¨å…¥æ¡æ•°",
        "memory.am.field.importanceThreshold": "è‡ªåŠ¨æ³¨å…¥é‡è¦æ€§é—¨æ§›",
        "memory.am.field.injectContentMaxChars": "æ³¨å…¥æ­£æ–‡æˆªæ–­å­—ç¬¦æ•°",
        "memory.am.field.injectRotationTurns": "æ³¨å…¥è½®æ¢è½®æ•°",
        "memory.am.field.vectorSearchTopK": "å‘é‡å€™é€‰æ•°",
        "memory.am.field.vectorSearchThreshold": "å‘é‡ç›¸ä¼¼åº¦é˜ˆå€¼",
        "memory.am.field.hybridSearchVectorWeight": "æ··åˆæ£€ç´¢å‘é‡æƒé‡",
        "memory.am.field.autoReindexOnBoot": "å¯åŠ¨æ—¶è‡ªåŠ¨è¡¥é½ç´¢å¼•",
        "memory.am.fieldHint.language": "è®°å¿†æ ‡é¢˜ä¸åå°æç¤ºè¯è¯­è¨€ã€‚",
        "memory.am.fieldHint.dreamThresholdCount": "æ–°å¢è®°å¿†è¾¾åˆ°è¯¥æ¡æ•°åè§¦å‘è‡ªåŠ¨æ•´ç†ã€‚",
        "memory.am.fieldHint.dreamThresholdChars": "æ–°å¢æ­£æ–‡è¾¾åˆ°è¯¥å­—ç¬¦æ•°åè§¦å‘è‡ªåŠ¨æ•´ç†ã€‚",
        "memory.am.fieldHint.dreamDelayMs": "è§¦å‘åç­‰å¾…å¤šä¹…å†å¼€å§‹æ•´ç†ã€‚",
        "memory.am.fieldHint.sleepIdleMinutes": "ç©ºé—²å¤šä¹…åè¿è¡Œ Sleepã€‚",
        "memory.am.fieldHint.maxInjectedItems": "æ¯è½®è‡ªåŠ¨æ³¨å…¥çš„æ¡æ•°ä¸Šé™ã€‚",
        "memory.am.fieldHint.importanceThreshold": "è¾¾åˆ°è¯¥é‡è¦æ€§çš„è®°å¿†æ‰ä¼šè‡ªåŠ¨æ³¨å…¥ã€‚",
        "memory.am.fieldHint.injectContentMaxChars": "å•æ¡æ³¨å…¥æ­£æ–‡çš„æˆªæ–­ä¸Šé™ã€‚",
        "memory.am.fieldHint.injectRotationTurns": "é¿å…è¿ç»­å¤šè½®æ³¨å…¥åŒä¸€æ‰¹è®°å¿†ã€‚",
        "memory.am.fieldHint.vectorSearchTopK": "è¯­ä¹‰æ£€ç´¢è¿›å…¥èåˆæ± çš„å€™é€‰æ•°ã€‚",
        "memory.am.fieldHint.vectorSearchThreshold": "ä½äºè¯¥ç›¸ä¼¼åº¦çš„å‘é‡ä¸å‚ä¸ã€‚",
        "memory.am.fieldHint.hybridSearchVectorWeight": "æ··åˆæ£€ç´¢æ—¶å‘é‡åˆ†æ•°çš„æƒé‡ã€‚",
        "memory.am.fieldHint.autoReindexOnBoot": "å¯åŠ¨åè¡¥é½ç¼ºå¤±å‘é‡çš„ç´¢å¼•ã€‚",
        "memory.settings.title": "è®°å¿†åº“è®¾ç½®",
        "memory.settings.group.identity": "èº«ä»½ä¸åå¥½",
        "memory.settings.identity.title": "èº«ä»½ä¸åå¥½æƒé‡",
        "memory.settings.identity.desc": "åŒåå®ä½“åªä½œä¸ºå€™é€‰ï¼Œä¸ä¼šè‡ªåŠ¨åˆå¹¶ï¼›ä¸ºæ ‡ç­¾æˆ–è§„èŒƒå®ä½“è®¾ç½® 0.5â€“2.0 çš„åå¥½æƒé‡ï¼ˆé»˜è®¤ 1.0ï¼Œç»„åˆåå¤¹åœ¨ 0.6â€“1.6ï¼‰ã€‚æ€»å¼€å…³å…³é—­æˆ–æƒé‡å…¨ä¸º 1.0 æ—¶æ£€ç´¢è¡Œä¸ºä¸å˜ã€‚",
        "memory.settings.identity.tags": "æ ‡ç­¾æƒé‡",
        "memory.settings.identity.tagPlaceholder": "æ ‡ç­¾ï¼Œå¦‚ person:close",
        "memory.settings.identity.weight": "æƒé‡",
        "memory.settings.identity.addTag": "æ·»åŠ æ ‡ç­¾æƒé‡",
        "memory.settings.identity.entities": "å®ä½“åå¥½",
        "memory.settings.identity.entityPlaceholder": "å®ä½“ UUID æˆ–åç§°",
        "memory.settings.identity.addEntity": "æ·»åŠ å®ä½“æƒé‡",
        "memory.settings.identity.candidates": "é‡å¤å€™é€‰",
        "memory.settings.identity.candidatesHint": "åªæ ¹æ®åç§°/åˆ«åæå‡ºå€™é€‰ï¼›ç¡®è®¤å‰ä¸ä¼šåˆå¹¶æˆ–æ”¹å†™ä»»ä½•è®°å¿†ã€‚å…ˆé¢„è§ˆå½±å“ï¼Œå†ç¡®è®¤ã€‚",
        "memory.settings.identity.preview": "é¢„è§ˆå½±å“",
        "memory.settings.identity.previewLeft": "ä»¥å·¦ä¾§ä¸ºå‡†",
        "memory.settings.identity.previewRight": "ä»¥å³ä¾§ä¸ºå‡†",
        "memory.settings.identity.confirm": "ç¡®è®¤åˆå¹¶",
        "memory.settings.identity.undo": "æ’¤é”€åˆå¹¶",
        "memory.settings.identity.links": "å·²å»ºç«‹çš„è§„èŒƒæ˜ å°„",
        "memory.settings.identity.noCandidates": "æ²¡æœ‰å¾…ç¡®è®¤çš„å€™é€‰",
        "memory.settings.identity.noLinks": "æ²¡æœ‰è§„èŒƒæ˜ å°„",
        "memory.settings.identity.counts": "å®ä½“ {entities} Â· å±æ€§ {attrs} Â· å…³ç³» {relations} Â· è®°å¿† {memories} Â· å†²çª {conflicts}",
        "memory.settings.identity.blocked": "å­˜åœ¨é˜»æ–­é¡¹ï¼š{reason}",
        "memory.settings.identity.dryRun": "å½±å“æŠ¥å‘Šå·²ç”Ÿæˆï¼ˆæœªå†™å…¥ï¼‰",
        "memory.settings.identity.saved": "å·²ä¿å­˜",
        "memory.settings.identity.deleted": "å·²åˆ é™¤",
        "memory.settings.identity.error": "æ“ä½œå¤±è´¥",
        "memory.settings.identity.delete": "åˆ é™¤",
        "memory.settings.identity.save": "ä¿å­˜",
        "memory.identity.needToken": "èº«ä»½ä¸æ¥æºè¯¦æƒ…éœ€è¦æœåŠ¡ç«¯ apiTokenï¼šåœ¨æ’ä»¶é…ç½®é‡Œè®¾ç½® apiTokenï¼Œå¹¶åœ¨ã€Œè®¾ç½® â†’ è¿æ¥ä¸å®‰å…¨ â†’ API Tokenã€å¡«å…¥åŒä¸€ä¸ªå€¼ã€‚",
        "memory.identity.title": "èº«ä»½",
        "memory.identity.aliases": "åˆ«å",
        "memory.identity.externalIds": "å¤–éƒ¨æ ‡è¯†",
        "memory.identity.history": "å†å²ä¸è¯æ®",
        "memory.identity.aliasPlaceholder": "æ–°å¢åˆ«åâ€¦",
        "memory.identity.addAlias": "æ·»åŠ ",
        "memory.identity.confirmAlias": "ç¡®è®¤",
        "memory.identity.editAlias": "æ”¹å",
        "memory.identity.unlink": "è§£é™¤",
        "memory.identity.externalPlaceholder": "å¤–éƒ¨ ID",
        "memory.identity.platformPlaceholder": "å¹³å°ï¼Œå¦‚ qq",
        "memory.identity.typePlaceholder": "ç±»å‹",
        "memory.identity.addExternal": "ç»‘å®šå¤–éƒ¨ ID",
        "memory.identity.preference": "åå¥½æƒé‡",
        "memory.identity.preferenceHint": "å½“å‰è§„èŒƒå®ä½“çš„åå¥½æƒé‡ï¼ˆ0.5â€“2.0ï¼Œé»˜è®¤ 1.0ï¼‰ã€‚",
        "memory.identity.members": "è§„èŒƒæˆå‘˜",
        "memory.identity.merged": "å·²åˆå¹¶è§†å›¾",
        "memory.identity.provenance": "æ¥æº",
        "memory.identity.weight": "æƒé‡",
        "memory.identity.saveWeight": "ä¿å­˜æƒé‡",
        "memory.identity.noAliases": "æš‚æ— åˆ«å",
        "memory.identity.noExternal": "æš‚æ— å¤–éƒ¨æ ‡è¯†",
        "memory.identity.duplicateName": "åŒåå®ä½“",
        "memory.graph.edgeWeight": "æƒé‡ {weight} Â· æ¥æº {source}",
        "memory.graph.canonicalHint": "æ­¤èŠ‚ç‚¹æ˜¯è§„èŒƒè§†å›¾ï¼ŒåŒ…å« {n} ä¸ªåŸå§‹å®ä½“",
        "memory.settings.group.personal": "ä¸ªæ€§åŒ–",
        "memory.settings.group.engine": "è®°å¿†å¼•æ“",
        "memory.settings.group.search": "æœç´¢",
        "memory.settings.group.connect": "è¿æ¥ä¸å®‰å…¨",
        "memory.settings.group.help": "å¸®åŠ©",
        "memory.settings.profile": "ç”¨æˆ·ç”»åƒ",
        "memory.settings.profileHint": "å†™ä¸€æ®µè‡ªæˆ‘ä»‹ç»ï¼ˆè§’è‰²ã€èƒŒæ™¯ã€åå¥½ï¼‰ï¼ŒAgent æ¯è½®å¯¹è¯éƒ½ä¼šè‡ªåŠ¨å¸¦ä¸Šã€‚",
        "memory.settings.profileSave": "ä¿å­˜ç”»åƒ",
        "memory.settings.profileSaved": "ç”»åƒå·²ä¿å­˜",
        "memory.settings.profileExtract": "ä»è®°å¿†æå–è‰ç¨¿",
        "memory.settings.profileExtracting": "æ­£åœ¨æå–â€¦",
        "memory.settings.profileExtractHint": "ä¼šèŠ±ä¸€æ¬¡æ¨¡å‹è°ƒç”¨ï¼Œåªåœ¨ä½ ç‚¹è¿™ä¸ªæŒ‰é’®æ—¶å‘ç”Ÿï¼›æå–å‡ºæ¥çš„æ˜¯è‰ç¨¿ï¼Œä¸é‡‡ç”¨å°±ä¸è¿›åº“ï¼Œä½ æ‰‹å†™çš„ç”»åƒä¹Ÿä¸ä¼šè¢«è¦†ç›–ã€‚",
        "memory.settings.profileExtractDisabled": "æ²¡æœ‰æå–ï¼šåŠŸèƒ½å¼€å…³é‡Œçš„ã€Œç”»åƒæå–è‰ç¨¿ã€è¿˜æ²¡æ‰“å¼€ã€‚",
        "memory.settings.profileExtractEmpty": "åº“é‡Œæ²¡æœ‰å¯ç”¨çš„è®°å¿†æ¡ç›®ï¼Œè¿™æ¬¡æ²¡æœ‰èƒ½æç‚¼çš„å†…å®¹ï¼ˆç©ºè¾“å…¥ä¸‹ç¡¬å†™ä¸€æ®µç”»åƒåªä¼šæ˜¯ç¼–çš„ï¼‰ã€‚",
        "memory.settings.profileExtractNoRoute": "æ²¡æœ‰å¯ç”¨çš„æ¨¡å‹ï¼šå…ˆåœ¨å®¿ä¸»é‡Œé€‰ä¸€ä¸ªé»˜è®¤æ¨¡å‹ï¼ˆæˆ–åœ¨é…ç½®é‡Œå¡« dreamProvider / dreamModelï¼‰ï¼Œå†ç‚¹ä¸€æ¬¡ã€‚",
        "memory.settings.profileSaveFailed": "ç”»åƒæ²¡å­˜è¿›å»",
        "memory.settings.profileExtractFailed": "æå–æ²¡æˆï¼šæ¨¡å‹æ²¡æŒ‰æ ¼å¼è¿”å›ï¼Œæˆ–è¿™æ¬¡è°ƒç”¨å¤±è´¥äº†ã€‚ä½ ç°æœ‰çš„ç”»åƒä¸€ä¸ªå­—éƒ½æ²¡è¢«æ”¹åŠ¨ã€‚",
        "memory.settings.profileDraftTitle": "è‰ç¨¿ï¼ˆè¿˜æ²¡ä¿å­˜ï¼‰",
        "memory.settings.profileDraftRows": "ä¾æ®è®°å¿†æ¡æ•°",
        "memory.settings.profileDraftTruncated": "æ¡ç›®è¾ƒå¤šï¼Œè¿™æ¬¡åªè¯»äº†å‰é¢ä¸€éƒ¨åˆ†",
        "memory.settings.profileDraftApply": "é‡‡ç”¨ä¸ºç”»åƒ",
        "memory.settings.profileDraftDiscard": "ä¸¢å¼ƒè‰ç¨¿",
        "memory.settings.persona": "äººæ ¼å®šä¹‰ï¼ˆbetaï¼‰",
        "memory.settings.personaHint": "ç»™è¿™ä½ Agent ä¸€å¼ è§’è‰²å¡ï¼šåå­—ã€æ€§æ ¼ã€å›å¤è¦æ±‚ã€‚å¼€å…³æ‰“å¼€ä¸”ä¸‹æ–¹ã€Œäººæ ¼å®šä¹‰ã€æ€»é—¸å¼€å¯æ—¶ï¼Œæ¯è½®å¯¹è¯éƒ½ä¼šæ³¨å…¥ã€‚",
        "memory.settings.personaName": "åå­—",
        "memory.settings.personaNamePlaceholder": "ä¾‹å¦‚ï¼šNyx",
        "memory.settings.personaPersonality": "æ€§æ ¼è®¾å®š",
        "memory.settings.personaPersonalityPlaceholder": "ä¾‹å¦‚ï¼šè½»æ¾å¹½é»˜ï¼Œè®²éš¾é¢˜æ—¶ç”¨ç±»æ¯”å¸®ç”¨æˆ·å¿«é€Ÿç†è§£",
        "memory.settings.personaReplyStyle": "å›å¤è¦æ±‚",
        "memory.settings.personaReplyStylePlaceholder": "ä¾‹å¦‚ï¼šå…ˆç»™ç»“è®ºå†è§£é‡Šï¼›ç”¨äººåœ¨ç”¨çš„è¯ï¼Œä¸ç”¨æœºåˆ¶å",
        "memory.settings.personaSave": "ä¿å­˜äººæ ¼",
        "memory.settings.personaSaved": "äººæ ¼å·²ä¿å­˜",
        "memory.settings.personaSaveFailed": "ä¿å­˜å¤±è´¥",
        "memory.settings.personaEnabledToggle": "å¯ç”¨è¿™å¼ å¡",
        "memory.settings.personaEnabledOn": "å·²å¯ç”¨â€”â€”èº«ä»½å‘½ä¸­çš„ä¼šè¯ä¼šæ³¨å…¥è¿™å¼ å¡",
        "memory.settings.personaEnabledOff": "æœªå¯ç”¨â€”â€”é»˜è®¤å£å¾„ä¸‹è¿™ä¸ªèº«ä»½çš„ä¼šè¯ä¼šæ”¹ç”¨é»˜è®¤å¡ï¼›å¼€ç€ã€Œä¸¥æ ¼äººæ ¼å¯»å€ã€æ—¶åˆ™å®Œå…¨ä¸æ³¨å…¥äººæ ¼",
        "memory.settings.personaDefaultCard": "é»˜è®¤å¡ï¼ˆå…œåº•ï¼‰",
        "memory.settings.personaAdd": "æ·»åŠ å¡",
        "memory.settings.personaAddPlaceholder": "è¾“å…¥ agent èº«ä»½åï¼ˆå¦‚ nyxï¼‰ï¼ŒæŒ‰å®ƒå¯»å€æ³¨å…¥",
        "memory.settings.personaEditingDefault": "æ­£åœ¨ç¼–è¾‘ï¼šé»˜è®¤å¡â€”â€”è§£æä¸åˆ°èº«ä»½çš„ä¼šè¯ä¸€å®šç”¨å®ƒï¼›èº«ä»½è§£æåˆ°äº†å´æ²¡å»ºå¡ï¼ˆæˆ–å¡è¢«å…³æ‰ï¼‰çš„ä¼šè¯ï¼Œåœ¨é»˜è®¤å£å¾„ä¸‹ä¹Ÿè½åˆ°è¿™é‡Œï¼Œå¼€ç€ã€Œä¸¥æ ¼äººæ ¼å¯»å€ã€åˆ™ä¸æ³¨å…¥äººæ ¼",
        "memory.settings.personaEditingFor": "æ­£åœ¨ç¼–è¾‘èº«ä»½å¡ï¼š",
        "memory.settings.personaDeleteCard": "åˆ é™¤è¿™å¼ å¡",
        "memory.settings.personaView": "Agent çœ¼ä¸­çš„ä½ ï¼ˆæ³¨å…¥ç”Ÿæ•ˆæ–‡æœ¬ï¼‰",
        "memory.settings.personaViewHint": "ä¸‹é¢æ˜¯è¿™ä¸€è½®çœŸæ­£ä¼šé€è¿›æ¨¡å‹çš„æ•´æ®µæ–‡æœ¬ï¼šäººæ ¼ â†’ ç”»åƒ â†’ è§„åˆ™ï¼ˆåå†™çš„è¦†ç›–å‰å†™çš„ï¼Œè§„åˆ™æœ€ç¡¬ï¼‰ã€‚æ–‡æœ¬ç”±æ’ä»¶æ¸²æŸ“ï¼Œå‰ç«¯åªæ˜¾ç¤ºã€‚",
        "memory.settings.personaViewEmpty": "ä¸‰é¡¹éƒ½æ˜¯ç©ºçš„â€”â€”Agent æ¯è½®åªä¼šçœ‹åˆ°è®°å¿†åº“ã€‚",
        "memory.settings.personaViewUnknown": "è¯»ä¸åˆ°æ³¨å…¥æ–‡æœ¬ï¼ˆé¢„è§ˆè¯·æ±‚å¤±è´¥æˆ–åç«¯ç‰ˆæœ¬è¿‡æ—§ï¼‰ã€‚è¿™é‡Œä¸æ˜¾ç¤ºçŒœæµ‹çš„å†…å®¹ã€‚",
        "memory.settings.personaViewSourceDefault": "å½“å‰æŒ‰ã€Œè§£æä¸åˆ°ä¼šè¯èº«ä»½ã€çš„ä¼šè¯é¢„è§ˆï¼Œå–é»˜è®¤å¡ã€‚",
        "memory.settings.personaViewSourceFallback": "è¿™ä¸ªèº«ä»½è§£æåˆ°äº†ï¼Œä½†å®ƒæ²¡æœ‰å¯ç”¨çš„å¡ï¼ˆæ²¡å»ºæˆ–å·²å…³æ‰ï¼‰ï¼Œæ‰€ä»¥è½å›é»˜è®¤å¡â€”â€”é»˜è®¤å£å¾„ä¸‹è¿™æ­£æ˜¯ã€Œå…³æ‰è¿™å¼ å¡ã€ä¸ç”Ÿæ•ˆçš„åŸå› ï¼›æ‰“å¼€ã€Œä¸¥æ ¼äººæ ¼å¯»å€ã€åè¿™ç§æƒ…å†µæ”¹ä¸ºä¸æ³¨å…¥äººæ ¼ã€‚",
        "memory.settings.personaViewSourceCard": "å½“å‰æŒ‰ä½ æ­£åœ¨ç¼–è¾‘çš„è¿™å¼ èº«ä»½å¡é¢„è§ˆã€‚",
        "memory.settings.personaViewSourceNone": "æŒ‰å½“å‰å¯»å€å£å¾„ï¼Œè¿™ä¸ªèº«ä»½ä¸ä¼šæ³¨å…¥ä»»ä½•äººæ ¼â€”â€”é»˜è®¤å¡åªå…œã€Œè§£æä¸åˆ°ä¼šè¯èº«ä»½ã€çš„ä¼šè¯ã€‚",
        "memory.settings.personaViewGateOff": "æ€»é—¸ã€Œäººæ ¼å®šä¹‰ï¼ˆbetaï¼‰ã€ç°åœ¨æ˜¯å…³çš„ï¼šä¸‹é¢è¿™æ®µé‡Œä¸ä¼šå‡ºç°äººæ ¼ï¼Œåªæœ‰ç”»åƒä¸è§„åˆ™ã€‚",
        "memory.settings.personaViewRefresh": "åˆ·æ–°é¢„è§ˆ",
        "memory.features.personaEnabled": "äººæ ¼å®šä¹‰ï¼ˆbetaï¼‰",
        "memory.features.personaEnabled.hint": "æŠŠã€Œè®¾ç½® â†’ ä¸ªæ€§åŒ–ã€é‡Œçš„äººæ ¼å¡æ³¨å…¥åˆ°æ¯è½®å¯¹è¯ã€‚é»˜è®¤å…³ï¼ˆbetaï¼‰ï¼›æ€»é—¸ä¸äººæ ¼å¡å†…çš„å¼€å…³åŒæ—¶æ‰“å¼€æ‰ç”Ÿæ•ˆã€‚",
        "memory.features.personaStrictAddressing": "ä¸¥æ ¼äººæ ¼å¯»å€",
        "memory.features.personaStrictAddressing.hint": "å¼€ï¼šä¼šè¯èº«ä»½æ²¡æœ‰å¯¹åº”äººæ ¼å¡ã€æˆ–é‚£å¼ å¡è¢«å…³æ‰æ—¶ï¼Œå°±ä¸æ³¨å…¥äººæ ¼â€”â€”é»˜è®¤å¡åªå…œã€Œè§£æä¸åˆ°ä¼šè¯èº«ä»½ã€çš„ä¼šè¯ã€‚å®¿ä¸»é‡Œè·‘ç€è‡ªå¸¦èº«ä»½çš„ botï¼ˆDS Bot é‚£ç±»ï¼‰æ—¶å…³æ‰è¿™ç§å…œåº•ï¼Œå…å¾—ä¸¤å¥ã€Œä½ æ˜¯è°ã€æ’åœ¨åŒä¸€è½®ã€‚é»˜è®¤å…³ = æœªå‘½ä¸­å°±è½é»˜è®¤å¡ï¼ˆå†å²è¡Œä¸ºï¼‰ã€‚",
        "memory.features.profileExtractEnabled": "ç”»åƒæå–è‰ç¨¿",
        "memory.features.profileExtractEnabled.hint": "æ‰“å¼€ã€Œè®¾ç½® â†’ ä¸ªæ€§åŒ– â†’ ç”¨æˆ·ç”»åƒã€é‡Œçš„ã€Œä»è®°å¿†æå–è‰ç¨¿ã€æŒ‰é’®ï¼šè¯»ä¸€æ‰¹æ´»è·ƒè®°å¿†ã€èŠ±ä¸€æ¬¡æ¨¡å‹è°ƒç”¨ï¼Œäº§ä¸€æ®µã€ŒåŠ©æ‰‹çœ¼ä¸­çš„ç”¨æˆ·ã€è‰ç¨¿ã€‚è‰ç¨¿è¦ä½ ç‚¹ã€Œé‡‡ç”¨ã€æ‰ä¼šå†™è¿›ç”»åƒï¼Œç»ä¸è‡ªåŠ¨è¦†ç›–ä½ æ‰‹å†™çš„åŸæ–‡ã€‚è½»é‡æ¡£é¢„è®¾å…³ï¼ˆç”¨æˆ·æ˜¾å¼å‹¾é€‰ä»ç„¶èµ¢ï¼‰ã€‚",
        "memory.settings.rules": "è§„åˆ™",
        "memory.settings.rulesHint": "ç»™ Agent ç«‹ä¸‹å¿…é¡»éµå®ˆçš„è§„çŸ©ï¼Œéšæ—¶å¢åˆ ï¼Œä¸‹ä¸€è½®å³ç”Ÿæ•ˆã€‚",
        "memory.settings.ruleAdd": "æ·»åŠ è§„åˆ™",
        "memory.settings.rulePlaceholder": "ä¾‹å¦‚ï¼šå›ç­”æ—¶æ€»æ˜¯å…ˆç»™ç»“è®º",
        "memory.settings.commands": "è‡ªå®šä¹‰æŒ‡ä»¤",
        "memory.settings.commandsHint": "æŠŠå¸¸ç”¨æç¤ºè¯å­˜æˆ / å‘½ä»¤ï¼ŒèŠå¤©æ—¶ç›´æ¥é”®å…¥è°ƒç”¨ã€‚",
        "memory.settings.cmdName": "å‘½ä»¤å",
        "memory.settings.cmdDesc": "æè¿°",
        "memory.settings.cmdInstruction": "æŒ‡ä»¤å†…å®¹",
        "memory.settings.cmdAdd": "æ·»åŠ å‘½ä»¤",
        "memory.settings.cmdDelete": "åˆ é™¤",
        "memory.settings.empty": "æš‚æ— å†…å®¹",
        "memory.panel.semantic": "è¯­ä¹‰",
        "memory.sidebar.aria": "æ‰“å¼€è®°å¿†åº“",
        "memory.view.label": "è®°å¿†åº“",
        "memory.overlay.close": "å…³é—­",
        "memory.explorer.tabMemory": "è®°å¿†",
        "memory.explorer.tabEntities": "å®ä½“",
        "memory.explorer.tabSettings": "è®¾ç½®",
        "memory.explorer.tabStatus": "çŠ¶æ€",
        "memory.explorer.tabAmadeus": "Amadeus å¢å¼º",
        "memory.am.enhancementsIntro": "åœºæ™¯éš”ç¦»ã€æ£€ç´¢åå¥½ã€äººæ ¼å…¼å®¹å’Œå¤‡ä»½ç­‰ Amadeus ä¸“å±è®¾ç½®ã€‚ä¸¥æ ¼åœºæ™¯æ¨¡å¼ä¸‹ï¼Œå¯é€šè¿‡å®Œæ•´è®°å¿†æµè§ˆå™¨æŒ‰åœºæ™¯æŸ¥çœ‹å®‰å…¨å›¾è°±ã€‚",
        "memory.entities.count": "{n} ä¸ªå®ä½“",
        "memory.entities.loadMore": "åŠ è½½æ›´å¤šå®ä½“",
        "memory.entities.pick": "ä»å·¦ä¾§é€‰æ‹©ä¸€ä¸ªå®ä½“ï¼ŒæŸ¥çœ‹å®ƒçš„å±æ€§ä¸å…³ç³»",
        // æœç´¢æ¡†æœ‰å­—ä½†ä¸€æ¡æ²¡ç­›å‡ºæ¥æ—¶ç”¨å®ƒï¼›ä¸ entities.noneï¼ˆåº“é‡ŒçœŸæ²¡å®ä½“ï¼‰åˆ†å¼€ï¼Œ
        // å¦åˆ™ã€Œæš‚æ— å®ä½“ã€ä¼šæŠŠæ‰“é”™ä¸€ä¸ªå­—è¯¯å¯¼æˆã€Œä½ è¿˜æ²¡å¼€æŠ½å–ã€ã€‚
        "memory.entities.noMatch": "æ²¡æœ‰åŒ¹é…çš„å®ä½“ï¼Œæ¢ä¸ªè¯è¯•è¯•",
        "memory.entities.none": "æš‚æ— å®ä½“ï¼šå¼€å¯å®ä½“æŠ½å–åï¼Œè®°å¿†é‡Œçš„äººç‰© / é¡¹ç›® / æ¦‚å¿µä¼šè‡ªåŠ¨æ²‰æ·€åˆ°è¿™é‡Œ",
        "memory.entities.restart": "å®ä½“æŠ½å–å·²å¼€å¯ï¼Œä½†å½“å‰è¿è¡Œæ—¶å°šæœªè£…è½½ï¼›é‡è½½æ’ä»¶åå¼€å§‹æŠ½å–",
        "memory.entities.restartOff": "å®ä½“æŠ½å–å·²å…³é—­ï¼Œä½†å½“å‰è¿è¡Œæ—¶ä»åœ¨æŠ½å–ï¼›é‡è½½æ’ä»¶ååœæ­¢",
        "memory.entities.pending": "å®ä½“æŠ½å–æ­£åœ¨å¤„ç†ä¸­â€¦",
        "memory.entities.emptyEnabled": "å®ä½“æŠ½å–å·²å¼€å¯ï¼Œæš‚æ— å®ä½“ï¼›æ–°å†™å…¥çš„è®°å¿†ä¼šè‡ªåŠ¨æ²‰æ·€äººç‰© / é¡¹ç›® / æ¦‚å¿µ",
        "memory.entities.failed": "æœ€è¿‘ä¸€æ¬¡å®ä½“æŠ½å–å¤±è´¥ï¼›æ–°çš„è®°å¿†ä»ä¼šç»§ç»­å°è¯•æŠ½å–",
        "memory.entities.failedParse": "æœ€è¿‘ä¸€æ¬¡å®ä½“æŠ½å–å¤±è´¥ï¼šæ¨¡å‹è¿”å›çš„å†…å®¹æ— æ³•è§£æï¼›æ–°çš„è®°å¿†ä»ä¼šç»§ç»­å°è¯•æŠ½å–",
        "memory.entities.forbidden": "æ²¡æœ‰æƒé™è¯»å–å®ä½“ç›®å½•ï¼›è¯·ç¡®è®¤å½“å‰èº«ä»½æˆ– Scene æˆæƒ",
        "memory.entities.network": "ç½‘ç»œé”™è¯¯ï¼Œæ— æ³•åŠ è½½å®ä½“ç›®å½•",
        "memory.entities.httpError": "åŠ è½½å®ä½“ç›®å½•å¤±è´¥ï¼ˆæœåŠ¡è¿”å›é”™è¯¯ï¼‰",
        "memory.entities.refresh": "åˆ·æ–°",
        "memory.entities.attrs": "å±æ€§",
        "memory.entities.relations": "å…³ç³»",
        "memory.entities.mentions": "{n} æ¬¡æåŠ",
        "memory.entities.lastSeen": "æœ€è¿‘å‡ºç°",
        "memory.entity.person": "äººç‰©",
        "memory.entity.project": "é¡¹ç›®",
        "memory.entity.concept": "æ¦‚å¿µ",
        "memory.entity.technology": "æŠ€æœ¯",
        "memory.entity.organization": "ç»„ç»‡",
        "memory.entity.other": "å…¶ä»–",
        "memory.explorer.search": "æœç´¢æ ‡é¢˜æˆ–å†…å®¹â€¦",
        "memory.explorer.searchTitle": "è¯­ä¹‰æ£€ç´¢",
        "memory.explorer.types": "åˆ†ç±»",
        "memory.explorer.timeline": "æ—¶é—´æ ‘",
        "memory.explorer.detail": "è¯¦æƒ…",
        "memory.explorer.emptyDetail": "åœ¨æ—¶é—´æ ‘ä¸­é€‰æ‹©ä¸€æ¡è®°å¿†æŸ¥çœ‹å…¨æ–‡",
        "memory.explorer.copy": "å¤åˆ¶å…¨æ–‡",
        "memory.explorer.copied": "å·²å¤åˆ¶",
        "memory.explorer.refresh": "åˆ·æ–°",
        "memory.explorer.loadMore": "åŠ è½½æ›´å¤š",
        "memory.explorer.count": "å…± {n} æ¡",
        "memory.explorer.empty": "æš‚æ— è®°å¿†æ¡ç›®",
        "memory.explorer.source": "æ¥æº",
        "memory.explorer.created": "åˆ›å»º",
        "memory.explorer.updated": "æ›´æ–°",
        "memory.explorer.tags": "æ ‡ç­¾",
        "memory.explorer.preference": "åå¥½æƒé‡",
        "memory.explorer.importance": "é‡è¦æ€§",
        "memory.explorer.heat": "çƒ­åº¦",
        "memory.explorer.heatSort": "çƒ­åº¦ä¼˜å…ˆ",
        "memory.explorer.heatSortHint": "å¯¹å·²åŠ è½½æ¡ç›®æŒ‰çƒ­åº¦é™åºï¼ˆé¡µå†…æ’åºï¼Œéå…¨å±€åºï¼›æ—¶é—´æ ‘ä¿æŒæ—¶é—´åºï¼‰",
        "memory.explorer.filterDeposited": "æ²‰æ·€",
        "memory.explorer.filterDepositedHint": "åªçœ‹ autoDream å·©å›º/æ›´æ–°è¿‡çš„è®°å¿†",
        "memory.explorer.filterArchived": "å·²å½’æ¡£",
        "memory.explorer.filterArchivedHint": "åªçœ‹å·²å½’æ¡£çš„è®°å¿†ï¼ˆé»˜è®¤åˆ—è¡¨ä¸å«å®ƒä»¬ï¼‰",
        "memory.explorer.topK": "è¿”å›æ•°é‡",
        "memory.explorer.topKOption": "è¿”å› {n} æ¡",
        "memory.card.open": "åœ¨è®°å¿†åº“ä¸­æŸ¥çœ‹å…¨æ–‡",
        "memory.time.now": "åˆšåˆš",
        "memory.time.seconds": "{n}ç§’å‰",
        "memory.time.minutes": "{n}åˆ†é’Ÿå‰",
        "memory.time.hours": "{n}å°æ—¶å‰",
        "memory.time.days": "{n}å¤©å‰",
        "memory.graph.title": "è®°å¿†å›¾è°±",
        "memory.graph.aria": "è®°å¿†å›¾è°±",
        "memory.graph.placeholder": "è¾“å…¥å®ä½“åï¼ŒæŸ¥çœ‹å…³è”ç½‘ç»œâ€¦",
        "memory.graph.depth": "è·³æ•°",
        "memory.graph.empty": "å›¾è°±å¾…ç§¯ç´¯ï¼šéšå¯¹è¯è®°å¿†çš„æ²‰æ·€ï¼Œå®ä½“ä¸å…³ç³»ä¼šè‡ªåŠ¨è¿›å…¥å›¾è°±",
        "memory.graph.notFound": "æœªæ‰¾åˆ°è¯¥å®ä½“",
        "memory.graph.related": "å…³è”è®°å¿†",
        "memory.graph.relation": "å…³ç³»",
        "memory.graph.sourceMemory": "æŸ¥çœ‹æ¥æºè®°å¿†",
        "memory.graph.sourceLoading": "æ­£åœ¨è¯»å–æ¥æºè®°å¿†â€¦",
        "memory.graph.sourceDenied": "æ— æƒè¯»å–è¿™æ¡æ¥æºè®°å¿†ã€‚",
        "memory.graph.sourceMissing": "æ¥æºè®°å¿†å·²ä¸å­˜åœ¨ã€‚",
        "memory.graph.sourceError": "æ¥æºè®°å¿†è¯»å–å¤±è´¥ï¼Œè¯·ç¨åé‡è¯•ã€‚",
        "memory.graph.hint": "æ‹–æ‹½èŠ‚ç‚¹è°ƒæ•´å¸ƒå±€ Â· ç©ºç™½å¤„æ‹–åŠ¨å¹³ç§» Â· æ»šè½®ç¼©æ”¾",
        "memory.graph.resetView": "é‡ç½®è§†å›¾",
        "memory.graph.summary": "å®ä½“å…³ç³»å›¾ï¼š{entity} åŠå…¶ {nodes} ä¸ªèŠ‚ç‚¹ã€{edges} æ¡å…³ç³»",
        "memory.graph.viewInGraph": "åœ¨å®ä½“è§†å›¾ä¸­æ‰“å¼€",
        "memory.graph.loading": "åŠ è½½ä¸­â€¦",
        "memory.graph.distance": "è·ä¸­å¿ƒ {n} è·³",
        "memory.settings.vectorTitle": "å‘é‡æœç´¢",
        "memory.settings.vectorHint": "æœç´¢ä¸å†åªè®¤å­—é¢ï¼šæ¥å…¥ä»»æ„ OpenAI å…¼å®¹çš„ embedding æ¥å£åï¼Œæ„æ€ç›¸è¿‘çš„è®°å¿†ä¹Ÿèƒ½è¢«å¬å›ã€‚",
        "memory.settings.vectorEnabled": "å¯ç”¨å‘é‡æœç´¢",
        "memory.settings.vectorBaseUrl": "API åœ°å€ (Base URL)",
        "memory.settings.vectorApiKey": "API Key",
        "memory.settings.vectorModel": "æ¨¡å‹å",
        "memory.settings.vectorSave": "ä¿å­˜é…ç½®",
        "memory.settings.vectorSaved": "é…ç½®å·²ä¿å­˜",
        "memory.settings.vectorReindex": "é‡å»ºç´¢å¼•",
        "memory.settings.vectorReindexing": "ç´¢å¼•ä¸­â€¦",
        "memory.settings.vectorReindexDone": "å·²ç´¢å¼• {n} æ¡",
        "memory.settings.apiTokenTitle": "API Tokenï¼ˆå¯é€‰ï¼‰",
        "memory.settings.apiTokenHint": "è¿™é‡ŒåªæŠŠ Token å­˜åœ¨å½“å‰æµè§ˆå™¨ï¼ˆlocalStorageï¼‰ï¼Œä¾›é¢æ¿è¯·æ±‚æºå¸¦ï¼›æœåŠ¡ç«¯çš„é”æ˜¯æ’ä»¶é…ç½®é‡Œçš„ apiTokenï¼Œä¸¤è¾¹å¡«åŒä¸€ä¸ªå€¼æ‰çœŸæ­£ä¸Šé”ã€‚åªå¡«è¿™é‡Œä¸æ”¹æœåŠ¡ç«¯ = æ²¡ä¸Šé”ã€‚",
        "memory.settings.apiTokenPlaceholder": "ä¸æ’ä»¶é…ç½®çš„ apiToken ä¿æŒä¸€è‡´",
        "memory.settings.apiTokenSave": "ä¿å­˜ Token",
        "memory.settings.apiTokenSaved": "Token å·²ä¿å­˜",
        "memory.settings.feedback.title": "æ„è§ä¸åé¦ˆ",
        "memory.settings.feedback.desc": "é‡åˆ°é—®é¢˜ï¼Ÿç›´æ¥å‘Šè¯‰æˆ‘ä»¬ï¼Œæˆ–å…ˆçœ‹çœ‹æœ‰æ²¡æœ‰äººé‡åˆ°è¿‡ï¼š",
        "memory.settings.feedback.newIssue": "åœ¨ GitHub ä¸Šåé¦ˆé—®é¢˜",
        "memory.settings.feedback.newIssue.sub": "è‡ªåŠ¨å¸¦ä¸Šæ’ä»¶ç‰ˆæœ¬ä¸ç¯å¢ƒä¿¡æ¯",
        "memory.settings.feedback.email": "é‚®ä»¶åé¦ˆ",
        "memory.settings.feedback.email.sub": "work@modusensus.space",
        "memory.settings.feedback.browse": "æµè§ˆå·²çŸ¥é—®é¢˜",
        "memory.settings.feedback.browse.sub": "å…ˆæœæœï¼Œçœä¸€ä»½é‡å¤ issue",
        "memory.settings.feedback.hint": "åé¦ˆå‰å…ˆæœæœæ˜¯å¦å·²æœ‰ç›¸åŒé—®é¢˜ï¼Œèƒ½çœä¸€ä»½é‡å¤çš„ issueï½",
        "memory.settings.update.check": "æ£€æµ‹æ›´æ–°",
        "memory.settings.update.latest": "å·²æ˜¯æœ€æ–°ç‰ˆæœ¬ âœ“",
        "memory.settings.update.ahead": "å½“å‰ç‰ˆæœ¬æ¯” registry è¿˜æ–°ï¼ˆæœ¬åœ°å¼€å‘ç‰ˆï¼‰",
        "memory.settings.update.error": "æ£€æµ‹å¤±è´¥ï¼šç¨åå†è¯•",
        // æ£€æµ‹æ›´æ–°ç‚¹å‡ºçš„ç¬¬ä¸‰ç§ç»“æœï¼ˆå‘ç°æ–°ç‰ˆæœ¬ï¼‰ï¼›æ¨ªå¹…å½¢æ€å·²åˆ ï¼Œå®ƒç°åœ¨åªæ˜¯
        // æŒ‰éœ€é‚£ä¸€è¡Œçš„æ–‡æ¡ˆï¼Œå ä½ {v}/{c} ç”± checkResultText å¡«ã€‚
        "memory.settings.version.outdated": "æœ‰æ–°ç‰ˆæœ¬ {v}ï¼ˆå½“å‰è¿è¡Œ {c}ï¼‰",
        "memory.settings.version.outdatedHint": "è‹¥å®‰è£…æ—¶æŒ‡å®šè¿‡ç‰ˆæœ¬å·ï¼Œå¸¸è§„å‡çº§ä¸ä¼šè·¨å¤§/å°ç‰ˆæœ¬ï¼ˆpnpm é’‰å­ï¼‰â€”â€”è¯·é‡æ–°å®‰è£…æˆ–åœ¨å‡çº§å‘½ä»¤åŠ  --latestï¼›npm å·²å‘å¸ƒè€Œå¸‚åœºæš‚æœªæ”¶å½•å±æ­£å¸¸ï¼ˆçº¦ 1 å¤©å»¶è¿Ÿï¼‰ã€‚",
        "memory.settings.star": "ç»™é¡¹ç›®ç‚¹ä¸ª Star",
        "memory.settings.star.sub": "å®ƒå¯¹ä½ æ˜¯å¥½ç”¨çš„ï¼Œå°±é¼“åŠ±ä¸€ä¸‹ä½œè€…å§ (â—'â—¡'â—)",
        "memory.settings.mode.title": "è¿è¡Œæ¨¡å¼",
        "memory.settings.mode.desc": "è½»é‡æ¨¡å¼åªä¿ç•™æ ¸å¿ƒèƒ½åŠ›ï¼šè®°å¿†è¯»å†™ã€è‡ªåŠ¨æ³¨å…¥ã€çƒ­è®°å¿†ï¼›å·©å›ºã€å®ä½“æŠ½å–ã€è¯­ä¹‰æœç´¢ç­‰å…¨éƒ¨å…³é—­ï¼Œé€‚åˆä½é…æœºå™¨æˆ–åªæƒ³ã€Œè®°ä½åå¥½ã€çš„åœºæ™¯ã€‚æ ‡å‡†æ¨¡å¼å¼€å¯å…¨éƒ¨åŠŸèƒ½ã€‚",
        "memory.settings.mode.light": "è½»é‡",
        "memory.settings.mode.standard": "æ ‡å‡†",
        "memory.settings.mode.savedHint": "å·²ä¿å­˜ï¼Œé‡å¯ DSH åç”Ÿæ•ˆ",
        "memory.settings.mode.offList": "å·²å…³é—­ï¼šå·©å›ºï¼ˆautoDreamï¼‰Â· å®ä½“æŠ½å– Â· è¯­ä¹‰æœç´¢",
        "memory.settings.extapi.title": "å¤–éƒ¨è®¿é—® API",
        "memory.settings.extapi.desc": "å¼€æ”¾ä¸€ä¸ªæœ¬æœºæ¥å£ï¼Œè®©å…¶ä»–å·¥å…·ï¼ˆæ’ä»¶ã€å‘½ä»¤è¡Œã€æ¡Œé¢åº”ç”¨ï¼‰ä¹Ÿèƒ½è¯»å†™è¿™ä»½è®°å¿†åº“ï¼Œé»˜è®¤åªå…è®¸æœ¬æœºè¿æ¥ã€‚æ”¹åŠ¨ä¿å­˜åé‡å¯ DSH ç”Ÿæ•ˆã€‚",
        "memory.settings.extapi.enabled": "å¯ç”¨",
        "memory.settings.extapi.disabled": "åœç”¨",
        "memory.settings.extapi.address": "åœ°å€",
        "memory.settings.extapi.port": "ç«¯å£",
        "memory.settings.extapi.token": "Token",
        "memory.settings.extapi.copy": "å¤åˆ¶",
        "memory.settings.extapi.copied": "å·²å¤åˆ¶",
        "memory.settings.serve.title": "ç‹¬ç«‹æœåŠ¡ dsh-mneme-serve",
        "memory.settings.serve.desc": "ä¸å¯åŠ¨ DSH ä¹Ÿèƒ½ä»¥ HTTP æ–¹å¼è®¿é—®åŒä¸€ä»½è®°å¿†åº“ï¼ˆæ—  LLM æ•°æ®é¢ï¼‰ã€‚",
        "memory.settings.serve.cmd": "npx -p @fg-lab/amadeus-memory dsh-mneme-serve --memory-dir <è®°å¿†åº“ç›®å½•> --port <ç«¯å£>",
        "memory.settings.serve.copy": "å¤åˆ¶",
        "memory.settings.serve.copied": "å·²å¤åˆ¶",
        "memory.settings.serve.hint": "ä¸ã€Œå¤–éƒ¨è®¿é—® APIã€åŒæºï¼šåŒä¸€å¥—è·¯ç”±ä¸é‰´æƒï¼ŒæŒ‡å‘åŒä¸€è®°å¿†åº“ç›®å½•æ—¶ï¼Œè°ƒç”¨æ–¹åº”ä½¿ç”¨é¢æ¿è¿™å¼ ä»¤ç‰Œï¼ˆé€šå¸¸æœ‰æ•ˆï¼Œéæ‰¿è¯ºï¼‰ã€‚ä¸¤è€…é»˜è®¤æŠ¢åŒä¸€ç«¯å£ï¼ŒäºŒé€‰ä¸€æˆ–ç”¨ --port é”™å¼€ã€‚",
        "memory.settings.mcp.title": "MCP æœåŠ¡ dsh-mneme-mcp",
        "memory.settings.mcp.desc": "stdio MCP æœåŠ¡å™¨ï¼šä»»ä½• MCP å®¢æˆ·ç«¯ï¼ˆClaude Code / Cursor ç­‰ï¼‰æŒ‚è½½åï¼Œå³å¯è·å¾—ä¸ DSH å†…ä¸€è‡´çš„è®°å¿†å·¥å…·å…­ä»¶å¥—ã€‚",
        "memory.settings.mcp.snippet": "{ \"mcpServers\": { \"dsh-mneme\": { \"command\": \"dsh-mneme-mcp\", \"env\": { \"DSH_MNEME_TOKEN\": \"<å¤–éƒ¨è®¿é—® API çš„ token>\" } } } }",
        "memory.settings.mcp.copy": "å¤åˆ¶",
        "memory.settings.mcp.copied": "å·²å¤åˆ¶",
        "memory.settings.mcp.hint": "æ•°æ®é¢èµ°ã€Œå¤–éƒ¨è®¿é—® APIã€ï¼ˆé»˜è®¤ 127.0.0.1:8790ï¼ŒBearerï¼‰ï¼Œtoken å°±æ˜¯ä¸Šé¢é‚£å¼ ï¼›å¯ç”¨ DSH_MNEME_URL / DSH_MNEME_TOKEN ç¯å¢ƒå˜é‡æˆ– ~/.dsh-mneme/cli.json è¦†ç›–ã€‚command éœ€åœ¨ PATH ä¸Šï¼ˆéš @fg-lab/amadeus-memory å®‰è£…è‡ªå¸¦ï¼‰ã€‚",
        "memory.settings.extapi.savedHint": "å·²ä¿å­˜ï¼Œé‡å¯ DSH åç”Ÿæ•ˆ",
        "memory.settings.extapi.invalidPort": "ç«¯å£éœ€ä¸º 1-65535 çš„æ•°å­—",
        "memory.tab.rejected_solution": "è¢«å¦å†³æ–¹æ¡ˆ",
        "memory.tab.pitfall": "è¸©å‘è®°å½•",
        "memory.tab.constraint": "å·¥ç¨‹çº¦æŸ",
        "memory.tab.document": "æ–‡æ¡£",
        "memory.features.title": "åŠŸèƒ½å¼€å…³",
        "memory.features.desc": "æ§åˆ¶æ’ä»¶åœ¨åå°åšå“ªäº›äº‹ã€‚å…ˆçœ‹ã€Œå¸¸ç”¨ã€é‡Œçš„æ€»å¼€å…³å°±å¤Ÿäº†ï¼Œå…¶ä½™é¡¹æ”¶åœ¨ã€Œå…¨éƒ¨è®¾ç½®ã€é‡Œã€‚æ”¹åŠ¨å³æ—¶ä¿å­˜ï¼Œé‡å¯ DSH åç”Ÿæ•ˆã€‚",
        // Issue #427ï¼šåˆ†ç»„åŸå…ˆæŒ‰ã€Œå®ç°ã€åˆ†ï¼ˆåŸºç¡€/æ£€ç´¢ä¸å¢å¼º/å·©å›ºä¸ç¡çœ /å¤šä¼šè¯éš”ç¦»
        // æ˜¯æ¶æ„å›¾çš„åˆ†åŒºï¼‰ï¼Œè€ŒäººçœŸæ­£ä¼šé—®çš„æ˜¯å››ä¸ªé—®é¢˜ï¼šå®ƒä¼šè®°ä½ä»€ä¹ˆã€å®ƒä»€ä¹ˆæ—¶å€™
        // å†™è¿›å»ã€å®ƒæ€ä¹ˆç”¨å›æ¥ã€ä¸åŒä¼šè¯ä¼šä¸ä¼šä¸²ã€‚ç»„åæ”¹æˆäººè¯ï¼Œæœ¯è¯­ç•™åœ¨ hintã€‚
        // group.basic æ˜¯é¦–å±å±‚ï¼šæ–°ç”¨æˆ·ä¸è¯»æ–‡æ¡£å°±è¯¥ç­”å¾—å‡ºã€Œä¼šä¸ä¼šè‡ªåŠ¨è®°ã€ï¼›
        // ã€Œåˆ«çš„ä¼šè¯èƒ½ä¸èƒ½çœ‹åˆ°ã€ç”±åŒåœ¨é¦–å±çš„ scope ç»„å›ç­”ã€‚
        "memory.features.group.basic": "å¸¸ç”¨ï¼ˆå…ˆåŠ¨è¿™å‡ ä¸ªï¼‰",
        "memory.features.group.core": "å®ƒä¼šè®°ä½ä»€ä¹ˆ",
        // group.mo æ˜¯ v0.9.0 æ–°å¢çš„ç‹¬ç«‹åˆ†ç»„ï¼ˆåº§ä½é—¸é—¨ï¼Œä¸æ˜¯è¡Œä¸ºå¼€å…³ï¼‰ï¼›æ¸²æŸ“
        // èµ° t(`memory.features.${g.key}`)ï¼Œç¼ºè¿™è¡Œä¼šæŠŠé”®åç›´æ¥å†™ä¸Šå±ã€‚
        "memory.features.group.mo": "å®ƒçš„å·¥ä½œæµï¼ˆM.O.ï¼‰",
        "memory.features.group.enhance": "å®ƒä»€ä¹ˆæ—¶å€™å†™è¿›å»",
        "memory.features.group.dream": "å®ƒæ€ä¹ˆç”¨å›æ¥",
        "memory.features.group.scope": "ä¸åŒä¼šè¯ä¹‹é—´",
        "memory.features.group.scene": "åœºæ™¯ã€è¿‘æœŸä¸æ ¸å¿ƒè®°å¿†",
        "memory.features.sceneGuide": "QQ è®°å¿†è¦åŒæ—¶æ‰“å¼€ä¸‹é¢ä¸¤ä¸ªå¼€å…³ï¼šåœºæ™¯éš”ç¦»è®°å½•å¯ä¿¡åœºæ™¯å½’å±ï¼Œä¸¥æ ¼ QQ æ¨¡å¼æ‰å…è®¸ QQ ä¼šè¯ä½¿ç”¨é•¿æœŸè®°å¿†ï¼›åªå¼€ä¸€ä¸ªéƒ½ä¼šæ‹’ç» QQ æ¨¡å‹è®¿é—®ã€‚å‡çº§æ—§åº“å‰å…ˆåœå†™å¹¶æ•´ä½“å¤åˆ¶æ—§ memoryDir åˆ°ä¸€ä¸ªæ–°çš„éš”ç¦»ç›®å½•ï¼Œç¡®è®¤æ–°å®ä¾‹èƒ½è¯»åˆ°æ•°æ®å†åœç”¨æ—§åº“ï¼›ä¸è¦åŸåœ°å¤ç”¨æˆ–è®©ä¸¤ä¸ªå®ä¾‹åŒæ—¶å†™åŒä¸€ä»½ memory.dbã€‚",
        "memory.features.sceneIsolationEnabled": "æŒ‰ QQ åœºæ™¯éš”ç¦»è®°å¿†",
        "memory.features.sceneIsolationEnabled.hint": "å¼€ï¼šè®°å½•å¹¶è¿‡æ»¤å¯ä¿¡ Host çš„åœºæ™¯å½’å±ï¼›åªå¼€è¿™ä¸€é¡¹è¿˜ä¸è¶³ä»¥è®© QQ ä¼šè¯ä½¿ç”¨é•¿æœŸè®°å¿†ï¼Œè¿˜éœ€æ‰“å¼€ä¸¥æ ¼ QQ åœºæ™¯æ¨¡å¼",
        "memory.features.sceneStrictQQ": "ä¸¥æ ¼ QQ åœºæ™¯æ¨¡å¼",
        "memory.features.sceneStrictQQ.hint": "å¼€ï¼šè·¨åœºæ™¯æ™®é€šè®°å¿†ã€å›¾è°±å’Œæ™®é€š HTTP å†…å®¹æ¥å£å…¨éƒ¨æ‹’ç»ï¼›autoDream ä¸ Sleep æš‚åœï¼Œå¯ä¿¡ QQ Session çš„è‡ªåŠ¨æ‘˜è¦ä»å¯è¿è¡Œã€‚å¿…é¡»ä¸åœºæ™¯éš”ç¦»åŒæ—¶æ‰“å¼€ã€‚é»˜è®¤å…³",
        "memory.features.recentContextEnabled": "è¿‘æœŸä¸Šä¸‹æ–‡ï¼ˆ10 åˆ†é’Ÿï¼‰",
        "memory.features.recentContextEnabled.hint": "å¼€ï¼šåœ¨å†…å­˜ä¸­ä¿ç•™æœ‰é™è¿‘æœŸäº‹ä»¶ï¼Œä»…åœ¨æˆæƒæ–¹å‘æ³¨å…¥ï¼›ä¸è°ƒç”¨åµŒå…¥/æ¨¡å‹ï¼Œä¸å†™é•¿æœŸè®°å¿†",
        "memory.features.coreMemoryEnabled": "æ ¸å¿ƒè®°å¿†ï¼ˆå—ä¿æŠ¤ï¼‰",
        "memory.features.coreMemoryEnabled.hint": "å¼€ï¼šå…è®¸æˆæƒç®¡ç†å‘˜ç§èŠä¿å­˜å—ä¿æŠ¤æ ¸å¿ƒè®°å¿†ï¼›ä¿æŠ¤ä¸ç­‰äºé‡è¦åº¦ï¼Œæ™®é€šç»´æŠ¤ä¸èƒ½åˆ é™¤æˆ–è¦†ç›–",
        "memory.features.group.advanced": "é«˜çº§",
        // ã€Œå…¨éƒ¨è®¾ç½®ã€= ç¬¬ä¸€å±‚æŠ˜å ï¼ˆissue #427 å»ºè®® 1ï¼‰ï¼Œå¸¸æ˜¾åªç•™ basic + scope
        // ä¸¤ç»„ï¼›ã€Œé«˜çº§ã€æ˜¯å®ƒå†…éƒ¨çš„ç¬¬äºŒå±‚ï¼ˆè¿›é˜¶ 7 é¡¹ï¼‰ã€‚
        "memory.features.allToggle": "å…¨éƒ¨è®¾ç½®",
        "memory.features.advancedToggle": "æ›´å°‘ç”¨çš„ 7 ä¸ªå¼€å…³",
        "memory.features.restartHint": "é‡å¯ DSH åç”Ÿæ•ˆ",
        "memory.features.loadFailed": "åŠ è½½å¤±è´¥",
        "memory.features.saveFailed": "ä¿å­˜å¤±è´¥",
        // Issue #427 å»ºè®® 2ï¼šæ¡ç›®åç»™ã€Œæ‰“å¼€ä¼šæ€æ ·ã€å…³æ‰ä¼šæ€æ ·ã€ï¼Œæœ¯è¯­æ”¾æœ«å°¾ã€‚
        // æ‹¬å·é‡Œçš„è‹±æ–‡æ˜¯è®¾ç½®é¡¹é”®åï¼Œæœ«å°¾çš„ã€Œï¼ˆBM25ï¼‰ã€æ‰æ˜¯æœ¯è¯­ã€‚
        "memory.features.autoInject": "è‡ªåŠ¨å¸¦ä¸Šæ—§è®°å¿†ï¼ˆæ¯è½®éƒ½ç”¨ï¼‰",
        "memory.features.autoInject.hint": "å¼€ï¼šæ¯è½®è‡ªåŠ¨æŒ‘ç›¸å…³è®°å¿†å¡ç»™ Agentï¼Œå®ƒä¸ç”¨é—®å°±èƒ½æƒ³èµ·ï¼›å…³ï¼šAgent å¾—è‡ªå·±è°ƒç”¨æŸ¥è®°å¿†çš„å·¥å…·",
        "memory.features.injectGuidanceEnabled": "é¡ºå¸¦æ•™ Agent æ€ä¹ˆç”¨è®°å¿†",
        "memory.features.injectGuidanceEnabled.hint": "å¼€ï¼šåœ¨è®°å¿†å·¥å…·çš„è¯´æ˜é‡Œå†™æ¸…ä»€ä¹ˆæ—¶å€™è¯¥æŸ¥ã€ä»€ä¹ˆæ—¶å€™è¯¥å†™ï¼›å…³ï¼šåªç»™å·¥å…·ä¸ç»™ç”¨æ³•",
        "memory.features.continuityRescueEnabled": "é•¿å¯¹è¯è¢«å‹ç¼©å‰å…ˆå­˜ä¸€ä»½å¿«ç…§",
        "memory.features.continuityRescueEnabled.hint": "å¼€ï¼šå‹ç¼©å‰å…ˆå­˜ã€Œæ­£åœ¨åšä»€ä¹ˆ / ä¸‹ä¸€æ­¥ / æœªå†³é—®é¢˜ã€ï¼Œå…³é”®ä¸Šä¸‹æ–‡æ´»è¿‡å‹ç¼©ï¼›å…³ï¼šå‹ç¼©å¯èƒ½æŠŠå®ƒå‹æ‰",
        "memory.features.parentOff": "ä¸Šä¸€é¡¹å…³é—­æ—¶ä¸ç”Ÿæ•ˆ",
        // ã€Œé»˜è®¤ / å·²æ”¹ã€å¾½æ ‡ï¼šoverrides é‡Œæ²¡æœ‰è¿™ä¸ªé”® = å€¼æ¥è‡ª config schema çš„
        // é»˜è®¤å€¼ï¼Œä¸€æ¡å‘½ä»¤å°±èƒ½é€€å›ã€‚å¾½æ ‡è®©è¿™ä»¶äº‹ä¸å¿…å»è¯»é…ç½®æ–‡ä»¶æ‰æˆç«‹ã€‚
        "memory.features.tagDefault": "é»˜è®¤",
        "memory.features.tagDefault.hint": "è¿™ä¸€é¡¹ç”¨çš„æ˜¯å‡ºå‚é»˜è®¤å€¼ï¼Œæ²¡æœ‰è¢«ä½ æ”¹è¿‡",
        "memory.features.tagChanged": "å·²æ”¹",
        "memory.features.tagChanged.hint": "ä½ æ”¹è¿‡è¿™ä¸€é¡¹ï¼Œå®ƒä¸å†ç”¨é»˜è®¤å€¼",
        // ã€Œå¾…é‡å¯ã€æ˜¯ç¬¬ä¸‰æ€ï¼Œä¸æ˜¯ã€Œå·²æ”¹ã€çš„åŠ å¼ºç‰ˆï¼š#481 ä¹‹å‰é¢æ¿åªæœ‰ã€Œå·²æ”¹ã€ï¼Œ
        // ç”¨æˆ·æ”¹å®Œæ€»é—¸çœ‹åˆ°å¾½æ ‡äº®èµ·å°±ä»¥ä¸ºç”Ÿæ•ˆäº†ï¼Œå®é™…è¿è¡Œæ—¶è¿˜åœ¨ç”¨å¯åŠ¨æ—¶çš„æ—§å€¼ã€‚
        "memory.features.tagPending": "å¾…é‡å¯",
        "memory.features.tagPending.hint": "è¿™ä¸€é¡¹å·²å­˜è¿›é…ç½®ï¼Œä½†æœ¬æ¬¡å¯åŠ¨è¿˜æ²¡ç”¨ä¸Šâ€”â€”é‡å¯ DSHï¼ˆæˆ–åœ¨æ’ä»¶ç®¡ç†é‡Œå…³å¼€ä¸€æ¬¡æœ¬æ’ä»¶ï¼‰åæ‰ç”Ÿæ•ˆ",
        "memory.features.pendingRestartNotice": "æœ‰æ”¹åŠ¨è¿˜æ²¡ç”Ÿæ•ˆï¼šæ ‡ç€ã€Œå¾…é‡å¯ã€çš„å¼€å…³è¦ç­‰é‡å¯ DSH åæ‰èµ·ä½œç”¨ï¼ˆåœ¨æ’ä»¶ç®¡ç†é‡ŒæŠŠæœ¬æ’ä»¶å…³å¼€ä¸€æ¬¡ä¹Ÿè¡Œï¼‰ã€‚",
        "memory.features.autoSummarize": "è‡ªåŠ¨æŠŠå¯¹è¯è®°ä¸‹æ¥ï¼ˆè‡ªåŠ¨æ³¨å…¥ä¹‹å¤–ï¼‰",
        "memory.features.autoSummarize.hint": "å¼€ï¼šå¯¹è¯ç»“æŸè‡ªåŠ¨æç‚¼æˆé•¿æœŸè®°å¿†æ¡ç›®ï¼ˆautoSummarizeï¼‰ï¼›å…³ï¼šåªæœ‰ä½ æ‰‹åŠ¨å­˜æˆ– Agent ä¸»åŠ¨å­˜æ‰æœ‰è®°å¿†",
        "memory.features.hotMemoryEnabled": "é¡ºå¸¦å¸¦ä¸Šæœ€è¿‘å‡ è½®åŸè¯",
        "memory.features.hotMemoryEnabled.hint": "å¼€ï¼šæ³¨å…¥æ—¶æŠŠæœ€è¿‘å‡ è½®çš„å¯¹è¯åŸæ–‡ä¸€å¹¶å¸¦ä¸Šï¼ŒAgent çœ¼å‰å°±æ˜¯åˆšæ‰èŠçš„å†…å®¹ï¼›å…³ï¼šåªå¸¦æç‚¼åçš„é•¿æœŸè®°å¿†ã€‚è¿™å‡ è½®åŸæ–‡ä¸ä¼šå†™è¿›é•¿æœŸè®°å¿†ï¼ˆçƒ­è®°å¿†ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.injectTimePrefix": "ä¼šè¯å¼€å¤´å‘Šè¯‰å®ƒä»Šå¤©å‡ å·",
        "memory.features.injectTimePrefix.hint": "å¼€ï¼šæ¯ä¸ªæ–°ä¼šè¯çš„ç¬¬ä¸€è½®æ³¨å…¥ä¸€æ¬¡æ—¥æœŸä¸æ˜ŸæœŸï¼Œã€Œä»Šå¤©ã€ã€Œä¸Šå‘¨ã€è¿™ç±»è¯´æ³•æ›´ç¨³ï¼›å…³ï¼šæ³¨å…¥é‡Œä¸å¸¦æ—¶é—´ï¼ˆæ—¶é—´å‰ç¼€ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.entityExtractionEnabled": "é¡ºæ‰‹æŠ½å‡ºäººåã€é¡¹ç›®å’Œæ¦‚å¿µ",
        "memory.features.entityExtractionEnabled.hint": "å¼€ï¼šæ¯æ¡æ–°è®°å¿†é‡ŒæŠ½å‡ºäººç‰©/é¡¹ç›®/æ¦‚å¿µï¼Œå…³ç³»å›¾è°±è‡ªå·±é•¿èµ·æ¥ï¼Œä¹Ÿèƒ½æŒ‰ã€Œè°ã€æ‰¾è®°å¿†ï¼›å…³ï¼šåªå­˜æ•´æ¡è®°å¿†ï¼Œä¸å»ºå…³ç³»ï¼ˆå®ä½“æŠ½å–ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.memoryPreferenceEnabled": "åå¥½æƒé‡å‚ä¸æ£€ç´¢",
        "memory.features.memoryPreferenceEnabled.hint": "å¼€ï¼šæ ‡ç­¾æƒé‡ä¸è§„èŒƒå®ä½“æƒé‡ä»¥ 0.6â€“1.6 çš„æ¸©å’Œä¹˜æ•°å‚ä¸å¬å›ï¼ˆå…ˆè¿‡ç›¸å…³åº¦ä¸‹é™ï¼‰ï¼Œåªå½±å“æ’åºï¼Œä¸æ”¹è‡ªåŠ¨é‡è¦æ€§ï¼›å…³ï¼ˆé»˜è®¤ï¼‰ï¼šæ£€ç´¢ä¸æ”¹åŠ¨å‰ä¸€è‡´ã€‚",
        "memory.features.trustedIntakeEnabled": "å—ä¿¡ç»å†å†™å…¥æ¥å£",
        "memory.features.trustedIntakeEnabled.hint": "å¼€ï¼šå…è®¸ Life é€šè¿‡ POST /intake æºå¸¦æ¥æºã€å‚ä¸è€…ä¸å®ŒæˆçŠ¶æ€å†™å…¥å…±åŒç»å†ï¼›éœ€è¦æœåŠ¡ç«¯é…ç½® apiTokenï¼Œç¼ºçœå…³é—­ã€‚ä¸ä¼šè®©æ¨¡å‹ä»é—²èŠé‡ŒçŒœã€Œåšè¿‡ã€ã€‚",
        "memory.features.entityExtractionProvider": "å®ä½“æŠ½å– Provider",
        "memory.features.entityExtractionModel": "å®ä½“æŠ½å–æ¨¡å‹",
        "memory.features.entityExtractionReasoning": "å®ä½“æŠ½å–æ€è€ƒå¼ºåº¦",
        "memory.features.entityExtractionReasoning.none": "è·Ÿéšé»˜è®¤",
        "memory.features.entityExtractionReasoning.low": "ä½",
        "memory.features.entityExtractionReasoning.medium": "ä¸­",
        "memory.features.entityExtractionReasoning.high": "é«˜",
        "memory.features.summarizeReasoningEffort": "è’¸é¦æ€è€ƒå¼ºåº¦",
        "memory.features.summarizeReasoningEffort.off": "å…³é—­æ€è€ƒ",
        "memory.features.summarizeReasoningEffort.none": "è·Ÿéšé»˜è®¤",
        "memory.features.summarizeReasoningEffort.low": "ä½",
        "memory.features.summarizeReasoningEffort.medium": "ä¸­",
        "memory.features.summarizeReasoningEffort.high": "é«˜",
        "memory.features.summarizeReasoningEffort.hint": "æ€è€ƒå‹æ¨¡å‹å»ºè®®é€‰ã€Œä½ã€æˆ–ã€Œå…³é—­æ€è€ƒã€ï¼Œé¿å…æ¨ç†å æ»¡è¾“å‡ºå¯¼è‡´æ€»ç»“å¤±è´¥",
        "memory.features.entityExtractionModelHint": "Provider / æ¨¡å‹ç•™ç©º = è·Ÿéšä¸»å¯¹è¯æ¨¡å‹ï¼›æ€è€ƒå¼ºåº¦é€‰ã€Œè·Ÿéšé»˜è®¤ã€= æœåŠ¡å•†é»˜è®¤",
        "memory.features.codingRetrospect": "å†™ä»£ç çš„è¿‡ç¨‹ä¹Ÿè®°ä¸‹æ¥",
        "memory.features.codingRetrospect.hint": "å¼€ï¼šæ•´æ®µç¼–ç è¿‡ç¨‹ï¼ˆå«æŠ¥é”™ä¸å·¥å…·è°ƒç”¨ï¼‰ä¸€å¹¶å›é¡¾ï¼Œæ²‰æ·€è¸©å‘ã€çº¦æŸå’Œè¢«å¦å†³çš„æ–¹æ¡ˆï¼›å…³ï¼šåªæç‚¼å¯¹è¯å†…å®¹ï¼ˆç¼–ç è®°å¿†è’¸é¦ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.rerankEnabled": "æœå‡ºæ¥çš„ç»“æœå†ç²¾æ’ä¸€é",
        "memory.features.rerankEnabled.hint": "å¼€ï¼šæœ¬åœ°é‡æ’æ¨¡å‹ç»™å¬å›ç»“æœé‡æ–°æ‰“åˆ†ï¼Œæ›´å‡†ä½†æ›´æ…¢ï¼›å…³ï¼šç›´æ¥ç”¨æ£€ç´¢æ—¶çš„æ’åºï¼ˆç»“æœé‡æ’ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.heatEnabled": "è¶Šä¹…æ²¡ç”¨è¶Šé åï¼ˆåƒä¼šå¿˜ï¼‰",
        "memory.features.heatEnabled.hint": "å¼€ï¼šåƒé—å¿˜æ›²çº¿ä¸€æ ·ç»™è®°å¿†é™æ¸©ï¼Œé•¿æœŸæ²¡ç”¨è¿‡çš„å¾€åæ’ã€ä¸å æ³¨å…¥åé¢ï¼›å…³ï¼šä¸€ç›´æŒ‰ç›¸å…³åº¦æ’ï¼ˆçƒ­åº¦è¡°å‡ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.documentMemoryEnabled": "é•¿æ–‡æ¡£åªå­˜ä¸€å¼ æ‘˜è¦å¡",
        "memory.features.documentMemoryEnabled.hint": "å¼€ï¼šAgent å†™çš„é•¿æ–‡æ¡£åœ¨è®°å¿†é‡Œåªæ”¾ã€Œæ‘˜è¦å¡ã€ï¼Œæ­£æ–‡ä»ç”± Agent ä¿ç®¡ã€æŒ‰éœ€è¯»å–ï¼Œæ³¨å…¥åªå¸¦æ‘˜è¦ï¼›å…³ï¼šæ•´ç¯‡éƒ½å¾€ä¸Šä¸‹æ–‡é‡Œå¸¦ï¼ˆdocument å‹è®°å¿†ï¼Œé»˜è®¤å…³ï¼‰",
        // --- v0.9.0 M.O.ï¼ˆModus Operandiï¼Œbetaï¼‰---
        // M.O. = Modus Operandiï¼Œæ‹‰ä¸è¯­ã€Œä¸€ä¸ªäººä¸€è´¯çš„åšäº‹æ–¹å¼ã€ï¼›ä¹Ÿæ˜¯ org è¯æ ¹
        // modusï¼ˆmodusensusï¼‰ã€‚ç•Œé¢ä¸»æ˜¾ç¤º M.O.ï¼Œè®¾ç½®é¡¹ hint ç¬¬ä¸€å¥ç»™å…¨åã€‚
        "memory.actions.beta": "beta",
        "memory.actions.notice": "æç‚¼ç»“æœæ˜¯å€™é€‰ï¼Œå¯èƒ½æœ‰é”™ã€è¿‡æ—¶ã€ä¼šè¢«æ¨ç¿»ã€‚",
        "memory.actions.title": "M.O. Â· å·¥ä½œæµ",
        "memory.actions.open": "æ‰“å¼€ M.O.",
        "memory.actions.viewFull": "å®Œæ•´è§†å›¾",
        "memory.actions.openPane": "åœ¨å³æ æ‰“å¼€å®Œæ•´è§†å›¾",
        "memory.actions.announce.open": "M.O. é¢æ¿å·²æ‰“å¼€",
        "memory.actions.announce.close": "M.O. é¢æ¿å·²å…³é—­",
        "memory.actions.close": "å…³é—­",
        "memory.actions.candidates": "å€™é€‰ {n} æ¡",
        "memory.actions.runs": "æœ€è¿‘è¿è¡Œ",
        "memory.actions.runOf": "è¿è¡Œ {n}",
        "memory.actions.run.ok": "æˆåŠŸ",
        "memory.actions.run.failed": "å¤±è´¥",
        "memory.actions.run.refuted": "è¢«æ¨ç¿»",
        "memory.actions.state.candidate": "å€™é€‰",
        "memory.actions.state.trusted": "å¯ä¿¡",
        "memory.actions.state.stale": "è¿‡æ—¶",
        "memory.actions.state.refuted": "è¢«æ¨ç¿»",
        "memory.actions.gate.has": "æœ‰é—¸é—¨è¯æ®",
        "memory.actions.gate.none": "è¿˜æ²¡é—¸é—¨",
        "memory.actions.gate.tag": "é—¸",
        "memory.actions.who.main": "ä¸»",
        "memory.actions.who.human": "äºº",
        "memory.actions.who.ci": "CI",
        "memory.actions.ov.done": "å®Œæˆåˆ¤æ®",
        "memory.actions.ov.trigger": "ä½•æ—¶è§¦å‘",
        "memory.actions.band.count": "{n} æ­¥",
        "memory.actions.legend.states": "çŠ¶æ€",
        "memory.actions.detail.situation": "æƒ…å½¢",
        "memory.actions.detail.action": "åŠ¨ä½œ",
        "memory.actions.detail.why": "ä¸ºä»€ä¹ˆ",
        "memory.actions.detail.cf": "åäº‹å®",
        "memory.actions.detail.noCf": "è¯¥èŠ‚ç‚¹è¿˜æ²¡æœ‰åäº‹å®è®°å½•",
        "memory.actions.detail.source": "æ¥æºè®°å¿†",
        "memory.actions.credit": "å¤ç”¨",
        "memory.actions.creditValue": "{n} æ¬¡ Â· ä¸Šæ¬¡ {d} å¤©å‰",
        "memory.actions.dep": "ä¾èµ–",
        "memory.actions.zoom.value": "ç¼©æ”¾ {n}%",
        "memory.actions.zoom.in": "æ”¾å¤§",
        "memory.actions.zoom.out": "ç¼©å°",
        "memory.actions.zoom.fit": "é€‚åº”å®½åº¦",
        "memory.actions.zoom.hint": "Ctrl/âŒ˜ + æ»šè½®ä¹Ÿèƒ½ç¼©æ”¾",
        // ç¼©æ”¾ç™¾åˆ†æ¯”æŒ‡ç¤ºï¼ˆ{n} ç”±ç”»å¸ƒå·¥å…·æ¡å¡«ï¼‰ï¼›åŸºçº¿ 4568614 èµ·å°±ç¼ºè¿™ä¸¤è¡Œï¼Œ
        // å·¥å…·æ¡ä¸Šä¼šç›´æ¥æ˜¾ç¤ºé”®åã€‚
        "memory.actions.list.heading": "è¿™ä¸ªé¡¹ç›®é‡Œçš„å·¥ä½œæµ",
        "memory.actions.list.count": "å·¥ä½œæµ {n} æ¡",
        "memory.actions.list.meta": "{steps} æ­¥ Â· {gates} é“é—¸é—¨ Â· åäº‹å® {cf}/{steps}",
        "memory.actions.scope.project": "é¡¹ç›® {name}",
        "memory.actions.scope.global": "å…¨å±€",
        "memory.actions.scope.none": "é¡¹ç›®æœªçŸ¥",
        "memory.actions.broken": "æœ‰æ–‡ä»¶è¯»ä¸å‡ºæ¥ï¼š",
        "memory.actions.empty.title": "è¿™ä¸ªé¡¹ç›®é‡Œè¿˜æ²¡æœ‰å·¥ä½œæµ",
        "memory.actions.empty.body": "å·¥ä½œæµçš„æœ¬ä½“ä½åœ¨é¡¹ç›®é‡Œçš„ .mneme/pipelines/ ä¸‹â€”â€”è·Ÿç€ä»“åº“èµ°ï¼Œèƒ½è¢«æäº¤ã€èƒ½è¢« reviewã€èƒ½è¢« CI è¯»ã€‚åšæ³•è¢«å¤ç”¨ç¬¬äºŒæ¬¡æ‰ç®—èŠ‚ç‚¹ç±»å‹ï¼Œç¬¬ä¸€æ¬¡åªæ˜¯å®ä¾‹ï¼›åŒä¸€è·¯å¾„è¢«èµ°é€šä¸¤æ¬¡ä¹‹åï¼Œå®ƒæ‰ä¼šä»ä¼šè¯é‡Œè¢«æç‚¼å‡ºæ¥ã€è½åˆ°é‚£ä¸ªç›®å½•é‡Œã€‚",
        "memory.actions.distill.action": "ç°åœ¨æ²‰æ·€ä¸€æ¬¡",
        "memory.actions.distill.busy": "æ­£åœ¨è¯»ä¼šè¯â€¦",
        "memory.actions.distill.hint": "çœ‹ä¸€éè¿™ä¸ªé¡¹ç›®è‡ªå·±çš„ä¼šè¯æ—¥å¿—ï¼ŒæŠŠåå¤èµ°é€šçš„åŠ¨ä½œæŒ–æˆæè®®ã€‚åªå†™æè®®ï¼Œä¸è½è‰ç¨¿ã€ä¸æ”¹ä»“åº“ã€‚",
        "memory.actions.distill.noProject": "è¯»ä¸åˆ°ä¼šè¯çš„å·¥ä½œç›®å½•ï¼Œæ‰€ä»¥ä¸çŸ¥é“è¯¥çœ‹å“ªä¸ªé¡¹ç›®çš„æ—¥å¿—",
        "memory.actions.distill.saved": "å·²æå‡º {n} æ¡æè®®ï¼ˆæœ¬æ¬¡æŒ–åˆ° {m} æ¡å€™é€‰ï¼‰",
        "memory.actions.distill.none": "è¿™ä¸€éæ²¡æŒ–åˆ°æ–°çš„é‡å¤åŠ¨ä½œ",
        "memory.actions.distill.noSessions": "è¿™ä¸ªé¡¹ç›®è¿˜æ²¡æœ‰è‡ªå·±çš„ä¼šè¯æ—¥å¿—ï¼Œå…ˆæ”’å‡ è½®å†æ¥",
        "memory.actions.distill.unreadable": "ä¼šè¯æ—¥å¿—è¯»ä¸å‡ºæ¥ï¼ˆè¿™æ˜¯ç¯å¢ƒé—®é¢˜ï¼Œä¸æ˜¯ã€Œæ²¡æœ‰é‡å¤åŠ¨ä½œã€ï¼‰",
        "memory.actions.distill.failed": "è¿™ä¸€éæ²¡è·‘å®Œï¼Œè¯¦è§æ’ä»¶æ—¥å¿—",
        "memory.actions.noRuns": "è¿™ä¸€æ¡è¿˜æ²¡æœ‰è¿è¡Œè®°å½•ï¼Œæ‰€ä»¥æ¯ä¸ªèŠ‚ç‚¹éƒ½è¿˜æ˜¯å€™é€‰ã€‚",
        "memory.actions.settle.title": "æœ¬æ¬¡è¿è¡Œ",
        "memory.actions.settle.line": "ã€Œ{title}ã€",
        "memory.actions.settle.used": "æœ¬æ¬¡å¤ç”¨ {n} æ¡åšæ³•ï¼ˆå‹¾é€‰ä¸ºè¢«ç”¨ä¸Šï¼‰",
        "memory.actions.settle.refutedWarn": "æœ¬æ¬¡è·¯å¾„é‡Œæœ‰å·²è¢«æ¨ç¿»çš„èŠ‚ç‚¹ï¼Œç»“æœä»…ä¾›å‚è€ƒ",
        "memory.features.actionPipelineEnabled": "M.O.ï¼ˆbetaï¼‰",
        "memory.features.actionPipelineEnabled.hint": "åªè¯»è§†å›¾ï¼šæŠŠçœŸå®ä¼šè¯é‡Œåå¤èµ°é€šçš„åŠ¨ä½œè¿æˆä¸€å¼ å›¾è°±â€”â€”ä¼šè¯å¤´å›¾æ ‡ã€å³æ å®Œæ•´è§†å›¾ã€æ¯æ¬¡è¿è¡Œçš„ç»“ç®—å¡ã€‚çœ‹ â‰  å†™ï¼šæ²‰æ·€ç”±ã€ŒM.O. è‡ªåŠ¨æ²‰æ·€ã€å•ç‹¬å¼€ï¼Œæ‰§è¡Œè®°è´¦ç”± /mo-run å•ç‹¬å¼€ã€‚Modus Operandiï¼ˆå·¥ä½œæµï¼‰ã€‚é‡å¯ DSH åç”Ÿæ•ˆ",
        "memory.features.actionNudgeEnabled": "è‡ªåŠ¨æ²‰æ·€å·¥ä½œæµï¼ˆbetaï¼‰",
        "memory.features.actionNudgeEnabled.hint": "å¼€ï¼šæ¯è½®ç»“æŸåçœ‹ä¸€çœ¼è¿™ä¸ªé¡¹ç›®è‡ªå·±çš„ä¼šè¯æ—¥å¿—ï¼ŒæŠŠåå¤èµ°é€šçš„åŠ¨ä½œæŒ–æˆè®°å¿†åº“é‡Œçš„ä¸€æ¡ã€Œæè®®ã€ï¼Œç­‰ä½ ç¡®è®¤æ‰å¯èƒ½å˜æˆå·¥ä½œæµã€‚åªäº§è‰ç¨¿ã€ä¸è‡ªåŠ¨å¯ç”¨ã€ä¸å¾€ä»“åº“é‡Œå¡æ–‡ä»¶ã€‚æŒ‚çƒ­è·¯å¾„ä¸”è¦è§£å‹æ—¥å¿—ï¼Œè½»é‡æ¡£ä¼šå¼ºåˆ¶å…³æ‰ã€‚é‡å¯ DSH åç”Ÿæ•ˆ",
        "memory.features.resilientModelDownload": "æ¨¡å‹ä¸‹è½½æ–­äº†èƒ½ç»­ä¸Š",
        "memory.features.resilientModelDownload.hint": "å¼€ï¼šä¸‹è½½ä¸­æ–­åä»æ–­ç‚¹ç»­ä¼ å¹¶è‡ªåŠ¨é‡è¯•ï¼›å…³ï¼šä¸­æ–­å°±æ•´ä»½é‡æ¥ï¼ˆæ–­ç‚¹ç»­ä¼ ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.searchSemanticDedup": "æœåˆ°æ„æ€ç›¸åŒçš„åªç•™ä¸€æ¡",
        "memory.features.searchSemanticDedup.hint": "å¼€ï¼šæ£€ç´¢ç»“æœé‡Œæ„æ€ç›¸è¿‘çš„æ¡ç›®åˆå¹¶æˆä¸€æ¡ï¼Œå°‘å åé¢ï¼›å…³ï¼šåŒä¹‰æ¡ç›®ä¸€èµ·å‡ºç°ï¼ˆè¯­ä¹‰å»é‡ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.autoDream": "åå°è‡ªåŠ¨æ•´ç†è®°å¿†ï¼ˆåˆå¹¶ Â· å»é‡ï¼‰",
        "memory.features.autoDream.hint": "å¼€ï¼šåå°è‡ªåŠ¨åˆå¹¶ã€æ²‰æ·€ç¢ç‰‡è®°å¿†ï¼ˆautoDreamï¼‰ï¼›å…³ï¼šè®°å¿†åªå¢ä¸å‡ï¼Œè¶Šç”¨è¶Šæ•£",
        "memory.features.sleepModeEnabled": "ä½ ä¸åœ¨çš„æ—¶å€™å®ƒæ•´ç†è®°å¿†",
        "memory.features.sleepModeEnabled.hint": "å¼€ï¼šç©ºé—²æ—¶æ®µåšåˆ†å±‚å‹ç¼©ä¸æ•´ç†ï¼Œç™½å¤©å°‘æ‰“æ‰°ï¼›å…³ï¼šåªæœ‰ä½ æ‰‹åŠ¨è§¦å‘çš„æ•´ç†ï¼ˆç¡çœ æ¨¡å¼ï¼Œé»˜è®¤å…³ï¼‰",
        // #427 å»ºè®® 5ï¼šhybridInject / selectiveInjectEnabled / adaptiveThresholdEnabled
        // æ˜¯åŒä¸€ä»¶äº‹ã€Œå¸¦ä»€ä¹ˆå›æ¥ã€çš„ä¸‰æ¡£ï¼Œç›¸é‚»æ‘†æ”¾å¹¶åœ¨ hint é‡Œç‚¹æ˜ï¼Œä¸å†æ‘Šæˆ
        // ä¸‰ä¸ªä¸ç›¸å¹²çš„å¹¶åˆ—å¼€å…³ã€‚
        "memory.features.hybridInject": "å…³é”®è¯ + æ„æ€ ä¸¤è·¯ä¸€èµ·æ‰¾",
        "memory.features.hybridInject.hint": "å¼€ï¼šä¸¤è·¯æ£€ç´¢å„å–ä¸€æ‰¹å†åˆå¹¶ï¼Œå¬å›æ›´å…¨ï¼›å…³ï¼šåªç”¨ä¸€è·¯ã€‚ã€Œå¸¦ä»€ä¹ˆå›æ¥ã€å…±ä¸‰æ¡£ï¼ˆæ··åˆæ³¨å…¥ / é€‰æ‹©æ€§æ³¨å…¥ / è‡ªé€‚åº”é˜ˆå€¼ï¼‰ï¼Œå¯åªå¼€å…¶ä¸­ä¸€æ¡£ï¼ˆæ··åˆæ³¨å…¥ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.selectiveInjectEnabled": "åªå¸¦çœŸæ­£ç›¸å…³çš„è®°å¿†",
        "memory.features.selectiveInjectEnabled.hint": "å¼€ï¼šæŒ‰ç›¸å…³æ€§ç­›ä¸€éå†æ³¨å…¥ï¼Œä¸Šä¸‹æ–‡æ›´å¹²å‡€ï¼›å…³ï¼šå¸¦å‡ºå»çš„æ›´å¤šä¹Ÿæ›´æ‚ã€‚ä¸‰æ¡£ä¹‹ä¸€ï¼ˆé€‰æ‹©æ€§æ³¨å…¥ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.adaptiveThresholdEnabled": "æŒ‰æ£€ç´¢è´¨é‡è‡ªåŠ¨è°ƒæ¾ç´§",
        "memory.features.adaptiveThresholdEnabled.hint": "å¼€ï¼šå¬å›è´¨é‡å·®æ—¶æ”¾å®½é—¨æ§›ã€å¥½æ—¶æ”¶ç´§ï¼›å…³ï¼šé—¨æ§›å›ºå®šã€‚ä¸‰æ¡£ä¹‹ä¸€ï¼ˆè‡ªé€‚åº”é˜ˆå€¼ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.reflectionUpdateEnabled": "æ•´ç†æ—¶å…è®¸æ”¹å·²æœ‰è®°å¿†",
        "memory.features.reflectionUpdateEnabled.hint": "å¼€ï¼šå·©å›ºå¯ä»¥æ”¹å†™ã€åˆå¹¶å·²æœ‰æ¡ç›®ï¼Œä¸æ˜¯åªå¢ä¸æ”¹ï¼›å…³ï¼šæ—§è®°å¿†æ°¸ä¸è¢«è‡ªåŠ¨æ”¹åŠ¨ï¼ˆåæ€æ›´æ–°ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.distill": "è’¸é¦ä¸é™æµ",
        "memory.features.distillRateLimitIntervalMs": "è’¸é¦æ”¾è¡Œé—´éš” (ms)",
        "memory.features.distillRateLimitRetries": "429 é‡è¯•æ¬¡æ•°",
        "memory.features.distillRateLimitBaseDelayMs": "é€€é¿èµ·å§‹å»¶è¿Ÿ (ms)",
        "memory.features.distillMaxChars": "è½¬å½•æˆªæ–­ä¸Šé™ï¼ˆå­—ç¬¦ï¼‰",
        // #399 çš„ä¸¤ä¸ªç•™å­˜é”®ã€‚æ­¤å‰åªæœ‰åç«¯ç™½åå•ã€é¢æ¿å¤Ÿä¸ç€ï¼Œè€Œ
        // docs/CONFIGURATION.md å†™çš„æ˜¯ã€Œé¢æ¿å¯å¯åœã€â€”â€”è¡¥ UI è®©æ–‡æ¡£æˆçœŸã€‚
        // hint å¿…é¡»å†™æ¸…ä¸¤ä»¶äº‹ï¼šè¿™æ˜¯**åŸå§‹å¯¹è¯**è½ç›˜ï¼ˆéšç§é¢ï¼‰ï¼Œä»¥åŠå¤©æ•°åªç®¡
        // å¯åŠ¨æœŸè£å‰ªï¼ˆreclaim èµ°å¦ä¸€æ¡ --older-thanï¼Œä¸è¯»è¿™ä¸ªé”®ï¼‰ã€‚
        "memory.features.distillRecords.enabled": "ç•™å­˜è’¸é¦åŸæ–‡",
        "memory.features.distillRecords.enabled.hint": "è’¸é¦æ—¶æŠŠçª—å£å†…çš„å…¬å¼€å¯¹è¯åŸæ–‡ä¸€å¹¶è½ç›˜ï¼Œå¹¶è®°ä¸‹æ¯æ¡è®°å¿†çš„æ¥æºåŒºé—´ï¼›ç§å¯†æ¨ç†ä¸å·¥å…·ç»“æœä¸è½ã€‚å…³ = ä¸€è¡Œä¸å†™ã€è¿æ”¶é›†éƒ½ä¸åš",
        "memory.features.distillRecords.retentionDays": "åŸæ–‡ä¿ç•™å¤©æ•°",
        "memory.features.distillRecords.retentionDays.hint": "1â€“3650 å¤©ï¼›åªç®¡å¯åŠ¨æœŸè£å‰ªã€‚æƒ³è®© reclaim ä¹ŸæŒ‰è¿™ä¸ªå¤©æ•°å›æ”¶ï¼Œéœ€æ˜¾å¼ä¼  --older-than åŒä¸€æ•°å€¼",
        "memory.features.codingBoostFactor": "ç¼–ç è®°å¿†åŠ æƒ",
        "memory.features.memoryQualityFilter.enabled": "æ²¡ä»·å€¼çš„è®°å¿†è‡ªåŠ¨æ”¶èµ·æ¥",
        "memory.features.memoryQualityFilter.enabled.hint": "å¼€ï¼šä½ä»·å€¼æ¡ç›®è‡ªåŠ¨å½’æ¡£ã€æ³¨å…¥æ—¶æŒ‰è´¨é‡é™æƒï¼›å…³ï¼šä»€ä¹ˆéƒ½ç•™ç€ï¼Œå™ªå£°ä¹Ÿä¸€èµ·å¸¦ï¼ˆè®°å¿†è´¨é‡è¿‡æ»¤ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.llmAudit.enabled": "è®°ä¸‹åå°ç”¨äº†å¤šå°‘æ¨¡å‹è°ƒç”¨",
        "memory.features.llmAudit.enabled.hint": "å¼€ï¼šå·©å›º/æ€»ç»“çš„åå°è°ƒç”¨ä¸ token æ¶ˆè€—éƒ½æœ‰è´¦å¯æŸ¥ï¼›å…³ï¼šåå°å¼€é”€æ— ä»æ ¸å¯¹ï¼ˆè°ƒç”¨å®¡è®¡ï¼Œé»˜è®¤å¼€ï¼‰",
        // #254ï¼šå†™å…¥å‡†å…¥ä¸¤å±‚ã€‚æ£€æµ‹å…³æ—¶æ•´æ¡è·¯å¾„ä¸ç¢°ï¼›æ£€æµ‹å¼€ã€æ‹¦æˆªå…³ = ä»…å‘Šè­¦ +
        // ç•™å®¡è®¡ï¼›ä¸¤ä¸ªéƒ½å¼€æ‰çœŸæ‹¦ã€‚æ–‡æ¡ˆè¦å†™æ¸…ã€Œåªç•™å®¡è®¡ã€ä¸ã€ŒçœŸæ‹¦ä¸‹ã€çš„åŒºåˆ«ï¼Œ
        // å¦åˆ™æ“ä½œè€…ä¼šä»¥ä¸ºæ‰“å¼€æ£€æµ‹å°±å·²ç»åœ¨æ‹¦ã€‚
        "memory.features.writeAdmission.enabled": "å†™å…¥å‰å…ˆåˆ¤ä¸€ä¸‹æ˜¯ä¸æ˜¯åºŸè¯ï¼ˆåªè®°ä¸æ‹¦ï¼‰",
        "memory.features.writeAdmission.enabled.hint": "å¼€ï¼šç©ºç™½/å™ªå£°å†™å…¥åˆ¤ä¸ºå‘½ä¸­å¹¶ç•™ä¸€æ¡å®¡è®¡è®°å½•ï¼Œä½†ä»å­˜è¿›å»ï¼›å…³ï¼šå®Œå…¨ä¸åˆ¤ã€‚è¦çœŸæ‹¦ï¼Œè§ä¸‹ä¸€é¡¹ï¼ˆå†™å…¥å‡†å…¥åˆ¤å®šï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.writeAdmission.enforce": "çœŸæŠŠæ²¡ç”¨çš„å†™å…¥æŒ¡ä¸‹æ¥",
        "memory.features.writeAdmission.enforce.hint": "å¼€ï¼šå‘½ä¸­ç›´æ¥æ‹’ç»å†™å…¥ï¼›å…³ï¼šåªç•™å®¡è®¡ã€ç…§å­˜ä¸è¯¯ã€‚éœ€å…ˆæ‰“å¼€ä¸Šé¢é‚£é¡¹åˆ¤å®šï¼ˆå†™å…¥å‡†å…¥æ‹¦æˆªï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.preInjectGate.enabled": "æ³¨å…¥å‰å…ˆç­›æ‰ã€Œåªæ˜¯æˆ‘çš„çœ‹æ³•ã€çš„è®°å¿†ï¼ˆåªè®°ä¸æ‹¦ï¼‰",
        "memory.features.preInjectGate.enabled.hint": "å¼€ï¼šæ³¨å…¥å‰åˆ¤å‡ºæ„è§/ç«‹åœºç±»è®°å¿†å¹¶ç•™å®¡è®¡ï¼Œå…ˆè§‚å¯Ÿåˆ†å¸ƒï¼›å…³ï¼šç…§å¸¸æ³¨å…¥ï¼ˆæ³¨å…¥å‰åˆ¤å®šï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.preInjectGate.enforce": "æ³¨å…¥æ—¶çœŸæ»¤æ‰åˆ¤å®šä¸åˆé€‚çš„",
        "memory.features.preInjectGate.enforce.hint": "å¼€ï¼šå‘½ä¸­çš„å€™é€‰åœ¨æ³¨å…¥æ—¶ä¸¢æ‰ï¼›å…³ï¼šåªç•™å®¡è®¡ã€ç…§å¸¸æ³¨å…¥ã€‚éœ€å…ˆæ‰“å¼€ä¸Šé¢é‚£é¡¹åˆ¤å®šï¼ˆæ³¨å…¥å‰åˆ¤å®šæ‹¦æˆªï¼Œé»˜è®¤å…³ï¼‰",
        // #164 A2ï¼šå¯†é’¥/PII åˆ¤æ®è‡ªå·±çš„é—¸ã€‚æ–‡æ¡ˆè¦å†™æ¸…å®ƒç®¡çš„æ˜¯å“ªä¸€æ‰¹åˆ¤æ®ï¼ˆä¸ä¸Šé¢çš„
        // ç©ºç™½/å™ªå£°åˆ†å¼€ï¼‰ã€å®ƒè·‘åœ¨ã€Œå†™å…¥å‡†å…¥åˆ¤å®šã€é‡Œé¢ï¼ˆé‚£ä¸€é¡¹å…³ç€å°±ä¸è·‘ï¼‰ï¼Œä»¥åŠ
        // ã€Œå¼€ç€ä¹Ÿä¸æ‹¦ã€â€”â€”æ‹¦æ˜¯ä¸Šé¢é‚£é¡¹çš„äº‹ã€‚
        "memory.features.sensitiveScanEnabled": "å†™å…¥å‰æ‰«ä¸€éå¯†é’¥å’Œä¸ªäººä¿¡æ¯",
        "memory.features.sensitiveScanEnabled.hint": "å¼€ï¼šåœ¨å†™å…¥å‡†å…¥åˆ¤å®šé‡Œé¢æ‰«å¯†é’¥/ä¸ªäººä¿¡æ¯ï¼Œå‘½ä¸­åªç•™å®¡è®¡ï¼›è¦çœŸæ‹¦ï¼Œå†æ‰“å¼€ã€Œå†™å…¥å‡†å…¥æ‹¦æˆªã€ã€‚åˆ¤å®šå…³ç€æ—¶å®ƒä¸è·‘ï¼ˆå¯†é’¥/PII æ‰«æï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.bm25SearchEnabled": "ä¹Ÿç”¨å…³é”®è¯æ–¹å¼æ‰¾è®°å¿†",
        "memory.features.bm25SearchEnabled.hint": "å¼€ï¼šå¤šä¸€ä¸ªå­—å°‘ä¸€ä¸ªå­—ä¹Ÿæœå¾—åˆ°ï¼Œä¸“åã€æŠ¥é”™ç ã€è·¯å¾„æ›´æ˜“å‘½ä¸­ï¼Œä¸ã€ŒæŒ‰æ„æ€æ‰¾ã€äº’è¡¥ï¼›å…³ï¼šåªæŒ‰è¯­ä¹‰ç›¸è¿‘åº¦ï¼ˆBM25 å…³é”®è¯æ£€ç´¢ï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.conflictFreezeEnabled": "äº’ç›¸çŸ›ç›¾çš„è®°å¿†å…ˆå†»ç»“",
        "memory.features.conflictFreezeEnabled.hint": "å¼€ï¼šæ•´ç†å‘ç°çŸ›ç›¾æ—¶å…ˆå†»ç»“å¾…ä½ ç¡®è®¤ï¼Œä¸è®©ä¸¤æ¡åŒæ—¶ç”Ÿæ•ˆï¼›å…³ï¼šä¸¤è¾¹éƒ½ç…§ç”¨ï¼ˆå†²çªå†»ç»“ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.scopeEnabled": "è®°ä½æ¯æ¡è®°å¿†æ¥è‡ªå“ªä¸ªä¼šè¯",
        "memory.features.scopeEnabled.hint": "å¼€ï¼šæ¯æ¡æ–°è®°å¿†æ ‡ä¸Šæ¥è‡ªå“ªä¸ª Agent / å·¥ä½œåŒºï¼Œåˆ«çš„ä¼šè¯èƒ½ä¸èƒ½çœ‹åˆ°ç”±å®ƒè¯´äº†ç®—ï¼›å…³ï¼šæ–°è®°å¿†ä¸å¸¦æ¥æºï¼Œæ‰€æœ‰ä¼šè¯å…±ç”¨ä¸€æ‰¹è®°å¿†ï¼ˆä½œç”¨åŸŸæ ‡æ³¨ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.strictScope": "åˆ«äººè®¾ä¸ºç§æœ‰çš„è®°å¿†æˆ‘çœ‹ä¸è§",
        "memory.features.strictScope.hint": "å¼€ï¼šå…¶ä»–ä¼šè¯æ˜ç¡®æ ‡ç§æœ‰çš„è®°å¿†å¯¹ä½ å½»åº•ä¸å¯è§ï¼›å…³ï¼šä»å¯è§ã€åªæ˜¯æ’åˆ°åé¢ã€‚è¦å½»åº•éš”ç¦»è¯·ç”¨æ¡ç›®çš„ã€Œæ•æ„Ÿåº¦ã€å­—æ®µã€‚éœ€å…ˆæ‰“å¼€ä¸Šé¢é‚£é¡¹æ ‡æ³¨ï¼ˆä¸¥æ ¼éš”ç¦»ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.trustEpistemicWeighting": "æŒ‰æ¥æºå¯ä¿¡åº¦è°ƒæ’åº",
        "memory.features.trustEpistemicWeighting.hint": "å¼€ï¼šå¯ä¿¡åº¦é«˜çš„æ¥æºæ’å‰é¢ï¼›å…³ï¼šä¸€è§†åŒä»ï¼ˆå¯ä¿¡åº¦åŠ æƒï¼Œå®éªŒæ€§ï¼Œé»˜è®¤å…³ï¼‰",
        "memory.features.reflectionFailureTracking": "æ•´ç†å¤±è´¥æ—¶ç•™ä¸‹æ¡ˆä¾‹",
        "memory.features.reflectionFailureTracking.hint": "å¼€ï¼šæŠŠå¤±è´¥åŸå› ä¸æ¡ˆä¾‹è®°ä¸‹æ¥ä¾›è¯Šæ–­æ”¹è¿›ï¼›å…³ï¼šå¤±è´¥ä¸ç•™è®°å½•ï¼ˆå¤±è´¥è¿½è¸ªï¼Œé»˜è®¤å¼€ï¼‰",
        "memory.features.embedRoute": "è¯­ä¹‰æ£€ç´¢è·¯çº¿",
        "memory.features.embedProvider": "Embedding æä¾›æ–¹",
        "memory.features.embedProvider.openai": "OpenAI å…¼å®¹æ¥å£",
        "memory.features.embedProvider.local": "æœ¬åœ°æ¨¡å‹ï¼ˆç¦»çº¿ï¼‰",
        "memory.features.embedProvider.ollama": "Ollama",
        "memory.features.embedProvider.openai.hint": "æ¥å£åœ°å€ / Key / æ¨¡å‹åœ¨ã€Œå‘é‡æœç´¢ã€å¡ç‰‡é…ç½®",
        "memory.features.embedProvider.local.hint": "é¦–æ¬¡ä½¿ç”¨ä¼šä¸‹è½½æ¨¡å‹ï¼Œä¹‹åå®Œå…¨ç¦»çº¿",
        "memory.features.embedProvider.ollama.hint": "éœ€è¦æœ¬æœº Ollama æœåŠ¡åœ¨è¿è¡Œ",
        "memory.features.localEmbedModel": "æœ¬åœ° embedding æ¨¡å‹",
        "memory.features.ollamaBaseUrl": "Ollama æœåŠ¡åœ°å€",
        "memory.features.ollamaModel": "Ollama æ¨¡å‹å",
        "memory.features.dreamProvider": "å·©å›ºæ¨¡å‹ Provider",
        "memory.features.dreamModel": "å·©å›ºç”¨æ¨¡å‹å",
        "memory.features.dreamModelHint": "ç•™ç©º = è·Ÿéšä¸»å¯¹è¯æ¨¡å‹ï¼›åªå½±å“è®°å¿†å·©å›ºï¼ˆautoDreamï¼‰ç”¨çš„æ¨¡å‹",
        "memory.features.dreamPeakHours": "é«˜å³°æ—¶æ®µï¼ˆä¸åšæ¢¦ï¼‰",
        "memory.features.dreamPeakHours.hint": "è®¾ç½®å¿™ç¢Œæ—¶æ®µï¼Œå·©å›ºä¼šé¿å¼€è¿™äº›æ—¶é—´ã€äº‹åè¡¥è·‘ã€‚å†™æ³•ï¼š09:00-18:00ï¼Œå¤šæ®µç”¨é€—å·åˆ†éš”ï¼Œå¯å¸¦æ˜ŸæœŸï¼ˆå¦‚ mon-fri 08:00-12:00ï¼‰ï¼Œæ”¯æŒè·¨é›¶ç‚¹ï¼›ç•™ç©º = ä¸é™åˆ¶",
        "memory.features.summarizePeakHours": "é«˜å³°æ—¶æ®µï¼ˆä¸è’¸é¦ï¼‰",
        "memory.features.summarizePeakHours.hint": "ä¸å·©å›ºä¾§åŒä¸€ä»½å†™æ³•ï¼›è’¸é¦ä¼šé¿å¼€è¿™äº›æ—¶æ®µï¼Œçª—å£å…ˆæ”’ç€ã€éé«˜å³°ä¸€æ¬¡è’¸å®Œ",
        "memory.features.sleepProvider": "ç¡çœ  Provider",
        "memory.features.sleepModel": "ç¡çœ æ¨¡å‹",
        "memory.features.sleepModelHint": "ç•™ç©º = ç”¨å·©å›ºæ¨¡å‹æˆ–å½“å‰æ¨¡å‹ï¼›å»ºè®®é€‰éæ€è€ƒæ¨¡å‹",
        // Issue #478ï¼šmax_tokens é¢„ç®—é”®ã€‚hint å†™æ¸…ä¸¤ä»¶äº‹ï¼šè¿™æ˜¯ã€Œå•è½®è¾“å‡ºé¢„ç®—ã€ï¼Œ
        // ä»¥åŠæœåŠ¡å•†ç¡¬ä¸Šé™æ›´å°æ—¶åç«¯ä¼šæŒ‰æŠ¥é”™è‡ªåŠ¨é™çº§é‡è¯•ï¼ˆå¯¹é½ #478 çš„åç«¯è¡Œä¸ºï¼‰ã€‚
        "memory.features.dreamMaxTokens": "å·©å›ºå•è½®è¾“å‡ºä¸Šé™ (max_tokens)",
        "memory.features.dreamMaxTokens.hint": "å•è½®å·©å›ºæœ€å¤šç”Ÿæˆå¤šå°‘ tokenï¼Œ256â€“131072ã€‚é»˜è®¤ 131072 è¶…è¿‡éƒ¨åˆ†æœåŠ¡å•†ç¡¬ä¸Šé™æ—¶ï¼Œåç«¯ä¼šæŒ‰æŠ¥é”™é‡Œçš„ä¸Šé™è‡ªåŠ¨é™çº§é‡è¯•",
        "memory.features.sleepMaxTokens": "ç¡çœ å•è½®è¾“å‡ºä¸Šé™ (max_tokens)",
        "memory.features.sleepMaxTokens.hint": "ç¡çœ é˜¶æ®µå†²çª/æ¨¡å¼åˆ¤æ–­çš„å•è½®è¾“å‡ºé¢„ç®—ï¼Œ256â€“131072ï¼›è¶…ä¸Šé™åŒæ ·è‡ªåŠ¨é™çº§",
        "memory.features.routeFollowDefault": "è·Ÿéšé»˜è®¤è·¯ç”±",
        "memory.features.modelTest": "æµ‹è¯•è¿é€šæ€§",
        "memory.features.modelTesting": "æµ‹è¯•ä¸­â€¦",
        "memory.features.modelTestOk": "è¿é€šæ­£å¸¸",
        "memory.features.modelTestFail": "æµ‹è¯•å¤±è´¥",
        "memory.features.modelTestHint": "çœŸå®å‘èµ·ä¸€æ¬¡æœ€å°å·©å›ºè°ƒç”¨ï¼ŒéªŒè¯ Provider/æ¨¡å‹è¿é€šä¸ effort æ”¯æŒ",
        "memory.features.modelTestDowngraded": "æ¡£ä½ä¸è¢«è¯¥æ¨¡å‹æ¥å—ï¼Œå·²å»æ‰æ¡£ä½è¿é€šï¼ˆä¸çœŸå®å·©å›ºä¸€è‡´ï¼‰",
        "memory.features.routeStaleMark": "ï¼ˆä¸åœ¨å¯ç”¨åˆ—è¡¨ï¼‰",
        "memory.features.routeStaleHint": "è¯¥å€¼ä¸åœ¨å½“å‰å¯ç”¨åˆ—è¡¨ï¼ˆå¸¸è§äºåˆ‡æ¢è¿‡ Providerï¼‰ï¼šè¯·é‡æ–°é€‰æ‹©ï¼Œæˆ–ç‚¹ã€Œæµ‹è¯•è¿é€šæ€§ã€å½“åœºéªŒè¯",
        "memory.explorer.viewCards": "å¡ç‰‡",
        "memory.explorer.viewTimeline": "æ—¶é—´çº¿",
        "memory.explorer.viewAria": "è§†å›¾åˆ‡æ¢",
        "memory.explorer.dateLabel": "æ—¶é—´",
        "memory.explorer.date.all": "å…¨éƒ¨æ—¶é—´",
        "memory.explorer.date.7d": "è¿‘ 7 å¤©",
        "memory.explorer.date.30d": "è¿‘ 30 å¤©",
        "memory.explorer.date.90d": "è¿‘ 90 å¤©",
        "memory.explorer.more": "æ›´å¤šæ“ä½œ",
        "memory.explorer.exportJson": "å¯¼å‡º JSON",
        "memory.explorer.exportMarkdown": "å¯¼å‡º Markdown",
        "memory.explorer.importMd": "å¯¼å…¥ Markdown é•œåƒâ€¦",
        "memory.explorer.importTitle": "å¯¼å…¥ Markdown é•œåƒ",
        "memory.explorer.importHint": "é€‰æ‹©ä¸€ä¸ªé•œåƒç±»å‹çš„ Markdown æ–‡ä»¶ï¼Œè§£æå…¶ä¸­çš„äººå·¥ç¼–è¾‘å¹¶åˆå¹¶è¿›è®°å¿†åº“ã€‚",
        "memory.explorer.importType": "é•œåƒç±»å‹",
        "memory.explorer.importPick": "é€‰æ‹©æ–‡ä»¶â€¦",
        "memory.explorer.importConfirm": "å¯¼å…¥",
        "memory.explorer.importCancel": "å–æ¶ˆ",
        "memory.explorer.importing": "å¯¼å…¥ä¸­â€¦",
        "memory.explorer.imported": "å·²åˆå¹¶ {n} æ¡ç¼–è¾‘",
        "memory.explorer.importFailed": "å¯¼å…¥å¤±è´¥",
        "memory.explorer.importNoFile": "è¯·å…ˆé€‰æ‹©æ–‡ä»¶",
        "memory.explorer.newMemory": "æ–°å¢è®°å¿†â€¦",
        "memory.explorer.newTitle": "æ–°å¢è®°å¿†",
        "memory.explorer.newHint": "æ‰‹åŠ¨å†™ä¸€æ¡è®°å¿†ã€‚åŒç±»å‹åŒæ ‡é¢˜ä¼šå¹¶å…¥æ—¢æœ‰æ¡ç›®ï¼Œè€Œä¸æ˜¯é•¿å‡ºç¬¬äºŒè¡Œã€‚",
        "memory.explorer.newType": "ç±»å‹",
        "memory.explorer.newTitlePlaceholder": "çŸ­æ ‡é¢˜ï¼Œä¹Ÿæ˜¯å»é‡é”®",
        "memory.explorer.newContentPlaceholder": "æ­£æ–‡",
        "memory.explorer.newTagsPlaceholder": "æ ‡ç­¾ï¼Œé€—å·åˆ†éš”ï¼ˆå¯ç•™ç©ºï¼‰",
        "memory.explorer.newConfirm": "æ–°å»º",
        "memory.explorer.newSaving": "ä¿å­˜ä¸­â€¦",
        "memory.explorer.newCreated": "å·²æ–°å»º",
        "memory.explorer.newMerged": "å·²å¹¶å…¥åŒæ ‡é¢˜çš„æ—¢æœ‰æ¡ç›®",
        "memory.explorer.newFailed": "æ–°å»ºå¤±è´¥",
        "memory.explorer.newNoTitle": "è¯·å…ˆå¡«å†™æ ‡é¢˜",
        "memory.explorer.newNoContent": "è¯·å…ˆå¡«å†™å†…å®¹",
        "memory.explorer.exportFailed": "å¯¼å‡ºå¤±è´¥",
        "memory.explorer.conflictBadge": "å†²çª",
        "memory.explorer.archivedBadge": "å·²å½’æ¡£",
        "memory.explorer.scopeBadge": "ä½œç”¨åŸŸ",
        "memory.explorer.detail.agentScope": "Agent ä½œç”¨åŸŸ",
        "memory.explorer.detail.workspaceScope": "å·¥ä½œåŒºä½œç”¨åŸŸ",
        "memory.explorer.detail.scopeGlobal": "å…¨å±€ï¼ˆæ‰€æœ‰ä¼šè¯å¯è§ï¼‰",
        "memory.explorer.detail.scopeSourceAuto": "è‡ªåŠ¨",
        "memory.explorer.detail.scopeSourceExplicit": "æ˜¾å¼",
        "memory.explorer.detail.scopeEditHint": "ç•™ç©º = å…¨å±€ï¼›ä¹Ÿå¯å¡«å†™å…·ä½“æ ‡ç­¾æ”¶çª„å½’å±",
        "memory.explorer.detail.scopeWidenConfirm": "ç¡®è®¤æ”¾å®½å¯è§æ€§ï¼Ÿ",
        "memory.explorer.detail.scopeWidenHint": "æ”¾å®½åè¯¥è®°å¿†å°†å¯¹æ‰€æœ‰ä¼šè¯å¯è§",
        "memory.explorer.detail.sensitivity": "æ•æ„Ÿåº¦",
        "memory.explorer.detail.occurred": "å‘ç”Ÿæ—¶é—´",
        "memory.explorer.detail.edit": "ç¼–è¾‘",
        "memory.explorer.detail.save": "ä¿å­˜",
        "memory.explorer.detail.cancel": "å–æ¶ˆ",
        "memory.explorer.detail.archive": "å½’æ¡£",
        "memory.explorer.detail.restore": "æ¢å¤",
        "memory.explorer.detail.restored": "å·²æ¢å¤åˆ°ä¸»åˆ—è¡¨",
        "memory.explorer.detail.archived": "å·²å½’æ¡£",
        "memory.explorer.detail.archiveFailed": "æ“ä½œå¤±è´¥",
        "memory.explorer.detail.saved": "å·²ä¿å­˜ï¼Œé•œåƒåŒæ­¥æ›´æ–°",
        "memory.explorer.detail.quality": "è´¨é‡åˆ†",
        "memory.explorer.detail.entities": "å…³è”å®ä½“",
        "memory.explorer.detail.entitiesEmpty": "å¼€å¯å®ä½“æŠ½å–åï¼Œç›¸å…³äººç‰©/é¡¹ç›®ä¼šå‡ºç°åœ¨è¿™é‡Œ",
        "memory.explorer.detail.closeAria": "å…³é—­è¯¦æƒ…",
        "memory.explorer.detail.editTitle": "æ ‡é¢˜",
        "memory.explorer.detail.editContent": "å†…å®¹",
        "memory.explorer.detail.editImportance": "é‡è¦æ€§",
        "memory.explorer.detail.starLabel": "è®¾ä¸º {n} æ˜Ÿ",
        "memory.status.dream": "æœ€è¿‘å·©å›º",
        "memory.status.dreamNever": "å°šæœªè¿è¡Œ",
        "memory.status.conflicts": "å¾…ç¡®è®¤å†²çª",
        "memory.status.conflictsHint": "å†»ç»“çš„çŸ›ç›¾è®°å¿†ï¼Œç­‰å¾…äººå·¥ç¡®è®¤",
        "memory.status.injectSuppressed": "æç®€æ¨¡å¼ä¸‹æ³¨å…¥æŒ‰å®¿ä¸»è®¾è®¡å…³é—­",
        "memory.status.injectSuppressedHint": "å½“å‰ä¼šè¯ä½¿ç”¨ minimal é¢„è®¾ï¼šè®°å¿†æ³¨å…¥ / ç”¨æˆ·ç”»åƒ / çƒ­è®°å¿†ä¸ä¼šé€è¾¾æ¨¡å‹ï¼ˆå®¿ä¸»è®¾è®¡ï¼Œéæ’ä»¶ç¼ºé™·ï¼‰ã€‚åˆ‡åˆ°æ ‡å‡†æ¨¡å¼ï¼Œæˆ–åœ¨ ~/.dsh/settings.yaml è®¾ agent-presets.default: standardï¼›è¿‡æ¸¡æ–¹æ¡ˆï¼šæŠŠç”»åƒä¸è§„åˆ™å†™è¿› AGENTS.md",
        "memory.status.injectPreview": "æ³¨å…¥é¢„è§ˆ",
        "memory.status.injectPreviewNone": "æš‚æ— é¢„è§ˆâ€”â€”å°šæœªå‘ç”Ÿæ³¨å…¥ï¼ˆæ–°ä¼šè¯æˆ–æ³¨å…¥å·²å…³é—­ï¼‰",
        "memory.status.injectPreview.chars": "æ€»ä½“ç§¯",
        "memory.status.injectPreview.charsUnit": " å­—ç¬¦",
        "memory.status.injectPreview.maxItems": "æ³¨å…¥ä¸Šé™",
        "memory.status.injectPreview.threshold": "ç›¸å…³æ€§é—¨æ§›",
        "memory.status.injectPreview.scope": "ä¼šè¯å½’å±",
        "memory.status.injectPreview.query": "æŸ¥è¯¢ã€Œ{query}â€¦ã€",
        "memory.status.injectPreview.hot": "hot memory",
        "memory.status.injectPreview.adaptiveOn": "è‡ªé€‚åº”æ¡æ•°",
        "memory.status.injectPreview.rotated": "è½®æ¢æŠ‘åˆ¶",
        "memory.status.injectPreview.empty": "æœ¬æ¬¡ç»„è£…æœªæ³¨å…¥ä»»ä½•è·¨ä¼šè¯è®°å¿†ï¼ˆé˜ˆå€¼æˆ–è½®æ¢è¿‡æ»¤ï¼‰",
        "memory.status.conflictQueue.reason": "åŸå› ",
        "memory.status.conflictQueue.sideA": "A æ–¹",
        "memory.status.conflictQueue.sideB": "B æ–¹",
        "memory.status.conflictQueue.keepA": "ä¿ç•™ A",
        "memory.status.conflictQueue.keepB": "ä¿ç•™ B",
        "memory.status.conflictQueue.markReviewed": "ä»…æ ‡è®°å·²å¤„ç†",
        "memory.status.conflictQueue.applyHint": "ç¡®è®¤åï¼šä¿ç•™æ–¹æ­£æ–‡è¿½åŠ å·²å¦å†³æ³¨è®°ï¼Œå¦ä¸€æ–¹å½’æ¡£ã€‚",
        "memory.status.conflictQueue.missing": "ï¼ˆè¯¥è®°å¿†å·²ä¸å­˜åœ¨ï¼‰",
        "memory.status.conflictQueue.goto": "æŸ¥çœ‹å¾…ç¡®è®¤å†²çªé˜Ÿåˆ—",
        "memory.status.conflictQueue.resolved": "å·²è£å†³ï¼šä¿ç•™{name}",
        "memory.status.conflictQueue.refresh": "åˆ·æ–°é˜Ÿåˆ—",
        "memory.status.conflictQueue.refreshed": "å†²çªé˜Ÿåˆ—å·²åˆ·æ–°",
        "memory.status.conflictQueue.frozenBadge": "â¸ å†»ç»“ä¸­",
        "memory.status.conflictQueue.frozenTitle": "å†»ç»“ä¸­ï¼šä¸å‚ä¸æ³¨å…¥ä¸å·©å›ºï¼Œç­‰ä½ è£å†³",
        "memory.status.conflictQueue.similarity": "ç›¸ä¼¼åº¦",
        "memory.status.conflictQueue.diffTitle": "å·®å¼‚å·²é«˜äº®ï¼šçº¢=åˆ é™¤ã€ç»¿=æ–°å¢",
        "memory.status.conflictQueue.diffFallback": "ä¸¤æ®µæ–‡æœ¬å·®å¼‚è¾ƒå¤§ï¼Œè¯·å¯¹ç…§åŸæ–‡é˜…è¯»",
        "memory.status.conflictQueue.expand": "å±•å¼€å…¨æ–‡",
        "memory.status.conflictQueue.collapse": "æ”¶èµ·å…¨æ–‡",
        "memory.status.conflictQueue.copySide": "å¤åˆ¶æœ¬ä¾§",
        "memory.status.conflictQueue.copiedSide": "æœ¬ä¾§å…¨æ–‡å·²å¤åˆ¶",
        "memory.status.conflictQueue.importance": "é‡è¦åº¦ {n}",
        "memory.status.conflictQueue.chars": "{n} å­—ç¬¦",
        "memory.status.conflictQueue.updated": "æ›´æ–°äº {time}",
        "memory.status.conflictQueue.created": "åˆ›å»ºäº {time}",
        "memory.status.conflictQueue.emptyTitle": "æš‚æ— å¾…ç¡®è®¤å†²çª",
        "memory.status.conflictQueue.emptyBody": "å½“å·©å›ºå‘ç°ä¸¤æ¡äº’ç›¸çŸ›ç›¾æˆ–é«˜åº¦ç›¸ä¼¼çš„è®°å¿†æ—¶ï¼Œä¼šå…ˆå†»ç»“åœ¨è¿™é‡Œç­‰ä½ è£å†³ï¼Œä¸ä¼šè‡ªåŠ¨ä¿®æ”¹ã€‚è£å†³å‰åŒæ–¹éƒ½ä¸å‚ä¸æ³¨å…¥ã€‚",
        "memory.status.conflictQueue.applyHintTitle": "ç¡®è®¤åï¼šä¿ç•™æ–¹æ­£æ–‡è¿½åŠ å·²å¦å†³æ³¨è®°ï¼Œå¦ä¸€æ–¹å½’æ¡£",
        "memory.status.workbench": "å·¥ä½œåŠ¨æ€",
        "memory.status.dreamConsolidate": "è®°å¿†å·©å›º",
        "memory.status.summarize": "æ€»ç»“æç‚¼",
        "memory.status.tokens": "{n} tokens",
        "memory.status.deposited": "æ²‰æ·€ {n} æ¡è®°å¿†",
        "memory.status.failed": "å¤±è´¥",
        "memory.status.success": "æˆåŠŸ",
        "memory.status.skipped": "è·³è¿‡",
        "memory.status.emptyFeed": "è¿˜æ²¡æœ‰åå°æ´»åŠ¨ï¼šå¯¹è¯ç»“æŸåä¼šè‡ªåŠ¨æç‚¼è®°å¿†",
        "memory.status.consolidated": "æ²‰æ·€çš„è®°å¿†",
        "memory.status.consolidatedEmpty": "autoDream / autoSummarize æ²‰æ·€çš„è®°å¿†ä¼šå‡ºç°åœ¨è¿™é‡Œ",
        "memory.status.archivedMemories": "å·²å½’æ¡£çš„è®°å¿†",
        "memory.status.heatDistribution": "çƒ­åº¦åˆ†å¸ƒ",
        "memory.status.heat.hot": "çƒ­é—¨ï¼ˆâ‰¥66%ï¼‰",
        "memory.status.heat.warm": "æ¸©çƒ­ï¼ˆ33â€“66%ï¼‰",
        "memory.status.heat.cold": "å†·å´ï¼ˆ<33%ï¼‰",
        "memory.status.heat.sample": "æŒ‰æœ€è¿‘ {sample} æ¡é‡‡æ ·",
        "memory.status.recallStats": "è®°å¿†å¤ç”¨",
        "memory.status.recall.zombie": "åƒµå°¸è®°å¿†",
        "memory.status.recall.exempt": "è±å…",
        "memory.status.recall.runs": "30 å¤©å›æ‰§",
        "memory.status.recall.top": "å¸¸è¢«å¬å›",
        "memory.status.recall.inject": "æ³¨å…¥",
        "memory.status.recall.archive": "å½’æ¡£",
        "memory.status.recallInject": "{runs} è½® Â· {count} æ¡ Â· æ§½ä½ {fill}%",
        "memory.status.recallArchive": "{total} è¡Œ Â· +{add}/å¤© Â· å¯å‹æ‰ {compress}",
        "memory.status.viewAll": "æŸ¥çœ‹å…¨éƒ¨",
        "memory.status.depositedCount": "æ²‰æ·€çš„è®°å¿†ï¼ˆ{n}ï¼‰",
        "memory.status.archivedCount": "å·²å½’æ¡£çš„è®°å¿†ï¼ˆ{n}ï¼‰",
        "memory.status.archivedEmpty": "æ²¡æœ‰å½’æ¡£çš„è®°å¿†",
        "memory.status.restore": "æ¢å¤",
        "memory.settings.extapi.reveal": "æ˜¾ç¤º",
        "memory.settings.extapi.hide": "éšè—",
        "memory.settings.extapi.maskHint": "Token å·²é®è”½ï¼›ã€Œå¤åˆ¶ã€å¯å¤åˆ¶å®Œæ•´å€¼",
        "memory.explorer.delete": "åˆ é™¤",
        "memory.explorer.confirmDelete": "ç¡®è®¤åˆ é™¤?",
        "memory.explorer.cancel": "å–æ¶ˆ",
        "memory.explorer.deleted": "å·²åˆ é™¤",
        "memory.explorer.deleteFailed": "åˆ é™¤å¤±è´¥",
        "memory.status.memories": "è®°å¿†æ€»æ•°",
        "memory.status.entities": "å®ä½“",
        "memory.status.vector": "å‘é‡ç´¢å¼•",
        "memory.status.vectorOff": "æœªå¯ç”¨",
        "memory.status.vectorInit": "åˆå§‹åŒ–ä¸­",
        "memory.status.vectorInitHint": "embedder ä¸å¯è¾¾ï¼Œæ­£åœ¨é‡è¯•",
        "memory.status.vectorRuntimeMissing": "ç¼ºå°‘æœ¬åœ°æ¨ç†è¿è¡Œæ—¶",
        "memory.status.vectorRuntimeHint": "æœ¬åœ°æ¨ç†è¿è¡Œæ—¶æœªå°±ç»ªï¼ˆ{status}ï¼‰",
        "memory.status.vectorRuntimeCost": "æœ¬åœ°å‘é‡åŒ–éœ€è¦é¢å¤–ä¸€ä»½æœ¬åœ°æ¨ç†è¿è¡Œæ—¶ï¼ˆè§£åŒ…åæ•°ç™¾ MBï¼‰ã€‚ä¸‹é¢çš„æŒ‰é’®ä¼šä¼˜å…ˆæ”¶ç¼–æœ¬æœºå·²æœ‰çš„é‚£ä»½ï¼ˆåŒç›˜ç¡¬é“¾æ¥ã€ä¸å é¢å¤–ç©ºé—´ï¼‰ï¼Œæ²¡æœ‰å†ä» npm ä¸‹è½½å¹¶é€ä¸ªæ ¡éªŒã€‚ä¹Ÿå¯ä»¥è®© Agent ä»£åŠ³ï¼Œæˆ–åœ¨ç»ˆç«¯è‡ªå·±è·‘ï¼šnode scripts/mneme-runtime.mjs status / adopt / verifyï¼ˆè§ docs/LOCAL_MODEL.mdï¼‰",
        "memory.runtime.title": "æœ¬åœ°æ¨ç†è¿è¡Œæ—¶",
        "memory.runtime.available": "å·²å°±ç»ª",
        "memory.runtime.missing": "æœªå°±ç»ª â€”â€” åªæœ‰ç”¨æœ¬åœ°åµŒå…¥ï¼ˆembedProvider: localï¼‰æ—¶æ‰éœ€è¦å®ƒ",
        "memory.runtime.restart": "æœ¬åœ°åµŒå…¥è¦é‡å¯ DSH æ‰ä¼šç”Ÿæ•ˆ",
        "memory.status.vectorRuntimeReady": "è¿è¡Œæ—¶å·²å°±ç»ª",
        "memory.status.vectorRuntimeReadyHint": "æœ¬åœ°åµŒå…¥å°šæœªåˆå§‹åŒ–ï¼ˆè¿›ç¨‹é‡Œçš„ embedder åœ¨è¿è¡Œæ—¶ç¼ºå¤±æ—¶å·²ç»å¤±è´¥è¿‡ä¸€æ¬¡ï¼‰ï¼šè‹¥ä¸€ç›´åœåœ¨è¿™é‡Œï¼Œé‡å¯ DSH å³å¯ã€‚",
        "memory.status.vectorRuntimeFetch": "å–å›æœ¬åœ°è¿è¡Œæ—¶",
        "memory.status.vectorRuntimeFetchBusy": "æ­£åœ¨å–å›â€¦ï¼ˆå…ˆè¯•æ”¶ç¼–ï¼Œå¿…è¦æ—¶ä¸‹è½½ï¼Œæ•°åƒä¸ªæ–‡ä»¶ï¼Œè¯·ç¨å€™ï¼‰",
        "memory.status.vectorRuntimeFetchAdopted": "å·²æ”¶ç¼–æœ¬æœºå·²æœ‰çš„è¿è¡Œæ—¶ï¼š{n} ä¸ªåŒ… / {m} ä¸ªæ–‡ä»¶ï¼ˆ{mode}ï¼‰ã€‚**è¯·é‡å¯ DSH ä½¿æœ¬åœ°åµŒå…¥ç”Ÿæ•ˆã€‚**",
        "memory.status.vectorRuntimeFetchDownloaded": "ä¸‹è½½å®Œæˆï¼š{n} ä¸ªåŒ… / {m} ä¸ªæ–‡ä»¶ã€‚**è¯·é‡å¯ DSH ä½¿æœ¬åœ°åµŒå…¥ç”Ÿæ•ˆ**ï¼ˆå–å›ä¸ä¼šè®©å½“å‰è¿›ç¨‹é‡Œçš„ embedder å¤æ´»ï¼‰ã€‚",
        "memory.status.vectorRuntimeFetchFailed": "å–å›å¤±è´¥ï¼š{reason}",
        "memory.status.vectorIndexed": "å·²ç´¢å¼• {n} / {m} æ¡",
      "memory.status.vectorUnconfigured": "æœªé…ç½®",
      "memory.status.vectorUnconfiguredHint": "æœªå¡« embedding ç«¯ç‚¹/æ¨¡å‹æˆ–æœªå¯ç”¨ï¼Œè¯­ä¹‰å¬å›ä¸å¯ç”¨",
      "memory.status.vectorDegradedHint": "å·²ç´¢å¼• 0 / {m} æ¡ï¼Œè¯­ä¹‰å¬å›å®é™…ä¸å¯ç”¨",
        "memory.status.mirror": "Markdown é•œåƒ",
        "memory.status.mirror.ok": "æ­£å¸¸",
        "memory.status.mirror.degraded": "é™çº§",
        "memory.status.mirror.unknown": "æœªçŸ¥",
        "memory.status.mirror.dirty": "æœ‰æœªè½ç›˜æ”¹åŠ¨",
        "memory.status.mirror.yes": "æ˜¯",
        "memory.status.mirror.lastError": "æœ€è¿‘é”™è¯¯",
        "memory.status.mirror.err.noSpace": "ç£ç›˜ç©ºé—´ä¸è¶³",
        "memory.status.mirror.err.permission": "æƒé™ä¸è¶³",
        "memory.status.mirror.err.syncFailed": "åŒæ­¥å¤±è´¥",
        "memory.status.mirror.lastAttempt": "ä¸Šæ¬¡å°è¯•",
        "memory.status.mirror.successAt": "ä¸Šæ¬¡æˆåŠŸ",
        "memory.status.mirror.foot": "è®°å¿†æ¡ç›®åœ¨ç£ç›˜ä¸Šçš„ Markdown å‰¯æœ¬åŒæ­¥çŠ¶æ€",
        "memory.status.sec.overview": "åº“å†…ä¸€è§ˆ",
        "memory.status.sec.engine": "åå°è¿è½¬",
        "memory.status.sec.maintenance": "ç»´æŠ¤",
        "memory.status.maint": "å­˜å‚¨å›æ”¶",
        "memory.status.maint.freelist": "ç©ºé—²é¡µå¯ç«‹åˆ»å›æ”¶",
        "memory.status.maint.plannedInputs": "å¾…æ¸…ç†è¾“å…¥å¿«ç…§",
        "memory.status.maint.plannedEmbeddings": "å¾…æ¸…ç†å½’æ¡£å‘é‡",
        "memory.status.maint.window": "ä¿ç•™çª—å£",
        "memory.status.maint.windowUnit": "å¤©",
        "memory.status.maint.windowLabel": "ä¿ç•™çª—å£ï¼ˆå¤©ï¼‰",
        "memory.status.maint.reestimate": "é‡æ–°ä¼°ç®—",
        "memory.status.maint.reestimating": "ä¼°ç®—ä¸­â€¦",
        "memory.status.maint.stale": "çª—å£å·²æ”¹åŠ¨ï¼šå…ˆç‚¹ã€Œé‡æ–°ä¼°ç®—ã€å†æ‰§è¡Œï¼Œå¦åˆ™æ‰§è¡Œçš„æ˜¯ä¸Šä¸€æ¬¡ä¼°ç®—çš„æ•°å­—ã€‚",
        "memory.status.maint.vacuum": "åŒæ—¶ VACUUM",
        "memory.status.maint.vacuumHint": "VACUUM ä¼šçŸ­æš‚ç‹¬å æ•°æ®åº“ï¼ŒæœŸé—´å…¶å®ƒè¯»å†™è¦ç­‰å¾…ï¼›ä¸åšä¹Ÿä¸å½±å“æ¸…ç†ç»“æœã€‚",
        "memory.status.maint.execute": "æ‰§è¡Œå›æ”¶",
        "memory.status.maint.confirm": "ç¡®è®¤æ‰§è¡Œï¼ˆä¸å¯é€†ï¼‰",
        "memory.status.maint.running": "æ‰§è¡Œä¸­â€¦",
        "memory.status.maint.cancel": "å–æ¶ˆ",
        "memory.status.maint.confirmHint": "å°†æ¸…ç† {inputs} è¡Œè¾“å…¥å¿«ç…§ä¸ {embeddings} è¡Œå½’æ¡£å‘é‡ï¼Œä¸”ä¸å¯é€†ã€‚",
        "memory.status.maint.badWindow": "ä¿ç•™çª—å£è¦å¡«ä¸å°äº 0 çš„æ•´æ•°",
        "memory.status.maint.failed": "å›æ”¶å¤±è´¥",
        "memory.status.maint.done": "å›æ”¶å·²å®Œæˆ",
        "memory.status.maint.size": "ä½“ç§¯ï¼ˆå‰ â†’ åï¼‰",
        "memory.status.maint.reclaimed": "å®é™…é‡Šæ”¾",
        "memory.status.maint.clearedInputs": "å·²æ¸…ç†è¾“å…¥å¿«ç…§",
        "memory.status.maint.clearedEmbeddings": "å·²æ¸…ç†å½’æ¡£å‘é‡",
        "memory.status.maint.receipt": "å®¡è®¡å›æ‰§",
        "memory.status.maint.receiptNone": "æœªè®°å½•ï¼ˆå®¡è®¡æœªå¯ç”¨æˆ–å›æ‰§å†™å…¥å¤±è´¥ï¼‰",
        "memory.status.maint.duration": "è€—æ—¶",
        "memory.status.maint.vacuumRan": "VACUUM å·²æ‰§è¡Œ",
        "memory.status.maint.vacuumOff": "æœª VACUUM",
        "memory.status.maint.vacuumFailed": "VACUUM å¤±è´¥",
        "memory.status.maint.vacuumFailedHint": "æ¸…ç†å·²å®Œæˆä¸”ä¸å¯é€†ï¼Œä½†æ–‡ä»¶æš‚æ—¶ä¸ä¼šå˜å°ï¼›ç¨åé‡è·‘å³å¯ï¼ˆæ¸…ç†æ˜¯å¹‚ç­‰çš„ï¼‰ã€‚",
        "memory.status.sec.token": "Token å»å‘ Â· è¿‘ 7 å¤©",
        "memory.status.token.in": "è¾“å…¥",
        "memory.status.token.out": "è¾“å‡º",
        "memory.status.token.total": "7 å¤© token æ€»é‡",
        "memory.status.token.calls": "è°ƒç”¨æ¬¡æ•°",
        "memory.status.token.callsCap": "è¿‘ 7 å¤© Â· å…¨éƒ¨åå°ç»„ä»¶",
        "memory.status.token.share": "å·©å›ºå æ¯”",
        "memory.status.token.shareFoot": "dream_consolidate Â· {n} token",
        "memory.status.token.conflicts": "å¾…ç¡®è®¤å†²çª",
        "memory.status.token.conflictsFoot": "æ¥è‡ª /dream-status Â· å®æ—¶",
        "memory.status.token.donut": "æŒ‰ç»„ä»¶ Â· è°èŠ±äº†è¿™äº› token",
        "memory.status.token.days": "æŒ‰å¤© Â· 7 å¤©è¶‹åŠ¿",
        "memory.status.token.heat": "8 å‘¨çƒ­åŠ› Â· æ¯å¤©èŠ±äº†å¤šå°‘",
        "memory.status.token.heatLess": "å°‘",
        "memory.status.token.heatMore": "å¤š",
        "memory.status.token.last7": "è¿‘ 7 å¤©",
        "memory.status.token.meterOnly": "ï¼ˆåªè®¡é‡ï¼‰",
        "memory.status.token.detail": "è¯¦ç»†çŠ¶æ€å¡ï¼ˆåŸã€Œåº“å†…ä¸€è§ˆ / åå°è¿è½¬ã€9 å¼ ï¼Œç‚¹å‡»å±•å¼€ï¼‰",
        "memory.status.token.op.dream_consolidate": "è®°å¿†å·©å›º",
        "memory.status.token.op.summarize_compress": "ä¼šè¯è’¸é¦",
        "memory.status.token.op.entity_extract": "å®ä½“æŠ½å–",
        "memory.status.token.op.dream_summarize": "æ€»è§ˆæ‘˜è¦",
        "memory.status.token.op.sleep_pattern": "ç¡çœ æ¨¡å¼",
        "memory.status.token.op.write_admission": "å†™å…¥å‡†å…¥",
        "memory.status.error": "åŠ è½½å¤±è´¥"
      },
      en: {
        "memory.panel.empty": "No memories yet",
        "memory.panel.open": "Memory",
        "memory.tab.all": "All",
        "memory.tab.preference": "Preferences",
        "memory.tab.project": "Projects",
        "memory.tab.decision": "Decisions",
        "memory.tab.history": "History",
        "memory.tab.summary": "Summaries",
        "memory.am.nav": "Amadeus Memory",
        "memory.am.title": "Amadeus Memory",
        "memory.am.subtitle": "Check memory health and tune retrieval settings. In strict Scene mode, view the graph for one selected Scene below.",
        "memory.am.loading": "Loading statusâ€¦",
        "memory.am.refresh": "Refresh status",
        "memory.am.openPanel": "Open full memory manager",
        "memory.am.section.overview": "Overview",
        "memory.am.section.core": "Automatic memory & consolidation",
        "memory.am.section.config": "Injection & memory parameters",
        "memory.am.section.memories": "Memory management",
        "memory.am.section.backup": "Backup & restore",
        "memory.am.default": "Default",
        "memory.am.range": "Range",
        "memory.am.unit.items": "items",
        "memory.am.unit.chars": "chars",
        "memory.am.unit.ms": "ms",
        "memory.am.unit.minutes": "minutes",
        "memory.am.unit.turns": "turns",
        "memory.am.unit.score": "score",
        "memory.am.memory.search": "Search",
        "memory.am.memory.searchPlaceholder": "Title or bodyâ€¦",
        "memory.am.memory.archived": "Show archived",
        "memory.am.memory.new": "New memory",
        "memory.am.memory.refresh": "Refresh",
        "memory.am.memory.empty": "No matching memories",
        "memory.am.memory.edit": "Edit",
        "memory.am.memory.archive": "Archive",
        "memory.am.memory.unarchive": "Unarchive",
        "memory.am.memory.delete": "Delete",
        "memory.am.memory.deleteConfirm": "Permanently delete this memory?",
        "memory.am.memory.deleteHint": "Deletion cannot be undone; create a backup first.",
        "memory.am.memory.confirmDelete": "Delete permanently",
        "memory.am.memory.cancel": "Cancel",
        "memory.am.memory.save": "Save memory",
        "memory.am.memory.saving": "Savingâ€¦",
        "memory.am.memory.type": "Type",
        "memory.am.memory.typeImmutable": "The type of an existing memory is immutable",
        "memory.am.memory.title": "Title",
        "memory.am.memory.content": "Content",
        "memory.am.memory.importance": "Importance (1â€“5)",
        "memory.am.memory.tags": "Tags (comma-separated)",
        "memory.am.memory.tagsHint": "Ordinary tags can be edited; protected event tags cannot be forged through ordinary management.",
        "memory.am.memory.tagsPlaceholder": "project, work",
        "memory.am.memory.type.preference": "Preference",
        "memory.am.memory.type.project": "Project",
        "memory.am.memory.type.decision": "Decision",
        "memory.am.memory.type.history": "History",
        "memory.am.memory.type.summary": "Summary",
        "memory.am.memory.type.pattern": "Pattern",
        "memory.am.memory.type.rejected_solution": "Rejected solution",
        "memory.am.memory.type.pitfall": "Pitfall",
        "memory.am.memory.type.constraint": "Constraint",
        "memory.am.memory.titleRequired": "Title is required",
        "memory.am.memory.contentRequired": "Content is required",
        "memory.am.memory.saved": "Memory saved",
        "memory.am.memory.created": "Memory created",
        "memory.am.memory.merged": "Merged into the existing title",
        "memory.am.memory.autoArchived": "Created, but the quality filter archived it; enable â€œShow archivedâ€ to restore it.",
        "memory.am.memory.core": "Core memory (protected)",
        "memory.am.memory.coreHint": "Protected memories are never auto-archived, forgotten, merged or deleted; unprotect before deleting.",
        "memory.am.memory.coreNote": "Optional first-person note",
        "memory.am.memory.coreBadge": "Core",
        "memory.am.memory.coreSaved": "Core protection updated",
        "memory.am.scene.title": "Scene and recent context",
        "memory.am.scene.isolation": "Scene isolation",
        "memory.am.scene.strict": "Strict QQ mode",
        "memory.am.scene.hostUnavailable": "Trusted Host unavailable: cross-scene sharing stays disabled (safe downgrade)",
        "memory.am.scene.current": "Current scene",
        "memory.am.scene.unknownPolicy": "Unknown-provenance memories are not public; scene-tagged memories are hidden by default",
        "memory.am.scene.legacyNote": "An unscoped legacy memory stays unscoped when promoted to Core. Legacy access may expose it to other sessions; do not treat it as private.",
        "memory.am.scene.legacy": "legacy/unscoped",
        "memory.am.scene.grants": "Authorized read relationships",
        "memory.am.scene.noGrants": "No cross-scene grants",
        "memory.am.scene.degraded": "Strict Scene mode limits ordinary graph/identity/preference reads; the owner Scene graph remains available. Enabled autoDream/Sleep run per persisted Scene.",
        "memory.am.recent.title": "Recent context",
        "memory.am.recent.enabled": "Enabled",
        "memory.am.recent.disabled": "Disabled",
        "memory.am.recent.ttl": "TTL (minutes)",
        "memory.am.recent.count": "Buffered events",
        "memory.am.recent.clear": "Clear recent buffer",
        "memory.am.recent.cleared": "Recent buffer cleared",
        "memory.am.workspace.title": "Workspace",
        "memory.am.workspace.hint": "Amadeus Memory uses exactly one Workspace at a time. Changing it immediately stops the old Workspace from serving model memory; its data is retained, and the new Workspace activates only after a plugin restart or reload.",
        "memory.am.workspace.selectLabel": "Select Workspace",
        "memory.am.workspace.choose": "Choose a Workspaceâ€¦",
        "memory.am.workspace.none": "No Workspace selected yet",
        "memory.am.workspace.untitled": "Untitled Workspace",
        "memory.am.workspace.sessions": "Sessions",
        "memory.am.workspace.selected": "Selected",
        "memory.am.workspace.active": "Active now",
        "memory.am.workspace.activeNone": "No Workspace bound at runtime",
        "memory.am.workspace.selectedUnknown": "The selected Workspace is not in the current Registry",
        "memory.am.workspace.pendingBadge": "Restart pending",
        "memory.am.workspace.pending": "Selection saved. Restart or reload the Amadeus Memory plugin to activate the new Workspace; the running runtime still points at the old Workspace and immediately denies model memory operations. The old data was not deleted or migrated.",
        "memory.am.workspace.save": "Save selection",
        "memory.am.workspace.saving": "Savingâ€¦",
        "memory.am.workspace.cancel": "Cancel",
        "memory.am.workspace.sameSelection": "This is already the selected Workspace; nothing to save.",
        "memory.am.workspace.invalidSelection": "The selected Workspace is not in the current Registry. Choose again.",
        "memory.am.workspace.registryUnavailable": "The Workspace Registry is unavailable, so selection and saving are disabled.",
        "memory.am.workspace.registryEmpty": "The Workspace Registry is empty; there is nothing to select yet.",
        "memory.am.workspace.reason": "Reason code",
        "memory.am.workspace.loadFailed": "Failed to load Workspaces",
        "memory.am.workspace.saveFailed": "Failed to save Workspace selection",
        "memory.am.workspace.savedPending": "Saved; restart or reload the plugin to activate it.",
        "memory.am.workspace.savedNoChange": "Selection unchanged; no restart needed.",
        "memory.am.workspace.confirmTitle": "Change Workspace?",
        "memory.am.workspace.confirmTarget": "You are selecting â€œ{title}â€.",
        "memory.am.workspace.confirmStop": "After saving, the running runtime immediately stops serving model memory for the old Workspace.",
        "memory.am.workspace.confirmRetained": "Data in the old Workspace is retained; it is not deleted, merged, or migrated.",
        "memory.am.workspace.confirmRestart": "You must restart or reload the Amadeus Memory plugin before the new Workspace activates; saving does not switch the running runtime.",
        "memory.am.workspace.confirmAction": "Confirm change",
        "memory.am.recentActivity.title": "Cross-Session recent activity",
        "memory.am.recentActivity.hint": "Workspace-isolated: each Session can opt in and choose how far its recent summaries travel. Every preview is filtered server-side for the target Session.",
        "memory.am.recentActivity.summaryTitle": "Recent activity summary",
        "memory.am.recentActivity.workspaceSelected": "Selected Workspace",
        "memory.am.recentActivity.workspaceActive": "Active Workspace",
        "memory.am.recentActivity.workspaceNone": "No Workspace selected yet",
        "memory.am.recentActivity.enabled": "Enabled",
        "memory.am.recentActivity.disabled": "Disabled",
        "memory.am.recentActivity.configuredOn": "Configured on",
        "memory.am.recentActivity.configuredOff": "Configured off",
        "memory.am.recentActivity.pendingBadge": "Restart pending",
        "memory.am.recentActivity.pending": "The configuration was saved, but the running runtime has not switched yet; restart or reload the Amadeus Memory plugin to apply it fully.",
        "memory.am.recentActivity.participating": "Participating Sessions",
        "memory.am.recentActivity.summaries": "Summaries",
        "memory.am.recentActivity.lastUpdated": "Last update",
        "memory.am.recentActivity.storage": "Approximate storage",
        "memory.am.recentActivity.injectionBudget": "Injection budget",
        "memory.am.recentActivity.previewTokens": "Estimated injection Tokens",
        "memory.am.recentActivity.policyCount": "Saved policies",
        "memory.am.recentActivity.sources": "Sources",
        "memory.am.recentActivity.never": "Never updated",
        "memory.am.recentActivity.unknown": "Unknown",
        "memory.am.recentActivity.sessionsTitle": "Session participation and sharing",
        "memory.am.recentActivity.sessionsHint": "The list comes from the owner API. Filter by title or stable Session ID, then click a row to edit.",
        "memory.am.recentActivity.searchLabel": "Search Sessions",
        "memory.am.recentActivity.searchPlaceholder": "Filter by title or exact Session ID",
        "memory.am.recentActivity.sessionsEmpty": "This Workspace has no manageable Sessions.",
        "memory.am.recentActivity.searchEmpty": "No matching Sessions.",
        "memory.am.recentActivity.sessionId": "Stable ID",
        "memory.am.recentActivity.lastActive": "Last active",
        "memory.am.recentActivity.participatingBadge": "Participating",
        "memory.am.recentActivity.pausedBadge": "Paused",
        "memory.am.recentActivity.modeSelf": "Self only",
        "memory.am.recentActivity.modeOwner": "Owner only",
        "memory.am.recentActivity.modeShared": "Selected Sessions",
        "memory.am.recentActivity.modeOwnerGated": "(active only after server-confirmed binding)",
        "memory.am.recentActivity.detailTitle": "Session sharing settings",
        "memory.am.recentActivity.detailHint": "Save submits only this Session's exact policy; the server still enforces permissions.",
        "memory.am.recentActivity.participation": "Participate in cross-Session recent activity",
        "memory.am.recentActivity.participationHint": "When off, this Session neither writes nor reads cross-Session recent summaries.",
        "memory.am.recentActivity.modeLabel": "Sharing mode",
        "memory.am.recentActivity.modeSelfHint": "Keep summaries for this Session only; never offer them to other Sessions.",
        "memory.am.recentActivity.modeOwnerHint": "Offer to Owner targets only after the server confirms a trusted Owner binding; otherwise degrade safely.",
        "memory.am.recentActivity.modeSharedHint": "Offer only to the Sessions checked below.",
        "memory.am.recentActivity.ownerDegraded": "The current state does not declare a trusted Owner binding. Owner mode is safely degraded by the server; the UI does not present it as active.",
        "memory.am.recentActivity.sharedLabel": "Share with (exact Session IDs)",
        "memory.am.recentActivity.sharedHint": "Only the checked other Sessions may read this Session's recent summaries; the list is bounded.",
        "memory.am.recentActivity.sharedEmpty": "No other Sessions are available.",
        "memory.am.recentActivity.sharedUnknown": "Existing Session absent from the current list (exact ID retained)",
        "memory.am.recentActivity.sharedSelected": "{count} Sessions selected",
        "memory.am.recentActivity.sharedLimit": "At most 32 shared Sessions.",
        "memory.am.recentActivity.savePolicy": "Save sharing settings",
        "memory.am.recentActivity.saving": "Savingâ€¦",
        "memory.am.recentActivity.policySaved": "Sharing settings saved; the preview was refreshed.",
        "memory.am.recentActivity.policyInvalid": "Check the Session sharing settings before saving.",
        "memory.am.recentActivity.policyModeInvalid": "Choose a valid sharing mode.",
        "memory.am.recentActivity.policySharedInvalid": "The shared list contains invalid, duplicate, or too many Session IDs.",
        "memory.am.recentActivity.selectSession": "Select a Session to edit.",
        "memory.am.recentActivity.closeDetail": "Collapse settings",
        "memory.am.recentActivity.previewTitle": "Server permission preview",
        "memory.am.recentActivity.previewHint": "The preview is filtered server-side for the target Session and returns safe summaries only, never raw chat.",
        "memory.am.recentActivity.previewTarget": "Preview target Session",
        "memory.am.recentActivity.previewChoose": "Choose a Session to previewâ€¦",
        "memory.am.recentActivity.previewRefresh": "Refresh preview",
        "memory.am.recentActivity.previewEmpty": "No visible recent summaries for this target.",
        "memory.am.recentActivity.previewDenied": "The server did not authorize this preview.",
        "memory.am.recentActivity.previewTruncated": "Results were truncated by the item or Token budget.",
        "memory.am.recentActivity.previewCount": "Items",
        "memory.am.recentActivity.previewEstimated": "Estimated Tokens",
        "memory.am.recentActivity.previewSource": "Source",
        "memory.am.recentActivity.kindConversation": "Conversation summary",
        "memory.am.recentActivity.kindAgentAction": "Agent action summary",
        "memory.am.recentActivity.configTitle": "Global configuration",
        "memory.am.recentActivity.configHint": "These switches affect recent activity in the current Workspace only; Session hot memory is unchanged.",
        "memory.am.recentActivity.featureEnabled": "Enable cross-Session recent activity",
        "memory.am.recentActivity.ttlLabel": "Retention",
        "memory.am.recentActivity.ttl1": "1 hour",
        "memory.am.recentActivity.ttl6": "6 hours",
        "memory.am.recentActivity.ttl24": "24 hours",
        "memory.am.recentActivity.ttl72": "72 hours",
        "memory.am.recentActivity.autoInject": "Auto-inject recent activity",
        "memory.am.recentActivity.autoInjectHint": "Inject server-filtered recent summaries in authorized directions; raw chat is never injected.",
        "memory.am.recentActivity.maxItems": "Maximum summaries (1â€“10)",
        "memory.am.recentActivity.maxTokens": "Token budget (100â€“800)",
        "memory.am.recentActivity.validationEnabled": "Choose whether to enable it.",
        "memory.am.recentActivity.validationTtl": "Retention must be 1, 6, 24 or 72 hours.",
        "memory.am.recentActivity.validationAutoInject": "Choose whether to auto-inject.",
        "memory.am.recentActivity.validationMaxItems": "Maximum summaries must be an integer from 1 to 10.",
        "memory.am.recentActivity.validationMaxTokens": "Token budget must be an integer from 100 to 800.",
        "memory.am.recentActivity.saveConfig": "Save global configuration",
        "memory.am.recentActivity.configSaved": "Global configuration saved.",
        "memory.am.recentActivity.configPendingSaved": "Global configuration saved; restart or reload the plugin to apply it fully.",
        "memory.am.recentActivity.strategyTitle": "Summarization strategy (fixed, deterministic)",
        "memory.am.recentActivity.strategy": "After each completed turn, the server deterministically derives a length-bounded summary with fixed rules; it never asks a model to freely generate one and never returns raw chat.",
        "memory.am.recentActivity.loadFailed": "Failed to load cross-Session recent activity",
        "memory.am.recentActivity.saveFailed": "Failed to save cross-Session recent activity settings",
        "memory.am.recentActivity.previewFailed": "Failed to load the preview",
        "memory.am.recentActivity.backendError": "The server returned an error; details that could contain paths or sensitive data were suppressed.",
        "memory.am.recentActivity.reasonSourceDisabled": "The target Session is paused",
        "memory.am.recentActivity.reasonAccessDenied": "The server denied access to this Session",
        "memory.am.recentActivity.reasonInvalidPolicy": "The policy is invalid or unreadable",
        "memory.am.recentActivity.reasonMissingSession": "The target Session ID is missing",
        "memory.am.recentActivity.reasonUnavailable": "Recent-activity storage is currently unavailable",
        "memory.am.recentActivity.reasonUnknown": "Unrecognized safe reason code",
        "memory.am.graph.title": "Scene knowledge graph (read-only)",
        "memory.am.graph.scope": "Select scene",
        "memory.am.graph.choose": "Choose a scene",
        "memory.am.graph.chooseHint": "Select one scene to view its entities and relations; scenes are never unioned.",
        "memory.am.graph.empty": "No entity evidence in this scene",
        "memory.am.graph.truncated": "Results are truncated; choose a narrower scene or range.",
        "memory.am.graph.nodes": "nodes",
        "memory.am.graph.edges": "relations",
        "memory.am.graph.relations": "Relations",
        "memory.am.graph.noRelations": "No relation evidence",
        "memory.am.graph.related": "related memories",
        "memory.am.graph.overview": "Overview shows {shown}/{total} nodes; the full list is below",
        "memory.am.graph.nodesList": "Nodes (keyboard selectable)",
        "memory.am.graph.search": "Search nodes",
        "memory.am.graph.searchPlaceholder": "Filter by name or type",
        "memory.am.graph.searchClear": "Clear search",
        "memory.am.graph.searchEmpty": "No matching nodes",
        "memory.am.graph.focused": "Focused",
        "memory.explorer.title": "Amadeus Memory explorer",
        "memory.explorer.close": "Close",
        "memory.explorer.all": "All",
        "memory.explorer.allScenes": "All Scenes",
        "memory.explorer.scopeHint": "Select one or more Scenes to narrow results; empty means all.",
        "memory.explorer.keyword": "Keyword search",
        "memory.explorer.searchPlaceholder": "Title/content/tag keyword",
        "memory.explorer.type": "Type",
        "memory.explorer.allTypes": "All types",
        "memory.explorer.minImportance": "Min importance",
        "memory.explorer.date": "Date",
        "memory.explorer.archived": "Only archived",
        "memory.explorer.cards": "Cards",
        "memory.explorer.scene": "Scene",
        "memory.explorer.editTitle": "Title",
        "memory.explorer.editContent": "Content",
        "memory.explorer.prev": "Previous",
        "memory.explorer.next": "Next",
        "memory.explorer.hop1": "1 hop",
        "memory.explorer.hop2": "2 hops",
        "memory.explorer.hops": "Hops",
        "memory.explorer.reset": "Reset",
        "memory.explorer.statusOverview": "Runtime overview",
        "memory.explorer.conflicts": "Pending conflicts",
        "memory.explorer.dreamRuns": "Dream runs",
        "memory.explorer.audit7d": "Usage (7 days)",
        "memory.explorer.tokenShare": "Token share by operation",
        "memory.explorer.requests": "Requests",
        "memory.explorer.tokens": "Tokens",
        "memory.explorer.noData": "No real data available",
        "memory.explorer.acl": "Read allowlist (directional)",
        "memory.explorer.aclHint": "Allow one QQ group to read another group's long-term memories on the same bot. Read-only, non-transitive, never private/legacy. Browser selection is not a grant.",
        "memory.explorer.aclEmpty": "No manual grants",
        "memory.explorer.revoke": "Revoke",
        "memory.explorer.reader": "Reader group",
        "memory.explorer.grant": "Grant read",
        "memory.explorer.bot": "Bot QQ number",
        "memory.explorer.readerGroup": "Reader group number",
        "memory.explorer.sourceGroup": "Source group number",
        "memory.explorer.aclDirection": "Group {reader} can read Group {source}'s long-term memories",
        "memory.am.tabs.memory": "Memory",
        "memory.am.tabs.entities": "Entities",
        "memory.am.tabs.status": "Status",
        "memory.am.tabs.settings": "Settings",
        "memory.am.memoryView.longTerm": "Long-term",
        "memory.am.memoryView.recent": "Cross-Session recent activity",
        "memory.am.settings.general": "General",
        "memory.am.settings.personalization": "Personalization",
        "memory.personalization.profile": "User profile",
        "memory.personalization.profileHint": "Profile and rules are read from the current owner settings; saves apply to the next injection.",
        "memory.personalization.defaultCard": "Default persona card",
        "memory.personalization.agentCards": "Per-Agent persona cards",
        "memory.personalization.name": "Name",
        "memory.personalization.personality": "Personality",
        "memory.personalization.replyStyle": "Reply style",
        "memory.personalization.enabled": "Enabled",
        "memory.personalization.preview": "Actual injection preview",
        "memory.personalization.previewHint": "Produced by the same server renderer used for injection; profile/persona/rules only, no cross-Scene memory bodies.",
        "memory.personalization.saveProfile": "Save profile",
        "memory.personalization.savePersona": "Save persona cards",
        "memory.personalization.saved": "Personalization saved",
        "memory.am.settings.retrieval": "Retrieval",
        "memory.am.settings.scene": "Scene",
        "memory.am.settings.backup": "Backup",
        "memory.am.settings.acl": "Read allowlist",
        "memory.am.recent.hotTitle": "Session hot memory",
        "memory.am.recent.hotHint": "The last few turns of this Session, held only in process memory and gone with the Session; it is not SQLite memory and the owner API cannot enumerate or list its text.",
        "memory.am.recent.hotState": "Hot-memory injection",
        "memory.am.recent.trustedTitle": "Trusted Scene recent context",
        "memory.am.recent.trustedHint": "In-process buffer with a 10-minute TTL. The owner can see event counts by Scene, never raw text.",
        "memory.am.entitiesHint": "Read-only single-Scene graph. A Scene must be selected; scenes are never unioned.",
        "memory.am.entitiesFullHint": "When Scene memories exist or strict mode is on, legacy graph and identity APIs are closed. Alias and canonical-entity management need a Scene-safe owner entry.",
        "memory.am.entitiesOpenFull": "Open full memory/entity panel",
        "memory.am.entitiesWeights": "Tag/entity weights",
        "memory.am.memory.archivedDone": "Archived",
        "memory.am.memory.unarchivedDone": "Unarchived",
        "memory.am.memory.deleted": "Deleted",
        "memory.am.memory.stale": "This memory changed elsewhere; reopen it before saving.",
        "memory.am.memory.loadError": "Failed to load memories",
        "memory.am.memory.prev": "Previous",
        "memory.am.memory.next": "Next",
        "memory.am.restoreDefaultsHint": "Resets parameters only; memories are never deleted.",
        "memory.am.backup.create": "Create backup",
        "memory.am.backup.creating": "Backing upâ€¦",
        "memory.am.backup.refresh": "Refresh backups",
        "memory.am.backup.empty": "No backups yet",
        "memory.am.backup.hint": "Backups are consistent SQLite snapshots under memoryDir/backups; restore applies only on restart.",
        "memory.am.backup.check": "Verify",
        "memory.am.backup.checked": "Verified",
        "memory.am.backup.restore": "Stage restore",
        "memory.am.backup.restoreTitle": "Restore backup",
        "memory.am.backup.restoreHint": "Restore replaces the live database at the next DSH start and first preserves a pre-restore copy; it never overwrites a running database.",
        "memory.am.backup.ack": "I understand a restart is required",
        "memory.am.backup.stage": "Stage and restore on restart",
        "memory.am.backup.staged": "Staged; restart DSH to apply.",
        "memory.am.backup.failed": "Backup operation failed",
        "memory.am.backup.restart": "Takes effect after DSH restart",
        "memory.am.backup.sha": "SHA-256",
        "memory.am.backup.memories": "memories",
        "memory.am.backup.createdAt": "Created",
        "memory.am.section.embedding": "Vector retrieval & Embedding",
        "memory.am.section.preferences": "Tag & entity preferences",
        "memory.am.section.advanced": "Advanced & diagnostics",
        "memory.am.runState": "Memory state",
        "memory.am.memories": "Memories",
        "memory.am.archived": "Archived",
        "memory.am.forgotten": "Forgotten",
        "memory.am.running": "Running",
        "memory.am.paused": "Paused",
        "memory.am.database": "SQLite",
        "memory.am.autoMemory": "Auto memory/summary",
        "memory.am.lastError": "Last error",
        "memory.am.none": "None",
        "memory.am.version": "Version",
        "memory.am.lastDream": "Last auto consolidation",
        "memory.am.lastSleep": "Last Sleep",
        "memory.am.never": "Never",
        "memory.am.vector": "Vector retrieval",
        "memory.am.vectorReady": "Ready",
        "memory.am.vectorInitializing": "Initializing",
        "memory.am.vectorDisabled": "Not configured",
        "memory.am.dimension": "Dimension",
        "memory.am.coverage": "Index coverage",
        "memory.am.featureHint": "These switches use the same runtime override store as the full panel; reload when prompted.",
        "memory.am.configUnavailable": "This DSH build does not expose Config Forms; edit these values in Plugin Manager.",
        "memory.am.configHint": "These structural values use Config Forms; apply configuration or reload the plugin when prompted by the host.",
        "memory.am.conflict": "Another page changed the configuration. Cancel and reopen before saving so you do not overwrite it.",
        "memory.am.save": "Save",
        "memory.am.cancel": "Cancel",
        "memory.am.restoreDefaults": "Restore defaults",
        "memory.am.saved": "Saved.",
        "memory.am.savedRestart": "Saved; effective after the plugin reloads.",
        "memory.am.restartHint": "Stored; effective after the plugin reloads.",
        "memory.am.embedHint": "Only provider, model, dimension and index state are shown; keys never return to the browser.",
        "memory.am.vectorEnabled": "Enable vector retrieval",
        "memory.am.vectorEnabledHint": "Keyword search remains available when this is off.",
        "memory.am.local": "Local ONNX",
        "memory.am.baseUrl": "Base URL",
        "memory.am.model": "Model",
        "memory.am.apiKey": "API Key",
        "memory.am.apiKeyKeep": "Leave blank or keep the mask to retain the existing key.",
        "memory.am.saveEmbedding": "Save Embedding config",
        "memory.am.embeddingSavedRestart": "Saved; model/provider changes rebuild the index and apply after reload.",
        "memory.am.test": "Test connectivity",
        "memory.am.testing": "Testingâ€¦",
        "memory.am.testWarning": "This makes one real remote request when the provider is remote.",
        "memory.am.testOk": "Connected",
        "memory.am.testFailed": "Connection failed",
        "memory.am.preferenceHint": "Uses the existing memory weight store; restoring defaults removes weights only, never memories.",
        "memory.am.tagWeights": "Tag weights",
        "memory.am.entityWeights": "Entity weights",
        "memory.am.delete": "Delete",
        "memory.am.reset": "Restore default weights",
        "memory.am.resetConfirm": "Confirm restore defaults",
        "memory.am.invalid": "Value is outside the allowed range.",
        "memory.am.noChanges": "No changes.",
        "memory.am.package": "Package",
        "memory.am.dataDir": "Database path",
        "memory.am.vectorIndex": "Vector index",
        "memory.am.trustedIntake": "Trusted intake",
        "memory.am.enabled": "Enabled",
        "memory.am.disabled": "Disabled",
        "memory.am.advancedTitle": "Show advanced diagnostics",
        "memory.am.advancedHint": "Use â€œOpen full memory managerâ€ for aliases, merges, maintenance and audit. In strict Scene mode, use the Scene graph above because ordinary graph reads are closed.",
        "memory.am.languageZh": "ä¸­æ–‡",
        "memory.am.languageEn": "English",
        "memory.am.field.language": "Memory language",
        "memory.am.field.dreamThresholdCount": "Consolidation trigger count",
        "memory.am.field.dreamThresholdChars": "Consolidation trigger chars",
        "memory.am.field.dreamDelayMs": "Consolidation delay (ms)",
        "memory.am.field.sleepIdleMinutes": "Sleep idle minutes",
        "memory.am.field.maxInjectedItems": "Max injected items",
        "memory.am.field.importanceThreshold": "Auto-inject importance threshold",
        "memory.am.field.injectContentMaxChars": "Injected content truncation",
        "memory.am.field.injectRotationTurns": "Injection rotation turns",
        "memory.am.field.vectorSearchTopK": "Vector candidates",
        "memory.am.field.vectorSearchThreshold": "Vector similarity threshold",
        "memory.am.field.hybridSearchVectorWeight": "Hybrid vector weight",
        "memory.am.field.autoReindexOnBoot": "Backfill index on boot",
        "memory.am.fieldHint.language": "Language for memory titles and background prompts.",
        "memory.am.fieldHint.dreamThresholdCount": "Trigger consolidation after this many new memories.",
        "memory.am.fieldHint.dreamThresholdChars": "Trigger consolidation after this much new text.",
        "memory.am.fieldHint.dreamDelayMs": "How long to wait before starting consolidation.",
        "memory.am.fieldHint.sleepIdleMinutes": "Idle minutes before Sleep runs.",
        "memory.am.fieldHint.maxInjectedItems": "Upper bound on automatically injected memories each turn.",
        "memory.am.fieldHint.importanceThreshold": "Only memories at or above this importance are auto-injected.",
        "memory.am.fieldHint.injectContentMaxChars": "Per-memory truncation limit in the injected block.",
        "memory.am.fieldHint.injectRotationTurns": "Avoid injecting the same memories on adjacent turns.",
        "memory.am.fieldHint.vectorSearchTopK": "Semantic candidates entering the fusion pool.",
        "memory.am.fieldHint.vectorSearchThreshold": "Vectors below this similarity are ignored.",
        "memory.am.fieldHint.hybridSearchVectorWeight": "Weight of vector scores in hybrid retrieval.",
        "memory.am.fieldHint.autoReindexOnBoot": "Fill missing vector rows after startup.",
        "memory.settings.title": "Memory Settings",
        "memory.settings.group.identity": "Identity & preferences",
        "memory.settings.identity.title": "Identity & preference weights",
        "memory.settings.identity.desc": "Same-name entities stay candidates until a human links them; set 0.5â€“2.0 weights for tags or canonical entities (default 1.0, combined and clamped to 0.6â€“1.6). With the master switch off or every weight at 1.0, retrieval is unchanged.",
        "memory.settings.identity.tags": "Tag weights",
        "memory.settings.identity.tagPlaceholder": "tag, e.g. person:close",
        "memory.settings.identity.weight": "Weight",
        "memory.settings.identity.addTag": "Add tag weight",
        "memory.settings.identity.entities": "Entity preferences",
        "memory.settings.identity.entityPlaceholder": "entity UUID or name",
        "memory.settings.identity.addEntity": "Add entity weight",
        "memory.settings.identity.candidates": "Duplicate candidates",
        "memory.settings.identity.candidatesHint": "Name/alias similarity only proposes; nothing is merged or rewritten before confirmation. Preview the impact first, then confirm.",
        "memory.settings.identity.preview": "Preview impact",
        "memory.settings.identity.previewLeft": "Keep left",
        "memory.settings.identity.previewRight": "Keep right",
        "memory.settings.identity.confirm": "Confirm merge",
        "memory.settings.identity.undo": "Undo merge",
        "memory.settings.identity.links": "Canonical links",
        "memory.settings.identity.noCandidates": "No candidates waiting for confirmation",
        "memory.settings.identity.noLinks": "No canonical link",
        "memory.settings.identity.counts": "Entities {entities} Â· attrs {attrs} Â· relations {relations} Â· memories {memories} Â· conflicts {conflicts}",
        "memory.settings.identity.blocked": "Blocked: {reason}",
        "memory.settings.identity.dryRun": "Impact report generated (nothing written)",
        "memory.settings.identity.saved": "Saved",
        "memory.settings.identity.deleted": "Deleted",
        "memory.settings.identity.error": "Operation failed",
        "memory.settings.identity.delete": "Delete",
        "memory.settings.identity.save": "Save",
        "memory.identity.needToken": "Identity and provenance details require the server apiToken: set apiToken in the plugin config and enter the same value under Settings â†’ Connections & safety â†’ API Token.",
        "memory.identity.title": "Identity",
        "memory.identity.aliases": "Aliases",
        "memory.identity.externalIds": "External identifiers",
        "memory.identity.history": "History & evidence",
        "memory.identity.aliasPlaceholder": "New aliasâ€¦",
        "memory.identity.addAlias": "Add",
        "memory.identity.confirmAlias": "Confirm",
        "memory.identity.editAlias": "Rename",
        "memory.identity.unlink": "Unlink",
        "memory.identity.externalPlaceholder": "external id",
        "memory.identity.platformPlaceholder": "platform, e.g. qq",
        "memory.identity.typePlaceholder": "type",
        "memory.identity.addExternal": "Bind external id",
        "memory.identity.preference": "Preference weight",
        "memory.identity.preferenceHint": "Preference weight for this canonical entity (0.5â€“2.0, default 1.0).",
        "memory.identity.members": "Canonical members",
        "memory.identity.merged": "Merged view",
        "memory.identity.provenance": "Source",
        "memory.identity.weight": "Weight",
        "memory.identity.saveWeight": "Save weight",
        "memory.identity.noAliases": "No aliases yet",
        "memory.identity.noExternal": "No external identifiers",
        "memory.identity.duplicateName": "Same-name entity",
        "memory.graph.edgeWeight": "weight {weight} Â· source {source}",
        "memory.graph.canonicalHint": "Canonical view of {n} original entities",
        "memory.settings.group.personal": "Personalization",
        "memory.settings.group.engine": "Memory engine",
        "memory.settings.group.search": "Search",
        "memory.settings.group.connect": "Connections & safety",
        "memory.settings.group.help": "Help",
        "memory.settings.profile": "User Profile",
        "memory.settings.profileHint": "Describe yourself once â€” the agent reads it every turn.",
        "memory.settings.profileSave": "Save Profile",
        "memory.settings.profileSaved": "Profile saved",
        "memory.settings.profileExtract": "Draft from memory",
        "memory.settings.profileExtracting": "Extractingâ€¦",
        "memory.settings.profileExtractHint": "Costs one model call, and only when you press this button. The result is a draft: nothing is stored until you apply it, and your hand-written profile is never overwritten.",
        "memory.settings.profileExtractDisabled": "Nothing extracted: the â€œProfile draft from memoryâ€ feature switch is still off.",
        "memory.settings.profileExtractEmpty": "No usable memory entries in the store, so there was nothing to draft from (writing a profile out of an empty input would only be invention).",
        "memory.settings.profileExtractNoRoute": "No model available: pick a default model in the host (or set dreamProvider / dreamModel), then try again.",
        "memory.settings.profileSaveFailed": "Profile was not saved",
        "memory.settings.profileExtractFailed": "Extraction failed: the model did not return the required shape, or the call errored. Your existing profile is untouched.",
        "memory.settings.profileDraftTitle": "Draft (not saved)",
        "memory.settings.profileDraftRows": "Based on entries",
        "memory.settings.profileDraftTruncated": "many entries â€” only the first batch was read",
        "memory.settings.profileDraftApply": "Apply as profile",
        "memory.settings.profileDraftDiscard": "Discard draft",
        "memory.settings.persona": "Persona (beta)",
        "memory.settings.personaHint": "Give this agent a character card: name, personality, reply style. Injected every turn when the toggle below and the \"Persona\" master switch are both on.",
        "memory.settings.personaName": "Name",
        "memory.settings.personaNamePlaceholder": "e.g. Nyx",
        "memory.settings.personaPersonality": "Personality",
        "memory.settings.personaPersonalityPlaceholder": "e.g. relaxed and humorous; use analogies for hard topics",
        "memory.settings.personaReplyStyle": "Reply style",
        "memory.settings.personaReplyStylePlaceholder": "e.g. conclusion first; plain words over jargon",
        "memory.settings.personaSave": "Save Persona",
        "memory.settings.personaSaved": "Persona saved",
        "memory.settings.personaSaveFailed": "Save failed",
        "memory.settings.personaEnabledToggle": "Enable this card",
        "memory.settings.personaEnabledOn": "On â€” sessions matching this identity get this card",
        "memory.settings.personaEnabledOff": "Off â€” by default such sessions fall back to the default card; with strict persona addressing they get no persona at all",
        "memory.settings.personaDefaultCard": "Default (fallback)",
        "memory.settings.personaAdd": "Add card",
        "memory.settings.personaAddPlaceholder": "Agent identity (e.g. nyx) used to address injection",
        "memory.settings.personaEditingDefault": "Editing: default card â€” always used by sessions with no resolvable identity; a session whose identity has no card (or whose card is off) also lands here under the default mode, while strict persona addressing injects nothing instead",
        "memory.settings.personaEditingFor": "Editing identity card:",
        "memory.settings.personaDeleteCard": "Delete this card",
        "memory.settings.personaView": "You, as the agent sees you (injected text)",
        "memory.settings.personaViewHint": "This is the exact block handed to the model this turn: persona â†’ profile â†’ rules (later lines override earlier ones; rules are hardest). The plugin renders it; the panel only displays it.",
        "memory.settings.personaViewEmpty": "All three are empty â€” the agent only sees the memory store.",
        "memory.settings.personaViewUnknown": "Could not read the injected text (preview request failed or backend too old). Nothing is guessed here.",
        "memory.settings.personaViewSourceDefault": "Preview for sessions whose identity cannot be resolved â€” the default card applies.",
        "memory.settings.personaViewSourceFallback": "This identity resolved, but it has no usable card (never created, or switched off), so the default card applies â€” which is exactly why turning this card off changes nothing under the default mode. With strict persona addressing on, such a session gets no persona at all.",
        "memory.settings.personaViewSourceCard": "Preview for the identity card you are editing.",
        "memory.settings.personaViewSourceNone": "Under the current addressing mode this identity injects no persona at all â€” the default card only covers sessions with no resolvable identity.",
        "memory.settings.personaViewGateOff": "The master switch â€œPersona (beta)â€ is off: the block below contains profile and rules only.",
        "memory.settings.personaViewRefresh": "Refresh preview",
        "memory.features.personaEnabled": "Persona (beta)",
        "memory.features.personaEnabled.hint": "Inject the persona card (Settings â†’ Personalization) into every turn. Off by default (beta); both this switch and the card's own toggle must be on.",
        "memory.features.personaStrictAddressing": "Strict persona addressing",
        "memory.features.personaStrictAddressing.hint": "On: when a session's identity has no persona card â€” or that card is switched off â€” no persona is injected, so the default card only covers sessions with no resolvable identity. Turn this on when the host runs a bot that brings its own identity (DS Bot and friends), otherwise two \"you are ...\" claims land in the same turn. Off (default): unresolved identities fall back to the default card, as before.",
        "memory.features.profileExtractEnabled": "Profile draft from memory",
        "memory.features.profileExtractEnabled.hint": "Adds the \"Draft from memory\" button to Settings â†’ Personalization â†’ profile: reads a batch of active memories, spends one model call, and returns an \"as the assistant sees them\" draft. Nothing is written until you press Apply, so your hand-written profile is never overwritten automatically. Off in the lightweight preset (an explicit choice still wins).",
        "memory.settings.rules": "Rules",
        "memory.settings.rulesHint": "Rules the agent must follow â€” add or remove anytime, effective next turn.",
        "memory.settings.ruleAdd": "Add Rule",
        "memory.settings.rulePlaceholder": "e.g. Always lead with a conclusion",
        "memory.settings.commands": "Custom Commands",
        "memory.settings.commandsHint": "Save prompts as slash commands and invoke them right from the composer.",
        "memory.settings.cmdName": "Name",
        "memory.settings.cmdDesc": "Description",
        "memory.settings.cmdInstruction": "Instruction",
        "memory.settings.cmdAdd": "Add Command",
        "memory.settings.cmdDelete": "Delete",
        "memory.settings.empty": "Nothing yet",
        "memory.panel.semantic": "Semantic",
        "memory.sidebar.aria": "Open memory panel",
        "memory.view.label": "Memory",
        "memory.overlay.close": "Close",
        "memory.explorer.tabMemory": "Memories",
        "memory.explorer.tabEntities": "Entities",
        "memory.explorer.tabSettings": "Settings",
        "memory.explorer.tabStatus": "Status",
        "memory.explorer.tabAmadeus": "Amadeus Enhancements",
        "memory.am.enhancementsIntro": "Amadeus-only settings for Scene isolation, retrieval preferences, persona compatibility, and backups. In strict Scene mode, open the full memory explorer to view the authorized graph by Scene.",
        "memory.entities.count": "{n} entities",
        "memory.entities.loadMore": "Load more entities",
        "memory.entities.pick": "Select an entity to see its attributes and relations",
        "memory.entities.noMatch": "No entities match that search â€” try another word",
        "memory.entities.none": "No entities yet â€” turn on entity extraction and people / projects / concepts will accumulate here",
        "memory.entities.restart": "Entity extraction is on, but this runtime has not loaded it yet; reload the plugin to start extracting",
        "memory.entities.restartOff": "Entity extraction is off, but this runtime is still extracting; reload the plugin to stop it",
        "memory.entities.pending": "Entity extraction is runningâ€¦",
        "memory.entities.emptyEnabled": "Entity extraction is on and there are no entities yet; new memories will add people / projects / concepts",
        "memory.entities.failed": "The last entity extraction failed; new memories will still be attempted",
        "memory.entities.failedParse": "The last entity extraction failed: the model response could not be parsed; new memories will still be attempted",
        "memory.entities.forbidden": "You do not have permission to read the entity directory; check the current identity or Scene grants",
        "memory.entities.network": "Network error â€” the entity directory could not be loaded",
        "memory.entities.httpError": "Could not load the entity directory (the service returned an error)",
        "memory.entities.refresh": "Refresh",
        "memory.entities.attrs": "Attributes",
        "memory.entities.relations": "Relations",
        "memory.entities.mentions": "{n} mentions",
        "memory.entities.lastSeen": "Last seen",
        "memory.entity.person": "People",
        "memory.entity.project": "Projects",
        "memory.entity.concept": "Concepts",
        "memory.entity.technology": "Technologies",
        "memory.entity.organization": "Organizations",
        "memory.entity.other": "Others",
        "memory.explorer.search": "Search title or contentâ€¦",
        "memory.explorer.searchTitle": "Semantic Search",
        "memory.explorer.types": "Types",
        "memory.explorer.timeline": "Timeline",
        "memory.explorer.detail": "Details",
        "memory.explorer.emptyDetail": "Select a memory in the timeline to read it",
        "memory.explorer.copy": "Copy content",
        "memory.explorer.copied": "Copied",
        "memory.explorer.refresh": "Refresh",
        "memory.explorer.loadMore": "Load more",
        "memory.explorer.count": "{n} items",
        "memory.explorer.empty": "No memories yet",
        "memory.explorer.source": "Source",
        "memory.explorer.created": "Created",
        "memory.explorer.updated": "Updated",
        "memory.explorer.tags": "Tags",
        "memory.explorer.preference": "Preference weight",
        "memory.explorer.importance": "Importance",
        "memory.explorer.heat": "Heat",
        "memory.explorer.heatSort": "By heat",
        "memory.explorer.heatSortHint": "Sort loaded items by heat, in-page (not global; the month tree keeps chronological order)",
        "memory.explorer.filterDeposited": "Deposited",
        "memory.explorer.filterDepositedHint": "Only memories autoDream consolidated or updated",
        "memory.explorer.filterArchived": "Archived",
        "memory.explorer.filterArchivedHint": "Only archived memories (excluded from the default list)",
        "memory.explorer.topK": "Results limit",
        "memory.explorer.topKOption": "Return {n}",
        "memory.card.open": "Open full text in the memory library",
        "memory.time.now": "just now",
        "memory.time.seconds": "{n}s ago",
        "memory.time.minutes": "{n}m ago",
        "memory.time.hours": "{n}h ago",
        "memory.time.days": "{n}d ago",
        "memory.graph.title": "Memory Graph",
        "memory.graph.aria": "Memory graph",
        "memory.graph.placeholder": "Type an entity name to see its networkâ€¦",
        "memory.graph.depth": "hops",
        "memory.graph.empty": "The graph is waiting for data: entities and relations accumulate as memories are extracted",
        "memory.graph.notFound": "Entity not found",
        "memory.graph.related": "Related memories",
        "memory.graph.relation": "Relation",
        "memory.graph.sourceMemory": "View source memory",
        "memory.graph.sourceLoading": "Loading source memoryâ€¦",
        "memory.graph.sourceDenied": "You do not have access to this source memory.",
        "memory.graph.sourceMissing": "This source memory no longer exists.",
        "memory.graph.sourceError": "Could not load source memory. Try again later.",
        "memory.graph.hint": "Drag nodes to rearrange Â· drag the background to pan Â· scroll to zoom",
        "memory.graph.resetView": "Reset view",
        "memory.graph.summary": "Entity graph: {entity} with {nodes} nodes and {edges} edges",
        "memory.graph.viewInGraph": "Open in entity explorer",
        "memory.graph.loading": "Loadingâ€¦",
        "memory.graph.distance": "{n} hop(s) from root",
        "memory.settings.vectorTitle": "Vector Search",
        "memory.settings.vectorHint": "Match by meaning, not just wording â€” connect any OpenAI-compatible embeddings API.",
        "memory.settings.vectorEnabled": "Enable vector search",
        "memory.settings.vectorBaseUrl": "Base URL",
        "memory.settings.vectorApiKey": "API Key",
        "memory.settings.vectorModel": "Model",
        "memory.settings.vectorSave": "Save Config",
        "memory.settings.vectorSaved": "Config saved",
        "memory.settings.vectorReindex": "Reindex",
        "memory.settings.vectorReindexing": "Indexingâ€¦",
        "memory.settings.vectorReindexDone": "Indexed {n} items",
        "memory.settings.apiTokenTitle": "API Token (optional)",
        "memory.settings.apiTokenHint": "This field only stores the token in this browser (localStorage) for the panel requests. The server-side lock is the plugin\u0027s apiToken config â€” set both to the same value; this field alone locks nothing.",
        "memory.settings.apiTokenPlaceholder": "Must match the plugin\u0027s apiToken",
        "memory.settings.apiTokenSave": "Save Token",
        "memory.settings.apiTokenSaved": "Token saved",
        "memory.settings.feedback.title": "Feedback",
        "memory.settings.feedback.desc": "Something off? Tell us directly, or check if someone hit it first:",
        "memory.settings.feedback.newIssue": "Report on GitHub",
        "memory.settings.feedback.newIssue.sub": "Plugin version & environment prefilled",
        "memory.settings.feedback.email": "Email us",
        "memory.settings.feedback.email.sub": "work@modusensus.space",
        "memory.settings.feedback.browse": "Browse known issues",
        "memory.settings.feedback.browse.sub": "Check if it's already reported",
        "memory.settings.feedback.hint": "Search for an existing issue first â€” it saves a duplicate.",
        "memory.settings.update.check": "Check for updates",
        "memory.settings.update.latest": "Up to date âœ“",
        "memory.settings.update.ahead": "Newer than the registry (local build)",
        "memory.settings.update.error": "Check failed: try again later",
        "memory.settings.version.outdated": "New version {v} available (running {c})",
        "memory.settings.version.outdatedHint": "If the plugin was installed with a pinned version, regular upgrades never cross minor/major lines â€” reinstall or pass --latest. A fresh npm release may take about a day to appear in the market.",
        "memory.settings.star": "Star the project",
        "memory.settings.star.sub": "If it serves you well, cheer the author on (â—'â—¡'â—)",
        "memory.settings.mode.title": "Runtime mode",
        "memory.settings.mode.desc": "Light mode keeps the core loop only: memory read/write, auto-injection and hot memory â€” consolidation, entity extraction and semantic search are all off. For modest machines or when you just want preferences remembered. Standard mode enables everything.",
        "memory.settings.mode.light": "Light",
        "memory.settings.mode.standard": "Standard",
        "memory.settings.mode.savedHint": "Saved. Takes effect after restarting DSH",
        "memory.settings.mode.offList": "Off: consolidation (autoDream) Â· entity extraction Â· semantic search",
        "memory.settings.extapi.title": "External API",
        "memory.settings.extapi.desc": "Opens a local API so other tools (plugins, CLIs, desktop apps) can also read and write this memory store; binds to localhost only by default. Changes take effect after restarting DSH.",
        "memory.settings.extapi.enabled": "Enable",
        "memory.settings.extapi.disabled": "Disable",
        "memory.settings.extapi.address": "Address",
        "memory.settings.extapi.port": "Port",
        "memory.settings.extapi.token": "Token",
        "memory.settings.extapi.copy": "Copy",
        "memory.settings.extapi.copied": "Copied",
        "memory.settings.serve.title": "Standalone service: dsh-mneme-serve",
        "memory.settings.serve.desc": "Reach the same memory library over HTTP without starting DSH (no LLM data plane).",
        "memory.settings.serve.cmd": "npx -p @fg-lab/amadeus-memory dsh-mneme-serve --memory-dir <memory-dir> --port <port>",
        "memory.settings.serve.copy": "Copy",
        "memory.settings.serve.copied": "Copied",
        "memory.settings.serve.hint": "Shares routes and auth with the external API: when pointing at the same memory directory, callers should use the panel's token (expected to work, not guaranteed). Both default to the same port â€” enable one or offset with --port.",
        "memory.settings.mcp.title": "MCP server: dsh-mneme-mcp",
        "memory.settings.mcp.desc": "stdio MCP server: any MCP client (Claude Code, Cursor, â€¦) mounting it gets the same six memory tools as inside DSH.",
        "memory.settings.mcp.snippet": "{ \"mcpServers\": { \"dsh-mneme\": { \"command\": \"dsh-mneme-mcp\", \"env\": { \"DSH_MNEME_TOKEN\": \"<token from External API above>\" } } } }",
        "memory.settings.mcp.copy": "Copy",
        "memory.settings.mcp.copied": "Copied",
        "memory.settings.mcp.hint": "Data plane is the external API (default 127.0.0.1:8790, Bearer) â€” the token is the one above; override with DSH_MNEME_URL / DSH_MNEME_TOKEN env vars or ~/.dsh-mneme/cli.json. The command must be on PATH (installed with @fg-lab/amadeus-memory).",
        "memory.settings.extapi.savedHint": "Saved. Takes effect after restarting DSH",
        "memory.settings.extapi.invalidPort": "Port must be a number between 1 and 65535",
        "memory.tab.rejected_solution": "Rejected solutions",
        "memory.tab.pitfall": "Pitfalls",
        "memory.tab.constraint": "Constraints",
        "memory.tab.document": "Documents",
        "memory.features.title": "Features",
        "memory.features.desc": "Choose what the plugin does in the background. The Common switches at the top are all you need to start; everything else lives under All settings. Changes are saved immediately and take effect after restarting DSH.",
        // Issue #427: groups used to be implementation slices (the architecture
        // diagram's partitions). What a person actually asks is four questions â€”
        // what gets remembered, when it gets written, how it comes back, and
        // whether sessions bleed into each other. Terminology stays in the hints.
        // group.basic is the first-screen tier; the scope group sits there too so
        // "can other sessions see this?" is answerable without opening anything.
        "memory.features.group.basic": "Common (start here)",
        "memory.features.group.core": "What gets remembered",
        "memory.features.group.mo": "Its workflow (M.O.)",
        "memory.features.group.enhance": "When it gets written",
        "memory.features.group.dream": "How it comes back",
        "memory.features.group.scope": "Between sessions",
        "memory.features.group.scene": "Scene, recent and core memories",
        "memory.features.sceneGuide": "QQ memory requires both switches below: scene isolation records trusted scene provenance, and strict QQ mode is the only mode that lets a QQ Session use long-term memory. Either switch alone denies QQ model access. Before upgrading an old library, stop writes and copy the whole old memoryDir into a new isolated directory; verify the new instance reads it before retiring the old one. Do not reuse the old path in place or run two instances against one memory.db.",
        "memory.features.sceneIsolationEnabled": "Isolate memories by QQ scene",
        "memory.features.sceneIsolationEnabled.hint": "On: record and filter trusted Host scene provenance. This alone is not enough for a QQ Session to use long-term memory; strict QQ scene mode must also be on",
        "memory.features.sceneStrictQQ": "Strict QQ scene mode",
        "memory.features.sceneStrictQQ.hint": "On: cross-scene memory, graph and ordinary HTTP content routes are denied; autoDream and Sleep pause, while trusted QQ Session summarization may still run. Must be combined with scene isolation. Off by default",
        "memory.features.recentContextEnabled": "Recent context (10 min)",
        "memory.features.recentContextEnabled.hint": "On: keep a bounded in-memory recent-event buffer, injected only in the authorized direction. No embedding/LLM and no long-term write",
        "memory.features.coreMemoryEnabled": "Core memory (protected)",
        "memory.features.coreMemoryEnabled.hint": "On: an authorized admin-private session can save protected core memories. Protection is independent of importance; maintenance cannot delete or overwrite them",
        "memory.features.group.advanced": "Advanced",
        "memory.features.allToggle": "All settings",
        "memory.features.advancedToggle": "7 rarer switches",
        "memory.features.restartHint": "Takes effect after restarting DSH",
        "memory.features.loadFailed": "Failed to load",
        "memory.features.saveFailed": "Failed to save",
        "memory.features.autoInject": "Carry old memories into every turn",
        "memory.features.autoInject.hint": "On: relevant memories are handed to the agent every turn, so it remembers without being asked. Off: the agent has to call the search tool itself",
        "memory.features.injectGuidanceEnabled": "Also teach the agent how to use memory",
        "memory.features.injectGuidanceEnabled.hint": "On: the memory tools' description says when to search and when to write. Off: the tools ship without guidance",
        "memory.features.continuityRescueEnabled": "Snapshot before a long chat gets compacted",
        "memory.features.continuityRescueEnabled.hint": "On: a snapshot of what's in progress / next steps / open questions is stored before compaction, so key context survives it. Off: compaction can crush it",
        "memory.features.parentOff": "Inactive while the switch above is off",
        "memory.features.tagDefault": "default",
        "memory.features.tagDefault.hint": "This one is at its factory default â€” you have not changed it",
        "memory.features.tagChanged": "changed",
        "memory.features.tagChanged.hint": "You changed this one; it no longer uses the default",
        "memory.features.tagPending": "restart pending",
        "memory.features.tagPending.hint": "Saved, but not yet in effect for this session â€” restart DSH (or toggle this plugin off and on in the plugin manager) to apply it",
        "memory.features.pendingRestartNotice": "Some changes are not in effect yet: switches marked \"restart pending\" apply only after you restart DSH (toggling this plugin off and on in the plugin manager works too).",
        "memory.features.autoSummarize": "Turn conversations into memory automatically",
        "memory.features.autoSummarize.hint": "On: memory entries are distilled when a conversation ends (autoSummarize). Off: memory only exists if you save it, or the agent decides to",
        "memory.features.hotMemoryEnabled": "Carry the last few turns verbatim",
        "memory.features.hotMemoryEnabled.hint": "On: the recent turns ride along with each injection, so the agent sees what was just said. Off: only distilled memories travel. Those turns are never written to long-term memory (hot memory, on by default)",
        "memory.features.injectTimePrefix": "Tell it today's date at session start",
        "memory.features.injectTimePrefix.hint": "On: the first turn of each new session gets the date and weekday once, so \"today\" and \"last week\" land reliably. Off: no time in the injection (time prefix, off by default)",
        "memory.features.entityExtractionEnabled": "Also pull out people, projects and concepts",
        "memory.features.entityExtractionEnabled.hint": "On: each new memory yields people / projects / concepts, so the relation graph grows by itself and recall can key on who. Off: memories stay whole, no relations (entity extraction, off by default)",
        "memory.features.memoryPreferenceEnabled": "Preference weights in recall",
        "memory.features.memoryPreferenceEnabled.hint": "On: tag and canonical-entity weights join recall as a mild 0.6â€“1.6 multiplier after a relevance floor; only ordering changes, automatic importance is untouched. Off (default): retrieval is unchanged.",
        "memory.features.trustedIntakeEnabled": "Trusted experience intake",
        "memory.features.trustedIntakeEnabled.hint": "On: allow Life to POST /intake with source, participation and completion status for shared experiences; requires a server apiToken and is off by default. The model never infers \"I did it\" from casual chat.",
        "memory.features.entityExtractionProvider": "Entity extraction provider",
        "memory.features.entityExtractionModel": "Entity extraction model",
        "memory.features.entityExtractionReasoning": "Entity extraction reasoning",
        "memory.features.entityExtractionReasoning.none": "Follow default",
        "memory.features.entityExtractionReasoning.low": "Low",
        "memory.features.entityExtractionReasoning.medium": "Medium",
        "memory.features.entityExtractionReasoning.high": "High",
        "memory.features.summarizeReasoningEffort": "Distill reasoning effort",
        "memory.features.summarizeReasoningEffort.off": "No reasoning",
        "memory.features.summarizeReasoningEffort.none": "Follow default",
        "memory.features.summarizeReasoningEffort.low": "Low",
        "memory.features.summarizeReasoningEffort.medium": "Medium",
        "memory.features.summarizeReasoningEffort.high": "High",
        "memory.features.summarizeReasoningEffort.hint": "For thinking models, prefer Low or No reasoning so thinking cannot fill the output budget and break summaries",
        "memory.features.entityExtractionModelHint": "Provider / model empty = follow the main conversation model; reasoning \"Follow default\" = provider default",
        "memory.features.codingRetrospect": "Remember how the code was written too",
        "memory.features.codingRetrospect.hint": "On: the whole coding session (errors and tool calls included) is reviewed, yielding pitfalls, constraints and rejected solutions. Off: only conversation content is distilled (coding retrospection, off by default)",
        "memory.features.rerankEnabled": "Rerank search results once more",
        "memory.features.rerankEnabled.hint": "On: a local rerank model re-scores recalled candidates â€” more precise, slower. Off: the search-time order stands (reranking, off by default)",
        "memory.features.heatEnabled": "The longer unused, the lower it ranks",
        "memory.features.heatEnabled.hint": "On: memories cool down like a forgetting curve â€” long-unused ones rank later and stop taking injection slots. Off: relevance order always (heat decay, off by default)",
        "memory.features.documentMemoryEnabled": "Store long documents as a summary card",
        "memory.features.documentMemoryEnabled.hint": "On: long agent-authored documents live in memory as a \"summary card\"; the full text stays agent-owned and is read on demand. Off: the whole document travels into context (document memory, off by default)",
        // --- v0.9.0 M.O. / Modus Operandi (beta) ---
        "memory.actions.beta": "Beta",
        "memory.actions.notice": "Extracted steps are candidates: they may be wrong, outdated, or refuted.",
        "memory.actions.title": "Modus Operandi",
        "memory.actions.open": "Open Modus Operandi",
        "memory.actions.viewFull": "Full view",
        "memory.actions.openPane": "Open full view in sidebar",
        "memory.actions.announce.open": "Modus Operandi panel opened",
        "memory.actions.announce.close": "Modus Operandi panel closed",
        "memory.actions.close": "Close",
        "memory.actions.candidates": "{n} candidates",
        "memory.actions.runs": "Recent runs",
        "memory.actions.runOf": "Run {n}",
        "memory.actions.run.ok": "ok",
        "memory.actions.run.failed": "failed",
        "memory.actions.run.refuted": "refuted",
        "memory.actions.state.candidate": "candidate",
        "memory.actions.state.trusted": "trusted",
        "memory.actions.state.stale": "stale",
        "memory.actions.state.refuted": "refuted",
        "memory.actions.gate.has": "has counterfactual",
        "memory.actions.gate.none": "no gate yet",
        "memory.actions.gate.tag": "GATE",
        "memory.actions.who.main": "main",
        "memory.actions.who.human": "human",
        "memory.actions.who.ci": "CI",
        "memory.actions.ov.done": "Done when",
        "memory.actions.ov.trigger": "Triggered by",
        "memory.actions.band.count": "{n} steps",
        "memory.actions.legend.states": "States",
        "memory.actions.detail.situation": "Situation",
        "memory.actions.detail.action": "Action",
        "memory.actions.detail.why": "Why",
        "memory.actions.detail.cf": "Counterfactual",
        "memory.actions.detail.noCf": "No counterfactual recorded yet",
        "memory.actions.detail.source": "Source memories",
        "memory.actions.credit": "Reuse",
        "memory.actions.creditValue": "{n} uses Â· last {d}d ago",
        "memory.actions.dep": "depends on",
        "memory.actions.zoom.value": "Zoom {n}%",
        "memory.actions.zoom.in": "Zoom in",
        "memory.actions.zoom.out": "Zoom out",
        "memory.actions.zoom.fit": "Fit width",
        "memory.actions.zoom.hint": "Ctrl/âŒ˜ + wheel also zooms",
        "memory.actions.list.heading": "Workflows in this project",
        "memory.actions.list.count": "{n} workflow(s)",
        "memory.actions.list.meta": "{steps} steps Â· {gates} gates Â· counterfactual {cf}/{steps}",
        "memory.actions.scope.project": "project {name}",
        "memory.actions.scope.global": "global",
        "memory.actions.scope.none": "project unknown",
        "memory.actions.broken": "Some files could not be read:",
        "memory.actions.empty.title": "No workflows in this project yet",
        "memory.actions.empty.body": "A workflow lives in the project, under .mneme/pipelines/ â€” it travels with the repository: committable, reviewable, readable by CI. A practice becomes a node type on its second reuse; the first run is just an instance. Once the same path has been walked twice it gets distilled out of the session and lands in that directory.",
        "memory.actions.distill.action": "Distill now",
        "memory.actions.distill.busy": "Reading sessionsâ€¦",
        "memory.actions.distill.hint": "Scan this project's own session logs and mine repeated actions into proposals. Writes proposals only â€” no drafts, no repository changes.",
        "memory.actions.distill.noProject": "The session's working directory is unknown, so there is no project to scan",
        "memory.actions.distill.saved": "{n} proposal(s) written ({m} candidate(s) mined this pass)",
        "memory.actions.distill.none": "No new repeated action this pass",
        "memory.actions.distill.noSessions": "This project has no session logs of its own yet â€” come back after a few turns",
        "memory.actions.distill.unreadable": "The session logs could not be read (an environment problem, not an empty result)",
        "memory.actions.distill.failed": "This pass did not finish; see the plugin log",
        "memory.actions.noRuns": "No runs recorded for this workflow yet, so every step is still a candidate.",
        "memory.actions.settle.title": "This run",
        "memory.actions.settle.line": "\"{title}\"",
        "memory.actions.settle.used": "Reused {n} steps this run (checked = actually used)",
        "memory.actions.settle.refutedWarn": "This path contains refuted steps; take the result with caution",
        "memory.features.actionPipelineEnabled": "M.O. (beta)",
        "memory.features.actionPipelineEnabled.hint": "Read-only view: the ways of working that actually got walked through in real sessions, drawn as a graph â€” session-header icon, full sidebar view, and a per-run settlement card. Viewing is not writing: distillation has its own switch below, and run accounting has its own (/mo-run). Modus Operandi. Takes effect after restarting DSH",
        "memory.features.actionNudgeEnabled": "Auto-distill workflows (beta)",
        "memory.features.actionNudgeEnabled.hint": "On: after each turn, look at this project's own session logs and mine the actions it keeps repeating into a proposal in the memory store â€” it still needs your sign-off before becoming a workflow. Drafts only; never auto-activates; never writes files into the repo. Hooks a hot path and decompresses logs, so light mode forces it off. Takes effect after restarting DSH",
        "memory.features.resilientModelDownload": "Model downloads resume after interruption",
        "memory.features.resilientModelDownload.hint": "On: downloads continue from where they stopped and retry automatically. Off: an interrupted download starts over (resumable downloads, on by default)",
        "memory.features.searchSemanticDedup": "Keep one entry when search hits near-duplicates",
        "memory.features.searchSemanticDedup.hint": "On: near-duplicate entries merge into one, saving injection slots. Off: duplicates all show up (semantic dedup, off by default)",
        "memory.features.autoDream": "Tidy memories in the background (merge Â· dedupe)",
        "memory.features.autoDream.hint": "On: fragmented memories are merged and settled in the background (autoDream). Off: memory only accumulates, so it gets messier the longer you use it",
        "memory.features.sleepModeEnabled": "It tidies memories while you are away",
        "memory.features.sleepModeEnabled.hint": "On: layered compaction and tidying happen during idle periods. Off: only consolidation you trigger manually (sleep mode, off by default)",
        // #427 suggestion 5: hybridInject / selectiveInjectEnabled /
        // adaptiveThresholdEnabled are three dials of one question â€” what comes
        // back. Adjacent placement plus a hint that names the other two.
        "memory.features.hybridInject": "Search by keywords and meaning together",
        "memory.features.hybridInject.hint": "On: both channels each fetch a batch and merge â€” broader recall. Off: one channel only. Three dials exist for \"what comes back\" (hybrid / selective / adaptive threshold); one is enough (hybrid injection, on by default)",
        "memory.features.selectiveInjectEnabled": "Only carry memories that truly matter",
        "memory.features.selectiveInjectEnabled.hint": "On: relevance is filtered before injecting â€” cleaner context. Off: more comes along, and noisier. One of the three dials (selective injection, on by default)",
        "memory.features.adaptiveThresholdEnabled": "Tighten or loosen by retrieval quality",
        "memory.features.adaptiveThresholdEnabled.hint": "On: a poor-recall day loosens the floor, a good one tightens it. Off: the floor is fixed. One of the three dials (adaptive threshold, on by default)",
        "memory.features.reflectionUpdateEnabled": "Let tidying revise existing memories",
        "memory.features.reflectionUpdateEnabled.hint": "On: consolidation may rewrite and merge existing entries, not only add. Off: old memories are never auto-edited (reflective update, on by default)",
        "memory.features.distill": "Distillation & rate limiting",
        "memory.features.distillRateLimitIntervalMs": "Distill spacing (ms)",
        "memory.features.distillRateLimitRetries": "429 retries",
        "memory.features.distillRateLimitBaseDelayMs": "Backoff base delay (ms)",
        "memory.features.distillMaxChars": "Transcript cap (chars)",
        "memory.features.distillRecords.enabled": "Keep distilled transcripts",
        "memory.features.distillRecords.enabled.hint": "Also store the public parts of the distilled window, with a provenance link per memory; private reasoning and tool output are never stored. Off writes nothing and skips collection entirely",
        "memory.features.distillRecords.retentionDays": "Transcript retention (days)",
        "memory.features.distillRecords.retentionDays.hint": "1â€“3650 days; startup pruning only. To make reclaim use the same window, pass the same value via --older-than",
        "memory.features.codingBoostFactor": "Coding boost factor",
        "memory.features.memoryQualityFilter.enabled": "Tuck low-value memories away automatically",
        "memory.features.memoryQualityFilter.enabled.hint": "On: low-value entries are archived automatically and injection downranks by quality. Off: everything stays, noise included (memory quality filter, on by default)",
        "memory.features.llmAudit.enabled": "Keep tabs on background model usage",
        "memory.features.llmAudit.enabled.hint": "On: background consolidation / summary calls and token usage are all on record. Off: there is no way to check what the background spent (call audit, on by default)",
        // #254 â€” two layers: enabled runs the check (audit only), enforce actually
        // blocks. The hints must keep that difference explicit.
        "memory.features.writeAdmission.enabled": "Judge blank / noise writes before storing (audit only)",
        "memory.features.writeAdmission.enabled.hint": "On: blank / noise writes are flagged with an audit row but still stored. Off: nothing is judged. To actually block, see the next switch (write admission checks, off by default)",
        "memory.features.writeAdmission.enforce": "Really reject useless writes",
        "memory.features.writeAdmission.enforce.hint": "On: flagged writes are rejected outright. Off: audit row only, stored anyway. Needs the checks switch above (write admission enforcement, off by default)",
        "memory.features.preInjectGate.enabled": "Screen out \"just my opinion\" memories before injection (audit only)",
        "memory.features.preInjectGate.enabled.hint": "On: opinion / stance memories are judged before injection and audited, so you can watch the distribution first. Off: injected as usual (pre-inject gate, off by default)",
        "memory.features.preInjectGate.enforce": "Really drop flagged candidates at injection",
        "memory.features.preInjectGate.enforce.hint": "On: flagged candidates are dropped at injection time. Off: audit row only, injected anyway. Needs the gate switch above (pre-inject gate enforcement, off by default)",
        // #164 A2: its own gate for the secret / PII rules (separate from the
        // blank/noise pair above), and it runs inside the write admission checks
        // above, so with those off it never runs. Hits are audited only;
        // enforcement stays with the key above.
        "memory.features.sensitiveScanEnabled": "Scan writes for credentials and personal data",
        "memory.features.sensitiveScanEnabled.hint": "On: secret / PII rules run inside the write admission checks; hits are audited only â€” to block, also enable enforcement. Nothing runs while the checks switch is off (secret / PII scan, off by default)",
        "memory.features.bm25SearchEnabled": "Also search by exact keywords",
        "memory.features.bm25SearchEnabled.hint": "On: exact-term scoring joins in, so proper nouns, error codes and paths hit reliably â€” a complement to meaning-based search. Off: semantic similarity only (BM25 keyword search, on by default)",
        "memory.features.conflictFreezeEnabled": "Freeze contradictory memories first",
        "memory.features.conflictFreezeEnabled.hint": "On: contradictions found while tidying are frozen for your confirmation instead of both staying live. Off: both stay in use (conflict freezing, off by default)",
        "memory.features.scopeEnabled": "Record which session each memory came from",
        "memory.features.scopeEnabled.hint": "On: every new memory is tagged with the agent / workspace it came from â€” that tag decides whether other sessions see it. Off: new memories carry no origin and all sessions share one pool (scope tagging, off by default)",
        "memory.features.strictScope": "Memories others marked private stay invisible to me",
        "memory.features.strictScope.hint": "On: memories explicitly made private by other sessions are fully invisible. Off: they stay visible but rank lower. For true isolation use a memory's sensitivity field. Needs the tagging switch above (strict isolation, off by default)",
        "memory.features.trustEpistemicWeighting": "Rank by source credibility",
        "memory.features.trustEpistemicWeighting.hint": "On: more credible sources rank higher. Off: everything counts the same (credibility weighting, experimental, off by default)",
        "memory.features.reflectionFailureTracking": "Keep failed tidying cases on record",
        "memory.features.reflectionFailureTracking.hint": "On: failure causes and cases are stored for diagnosis and improvement. Off: failures leave no record (failure tracking, on by default)",
        "memory.features.embedRoute": "Semantic search route",
        "memory.features.embedProvider": "Embedding provider",
        "memory.features.embedProvider.openai": "OpenAI-compatible API",
        "memory.features.embedProvider.local": "Local model (offline)",
        "memory.features.embedProvider.ollama": "Ollama",
        "memory.features.embedProvider.openai.hint": "Endpoint / key / model live in the Vector Search card below",
        "memory.features.embedProvider.local.hint": "First use downloads the model; fully offline afterwards",
        "memory.features.embedProvider.ollama.hint": "Requires a local Ollama server",
        "memory.features.localEmbedModel": "Local embedding model",
        "memory.features.ollamaBaseUrl": "Ollama server URL",
        "memory.features.ollamaModel": "Ollama model",
        "memory.features.dreamProvider": "Consolidation provider",
        "memory.features.dreamModel": "Consolidation model",
        "memory.features.dreamModelHint": "Leave empty to follow the main conversation model; only affects autoDream consolidation",
        "memory.features.dreamPeakHours": "Peak hours (no dreaming)",
        "memory.features.dreamPeakHours.hint": "Busy hours for the machine; consolidation avoids them and catches up afterwards. Syntax: 09:00-18:00, several windows comma-separated, weekday prefix allowed (mon-fri 08:00-12:00), midnight-crossing allowed; empty = no limit",
        "memory.features.summarizePeakHours": "Peak hours (no distillation)",
        "memory.features.summarizePeakHours.hint": "Same syntax as the consolidation side above; distillation avoids these windows and accumulates the material for one run off-peak",
        "memory.features.sleepProvider": "Sleep provider",
        "memory.features.sleepModel": "Sleep model",
        "memory.features.sleepModelHint": "Leave empty to reuse the consolidation model; a non-reasoning model is recommended",
        // Issue #478: max_tokens budget keys. Hint states both the scope (single-run
        // output budget) and the backend auto-downgrade on provider cap rejection.
        "memory.features.dreamMaxTokens": "Consolidation output cap (max_tokens)",
        "memory.features.dreamMaxTokens.hint": "Max tokens generated per consolidation run, 256â€“131072. When the default 131072 exceeds a provider's hard limit, the backend retries with the cap from the error",
        "memory.features.sleepMaxTokens": "Sleep output cap (max_tokens)",
        "memory.features.sleepMaxTokens.hint": "Single-run output budget for sleep conflict/mode calls, 256â€“131072; over-cap values are downgraded automatically",
        "memory.features.routeFollowDefault": "Follow default route",
        "memory.features.modelTest": "Test connectivity",
        "memory.features.modelTesting": "Testingâ€¦",
        "memory.features.modelTestOk": "Connected",
        "memory.features.modelTestFail": "Test failed",
        "memory.features.modelTestHint": "Fires one minimal consolidation call to verify provider/model connectivity and effort support",
        "memory.features.modelTestDowngraded": "Effort not accepted by this model; connected without it (same as a real consolidation)",
        "memory.features.routeStaleMark": " (not in list)",
        "memory.features.routeStaleHint": "This value is not in the currently available list (often a leftover from switching providers): reselect, or run a connectivity test to verify now",
        "memory.explorer.viewCards": "Cards",
        "memory.explorer.viewTimeline": "Timeline",
        "memory.explorer.viewAria": "Switch view",
        "memory.explorer.dateLabel": "Time",
        "memory.explorer.date.all": "All time",
        "memory.explorer.date.7d": "Last 7 days",
        "memory.explorer.date.30d": "Last 30 days",
        "memory.explorer.date.90d": "Last 90 days",
        "memory.explorer.more": "More actions",
        "memory.explorer.exportJson": "Export JSON",
        "memory.explorer.exportMarkdown": "Export Markdown",
        "memory.explorer.importMd": "Import Markdown mirrorâ€¦",
        "memory.explorer.importTitle": "Import Markdown mirror",
        "memory.explorer.importHint": "Pick a Markdown mirror file; its manual edits are parsed and merged into the store.",
        "memory.explorer.importType": "Mirror type",
        "memory.explorer.importPick": "Choose fileâ€¦",
        "memory.explorer.importConfirm": "Import",
        "memory.explorer.importCancel": "Cancel",
        "memory.explorer.importing": "Importingâ€¦",
        "memory.explorer.imported": "Merged {n} edits",
        "memory.explorer.importFailed": "Import failed",
        "memory.explorer.importNoFile": "Choose a file first",
        "memory.explorer.newMemory": "New memoryâ€¦",
        "memory.explorer.newTitle": "New memory",
        "memory.explorer.newHint": "Write one memory by hand. Same type + same title merges into the existing entry instead of minting a second row.",
        "memory.explorer.newType": "Type",
        "memory.explorer.newTitlePlaceholder": "Short title; also the dedupe key",
        "memory.explorer.newContentPlaceholder": "Body",
        "memory.explorer.newTagsPlaceholder": "Tags, comma separated (optional)",
        "memory.explorer.newConfirm": "Create",
        "memory.explorer.newSaving": "Savingâ€¦",
        "memory.explorer.newCreated": "Created",
        "memory.explorer.newMerged": "Merged into the existing entry with that title",
        "memory.explorer.newFailed": "Create failed",
        "memory.explorer.newNoTitle": "Title is required",
        "memory.explorer.newNoContent": "Body is required",
        "memory.explorer.exportFailed": "Export failed",
        "memory.explorer.conflictBadge": "Conflict",
        "memory.explorer.archivedBadge": "Archived",
        "memory.explorer.scopeBadge": "Scoped",
        "memory.explorer.detail.agentScope": "Agent scope",
        "memory.explorer.detail.workspaceScope": "Workspace scope",
        "memory.explorer.detail.scopeGlobal": "Global (visible to all sessions)",
        "memory.explorer.detail.scopeSourceAuto": "auto",
        "memory.explorer.detail.scopeSourceExplicit": "explicit",
        "memory.explorer.detail.scopeEditHint": "Empty = global; or enter a specific label to narrow the scope",
        "memory.explorer.detail.scopeWidenConfirm": "Widen visibility?",
        "memory.explorer.detail.scopeWidenHint": "Widening makes this memory visible to all sessions",
        "memory.explorer.detail.sensitivity": "Sensitivity",
        "memory.explorer.detail.occurred": "Occurred",
        "memory.explorer.detail.edit": "Edit",
        "memory.explorer.detail.save": "Save",
        "memory.explorer.detail.cancel": "Cancel",
        "memory.explorer.detail.archive": "Archive",
        "memory.explorer.detail.restore": "Restore",
        "memory.explorer.detail.restored": "Restored to the main list",
        "memory.explorer.detail.archived": "Archived",
        "memory.explorer.detail.archiveFailed": "Action failed",
        "memory.explorer.detail.saved": "Saved; mirrors re-rendered",
        "memory.explorer.detail.quality": "Quality",
        "memory.explorer.detail.entities": "Related entities",
        "memory.explorer.detail.entitiesEmpty": "Turn on entity extraction and related people / projects appear here",
        "memory.explorer.detail.closeAria": "Close details",
        "memory.explorer.detail.editTitle": "Title",
        "memory.explorer.detail.editContent": "Content",
        "memory.explorer.detail.editImportance": "Importance",
        "memory.explorer.detail.starLabel": "Set importance to {n} stars",
        "memory.status.dream": "Last consolidation",
        "memory.status.dreamNever": "Not yet run",
        "memory.status.conflicts": "Pending conflicts",
        "memory.status.conflictsHint": "Frozen contradictory memories awaiting confirmation",
        "memory.status.injectSuppressed": "Injection disabled by host minimal preset",
        "memory.status.injectSuppressedHint": "This session uses the minimal preset: memory injection / profile / hot memory never reach the model (by host design, not a plugin defect). Switch to standard mode, or set agent-presets.default: standard in ~/.dsh/settings.yaml. Interim: put profile and rules in AGENTS.md",
        "memory.status.injectPreview": "Injection preview",
        "memory.status.injectPreviewNone": "No preview yet â€” no injection has happened (new session or injection off)",
        "memory.status.injectPreview.chars": "Total",
        "memory.status.injectPreview.charsUnit": " chars",
        "memory.status.injectPreview.maxItems": "Max items",
        "memory.status.injectPreview.threshold": "Relevance floor",
        "memory.status.injectPreview.scope": "Session scope",
        "memory.status.injectPreview.query": "query \"{query}â€¦\"",
        "memory.status.injectPreview.hot": "hot memory",
        "memory.status.injectPreview.adaptiveOn": "adaptive budget",
        "memory.status.injectPreview.rotated": "rotation-suppressed",
        "memory.status.injectPreview.empty": "No cross-session memories injected this assembly (threshold or rotation filter)",
        "memory.status.conflictQueue.reason": "Reason",
        "memory.status.conflictQueue.sideA": "Side A",
        "memory.status.conflictQueue.sideB": "Side B",
        "memory.status.conflictQueue.keepA": "Keep A",
        "memory.status.conflictQueue.keepB": "Keep B",
        "memory.status.conflictQueue.markReviewed": "Mark reviewed only",
        "memory.status.conflictQueue.applyHint": "On confirm: a veto note is appended to the kept side and the other side is archived.",
        "memory.status.conflictQueue.missing": "(memory no longer exists)",
        "memory.status.conflictQueue.goto": "View pending conflict queue",
        "memory.status.conflictQueue.resolved": "Resolved: kept {name}",
        "memory.status.conflictQueue.refresh": "Refresh queue",
        "memory.status.conflictQueue.refreshed": "Conflict queue refreshed",
        "memory.status.conflictQueue.frozenBadge": "â¸ Frozen",
        "memory.status.conflictQueue.frozenTitle": "Frozen: excluded from injection and consolidation, awaiting your review",
        "memory.status.conflictQueue.similarity": "similarity",
        "memory.status.conflictQueue.diffTitle": "Differences highlighted: red = removed, green = added",
        "memory.status.conflictQueue.diffFallback": "The two texts differ substantially â€” compare the originals",
        "memory.status.conflictQueue.expand": "Expand full text",
        "memory.status.conflictQueue.collapse": "Collapse",
        "memory.status.conflictQueue.copySide": "Copy this side",
        "memory.status.conflictQueue.copiedSide": "Full text copied",
        "memory.status.conflictQueue.importance": "importance {n}",
        "memory.status.conflictQueue.chars": "{n} chars",
        "memory.status.conflictQueue.updated": "updated {time}",
        "memory.status.conflictQueue.created": "created {time}",
        "memory.status.conflictQueue.emptyTitle": "No pending conflicts",
        "memory.status.conflictQueue.emptyBody": "When consolidation finds two contradictory or highly similar memories, it freezes them here for your review instead of changing anything automatically. Neither side participates in injection until resolved.",
        "memory.status.conflictQueue.applyHintTitle": "On confirm: a veto note is appended to the kept side and the other side is archived",
        "memory.status.workbench": "Activity",
        "memory.status.dreamConsolidate": "Consolidation",
        "memory.status.summarize": "Summarization",
        "memory.status.tokens": "{n} tokens",
        "memory.status.deposited": "{n} memories deposited",
        "memory.status.failed": "failed",
        "memory.status.success": "success",
        "memory.status.skipped": "skipped",
        "memory.status.emptyFeed": "No background activity yet: memories are distilled after conversations",
        "memory.status.consolidated": "Deposited memories",
        "memory.status.consolidatedEmpty": "Memories deposited by autoDream / autoSummarize appear here",
        "memory.status.archivedMemories": "Archived memories",
        "memory.status.heatDistribution": "Heat distribution",
        "memory.status.heat.hot": "Hot (â‰¥66%)",
        "memory.status.heat.warm": "Warm (33â€“66%)",
        "memory.status.heat.cold": "Cooled (<33%)",
        "memory.status.heat.sample": "Sampled from the latest {sample}",
        "memory.status.recallStats": "Recall reuse",
        "memory.status.recall.zombie": "Zombie memories",
        "memory.status.recall.exempt": "exempt",
        "memory.status.recall.runs": "Receipts (30d)",
        "memory.status.recall.top": "Most recalled",
        "memory.status.recall.inject": "Injected",
        "memory.status.recall.archive": "Archived",
        "memory.status.recallInject": "{runs} turns Â· {count} items Â· {fill}% slots",
        "memory.status.recallArchive": "{total} rows Â· +{add}/day Â· {compress} compressible",
        "memory.status.viewAll": "View all",
        "memory.status.depositedCount": "Deposited memories ({n})",
        "memory.status.archivedCount": "Archived memories ({n})",
        "memory.status.archivedEmpty": "Nothing archived",
        "memory.status.restore": "Restore",
        "memory.settings.extapi.reveal": "Reveal",
        "memory.settings.extapi.hide": "Hide",
        "memory.settings.extapi.maskHint": "Token masked; Copy still copies the full value",
        "memory.explorer.delete": "Delete",
        "memory.explorer.confirmDelete": "Confirm delete?",
        "memory.explorer.cancel": "Cancel",
        "memory.explorer.deleted": "Deleted",
        "memory.explorer.deleteFailed": "Delete failed",
        "memory.status.memories": "Total memories",
        "memory.status.entities": "Entities",
        "memory.status.vector": "Vector index",
        "memory.status.vectorOff": "Disabled",
        "memory.status.vectorInit": "Initializing",
        "memory.status.vectorInitHint": "embedder unreachable, retrying",
        "memory.status.vectorRuntimeMissing": "Local inference runtime missing",
        "memory.status.vectorRuntimeHint": "Local inference runtime not ready ({status})",
        "memory.status.vectorRuntimeCost": "Local vectorization needs an extra local inference runtime (hundreds of MB unpacked). The button below first adopts an existing copy on this machine (hardlinked on the same volume, no extra disk) and otherwise fetches it from npm with per-file checksums. You can also just ask the agent, or run it yourself: node scripts/mneme-runtime.mjs status / adopt / verify (see docs/LOCAL_MODEL.md)",
        "memory.runtime.title": "Local inference runtime",
        "memory.runtime.available": "ready",
        "memory.runtime.missing": "not ready â€” only needed when you use local embedding (embedProvider: local)",
        "memory.runtime.restart": "Local embedding takes effect after restarting DSH",
        "memory.status.vectorRuntimeReady": "Runtime ready",
        "memory.status.vectorRuntimeReadyHint": "Local embedder is not initialized yet (the in-process embedder already failed while the runtime was missing): restart DSH if this persists.",
        "memory.status.vectorRuntimeFetch": "Fetch local runtime",
        "memory.status.vectorRuntimeFetchBusy": "Fetchingâ€¦ (tries adopt first, may download â€” thousands of files)",
        "memory.status.vectorRuntimeFetchAdopted": "Adopted the runtime already on this machine: {n} packages / {m} files ({mode}). **Restart DSH to activate local embedding.**",
        "memory.status.vectorRuntimeFetchDownloaded": "Download complete: {n} packages / {m} files. **Restart DSH to activate local embedding** (fetching does not revive the embedder already running in this process).",
        "memory.status.vectorRuntimeFetchFailed": "Fetch failed: {reason}",
        "memory.status.vectorIndexed": "Indexed {n} / {m} items",
      "memory.status.vectorUnconfigured": "Not configured",
      "memory.status.vectorUnconfiguredHint": "No embedding endpoint/model configured â€” semantic recall is off",
      "memory.status.vectorDegradedHint": "Indexed 0 / {m} items â€” semantic recall is effectively unavailable",
        "memory.status.mirror": "Markdown mirror",
        "memory.status.mirror.ok": "Healthy",
        "memory.status.mirror.degraded": "Degraded",
        "memory.status.mirror.unknown": "Unknown",
        "memory.status.mirror.dirty": "Unflushed changes",
        "memory.status.mirror.yes": "Yes",
        "memory.status.mirror.lastError": "Last error",
        "memory.status.mirror.err.noSpace": "Disk full",
        "memory.status.mirror.err.permission": "Permission denied",
        "memory.status.mirror.err.syncFailed": "Sync failed",
        "memory.status.mirror.lastAttempt": "Last attempt",
        "memory.status.mirror.successAt": "Last success",
        "memory.status.mirror.foot": "Sync state of the on-disk Markdown mirror of memory entries",
        "memory.status.sec.overview": "Library",
        "memory.status.sec.engine": "Background activity",
        "memory.status.sec.maintenance": "Maintenance",
        "memory.status.maint": "Storage reclaim",
        "memory.status.maint.freelist": "Free pages reclaimable now",
        "memory.status.maint.plannedInputs": "Input snapshots to clear",
        "memory.status.maint.plannedEmbeddings": "Archived embeddings to clear",
        "memory.status.maint.window": "Retention window",
        "memory.status.maint.windowUnit": "days",
        "memory.status.maint.windowLabel": "Retention window (days)",
        "memory.status.maint.reestimate": "Re-estimate",
        "memory.status.maint.reestimating": "Estimatingâ€¦",
        "memory.status.maint.stale": "Window changed - re-estimate before running, or the run would use the previous estimate's numbers.",
        "memory.status.maint.vacuum": "VACUUM as well",
        "memory.status.maint.vacuumHint": "VACUUM briefly takes an exclusive lock on the database; other reads and writes wait. Skipping it does not change what gets cleared.",
        "memory.status.maint.execute": "Run reclaim",
        "memory.status.maint.confirm": "Confirm (irreversible)",
        "memory.status.maint.running": "Runningâ€¦",
        "memory.status.maint.cancel": "Cancel",
        "memory.status.maint.confirmHint": "This clears {inputs} input-snapshot rows and {embeddings} archived-embedding rows. It cannot be undone.",
        "memory.status.maint.badWindow": "The retention window must be an integer of at least 0",
        "memory.status.maint.failed": "Reclaim failed",
        "memory.status.maint.done": "Reclaim finished",
        "memory.status.maint.size": "Size (before â†’ after)",
        "memory.status.maint.reclaimed": "Actually freed",
        "memory.status.maint.clearedInputs": "Input snapshots cleared",
        "memory.status.maint.clearedEmbeddings": "Archived embeddings cleared",
        "memory.status.maint.receipt": "Audit receipt",
        "memory.status.maint.receiptNone": "Not recorded (audit disabled or receipt write failed)",
        "memory.status.maint.duration": "Duration",
        "memory.status.maint.vacuumRan": "VACUUM ran",
        "memory.status.maint.vacuumOff": "Not VACUUMed",
        "memory.status.maint.vacuumFailed": "VACUUM failed",
        "memory.status.maint.vacuumFailedHint": "The reclaim already completed and cannot be undone, but the file will not shrink yet; run it again later (reclaim is idempotent).",
        "memory.status.sec.token": "Token flow Â· last 7 days",
        "memory.status.token.in": "input",
        "memory.status.token.out": "output",
        "memory.status.token.total": "7-day token total",
        "memory.status.token.calls": "Calls",
        "memory.status.token.callsCap": "Last 7 days Â· all background components",
        "memory.status.token.share": "Consolidation share",
        "memory.status.token.shareFoot": "dream_consolidate Â· {n} token",
        "memory.status.token.conflicts": "Pending conflicts",
        "memory.status.token.conflictsFoot": "From /dream-status Â· live",
        "memory.status.token.donut": "By component Â· who spent these tokens",
        "memory.status.token.days": "By day Â· 7-day trend",
        "memory.status.token.heat": "8-week heat Â· daily spend",
        "memory.status.token.heatLess": "less",
        "memory.status.token.heatMore": "more",
        "memory.status.token.last7": "last 7 days",
        "memory.status.token.meterOnly": "(metered only)",
        "memory.status.token.detail": "Detailed status cards (the original 9 under Library / Background activity, click to expand)",
        "memory.status.token.op.dream_consolidate": "Memory consolidation",
        "memory.status.token.op.summarize_compress": "Session distillation",
        "memory.status.token.op.entity_extract": "Entity extraction",
        "memory.status.token.op.dream_summarize": "Overview summary",
        "memory.status.token.op.sleep_pattern": "Sleep patterns",
        "memory.status.token.op.write_admission": "Write admission",
        "memory.status.error": "Failed to load"
      }
    };

    function typeLabel(t, type) {
      const key = `memory.tab.${type}`;
      const label = t(key);
      return label && label !== key ? label : String(type);
    }

    // Entity types live under their own i18n subtree (person/project/...);
    // unknown or "other" falls back to the raw type string.
    function entityTypeLabel(t, type) {
      const key = `memory.entity.${type}`;
      const label = t(key);
      return label && label !== key ? label : String(type);
    }

    function formatDate(value) {
      if (!value) return "â€”";
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "â€”" : date.toLocaleString();
    }

    // Relative time ("2åˆ†é’Ÿå‰") keeps cards scannable; anything older than a
    // week falls back to the absolute date. The card meta shows the relative
    // form and carries the full timestamp in a title tooltip.
    function formatRelativeTime(value, t) {
      if (!value) return "â€”";
      const ms = new Date(value).getTime();
      if (Number.isNaN(ms)) return "â€”";
      const diff = Date.now() - ms;
      if (diff < 60_000) return t("memory.time.now");
      const minutes = Math.floor(diff / 60_000);
      if (minutes < 60) return t("memory.time.minutes").replace("{n}", String(minutes));
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return t("memory.time.hours").replace("{n}", String(hours));
      const days = Math.floor(hours / 24);
      if (days < 7) return t("memory.time.days").replace("{n}", String(days));
      return new Date(ms).toLocaleDateString();
    }

    // Memory-library stylesheet, injected once per page following the host's
    // data-plugin-css convention. Every value resolves to the host's design
    // tokens: background layers, label/border/interactive aliases and the
    // --dsw-font-* scale, so the page reads as a first-party view beside
    // Chat / Trajectory (flat layer-1 canvas, hairline column separators,
    // text-turns-brand-blue active states â€” no boxed panels).
    const CSS_TAG = "@fg-lab/amadeus-memory/drawer.css";
    const css = [
      // --- explorer shell: container queries let the toolbar adapt to the
      // better-sidebar workbench pane (~500px) as well as the 1240px sheet ---
      // --- sidebar foot trigger (wide row / collapsed rail icon) ---
      ".mneme-trigger{box-sizing:border-box;cursor:pointer;width:calc(100% + 4px);height:42px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:12px;flex:none;align-items:center;gap:8px;margin:4px -2px;padding:0 10px 0 8px;font-family:inherit;font-size:14px;line-height:22px;display:flex;overflow:hidden}",
      ".mneme-trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-trigger.mneme-rail{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:8px 0 10px;padding:0}",
      ".mneme-trigger-label{white-space:nowrap;overflow:hidden}",
      // --- shared controls ---
      ".mneme-search{box-sizing:border-box;height:30px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;outline:none;transition:border-color .12s,box-shadow .12s}",
      ".mneme-search:focus{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent)}",
      ".mneme-search::placeholder{color:var(--mneme-fg-dim)}",
      ".mneme-chip{height:26px;padding:0 10px;border-radius:8px;border:1px solid transparent;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:12px;line-height:16px;display:inline-flex;align-items:center}",
      ".mneme-chip:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-chip.mneme-active{color:var(--mneme-accent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent)}",
      ".mneme-select{box-sizing:border-box;height:30px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;outline:none}",
      ".mneme-routeselect{width:240px;max-width:60%}",
      ".mneme-footbtn{border:none;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:12px;line-height:16px;padding:3px 8px;border-radius:6px}",
      ".mneme-footbtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".mneme-hint{color:var(--mneme-fg-dim);padding:24px 0;text-align:center;font-size:13px}",
      ".mneme-entitychip{flex:none;height:26px;padding:0 10px;border-radius:8px;border:none;background:none;color:var(--mneme-accent);cursor:pointer;font-family:inherit;font-size:12px;line-height:16px;display:inline-flex;align-items:center}",
      ".mneme-entitychip:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent)}",
      // --- main-area memory library page ---
      // é¢æ¿è¯­ä¹‰è‰²å±‚ï¼ˆ#178ï¼‰ï¼šå®¿ä¸» token åœ¨æµ…è‰²ä¸‹ç»™æ­£æ–‡/æ¬¡è¦æ–‡å­—åªæœ‰ 1.26â€“4.49
      // çš„å¯¹æ¯”åº¦ï¼Œä¸”é¢æ¿è¿˜ä¸€ç›´åœ¨å¼•ç”¨ 5 ä¸ªæ ¹æœ¬ä¸å­˜åœ¨çš„å®¿ä¸»åï¼ˆ--dsw-alias-state-error
      // / -warning / -success / -warn / --dsw-alias-borderï¼‰ï¼Œ
      // äºæ˜¯é•¿å¹´åƒçš„æ˜¯å†™åœ¨ fallback é‡Œçš„ç¡¬ç¼–ç è‰²ã€‚è¿™é‡ŒæŒ‰å®¿ä¸»çœŸå® token ç°ç®—ä¸€ç»„
      // é¢æ¿è‡ªæœ‰è¯­ä¹‰è‰²ï¼šæ··è‰²åŸºå‡†å…¨æ˜¯å®¿ä¸» tokenï¼Œå®¿ä¸»æ¢è‚¤æ—¶è·Ÿç€èµ°ï¼Œä¸å¼•å…¥æ–°å­—é¢é‡ã€‚
      // å¿…é¡»æŒ‚å››ä¸ªæ ¹â€”â€”é¢æ¿ä¸åªé•¿åœ¨ .mneme-x ä¸‹ï¼šè®°å¿†åº“ sheet portal åˆ° body
      // ï¼ˆ.mneme-overlayï¼‰ã€ä¾§è¾¹æ å…¥å£åœ¨å®¿ä¸»æ’æ§½ï¼ˆ.mneme-triggerwrapï¼‰ã€é¡¶éƒ¨å…¥å£
      // portal åˆ°å®¿ä¸»ä¾§è¾¹æ ï¼ˆ.mneme-topentryï¼‰ã€‚
      ".mneme-x,.mneme-overlay,.mneme-triggerwrap,.mneme-topentry{" +
        "--mneme-fg-dim:color-mix(in srgb,var(--dsw-alias-label-primary) 60%,transparent);" +
        "--mneme-graphic-dim:color-mix(in srgb,var(--dsw-alias-label-primary) 50%,transparent);" +
        "--mneme-accent:color-mix(in srgb,var(--dsw-alias-state-business-primary) 85%,var(--dsw-alias-label-primary));" +
        "--mneme-danger:color-mix(in srgb,var(--dsw-alias-state-error-primary) 80%,var(--dsw-alias-label-primary));" +
        "--mneme-warn:color-mix(in srgb,var(--dsw-static-amber-600,#dd8629) 65%,var(--dsw-alias-label-primary));" +
        "--mneme-ok:color-mix(in srgb,var(--dsw-static-green-500,#22c55e) 65%,var(--dsw-alias-label-primary));" +
        // Token å»å‘ä¸‰å±ï¼ˆ2026-10 å¯è§‚æµ‹æ€§æ”¹é€ ï¼‰ï¼šå›¾è¡¨å…­è‰²å…¨éƒ¨å•å±‚ color-mixã€
        // åŸºå‡†åªç”¨å®¿ä¸» tokenï¼Œtest/contrast.test.js GRAPHICS é€ selector é”æµ…/æ·±
        // â‰¥3:1ã€‚é…æ¯”æŒ‰ 2026-10 å®¡è®¡æ•°æ®æ ¡å‡†ï¼ˆå·©å›º 37% æ˜¯æœ€å¤§å¼§ï¼Œå æœ€æ·±ä¸»è‰²ï¼‰ã€‚
        "--mneme-chart-1:color-mix(in srgb,var(--dsw-alias-state-business-primary) 70%,var(--dsw-alias-label-primary));" +
        "--mneme-chart-2:color-mix(in srgb,var(--dsw-static-green-500,#22c55e) 55%,var(--dsw-alias-label-primary));" +
        "--mneme-chart-3:color-mix(in srgb,var(--dsw-static-amber-600,#dd8629) 60%,var(--dsw-alias-label-primary));" +
        "--mneme-chart-4:color-mix(in srgb,var(--dsw-alias-state-error-primary) 65%,var(--dsw-alias-label-primary));" +
        "--mneme-chart-5:color-mix(in srgb,var(--dsw-static-green-500,#22c55e) 45%,var(--dsw-alias-state-business-primary));" +
        // chart-6 ä¸ graphic-dim åŒæ¬¾ä½†å†…è”å†™ï¼šå¯¹æ¯”åº¦è§£æå™¨ä¸é€’å½’ --mneme-* å˜é‡ã€‚
        "--mneme-chart-6:color-mix(in srgb,var(--dsw-alias-label-primary) 50%,transparent);" +
        // çƒ­åŠ›æ¡£ä½ç”¨ label è¡¥ä½™è€Œé transparentï¼štransparent æ··è‰²åœ¨æµ…è‰²ä¸»é¢˜ä¸‹
        // ä½æ¡£ä½å¯¹ç™½åº•ä¸è¶³ 3:1ï¼›label è¡¥ä½™ä¸¤å¥—ä¸»é¢˜å„æ¡£éƒ½è¿‡çº¿ä¸”å•è°ƒã€‚
        "--mneme-heat-1:color-mix(in srgb,var(--dsw-alias-state-business-primary) 85%,var(--dsw-alias-label-primary));" +
        "--mneme-heat-2:color-mix(in srgb,var(--dsw-alias-state-business-primary) 70%,var(--dsw-alias-label-primary));" +
        "--mneme-heat-3:color-mix(in srgb,var(--dsw-alias-state-business-primary) 55%,var(--dsw-alias-label-primary));" +
        "--mneme-heat-4:color-mix(in srgb,var(--dsw-alias-state-business-primary) 40%,var(--dsw-alias-label-primary))" +
      "}",
      ".mneme-x{flex:1;min-height:0;height:100%;width:100%;box-sizing:border-box;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);container-type:inline-size}",
      // çª„å®¹å™¨ï¼ˆbetter-sidebar å·¥ä½œå° ~500pxï¼‰ä¸‹ä¸­å¤® vtabs ä¼šä¸å³ç¼˜æ‚¬æµ®çš„
      // å¡ç‰‡/æ—¶é—´çº¿åˆ‡æ¢å™¨é‡å ï¼šå®¹å™¨æŸ¥è¯¢æ”¶çª„æ—¶éšè—åˆ‡æ¢å™¨ï¼Œè§†å›¾æ¨¡å¼æ²¿ç”¨
      // localStorage è®°å¿†ï¼Œå®½å®¹å™¨ï¼ˆsheetï¼‰ä¸å—å½±å“ã€‚
      "@container (max-width: 640px){.mneme-xtools .mneme-seg{display:none}}",
      ".mneme-xbar{position:relative;flex:none;display:flex;align-items:center;justify-content:center;gap:6px;border-bottom:1px solid var(--dsw-alias-border-l2);padding:0 16px;min-height:52px}",
      ".mneme-filterbar{flex:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}",
      ".mneme-vtabs{display:flex;align-items:stretch;height:46px}",
      ".mneme-vtab{position:relative;border:0;background:none;cursor:pointer;padding:0 16px;color:var(--mneme-fg-dim);font-family:inherit;font-size:14px;font-weight:500;line-height:20px;display:inline-flex;align-items:center;gap:7px}",
      "@container (max-width: 640px){.mneme-xbar{padding:0 4px}.mneme-vtab{padding:0 7px;font-size:12px;gap:4px}.mneme-vtabico{display:none}}",
      ".mneme-vtab:hover{color:var(--dsw-alias-label-primary)}",
      ".mneme-vtab.mneme-active{color:var(--mneme-accent)}",
      ".mneme-vtab.mneme-active::after{content:\"\";position:absolute;left:10px;right:10px;bottom:-1px;height:2.5px;border-radius:2px;background:var(--dsw-alias-state-business-primary)}",
      // transform ä¼šè‡ªå»ºå±‚å ä¸Šä¸‹æ–‡ï¼šå±‚çº§å¿…é¡»ç»™åœ¨å®¹å™¨ä¸Šâ€”â€”3 é«˜äºå¸é¡¶æœˆä»½å¤´(2)ã€
      // ä½äºè¯¦æƒ…æŠ½å±‰(6)ï¼Œä¸‹æ‹‰èœå•/å¯¼å…¥å¯¹è¯æ¡†éšå®¹å™¨æ•´ä½“ä¸Šæµ®ã€‚
      ".mneme-xtools{position:absolute;right:14px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:8px;padding:0;z-index:3}",
      ".mneme-xcount{flex:none;font-size:12px;line-height:16px;color:var(--mneme-fg-dim);white-space:nowrap}",
      // --- three-column browse layout: hairline separators, no outer box ---
      ".mneme-xmain{flex:1;min-height:0;display:flex;flex-direction:row;overflow:hidden}",
      ".mneme-xside{flex:none;width:264px;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;padding:16px 14px;border-right:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;display:flex;flex-direction:column;gap:8px}",
      // å·¦æ ä¸‹æ®µ=é‡è¦æ€§+æ¥æº+çƒ­åº¦ï¼šç´§è·Ÿæ£€ç´¢æ®µä¹‹åï¼ˆå¤éªŒä¿®è®¢ï¼šä¸å†é’‰åº•ï¼‰ï¼Œ
      // é¡¶éƒ¨ç»†çº¿ä¿ç•™åˆ†æ®µæ„Ÿï¼›æ å®½ 264px è®© 4 æšæ˜Ÿçº§ chip å•è¡Œæ’å¸ƒã€‚
      ".mneme-xside-imp{flex:none;margin-top:10px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:8px}",
      // å†…å®¹åŒºåˆ—å®¹å™¨ + é¡¶éƒ¨å·¥å…·æ¡ï¼šç±»å‹ chips æ¨ªæ’ + è®¡æ•°/åˆ·æ–°é å³ï¼›çª„å®¹å™¨é  wrap æ¢è¡Œã€‚
      ".mneme-xcontent{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
      ".mneme-xbrowsebar{flex:none;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}",
      // çª„å®¹å™¨ï¼ˆbetter-sidebar å·¥ä½œå° ~500pxï¼‰ï¼šå·¦æ æ”¶çª„ä¿å†…å®¹åŒºå¯ç”¨å®½åº¦ã€‚
      "@container (max-width: 640px){.mneme-xside{width:216px}}",
      // ç±»å‹ç­›é€‰åŸä¸ºç¬¬äºŒä¾§æ çš„ç«–æ’åˆ—è¡¨ï¼ˆä¸‰æ å¸ƒå±€é—ç•™ï¼Œ#é¢æ¿ä¸¤æ æ”¹ç‰ˆï¼‰ï¼š
      // ä¸¤æ åŒ–åæ”¶è¿›å†…å®¹åŒºå·¥å…·æ¡ï¼Œæ”¹ä¸ºè‡ªé€‚åº”æ¨ªæ’ chipsï¼Œå½©ç‚¹ä¸è®¡æ•°ä¿ç•™ã€‚
      ".mneme-xtype{display:inline-flex;justify-content:flex-start;align-items:center;gap:7px;padding:4px 9px;border:none;border-radius:8px;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:13px;line-height:18px;text-align:left}",
      ".mneme-xbrowse{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
      ".mneme-xrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
      ".mneme-xsearch{width:100%}",
      ".mneme-xselect{flex:1;min-width:0}",
      ".mneme-xcolhead{flex:none;font-size:12px;font-weight:500;margin:0;color:var(--mneme-fg-dim);padding:2px 8px 8px}",
      ".mneme-xtype:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-xtype.mneme-active{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary);font-weight:500}",
      ".mneme-xcount2{flex:none;font-size:12px;color:var(--mneme-fg-dim)}",
      ".mneme-xmonth{display:flex;align-items:center;gap:4px;width:100%;padding:6px 8px 4px;border:none;border-radius:8px;background:none;color:var(--dsw-alias-label-primary);cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;line-height:18px;text-align:left}",
      ".mneme-xmonth:first-child{margin-top:0}",
      ".mneme-xmonth:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-xcaret{flex:none;font-size:10px;color:var(--mneme-fg-dim);width:10px}",
      ".mneme-xday{display:flex;align-items:center;gap:4px;margin:6px 0 2px 22px;padding:2px 6px;border:none;border-radius:6px;background:none;font-family:inherit;font-size:12px;line-height:16px;color:var(--mneme-fg-dim);cursor:pointer;text-align:left}",
      ".mneme-xday:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".mneme-xitem{display:flex;gap:8px;align-items:baseline;width:calc(100% - 22px);margin-left:22px;padding:4px 8px;border:none;border-radius:8px;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:13px;line-height:18px;text-align:left}",
      ".mneme-xitem:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-xitem.mneme-active{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}",
      ".mneme-xtime{flex:none;font-size:12px;line-height:16px;color:var(--mneme-fg-dim);font-variant-numeric:tabular-nums}",
      ".mneme-xname{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".mneme-xempty{padding:18px 16px;text-align:center;color:var(--mneme-fg-dim);font-size:13px}",
      // --- memory-type color dots (mirrored across filter / timeline / detail) ---
      ".mneme-xdot{flex:none;display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor}",
      ".mneme-xdot--all{background:transparent;border:1.5px solid currentColor;opacity:.55;box-sizing:border-box}",
      ".mneme-xitem .mneme-xdot{align-self:center}",
      // --- detail column (preview pane sits BELOW the timeline: the list is
      // the primary scan target, the detail grows only when something is
      // selected so the empty state never eats the viewport) ---
      ".mneme-xdetail{flex:none;max-height:56%;min-height:0;overflow-y:auto;padding:12px 20px 16px;border-top:1px solid var(--dsw-alias-border-l2)}",
      ".mneme-xtree{flex:1;min-height:0;overflow-y:auto;padding:8px 10px 28px}",
      ".mneme-xdinner{max-width:720px}",
      ".mneme-xdtitle{font-size:16px;font-weight:600;line-height:24px;color:var(--dsw-alias-label-primary);margin-bottom:10px;word-break:break-word}",
      ".mneme-xdmeta{display:flex;flex-wrap:wrap;gap:4px 14px;margin-bottom:6px;font-size:12px;line-height:18px;color:var(--mneme-fg-dim)}",
      ".mneme-xdsrc{display:inline-block;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}",
      ".mneme-xdcontent{margin-top:14px;font-size:14px;line-height:1.75;color:var(--dsw-alias-label-primary);white-space:pre-wrap;word-break:break-word}",
      ".mneme-xdactions{display:flex;gap:8px;margin-top:18px}",
      // --- graph sub-view (fills the content area under the tabs) ---
      ".mneme-graph{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;padding:12px 16px 16px;box-sizing:border-box}",
      ".mneme-graphbar{display:flex;gap:8px;align-items:center;flex:none;margin-bottom:10px}",
      ".mneme-graphsvg{flex:1;min-height:180px;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-button-elevated-fill);cursor:grab;touch-action:none}",
      ".mneme-gnode{cursor:pointer}",
      ".mneme-gnode circle{stroke:var(--dsw-alias-bg-layer-2);stroke-width:2;transition:stroke-width .12s}",
      ".mneme-gnode:hover circle{stroke-width:4}",
      ".mneme-gnode.mneme-groot circle{stroke:var(--dsw-alias-state-business-primary);stroke-width:3}",
      ".mneme-glabel{fill:var(--dsw-alias-label-secondary);font-size:11px;text-anchor:middle;pointer-events:none;user-select:none}",
      ".mneme-gedge{stroke:var(--mneme-graphic-dim);stroke-width:1.5;cursor:pointer}",
      ".mneme-gedge:hover{stroke:var(--dsw-alias-state-business-primary)}",
      // è™šçº¿æ€é  dash å›¾æ¡ˆåŒºåˆ†ï¼Œä¸å†å  opacityï¼š50% çš„æè¾¹å†ä¹˜ .7 åæµ…è‰²ç”»å¸ƒä¸Š
      // åªå‰© 2.28ï¼Œä½äºå›¾å½¢è¦æ±‚çš„ 3:1ï¼ˆå›¾æ¡ˆå·²ç»æ‰¿æ‹…äº†ã€Œæ²¡æœ‰ memory_idã€è¿™ä¸ªè¯­ä¹‰ï¼‰ã€‚
      ".mneme-gedge-dashed{stroke-dasharray:5 4}",
      // å›¾è°±ä¸å›¾å†…ä¾§å¡çš„å…±åŒçˆ¶å®¹å™¨ï¼šä¾§å¡æ”¹æµ®å±‚ï¼ˆ#é¢æ¿å®ä½“é¡µå»å†—ä½™ï¼‰åéœ€è¦
      // relative é”šç‚¹ï¼Œå¦åˆ™ absolute ä¼šé€ƒé€¸åˆ° .mneme-ent æ ¹ã€‚
      ".mneme-entgraphwrap{position:relative;min-width:0}",
      // ä¾§å¡ä»ã€ŒSVG ä¸‹æ–¹æ–‡æ¡£æµå †å ã€ï¼ˆæŠŠå›¾æŒ¤æˆé‚®ç¥¨ï¼‰æ”¹ä¸ºå›¾å†…å·¦ä¸‹æµ®å±‚ï¼š
      // ååº”é¢æ¿ä¸ç‚¹å‡»ç„¦ç‚¹åŒä½ï¼ŒSVG ä¸å†è¢«æ¨æŒ¤ï¼›èƒŒæ™¯ç”¨ä¸é€æ˜ bg-layer-1ï¼Œ
      // æµ®å±‚ä¸‹é€å‡ºçš„å›¾å½¢ä¸å‚ä¸æ–‡å­—å¯¹æ¯”åº¦è®¡ç®—ã€‚
      ".mneme-graphside{position:absolute;left:12px;bottom:12px;width:min(300px,60%);max-height:60%;overflow-y:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 12px;z-index:2}",
      ".mneme-gs-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:4px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}",
      ".mneme-gs-meta{font-size:13px;color:var(--mneme-fg-dim);margin-bottom:6px}",
      ".mneme-gs-link{display:block;width:100%;text-align:left;border:none;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:13px;padding:3px 6px;border-radius:6px;word-break:break-word}",
      ".mneme-gs-link:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      // --- entity explorer: rail + layered detail (entities â†’ attrs â†’ relations â†’ graph) ---
      ".mneme-ent{flex:1;min-height:0;display:flex;overflow:hidden}",
      ".mneme-entrail{flex:none;width:224px;min-height:0;overflow:hidden;padding:12px 0 0;border-right:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;display:flex;flex-direction:column}",
      // å¤éªŒä¿®è®¢ï¼šæœç´¢ä¸è®¡æ•°å›ºå®šåœ¨é¡¶éƒ¨ä¸éšåˆ—è¡¨æ»šåŠ¨ï¼Œåˆ—è¡¨ç‹¬ç«‹æ»šåŠ¨ï¼›
      // ç±»å‹åˆ†ç»„å¤´ stickyâ€”â€”é•¿åˆ—è¡¨æ»šåŠ¨æ—¶åˆ†ç»„å½’å±å§‹ç»ˆå¯è§ã€‚
      ".mneme-entrailhead{flex:none;padding:0 12px 10px;display:flex;flex-direction:column;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
      ".mneme-entrailbody{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:4px 12px 12px;display:flex;flex-direction:column;gap:4px}",
      ".mneme-enttype{position:sticky;top:0;z-index:1;background:var(--dsw-alias-bg-layer-1);display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:8px 8px 2px;border:none;color:var(--mneme-fg-dim);cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;line-height:16px;text-align:left;letter-spacing:.02em}",
      ".mneme-entitem{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:5px 8px;border:none;border-radius:8px;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:13px;line-height:18px;text-align:left}",
      ".mneme-entitem:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-entitem.mneme-active{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}",
      ".mneme-entname{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".mneme-entmentions{flex:none;font-size:11px;color:var(--mneme-fg-dim);font-variant-numeric:tabular-nums}",
      ".mneme-entdetail{flex:1;min-width:0;min-height:0;overflow-y:auto;padding:20px 24px 32px;box-sizing:border-box}",
      ".mneme-entinner{max-width:720px}",
      ".mneme-enttitle{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:600;line-height:24px;color:var(--dsw-alias-label-primary);word-break:break-word}",
      ".mneme-enttitle .mneme-xdot{width:10px;height:10px}",
      ".mneme-entmeta{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px;font-size:12px;line-height:18px;color:var(--mneme-fg-dim)}",
      ".mneme-layer{margin-top:24px}",
      ".mneme-layerhead{display:flex;align-items:baseline;gap:8px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:10px}",
      ".mneme-layercount{font-size:12px;font-weight:400;color:var(--mneme-fg-dim)}",
      ".mneme-attrgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}",
      ".mneme-attrcard{min-width:0;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:8px 12px}",
      ".mneme-attrkey{font-size:11px;color:var(--mneme-fg-dim);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".mneme-attrval{font-size:13px;line-height:19px;color:var(--dsw-alias-label-primary);word-break:break-word}",
      ".mneme-relrow{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border:none;border-radius:10px;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:13px;line-height:20px;text-align:left}",
      ".mneme-relrow:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-reltype{flex:none;font-size:11px;line-height:16px;color:var(--mneme-accent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary) 35%,transparent);border-radius:6px;padding:0 6px}",
      ".mneme-relname{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      // --- settings: quiet stacked sections, one concern per section ---
      ".mneme-set{flex:1;min-height:0;overflow-y:auto;padding:8px 24px 48px;box-sizing:border-box}",
      ".mneme-set-inner{max-width:720px;margin:0 auto}",
      ".mneme-btn:focus-visible,.mneme-set-input:focus-visible,.mneme-switch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}",
      "@media (max-width:560px){.mneme-set{padding:8px 12px 32px}.mneme-set-inner{max-width:100%}.mneme-set-row{flex-wrap:wrap}.mneme-featnum{flex-wrap:wrap}.mneme-set-input{max-width:100%}.mneme-btn{max-width:100%}}",
      // è®¾ç½®é¡µå„èŠ‚ä¸€å¾‹ç”¨ boxed å¡ï¼ˆ.mneme-set-cardï¼‰+ åˆ†ç»„æ ‡é¢˜ï¼ˆ.mneme-set-groupheadï¼‰ï¼š
      // æ—§çš„ã€Œæ— æ¡† set-sec + æœ‰æ¡† set-cardã€æ··æ’æ˜¯ç‰ˆé¢æ‚ä¹±çš„ä¸€åŠæ¥æº
      ".mneme-set-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:4px}",
      ".mneme-set-desc{font-size:13px;line-height:19px;color:var(--mneme-fg-dim);margin-bottom:14px}",
      ".mneme-set-input{box-sizing:border-box;width:100%;height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;outline:none;margin-bottom:10px;transition:border-color .12s,box-shadow .12s}",
      ".mneme-set-input:focus{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent)}",
      ".mneme-set-input::placeholder{color:var(--mneme-fg-dim)}",
      ".mneme-set-input--area{height:auto;min-height:76px;padding:8px 12px;resize:vertical;line-height:1.6}",
      ".mneme-btn{flex:none;height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:none;color:var(--dsw-alias-label-primary);cursor:pointer;font-family:inherit;font-size:12px;line-height:16px;display:inline-flex;align-items:center;gap:6px}",
      ".mneme-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-btn:disabled{opacity:.5;cursor:default}",
      ".mneme-saved{font-size:12px;color:var(--mneme-ok)}",
      // rule rows: numbered chips + hover-revealed delete
      ".mneme-set-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;margin-bottom:8px;background:var(--dsw-alias-bg-base,transparent)}",
      ".mneme-set-idx{flex:none;width:20px;height:20px;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);color:var(--mneme-fg-dim);font-size:11px;line-height:18px;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}",
      ".mneme-set-ruletext{flex:1;min-width:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);word-break:break-word}",
      ".mneme-set-del{flex:none;opacity:0;transition:opacity .12s;border:none;background:none;color:var(--mneme-fg-dim);cursor:pointer;font-size:14px;line-height:20px;padding:0 4px;border-radius:6px}",
      ".mneme-set-row:hover .mneme-set-del,.mneme-set-row:focus-within .mneme-set-del{opacity:1}",
      ".mneme-set-del:hover{color:var(--mneme-danger);background:var(--dsw-alias-interactive-bg-hover)}",
      // äººæ ¼å¡åˆ é™¤ Ã— ç‹¬ç«‹ç±»ï¼šä¸å¤ç”¨ mneme-set-delâ€”â€”å…¶ opacity:0 ä»…åœ¨
      // .mneme-set-row:hover è§£é™¤ï¼Œå¡æ ‡ç­¾ä¸åœ¨è¯¥å®¹å™¨é‡Œ â†’ Ã— æ°¸è¿œé€æ˜ï¼ˆv1.2
      // å®æµ‹è¸©ä¸­ï¼‰ã€‚#457 æ›¾ç”¨å†…è” opacity:1 è¦†å†™ï¼Œä½†æ‚¬åœå˜çº¢ä»èµ°
      // .mneme-set-del:hoverï¼Œè¿å¸¦å¸¸ç‚¹äº®äº†è§„åˆ™åŒºçš„çœŸåˆ é™¤æŒ‰é’®ï¼Œè¢« #459 å›æ»šã€‚
      // ç‹¬ç«‹ç±»å¸¸æ˜¾ï¼Œåªæ²¿ç”¨é…è‰²ï¼Œè§„åˆ™åŒºè¡Œä¸ºåˆ†æ¯«ä¸åŠ¨ã€‚
      ".mneme-persona-del{flex:none;opacity:1;border:none;background:none;color:var(--mneme-fg-dim);cursor:pointer;font-size:16px;line-height:18px;padding:0 3px;border-radius:6px}",
      ".mneme-persona-del:hover{color:var(--mneme-danger);background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-set-cmd{flex:1;min-width:0}",
      ".mneme-set-cmdname{font-size:13px;font-weight:600;color:var(--mneme-accent)}",
      ".mneme-set-cmddesc{font-size:12px;line-height:17px;color:var(--mneme-fg-dim);margin-top:1px;word-break:break-word}",
      // --- settings sub-view ---
      ".mneme-set{flex:1;min-height:0;overflow-y:auto;padding:8px 24px 48px;box-sizing:border-box}",
      // --- è®°å¿†åº“é¡µé¢ï¼šå±…ä¸­ sheetï¼Œéå…¨å± ---
      // ä»å¯¹è¯ç›´æ¥æ‰“å¼€ä¸€é¡µè®°å¿†åº“ï¼šèƒŒæ¿å‹æš— + å±…ä¸­åœ†è§’å¡ç‰‡ï¼ˆä¸Šé™ 1180Ã—880ï¼‰ï¼Œ
      // å¯¹è¯ä»ç•™åœ¨èƒŒæ¿ä¹‹åï¼Œä»»ä½•çŠ¶æ€ä¸‹ï¼ˆå«æ–°ä¼šè¯ heroã€æ—  tab ç¯ï¼‰éƒ½å¯ç”¨ã€‚
      // portal åˆ° <body>ï¼Œå®¿ä¸»ä¾§è¾¹æ çš„å±‚å ä¸Šä¸‹æ–‡è£ä¸ä½å®ƒã€‚
      ".mneme-backdrop{position:fixed;inset:0;z-index:999;background:color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent);backdrop-filter:blur(2px);animation:mneme-fadein .14s ease-out}",
      ".mneme-overlay{position:fixed;z-index:1000;left:50%;top:50%;transform:translate(-50%,-50%);width:min(1240px,calc(100vw - 88px));height:min(920px,calc(100vh - 64px));display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);box-shadow:0 24px 64px color-mix(in srgb,var(--dsw-alias-label-primary) 22%,transparent);animation:mneme-pop .18s cubic-bezier(.2,.9,.3,1)}",
      ".mneme-overlaybar{flex:none;display:flex;align-items:center;justify-content:space-between;height:48px;padding:0 12px 0 18px;border-bottom:1px solid var(--dsw-alias-border-l2)}",
      ".mneme-overlaytitle{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:8px}",
      ".mneme-overlaybody{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
      "@keyframes mneme-fadein{from{opacity:0}to{opacity:1}}",
      "@keyframes mneme-pop{from{opacity:0;transform:translate(-50%,-50%) scale(.98)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}",
      // --- ä¾§è¾¹æ é¡¶éƒ¨å…¥å£ï¼šå€Ÿå®¿ä¸»ã€Œæ–°ä¼šè¯ã€æŒ‰é’®çš„åŸç”Ÿç±»åå¯¹é½ ---
      // wrapper display:contents éšèº«ï¼ŒæŒ‰é’®æˆä¸ºä¾§è¾¹æ å¼¹æ€§å¸ƒå±€çš„ç›´æ¥å­å…ƒç´ ï¼›
      // ç›’æ¨¡å‹/é—´è·/æ”¶èµ·æ€ rail å‡ ä½•å…¨éƒ¨ç»§æ‰¿å®¿ä¸»ï¼Œæˆ‘ä»¬åªè¦†ç›–é…è‰²ä¸ºæ¬¡çº§è§‚æ„Ÿã€‚
      ".mneme-stars{display:inline-flex;align-items:center;gap:2px}",
      // çƒ­åº¦å¾½ç« ä¸‰æ¡£ï¼šçƒ­ï¼ˆæ©™ï¼‰/æ¸©ï¼ˆæ¬¡çº§æ–‡å­—ï¼‰/å†·ï¼ˆå¼±åŒ–æ–‡å­—ï¼‰ï¼Œå†·æ¡£è—ç™¾åˆ†æ¯”åªç•™å›¾æ ‡ã€‚
      ".mneme-heat{display:inline-flex;align-items:center;gap:2px;font-size:11px;line-height:14px;font-variant-numeric:tabular-nums}",
      ".mneme-heat--hot{color:var(--mneme-warn)}",
      ".mneme-heat--warm{color:var(--dsw-alias-label-secondary)}",
      ".mneme-heat--cold{color:var(--mneme-fg-dim)}",
      ".mneme-heat--cold .mneme-heatpct{display:none}",
      // ä¾§è¾¹æ å…¥å£ä¸¤ç§å½¢æ€çš„æ ·å¼ï¼ˆæŒ‚è½½ä¸æ¬ç§»é€»è¾‘è§ SidebarTopEntry çš„å¤´æ³¨é‡Šï¼‰ã€‚
      // å±•å¼€æ€å…œåº•ï¼šé€æ¡é•œåƒå®¿ä¸» panelRowï¼ˆ36px è¡Œé«˜ / é€æ˜åº• / 2px å¤–è¾¹è· /
      // 7px 8px å†…è¾¹è·ï¼‰â€”â€”å®¿ä¸»é¢æ¿è¡Œç±»ååœ¨æˆ–ä¸åœ¨ï¼Œè§‚æ„Ÿéƒ½æ˜¯ã€Œæ’ä»¶ / è‡ªåŠ¨åŒ–ä»»åŠ¡ã€
      // é‚£ä¸€æ¡£ï¼Œä¸ä¼šå†é€€å› v0.8.10 é‚£ç§é«˜äº®å¤§æŒ‰é’®ã€‚
      // æ”¶èµ·æ€ï¼šæŒ‰é’®å¸¦å®¿ä¸» newSession ç±»åï¼Œæ ‡é¢˜æ å›ºå®šå‡ ä½•ï¼ˆposition:fixedã€
      // é¡¶éƒ¨å±…ä¸­ã€28px åœ†é’®ã€æ¬¡çº§æ–‡å­—è‰²ã€hover å¡«å……ï¼‰æ•´å¥—ç»§æ‰¿å®¿ä¸»è§„åˆ™ï¼Œæˆ‘ä»¬åªç”¨
      // ä¸€æ¡æ›´å…·ä½“çš„è§„åˆ™æŠŠ left ä»å®¿ä¸»çš„ 48px æ¨åˆ° 84pxâ€”â€”å³ã€Œæ–°ä¼šè¯ã€å³ä¾§ï¼Œ
      // ä¸å†åƒ v0.8.10 é‚£æ ·å‹åœ¨å®ƒèº«ä¸Šï¼ˆç”¨æˆ·å®æµ‹ç¡®è®¤çš„é®æŒ¡ bugï¼‰ã€‚
      // 84 = 48ï¼ˆå®¿ä¸»ç»™ã€Œæ–°ä¼šè¯ã€çš„ leftï¼‰+ 28ï¼ˆé’®å®½ï¼‰+ 8ï¼ˆé—´è·ï¼‰ï¼›120 = 84 + 28 + 8ï¼Œ
      // è®©ã€Œåº”ç”¨ / ç¼–è¾‘ã€èœå•é¡ºå»¶åˆ°æˆ‘ä»¬å³ä¾§ã€‚å®¿ä¸»ä¾§å‡ºå¤„ï¼šSidebarRoot.module.css çš„
      // `.collapsed .newSession{left:48px}` ä¸
      // `html[data-windows-titlebar]:has([data-sidebar-collapsed=true]){--dsh-windows-menu-start:84px}`ã€‚
      ".mneme-topentry{display:flex;flex-direction:column;position:relative}",
      ".mneme-topentry-native{box-sizing:border-box;min-height:36px;border:none;border-radius:var(--dsw-radius-md);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;align-items:center;gap:8px;margin:0 2px;padding:7px 8px;line-height:22px;display:flex}",
      ".mneme-topentry-native:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".mneme-topentry-native:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}",
      ".mneme-topentry-native .mneme-topentry-label{white-space:nowrap}",
      "html[data-windows-titlebar] .mneme-topentry .mneme-topentry-rail{left:84px}",
      // èœå•è®©ä½åªåœ¨ã€Œæ”¶èµ· + å…¥å£ç¡®å®æŒ‚åœ¨æ ‡é¢˜æ é‡Œã€æ—¶ç”Ÿæ•ˆï¼›å±•å¼€æ€å®Œå…¨ä¸ç¢°å®¿ä¸»å˜é‡ã€‚
      "html[data-windows-titlebar]:has([data-sidebar-collapsed=true]):has([data-plugin-entry=\"@fg-lab/amadeus-memory\"]){--dsh-windows-menu-start:120px}",
      // --- åŠŸèƒ½å¼€å…³ï¼šä¸€è¡Œä¸€å¼€å…³ï¼ŒClaude å¼å®‰é™æ’ç‰ˆ ---
      ".mneme-featgroup{flex:none;font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--mneme-fg-dim);margin:16px 0 2px}",
      ".mneme-featrow{display:flex;align-items:center;gap:14px;padding:11px 2px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
      ".mneme-featrow:last-child{border-bottom:none}",
      ".mneme-featmain{flex:1;min-width:0}",
      ".mneme-featname{font-size:13.5px;font-weight:500;line-height:20px;color:var(--dsw-alias-label-primary)}",
      ".mneme-feathint{font-size:12.5px;line-height:18px;color:var(--mneme-fg-dim);margin-top:2px}",
      ".mneme-switch{position:relative;flex:none;width:36px;height:22px;border-radius:11px;border:none;cursor:pointer;background:var(--dsw-alias-interactive-bg-active);transition:background .15s}",
      ".mneme-switch::after{content:\"\";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 1px 3px color-mix(in srgb,var(--dsw-alias-label-primary) 25%,transparent);transition:transform .15s}",
      ".mneme-switch.mneme-on{background:var(--dsw-alias-state-business-primary)}",
      ".mneme-switch.mneme-on::after{transform:translateX(14px)}",
      ".mneme-switch:disabled{opacity:.5;cursor:default}",
      ".mneme-featnum{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 2px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
      ".mneme-featnum:last-child{border-bottom:none}",
      ".mneme-featnumlabel{font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}",
      ".mneme-numinput{box-sizing:border-box;width:110px;height:30px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;outline:none;text-align:right;transition:border-color .12s,box-shadow .12s}",
      ".mneme-numinput:focus{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent)}",
      // å­—ç¬¦ä¸²å¼€å…³çš„è¾“å…¥æ¡†ï¼ˆprovider/model ç­‰ï¼‰ä¸å…¶å­å—å®¹å™¨
      ".mneme-strinput{box-sizing:border-box;width:240px;max-width:60%;height:30px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;outline:none;text-align:left;transition:border-color .12s,box-shadow .12s}",
      ".mneme-strinput:focus{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent)}",
      ".mneme-featsub{margin:2px 0 8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;display:flex;flex-direction:column;gap:6px}",
      ".mneme-featsub .mneme-featnum{padding:6px 0;border-bottom:none}",
      ".mneme-featsubhint{font-size:12px;line-height:17px;color:var(--mneme-fg-dim)}",
      // è¿è¡Œæ—¶é‚£ä¸€å—çš„è¯´æ˜æ–‡å­—ï¼šæ¯”å¸¸è§„ hint å†å°ä¸€æ¡£ï¼Œå®ƒæ˜¯èƒŒæ™¯ä¿¡æ¯è€Œä¸æ˜¯è¦è¯»çš„æ­£æ–‡ã€‚
      ".mneme-runtimehint{font-size:11px;line-height:16px;color:var(--mneme-fg-dim)}",
      // --- äº¤äº’å¼è®°å¿†åº“ï¼šå·¥å…·æ  / å¡ç‰‡ç½‘æ ¼ / è¯¦æƒ…æŠ½å±‰ / æ›´å¤šèœå• ---
      // sheet è¾¹è·æ”¾å®½ï¼šä¸çª—å£è¾¹ç¼˜ä¿æŒå‘¼å¸è·ç¦»ï¼Œå±…ä¸­ä¸é¡¶æ»¡ã€‚
      // è§†å›¾åˆ‡æ¢ï¼ˆå¡ç‰‡/æ—¶é—´çº¿ï¼‰åˆ†æ®µæ§ä»¶æŒ‚åœ¨å­é¡µæ å³ä¾§ã€‚
      ".mneme-seg{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;overflow:hidden}",
      ".mneme-seg button{border:none;background:none;color:var(--mneme-fg-dim);cursor:pointer;font-family:inherit;font-size:12px;line-height:16px;padding:5px 10px;display:inline-flex;align-items:center;gap:5px}",
      ".mneme-seg button:hover{color:var(--dsw-alias-label-primary)}",
      ".mneme-seg button.mneme-active{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary);font-weight:500}",
      // å¡ç‰‡ç½‘æ ¼ï¼šå“åº”å¼ auto-fillï¼Œå¡ç‰‡æ‚¬åœè½»æµ®èµ·
      ".mneme-cards{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:14px;padding:20px 24px 32px;align-content:start}",
      ".mneme-card{display:flex;flex-direction:column;gap:7px;min-width:0;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 13px;background:var(--dsw-alias-bg-layer-1);cursor:pointer;font-family:inherit;text-align:left;transition:border-color .12s,box-shadow .12s,transform .12s}",
      ".mneme-card:hover{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 45%,var(--dsw-alias-border-l2));box-shadow:0 6px 20px color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent);transform:translateY(-1px)}",
      ".mneme-card.mneme-active{border-color:var(--dsw-alias-state-business-primary)}",
      ".mneme-cardhead{display:flex;align-items:center;gap:6px;font-size:11.5px;line-height:16px;color:var(--mneme-fg-dim)}",
      ".mneme-cardtitle{font-size:13.5px;font-weight:600;line-height:19px;color:var(--dsw-alias-label-primary);word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".mneme-cardexcerpt{font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary);word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}",
      ".mneme-cardfoot{display:flex;align-items:center;gap:8px;margin-top:auto;font-size:11.5px;line-height:16px;color:var(--mneme-fg-dim)}",
      ".mneme-cardsrc{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      // å¾½ç« ï¼šå†²çªå¾…ç¡®è®¤ / å·²å½’æ¡£
      ".mneme-badge{flex:none;display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 7px;border-radius:6px;font-size:11px;line-height:14px}",
      ".mneme-badge--conflict{color:var(--mneme-danger);background:color-mix(in srgb,var(--mneme-danger) 10%,transparent);border:1px solid color-mix(in srgb,var(--mneme-danger) 30%,transparent)}",
      ".mneme-badge--archived{color:var(--mneme-fg-dim);background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-badge--scope{color:var(--mneme-accent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary) 30%,transparent)}",
      // ã€Œé»˜è®¤ / å·²æ”¹ã€å¾½æ ‡ï¼ˆ#427ï¼‰ï¼šdefault å¤ç”¨ --archived çš„è¯­ä¹‰è‰²ç»„åˆ
      // ï¼ˆfg-dim on interactive-bg-hoverï¼‰ï¼Œchanged å¤ç”¨ --scope çš„ accent ç»„
      // åˆâ€”â€”ä¸¤ç»„é…å¯¹éƒ½å·²è¿‡ contrast.test.js çš„é‡ç®—ï¼Œä¸å†å‘æ˜æ–°é¢œè‰²ã€‚
      ".mneme-badge--default{color:var(--mneme-fg-dim);background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-badge--changed{color:var(--mneme-accent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary) 30%,transparent)}",
      // å†²çªé›†ä¸­å¤„ç†é˜Ÿåˆ—ï¼ˆv0.8.0ï¼‰ï¼šçŠ¶æ€é¡µçš„å¾…ç¡®è®¤å†²çªåˆ—è¡¨
      ".mneme-conflictq{display:flex;flex-direction:column;gap:10px}",
      ".mneme-conflictq-head{display:flex;align-items:center;gap:8px}",
      ".mneme-conflict-item{border:1px solid var(--dsw-alias-border-l1,var(--dsw-alias-interactive-bg-hover));border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px}",
      ".mneme-conflict-reason{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary)}",
      ".mneme-conflict-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      ".mneme-conflict-side{border:1px solid var(--dsw-alias-border-l1,var(--dsw-alias-interactive-bg-hover));border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:4px;min-width:0}",
      ".mneme-conflict-sidelabel{font-size:11px;color:var(--mneme-fg-dim)}",
      ".mneme-conflict-sidetitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".mneme-conflict-snippet{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}",
      ".mneme-conflict-missing{font-size:12px;color:var(--mneme-fg-dim)}",
      ".mneme-conflict-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}",
      ".mneme-conflict-hint{font-size:11px;color:var(--mneme-fg-dim);margin-right:auto}",
      // #177 å†²çªé˜Ÿåˆ—è§†è§‰æ‰¹æ¬¡ï¼šA/B ä¾§è‰²ã€ç›¸ä¼¼åº¦æ¡ã€è¯çº§ diffã€ä¸»è‰²æŒ‰é’®ã€ç©ºæ€
      ".mneme-conflict-side--a{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 4%,transparent)}",
      ".mneme-conflict-side--a .mneme-conflict-sidelabel{color:var(--mneme-accent);font-weight:600}",
      ".mneme-conflict-side--b{border-color:color-mix(in srgb,var(--mneme-warn) 45%,transparent);background:color-mix(in srgb,var(--mneme-warn) 5%,transparent)}",
      ".mneme-conflict-side--b .mneme-conflict-sidelabel{color:var(--mneme-warn);font-weight:600}",
      ".mneme-conflict-simrow{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}",
      ".mneme-conflict-simbar{position:relative;flex:1;height:5px;border-radius:3px;background:var(--dsw-alias-interactive-bg-hover);overflow:hidden}",
      ".mneme-conflict-simfill{position:absolute;top:0;bottom:0;left:0;border-radius:3px;background:var(--dsw-alias-state-business-primary)}",
      ".mneme-conflict-diff{font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}",
      // å±•å¼€å…¨æ–‡ï¼šå–æ¶ˆè¡Œæ•°é’³åˆ¶å¹¶ç»™ä¸€ä¸ªå†…éƒ¨æ»šåŠ¨åŒºâ€”â€”æŠ¥éšœç‚¹æ˜¯ã€Œçª—å£å¤ªå°åˆä¸èƒ½
      // æ”¾å¤§ï¼Œå®Œå…¨å¯¹æ¯”ä¸äº†å†…å®¹ã€ï¼Œæ‰€ä»¥å±•å¼€æ€å¿…é¡»èƒ½å®¹çº³é•¿æ–‡æœ¬ä¸”ä¸æ’‘ç ´é¢æ¿ã€‚
      // ä¸Šé™ç”¨ em è€Œé vhï¼šå®¿ä¸»å¯èƒ½æŠŠé¢æ¿æ”¾åœ¨é›¶é«˜è§†å£é‡Œï¼ˆéšè— webview / åå°
      // é¡µï¼‰ï¼Œé‚£æ—¶ 46vh ä¼šç®—æˆ 0pxï¼Œå±•å¼€æ€ç›´æ¥çœ‹ä¸è§å­—â€”â€”å®æµ‹è¸©è¿‡ã€‚
      ".mneme-conflict-diff--full{display:block;-webkit-line-clamp:unset;max-height:28em;overflow-y:auto}",
      ".mneme-conflict-text{font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;max-height:28em;overflow-y:auto}",
      ".mneme-conflict-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;line-height:16px;color:var(--mneme-fg-dim)}",
      ".mneme-conflict-metaval{color:var(--dsw-alias-label-secondary)}",
      // çª„é¢æ¿ä¸‹å¹¶æ’ä¼šæŠŠæ¯ä¾§æŒ¤åˆ°æ— æ³•é˜…è¯»ï¼Œé€€æˆå•åˆ—ï¼ˆå®¹å™¨æŸ¥è¯¢æŒ‰é¢æ¿å®é™…å®½åº¦åˆ¤ï¼‰
      "@container (max-width:560px){.mneme-conflict-pair{grid-template-columns:1fr}}",
      ".mneme-conflict-mark{text-decoration:none;border-radius:3px;padding:0 1px}",
      ".mneme-conflict-mark--del{background:color-mix(in srgb,var(--mneme-danger) 16%,transparent);text-decoration:line-through}",
      ".mneme-conflict-mark--ins{background:color-mix(in srgb,var(--mneme-ok) 18%,transparent)}",
      ".mneme-conflict-primary{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 10px;border-radius:8px;border:none;background:var(--mneme-accent);color:var(--dsw-alias-bg-layer-1);cursor:pointer;font-family:inherit;font-size:12px;line-height:16px}",
      ".mneme-conflict-primary:disabled{opacity:.55;cursor:default}",
      ".mneme-conflict-primary:hover:not(:disabled){background:color-mix(in srgb,var(--mneme-accent) 85%,var(--dsw-alias-label-primary))}",
      ".mneme-badge--frozen{color:var(--mneme-warn);background:color-mix(in srgb,var(--mneme-warn) 12%,transparent)}",
      // ã€Œå¾…é‡å¯ã€å¾½æ ‡ï¼šæ²¿ç”¨ frozen çš„ warn è¯­ä¹‰ï¼ˆéƒ½æ˜¯ã€Œç°çŠ¶ä¸æ˜¯ä½ åˆšè®¾çš„æ ·å­ã€ï¼‰ï¼Œ
      // ä½†åŠ è¾¹æ¡†æŠŠå®ƒå’Œåªè¯»å†»ç»“æ€åŒºåˆ†å¼€â€”â€”å®ƒéœ€è¦ç”¨æˆ·åŠ¨æ‰‹ï¼Œä¸æ˜¯ç»ˆæ€ã€‚
      ".mneme-badge--pending{color:var(--mneme-warn);background:color-mix(in srgb,var(--mneme-warn) 12%,transparent);border:1px solid color-mix(in srgb,var(--mneme-warn) 30%,transparent)}",
      ".mneme-pending{display:flex;align-items:flex-start;gap:8px;margin:8px 0 0;padding:8px 10px;border-radius:8px;font-size:12.5px;line-height:18px;color:var(--mneme-warn);background:color-mix(in srgb,var(--mneme-warn) 10%,transparent);border:1px solid color-mix(in srgb,var(--mneme-warn) 28%,transparent)}",
      // åœ†ç‚¹ç”¨å½“å‰è‰²ï¼ˆcurrentColorï¼‰è€Œä¸æ˜¯å†å¼•ä¸€æ¬¡ --mneme-warnï¼šè‰²å€¼åªæœ‰ä¸€ä¸ªçœŸæºï¼Œ
      // æ”¹ä¸»é¢˜æ—¶æç¤ºè¡Œä¸åœ†ç‚¹ä¸ä¼šèµ°æ•£ã€‚
      ".mneme-pending-dot{flex:none;width:6px;height:6px;margin-top:6px;border-radius:50%;background:currentColor}",
      ".mneme-conflict-empty{border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}",
      ".mneme-conflict-empty-title{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}",
      ".mneme-conflict-empty-body{font-size:12px;line-height:18px;color:var(--mneme-fg-dim)}",
      ".mneme-statuscard--actionable{border-color:color-mix(in srgb,var(--mneme-warn) 55%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--mneme-warn) 35%,transparent)}",
      ".mneme-entrybadge{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--mneme-danger);color:var(--dsw-alias-bg-layer-1,#fff);font-size:10.5px;line-height:16px;font-weight:600;text-align:center;box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1)}",
      ".mneme-triggerwrap{position:relative;pointer-events:none}",
      ".mneme-triggerwrap .mneme-trigger{pointer-events:auto}",
      ".mneme-conflict-jump .mneme-statuscard{border-color:color-mix(in srgb,var(--mneme-warn) 55%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--mneme-warn) 35%,transparent)}",
      ".mneme-conflict-jump:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;border-radius:12px}",
      // è¯¦æƒ…æŠ½å±‰ï¼šsheet å†…å³ä¾§æ»‘å‡ºï¼Œè¦†ç›–åœ¨æµè§ˆåŒºä¹‹ä¸Š
      ".mneme-xmain{position:relative}",
      "@keyframes mneme-slidein{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}",
      ".mneme-drawer{position:absolute;top:0;right:0;bottom:0;width:min(432px,52%);display:flex;flex-direction:column;border-left:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:-16px 0 40px color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent);animation:mneme-slidein .18s ease-out;z-index:6}",
      ".mneme-drawerbar{flex:none;display:flex;align-items:center;gap:8px;height:44px;padding:0 10px 0 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}",
      ".mneme-drawertype{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;color:var(--dsw-alias-label-secondary)}",
      ".mneme-drawerbody{flex:1;min-height:0;overflow-y:auto;padding:20px 22px 28px}",
      ".mneme-drawertitle{width:100%;font-size:16px;font-weight:600;line-height:23px;color:var(--dsw-alias-label-primary);word-break:break-word}",
      ".mneme-drawertitle-input{width:100%;box-sizing:border-box;font-size:15px;font-weight:600;line-height:22px;padding:7px 10px;border-radius:8px;border:1px solid var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);font-family:inherit;outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent)}",
      ".mneme-dmeta{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin-top:12px;font-size:12.5px;line-height:19px}",
      ".mneme-dmetakey{color:var(--mneme-fg-dim)}",
      ".mneme-dmetaval{color:var(--dsw-alias-label-secondary);min-width:0;word-break:break-word}",
      ".mneme-dcontent{margin-top:14px;font-size:13.5px;line-height:1.75;color:var(--dsw-alias-label-primary);white-space:pre-wrap;word-break:break-word}",
      ".mneme-dcontent-input{width:100%;box-sizing:border-box;min-height:180px;font-size:13.5px;line-height:1.7;padding:9px 11px;border-radius:8px;border:1px solid var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);font-family:inherit;outline:none;resize:vertical;box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent)}",
      ".mneme-dentities{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}",
      ".mnementity-chip{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);cursor:default}",
      ".mneme-dactions{flex:none;display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;border-top:1px solid var(--dsw-alias-border-l2)}",
      // æ›´å¤šæ“ä½œèœå•ï¼ˆå¯¼å…¥/å¯¼å‡ºï¼‰ä¸å¯¼å…¥å¼¹å±‚
      ".mneme-menuwrap{position:relative}",
      ".mneme-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:180px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 12px 32px color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent);padding:5px;z-index:20;animation:mneme-fadein .1s ease-out}",
      ".mneme-menu button{display:flex;align-items:center;gap:8px;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary);cursor:pointer;font-family:inherit;font-size:13px;line-height:18px;padding:8px 10px;border-radius:8px;text-align:left}",
      ".mneme-menu button:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-impdialog{position:absolute;right:0;top:calc(100% + 6px);width:300px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 12px 32px color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent);padding:14px;z-index:20;animation:mneme-fadein .1s ease-out}",
      ".mneme-improw{display:flex;align-items:center;gap:8px;margin-top:10px}",
      // ç¬æ—¶æ“ä½œæç¤ºï¼ˆåˆ é™¤/å½’æ¡£ï¼‰ï¼šæŒ‚åœ¨æµè§ˆå±‚åº•éƒ¨å±…ä¸­ï¼Œä¸è¢«æŠ½å±‰å¸è½½åæ‰
      ".mneme-x{position:relative}",
      ".mneme-toast{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-1);font-size:12.5px;line-height:18px;padding:7px 16px;border-radius:10px;z-index:30;box-shadow:0 8px 24px color-mix(in srgb,var(--dsw-alias-label-primary) 25%,transparent);animation:mneme-fadein .15s ease-out}",
      // --- explorer refresh: paged month tree, sticky headers, inline icons ---
      ".mneme-vtabico{flex:none;opacity:.85}",
      ".mneme-xsearchwrap{position:relative;flex:none}",
      ".mneme-xsearchico{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--mneme-fg-dim);pointer-events:none}",
      ".mneme-xsearchwrap .mneme-xsearch{padding-left:27px}",
      ".mneme-footbtn{display:inline-flex;align-items:center;gap:4px}",
      ".mneme-xmonth{position:sticky;top:0;z-index:2;background:var(--dsw-alias-bg-layer-1);display:flex;align-items:center;gap:6px}",
      ".mneme-xmonthcount{margin-left:auto;color:var(--mneme-fg-dim);font-weight:400;font-variant-numeric:tabular-nums}",
      ".mneme-xcaret{display:inline-flex;align-items:center;justify-content:center;color:var(--mneme-fg-dim)}",
      ".mneme-xmore{display:flex;justify-content:center;align-items:center;padding:10px 0 24px;min-height:20px}",
      ".mneme-xemptyico{display:block;margin:0 auto 6px;opacity:.7}",
      // --- status sub-view: responsive stat-card grid (auto-fill, ~220px min) ---
      ".mneme-status{flex:1;min-height:0;overflow-y:auto;padding:20px 24px 40px;box-sizing:border-box}",
      ".mneme-statusgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;max-width:1000px;margin:0 auto 12px}",
      ".mneme-statusgrid:last-of-type{margin-bottom:0}",
      // æ¦‚è§ˆåŒºæ˜¯å•è¡Œä¸‰å¡ï¼šauto-fit è®©ä¸æ»¡çš„è½¨é“å¡Œç¼©ï¼Œä¸‰å¼ å¡æ’ç­‰å®½é“ºæ»¡ã€è¡Œå°¾ä¸ç•™æ´
      ".mneme-statusgrid--overview{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}",
      // è·¨åˆ—åªåœ¨å®¹å™¨å¤Ÿæ”¾ä¸‹ â‰¥2 åˆ—æ—¶ç”Ÿæ•ˆï¼ˆ220px æœ€å°è½¨ + 12px é—´éš™æ¨å‡ºæ¥çš„ç•Œï¼‰ï¼›
      // å•åˆ—å®¹å™¨é‡Œ span 2 ä¼šæ’‘å‡ºéšå¼è½¨é“æŠŠå¸ƒå±€æ’‘çˆ†ï¼Œå¿…é¡»æ’¤æ‰
      "@container (min-width:452px) and (max-width:683px){.mneme-statuscard--vectorwide{grid-column:span 2}}",
      "@container (min-width:452px){.mneme-statuscard--wide{grid-column:span 2}}",
      // çŠ¶æ€é¡µåˆ†ç»„æ ‡é¢˜ï¼ˆåº“å†…ä¸€è§ˆ / åå°è¿è½¬ï¼‰ï¼šåªåšæ‰«è¯»é”šç‚¹ï¼Œå‹å¾—æ¯”å¡ç‰‡æ ‡é¢˜ä½
      ".mneme-statushead{max-width:1000px;margin:0 auto 10px;font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--mneme-fg-dim)}",
      ".mneme-statusgrid+.mneme-statushead{margin-top:26px}",
      ".mneme-statuscard{min-width:0;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:16px 16px 14px}",
      // æŒ‡æ ‡è¡Œï¼šä¸€è¡Œä¸€æŒ‡æ ‡ï¼ˆlabel å·¦ / æ•°å€¼å³ï¼‰ï¼Œå–ä»£ã€ŒÂ·ã€ä¸²è”çš„è¯´æ˜é•¿å¥â€”â€”
      // æ‹¥æŒ¤æ„Ÿçš„æ ¹æºæ˜¯æŠŠå¤šæŒ‡æ ‡å‹è¿›ä¸€æ®µä¼šæ¢è¡Œçš„æ•£æ–‡
      ".mneme-statrows{margin-top:10px;display:flex;flex-direction:column;gap:4px}",
      ".mneme-statrow{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:12px;line-height:17px;color:var(--mneme-fg-dim)}",
      ".mneme-statrow>span:first-child{flex:none;white-space:nowrap}",
      ".mneme-statrow .mneme-heatdot{align-self:center}",
      ".mneme-statrowval{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right}",
      ".mneme-statfoot{margin-top:8px;font-size:11px;line-height:16px;color:var(--mneme-fg-dim)}",
      // çƒ­åº¦åˆ†å¸ƒæ¡ï¼šä¸‰æ¡£å æ¯”ä¸€å›¾çœ‹æ¸…ï¼Œè¡Œæ ‡åªè¡¥æ•°å­—ï¼ˆç±»åå¸¦åŒæ¨ªçº¿ï¼Œä¸ heatdot åŒæ¬¾ï¼‰
      ".mneme-heatbar{display:flex;height:6px;border-radius:3px;overflow:hidden;margin-top:12px;background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-heatbar-seg{min-width:2px}",
      ".mneme-heatbar--hot{background:var(--mneme-warn)}",
      ".mneme-heatbar--warm{background:var(--mneme-fg-dim)}",
      ".mneme-heatbar--cold{background:var(--mneme-graphic-dim)}",
      ".mneme-heatdot{flex:none;width:8px;height:8px;border-radius:50%}",
      ".mneme-heatdot--hot{background:var(--mneme-warn)}",
      ".mneme-heatdot--warm{background:var(--mneme-fg-dim)}",
      ".mneme-heatdot--cold{background:var(--mneme-graphic-dim)}",
      // --- Token å»å‘ä¸‰å±ï¼ˆ2026-10 å¯è§‚æµ‹æ€§æ”¹é€ ï¼‰ï¼šKPI å¸¦ / donut / 7 å¤©æŸ±çŠ¶ / 8 å‘¨çƒ­åŠ› ---
      // KPI å¸¦å›ºå®š 4 åˆ—ã€å®¹å™¨æ”¶çª„é™ 2 åˆ—ï¼šç”¨ @container ä¸ç”¨ @mediaâ€”â€”é¢æ¿åŒæ—¶é•¿åœ¨
      // å®¿ä¸»ä¾§æ ï¼ˆ~500pxï¼‰ä¸ sheetï¼ˆ1240pxï¼‰é‡Œï¼Œå†³å®šå¸ƒå±€çš„æ˜¯å®¹å™¨å®½åº¦è€Œéè§†å£ã€‚
      ".mneme-kpiband{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;max-width:1000px;margin:0 auto 12px}",
      "@container (max-width:560px){.mneme-kpiband{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      ".mneme-tokenflow{max-width:1000px;margin:0 auto 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:16px 16px 14px}",
      ".mneme-donutwrap{display:flex;gap:20px;align-items:center;margin-top:12px}",
      "@container (max-width:480px){.mneme-donutwrap{flex-direction:column;align-items:stretch}.mneme-donutbox{align-self:center}}",
      ".mneme-donutbox{position:relative;flex:none;width:148px;height:148px}",
      ".mneme-donutbox svg{width:100%;height:100%;display:block}",
      ".mneme-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}",
      ".mneme-donut-center b{font-size:19px;font-weight:650;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}",
      ".mneme-donut-center span{font-size:11px;color:var(--mneme-fg-dim);margin-top:1px}",
      // r=15.9155 è®©å‘¨é•¿â‰ˆ100ï¼Œdasharray ç›´æ¥å¡«ç™¾åˆ†æ¯”ï¼›æ®µç¼é  JS ä¾§ç•™ï¼Œè¿™é‡Œåªç®¡è§‚æ„Ÿã€‚
      ".mneme-donut circle.mneme-seg{fill:none;stroke-width:5.6;transition:opacity .15s}",
      ".mneme-donut.has-focus circle.mneme-seg:not(.focused){opacity:.35}",
      ".mneme-seg--1{stroke:var(--mneme-chart-1)}",
      ".mneme-seg--2{stroke:var(--mneme-chart-2)}",
      ".mneme-seg--3{stroke:var(--mneme-chart-3)}",
      ".mneme-seg--4{stroke:var(--mneme-chart-4)}",
      ".mneme-seg--5{stroke:var(--mneme-chart-5)}",
      ".mneme-seg--6{stroke:color-mix(in srgb,var(--dsw-alias-label-primary) 50%,transparent)}",
      ".mneme-legend{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}",
      ".mneme-legendrow{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;cursor:default;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-primary)}",
      ".mneme-legendrow:hover,.mneme-legendrow.focused{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-legendrow.dim{opacity:.45}",
      ".mneme-legenddot{flex:none;width:10px;height:10px;border-radius:3px}",
      ".mneme-dot--1{background:var(--mneme-chart-1)}",
      ".mneme-dot--2{background:var(--mneme-chart-2)}",
      ".mneme-dot--3{background:var(--mneme-chart-3)}",
      ".mneme-dot--4{background:var(--mneme-chart-4)}",
      ".mneme-dot--5{background:var(--mneme-chart-5)}",
      ".mneme-dot--6{background:color-mix(in srgb,var(--dsw-alias-label-primary) 50%,transparent)}",
      ".mneme-legendname{color:var(--dsw-alias-label-primary);white-space:nowrap}",
      ".mneme-legendsub{color:var(--mneme-fg-dim);font-size:11px}",
      ".mneme-legendval{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);white-space:nowrap}",
      ".mneme-legendpct{flex:none;width:46px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:600}",
      ".mneme-bars{position:relative;height:150px;margin-top:14px}",
      ".mneme-gridline{position:absolute;left:0;right:0;border-top:1px dashed var(--dsw-alias-border-l2)}",
      ".mneme-gridlabel{position:absolute;right:0;transform:translateY(-58%);font-size:10px;color:var(--mneme-fg-dim)}",
      ".mneme-barcols{position:absolute;inset:0;display:flex;align-items:flex-end;gap:8px;padding:0 2px}",
      ".mneme-barcol{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%}",
      ".mneme-bar{border-radius:5px 5px 2px 2px;background:var(--mneme-accent);min-height:2px;transition:opacity .15s}",
      ".mneme-barcol:hover .mneme-bar{opacity:.8}",
      ".mneme-barlabels{display:flex;gap:8px;padding:6px 2px 0}",
      ".mneme-barlabels span{flex:1;min-width:0;text-align:center;font-size:10.5px;color:var(--mneme-fg-dim);font-variant-numeric:tabular-nums}",
      // GitHub è´¡çŒ®å›¾å¼ç´§å‡‘ç½‘æ ¼ï¼ˆå¤éªŒç¬¬ä¸‰è½®ã€Œé—´è·å¤ªå¤§ã€ï¼‰ï¼š11px æ ¼ + 2px ç¼ï¼›
      // heatrows æ˜¯å·¦ä¾§æ˜ŸæœŸæ ‡ç­¾åˆ—ï¼ˆä¸€/ä¸‰/äº”ï¼‰ï¼Œheatmonths æ˜¯é¡¶éƒ¨æœˆä»½æ ‡ç­¾è¡Œ
      // ï¼ˆåˆ—ä¸»åºç½‘æ ¼ä¸‹æœˆä»½è¡Œé¡»ä¸æ ¼å­åˆ—å¯¹é½ï¼Œæ‰€ä»¥åŒç”¨ auto-flow:columnï¼‰ã€‚
      ".mneme-heatgrid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,11px);gap:2px;margin-top:12px}",
      ".mneme-heatcell{width:11px;height:11px;border-radius:2px;background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-heatwrap{display:flex;gap:4px}",
      ".mneme-heatrows{display:grid;grid-template-rows:repeat(7,11px);gap:2px;margin-top:12px;font-size:9.5px;line-height:11px;color:var(--mneme-fg-dim);text-align:right}",
      ".mneme-heatmonths{display:grid;grid-auto-flow:column;grid-auto-columns:11px;gap:2px;margin-top:0;font-size:9.5px;line-height:14px;color:var(--mneme-fg-dim)}",
      // ç±»åç¼–å·=è§†è§‰æ¡£ä½ï¼ˆl1 æœ€æµ…â€¦l4 æœ€æ·±ï¼‰ï¼Œå˜é‡ç¼–å·=business å æ¯”é™åºï¼Œæ•…äº¤å‰å¼•ç”¨ã€‚
      ".mneme-heatcell.l1{background:var(--mneme-heat-4)}",
      ".mneme-heatcell.l2{background:var(--mneme-heat-3)}",
      ".mneme-heatcell.l3{background:var(--mneme-heat-2)}",
      ".mneme-heatcell.l4{background:var(--mneme-heat-1)}",
      ".mneme-heatlegend{display:flex;align-items:center;gap:3px;margin-top:8px;font-size:10.5px;color:var(--mneme-fg-dim)}",
      ".mneme-heatlegend .mneme-heatcell{width:10px;height:10px}",
      // åŸ 9 å¡é™çº§æŠ˜å åŒºï¼šé»˜è®¤æ”¶èµ·ï¼Œå±•å¼€æ‰æŒ‚è½½å­å¡ï¼ˆè§ TokenFlowSection æ³¨é‡Šï¼‰ã€‚
      ".mneme-legacy{max-width:1000px;margin:0 auto 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 16px}",
      ".mneme-legacy summary{cursor:pointer;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}",
      // --- çŠ¶æ€é¡µå·¥ä½œå°ï¼šè®©ç”¨æˆ·çœ‹è§æ’ä»¶åœ¨å¹²æ´»ï¼ˆåŠ¨æ€/æ²‰æ·€/å½’æ¡£ï¼‰ ---
      ".mneme-wbhead{margin:28px auto 10px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);max-width:1000px;display:flex;align-items:baseline;justify-content:space-between;gap:8px}",
      ".mneme-wblist{max-width:1000px;display:flex;flex-direction:column;gap:6px}",
      ".mneme-wbrow{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px}",
      ".mneme-wbdot{flex:none;width:8px;height:8px;border-radius:50%;margin-top:6px;background:var(--mneme-ok)}",
      ".mneme-wbdot--err{background:var(--mneme-danger)}",
      ".mneme-wbmain{min-width:0;flex:1}",
      ".mneme-wbtitle{font-size:13px;line-height:19px;color:var(--dsw-alias-label-primary)}",
      ".mneme-wbsub{font-size:12px;line-height:17px;color:var(--mneme-fg-dim);margin-top:1px}",
      ".mneme-wbmemo{display:flex;gap:10px;align-items:center;padding:10px 14px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px}",
      ".mneme-wbmemo .mneme-xdot{flex:none}",
      ".mneme-wbmemo-main{min-width:0;flex:1}",
      ".mneme-statusnum{font-size:24px;font-weight:600;line-height:32px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}",
      ".mneme-statuscap{margin-top:4px;font-size:13px;line-height:19px;color:var(--mneme-fg-dim);word-break:break-word}",
      // --- destructive actions: red outline = delete, solid red = confirm ---
      ".mneme-btndanger{color:var(--mneme-danger);border-color:var(--mneme-danger)}",
      ".mneme-btndanger:hover{background:color-mix(in srgb,var(--mneme-danger) 12%,transparent)}",
      ".mneme-btndangerconfirm{background:var(--mneme-danger);border-color:var(--mneme-danger);color:var(--dsw-alias-bg-layer-1)}",
      ".mneme-btndangerconfirm:hover{filter:brightness(.9)}",
      // --- settings cards: boxed cards for the runtime-mode and external-API
      // sections â€” each card owns its fetch/PUT state, so it renders as a
      // self-contained unit inside the stacked settings view ---
      ".mneme-set-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:16px;margin-bottom:10px}",
      // è®¾ç½®é¡µåˆ†ç»„æ ‡é¢˜ï¼ˆä¸ªæ€§åŒ– / è®°å¿†å¼•æ“ / æœç´¢ / è¿æ¥ä¸å®‰å…¨ / å¸®åŠ©ï¼‰ï¼š
      // å…ˆç»™ã€Œè¿™ä¸€æ®µåœ¨ç®¡ä»€ä¹ˆã€ï¼Œå¡ç‰‡æ‰æ˜¯å…·ä½“é€‰é¡¹
      ".mneme-set-grouphead{font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--mneme-fg-dim);margin:24px 0 10px}",
      ".mneme-set-grouphead:first-child{margin-top:8px}",
      ".mneme-set-token{font-family:monospace;font-size:12px;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary);word-break:break-all;user-select:all}",
      ".mneme-set-hint{font-size:12px;color:var(--mneme-fg-dim)}",
      // --- é‡è¦æ€§ç¼–è¾‘è¡Œï¼šä¸æŸ¥çœ‹æ€åŒä¸€ä»½ Lucide æ˜Ÿå½¢ï¼ˆæ­¤å‰æ˜¯æ–‡æœ¬æ˜Ÿå·ä¸‹æ‹‰ï¼Œè§’æ›´å°–é”ä¸”ä¸å…¶ä»–æ˜Ÿä¸ç»Ÿä¸€ï¼‰ ---
      ".mneme-staredit{display:inline-flex;align-items:center;gap:1px;justify-self:start}",
      ".mneme-starbtn{border:none;background:none;cursor:pointer;padding:2px 1px;display:inline-flex;color:var(--dsw-alias-label-secondary);transition:transform .12s}",
      ".mneme-starbtn--on{color:var(--mneme-warn)}",
      ".mneme-starbtn:hover{transform:scale(1.12)}",
      ".mneme-starbtn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px;border-radius:4px}",
      // --- æ„è§ä¸åé¦ˆï¼šå›¾æ ‡è¡Œ + ç‰ˆæœ¬ footerï¼Œæ”¶åœ¨è®¾ç½®é¡µæœ«å°¾å½“ã€Œå…³äºã€ç”¨ ---
      ".mneme-feedlist{display:flex;flex-direction:column;gap:4px}",
      ".mneme-feedrow{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-radius:10px;text-decoration:none;transition:background .12s}",
      ".mneme-feedrow:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-feedico{flex:none;width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}",
      ".mneme-feedrow:hover .mneme-feedico{background:var(--dsw-alias-interactive-bg-active)}",
      ".mneme-feedtext{display:flex;flex-direction:column;gap:1px;min-width:0}",
      ".mneme-feedname{font-size:13px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-primary)}",
      ".mneme-feedsub{font-size:12px;line-height:17px;color:var(--mneme-fg-dim)}",
      ".mneme-set-foot{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:12px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1);font-size:12px;color:var(--mneme-fg-dim)}",
      // --- å­˜å‚¨å›æ”¶å¡ï¼ˆ#386 ç¬¬ 4 æ¡ï¼‰ï¼šæ§åˆ¶è¡Œ + ä¸¤æ­¥ç¡®è®¤çš„è­¦å‘Šå— ---
      ".mneme-maintrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}",
      ".mneme-maintlbl{flex:none;font-size:12px;line-height:17px;color:var(--mneme-fg-dim)}",
      ".mneme-maintrow .mneme-set-input{flex:none;width:96px;margin-bottom:0}",
      ".mneme-maintcheck{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;line-height:19px;color:var(--dsw-alias-label-primary)}",
      ".mneme-maintwarn{margin-top:12px;padding:10px 12px;border-radius:10px;border:1px solid color-mix(in srgb,var(--mneme-danger) 45%,transparent);background:color-mix(in srgb,var(--mneme-danger) 8%,transparent)}",
      ".mneme-maintwarnhead{font-size:13px;line-height:19px;font-weight:600;color:var(--mneme-danger)}",
      ".mneme-maintresult{margin-top:12px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}",
      ".mneme-maintresulthead{font-size:13px;line-height:19px;font-weight:600;color:var(--mneme-ok)}",
      ".mneme-mainterr{margin-top:10px;font-size:12px;line-height:17px;color:var(--mneme-danger)}",
      // --- v0.9.0 M.O.ï¼ˆbetaï¼‰---------------------------------------------
      // è¯­ä¹‰è‰²å±‚ç¬¬äºŒä»½ï¼šæµ®å±‚é¢æ¿ï¼ˆportal åˆ° bodyï¼‰ã€å³æ  paneã€é€€åŒ– sheetã€
      // å¯¹è¯è¡Œç»“ç®—å¡éƒ½ä¸åœ¨åŸå››ä¸ªæ¸²æŸ“æ ¹ä¹‹ä¸‹ã€‚contrast.test.js å¯¹åŸå››æ ¹é€‰æ‹©å™¨
      // åšç²¾ç¡®åŒ¹é…é”ï¼Œæ‰€ä»¥è¿™é‡Œå¦èµ·ä¸€æ¡è§„åˆ™ã€å–å€¼é€å­—ç›¸åŒï¼Œä¸”å¿…é¡»æ’åœ¨å…¶å
      // ï¼ˆæµ‹è¯•æŒ‰é¦–æ¬¡å‡ºç°æŠ“å– --mneme-* å®šä¹‰ï¼‰ã€‚å¼•ç”¨çš„å®¿ä¸» token å…¨éƒ¨åœ¨
      // test/contrast.test.js çš„ HOST_TOKENS å¿«ç…§é‡Œï¼Œä¸è®¸æ–°å¢åå­—ã€‚
      ".mneme-pipe,.mneme-pipeview,.mneme-pipe-settle,.mneme-pipe-root{" +
        "--mneme-fg-dim:color-mix(in srgb,var(--dsw-alias-label-primary) 60%,transparent);" +
        "--mneme-graphic-dim:color-mix(in srgb,var(--dsw-alias-label-primary) 50%,transparent);" +
        "--mneme-accent:color-mix(in srgb,var(--dsw-alias-state-business-primary) 85%,var(--dsw-alias-label-primary));" +
        "--mneme-danger:color-mix(in srgb,var(--dsw-alias-state-error-primary) 80%,var(--dsw-alias-label-primary));" +
        "--mneme-warn:color-mix(in srgb,var(--dsw-static-amber-600,#dd8629) 65%,var(--dsw-alias-label-primary));" +
        "--mneme-ok:color-mix(in srgb,var(--dsw-static-green-500,#22c55e) 65%,var(--dsw-alias-label-primary))" +
      "}",
      // ä¼šè¯å¤´ triggerï¼šä¸ Agent Teams åŒè§„æ ¼ï¼ˆ28px è¡Œé«˜ã€12px å­—å·ï¼‰ï¼Œ
      // é¡µå¤´çª„å®¹å™¨ä¸‹æ–‡å­—æ ‡ç­¾éšè—ã€é™çº§çº¯å›¾æ ‡ã€‚
      ".mneme-pipe-root{position:relative;display:inline-flex}",
      ".mneme-pipe-trigger{min-height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;align-items:center;gap:5px;padding:3px 7px;font-family:inherit;font-size:12px;display:inline-flex}",
      ".mneme-pipe-trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-pipe-trigger:focus-visible{color:var(--dsw-alias-label-primary);outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}",
      ".mneme-pipe-triggerLabel{white-space:nowrap}",
      "@container (width<=480px){.mneme-pipe-triggerLabel{display:none}}",
      ".mneme-pipe-dot{flex:none;min-width:14px;height:14px;border-radius:7px;padding:0 3px;background:color-mix(in srgb,var(--mneme-warn) 14%,transparent);color:var(--dsw-alias-label-primary);font-size:10px;line-height:14px;font-weight:600;font-variant-numeric:tabular-nums;text-align:center}",
      // æµ®å±‚é¢æ¿ï¼šå‡ ä½•æŠ„ Agent Teamsï¼ˆmin(500px,100vw-32px) / 12px åœ†è§’ /
      // fixed å®šä½ç”± useAnchoredPosition ç»™å‡ºï¼‰ã€‚é˜´å½±ç”¨ä¸­æ€§ rgbaï¼šå®¿ä¸»çš„
      // elevation token ä¸åœ¨é¢æ¿ token å¿«ç…§ç™½åå•é‡Œï¼Œä¸èƒ½å¼•ç”¨ã€‚
      ".mneme-pipe-panel{z-index:100;box-sizing:border-box;width:min(500px,100vw - 32px);max-height:min(680px,100vh - 32px);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;padding:0;display:flex;position:fixed;overflow:hidden;background:var(--dsw-alias-bg-layer-1);box-shadow:0 8px 28px rgba(0,0,0,0.28);color:var(--dsw-alias-label-primary)}",
      ".mneme-pipe-head{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px 8px 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
      ".mneme-pipe-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);display:inline-flex;align-items:center;gap:6px;min-width:0}",
      ".mneme-pipe-beta{flex:none;font-size:11px;line-height:16px;font-weight:600;color:var(--mneme-warn);border:1px solid color-mix(in srgb,var(--mneme-warn) 55%,transparent);border-radius:6px;padding:0 6px}",
      // å†…æµ‹å…è´£ï¼šç•Œé¢å¸¸é©»ä¸€è¡Œï¼Œã€Œå€™é€‰ã€æ˜¯å¯è§çŠ¶æ€è¯ä¸æ˜¯ tooltipã€‚
      ".mneme-pipe-notice{flex:none;display:flex;gap:6px;align-items:flex-start;padding:7px 14px 0;font-size:12px;line-height:17px;color:var(--mneme-fg-dim)}",
      ".mneme-pipe-scope{flex:none;font-size:11px;line-height:16px;color:var(--mneme-fg-dim)}",
      // è¿è¡Œæ¡£ä½ï¼šä¸€æ¬¡è¿è¡Œä¸€ä¸ªèŠ¯ç‰‡ï¼›å¤±è´¥/è¢«æ¨ç¿»çš„è¿è¡Œç…§å¸¸åˆ—å‡ºï¼ˆç•™ç—•ï¼‰ã€‚
      ".mneme-pipe-runs{flex:none;display:flex;gap:6px;flex-wrap:wrap;padding:6px 14px 2px}",
      ".mneme-pipe-run{border:1px solid var(--dsw-alias-border-l2);background:0 0;border-radius:8px;cursor:pointer;color:var(--mneme-fg-dim);font-family:inherit;font-size:12px;line-height:16px;padding:2px 8px;display:inline-flex;gap:6px;align-items:center}",
      ".mneme-pipe-run:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-pipe-run:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}",
      ".mneme-pipe-run.mneme-on{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent)}",
      ".mneme-pipe-runDot{flex:none;width:8px;height:8px;border-radius:4px}",
      ".mneme-pipe-runDot--ok{background:var(--mneme-ok)}",
      ".mneme-pipe-runDot--failed{background:var(--mneme-warn)}",
      ".mneme-pipe-runDot--refuted{background:var(--mneme-danger)}",
      // å›¾ï¼šå®½æ€ SVG åˆ†å±‚ DAGï¼ˆtrace viewer è¯»æ³•ï¼‰ï¼Œçª„æ€æ•´å—æ¢æˆç«–æ’åˆ—è¡¨ã€‚
      // é«˜åº¦ä¸‹é™ï¼šflex:1 çš„åŸºå‡†æ˜¯ 0ï¼Œåªè¦æŸä¸€å±‚ç¥–å…ˆæ²¡æœ‰ç¡®å®šé«˜åº¦ï¼ˆæµ®å±‚ä¸å±…ä¸­ sheet éƒ½æ˜¯ max-height
      // å°é¡¶ï¼‰ï¼Œåˆ†åˆ°çš„å°±æ˜¯ 0 åƒç´ â€”â€”ç”»å¸ƒã€Œåœ¨ DOM é‡Œã€ä½†çœ‹ä¸è§ã€ã€‚ä¸‹é™ä¸ä¿®å¤æˆå› ï¼Œåªä¿è¯æœ€åæƒ…å†µä¸‹
      // è¿˜èƒ½çœ‹è§å›¾ï¼›è¿™è·Ÿä¸Šé¢é‚£æ¡æ’è½¦æ˜¯ä¸¤ä»¶äº‹ï¼Œåˆ«æŠŠä»»ä½•ä¸€æ¡å½“æˆå¦ä¸€æ¡çš„ä¿®å¤ã€‚
      ".mneme-pipe-graph{flex:1;min-height:220px;overflow:auto;padding:4px 8px 2px}",
      // ç¼©æ”¾æ¡ä¸ç¼©æ”¾å®¹å™¨ã€‚ç”»å¸ƒæœ¬èº«æ˜¯ width:100% çš„ SVGï¼Œæ‰€ä»¥ã€Œç¼©æ”¾ã€= æ”¹å¤–å±‚å®¹å™¨çš„ç™¾åˆ†æ¯”å®½åº¦ï¼š
      // 100% å°±æ˜¯é€‚åº”æ å®½ï¼Œæ”¾å¤§åˆ™å®¹å™¨æ¯”æ å®½ï¼Œæ»šåŠ¨æ¡è‡ªå·±å‡ºæ¥â€”â€”å¹³ç§»ä¸å¿…å¦å†™ä¸€å¥—ã€‚
      ".mneme-pipe-zoombar{flex:none;display:flex;align-items:center;gap:6px;padding:5px 12px 0;font-size:12px;color:var(--mneme-fg-dim)}",
      ".mneme-pipe-zoombtn{border:1px solid var(--dsw-alias-border-l2);background:0 0;border-radius:6px;cursor:pointer;color:var(--mneme-fg-dim);font-family:inherit;font-size:12px;line-height:16px;padding:1px 7px}",
      ".mneme-pipe-zoombtn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-pipe-zoombtn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}",
      ".mneme-pipe-zoomval{min-width:40px;text-align:right;font-variant-numeric:tabular-nums}",
      ".mneme-pipe-zoomwrap{min-width:0}",
      ".mneme-pipe-svg{display:block;width:100%;height:auto}",
      ".mneme-pipe-edge{stroke:var(--mneme-graphic-dim);fill:none;stroke-width:1.5}",
      ".mneme-pipe-edgeOn{stroke:var(--mneme-accent);fill:none;stroke-width:2.5}",
      ".mneme-pipe-edgeFail{stroke:var(--mneme-danger);fill:none;stroke-width:2;stroke-dasharray:5 3}",
      // èŠ‚ç‚¹å½¢çŠ¶æŒ‰ kind åŒºåˆ†ï¼ˆstep çŸ©å½¢ / gate è±å½¢ / branch åœ†è§’ / artifact èƒ¶å›Šï¼‰ï¼Œ
      // çŠ¶æ€èµ°æè¾¹+å¡«å……ï¼šrefuted æ˜¯å…¨ç¯‡æ ¸å¿ƒä¿¡å·ï¼ŒåŒä»½å±é™©è‰²æœ€æ‰çœ¼ã€‚
      ".mneme-pipe-node{fill:var(--dsw-alias-bg-layer-2);stroke:var(--mneme-graphic-dim);stroke-width:1.2}",
      ".mneme-pipe-node--trusted{stroke:var(--mneme-ok);stroke-width:1.6}",
      ".mneme-pipe-node--candidate{stroke:var(--mneme-graphic-dim)}",
      ".mneme-pipe-node--stale{stroke:var(--dsw-alias-border-l2);stroke-dasharray:3 2;fill:var(--dsw-alias-bg-base)}",
      ".mneme-pipe-node--refuted{stroke:var(--mneme-danger);stroke-width:2;fill:color-mix(in srgb,var(--mneme-danger) 10%,transparent)}",
      ".mneme-pipe-node--onpath{stroke:var(--dsw-alias-state-business-primary);stroke-width:2}",
      ".mneme-pipe-nodeT{fill:var(--dsw-alias-label-primary);font-size:11px;font-weight:600}",
      ".mneme-pipe-nodeS{fill:var(--mneme-fg-dim);font-size:9.5px}",
      ".mneme-pipe-nodeK{fill:var(--mneme-fg-dim);font-size:9px}",
      // å›¾ä¾‹ï¼šå››ä¸ªçŠ¶æ€ + é—¸é—¨æœ‰æ— ï¼ˆcounterfactual null = ç©ºå¿ƒåœˆã€Œè¿˜æ²¡é—¸é—¨ã€ï¼‰ã€‚
      ".mneme-pipe-legend{flex:none;display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:2px 14px 8px;font-size:11px;line-height:16px;color:var(--mneme-fg-dim)}",
      ".mneme-pipe-pill{flex:none;border-radius:6px;padding:0 6px;font-size:11px;line-height:18px;font-weight:600;border:1px solid transparent}",
      ".mneme-pipe-pill--candidate{color:var(--mneme-fg-dim);border-color:var(--dsw-alias-border-l2)}",
      ".mneme-pipe-pill--trusted{color:var(--mneme-ok);border-color:color-mix(in srgb,var(--mneme-ok) 45%,transparent)}",
      ".mneme-pipe-pill--stale{color:var(--mneme-fg-dim);border-color:var(--dsw-alias-border-l2);border-style:dashed}",
      ".mneme-pipe-pill--refuted{color:var(--mneme-danger);border-color:color-mix(in srgb,var(--mneme-danger) 55%,transparent);background:color-mix(in srgb,var(--mneme-danger) 10%,transparent)}",
      ".mneme-pipe-gate{flex:none;width:10px;height:10px;border-radius:5px;border:1.5px solid var(--mneme-graphic-dim)}",
      ".mneme-pipe-gate--has{border-color:var(--mneme-ok);background:var(--mneme-ok)}",
      // é˜¶æ®µå¸¦ï¼ˆ2026-10-16ï¼‰ï¼šæ®µåº•ç”¨å®¿ä¸» hover å±‚è€Œä¸æ˜¯è‡ªé€ è‰²â€”â€”å¯¹æ¯”åº¦é”ä¸è®¤è¯†
      // ã€ŒSVG æ–‡å­—åº•ä¸‹è¿˜æœ‰ä¸€å±‚ rectã€ï¼Œæ‰€ä»¥æ®µåº•å¿…é¡»æ·¡åˆ°ä¸å‚ä¸æ–‡å­—å¯¹æ¯”åº¦ã€‚
      ".mneme-pipe-bandbg{fill:var(--dsw-alias-interactive-bg-hover)}",
      ".mneme-pipe-bandline{stroke:var(--dsw-alias-border-l2);stroke-width:1}",
      ".mneme-pipe-bandT{fill:var(--dsw-alias-label-primary);font-size:12px;font-weight:600}",
      // é—¸é—¨èŠ‚ç‚¹ä¸é£é™©æ¡ï¼šé¢œè‰²åªåšå†—ä½™ï¼Œä¿¡æ¯æœ¬ä½“åœ¨æ–‡æœ¬ï¼ˆé—¸ / R0-R3ï¼‰é‡Œâ€”â€”
      // ä¸è®¸é å•ä¸€è‰²ç›¸åŒºåˆ†ï¼ˆAGENTS.md è‡ªæŸ¥æ¸…å•ç¬¬ 9 æ¡ï¼‰ã€‚
      ".mneme-pipe-node--gate{stroke:var(--mneme-warn);stroke-width:2}",
      ".mneme-pipe-gatetag{fill:var(--mneme-warn);font-size:9px;font-weight:600}",
      ".mneme-pipe-risk--r0{stroke:var(--mneme-graphic-dim)}",
      ".mneme-pipe-risk--r1{stroke:var(--mneme-accent)}",
      ".mneme-pipe-risk--r2{stroke:var(--mneme-warn)}",
      ".mneme-pipe-risk--r3{stroke:var(--mneme-danger)}",
      // æµç¨‹æ¦‚è§ˆå¸¦ï¼šè¯»æŠ•å½±é‡Œ pipeline.done ä¸ pipeline.triggerï¼Œå›ç­”ã€Œè¿™æ¡æµç¨‹
      // åœ¨å¹²ä»€ä¹ˆã€ä½•æ—¶èµ·è·‘ã€ã€‚æ­£æ–‡ç”¨ label-secondaryï¼ˆä¸èŠ‚ç‚¹è¯¦æƒ…å±åŒæ¡£ï¼‰ã€‚
      ".mneme-pipe-overview{flex:none;padding:8px 14px 6px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary);display:flex;flex-direction:column;gap:3px}",
      // èŠ‚ç‚¹è¯¦æƒ…ï¼ˆå®½æ€ç‚¹é€‰å±•å¼€ / çª„æ€ details æ‰‹é£ç´å…±ç”¨ï¼‰ã€‚
      ".mneme-pipe-detail{flex:none;border-top:1px solid var(--dsw-alias-border-l1);padding:8px 14px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);max-height:180px;overflow:auto}",
      ".mneme-pipe-detailTitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:2px}",
      ".mneme-pipe-dt{font-weight:600;color:var(--mneme-fg-dim)}",
      ".mneme-pipe-cf{margin-top:4px;padding:4px 8px;border-radius:8px;background:color-mix(in srgb,var(--mneme-ok) 10%,transparent);color:var(--dsw-alias-label-secondary)}",
      ".mneme-pipe-cf--none{background:0 0;border:1px dashed var(--dsw-alias-border-l2);color:var(--mneme-fg-dim)}",
      // çª„æ€ï¼ˆbetter-sidebar ~500px / æµ®å±‚å†…ï¼‰ï¼šèŠ‚ç‚¹ç«–æ’åˆ—è¡¨åŒ–ï¼Œè¾¹æ”¶æˆ
      // å·¦ä¾§è½¨é“çº¿ + ã€Œä¾èµ–ã€èŠ¯ç‰‡â€”â€”æ¢å¸ƒå±€ï¼Œä¸æ˜¯ç¼©æ”¾ã€‚
      ".mneme-pipe-list{flex:1;min-height:180px;overflow:auto;padding:4px 12px 8px}",
      ".mneme-pipe-item{position:relative;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-2);padding:8px 10px 8px 30px;margin:0 0 10px}",
      ".mneme-pipe-item::before{content:\"\";position:absolute;left:13px;top:-10px;height:10px;border-left:2px solid var(--mneme-graphic-dim)}",
      ".mneme-pipe-item:first-child::before{display:none}",
      ".mneme-pipe-itemDot{position:absolute;left:8px;top:12px;width:10px;height:10px;border-radius:5px;border:2px solid var(--mneme-graphic-dim);background:var(--dsw-alias-bg-layer-2)}",
      ".mneme-pipe-itemDot--trusted{border-color:var(--mneme-ok)}",
      ".mneme-pipe-itemDot--stale{border-style:dashed;border-color:var(--dsw-alias-border-l2)}",
      ".mneme-pipe-itemDot--refuted{border-color:var(--mneme-danger);background:var(--mneme-danger)}",
      ".mneme-pipe-itemDot--onpath{border-color:var(--dsw-alias-state-business-primary)}",
      ".mneme-pipe-itemName{font-size:13px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary)}",
      ".mneme-pipe-itemName--refuted{color:var(--mneme-danger)}",
      ".mneme-pipe-itemMeta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:2px;font-size:11px;line-height:16px;color:var(--mneme-fg-dim)}",
      ".mneme-pipe-dep{font-size:11px;color:var(--mneme-fg-dim)}",
      ".mneme-pipe-item summary{cursor:pointer;list-style:none}",
      ".mneme-pipe-item summary::-webkit-details-marker{display:none}",
      ".mneme-pipëmyÚÚ$z{-®éÜj×¦‚•·6÷W&6UÒóò7G&–ær‡6÷W&6R“°Ğ§ĞĞ Ğ¢ò¢ Ğ¢¢‡VÖâG'W7BÆ&VÂàĞ¢¢&Ò·7G&–æwÒG'W7BÒG'W7BàĞ¢¢&Ò²w¦‚wÂvVâwÒÆærÒÆæwVvRàĞ¢¢&WGW&ç2·7G&–æwÒÆ&VÂàĞ¢¢ğĞ¦gVæ7F–öâG'W7DÆ&VÂ‡G'W7BÂÆær’°Ğ¢6öç7B¦‚Ò²G'W7FVC¢~XúşKúiÚ^k©rÂ&÷VæFVC¢~Xù~™™KØîKúK»²rÂFÖ–ã¢~zêynYzîŠêBrÂVçG'W7FVC¢~KˆŞXúşKúrÓ°Ğ¢6öç7BVâÒ²G'W7FVC¢uG'W7FVB6÷W&6RrÂ&÷VæFVC¢t&÷VæFVBÂÆ÷rG'W7BrÂFÖ–ã¢tFÖ–â6öæf—&ÖVBrÂVçG'W7FVC¢uVçG'W7FVBrÓ°Ğ¢&WGW&â†ÆærÓÓÒvVâròVâ¢¦‚•·G'W7EÒóò7G&–ær‡G'W7B“°Ğ§ĞĞ Ğ¢ò¢ Ğ¢¢7F&ÆR&Wf–WrW‡ÆæF–öâg&öÒ†÷7B&Wf–Wr&W7öç6RàĞ¢¢&Òµ&V6÷&CÇ7G&–ærÂç“çÒ&Wf–WrÒ&Wf–Wr&W7öç6RàĞ¢¢&Ò²w¦‚wÂvVâwÒÆærÒÆæwVvRàĞ¢¢&WGW&ç2·7G&–æwÒFW‡BàĞ¢¢ğĞ¦gVæ7F–öâ&Wf–WuFW‡B‡&Wf–WrÂÆær’°Ğ¢–b‚&Wf–Wr’&WGW&ârs°Ğ¢6öç7B&Vf÷&RÒ&Wf–Wræ&Vf÷&Róò·Ó°Ğ¢6öç7BgFW"Ò&Wf–WrægFW"óò·Ó°Ğ¢–b†ÆærÓÓÒvVâr’°Ğ¢&WGW&â&VF–7FVBgFW"öæRWfVçC¢ÖööBG·6–væVB†&Vf÷&RæÖööB—Ò(i"G·6–væVB†gFW"æÖööB—ÒÂVæW&w’G¶&Vf÷&RæVæW&w—Ò(i"G¶gFW"æVæW&w—ÒÂ7W&–÷6—G’G¶&Vf÷&Ræ7W&–÷6—G—Ò(i"G¶gFW"æ7W&–÷6—G—ÒâF†—2&Wf–WrFöW2æ÷Bw&—FRF†RFF&6Ræ°Ğ¢ĞĞ¢&WGW&âXÙ^KŠ®K¨¾K»nYîy¨Nš(NŠêXùXÉnûÉ®[ø>h8RG·6–væVB†&Vf÷&RæÖööB—Ò(i"G·6–væVB†gFW"æÖööB—ŞûÈÎ{+îX©²G¶&Vf÷&RæVæW&w—Ò(i"G¶gFW"æVæW&w—ŞûÈÎZ[ŞZXrG¶&Vf÷&Ræ7W&–÷6—G—Ò(i"G¶gFW"æ7W&–÷6—G—Ş8.š(NŠxKˆŞKÉ®XiXZ^i[hÚî[©>8&°Ğ§ĞĞ Ğ Ğ¦6öç7Bå2ÒvÖFWW2×7FFRs°Ğ¦6öç7B•õ$ôõBÒrö’öÖFWW2×7FFRs°Ğ¦6öç7BUdTåEõE•U2Ò°Ğ¢vÖVæ–ævgVÅö–çFW&7F–öârÀĞ¢vW‡Æ÷&F–öåö6ö×ÆWFVBrÀĞ¢v¶æ÷vÆVFvUöv–æVBrÀĞ¢vF–ff–7VÇG’rÀĞ¢vÆ–fUö6ö×ÆWFVBrÀĞ¢vÆ–fUöf–ÆVBrÀĞ¢vÖVÖ÷'•÷&VfW&Væ6RrÀĞ¥Ó°Ğ Ğ¦6öç7B552Ò Ğ¥¶FFÖÖFWW2×7FFU×²ÒÖÒ×7FFRÖ66VçC¢3&cV&V²ÒÖÒ×7FFRÖ66VçB×7G&öæs¢3#CCv3s²ÒÖÒ×7FFRÖöâÖ66VçC¢6fffffc¶&÷‚×6—¦–æs¦&÷&FW"Ö&÷ƒ¶Ö‚×v–GFƒ£S¶Ö–â×v–GFƒ£¶6öÆ÷#§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×&–Ö'’Â3c#3#’“¶föçB×6—¦S£7ƒ¶Æ–æRÖ†V–v‡C£ãcS·FF–æs£#Gƒ¶6öçF–æW"×G—S¦–æÆ–æR×6—¦S¶6öçF–æW"ÖæÖS¦ÖFWW2×7FFRÖ6öç6öÆWĞĞ¥¶FFÖÖFWW2×7FFUÒ§¶&÷‚×6—¦–æs¦&÷&FW"Ö&÷‡ĞĞ¥¶FFÖÖFWW2×7FFUÒƒ'¶Ö&v–ã£¶föçB×6—¦S£#'ƒ¶Æ–æRÖ†V–v‡C£ã3¶föçB×vV–v‡C£c¶ÆWGFW"×76–æs¢Òã'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒƒ7¶Ö&v–ã£‡ƒ¶föçB×6—¦S£Wƒ¶Æ–æRÖ†V–v‡C£ãC¶föçB×vV–v‡C£cĞĞ¥¶FFÖÖFWW2×7FFUÒ¶Ö&v–ã£‡‚ĞĞ¥¶FFÖÖFWW2×7FFUÒ6ÖÆÇ¶F—7Æ“¦&Æö6³¶÷6—G“¢ãs#¶föçB×6—¦S£'ƒ¶Æ–æRÖ†V–v‡C£ãSWĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöç¶föçC¦–æ†W&—C¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3SR“¶&÷&FW"×&F—W3£—ƒ·FF–æs£w‚'ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3†3†3†3‚“¶6öÆ÷#¦–æ†W&—C¶7W'6÷#§ö–çFW#¶Ö‚×v–GFƒ£WĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖG7rÖÆ–2Ö&÷&FW"×&–Ö'’Â3†3†3†3“’—ĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöã¦fö7W2×f—6–&ÆRÅ¶FFÖÖFWW2×7FFUÒ–çWC¦fö7W2×f—6–&ÆRÅ¶FFÖÖFWW2×7FFUÒ6VÆV7C¦fö7W2×f—6–&ÆRÅ¶FFÖÖFWW2×7FFUÒ7VÖÖ'“¦fö7W2×f—6–&ÆW¶÷WFÆ–æS£7‚6öÆ–Bf"‚ÒÖÒ×7FFRÖ66VçB“¶÷WFÆ–æRÖöfg6WC£'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöã¦F—6&ÆVG¶÷6—G“¢ãCS¶7W'6÷#¦æ÷BÖÆÆ÷vVGĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöâç&–Ö'—¶&6¶w&÷VæC§f"‚ÒÖÒ×7FFRÖ66VçB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB“¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖöâÖ66VçB—ĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöâç&–Ö'“¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖÒ×7FFRÖ66VçB×7G&öær“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB×7G&öær“¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖöâÖ66VçB—ĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöâæFævW'¶&÷&FW"Ö6öÆ÷#¢6C“S3Fc““¶6öÆ÷#¢63“3&7ĞĞ¥¶FFÖÖFWW2×7FFUÒ'WGFöâæv†÷7G¶&6¶w&÷VæC§G&ç7&VçGĞĞ¥¶FFÖÖFWW2×7FFUÒçF÷&'¶F—7Æ“¦fÆWƒ¶v£'ƒ¶Æ–vâÖ—FV×3¦fÆW‚×7F'C¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶fÆW‚×w&§w&¶Ö&v–âÖ&÷GFöÓ£‡ĞĞ¥¶FFÖÖFWW2×7FFUÒçF÷&"ç7V'¶÷6—G“¢ãs#¶Ö&v–â×F÷£'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ6†—2Å¶FFÖÖFWW2×7FFUÒæ7F–öç2Å¶FFÖÖFWW2×7FFUÒçF'7¶F—7Æ“¦fÆWƒ¶v£‡ƒ¶fÆW‚×w&§w&¶Æ–vâÖ—FV×3¦6VçFW'ĞĞ¥¶FFÖÖFWW2×7FFUÒæ6†—7¶Ö&v–ã£‡‚G‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ6†—¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶v£Wƒ¶Æ–vâÖ—FV×3¦6VçFW#·FF–æs£7‚‡ƒ¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3†3†3†3#“¶föçB×6—¦S£'ƒ¶Ö‚×v–GFƒ£S¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¥¶FFÖÖFWW2×7FFUÒæ6†—æö·¶&6¶w&÷VæC¢3&S–SV###¶6öÆ÷#¦–æ†W&—GĞĞ¥¶FFÖÖFWW2×7FFUÒæ6†—çv&ç¶&6¶w&÷VæC¢6C“–&##gĞĞ¥¶FFÖÖFWW2×7FFUÒæ6†—æ&G¶&6¶w&÷VæC¢6C“S3Fc#gĞĞ¥¶FFÖÖFWW2×7FFUÒçF'7·FF–ærÖ&÷GFöÓ£ƒ¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†332“¶Ö&v–âÖ&÷GFöÓ£g‡ĞĞ¥¶FFÖÖFWW2×7FFUÒçF'2'WGFöç¶&÷&FW"×&F—W3£““—ƒ·FF–æs£W‚'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒçF'2'WGFöå¶&–×6VÆV7FVC×G'VU×¶&6¶w&÷VæC§f"‚ÒÖÒ×7FFRÖ66VçB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB“¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖöâÖ66VçB—ĞĞ¥¶FFÖÖFWW2×7FFUÒçF'2'WGFöå¶&–×6VÆV7FVC×G'VUÓ¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖÒ×7FFRÖ66VçB×7G&öær“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB×7G&öær“¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖöâÖ66VçB—ĞĞ¥¶FFÖÖFWW2×7FFUÒç6†VÆÇ¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3£#‡‚Ö–æÖ‚ƒÃg"“¶v£#'ƒ¶Æ–vâÖ—FV×3§7F'GĞĞ¥¶FFÖÖFWW2×7FFUÒç6–FW·÷6—F–öã§7F–6·“·F÷£'ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†332“¶&÷&FW"×&F—W3£gƒ·FF–æs£g‚'ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÂ6fffffc‚—ĞĞ¥¶FFÖÖFWW2×7FFUÒæ'&æG¶F—7Æ“¦fÆWƒ¶v£ƒ¶Æ–vâÖ—FV×3¦6VçFW#·FF–æs£G‚Gƒ¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3#‚“¶Ö&v–âÖ&÷GFöÓ£G‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ'&æDÖ&·¶F—7Æ“¦w&–C·Æ6RÖ—FV×3¦6VçFW#·v–GFƒ£3Gƒ¶†V–v‡C£3Gƒ¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçBƒCVFVrÂ6F&SvfbÂ6VVc6fb“¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB“¶föçB×vV–v‡C£sĞĞ¥¶FFÖÖFWW2×7FFUÒæ'&æB7G&öæw¶F—7Æ“¦&Æö6³¶Æ–æRÖ†V–v‡C£ã#WĞĞ¥¶FFÖÖFWW2×7FFUÒæ'&æB6ÖÆÇ·FF–ær×F÷£'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒç6–FUFw¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶Ö&v–ã£G‚'ƒ·FF–æs£7‚‡ƒ¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC¢3&cV&V#¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB“¶föçB×6—¦S£ƒ¶föçB×vV–v‡C£cĞĞ¥¶FFÖÖFWW2×7FFUÒç6–FTÆ&VÇ·FF–æs£‚‡‚Wƒ¶föçB×6—¦S£ƒ¶ÆWGFW"×76–æs¢ã&VÓ·FW‡B×G&ç6f÷&Ó§WW&66S¶÷6—G“¢ãWĞĞ¥¶FFÖÖFWW2×7FFUÒæædÆ—7G¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶v£'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒææd'WGFöç¶F—7Æ“¦fÆWƒ¶v£—ƒ¶Æ–vâÖ—FV×3¦6VçFW#·FW‡BÖÆ–vã¦ÆVgC¶&÷&FW#£¶&6¶w&÷VæC§G&ç7&VçC·FF–æs£—‚ƒ¶&÷&FW"×&F—W3£ƒ¶6öÆ÷#¦–æ†W&—C¶föçB×vV–v‡C£SĞĞ¥¶FFÖÖFWW2×7FFUÒææd'WGFöâææd–6öç·v–GFƒ£‡ƒ·FW‡BÖÆ–vã¦6VçFW#¶÷6—G“¢ãcS¶föçB×6—¦S£7‡ĞĞ¥¶FFÖÖFWW2×7FFUÒææd'WGFöå¶&–×6VÆV7FVC×G'VU×¶&6¶w&÷VæC¢3&cV&V#¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB“¶föçB×vV–v‡C£cĞĞ¥¶FFÖÖFWW2×7FFUÒææd'WGFöå¶&–×6VÆV7FVC×G'VUÒææd–6öç¶÷6—G“£ĞĞ¥¶FFÖÖFWW2×7FFUÒææd'WGFöã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3†3†3†3B—ĞĞ¥¶FFÖÖFWW2×7FFUÒæ6öçFVçD&V¶Ö–â×v–GFƒ£ĞĞ¥¶FFÖÖFWW2×7FFUÒçvT†VG¶F—7Æ“¦fÆWƒ¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£Gƒ¶Æ–vâÖ—FV×3¦fÆW‚×7F'C¶fÆW‚×w&§w&¶Ö&v–ã£G‡ĞĞ¥¶FFÖÖFWW2×7FFUÒçvT†VBƒ'¶föçB×6—¦S£#‡ƒ¶ÆWGFW"×76–æs¢ÒãW‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæW–V'&÷w¶föçB×6—¦S£ƒ¶ÆWGFW"×76–æs¢ãFVÓ·FW‡B×G&ç6f÷&Ó§WW&66S¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB“¶föçB×vV–v‡C£s¶Ö&v–âÖ&÷GFöÓ£G‡ĞĞ¥¶FFÖÖFWW2×7FFUÒçv÷&·76T&ææW'¶F—7Æ“¦fÆWƒ¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶Æ–vâÖ—FV×3¦6VçFW#¶v£'ƒ¶fÆW‚×w&§w&¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†332“¶&÷&FW"×&F—W3£Gƒ·FF–æs£7‚Wƒ¶Ö&v–ã£'‚¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÂ6fffffc‚—ĞĞ¥¶FFÖÖFWW2×7FFUÒçv÷&·76T&ææW"7G&öæw¶F—7Æ“¦&Æö6·ĞĞ¥¶FFÖÖFWW2×7FFUÒæÖöFTw&–G¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVBƒ"ÆÖ–æÖ‚ƒÃg"’“¶v£‡ƒ¶Ö&v–ã£‚ĞĞ¥¶FFÖÖFWW2×7FFUÒæÖöFT6&G¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†33‚“¶&÷&FW"×&F—W3£ƒ·FF–æs£‚ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÂ6fffffcb—ĞĞ¥¶FFÖÖFWW2×7FFUÒæÖöFT6&Bæ7F—fW¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB“¶&6¶w&÷VæC¢3&cV&VGĞĞ¥¶FFÖÖFWW2×7FFUÒæÖöFT6&B7G&öæw¶F—7Æ“¦&Æö6³¶Ö&v–âÖ&÷GFöÓ£'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒç6W76–öå&÷w¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒÃg"’S‚WFó¶v£ƒ¶Æ–vâÖ—FV×3¦6VçFW#·FF–æs£‚¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3#B—ĞĞ¥¶FFÖÖFWW2×7FFUÒç6W76–öå&÷s¦Æ7BÖ6†–ÆG¶&÷&FW"Ö&÷GFöÓ£ĞĞ¥¶FFÖÖFWW2×7FFUÒæÖöæ÷¶föçBÖfÖ–Ç“§V’ÖÖöæ÷76RÅ4dÖöæòÕ&VwVÆ"Ä6öç6öÆ2ÆÖöæ÷76S¶föçB×6—¦S£ƒ¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¥¶FFÖÖFWW2×7FFUÒæ†–çD6&G¶&÷&FW#£‚F6†VBf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3SR“¶&÷&FW"×&F—W3£ƒ·FF–æs£‚'ƒ¶&6¶w&÷VæC¢6C“–&#C¶Ö&v–ã£‚ĞĞ¥¶FFÖÖFWW2×7FFUÒæFFF&ÆW¶Ö–â×v–GFƒ£Cc‡ĞĞ¤ÖVF–†Ö‚×v–GFƒ£“‚—µ¶FFÖÖFWW2×7FFUÒç6†VÆÇ¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'Õ¶FFÖÖFWW2×7FFUÒç6–FW·÷6—F–öã§7FF–7Õ¶FFÖÖFWW2×7FFUÒæædÆ—7G¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVB†WFòÖf—BÆÖ–æÖ‚ƒ3‚Ãg"’—Õ¶FFÖÖFWW2×7FFUÒç6–FTÆ&VÂÂæFFF&ÆW¶F—7Æ“¦æöæW×ĞĞ¤6öçF–æW"ÖFWW2×7FFRÖ6öç6öÆR†Ö‚×v–GFƒ£ƒ#‚—°Ğ¢¶FFÖÖFWW2×7FFUÒç6†VÆÇ¶w&–B×FV×ÆFRÖ6öÇVÖç3£g#¶v£G‡ĞĞ¢¶FFÖÖFWW2×7FFUÒç6–FW·÷6—F–öã§7FF–7ĞĞ¢¶FFÖÖFWW2×7FFUÒæædÆ—7G¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVB†WFòÖf—BÆÖ–æÖ‚ƒC‚Ãg"’“¶v£G‡ĞĞ¢¶FFÖÖFWW2×7FFUÒç6–FTÆ&VÇ¶F—7Æ“¦æöæWĞĞ¢¶FFÖÖFWW2×7FFUÒæ'&æG·FF–ærÖ&÷GFöÓ£ƒ¶Ö&v–âÖ&÷GFöÓ£‡ĞĞ¢¶FFÖÖFWW2×7FFUÒç6W76–öå&÷w¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒÃg"’Sƒ¶Æ–vâÖ—FV×3§7F'GĞĞ¢¶FFÖÖFWW2×7FFUÒç6W76–öå&÷sâæ7F–öç7¶w&–BÖ6öÇVÖã£òÓ¶§W7F–g’Ö6öçFVçC¦fÆW‚ÖVæGĞĞ§ĞĞ¤6öçF–æW"ÖFWW2×7FFRÖ6öç6öÆR†Ö‚×v–GFƒ£cC‚—°Ğ¢¶FFÖÖFWW2×7FFUÒæf–VÆG¶w&–B×FV×ÆFRÖ6öÇVÖç3£g#¶v£W‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷w¶w&–B×FV×ÆFRÖ6öÇVÖç3£g"g#¶v£g‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷ræ–çFW&W7D7F–öç7¶w&–BÖ6öÇVÖã£òÓĞĞ¢¶FFÖÖFWW2×7FFUÒçF÷&'¶Æ–vâÖ—FV×3§7G&WF6‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæÖöFTw&–G¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'ĞĞ¢¶FFÖÖFWW2×7FFUÒç6W76–öå&÷w¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'ĞĞ¢¶FFÖÖFWW2×7FFUÒç6W76–öå&÷sâæ7F–öç7¶w&–BÖ6öÇVÖã¦WF÷ĞĞ¢¶FFÖÖFWW2×7FFUÒçvT†VBƒ'¶föçB×6—¦S£#G‡ĞĞ§ĞĞ¤ÖVF–†Ö‚×v–GFƒ£cC‚—°Ğ¢¶FFÖÖFWW2×7FFUÒæf–VÆG¶w&–B×FV×ÆFRÖ6öÇVÖç3£g#¶v£W‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷w¶w&–B×FV×ÆFRÖ6öÇVÖç3£g"g#¶v£g‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷ræ–çFW&W7D7F–öç7¶w&–BÖ6öÇVÖã£òÓĞĞ¢¶FFÖÖFWW2×7FFUÒçF÷&'¶Æ–vâÖ—FV×3§7G&WF6‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæÖöFTw&–G¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'ĞĞ¢¶FFÖÖFWW2×7FFUÒç6W76–öå&÷w¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'ĞĞ§ĞĞ¥¶FFÖÖFWW2×7FFUÒæw&–G¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVB†WFòÖf—BÆÖ–æÖ‚ƒƒ‚Ãg"’“¶v£ƒ¶Ö&v–ã£‚g‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ6&G¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3C“¶&÷&FW"×&F—W3£'ƒ·FF–æs£7ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÂ6fffffc‚“¶Ö–â×v–GFƒ£ĞĞ¥¶FFÖÖFWW2×7FFUÒæ6&BçfÇVW¶föçB×6—¦S£#gƒ¶föçB×vV–v‡C£c¶Æ–æRÖ†V–v‡C£ã#¶Ö&v–ã£'‚ĞĞ¥¶FFÖÖFWW2×7FFUÒæ6&Bæ&6W¶÷6—G“¢ãsS¶föçB×6—¦S£'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ&'¶†V–v‡C£‡ƒ¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó2Â3†3†3†3&R“¶Ö&v–ã£‡‚Gƒ¶÷fW&fÆ÷s¦†–FFVçĞĞ¥¶FFÖÖFWW2×7FFUÒæ&"7ç¶F—7Æ“¦&Æö6³¶†V–v‡C£S¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§f"‚ÒÖÒ×7FFRÖ66VçB—ĞĞ¥¶FFÖÖFWW2×7FFUÒçæVÇ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3C“¶&÷&FW"×&F—W3£'ƒ·FF–æs£Gƒ¶Ö&v–ã£'ƒ¶Ö–â×v–GFƒ£ĞĞ¥¶FFÖÖFWW2×7FFUÒæf–VÆG¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒÃã&g"’Ö–æÖ‚ƒS‚Âã†g"“¶v£Gƒ¶Æ–vâÖ—FV×3§7F'C·FF–æs£‚¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3#B—ĞĞ¥¶FFÖÖFWW2×7FFUÒæf–VÆC¦Æ7BÖ6†–ÆG¶&÷&FW"Ö&÷GFöÓ£ĞĞ¥¶FFÖÖFWW2×7FFUÒæf–VÆBæÆ&VÇ¶föçB×vV–v‡C£S¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¥¶FFÖÖFWW2×7FFUÒæf–VÆBæ6öçG&öÇ¶Ö–â×v–GFƒ£¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶v£g‡ĞĞ¥¶FFÖÖFWW2×7FFUÒ–çWE·G—SÖçVÖ&W%ÒÅ¶FFÖÖFWW2×7FFUÒ–çWE·G—S×FW‡EÒÅ¶FFÖÖFWW2×7FFUÒ6VÆV7BÅ¶FFÖÖFWW2×7FFUÒFW‡F&V¶föçC¦–æ†W&—C·v–GFƒ£S¶Ö–â×v–GFƒ£·FF–æs£w‚—ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3cb“¶&÷&FW"×&F—W3£‡ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3†3†3†3B“¶6öÆ÷#¦–æ†W&—GĞĞ¥¶FFÖÖFWW2×7FFUÒ–çWE·G—S×&ævU×·v–GFƒ£S¶66VçBÖ6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB—ĞĞ¥¶FFÖÖFWW2×7FFUÒFW‡F&V·&W6—¦S§fW'F–6Ã¶Ö–âÖ†V–v‡C£cG‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ–æÆ–æW¶F—7Æ“¦fÆWƒ¶v£‡ƒ¶Æ–vâÖ—FV×3¦6VçFW#¶fÆW‚×w&§w&ĞĞ¥¶FFÖÖFWW2×7FFUÒæ–æÆ–æR–çWE·G—S×&ævU×¶fÆWƒ£3ƒ¶Ö–â×v–GFƒ£“‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ–æÆ–æR–çWE·G—SÖçVÖ&W%×·v–GFƒ£“ƒ¶fÆWƒ£“‡ĞĞ¥¶FFÖÖFWW2×7FFUÒç7v—F6‡¶F—7Æ“¦fÆWƒ¶v£—ƒ¶Æ–vâÖ—FV×3¦fÆW‚×7F'C¶7W'6÷#§ö–çFW'ĞĞ¥¶FFÖÖFWW2×7FFUÒç7v—F6‚–çWG¶Ö&v–â×F÷£7ƒ·v–GFƒ£‡ƒ¶†V–v‡C£‡ƒ¶66VçBÖ6öÆ÷#§f"‚ÒÖÒ×7FFRÖ66VçB—ĞĞ¥¶FFÖÖFWW2×7FFUÒæÖW76vW·FF–æs£‚'ƒ¶&÷&FW"×&F—W3£—ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3†3†3†3#"“¶÷fW&fÆ÷r×w&¦ç—v†W&S¶Ö&v–ã£‚ĞĞ¥¶FFÖÖFWW2×7FFUÒæÖW76vRæW'&÷'¶&6¶w&÷VæC¢6C“S3Fc#¶6öÆ÷#¦–æ†W&—C¶&÷&FW#£‚6öÆ–B6C“S3FccgĞĞ¥¶FFÖÖFWW2×7FFUÒæÖW76vRç7V66W77¶&6¶w&÷VæC¢3&S–SV##¶&÷&FW#£‚6öÆ–B3&S–SV#cgĞĞ¥¶FFÖÖFWW2×7FFUÒçF&ÆUw&¶÷fW&fÆ÷s¦WFó¶Ö‚×v–GFƒ£S¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†332“¶&÷&FW"×&F—W3£‡ĞĞ¥¶FFÖÖFWW2×7FFUÒF&ÆW¶&÷&FW"Ö6öÆÆ6S¦6öÆÆ6S·v–GFƒ£S¶Ö–â×v–GFƒ£Scƒ¶föçB×6—¦S£'‡ĞĞ¥¶FFÖÖFWW2×7FFUÒF‚Å¶FFÖÖFWW2×7FFUÒFG·FF–æs£‡‚—ƒ·FW‡BÖÆ–vã¦ÆVgC·fW'F–6ÂÖÆ–vã§F÷¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3#b“¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¥¶FFÖÖFWW2×7FFUÒF‡¶föçB×vV–v‡C£c¶÷6—G“¢ãƒ·v†—FR×76S¦æ÷w&ĞĞ¥¶FFÖÖFWW2×7FFUÒG#¦Æ7BÖ6†–ÆBFG¶&÷&FW"Ö&÷GFöÓ£ĞĞ¥¶FFÖÖFWW2×7FFUÒFWF–Ç27VÖÖ'—¶7W'6÷#§ö–çFW#¶föçB×vV–v‡C£SĞĞ¥¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷w¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒ#‚Ãg"’Ö–æÖ‚ƒ#‚Ãg"’Ö–æÖ‚ƒ#‚Ãg"’WFó¶v£ƒ¶Æ–vâÖ—FV×3¦6VçFW#·FF–æs£—‚¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3#B“¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¥¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷s¦Æ7BÖ6†–ÆG¶&÷&FW"Ö&÷GFöÓ£ĞĞ¥¶FFÖÖFWW2×7FFUÒæW'&÷%FW‡G¶6öÆ÷#¢63“3&3¶föçB×6—¦S£'ƒ¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¥¶FFÖÖFWW2×7FFUÒæ÷fW&Æ—·÷6—F–öã¦f—†VC¶–ç6WC£¶&6¶w&÷VæC¢3ƒ¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶§W7F–g’Ö6öçFVçC¦6VçFW#·FF–æs£‡ƒ·¢Ö–æFWƒ£ĞĞ¥¶FFÖÖFWW2×7FFUÒæF–Æöw·v–GFƒ¦Ö–âƒCc‚ÃR“¶Ö‚Ö†V–v‡C£ƒWfƒ¶÷fW&fÆ÷s¦WFó¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖ÷fW&Æ’Â6ffb“¶6öÆ÷#§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×&–Ö'’Â3c#3#’“¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3SR“¶&÷&FW"×&F—W3£Gƒ·FF–æs£‡ƒ¶&÷‚×6†F÷s£‡‚S‚3WĞĞ¥¶FFÖÖFWW2×7FFUÒæF–Æörƒ7¶Ö&v–â×F÷£ĞĞ¥¶FFÖÖFWW2×7FFUÒæF–Æöræ7F–öç7¶§W7F–g’Ö6öçFVçC¦fÆW‚ÖVæC¶Ö&v–â×F÷£g‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæ×WFVG¶÷6—G“¢ãwĞĞ¥¶FFÖÖFWW2×7FFUÒç7F6·¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶v£ƒ¶Ö–â×v–GFƒ£ĞĞ¥¶FFÖÖFWW2×7FFUÒç66÷U&÷w¶F—7Æ“¦fÆWƒ¶v£‡ƒ¶Æ–vâÖ—FV×3¦6VçFW#¶fÆW‚×w&§w&ĞĞ¥¶FFÖÖFWW2×7FFUÒç66÷U&÷r6VÆV7G¶fÆWƒ£#C‡ĞĞ¥¶FFÖÖFWW2×7FFUÒæÒÖFWF–Ç·FF–æs£¶Ö‚×v–GFƒ£WĞĞ¥¶FFÖÖFWW2×7FFUÒæÒÖFWF–Âæf–VÆG·FF–æs£‡‚ĞĞ¥¶FFÖÖFWW2×7FFUÒæÒÖFWF–Âæf–VÆBæÆ&VÇ¶föçB×vV–v‡C£SĞĞ¥¶FFÖÖFWW2×7FFUÒæÒÖFWF–Âæ7F–öç7¶Ö&v–â×F÷£‡ĞĞ¤ÖVF–†Ö‚×v–GFƒ£cC‚—°Ğ¢¶FFÖÖFWW2×7FFUÒæf–VÆG¶w&–B×FV×ÆFRÖ6öÇVÖç3£g#¶v£W‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷w¶w&–B×FV×ÆFRÖ6öÇVÖç3£g"g#¶v£g‡ĞĞ¢¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷ræ–çFW&W7D7F–öç7¶w&–BÖ6öÇVÖã£òÓĞĞ¢¶FFÖÖFWW2×7FFUÒçF÷&'¶Æ–vâÖ—FV×3§7G&WF6‡ĞĞ§ĞĞ¦°Ğ Ğ¦6öç7BD”5BÒ°Ğ¢¦ƒ¢°Ğ¢æc¢tÖFWW2x«nhrÀĞ¢F—FÆS¢tÖFWW2x«nhrÀĞ¢7V'F—FÆS¢~[ø>h8^8{+îX©¾8Z[ŞZX~[ø>KˆîX[N‹j>y¨NhÈK˜^x«nh8.‹ù˜xÎXú®iŠşzêynKˆîŠx.Zùş[.ûÈÎŠÎK‹®XîY	KˆŞKÉ®Šhny¹nK«®jÎ8iØ>™™h‰bÆ–fR‹>[ªn8"rÀĞ¢&Vg&W6ƒ¢~X‹~ikrÀĞ¢6fS¢~KùŞZÙŠëî{ÚârÀĞ¢6f–æs¢~KùŞZÙKŠŞ(
brÀĞ¢6æ6VÃ¢~XùnkhKúîiK’rÀĞ¢6fVC¢~Šëî{Úî[{.KùŞZÙûÈÎ[É^i8îKÉ®z¸¾XÛ>Šû¾XùnikXÎ8"rÀĞ¢6fTf–ÆVC¢~KùŞZÙZK‹J^ûÈÎˆØz‹ş[{.KùŞyY8"rÀĞ¢6öæfÆ–7C¢~Šëî{Úî[{.YÊXŠ¾ZHNKúîiK8.Šû~XX‹ÛŞXZ^iÈikXÎûÈÎh‰nKùŞyYˆØz‹şYîXhŞKùŞZÙ8"rÀĞ¢&VÆöD66WFVC¢~‹ÛŞXZ^iÈikXÂrÀĞ¢æô6†ævW3¢~k*iÈ™ÈŠhKùŞZÙy¨NKúîiK8"rÀĞ¢Vç6fVC¢~iÈiÊ®KùŞZÙy¨NKúîiK8"rÀĞ¢&VDöæÇ“¢~[Ù>X˜Ş˜:{Û.y¨NŠëî{ÚîK‹®Xú®Šû¾8"rÀĞ¢ÆöF–æs¢~jÚ>YÊŠû¾Xùn(
brÀĞ¢ÆöF–æu66÷W3¢~jÚ>YÊŠû¾Xùnx«nhYË®išş(
brÀĞ¢æõ66÷W3¢~‹ùk*iÈx«nhYË®išş8.XX‹ù¾ŠÎKˆjÊYk9^K¨¾K»nûÈÎh‰nh™>[ÈKˆKŠ®[{.{¸ş{¹Zé®‹ª¾K»Şy¨NKÉ®ŠùŞ8"rÀĞ¢66÷S¢~[Ù>X˜ŞYË®išòrÀĞ¢&—f7“¢~ˆÈ>Y»BrÀĞ¢&—fFS¢~zxiÈ’rÀĞ¢6†&VC¢~[{.hèiØ>X[Kª²rÀĞ¢6÷W&6S¢~iÚ^k©rÀĞ¢Æö6Ã¢~iÊÎYËzxiÈ’rÀĞ¢Æ–fS¢tÆ–fR{¹Zé¢rÀĞ¢WF†÷&—¦VC¢~hèiØ>iÈiX‚rÀĞ¢VæWF†÷&—¦VC¢~hèiØ>iziX‚rÀĞ¢÷fW'f–Ws¢~h¾Šx‚rÀĞ¢6WGF–æw3¢~x«nhkÉNXÉbrÀĞ¢6öçFW‡C¢~Kˆ®Kˆ¾ih~KˆîjŠYè¾[z^X[rrÀĞ¢'VÆW3¢~KÉ®ŠùŞŠxNX‰’rÀĞ¢FF¢~i[hÚîKˆîŠø®ijÒrÀĞ¢–çFW&W7G3¢~X[N‹j>zêybrÀĞ¢VF—C¢~K¨¾K»nKˆîZêŠêrÀĞ¢Gfæ6VC¢~š¹{ª~Šëî{ÚârÀĞ¢F–væ÷7F–73¢~Šø®ijÒrÀĞ¢ÖööC¢~[ø>h8RrÀĞ¢VæW&w“¢~{+îX©²rÀĞ¢7W&–÷6—G“¢~Z[ŞZX~[ø2rÀĞ¢&6VÆ–æS¢~™[şiÉşYû®XxbrÀĞ¢Æ7EWFFS¢~iÈYîi»NikrÀĞ¢Æ7DWfVçC¢~iÈ‹ùK¨¾K»brÀĞ¢FVæFVæ7“¢~XîY	ŠûNiˆârÀĞ¢7FFT†VÇF‡“¢~x«nh[É^i8îjÚ>[‹‚rÀĞ¢7FFTFVw&FVC¢~x«nh[É^i8îKˆŞXúşyJ‚rÀĞ¢–æ¦V7F–öã¢~XªhKˆ®Kˆ¾ihrrÀĞ¢6öçFW‡Döfc¢~X[>™zÒrÀĞ¢6öçFW‡D'&–Vc¢~zèyúŞx«nhrÀĞ¢6öçFW‡E7FFT–çFW&W7G3¢~x«nhKˆîX[N‹j2rÀĞ¢æ÷&ÖÃ¢~jÚ>[‹‹ùŠÂrÀĞ¢Væf–Æ&ÆS¢~KˆŞXúşyJ‚rÀĞ¢F—66öææV7FVC¢~iÊ®‹ùîhêRrÀĞ¢Væ&ÆVC¢~[{.Y
şyJ‚rÀĞ¢F—6&ÆVC¢~[{.X[>™zÒrÀĞ¢æõ7FFS¢~jÚNYË®išş[Ù>X˜Şk*iÈXúşŠû¾Xùny¨Nx«nh8"rÀĞ¢æô–çFW&W7G3¢~i¨.izX[N‹j>8.h˜¾Xªk{¾XªKˆKŠ®ûÈÎh‰nŠêYk9^K¨¾K»n[Ú.h‰‹ùiÉşX[N‹j>8"rÀĞ¢FD–çFW&W7C¢~k{¾XªX[N‹j2rÀĞ¢æÖS¢~YŞz{rÀĞ¢Æ–6W3¢~XŠ¾YŞûÈ˜	~Xû~Xˆn™©NûÈ’rÀĞ¢ÖçVÄ&6VÆ–æS¢~K«®[z^™[şiÉşXşZ[ÒrÀĞ¢7F—f—G“¢~‹ùiÉşkK¾‹x2rÀĞ¢FC¢~k{¾XªrÀĞ¢WFFS¢~KùŞZÙKúîiK’rÀĞ¢VF—C¢~‹>i[BrÀĞ¢F—6&ÆS¢~XÎyJ‚rÀĞ¢Væ&ÆS¢~Y
şyJ‚rÀĞ¢FVÆWFS¢~XŠ™šBrÀĞ¢–çFW&W7DFVÆWFVC¢~X[N‹j>[{.K¸â7FFRKŠŞXŠ™šNûÉ´ÖVÖ÷'’Šë[ønKˆîXènXû.ZêŠêKˆŞXù~[ÛY8Ş8"rÀĞ¢–çFW&W7DFVÆWFT†–çC¢~XŠ™šNXú®[ÛY8Ò7FFRKŠŞy¨NX[N‹j>˜XŞ{ÚîKˆî‹ùiÉşkK¾‹x>[ªnûÈÎKˆŞKÉ®XŠ™šBÖVÖ÷'’Šë[ønh‰nXènXû.ZêŠêûÉ¾zîŠêNYîh˜ŞKÉ®hš~ŠÎ8"rÀĞ¢–çFW&W7DF—6&ÆVC¢~X[N‹j>[{.XÎyJûÈÎXènXû.i[hÚîKùŞyY8"rÀĞ¢6öæf—&ÔFVÆWFUF—FÆS¢~XŠ™šNX[N‹j>ûÉòrÀĞ¢6öæf—&ÔFVÆWFT&öG“¢~Xú®XŠ™šB7FFRKŠŞy¨NX[N‹j>YŞz{Kˆî‹ùiÉşkK¾‹x>[ªn8.KˆŞKÉ®XŠ™šBÖVÖ÷'’KŠŞy¨NŠë[ønûÈÎK™şKˆŞKÉ®XŠ™šNZêŠêXènXû.8"rÀĞ¢6öæf—&Õ&W6WEF—FÆS¢~˜xŞ{Úî[Ù>X˜Şx«nhX‹Yû®XxnûÉòrÀĞ¢6öæf—&Õ&W6WD&öG“¢~‹ùiŠşxºÎz¸¾y¨Nš¹[ÛY8Şi8ŞKÙÎ8.KÉ®XXX‰¾[»®i[hÚî[©>ZH~K»ŞûÈÎ[›nh¨®[Ù>X˜Ş[ø>h8^8{+îX©¾8Z[ŞZX~[ø>h.ZHŞX‹˜XŞ{ÚîYû®Xxn8.X[N‹j>Y(ÎXènXû.Šë[Ù^KˆŞKÉ®XŠ™šN8"rÀĞ¢6öæf—&Ó¢~zîŠêBrÀĞ¢6Æ÷6S¢~Xùnkh‚rÀĞ¢&W6WC¢~˜xŞ{Úî[Ù>X˜Şx«nhX‹Yû®XxbrÀĞ¢&W6WDFöæS¢~[Ù>X˜Şx«nh[{.˜xŞ{ÚîûÈÎ[›nXiXZ^KˆiÚzêynYZêŠêŠë[Ù^8"rÀĞ¢&6·W¢~X‰¾[»®i[hÚî[©>ZH~K»ÒrÀĞ¢&6·W6öæf—&ÕF—FÆS¢~X‰¾[»®ZH~K»ŞûÉòrÀĞ¢&6·W6öæf—&Ô&öG“¢~YÊ[Ù>X˜Şi[hÚîyºî[Ù^y¨B&6·W2ZÙyºî[Ù^X‰¾[»®Kˆˆ{Nh
~ZH~K»ŞûÈÎKˆŞKÉ®KúîiKx«nh8"rÀĞ¢&6·WFöæS¢~ZH~K»Ş[{.X‰¾[»®ûÉ¢rÀĞ¢&6·W3¢~i[hÚî[©>ZH~K»ŞKˆîh.ZHÒrÀĞ¢æô&6·W3¢~i¨.izZH~K»Ş8.XXX‰¾[»®KˆK»ŞZH~K»ŞûÈÎXhŞK¸î‹ù˜xÎ˜hºh.ZHŞ8"rÀĞ¢6VÆV7D&6·W¢~˜hºZH~K»ÒrÀĞ¢&W7F÷&T&6·W¢~K¸îZH~K»Şh.ZHÒrÀĞ¢&W7F÷&T&6·WF—FÆS¢~K¸îZH~K»Şh.ZHŞi[hÚî[©>ûÉòrÀĞ¢&W7F÷&T&6·W&öG“¢~KÉ®XXš¨ÎŠøZH~K»ŞZèÎi[Nh
~866†VÖY(Î[ø^™ÈŠûÈÎX‰¾[»®h.ZHŞX˜ŞZèXZZH~K»ŞûÈÎxKnYîi»şhÚ.[Ù>X˜Ò7FFRi[hÚî[©>[›n˜xŞikh™>[È8.ZK‹J^KÉ®ˆz®Xªh.ZHŞXéşi[hÚî[©>ûÉ¾Xú®[ÛY8Ò7FFRi[hÚîûÈÎKˆŞXŠ™šBÖVÖ÷'8"rÀĞ¢&W7F÷&T&6·W†–çC¢~h.ZHŞX˜ŞŠû~zîŠêNZH~K»Şx˜iÊÎKˆî[Ù>X˜Şhù.K»nX[ÎZëûÉ¾h‰X©şYîš^™Ú.KÉ®˜xŞikŠû¾Xùb7FFRi[hÚî8"rÀĞ¢&W7F÷&T&6·WFöæS¢~[{.K¸îZH~K»Şh.ZHŞûÈÅ7FFRi[hÚî[©>[{.˜xŞikh™>[È8"rÀĞ¢6VÆV7D&6·W&WV—&VC¢~Šû~XX˜hºKˆKŠ®ZH~K»Ş8"rÀĞ¢6öæf—&Õ&W7F÷&S¢~zîŠêNh.ZHÒrÀĞ¢&W7F÷&TFVfVÇG3¢~h.ZHŞ›¹ŠêNXø.i[rÀĞ¢&W7F÷&T6öæf—&ÕF—FÆS¢~h.ZHŞ›¹ŠêNXø.i[ûÉòrÀĞ¢&W7F÷&T6öæf—&Ô&öG“¢~Xú®kˆ^™šNhù.K»n˜XŞ{ÚîŠhny¹n[›nh.ZHŞ›¹ŠêNXÎûÈÎKˆŞKÉ®XŠ™šNx«nh8X[N‹j>h‰nZêŠêXènXû.8"rÀĞ¢&W7F÷&TFöæS¢~˜XŞ{Úî[{.h.ZHŞ›¹ŠêNXÎ8"rÀĞ¢&Wf–Ws¢~š(NŠx‹>i[NiXiéÂrÀĞ¢&Wf–WtWfVçC¢~š(NŠxK¨¾K»n{¾Yè²rÀĞ¢&Wf–Wt†–çC¢~š(NŠxKÛşyJ[Ù>X˜ŞˆØz‹şXø.i[ûÈÎKØnKˆŞKÉ®XiXZ^i[hÚî[©>8"rÀĞ¢Gfæ6VD†–çC¢~‹ùK©¾Xø.i[[ÛY8ŞkÉNXÉn˜	ş[ªn8Kˆ®™™KˆîKùŞyYzÙnyZ^8.KúîiKKÉ®z¸¾XÛ>yIşiXûÈÎKˆŞ™ÈŠh˜xŞY
şhù.K»n8"rÀĞ¢FVfVÇC¢~›¹ŠêBrÀĞ¢&ævS¢~ˆÈ>Y»BrÀĞ¢&W7F'C¢~KúîiKYî™ÈŠh˜xŞY
şhù.K»brÀĞ¢Æ—fS¢~KúîiKYîz¸¾XÛ>yIşiX‚rÀĞ¢vS¢~zÊÂrÀĞ¢vTöc¢~š^ûÈÎX[rÀĞ¢&Wc¢~Kˆ®KˆšRrÀĞ¢æW‡C¢~Kˆ¾KˆšRrÀĞ¢F÷FÃ¢~iÚŠë[ÙRrÀĞ¢æôWfVçG3¢~i¨.izXùXÉnŠë[Ù^8"rÀĞ¢F–ÖS¢~i{n™{BrÀĞ¢G—S¢~{¾Yè²rÀĞ¢FVÇF¢~[ÛY8ÒrÀĞ¢&V6öã¢~XéşYºrÀĞ¢6÷W&6UG'W7C¢~iÚ^k©òKúK»²rÀĞ¢FWF–Ç3¢~Šúnh8RrÀĞ¢&Vf÷&TgFW#¢~XùXÉnX˜ŞYârÀĞ¢Wf–FVæ6S¢~ŠøhÚî[É^yJ‚rÀĞ¢fW'6–öã¢~x˜iÊÂrÀĞ¢FF&6S¢~i[hÚî[©2rÀĞ¢66†VÖ¢u66†VÖx˜iÊÂrÀĞ¢Æ–fT–çFVw&F–öã¢tÆ–fRhê^Xú2rÀĞ¢ÖVÖ÷'”–çFVw&F–öã¢tÖVÖ÷'’hê^Xú2rÀĞ¢ÖVÖ÷'•w&—FS¢tÖVÖ÷'’XiXZRrÀĞ¢ÖVÖ÷'•w&—FUVæf–Æ&ÆS¢~KˆŞXúşyJûÈ{Ë®[	66VæR{ª~ZY{ªnûÈ’rÀĞ¢ÖVÖ÷'•w&—FU6fS¢~XúşyJûÈ…66VæR{ª~ZY{ªn[{.š¨ÎŠøûÈ’rÀĞ¢Æ7DW'&÷#¢~iÈ‹ù™IŠúòrÀĞ¢6÷VçG3¢~i[hÚî˜xòrÀĞ¢6öæf–u6÷W&6S¢~˜XŞ{ÚîiÚ^k©rÀĞ¢6ÖU6÷W&6S¢~hù.K»nzêynYšKˆîxºÎz¸¾Šëî{Úîš^X[yJ‚E4‚iØ>Zˆ˜XŞ{ÚîY(ÎKúîŠê.Xû~8"rÀĞ¢6WGF–æw5Væf–Æ&ÆS¢~Šëî{ÚîYŞYŞz›®™{N[Ù>X˜ŞKˆŞXúşyJûÉ¾hù.K»nXúşˆ;ŞŠ*¾XÎyJ8"rÀĞ¢&WVW7Df–ÆVC¢~Šû~k.ZK‹J^ûÉ¢rÀĞ¢æõW&Ö—76–öã¢~Xú®iÈ[{.ŠêNŠøy¨BE4‚h˜iÈˆ^XúşKº^zêyb7FF^8"rÀĞ¢66÷W3¢~x«nhYË®išòrÀĞ¢v÷&·76S¢~[z^KÙÎXË¢rÀĞ¢æõv÷&·76S¢~iÊ®{¹Zé®[z^KÙÎXË¢rÀĞ¢&–æEv÷&·76S¢~{¹Zé®[z^KÙÎXË¢rÀĞ¢Væ&–æEv÷&·76S¢~Šz>™šN{¹Zé¢rÀĞ¢v÷&·76T&÷VæC¢~[{.{¹Zé®[z^KÙÎXË¢rÀĞ¢v÷&·76UVæ&÷VæC¢~iÊ®{¹Zé®ûÈKùŞhÈczxiÈjŠ[ÈşûÈ’rÀĞ¢v÷&·76TÖ—76–æs¢~[z^KÙÎXË®[{.ZKiX‚rÀĞ¢v÷&·76U&Vv—7G'•Væf–Æ&ÆS¢wv÷&·76U&Vv—7G'’KˆŞXúşyJ‚rÀĞ¢v÷&·76U–6³¢~˜hºKˆKŠ¢E4‚v÷&·76RrÀĞ¢v÷&·76T†–çC¢~KÛşyJZéik’E4‚v÷&·76U&Vv—7G'’y¨Nz‹>Zé¢”BKˆîZéîi{b6W76–öä–G>ûÉ¾i‹îzK®YŞz{Y(Î‹zş[èNKˆŞXø.Kˆî‹ª¾K»ŞXŠNijŞ8"rÀĞ¢v÷&·76U&V&–æC¢~{¹Zé®X‹X[nK¹n[z^KÙÎXË®ûÉòrÀĞ¢v÷&·76U&V&–æD&öG“¢~‹ùKÉ®Xˆ~hÚ.[z^KÙÎXË®K‹¾x«nhûÉ¾iz~[z^KÙÎXË®y¨Nx«nh8ŠxNX‰KˆîZêŠêXéşj~KùŞyYûÈÎKˆŞKÉ®Y[›n8"rÀĞ¢Væ&–æEF—FÆS¢~Šz>™šN[z^KÙÎXË®{¹Zé®ûÉòrÀĞ¢Væ&–æD&öG“¢~Šz>™šNYîY¹îX‹cy¨NjøşKÉ®ŠùŞzxiÈx«nhûÉ¾iz~i[hÚî8ŠxNX‰Y(ÎZêŠêKˆŞKÉ®Š*¾XŠ™šNûÈÎK™şKˆŞKÉ®ˆz®XªY[›n8"rÀĞ¢v÷&·76TFVfVÇDÖöFS¢~›¹ŠêNKÉ®ŠùŞzÙnyZRrÀĞ¢v÷&·76TFVfVÇD†–çC¢~[z^KÙÎXË®h‰Y›¹ŠêNX[Kª¾K‹¾x«nhûÉ¾XúşYÊKˆ¾ikK‹®XÙ^KŠ®KÉ®ŠùŞŠëî{ÚîKè¾ZIn8"rÀĞ¢v÷&·76TÖ–ã¢~[z^KÙÎXË®X[Kª¾K‹¾x«nhrÀĞ¢v÷&·76TÆVv7“¢~iz~zxiÈ’66÷RKˆîZêŠêŠ*¾KùŞyYûÈÎKˆŞKÉ®ˆz®Xªk~h¾8"rÀĞ¢v÷&·76Tæô&–æF–æs¢~{¹Zé®[z^KÙÎXË®YîûÈÎ[z^KÙÎXË®Xh^y¨NYk9^KÉ®ŠùŞX[Kª¾KˆK»ŞK‹¾x«nh8"rÀĞ¢6W76–öå'VÆW3¢~KÉ®ŠùŞŠxNX‰’rÀĞ¢6W76–öå'VÆW4†–çC¢~ŠxNX‰Xú®hê^Xù~z‹>Zé¢6W76–öâ”NûÈÎ[›nK¸îZéîi{n[z^KÙÎXË®h‰YKŠŞš¨ÎŠø8.i*NiØ>YîKˆ¾KˆjÊ[z^X[~8k:XZ^h‰nK¨¾K»nz¸¾XÛ>yIşiX8"rÀĞ¢6W76–öã¢~KÉ®ŠùÒrÀĞ¢ÖöFS¢~jŠ[ÈòrÀĞ¢ÖöFU6†&VC¢~X[Kª¾K‹¾x«nhrÀĞ¢ÖöFU&VDöæÇ“¢~Xú®Šû¾X[Kª²rÀĞ¢ÖöFT—6öÆFVC¢~xºÎz¸¾x«nhrÀĞ¢ÖöFTF—6&ÆVC¢~ZèÎXZXÎyJ‚rÀĞ¢ÖöFU6†&VD†VÇ¢~Šû¾XùnK‹¾x«nhûÉ¾iÊÎKÉ®ŠùŞy¨NYk9^K¨¾K»nXúş[ş[˜^[ÛY8ŞXZ[8"rÀĞ¢ÖöFU&VDöæÇ”†VÇ¢~Šû¾XùnK‹¾x«nhûÈÎKØnKˆŞKÉ®KúîiKZè>8.˜.Yš¹š){êNˆ®Y(ÎŠx.Zùş8"rÀĞ¢ÖöFT—6öÆFVD†VÇ¢~KÛşyJiÊÎKÉ®ŠùŞxºÎz¸¾y¨Nx«nhY(ÎX[N‹j>ûÈÎKˆŞŠû¾XiK‹¾x«nh8"rÀĞ¢ÖöFTF—6&ÆVD†VÇ¢~KˆŞk:XZ^8KˆŞZHNynK¨¾K»n8KˆŞ[ÈiKîiÈiXjŠYè¾Šû¾XiûÉ¾i[hÚîKùŞyY8"rÀĞ¢6fU'VÆS¢~[©NyJŠxNX‰’rÀĞ¢6ÆV%'VÆS¢~h.ZHŞ›¹ŠêBrÀĞ¢'VÆU6fVC¢~KÉ®ŠùŞŠxNX‰[{.KùŞZÙûÈÎz¸¾XÛ>yIşiX8"rÀĞ¢'VÆT6ÆV&VC¢~[{.h.ZHŞ[z^KÙÎXË®›¹ŠêNzÙnyZ^8"rÀĞ¢&6†—fVE6W76–öã¢~[{.[Ù.j2rÀĞ¢æõ6W76–öç3¢~[z^KÙÎXË®k*iÈXúşzêyny¨NKÉ®ŠùŞ8"rÀĞ¢66VæUVæf–Æ&ÆS¢u{êNXûrşzxˆ®Xû~ŠxNX‰iÊ®ZéîxëûÉ®[Ù>X˜ÒE4‚k*iÈXúşXZÎ[Èš¨ÎŠøy¨B66VæRiŠ[N8.K¸^hê^Xù~z‹>Zé¢6W76–öâ”NûÈÎ˜şXXŞhÈi‹îzK®YŞz{hèiØ>8"rÀĞ¢æôW‡G&ÖöFVÃ¢~iÊ®Zéîxëš)ŞZInjŠYè¾ŠøNK»~ûÉ¾KˆŞKÉ®jøş‹ÚîXún[ÈÄÄŞ8"rÀĞ¢WFôWföÇWF–öã¢~Y¹îYYîˆz®XªkÉNXÉbrÀĞ¢WFôWföÇWF–öä†VÇ¢~Xú®ZHNyn[{.ZèÎh‰y¨NyÉşZéîjŠYè¾Y¹îYûÈÎ[›nKÛşyJz‹>Zé¢6W76–öâ÷GW&â÷6WXë¾˜xŞKˆî™™kX8"rÀĞ¢–æ¦V7F–öäÆWfVÃ¢~k:XZ^zØ{ªrrÀĞ¢–æ¦V7F–öä'&–Vc¢~zèyúÒrÀĞ¢–æ¦V7F–öäFWF–ÆVC¢~Šún{¸brÀĞ¢FööÅ7FGW3¢~jŠYè¾[z^X[~x«nhrÀĞ¢FööÄvWC¢w7FFUövWBrÀĞ¢FööÄ&—6S¢w7FFUö&—6^ûÈXúş˜KØîKúK»¾ûÈ’rÀĞ¢FööÄ–çFW&W7G3¢w7FFUö–çFW&W7G2rÀĞ¢FööÄ†VÇFƒ¢w7FFUö†VÇF‚rÀĞ¢FööÄF—6&ÆVDæ÷FS¢~ZèÎXZXÎyJjŠ[ÈşKˆ¾ûÈÎjŠYè¾[z^X[~KˆŞ‹ùNY¹îiÈiXx«nh8"rÀĞ¢FF†–çC¢~i[hÚî[©>8‹øz{¾8ZH~K»ŞKˆîŠø®ijŞ8.h˜iÈh.ZHŞK¸Ş™ÈK¨ÎjÊzîŠêN8"rÀĞ¢Ö–w&F–öã¢u66†VÖ‹øz{²rÀĞ¢Ö–w&F–öäæöæS¢~k*iÈ‹øz{¾Šë[Ù^8"rÀĞ¢Ö–w&F–öä&6·W¢~‹øz{¾X˜ŞZH~K»ÒrÀĞ¢7F÷&vS¢~iÊÎYËZÙX*‚rÀĞ¢ÆVv7•&W6W'fVC¢~izrczxiÈ’66÷RKˆîZêŠêKùŞyYûÉ¾KˆŞKÉ®ˆz®XªY[›nX‹[z^KÙÎXË®K‹¾x«nh8"rÀĞ¢6öçFW‡EvT†–çC¢~jøşjÊyÉşjÚ>{¸NŠ8^jŠYè¾Kˆ®Kˆ¾ih~i{nŠû¾XùniÈikx«nhûÉ¾KˆŞk:XZ^ZèÎi[NK¨¾K»nXènXû.ûÈÎK™şKˆŞ‹>yJš)ŞZInjŠYè¾yIşh‰ih~iÊÎ8"rÀĞ¢WföÇWF–öåvT†–çC¢~‹>i[Nx«nh[ÛY8Ş8h.ZHŞKˆîY¹îYYîkÉNXÉnûÉ¾h˜iÈŠëî{Úîz¸¾XÛ>yIşiX8"rÀĞ¢WfVçE7F÷&VC¢~x«nhK¨¾K»n[{.Šë[Ù^8"rÀĞ¢–çFW&W7DFFVC¢~X[N‹j>[{.k{¾Xª8"rÀĞ¢–çFW&W7EWFFVC¢~X[N‹j>[{.i»Nik8"rÀĞ¢–çfÆ–Df–VÆC¢~i[XÎ‹h^X{®Yk9^ˆÈ>Y»N8"rÀĞ¢Ææs¢tTârÀĞ¢&6³¢~‹ùNY¹ârÀĞ¢æ÷Df–Æ&ÆS¢~KˆŞXúşyJ‚rÀĞ¢æ÷D6öææV7FVC¢~iÊ®‹ùîhêRrÀĞ¢÷F–öæÃ¢~Xúş˜’rÀĞ¢–W3¢~iŠòrÀĞ¢æó¢~Y
brÀĞ¢66÷U&—fFTæ÷FS¢~[Ù>X˜ŞŠû¾XùnXú®KÛşyJjÚNKÉ®ŠùŞˆë~hèiØ>y¨NYË®išşûÉ¾KˆŞKÉ®Y[›nX[nK¹nzxiÈYË®išşy¨Ni[XÎh‰nXéşYº8"rÀĞ¢FÖ–äæ÷FS¢~š^™Ú.Šû~k.™ÈŠhE4‚[{.ŠêNŠøh˜iÈˆ^ûÉ¾K¸^iÊÎiË®Y¹îxêşYËYØKˆŞzé~zêynYhèiØ>8"rÀĞ¢FWF–ÅF—FÆS¢u7FFRYû®iÊÎ˜XŞ{ÚârÀĞ¢FWF–Ä–çG&ó¢~KˆîxºÎz¸²ÖFWW2x«nhš^X[yJYÎKˆE4‚˜XŞ{ÚîY(ÎKúîŠê.Xû~8"rÀĞ¢FWF–Ä†VÇFƒ¢~[É^i8ârÀĞ¢FWF–ÅVæf–Æ&ÆS¢~x«nhKˆŞXúşŠû¾XùbrÀĞ¢FWF–Å6fVC¢~[{.KùŞZÙûÈÄÖFWW2x«nhš^KÉ®z¸¾XÛ>XøŞiŠ8"rÀĞ¢FWF–Äæô6†ævW3¢~k*iÈKúîiK8"rÀĞ¢FWF–Å&W7F'C¢~‹ùK©¾ZÙ~jë^KúîiKYîz¸¾XÛ>yIşiXûÉ¾jÚNXÚx˜~KˆŞXÈ^Y
¾i[hÚî[©>‹zş[èN8.ˆºRE4‚hùzK®™ÈŠh˜xŞY
şûÈÎŠû~hÈhùzK®i8ŞKÙÎ8"rÀĞ¢ÒÀĞ¢Vã¢°Ğ¢æc¢tÖFWW27FFRrÀĞ¢F—FÆS¢tÖFWW27FFRrÀĞ¢7V'F—FÆS¢uW'6—7FVçBÖööBÂVæW&w’Â7W&–÷6—G’ÂæB–çFW&W7G2âF†—2—2ÖævVÖVçBæBö'6W'fF–öâÆ–W#²FVæFVæ6–W2æWfW"÷fW'&–FRW'6öæÂW&Ö—76–öç2Â÷"Æ–fR66†VGVÆ–ærârÀĞ¢&Vg&W6ƒ¢u&Vg&W6‚rÀĞ¢6fS¢u6fR6WGF–æw2rÀĞ¢6f–æs¢u6f–æ~(
brÀĞ¢6æ6VÃ¢tF—66&B6†ævW2rÀĞ¢6fVC¢u6WGF–æw26fVBâF†RVæv–æR&VG2F†RæWrfÇVW2–ÖÖVF–FVÇ’ârÀĞ¢6fTf–ÆVC¢u6fRf–ÆVC²–÷W"G&gBv2&W6W'fVBârÀĞ¢6öæfÆ–7C¢u6WGF–æw26†ævVBVÇ6Wv†W&Râ&VÆöBF†RÆFW7BfÇVW2Â÷"¶VW–÷W"G&gBæB6fRv–âârÀĞ¢&VÆöD66WFVC¢u&VÆöBÆFW7BrÀĞ¢æô6†ævW3¢tæ÷F†–ærFò6fRârÀĞ¢Vç6fVC¢u–÷R†fRVç6fVB6†ævW2ârÀĞ¢&VDöæÇ“¢u6WGF–æw2&R&VBÖöæÇ’–âF†—2FWÆ÷–ÖVçBârÀĞ¢ÆöF–æs¢tÆöF–æ~(
brÀĞ¢ÆöF–æu66÷W3¢tÆöF–ær7FFR66VæW>(
brÀĞ¢æõ66÷W3¢tæò7FFR66VæW2–WBâ&öGV6RÆVv—F–ÖFRWfVçB÷"÷Vââ–FVçF—G’Ö&÷VæB6W76–öâf—'7BârÀĞ¢66÷S¢u66VæRrÀĞ¢&—f7“¢u66÷RrÀĞ¢&—fFS¢u&—fFRrÀĞ¢6†&VC¢tWF†÷&—¦VB6†&VBrÀĞ¢6÷W&6S¢u6÷W&6RrÀĞ¢Æö6Ã¢tÆö6Â&—fFRrÀĞ¢Æ–fS¢tÆ–fR&–æF–ærrÀĞ¢WF†÷&—¦VC¢tWF†÷&—¦F–öâfÆ–BrÀĞ¢VæWF†÷&—¦VC¢tWF†÷&—¦F–öâ–çfÆ–BrÀĞ¢÷fW'f–Ws¢t÷fW'f–WrrÀĞ¢6WGF–æw3¢tWföÇWF–öârÀĞ¢6öçFW‡C¢t6öçFW‡BbFööÇ2rÀĞ¢'VÆW3¢u6W76–öâ'VÆW2rÀĞ¢FF¢tFFbF–væ÷7F–72rÀĞ¢–çFW&W7G3¢t–çFW&W7G2rÀĞ¢VF—C¢tWfVçG2bVF—BrÀĞ¢Gfæ6VC¢tGfæ6VBrÀĞ¢F–væ÷7F–73¢tF–væ÷7F–72rÀĞ¢ÖööC¢tÖööBrÀĞ¢VæW&w“¢tVæW&w’rÀĞ¢7W&–÷6—G“¢t7W&–÷6—G’rÀĞ¢&6VÆ–æS¢t&6VÆ–æRrÀĞ¢Æ7EWFFS¢tÆ7BWFFRrÀĞ¢Æ7DWfVçC¢tÆ7BWfVçBrÀĞ¢FVæFVæ7“¢uFVæFVæ7’rÀĞ¢7FFT†VÇF‡“¢u7FFRVæv–æR&VG’rÀĞ¢7FFTFVw&FVC¢u7FFRVæv–æRVæf–Æ&ÆRrÀĞ¢–æ¦V7F–öã¢tG–æÖ–26öçFW‡BrÀĞ¢6öçFW‡Döfc¢töfbrÀĞ¢6öçFW‡D'&–Vc¢t'&–Vb7FFRrÀĞ¢6öçFW‡E7FFT–çFW&W7G3¢u7FFRæB–çFW&W7G2rÀĞ¢æ÷&ÖÃ¢u&VG’rÀĞ¢Væf–Æ&ÆS¢uVæf–Æ&ÆRrÀĞ¢F—66öææV7FVC¢tæ÷B6öææV7FVBrÀĞ¢Væ&ÆVC¢tVæ&ÆVBrÀĞ¢F—6&ÆVC¢tF—6&ÆVBrÀĞ¢æõ7FFS¢uF†—266VæR†2æò&VF&ÆR7FFRârÀĞ¢æô–çFW&W7G3¢tæò–çFW&W7G2–WBâFBöæRÖçVÆÇ’Â÷"ÆWBÆVv—F–ÖFRWfVçG2f÷&Ò&V6VçB–çFW&W7G2ârÀĞ¢FD–çFW&W7C¢tFB–çFW&W7BrÀĞ¢æÖS¢tæÖRrÀĞ¢Æ–6W3¢tÆ–6W2†6öÖÖ6W&FVB’rÀĞ¢ÖçVÄ&6VÆ–æS¢tÖçVÂ&VfW&Væ6RrÀĞ¢7F—f—G“¢u&V6VçB7F—f—G’rÀĞ¢FC¢tFBrÀĞ¢WFFS¢u6fR6†ævW2rÀĞ¢VF—C¢tF§W7BrÀĞ¢F—6&ÆS¢tF—6&ÆRrÀĞ¢Væ&ÆS¢tVæ&ÆRrÀĞ¢FVÆWFS¢tFVÆWFRrÀĞ¢–çFW&W7DFVÆWFVC¢t–çFW&W7B&VÖ÷fVBg&öÒ7FFS²ÖVÖ÷'’æBVF—B†—7F÷'’&RVæffV7FVBârÀĞ¢–çFW&W7DFVÆWFT†–çC¢tFVÆWF–ærffV7G2öæÇ’7FFR–çFW&W7B6öæf–wW&F–öâæB&V6VçB7F—f—G“²—BFöW2æ÷BFVÆWFRÖVÖ÷'’÷"VF—B†—7F÷'’â—B'Vç2öæÇ’gFW"6öæf—&ÖF–öâârÀĞ¢–çFW&W7DF—6&ÆVC¢t–çFW&W7BF—6&ÆVC²†—7F÷&–6ÂFF—2¶WBârÀĞ¢6öæf—&ÔFVÆWFUF—FÆS¢tFVÆWFRF†—2–çFW&W7CòrÀĞ¢6öæf—&ÔFVÆWFT&öG“¢uF†—2&VÖ÷fW2öæÇ’7FFUÂw2–çFW&W7BæÖRæB&V6VçB7F—f—G’âÖVÖ÷'’VçG&–W2æBVF—B†—7F÷'’&Ræ÷BFVÆWFVBârÀĞ¢6öæf—&Õ&W6WEF—FÆS¢u&W6WB7W'&VçB7FFRFò&6VÆ–æSòrÀĞ¢6öæf—&Õ&W6WD&öG“¢uF†—2—26W&FR†–v‚Ö–×7B÷W&F–öââFF&6R&6·W—27&VFVBf—'7BÂF†VâÖööBÂVæW&w’ÂæB7W&–÷6—G’&WGW&âFòF†V—"6öæf–wW&VB&6VÆ–æW2â–çFW&W7G2æB†—7F÷'’&R¶WBârÀĞ¢6öæf—&Ó¢t6öæf—&ÒrÀĞ¢6Æ÷6S¢t6æ6VÂrÀĞ¢&W6WC¢u&W6WB7W'&VçB7FFRFò&6VÆ–æRrÀĞ¢&W6WDFöæS¢t7W'&VçB7FFRv2&W6WBæBöæRFÖ–âVF—B&÷rv2w&—GFVâârÀĞ¢&6·W¢t7&VFRFF&6R&6·WrÀĞ¢&6·W6öæf—&ÕF—FÆS¢t7&VFR&6·WòrÀĞ¢&6·W6öæf—&Ô&öG“¢t7&VFW26öç6—7FVçB&6·WVæFW"F†RFFF—&V7F÷'•Âw2&6·W2föÆFW"v—F†÷WB6†æv–ær7FFRârÀĞ¢&6·WFöæS¢t&6·W7&VFVC¢rÀĞ¢&6·W3¢tFF&6R&6·WæB&W7F÷&RrÀĞ¢æô&6·W3¢tæò&6·W2–WBâ7&VFRöæRf—'7BÂF†Vâ6VÆV7B—B†W&RFò&W7F÷&RârÀĞ¢6VÆV7D&6·W¢u6VÆV7B&6·WrÀĞ¢&W7F÷&T&6·W¢u&W7F÷&Rg&öÒ&6·WrÀĞ¢&W7F÷&T&6·WF—FÆS¢u&W7F÷&RFF&6Rg&öÒ&6·WòrÀĞ¢&W7F÷&T&6·W&öG“¢uF†R&6·W—26†V6¶VBf÷"–çFVw&—G’Â66†VÖÂæB&WV—&VBF&ÆW3²6fWG’&6·W—2ÖFRÂF†VâF†R7W'&VçB7FFRFF&6R—2&WÆ6VBæB&V÷VæVBâf–ÇW&R&W7F÷&W2F†R÷&–v–æÃ²öæÇ’7FFRFF—2ffV7FVBÂæWfW"ÖVÖ÷'’ârÀĞ¢&W7F÷&T&6·W†–çC¢t6öæf—&ÒF†R&6·WfW'6–öâÖF6†W2F†—2ÇVv–ââgFW"7V66W72F†RvR&VÆöG27FFRFFârÀĞ¢&W7F÷&T&6·WFöæS¢u&W7F÷&VBg&öÒ&6·W²F†R7FFRFF&6Rv2&V÷VæVBârÀĞ¢6VÆV7D&6·W&WV—&VC¢u6VÆV7B&6·Wf—'7BârÀĞ¢6öæf—&Õ&W7F÷&S¢u&W7F÷&RrÀĞ¢&W7F÷&TFVfVÇG3¢u&W7F÷&RFVfVÇB&ÖWFW'2rÀĞ¢&W7F÷&T6öæf—&ÕF—FÆS¢u&W7F÷&RFVfVÇB&ÖWFW'3òrÀĞ¢&W7F÷&T6öæf—&Ô&öG“¢t6ÆV'2ÇVv–â6öæf–wW&F–öâ÷fW'&–FW2æB&W7F÷&W2FVfVÇG2öæÇ“²7FFRÂ–çFW&W7G2ÂæBVF—B†—7F÷'’&R¶WBârÀĞ¢&W7F÷&TFöæS¢t6öæf–wW&F–öâ&W7F÷&VBFòFVfVÇG2ârÀĞ¢&Wf–Ws¢u&Wf–WrVffV7BrÀĞ¢&Wf–WtWfVçC¢u&Wf–WrWfVçBG—RrÀĞ¢&Wf–Wt†–çC¢uF†R&Wf–WrW6W2F†R7W'&VçBG&gB&ÖWFW'2'WBæWfW"w&—FW2F†RFF&6RârÀĞ¢Gfæ6VD†–çC¢uF†W6R&ÖWFW'2ffV7B&V6÷fW'’7VVBÂ62ÂæB&WFVçF–öââ6†ævW2F¶RVffV7B–ÖÖVF–FVÇ“²æò&W7F'B—2&WV—&VBârÀĞ¢FVfVÇC¢tFVfVÇBrÀĞ¢&ævS¢u&ævRrÀĞ¢&W7F'C¢u&WV—&W2ÇVv–â&W7F'BrÀĞ¢Æ—fS¢uF¶W2VffV7B–ÖÖVF–FVÇ’rÀĞ¢vS¢uvRrÀĞ¢vTöc¢röbrÀĞ¢&Wc¢u&Wf–÷W2rÀĞ¢æW‡C¢tæW‡BrÀĞ¢F÷FÃ¢w&V6÷&G2rÀĞ¢æôWfVçG3¢tæò7FFR6†ævW2&V6÷&FVB–WBârÀĞ¢F–ÖS¢uF–ÖRrÀĞ¢G—S¢uG—RrÀĞ¢FVÇF¢tVffV7BrÀĞ¢&V6öã¢u&V6öârÀĞ¢6÷W&6UG'W7C¢u6÷W&6RòG'W7BrÀĞ¢FWF–Ç3¢tFWF–Ç2rÀĞ¢&Vf÷&TgFW#¢t&Vf÷&RògFW"rÀĞ¢Wf–FVæ6S¢tWf–FVæ6R&VfW&Væ6W2rÀĞ¢fW'6–öã¢ufW'6–öârÀĞ¢FF&6S¢tFF&6RrÀĞ¢66†VÖ¢u66†VÖfW'6–öârÀĞ¢Æ–fT–çFVw&F–öã¢tÆ–fR–çFW&f6RrÀĞ¢ÖVÖ÷'”–çFVw&F–öã¢tÖVÖ÷'’–çFW&f6RrÀĞ¢ÖVÖ÷'•w&—FS¢tÖVÖ÷'’w&—FRrÀĞ¢ÖVÖ÷'•w&—FUVæf–Æ&ÆS¢uVæf–Æ&ÆR†æò66VæR×66÷VB6öçG&7B’rÀĞ¢ÖVÖ÷'•w&—FU6fS¢tf–Æ&ÆR‡66VæR×66÷VB6öçG&7BfW&–f–VB’rÀĞ¢Æ7DW'&÷#¢tÆ7BW'&÷"rÀĞ¢6÷VçG3¢t6÷VçG2rÀĞ¢6öæf–u6÷W&6S¢t6öæf–wW&F–öâ6÷W&6RrÀĞ¢6ÖU6÷W&6S¢uF†RÇVv–âÖævW"æBF†—2vR6†&RE4…Âw2WF†÷&—FF—fR6WGF–æw2Fö7VÖVçBæB&Wf—6–öâârÀĞ¢6WGF–æw5Væf–Æ&ÆS¢uF†R6WGF–æw2æÖW76R—2Væf–Æ&ÆS²F†RÇVv–âÖ’&RF—6&ÆVBârÀĞ¢&WVW7Df–ÆVC¢u&WVW7Bf–ÆVC¢rÀĞ¢æõW&Ö—76–öã¢töæÇ’F†RWF†VçF–6FVBE4‚÷væW"Ö’ÖævR7FFRârÀĞ¢66÷W3¢u7FFR66VæW2rÀĞ¢v÷&·76S¢uv÷&·76RrÀĞ¢æõv÷&·76S¢tæòv÷&·76R&÷VæBrÀĞ¢&–æEv÷&·76S¢t&–æBv÷&·76RrÀĞ¢Væ&–æEv÷&·76S¢uVæ&–æBrÀĞ¢v÷&·76T&÷VæC¢uv÷&·76R&÷VæBrÀĞ¢v÷&·76UVæ&÷VæC¢uVæ&÷VæB†ÆVv7’c&—fFRÖöFR’rÀĞ¢v÷&·76TÖ—76–æs¢uv÷&·76RÖ—76–ærrÀĞ¢v÷&·76U&Vv—7G'•Væf–Æ&ÆS¢wv÷&·76U&Vv—7G'’Væf–Æ&ÆRrÀĞ¢v÷&·76U–6³¢t6†ö÷6RE4‚v÷&·76RrÀĞ¢v÷&·76T†–çC¢uW6W2F†Röff–6–ÂE4‚v÷&·76U&Vv—7G'’7F&ÆR–BæBÆ—fR6W76–öä–G3²F—FÆW2æBF‡2æWfW"FV6–FR–FVçF—G’ârÀĞ¢v÷&·76U&V&–æC¢t&–æBF–ffW&VçBv÷&·76SòrÀĞ¢v÷&·76U&V&–æD&öG“¢uF†—27v—F6†W2F†Rv÷&·76RÖ–â7FFRâF†RöÆBv÷&·76R7FFRÂ'VÆW2ÂæBVF—B&R¶WBæBæWfW"ÖW&vVBârÀĞ¢Væ&–æEF—FÆS¢uVæ&–æBv÷&·76SòrÀĞ¢Væ&–æD&öG“¢tgFW"Væ&–æF–ærÂ7FFR&WGW&ç2FòcW"Õ6W76–öâ&—fFR&V†f–÷"âöÆBFFÂ'VÆW2ÂæBVF—B&R¶WBæBæWfW"ÖW&vVBârÀĞ¢v÷&·76TFVfVÇDÖöFS¢tFVfVÇB6W76–öâöÆ–7’rÀĞ¢v÷&·76TFVfVÇD†–çC¢uv÷&·76RÖVÖ&W'26†&RF†RÖ–â7FFR'’FVfVÇC²FBW†6WF–öç2&VÆ÷rârÀĞ¢v÷&·76TÖ–ã¢uv÷&·76R6†&VBÖ–â7FFRrÀĞ¢v÷&·76TÆVv7“¢tÆVv7’&—fFR66÷W2æBVF—B&R&WF–æVBÂæWfW"WFòÖÖW&vVBârÀĞ¢v÷&·76Tæô&–æF–æs¢t&–æBv÷&·76RFò6†&RöæRÖ–â7FFR7&÷72—G2ÆVv—F–ÖFR6W76–öç2ârÀĞ¢6W76–öå'VÆW3¢u6W76–öâ'VÆW2rÀĞ¢6W76–öå'VÆW4†–çC¢u'VÆW266WB7F&ÆR6W76–öâ–G2öæÇ’æB&RfW&–f–VBv–ç7BÆ—fRv÷&·76RÖVÖ&W'6†—â&Wfö6F–öâÆ–W2FòF†RæW‡BFööÂ6ÆÂÂ–æ¦V7F–öâÂ÷"WfVçBârÀĞ¢6W76–öã¢u6W76–öârÀĞ¢ÖöFS¢tÖöFRrÀĞ¢ÖöFU6†&VC¢u6†&VBrÀĞ¢ÖöFU&VDöæÇ“¢u&VBÖöæÇ’rÀĞ¢ÖöFT—6öÆFVC¢t—6öÆFVBrÀĞ¢ÖöFTF—6&ÆVC¢tF—6&ÆVBrÀĞ¢ÖöFU6†&VD†VÇ¢u&VG2F†RÖ–â7FFS²ÆVv—F–ÖFRWfVçG2g&öÒF†—26W76–öâÖ’ffV7B—B6Æ–v‡FÇ’ârÀĞ¢ÖöFU&VDöæÇ”†VÇ¢u&VG2F†RÖ–â7FFRv—F†÷WBÖöF–g––ær—Bâ7V—F&ÆRf÷"'W7’w&÷W6†G2æBö'6W'fF–öâârÀĞ¢ÖöFT—6öÆFVD†VÇ¢uW6W2F†—26W76–öåÂw2÷vâ7FFRæB–çFW&W7G3²æWfW"&VG2÷"w&—FW2F†RÖ–â7FFRârÀĞ¢ÖöFTF—6&ÆVD†VÇ¢tæò–æ¦V7F–öâÂæòWfVçB&ö6W76–ærÂæòVffV7F—fRÖöFVÂ&VB÷w&—FS²FF—2&WF–æVBârÀĞ¢6fU'VÆS¢tÇ’'VÆRrÀĞ¢6ÆV%'VÆS¢uW6RFVfVÇBrÀĞ¢'VÆU6fVC¢u6W76–öâ'VÆR6fVBæBVffV7F—fR–ÖÖVF–FVÇ’ârÀĞ¢'VÆT6ÆV&VC¢uv÷&·76RFVfVÇBöÆ–7’&W7F÷&VBârÀĞ¢&6†—fVE6W76–öã¢t&6†—fVBrÀĞ¢æõ6W76–öç3¢uF†—2v÷&·76R†2æòÖævV&ÆR6W76–öç2ârÀĞ¢66VæUVæf–Æ&ÆS¢uw&÷W÷&—fFRÖçVÖ&W"'VÆW2&Ræ÷B–×ÆVÖVçFVC¢F†—2E4‚W‡÷6W2æòV&Æ–6Ç’fW&–f–&ÆR66VæRÖ–ærâöæÇ’7F&ÆR6W76–öâ–G2&R66WFVBÂæWfW"F—7Æ’æÖW2ârÀĞ¢æôW‡G&ÖöFVÃ¢tæòFF—F–öæÂÖöFVÂ&—6Â—2–×ÆVÖVçFVC²æòW‡G&ÄÄÒ—27F'FVBW"GW&âârÀĞ¢WFôWföÇWF–öã¢u÷7B×GW&âWföÇWF–öârÀĞ¢WFôWföÇWF–öä†VÇ¢u&ö6W76W2öæÇ’6ö×ÆWFVB&VÂÖöFVÂGW&ç2ÂFVGWÆ–6FVBæB&FRÖÆ–Ö—FVB'’7F&ÆR6W76–öâ÷GW&â÷6WWf–FVæ6RârÀĞ¢–æ¦V7F–öäÆWfVÃ¢t–æ¦V7F–öâÆWfVÂrÀĞ¢–æ¦V7F–öä'&–Vc¢t'&–VbrÀĞ¢–æ¦V7F–öäFWF–ÆVC¢tFWF–ÆVBrÀĞ¢FööÅ7FGW3¢tÖöFVÂFööÂ7FGW2rÀĞ¢FööÄvWC¢w7FFUövWBrÀĞ¢FööÄ&—6S¢w7FFUö&—6R†÷F–öæÂÆ÷rG'W7B’rÀĞ¢FööÄ–çFW&W7G3¢w7FFUö–çFW&W7G2rÀĞ¢FööÄ†VÇFƒ¢w7FFUö†VÇF‚rÀĞ¢FööÄF—6&ÆVDæ÷FS¢t–âF—6&ÆVBÖöFRÂÖöFVÂFööÇ2&WGW&âæòVffV7F—fR7FFRârÀĞ¢FF†–çC¢tFF&6RÂÖ–w&F–öâÂ&6·WÂæBF–væ÷7F–72â&W7F÷&R7F–ÆÂæVVG2W‡Æ–6—B6öæf—&ÖF–öâârÀĞ¢Ö–w&F–öã¢u66†VÖÖ–w&F–öârÀĞ¢Ö–w&F–öäæöæS¢tæòÖ–w&F–öâ&V6÷&G2ârÀĞ¢Ö–w&F–öä&6·W¢u&RÖÖ–w&F–öâ&6·WrÀĞ¢7F÷&vS¢tÆö6Â7F÷&vRrÀĞ¢ÆVv7•&W6W'fVC¢tÆVv7’c&—fFR66÷W2æBVF—B&R&WF–æVBæBæWfW"WFòÖÖW&vVB–çFòF†Rv÷&·76RÖ–â7FFRârÀĞ¢6öçFW‡EvT†–çC¢u&VG2F†RÆFW7B7FFRV6‚F–ÖRÖöFVÂ6öçFW‡B—27GVÆÇ’76VÖ&ÆVC²—BæWfW"–æ¦V7G2gVÆÂWfVçB†—7F÷'’÷"6ÆÇ2æ÷F†W"ÖöFVÂârÀĞ¢WföÇWF–öåvT†–çC¢tF§W7B–æfÇVVæ6RÂ&V6÷fW'’ÂæB÷7B×GW&âWföÇWF–öã²WfW'’6WGF–ærÆ–W2–ÖÖVF–FVÇ’ârÀĞ¢WfVçE7F÷&VC¢u7FFRWfVçB&V6÷&FVBârÀĞ¢–çFW&W7DFFVC¢t–çFW&W7BFFVBârÀĞ¢–çFW&W7EWFFVC¢t–çFW&W7BWFFVBârÀĞ¢–çfÆ–Df–VÆC¢ufÇVR—2÷WG6–FRF†RÆÆ÷vVB&ævRârÀĞ¢Ææs¢~KŠŞihrrÀĞ¢&6³¢t&6²rÀĞ¢æ÷Df–Æ&ÆS¢uVæf–Æ&ÆRrÀĞ¢æ÷D6öææV7FVC¢tæ÷B6öææV7FVBrÀĞ¢÷F–öæÃ¢t÷F–öæÂrÀĞ¢–W3¢u–W2rÀĞ¢æó¢tæòrÀĞ¢66÷U&—fFTæ÷FS¢u&VG2W6RöæÇ’F†—26W76–öåÂw2WF†÷&—¦VB66VæS²&—fFRfÇVW2æB&V6öç2g&öÒ÷F†W"66VæW2&RæWfW"ÖW&vVBârÀĞ¢FÖ–äæ÷FS¢uvR&WVW7G2&WV—&RâWF†VçF–6FVBE4‚÷væW#²Æö÷&6²FG&W72ÆöæR—2æ÷BFÖ–æ—7G&F÷"WF†÷&—¦F–öâârÀĞ¢FWF–ÅF—FÆS¢u7FFR&6–26öæf–wW&F–öârÀĞ¢FWF–Ä–çG&ó¢u6†&W2F†R6ÖRE4‚6WGF–æw2Fö7VÖVçBæB&Wf—6–öâ2F†RÖFWW27FFRvRârÀĞ¢FWF–Ä†VÇFƒ¢tVæv–æRrÀĞ¢FWF–ÅVæf–Æ&ÆS¢u7FFRVæf–Æ&ÆRrÀĞ¢FWF–Å6fVC¢u6fVC²F†RÖFWW27FFRvR&VfÆV7G2—B–ÖÖVF–FVÇ’ârÀĞ¢FWF–Äæô6†ævW3¢tæò6†ævW2ârÀĞ¢FWF–Å&W7F'C¢uF†W6Rf–VÆG2F¶RVffV7B–ÖÖVF–FVÇ“²F†RFF&6RF‚—2æ÷B–âF†—26&Bâ–bE4‚6·2f÷"&W7F'BÂföÆÆ÷rF†B&ö×BârÀĞ¢ÒÀĞ§Ó°Ğ Ğ¦7–æ2gVæ7F–öâ’‡F‚Â÷F–öç2’°Ğ¢6öç7B–æ—BÒ°Ğ¢7&VFVçF–Ç3¢w6ÖRÖ÷&–v–ârÀĞ¢†VFW'3¢²w‚ÖÖFWW2×7FFRs¢srÒÀĞ¢âââ†÷F–öç2óò·Ò’ÀĞ¢Ó°Ğ¢–b†–æ—Bæ&öG’ÓÒVæFVf–æVBbbG—Vöb–æ—Bæ&öG’ÓÒw7G&–ærr’°Ğ¢–æ—Bæ†VFW'2Ò²ââæ–æ—Bæ†VFW'2Âv6öçFVçB×G—Rs¢vÆ–6F–öâö§6öârÓ°Ğ¢–æ—Bæ&öG’Ò¥4ôâç7G&–æv–g’†–æ—Bæ&öG’“°Ğ¢ĞĞ¢6öç7B&W2Òv—BfWF6‚„•õ$ôõB²F‚Â–æ—B“°Ğ¢ÆWB–ÆöC°Ğ¢G'’°Ğ¢–ÆöBÒv—B&W2æ§6öâ‚“°Ğ¢Ò6F6‚°Ğ¢F‡&÷ræWrW'&÷"‚~ZëşK‹¾hê^Xú>iÊ®[{º®ûÈ„…EEr²&W2ç7FGW2²~ûÈ’r“°Ğ¢ĞĞ¢–b‚&W2æö²ÇÂ–ÆöBÇÂ–ÆöBæö²ÓÒG'VR’°Ğ¢F‡&÷ræWrW'&÷"‡–ÆöBbb–ÆöBæW'&÷"ò–ÆöBæW'&÷"¢t…EEr²&W2ç7FGW2“°Ğ¢ĞĞ¢&WGW&â–ÆöBæFF°Ğ§ĞĞ Ğ¦gVæ7F–öâf×B‡fÇVR’°Ğ¢6öç7BâÒÖF‚ç&÷VæB„çVÖ&W"‡fÇVR’¢’ò°Ğ¢&WGW&âçVÖ&W"æ—4f–æ—FR†â’òâ¢°Ğ§ĞĞ Ğ¦gVæ7F–öâ66÷TÆ&VÂ‡66÷RÂBÂÆær’°Ğ¢–b‚66÷R’&WGW&ârs°Ğ¢6öç7B&—f7’Ò66÷Rç&—f7’ÓÓÒw6†&VBròB‚w6†&VBr’¢B‚w&—fFRr“°Ğ¢6öç7BWF†÷&—¦F–öâÒ66÷RæWF†÷&—¦VBÓÓÒfÇ6Ròr+rr²B‚wVæWF†÷&—¦VBr’¢rs°Ğ¢&WGW&â‡66÷Rç6÷W&6RÓÓÒvÆ–fRròB‚vÆ–fRr’¢66÷Rç6÷W&6RÓÓÒwv÷&·76RròB‚wv÷&·76TÖ–âr’¢B‚vÆö6Âr’’²r+rr²&—f7’²r+rr²7G&–ær‡66÷Rç66VæT–BÇÂ66÷Ræ–B’ç6Æ–6RƒÂ3B’²WF†÷&—¦F–öã°Ğ§ĞĞ Ğ¦gVæ7F–öâWfVçDÆ&VÂ‡G—RÂÆær’°Ğ¢6öç7B¦‚Ò°Ğ¢ÖVæ–ævgVÅö–çFW&7F–öã¢~iÈhHşK˜y¨NK©.Xª‚rÀĞ¢W‡Æ÷&F–öåö6ö×ÆWFVC¢~hê.{J.ZèÎh‰rÀĞ¢¶æ÷vÆVFvUöv–æVC¢~ˆë~[é~ikyú^ŠøbrÀĞ¢F–ff–7VÇG“¢~˜~X‹Y»™«ârÀĞ¢ÖVÖ÷'•÷&VfW&Væ6S¢~Šë[øn[É^yJ‚rÀĞ¢Æ–fUö6ö×ÆWFVC¢tÆ–fRkK¾XªZèÎh‰rÀĞ¢Æ–fUöf–ÆVC¢tÆ–fRkK¾XªZK‹JRrÀĞ¢FÖ–å÷&W6WC¢~zêynY˜xŞ{ÚârÀĞ¢6Æö6µöæöÖÇ“¢~i{n™{N[È.[‹‚rÀĞ¢Ó°Ğ¢6öç7BVâÒ°Ğ¢ÖVæ–ævgVÅö–çFW&7F–öã¢tÖVæ–ævgVÂ–çFW&7F–öârÀĞ¢W‡Æ÷&F–öåö6ö×ÆWFVC¢tW‡Æ÷&F–öâ6ö×ÆWFVBrÀĞ¢¶æ÷vÆVFvUöv–æVC¢t¶æ÷vÆVFvRv–æVBrÀĞ¢F–ff–7VÇG“¢tF–ff–7VÇG’rÀĞ¢ÖVÖ÷'•÷&VfW&Væ6S¢tÖVÖ÷'’&VfW&Væ6RrÀĞ¢Æ–fUö6ö×ÆWFVC¢tÆ–fR7F—f—G’6ö×ÆWFVBrÀĞ¢Æ–fUöf–ÆVC¢tÆ–fR7F—f—G’f–ÆVBrÀĞ¢FÖ–å÷&W6WC¢tFÖ–â&W6WBrÀĞ¢6Æö6µöæöÖÇ“¢t6Æö6²æöÖÇ’rÀĞ¢Ó°Ğ¢&WGW&â†ÆærÓÓÒvVâròVâ¢¦‚•·G—UÒóò7G&–ær‡G—R“°Ğ§ĞĞ Ğ¦gVæ7F–öâ6öæf—&ÔF–Æör‡²÷VâÂF—FÆRÂ&öG’Â6öæf—&ÔÆ&VÂÂ6æ6VÄÆ&VÂÂFævW"Âöä6öæf—&ÒÂöä6æ6VÂÒ’°Ğ¢6öç7B&VbÒ&V7BçW6U&Vb†çVÆÂ“°Ğ¢&V7BçW6TVffV7B‚‚’Óâ°Ğ¢–b‚÷Vâ’&WGW&âVæFVf–æVC°Ğ¢6öç7B&Wf–÷W2ÒFö7VÖVçBæ7F—fTVÆVÖVçC°Ğ¢6öç7BF–ÖW"Ò6WEF–ÖV÷WB‚‚’Óâ&Vbæ7W'&VçCòæfö7W2‚’Â“°Ğ¢6öç7Böä¶W’Ò†WfVçB’Óâ°Ğ¢–b†WfVçBæ¶W’ÓÓÒtW66Rr’öä6æ6VÂ‚“°Ğ¢Ó°Ğ¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚v¶W–F÷vârÂöä¶W’“°Ğ¢&WGW&â‚’Óâ°Ğ¢6ÆV%F–ÖV÷WB‡F–ÖW"“°Ğ¢Fö7VÖVçBç&VÖ÷fTWfVçDÆ—7FVæW"‚v¶W–F÷vârÂöä¶W’“°Ğ¢–b‡&Wf–÷W2bbG—Vöb&Wf–÷W2æfö7W2ÓÓÒvgVæ7F–öâr’&Wf–÷W2æfö7W2‚“°Ğ¢Ó°Ğ¢ÒÂ¶÷VâÂöä6æ6VÅÒ“°Ğ¢–b‚÷Vâ’&WGW&âçVÆÃ°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v÷fW&Æ’rÂöäÖ÷W6TF÷vã¢†WfVçB’Óâ²–b†WfVçBçF&vWBÓÓÒWfVçBæ7W'&VçEF&vWB’öä6æ6VÂ‚“²ÒÒÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vF–ÆörrÂ&öÆS¢vF–ÆörrÂv&–ÖÖöFÂs¢wG'VRrÂv&–ÖÆ&VÂs¢F—FÆRÒÀĞ¢‚‚vƒ2rÂçVÆÂÂF—FÆR’ÀĞ¢G—Vöb&öG’ÓÓÒw7G&–ærrò‚‚wrÂçVÆÂÂ&öG’’¢&öG’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢öä6æ6VÂÒÂ6æ6VÄÆ&VÂ’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢FævW"òvFævW"r¢w&–Ö'’rÂ&VbÂöä6Æ–6³¢öä6öæf—&ÒÒÂ6öæf—&ÔÆ&VÂ’ÀĞ¢’ÀĞ¢’ÀĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâ7FFT6&B‡²Æ&VÂÂfÇVRÂ&6VÆ–æRÂVæ—BÂÖ–âÂÖ‚ÂF—&V7F–öâÂBÒ’°Ğ¢6öç7BW&6VçBÒÖF‚æÖ–âƒÂÖF‚æÖ‚ƒÂ‚„çVÖ&W"‡fÇVR’ÒÖ–â’ò†Ö‚ÒÖ–â’’¢’“°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v6&BrÒÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v×WFVBrÒÂÆ&VÂ’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂf×B‡fÇVR’²‡Væ—Bòròr²Væ—B¢rr’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v&"rÂv&–Ö†–FFVâs¢wG'VRrÒÂ‚‚w7ârÂ²7G–ÆS¢²v–GFƒ¢W&6VçB²rRrÒÒ’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v&6RrÒÂB‚v&6VÆ–æRr’²rr²f×B†&6VÆ–æR’²r+rr²F—&V7F–öâ’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w&ævRr’²rr²Ö–â²~(
br²Ö‚’ÀĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâçVÖ&W$6öçG&öÂ‡²f–VÆBÂfÇVRÂW'&÷"ÂF—6&ÆVBÂöä6†ævRÂBÂÆærÒ’°Ğ¢6öç7B†VÇÒf–VÆE¶ÆæuÒÇÂf–VÆBç¦ƒ°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v6öçG&öÂrÒÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v–æÆ–æRrÒÀĞ¢‚‚v–çWBrÂ°Ğ¢G—S¢w&ævRrÀĞ¢Ö–ã¢f–VÆBæÖ–âÀĞ¢Öƒ¢f–VÆBæÖ‚ÀĞ¢7FW¢f–VÆBç7FWóòÀĞ¢fÇVS¢çVÖ&W"‡fÇVR’ÀĞ¢F—6&ÆVBÀĞ¢v&–ÖÆ&VÂs¢†VÇæÆ&VÂÀĞ¢öä6†ævS¢†WfVçB’Óâöä6†ævR†6Æ×f–VÆEfÇVR†f–VÆBÂWfVçBçF&vWBçfÇVR’’ÀĞ¢Ò’ÀĞ¢‚‚v–çWBrÂ°Ğ¢G—S¢vçVÖ&W"rÀĞ¢Ö–ã¢f–VÆBæÖ–âÀĞ¢Öƒ¢f–VÆBæÖ‚ÀĞ¢7FW¢f–VÆBç7FWóòÀĞ¢fÇVS¢çVÖ&W"‡fÇVR’ÀĞ¢F—6&ÆVBÀĞ¢v&–ÖÆ&VÂs¢†VÇæÆ&VÂ²r‚r²B‚w&ævRr’²rr²f–VÆBæÖ–â²~(	2r²f–VÆBæÖ‚²r’rÀĞ¢öä6†ævS¢†WfVçB’Óâöä6†ævR†6Æ×f–VÆEfÇVR†f–VÆBÂWfVçBçF&vWBçfÇVR’’ÀĞ¢Ò’ÀĞ¢’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w&ævRr’²rr²f–VÆBæÖ–â²~(	2r²f–VÆBæÖ‚²†f–VÆBçVæ—Bòrr²f–VÆBçVæ—B¢rr’²r+rr²B‚vFVfVÇBr’²rr²f–VÆBæFVfVÇB²r+rr²†f–VÆBç&W7F'BòB‚w&W7F'Br’¢B‚vÆ—fRr’’’ÀĞ¢W'&÷"ò‚‚vF—brÂ²6Æ74æÖS¢vW'&÷%FW‡BrÒÂB†W'&÷"’’¢çVÆÂÀĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâf–VÆE&÷r‡²f–VÆBÂG&gBÂ6æ6†÷BÂW'&÷'2ÂF—6&ÆVBÂöä6†ævRÂBÂÆærÒ’°Ğ¢6öç7B†VÇÒf–VÆE¶ÆæuÒÇÂf–VÆBç¦ƒ°Ğ¢6öç7BfÇVRÒG&gBçfÇVW5¶f–VÆBæ¶W•Ó°Ğ¢ÆWB6öçG&öÃ°Ğ¢–b†f–VÆBçG—RÓÓÒv&ööÆVâr’°Ğ¢6öçG&öÂÒ‚€Ğ¢vÆ&VÂrÀĞ¢²6Æ74æÖS¢w7v—F6‚rÒÀĞ¢‚‚v–çWBrÂ°Ğ¢G—S¢v6†V6¶&÷‚rÀĞ¢6†V6¶VC¢fÇVRÓÓÒG'VRÀĞ¢F—6&ÆVBÀĞ¢öä6†ævS¢†WfVçB’Óâöä6†ævR†WfVçBçF&vWBæ6†V6¶VB’ÀĞ¢Ò’ÀĞ¢‚‚w7ârÂçVÆÂÂfÇVRÓÓÒG'VRòB‚vVæ&ÆVBr’¢B‚vF—6&ÆVBr’’ÀĞ¢“°Ğ¢ÒVÇ6R–b†f–VÆBçG—RÓÓÒvVçVÒr’°Ğ¢6öçG&öÂÒ‚€Ğ¢w6VÆV7BrÀĞ¢°Ğ¢fÇVRÀĞ¢F—6&ÆVBÀĞ¢v&–ÖÆ&VÂs¢†VÇæÆ&VÂÀĞ¢öä6†ævS¢†WfVçB’Óâöä6†ævR†WfVçBçF&vWBçfÇVR’ÀĞ¢ÒÀĞ¢ââæf–VÆBæVçVÒæf–ÇFW"‚†÷F–öâ’Óâ÷F–öâÓÒw7FFUö–çFW&W7G2rÇÂfÇVRÓÓÒw7FFUö–çFW&W7G2r’æÖ‚†÷F–öâ’Óâ°Ğ¢6öç7BÆ&VÇ2Ò°Ğ¢öfc¢B‚v6öçFW‡Döfbr’ÀĞ¢7V'FÆS¢ÆærÓÓÒvVâròu7V'FÆRr¢~‹Û¾[êârÀĞ¢7FæF&C¢ÆærÓÓÒvVâròu7FæF&Br¢~j~XxbrÀĞ¢7G&öæs¢ÆærÓÓÒvVâròtæ÷F–6V&ÆRr¢~iˆîi‹ârÀĞ¢'&–Vc¢B‚v6öçFW‡D'&–Vbr’ÀĞ¢7FFUö–çFW&W7G3¢B‚v6öçFW‡E7FFT–çFW&W7G2r’ÀĞ¢FWF–ÆVC¢B‚v–æ¦V7F–öäFWF–ÆVBr’ÀĞ¢Ó°Ğ¢&WGW&â‚‚v÷F–öârÂ²¶W“¢÷F–öâÂfÇVS¢÷F–öâÒÂÆ&VÇ5¶÷F–öåÒÇÂ÷F–öâ“°Ğ¢Ò’ÀĞ¢“°Ğ¢ÒVÇ6R°Ğ¢6öçG&öÂÒ‚„çVÖ&W$6öçG&öÂÂ°Ğ¢f–VÆBÀĞ¢fÇVRÀĞ¢W'&÷#¢W'&÷'5¶f–VÆBæ¶W•ÒÀĞ¢F—6&ÆVBÀĞ¢öä6†ævRÀĞ¢BÀĞ¢ÆærÀĞ¢Ò“°Ğ¢ĞĞ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vf–VÆBrÒÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vÆ&VÂrÒÀĞ¢†VÇæÆ&VÂÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂ†VÇæ†VÇ’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂ†f–VÆBçG—RÓÓÒvçVÖ&W"pĞ¢òB‚w&ævRr’²rr²f–VÆBæÖ–â²~(	2r²f–VÆBæÖ‚²†f–VÆBçVæ—Bòrr²f–VÆBçVæ—B¢rr’²r+rpĞ¢¢rr’²B‚vFVfVÇBr’²rr²7G&–ær†f–VÆBæFVfVÇB’²r+rr²†f–VÆBç&W7F'BòB‚w&W7F'Br’¢B‚vÆ—fRr’’’ÀĞ¢’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6öçG&öÂrÒÂ6öçG&öÂ’ÀĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâæVÂ‡²7G‚Ò’°Ğ¢6öç7B¶ÆærÂ6WDÆæuÒÒ&V7BçW6U7FFR‚w¦‚r“°Ğ¢6öç7BÆæu&VbÒ&V7BçW6U&Vb†Æær“°Ğ¢Ææu&Vbæ7W'&VçBÒÆæs°Ğ¢6öç7BBÒ&V7BçW6T6ÆÆ&6²‚†¶W’’Óâ°Ğ¢6öç7B7F—fRÒÆæu&Vbæ7W'&VçC°Ğ¢&WGW&â„D”5E¶7F—fUÒbbD”5E¶7F—fUÕ¶¶W•Ò’ÇÂ„D”5Bç¦‚bbD”5Bç¦…¶¶W•Ò’ÇÂ¶W“°Ğ¢ÒÂµÒ“°Ğ¢6öç7B·F"Â6WEF%ÒÒ&V7BçW6U7FFR‚v÷fW'f–Wrr“°Ğ¢6öç7B·6æ6†÷BÂ6WE6æ6†÷EÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶G&gBÂ6WDG&gEÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B·66÷W2Â6WE66÷W5ÒÒ&V7BçW6U7FFR…µÒ“°Ğ¢6öç7B·66÷T–BÂ6WE66÷T–EÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B¶÷fW'f–WrÂ6WD÷fW'f–WuÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶–çFW&W7G2Â6WD–çFW&W7G5ÒÒ&V7BçW6U7FFR…µÒ“°Ğ¢6öç7B¶VF—BÂ6WDVF—EÒÒ&V7BçW6U7FFR‡²—FV×3¢µÒÂF÷FÃ¢ÂÆ–Ö—C¢#Âöfg6WC¢Ò“°Ğ¢6öç7B·vRÂ6WEvUÒÒ&V7BçW6U7FFRƒ“°Ğ¢6öç7B·7FGW2Â6WE7FGW5ÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶F–væ÷7F–72Â6WDF–væ÷7F–75ÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B·v÷&·76TFFÂ6WEv÷&·76TFFÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B·v÷&·76U–6²Â6WEv÷&·76U–6µÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B·'VÆTG&gG2Â6WE'VÆTG&gG5ÒÒ&V7BçW6U7FFR‡·Ò“°Ğ¢6öç7B¶&6·W2Â6WD&6·W5ÒÒ&V7BçW6U7FFR…µÒ“°Ğ¢6öç7B·6VÆV7FVD&6·WÂ6WE6VÆV7FVD&6·WÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B¶ÖW76vRÂ6WDÖW76vUÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B¶W'&÷"Â6WDW'&÷%ÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B¶'W7’Â6WD'W7•ÒÒ&V7BçW6U7FFR†fÇ6R“°Ğ¢6öç7B·&Wf–WtWfVçEG—RÂ6WE&Wf–WtWfVçEG—UÒÒ&V7BçW6U7FFR‚vÖVæ–ævgVÅö–çFW&7F–öâr“°Ğ¢6öç7B·&Wf–WrÂ6WE&Wf–WuÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B¶6öæf—&ÒÂ6WD6öæf—&ÕÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶æWt–çFW&W7BÂ6WDæWt–çFW&W7EÒÒ&V7BçW6U7FFR‡²æÖS¢rrÂ&6VÆ–æS¢cÂÆ–6W3¢rrÒ“°Ğ¢6öç7B¶VF—F–ærÂ6WDVF—F–æuÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7BÆ—fRÒ&V7BçW6U&Vb‡G'VR“°Ğ¢6öç7Bf÷&Õ&VbÒ&V7BçW6U&Vb†çVÆÂ“°Ğ¢6öç7B–æ—F–Æ—¦VBÒ&V7BçW6U&Vb†fÇ6R“°Ğ¢6öç7BG&gE&VbÒ&V7BçW6U&Vb†çVÆÂ“°Ğ¢6öç7B6öæfÆ–7E&VbÒ&V7BçW6U&Vb†fÇ6R“°Ğ¢G&gE&Vbæ7W'&VçBÒG&gC°Ğ Ğ¢6öç7Bf÷&Õ6æ6†÷BÒ&V7BçW6T6ÆÆ&6²‚‚’Óâf÷&Õ&Vbæ7W'&VçCòævWE6æ6†÷B‚’ÂµÒ“°Ğ¢6öç7B66WFVBÒ66WFVEfÇVW2‡6æ6†÷B“°Ğ¢6öç7BF—'G’ÒG&gBbb6æ6†÷Bò—4F—'G’†G&gBÂ6æ6†÷BÂd”TÄE2’¢fÇ6S°Ğ¢6öç7BW'&÷'2ÒG&gBòfÆ–FFTÆÂ†G&gBçfÇVW2Âd”TÄE2’¢·Ó°Ğ¢6öç7B†4W'&÷'2Òö&¦V7Bæ¶W—2†W'&÷'2’æÆVæwF‚â°Ğ Ğ¢6öç7B6†÷tW'&÷"Ò&V7BçW6T6ÆÆ&6²‚‡fÇVR’Óâ°Ğ¢6WDW'&÷"‡fÇVR–ç7Fæ6VöbW'&÷"òfÇVRæÖW76vR¢7G&–ær‡fÇVR’“°Ğ¢6WDÖW76vR‚rr“°Ğ¢ÒÂµÒ“°Ğ¢6öç7B6†÷tÖW76vRÒ&V7BçW6T6ÆÆ&6²‚‡fÇVR’Óâ°Ğ¢6WDÖW76vR‡fÇVR“°Ğ¢6WDW'&÷"‚rr“°Ğ¢ÒÂµÒ“°Ğ Ğ¢6öç7BÆöE7FGW2Ò&V7BçW6T6ÆÆ&6²†7–æ2‚’Óâ°Ğ¢G'’°Ğ¢6öç7BFFÒv—B’‚r÷7FGW2r“°Ğ¢–b†Æ—fRæ7W'&VçB’6WE7FGW2†FF“°Ğ¢Ò6F6‚†R’°Ğ¢–b†Æ—fRæ7W'&VçB’6†÷tW'&÷"‡B‚w&WVW7Df–ÆVBr’²RæÖW76vR“°Ğ¢ĞĞ¢ÒÂ·6†÷tW'&÷%Ò“°Ğ Ğ¢6öç7BÆöE66÷W2Ò&V7BçW6T6ÆÆ&6²†7–æ2‚’Óâ°Ğ¢G'’°Ğ¢6öç7BFFÒv—B’‚r÷66÷W2r“°Ğ¢–b‚Æ—fRæ7W'&VçB’&WGW&ã°Ğ¢6öç7BÆ—7BÒ'&’æ—4'&’†FFç66÷W2’òFFç66÷W2¢µÓ°Ğ¢6WE66÷W2†Æ—7B“°Ğ¢6WE66÷T–B‚†7W'&VçB’Óâ°Ğ¢–b†7W'&VçBbbÆ—7Bç6öÖR‚‡66÷R’Óâ66÷Ræ–BÓÓÒ7W'&VçB’’&WGW&â7W'&VçC°Ğ¢&WGW&âÆ—7E³Óòæ–Bóòrs°Ğ¢Ò“°Ğ¢Ò6F6‚†R’°Ğ¢–b†Æ—fRæ7W'&VçB’6†÷tW'&÷"‡B‚w&WVW7Df–ÆVBr’²RæÖW76vR“°Ğ¢ĞĞ¢ÒÂ·6†÷tW'&÷%Ò“°Ğ Ğ¢6öç7BÆöD÷fW'f–WrÒ&V7BçW6T6ÆÆ&6²†7–æ2†–B’Óâ°Ğ¢–b‚–B’°Ğ¢6WD÷fW'f–Wr†çVÆÂ“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢G'’°Ğ¢6öç7BFFÒv—B’‚rö÷fW'f–Ws÷66÷SÒr²Væ6öFUU$”6ö×öæVçB†–B’“°Ğ¢–b†Æ—fRæ7W'&VçB’6WD÷fW'f–Wr†FF“°Ğ¢Ò6F6‚†R’°Ğ¢–b†Æ—fRæ7W'&VçB’°Ğ¢6WD÷fW'f–Wr†çVÆÂ“°Ğ¢6†÷tW'&÷"‡B‚w&WVW7Df–ÆVBr’²RæÖW76vR“°Ğ¢ĞĞ¢ĞĞ¢ÒÂ·6†÷tW'&÷%Ò“°Ğ Ğ¢6öç7BÆöD–çFW&W7G2Ò&V7BçW6T6ÆÆ&6²†7–æ2†–B’Óâ°Ğ¢–b‚–B’°Ğ¢6WD–çFW&W7G2…µÒ“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢G'’°Ğ¢6öç7BFFÒv—B’‚rö–çFW&W7G3÷66÷SÒr²Væ6öFUU$”6ö×öæVçB†–B’“°Ğ¢–b†Æ—fRæ7W'&VçB’6WD–çFW&W7G2„'&’æ—4'&’†FFæ–çFW&W7G2’òFFæ–çFW&W7G2¢µÒ“°Ğ¢Ò6F6‚†R’°Ğ¢–b†Æ—fRæ7W'&VçB’6†÷tW'&÷"‡B‚w&WVW7Df–ÆVBr’²RæÖW76vR“°Ğ¢ĞĞ¢ÒÂ·6†÷tW'&÷%Ò“°Ğ Ğ¢6öç7BÆöDVF—BÒ&V7BçW6T6ÆÆ&6²†7–æ2†–BÂF&vWEvRÂvU6—¦R’Óâ°Ğ¢–b‚–B’°Ğ¢6WDVF—B‡²—FV×3¢µÒÂF÷FÃ¢ÂÆ–Ö—C¢vU6—¦RÂöfg6WC¢Ò“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢G'’°Ğ¢6öç7BFFÒv—B’‚röWfVçG3÷66÷SÒr²Væ6öFUU$”6ö×öæVçB†–B’²rgvSÒr²F&vWEvR²rgvU6—¦SÒr²vU6—¦R“°Ğ¢–b‚Æ—fRæ7W'&VçB’&WGW&ã°Ğ¢6WDVF—B†FF“°Ğ¢6öç7B6fUvRÒ6Æ×vR‡F&vWEvRÂFFçF÷FÂÂvU6—¦R“°Ğ¢–b‡6fUvRÓÒF&vWEvR’6WEvR‡6fUvR“°Ğ¢Ò6F6‚†R’°Ğ¢–b†Æ—fRæ7W'&VçB’6†÷tW'&÷"‡B‚w&WVW7Df–ÆVBr’²RæÖW76vR“°Ğ¢ĞĞ¢ÒÂ·6†÷tW'&÷%Ò“°Ğ Ğ¢6öç7BÆöDF–væ÷7F–72Ò&V7BçW6T6ÆÆ&6²†7–æ2‚’Óâ°Ğ¢G'’°Ğ¢6öç7BFFÒv—B’‚röF–væ÷7F–72r“°Ğ¢–b‚Æ—fRæ7W'&VçB’&WGW&ã°Ğ¢6WDF–væ÷7F–72†FF“°Ğ¢6öç7BÆ—7BÒ'&’æ—4'&’†FFæ&6·W2’òFFæ&6·W2¢µÓ°Ğ¢6WD&6·W2†Æ—7B“°Ğ¢6WE6VÆV7FVD&6·W‚†7W'&VçB’Óâ†Æ—7Bç6öÖR‚†—FVÒ’Óâ—FVÒæf–ÆRÓÓÒ7W'&VçB’ò7W'&VçB¢†Æ—7E³Óòæf–ÆRóòrr’’“°Ğ¢Ò6F6‚†R’°Ğ¢–b†Æ—fRæ7W'&VçB’6†÷tW'&÷"‡B‚w&WVW7Df–ÆVBr’²RæÖW76vR“°Ğ¢ĞĞ¢ÒÂ·6†÷tW'&÷"ÂEÒ“°Ğ Ğ¢6öç7BÆöEv÷&·76RÒ&V7BçW6T6ÆÆ&6²†7–æ2‚’Óâ°Ğ¢G'’°Ğ¢6öç7BFFÒv—B’‚r÷v÷&·76Rr“°Ğ¢–b‚Æ—fRæ7W'&VçB’&WGW&ã°Ğ¢6WEv÷&·76TFF†FF“°Ğ¢6öç7BÆ—7BÒ'&’æ—4'&’†FFçv÷&·76W3òçv÷&·76W2’òFFçv÷&·76W2çv÷&·76W2¢µÓ°Ğ¢6WEv÷&·76U–6²‚†7W'&VçB’Óâ°Ğ¢–b†7W'&VçBbbÆ—7Bç6öÖR‚†—FVÒ’Óâ—FVÒçv÷&·76T–BÓÓÒ7W'&VçB’’&WGW&â7W'&VçC°Ğ¢&WGW&âFFæ&–æF–æsòçv÷&·76T–BóòÆ—7E³Óòçv÷&·76T–Bóòrs°Ğ¢Ò“°Ğ¢Ò6F6‚†R’°Ğ¢–b†Æ—fRæ7W'&VçB’6†÷tW'&÷"‡B‚w&WVW7Df–ÆVBr’²RæÖW76vR“°Ğ¢ĞĞ¢ÒÂ·6†÷tW'&÷"ÂEÒ“°Ğ Ğ¢&V7BçW6TVffV7B‚‚’Óâ°Ğ¢Æ—fRæ7W'&VçBÒG'VS°Ğ¢ÆWBf÷&Ó°Ğ¢G'’°Ğ¢f÷&ÒÒ7G‚æ6öæf–tf÷&×2ævWB„å2“°Ğ¢f÷&Õ&Vbæ7W'&VçBÒf÷&Ó°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"‡B‚w6WGF–æw5Væf–Æ&ÆRr’“°Ğ¢ĞĞ¢–b†f÷&Ò’°Ğ¢6öç7B7–æ2Ò‚’Óâ°Ğ¢6öç7BæW‡BÒf÷&ÒævWE6æ6†÷B‚“°Ğ¢–b‚Æ—fRæ7W'&VçB’&WGW&ã°Ğ¢6öç7B&Wf–÷W4G&gBÒG&gE&Vbæ7W'&VçC°Ğ¢–b††5&Wf—6–öä6öæfÆ–7B‡&Wf–÷W4G&gBÂæW‡BÂd”TÄE2Â–æ—F–Æ—¦VBæ7W'&VçB’’°Ğ¢6öæfÆ–7E&Vbæ7W'&VçBÒG'VS°Ğ¢6WDW'&÷"‡B‚v6öæfÆ–7Br’“°Ğ¢ĞĞ¢6WE6æ6†÷B†æW‡B“°Ğ¢6WDG&gB‚‡&Wf–÷W2’Óâ°Ğ¢–b‡&Wf–÷W2ÓÓÒçVÆÂÇÂ&Wf–÷W2ç7FGW2ÓÒw&VG’r’&WGW&âG&gDg&öÕ6æ6†÷B†æW‡B“°Ğ¢–b†–æ—F–Æ—¦VBæ7W'&VçBbbæW‡Bç7FGW2ÓÓÒw&VG’rbbæW‡Bç&Wf—6–öâÓÒ&Wf–÷W2ç&Wf—6–öâbb—4F—'G’‡&Wf–÷W2ÂæW‡BÂd”TÄE2’’°Ğ¢&WGW&â²ââç&Wf–÷W2Â&Wf—6–öã¢æW‡Bç&Wf—6–öâÂw&—F&ÆS¢æW‡Bçw&—F&ÆRÂ7FGW3¢æW‡Bç7FGW2Ó°Ğ¢ĞĞ¢–b‚—4F—'G’‡&Wf–÷W2ÂæW‡BÂd”TÄE2’’&WGW&âG&gDg&öÕ6æ6†÷B†æW‡B“°Ğ¢&WGW&â²ââç&Wf–÷W2Â&Wf—6–öã¢æW‡Bç&Wf—6–öâÂw&—F&ÆS¢æW‡Bçw&—F&ÆRÂ7FGW3¢æW‡Bç7FGW2Ó°Ğ¢Ò“°Ğ¢–b†æW‡Bç7FGW2ÓÓÒw&VG’r’–æ—F–Æ—¦VBæ7W'&VçBÒG'VS°Ğ¢Ó°Ğ¢7–æ2‚“°Ğ¢6öç7BVç7V'67&–&RÒf÷&Òç7V'67&–&R‡7–æ2“°Ğ¢ÆöE7FGW2‚“°Ğ¢ÆöE66÷W2‚“°Ğ¢ÆöDF–væ÷7F–72‚“°Ğ¢ÆöEv÷&·76R‚“°Ğ¢&WGW&â‚’Óâ°Ğ¢Æ—fRæ7W'&VçBÒfÇ6S°Ğ¢–æ—F–Æ—¦VBæ7W'&VçBÒfÇ6S°Ğ¢Vç7V'67&–&R‚“°Ğ¢òò6öæf–tf÷&×2ævWB‚’&WGW&ç2†÷7BÖ÷væVB6†&VB6öçG&öÆÆW"âöæÇ’Vç7V'67&–&RF†—2f–WràĞ¢Ó°Ğ¢ĞĞ¢ÆöE7FGW2‚“°Ğ¢ÆöE66÷W2‚“°Ğ¢ÆöDF–væ÷7F–72‚“°Ğ¢ÆöEv÷&·76R‚“°Ğ¢&WGW&â‚’Óâ²Æ—fRæ7W'&VçBÒfÇ6S²Ó°Ğ¢ÒÂ¶7G‚ÂÆöDF–væ÷7F–72ÂÆöE66÷W2ÂÆöE7FGW2ÂÆöEv÷&·76RÂ6†÷tW'&÷%Ò“°Ğ Ğ¢&V7BçW6TVffV7B‚‚’Óâ°Ğ¢–b‚66÷T–B’°Ğ¢6WD÷fW'f–Wr†çVÆÂ“°Ğ¢6WD–çFW&W7G2…µÒ“°Ğ¢6WDVF—B‡²—FV×3¢µÒÂF÷FÃ¢ÂÆ–Ö—C¢#Âöfg6WC¢Ò“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6WEvRƒ“°Ğ¢ÆöD÷fW'f–Wr‡66÷T–B“°Ğ¢ÆöD–çFW&W7G2‡66÷T–B“°Ğ¢ÆöDVF—B‡66÷T–BÂÂçVÖ&W"‡6æ6†÷CòçfÇVSòæVF—EvU6—¦Róò#’“°Ğ¢ÒÂ·66÷T–BÂÆöDVF—BÂÆöD–çFW&W7G2ÂÆöD÷fW'f–WrÂ6æ6†÷CòçfÇVSòæVF—EvU6—¦UÒ“°Ğ Ğ¢&V7BçW6TVffV7B‚‚’Óâ°Ğ¢–b‡F"ÓÓÒvFFrÇÂF"ÓÓÒv6öçFW‡Br’ÆöDF–væ÷7F–72‚“°Ğ¢–b‡F"ÓÓÒw'VÆW2rÇÂF"ÓÓÒv÷fW'f–Wrr’ÆöEv÷&·76R‚“°Ğ¢–b‡F"ÓÓÒvVF—Brbb66÷T–B’ÆöDVF—B‡66÷T–BÂvRÂçVÖ&W"‡6æ6†÷CòçfÇVSòæVF—EvU6—¦Róò#’“°Ğ¢ÒÂ·F"ÂvRÂ66÷T–BÂ6æ6†÷CòçfÇVSòæVF—EvU6—¦RÂÆöDVF—BÂÆöDF–væ÷7F–72ÂÆöEv÷&·76UÒ“°Ğ Ğ¢&V7BçW6TVffV7B‚‚’Óâ°Ğ¢–b‡v÷&·76TFFòæ&–æF–æsòç7FFRÓÒw&VG’r’&WGW&ã°Ğ¢6öç7Bv÷&·76U66÷RÒwv÷&·76S¢r²v÷&·76TFFæ&–æF–ærçv÷&·76T–C°Ğ¢–b‡66÷W2ç6öÖR‚‡66÷R’Óâ66÷Ræ–BÓÓÒv÷&·76U66÷R’’6WE66÷T–B‡v÷&·76U66÷R“°Ğ¢ÒÂ·v÷&·76TFFòæ&–æF–æsòç7FFRÂv÷&·76TFFòæ&–æF–æsòçv÷&·76T–BÂ66÷W5Ò“°Ğ Ğ¢&V7BçW6TVffV7B‚‚’Óâ°Ğ¢–b‡F"ÓÒv÷fW'f–WrrÇÂ66÷T–B’&WGW&âVæFVf–æVC°Ğ¢6öç7BF–ÖW"Ò6WD–çFW'fÂ‚‚’Óâ°Ğ¢–b‚Fö7VÖVçBæ†–FFVâ’ÆöD÷fW'f–Wr‡66÷T–B“°Ğ¢ÒÂ3“°Ğ¢&WGW&â‚’Óâ6ÆV$–çFW'fÂ‡F–ÖW"“°Ğ¢ÒÂ·F"Â66÷T–BÂÆöD÷fW'f–WuÒ“°Ğ Ğ¢6öç7B&Vg&W6„ÆÂÒ&V7BçW6T6ÆÆ&6²†7–æ2‚’Óâ°Ğ¢v—B&öÖ—6RæÆÂ…¶ÆöE7FGW2‚’ÂÆöE66÷W2‚’ÂÆöDF–væ÷7F–72‚’ÂÆöEv÷&·76R‚•Ò“°Ğ¢–b‡66÷T–B’°Ğ¢v—B&öÖ—6RæÆÂ…°Ğ¢ÆöD÷fW'f–Wr‡66÷T–B’ÀĞ¢ÆöD–çFW&W7G2‡66÷T–B’ÀĞ¢ÆöDVF—B‡66÷T–BÂvRÂçVÖ&W"‡6æ6†÷CòçfÇVSòæVF—EvU6—¦Róò#’’ÀĞ¢Ò“°Ğ¢ĞĞ¢ÒÂ¶ÆöDVF—BÂÆöDF–væ÷7F–72ÂÆöD–çFW&W7G2ÂÆöD÷fW'f–WrÂÆöE66÷W2ÂÆöE7FGW2ÂÆöEv÷&·76RÂvRÂ66÷T–BÂ6æ6†÷CòçfÇVSòæVF—EvU6—¦UÒ“°Ğ Ğ¢6öç7B6†ævTf–VÆBÒ†¶W’ÂfÇVR’Óâ°Ğ¢6WDG&gB‚‡&Wf–÷W2’Óâ6WDG&gEfÇVR‡&Wf–÷W2Â¶W’ÂfÇVR’“°Ğ¢6WDÖW76vR‚rr“°Ğ¢6WE&Wf–Wr‚rr“°Ğ¢Ó°Ğ Ğ¢6öç7B6fRÒ7–æ2‚’Óâ°Ğ¢6öç7Bf÷&ÒÒf÷&Õ&Vbæ7W'&VçC°Ğ¢6öç7B7W'&VçBÒf÷&Õ6æ6†÷B‚“°Ğ¢–b‚f÷&ÒÇÂ7W'&VçB’&WGW&ã°Ğ¢–b†6öæfÆ–7E&Vbæ7W'&VçB’°Ğ¢6WDW'&÷"‡B‚v6öæfÆ–7Br’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b††4W'&÷'2’°Ğ¢6WDW'&÷"‡B‚v–çfÆ–Df–VÆBr’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B÷2Ò'V–ÆE6WD÷2†G&gBÂ7W'&VçBÂd”TÄE2“°Ğ¢–b†÷2æÆVæwF‚ÓÓÒ’°Ğ¢6†÷tÖW76vR‡B‚væô6†ævW2r’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6WD'W7’‡G'VR“°Ğ¢6WDW'&÷"‚rr“°Ğ¢G'’°Ğ¢6öç7Bö²Òv—Bf÷&Òæ×WFFR†÷2Â7W'&VçBç&Wf—6–öâ“°Ğ¢–b‚ö²’°Ğ¢6öæfÆ–7E&Vbæ7W'&VçBÒG'VS°Ğ¢6WDW'&÷"‡B‚v6öæfÆ–7Br’“°Ğ¢6WDÖW76vR‚rr“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öæfÆ–7E&Vbæ7W'&VçBÒfÇ6S°Ğ¢6†÷tÖW76vR‡B‚w6fVBr’“°Ğ¢6WE&Wf–Wr‚rr“°Ğ¢v—B&Vg&W6„ÆÂ‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"‡B‚w6fTf–ÆVBr’²rr²RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7B6æ6VÂÒ‚’Óâ°Ğ¢6öç7B7W'&VçBÒf÷&Õ6æ6†÷B‚“°Ğ¢–b†7W'&VçB’6WDG&gB†G&gDg&öÕ6æ6†÷B†7W'&VçB’“°Ğ¢6öæfÆ–7E&Vbæ7W'&VçBÒfÇ6S°Ğ¢6WDW'&÷"‚rr“°Ğ¢6WE&Wf–Wr‚rr“°Ğ¢6WDÖW76vR‚rr“°Ğ¢Ó°Ğ Ğ¢6öç7B&W7F÷&TFVfVÇG2Ò‚’Óâ°Ğ¢6WD6öæf—&Ò‡°Ğ¢F—FÆS¢B‚w&W7F÷&T6öæf—&ÕF—FÆRr’ÀĞ¢&öG“¢B‚w&W7F÷&T6öæf—&Ô&öG’r’ÀĞ¢6öæf—&ÔÆ&VÃ¢B‚v6öæf—&Òr’ÀĞ¢7F–öã¢7–æ2‚’Óâ°Ğ¢6öç7Bf÷&ÒÒf÷&Õ&Vbæ7W'&VçC°Ğ¢6öç7B7W'&VçBÒf÷&Õ6æ6†÷B‚“°Ğ¢–b‚f÷&ÒÇÂ7W'&VçB’&WGW&ã°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢6öç7Bö²Òv—Bf÷&Òæ×WFFR†'V–ÆEVç6WDÆÄ÷2„d”TÄE2’Â7W'&VçBç&Wf—6–öâ“°Ğ¢–b‚ö²’°Ğ¢6öæfÆ–7E&Vbæ7W'&VçBÒG'VS°Ğ¢6WDW'&÷"‡B‚v6öæfÆ–7Br’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öæfÆ–7E&Vbæ7W'&VçBÒfÇ6S°Ğ¢6†÷tÖW76vR‡B‚w&W7F÷&TFöæRr’“°Ğ¢v—B&Vg&W6„ÆÂ‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢6WD6öæf—&Ò†çVÆÂ“°Ğ¢ĞĞ¢ÒÀĞ¢Ò“°Ğ¢Ó°Ğ Ğ¢6öç7BFõ&Wf–WrÒ7–æ2‚’Óâ°Ğ¢–b‚66÷T–BÇÂG&gB’&WGW&ã°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢6öç7BFFÒv—B’‚r÷&Wf–WrrÂ°Ğ¢ÖWF†öC¢uõ5BrÀĞ¢&öG“¢²66÷S¢66÷T–BÂWfVçEG—S¢&Wf–WtWfVçEG—RÂ6öæf–s¢G&gD6öæf–r†G&gBçfÇVW2Âd”TÄE2’ÒÀĞ¢Ò“°Ğ¢6WE&Wf–Wr‡&Wf–WuFW‡B†FFÂÆær’“°Ğ¢6WDW'&÷"‚rr“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7BFõ&W6WBÒ‚’Óâ°Ğ¢–b‚÷fW'f–WrÇÂ÷fW'f–Wrç7FFR’&WGW&ã°Ğ¢6WD6öæf—&Ò‡°Ğ¢F—FÆS¢B‚v6öæf—&Õ&W6WEF—FÆRr’ÀĞ¢&öG“¢B‚v6öæf—&Õ&W6WD&öG’r’ÀĞ¢6öæf—&ÔÆ&VÃ¢B‚v6öæf—&Òr’ÀĞ¢FævW#¢G'VRÀĞ¢7F–öã¢7–æ2‚’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚r÷&W6WBrÂ°Ğ¢ÖWF†öC¢uõ5BrÀĞ¢&öG“¢²66÷S¢66÷T–BÂW‡V7FVE&Wf—6–öã¢÷fW'f–Wrç7FFRç&Wf—6–öâÂ6öæf—&Ó¢u$U4UBrÒÀĞ¢Ò“°Ğ¢6†÷tÖW76vR‡B‚w&W6WDFöæRr’“°Ğ¢v—B&Vg&W6„ÆÂ‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢6WD6öæf—&Ò†çVÆÂ“°Ğ¢ĞĞ¢ÒÀĞ¢Ò“°Ğ¢Ó°Ğ Ğ¢6öç7BFô&6·WÒ‚’Óâ°Ğ¢6WD6öæf—&Ò‡°Ğ¢F—FÆS¢B‚v&6·W6öæf—&ÕF—FÆRr’ÀĞ¢&öG“¢B‚v&6·W6öæf—&Ô&öG’r’ÀĞ¢6öæf—&ÔÆ&VÃ¢B‚v6öæf—&Òr’ÀĞ¢7F–öã¢7–æ2‚’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢6öç7BFFÒv—B’‚rö&6·WrÂ²ÖWF†öC¢uõ5BrÂ&öG“¢²6öæf—&Ó¢t$4µUrÒÒ“°Ğ¢6†÷tÖW76vR‡B‚v&6·WFöæRr’²†FFæf–ÆRÇÂrr’“°Ğ¢v—BÆöDF–væ÷7F–72‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢6WD6öæf—&Ò†çVÆÂ“°Ğ¢ĞĞ¢ÒÀĞ¢Ò“°Ğ¢Ó°Ğ Ğ¢6öç7BFõ&W7F÷&RÒ‚’Óâ°Ğ¢–b‚6VÆV7FVD&6·W’°Ğ¢6†÷tW'&÷"‡B‚w6VÆV7D&6·W&WV—&VBr’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B6VÆV7FVBÒ&6·W2æf–æB‚†—FVÒ’Óâ—FVÒæf–ÆRÓÓÒ6VÆV7FVD&6·W“°Ğ¢6WD6öæf—&Ò‡°Ğ¢F—FÆS¢B‚w&W7F÷&T&6·WF—FÆRr’ÀĞ¢&öG“¢B‚w&W7F÷&T&6·W&öG’r’²‡6VÆV7FVBòÆåÆâG·6VÆV7FVBæf–ÆWÖ¢rr’ÀĞ¢6öæf—&ÔÆ&VÃ¢B‚v6öæf—&Õ&W7F÷&Rr’ÀĞ¢FævW#¢G'VRÀĞ¢7F–öã¢7–æ2‚’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚r÷&W7F÷&RrÂ°Ğ¢ÖWF†öC¢uõ5BrÀĞ¢&öG“¢²f–ÆS¢6VÆV7FVD&6·WÂ6öæf—&Ó¢u$U5Dõ$RrÒÀĞ¢Ò“°Ğ¢6†÷tÖW76vR‡B‚w&W7F÷&T&6·WFöæRr’“°Ğ¢6WE6VÆV7FVD&6·W‚rr“°Ğ¢v—B&Vg&W6„ÆÂ‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢6WD6öæf—&Ò†çVÆÂ“°Ğ¢ĞĞ¢ÒÀĞ¢Ò“°Ğ¢Ó°Ğ Ğ¢6öç7B&WVW7D&–æBÒ‚’Óâ°Ğ¢–b‚v÷&·76U–6²’°Ğ¢6†÷tW'&÷"‡B‚wv÷&·76U–6²r’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B&V&–æBÒv÷&·76TFFòæ&–æF–æsòæ&÷VæBÓÓÒG'VRbbv÷&·76TFFæ&–æF–ærçv÷&·76T–BÓÒv÷&·76U–6³°Ğ¢6WD6öæf—&Ò‡°Ğ¢F—FÆS¢&V&–æBòB‚wv÷&·76U&V&–æBr’¢B‚v&–æEv÷&·76Rr’ÀĞ¢&öG“¢&V&–æBòB‚wv÷&·76U&V&–æD&öG’r’¢B‚wv÷&·76T†–çBr’ÀĞ¢6öæf—&ÔÆ&VÃ¢B‚v&–æEv÷&·76Rr’ÀĞ¢FævW#¢&V&–æBÀĞ¢7F–öã¢7–æ2‚’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚r÷v÷&·76RrÂ°Ğ¢ÖWF†öC¢uõ5BrÀĞ¢&öG“¢²7F–öã¢v&–æBrÂv÷&·76T–C¢v÷&·76U–6²Ââââ‡&V&–æBò²6öæf—&Ó¢u$T$”äBrÒ¢·Ò’ÒÀĞ¢Ò“°Ğ¢6†÷tÖW76vR‡B‚wv÷&·76T&÷VæBr’²~ûÉ¢r²v÷&·76U–6²“°Ğ¢v—B&Vg&W6„ÆÂ‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢6WD6öæf—&Ò†çVÆÂ“°Ğ¢ĞĞ¢ÒÀĞ¢Ò“°Ğ¢Ó°Ğ Ğ¢6öç7B&WVW7EVæ&–æBÒ‚’Óâ°Ğ¢6WD6öæf—&Ò‡°Ğ¢F—FÆS¢B‚wVæ&–æEF—FÆRr’ÀĞ¢&öG“¢B‚wVæ&–æD&öG’r’ÀĞ¢6öæf—&ÔÆ&VÃ¢B‚wVæ&–æEv÷&·76Rr’ÀĞ¢FævW#¢G'VRÀĞ¢7F–öã¢7–æ2‚’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚r÷v÷&·76RrÂ²ÖWF†öC¢uõ5BrÂ&öG“¢²7F–öã¢wVæ&–æBrÂ6öæf—&Ó¢uTä$”äBrÒÒ“°Ğ¢6†÷tÖW76vR‡B‚wv÷&·76UVæ&÷VæBr’“°Ğ¢v—B&Vg&W6„ÆÂ‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢6WD6öæf—&Ò†çVÆÂ“°Ğ¢ĞĞ¢ÒÀĞ¢Ò“°Ğ¢Ó°Ğ Ğ¢6öç7BÇ•'VÆRÒ7–æ2‡6W76–öä–BÂÖöFR’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚r÷6W76–öâ×'VÆW2rÂ²ÖWF†öC¢uõ5BrÂ&öG“¢²7F–öã¢w6WBrÂ6W76–öä–BÂÖöFRÒÒ“°Ğ¢6WE'VÆTG&gG2‚‡&Wf–÷W2’Óâ°Ğ¢6öç7BæW‡BÒ²ââç&Wf–÷W2Ó°Ğ¢FVÆWFRæW‡E·6W76–öä–EÓ°Ğ¢&WGW&âæW‡C°Ğ¢Ò“°Ğ¢6†÷tÖW76vR‡B‚w'VÆU6fVBr’“°Ğ¢v—BÆöEv÷&·76R‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7B6ÆV%'VÆRÒ7–æ2‡6W76–öä–B’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚r÷6W76–öâ×'VÆW2rÂ²ÖWF†öC¢uõ5BrÂ&öG“¢²7F–öã¢v6ÆV"rÂ6W76–öä–BÒÒ“°Ğ¢6WE'VÆTG&gG2‚‡&Wf–÷W2’Óâ°Ğ¢6öç7BæW‡BÒ²ââç&Wf–÷W2Ó°Ğ¢FVÆWFRæW‡E·6W76–öä–EÓ°Ğ¢&WGW&âæW‡C°Ğ¢Ò“°Ğ¢6†÷tÖW76vR‡B‚w'VÆT6ÆV&VBr’“°Ğ¢v—BÆöEv÷&·76R‚“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7BFD–çFW&W7BÒ7–æ2‚’Óâ°Ğ¢–b‚66÷T–BÇÂæWt–çFW&W7BææÖRçG&–Ò‚’’&WGW&ã°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚rö–çFW&W7G2rÂ°Ğ¢ÖWF†öC¢uõ5BrÀĞ¢&öG“¢°Ğ¢7F–öã¢vFBrÀĞ¢66÷S¢66÷T–BÀĞ¢æÖS¢æWt–çFW&W7BææÖRÀĞ¢&6VÆ–æS¢çVÖ&W"†æWt–çFW&W7Bæ&6VÆ–æR’ÀĞ¢Æ–6W3¢æWt–çFW&W7BæÆ–6W2ç7Æ—B‚õ²ÎûÈÅÒò’æÖ‚‡'B’Óâ'BçG&–Ò‚’’æf–ÇFW"„&ööÆVâ’ÀĞ¢ÒÀĞ¢Ò“°Ğ¢6WDæWt–çFW&W7B‡²æÖS¢rrÂ&6VÆ–æS¢cÂÆ–6W3¢rrÒ“°Ğ¢6†÷tÖW76vR‡B‚v–çFW&W7DFFVBr’“°Ğ¢v—BÆöD–çFW&W7G2‡66÷T–B“°Ğ¢v—BÆöD÷fW'f–Wr‡66÷T–B“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7B6fT–çFW&W7BÒ7–æ2†–çFW&W7B’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚rö–çFW&W7G2rÂ°Ğ¢ÖWF†öC¢uõ5BrÀĞ¢&öG“¢°Ğ¢7F–öã¢wWFFRrÀĞ¢66÷S¢66÷T–BÀĞ¢–C¢–çFW&W7Bæ–BÀĞ¢&6VÆ–æS¢çVÖ&W"†–çFW&W7Bæ&6VÆ–æR’ÀĞ¢Æ–6W3¢7G&–ær†–çFW&W7BæÆ–6W2óòrr’ç7Æ—B‚õ²ÎûÈÅÒò’æÖ‚‡'B’Óâ'BçG&–Ò‚’’æf–ÇFW"„&ööÆVâ’ÀĞ¢ÒÀĞ¢Ò“°Ğ¢6WDVF—F–ær†çVÆÂ“°Ğ¢6†÷tÖW76vR‡B‚v–çFW&W7EWFFVBr’“°Ğ¢v—BÆöD–çFW&W7G2‡66÷T–B“°Ğ¢v—BÆöD÷fW'f–Wr‡66÷T–B“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7BFövvÆT–çFW&W7BÒ7–æ2†–çFW&W7B’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚rö–çFW&W7G2rÂ°Ğ¢ÖWF†öC¢uõ5BrÀĞ¢&öG“¢²7F–öã¢vF—6&ÆRrÂ66÷S¢66÷T–BÂ–C¢–çFW&W7Bæ–BÂF—6&ÆVC¢–çFW&W7BæF—6&ÆVBÒÀĞ¢Ò“°Ğ¢6†÷tÖW76vR‡B‚v–çFW&W7DF—6&ÆVBr’“°Ğ¢v—BÆöD–çFW&W7G2‡66÷T–B“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7BFVÆWFT–çFW&W7BÒ†–çFW&W7B’Óâ°Ğ¢6WD6öæf—&Ò‡°Ğ¢F—FÆS¢B‚v6öæf—&ÔFVÆWFUF—FÆRr’ÀĞ¢&öG“¢B‚v6öæf—&ÔFVÆWFT&öG’r’ÀĞ¢6öæf—&ÔÆ&VÃ¢B‚vFVÆWFRr’ÀĞ¢FævW#¢G'VRÀĞ¢7F–öã¢7–æ2‚’Óâ°Ğ¢6WD'W7’‡G'VR“°Ğ¢G'’°Ğ¢v—B’‚rö–çFW&W7G2rÂ²ÖWF†öC¢uõ5BrÂ&öG“¢²7F–öã¢vFVÆWFRrÂ66÷S¢66÷T–BÂ–C¢–çFW&W7Bæ–BÒÒ“°Ğ¢6†÷tÖW76vR‡B‚v–çFW&W7DFVÆWFVBr’“°Ğ¢v—BÆöD–çFW&W7G2‡66÷T–B“°Ğ¢v—BÆöD÷fW'f–Wr‡66÷T–B“°Ğ¢Ò6F6‚†R’°Ğ¢6†÷tW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢6WD6öæf—&Ò†çVÆÂ“°Ğ¢ĞĞ¢ÒÀĞ¢Ò“°Ğ¢Ó°Ğ Ğ¢–b‚G&gBÇÂ6æ6†÷BÇÂ6æ6†÷BçfÇVRÇÂ6æ6†÷Bç7FGW2ÓÓÒvÆöF–ærr’°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²vFFÖÖFWW2×7FFRs¢wG'VRrÒÀĞ¢‚‚w7G–ÆRrÂçVÆÂÂ552’ÀĞ¢‚‚vƒ"rÂçVÆÂÂB‚wF—FÆRr’’ÀĞ¢‚‚wrÂ²&öÆS¢w7FGW2rÒÂB‚vÆöF–ærr’’ÀĞ¢W'&÷"ò‚‚vF—brÂ²6Æ74æÖS¢vÖW76vRW'&÷"rÂ&öÆS¢vÆW'BrÒÂW'&÷"’¢çVÆÂÀĞ¢“°Ğ¢ĞĞ¢–b‡6æ6†÷Bç7FGW2ÓÓÒwVæf–Æ&ÆRr’°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²vFFÖÖFWW2×7FFRs¢wG'VRrÒÀĞ¢‚‚w7G–ÆRrÂçVÆÂÂ552’ÀĞ¢‚‚vƒ"rÂçVÆÂÂB‚wF—FÆRr’’ÀĞ¢‚‚wrÂ²&öÆS¢vÆW'BrÒÂB‚w6WGF–æw5Væf–Æ&ÆRr’’ÀĞ¢W'&÷"ò‚‚vF—brÂ²6Æ74æÖS¢vÖW76vRW'&÷"rÂ&öÆS¢vÆW'BrÒÂW'&÷"’¢çVÆÂÀĞ¢“°Ğ¢ĞĞ Ğ¢6öç7BF—6&ÆVBÒ'W7’ÇÂG&gBçw&—F&ÆS°Ğ¢6öç7BWföÇWF–öä¶W—2Ò²w7FFTWföÇWF–öäVæ&ÆVBrÂvWfVçE6Vç6—F—f—G’rÂvWFõ&V6÷fW'’rÂw&V6÷fW'•7VVBrÂvWFô–çFW&W7EWFFRrÂvWFôWfVçE&ö6W76–ætVæ&ÆVBrÂw6†&VDWfVçEvV–v‡BrÂvWFôWfVçDÖ–ä–çFW'fÅ6V6öæG2rÂvWFôWfVçDÖ…W$†÷W"uÓ°Ğ¢6öç7B6öçFW‡D¶W—2Ò²v–æfÇVVæ6U7G&VæwF‚rÂv6öçFW‡D–æ¦V7F–öäÖöFRrÂv6öçFW‡DÖ„6†'2rÂvÖöFVÄ&—6ÄVæ&ÆVBuÓ°Ğ¢6öç7B6WGF–æw4f–VÆG2Òd”TÄE2æf–ÇFW"‚†f–VÆB’ÓâWföÇWF–öä¶W—2æ–æ6ÇVFW2†f–VÆBæ¶W’’“°Ğ¢6öç7BGfæ6VDf–VÆG2Òd”TÄE2æf–ÇFW"‚†f–VÆB’ÓâWföÇWF–öä¶W—2æ–æ6ÇVFW2†f–VÆBæ¶W’’bb6öçFW‡D¶W—2æ–æ6ÇVFW2†f–VÆBæ¶W’’“°Ğ¢6öç7BvU6—¦RÒçVÖ&W"‡6æ6†÷CòçfÇVSòæVF—EvU6—¦Róò#“°Ğ¢6öç7B7W'&VçEvRÒ6Æ×vR‡vRÂVF—BçF÷FÂÂvU6—¦R“°Ğ¢6öç7BF÷FÅvW2ÒvT6÷VçB†VF—BçF÷FÂÂvU6—¦R“°Ğ Ğ¢6öç7Bv÷&·76U7FGW46†—Ò‚‚’Óâ°Ğ¢6öç7B&–æF–ærÒv÷&·76TFFòæ&–æF–æs°Ğ¢–b‚&–æF–ær’&WGW&â‚‚w7ârÂ²6Æ74æÖS¢v6†—rÒÂB‚wv÷&·76Rr’²r(
br“°Ğ¢–b†&–æF–ærç7FFRÓÓÒw&VG’r’&WGW&â‚‚w7ârÂ²6Æ74æÖS¢v6†—ö²rÒÂB‚wv÷&·76T&÷VæBr’²r+rr²†&–æF–ærçF—FÆRÇÂ&–æF–ærçv÷&·76T–B’ç6Æ–6RƒÂ#‚’“°Ğ¢–b†&–æF–ærç7FFRÓÓÒwv÷&·76UöÖ—76–ærr’&WGW&â‚‚w7ârÂ²6Æ74æÖS¢v6†—&BrÒÂB‚wv÷&·76TÖ—76–ærr’“°Ğ¢–b†&–æF–ærç7FFRÓÓÒw&Vv—7G'•÷Væf–Æ&ÆRr’&WGW&â‚‚w7ârÂ²6Æ74æÖS¢v6†—&BrÒÂB‚wv÷&·76U&Vv—7G'•Væf–Æ&ÆRr’“°Ğ¢&WGW&â‚‚w7ârÂ²6Æ74æÖS¢v6†—v&ârÒÂB‚wv÷&·76UVæ&÷VæBr’“°Ğ¢Ò’‚“°Ğ Ğ¢6öç7B†VFW"Ò‚€Ğ¢vF—brÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wF÷&"rÒÀĞ¢‚€Ğ¢vF—brÀĞ¢çVÆÂÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢vW–V'&÷rrÒÂtÔDUU2ò5DDRòr²B‡F"’’ÀĞ¢‚‚vƒ"rÂçVÆÂÂB‚wF—FÆRr’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢w7V"rÒÂB‚w7V'F—FÆRr’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢vv†÷7BrÂöä6Æ–6³¢‚’Óâ6WDÆær†ÆærÓÓÒw¦‚ròvVâr¢w¦‚r’ÒÂB‚vÆærr’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢‚’Óâ²6WDW'&÷"‚rr“²&Vg&W6„ÆÂ‚“²ÒÂF—6&ÆVC¢'W7’ÒÂB‚w&Vg&W6‚r’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v6†—2rÒÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v6†—r²‡7FGW3òç7FFRÓÓÒw&VG’ròvö²r¢v&Br’ÒÂB‚wfW'6–öâr’²rr²‡7FGW3òçfW'6–öâóò~(
br’’ÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v6†—r²‡7FGW3òç7FFRÓÓÒw&VG’ròvö²r¢v&Br’ÒÂ7FGW3òç7FFRÓÓÒw&VG’ròB‚w7FFT†VÇF‡’r’¢B‚w7FFTFVw&FVBr’’ÀĞ¢v÷&·76U7FGW46†—ÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v6†—rÒÂB‚v–æ¦V7F–öâr’²~ûÉ¢r²‡6æ6†÷BçfÇVRæ6öçFW‡D–æ¦V7F–öäÖöFRÓÓÒvöfbròB‚v6öçFW‡Döfbr’¢6æ6†÷BçfÇVRæ6öçFW‡D–æ¦V7F–öäÖöFRÓÓÒw7FFUö–çFW&W7G2ròB‚v6öçFW‡E7FFT–çFW&W7G2r’¢6æ6†÷BçfÇVRæ6öçFW‡D–æ¦V7F–öäÖöFRÓÓÒvFWF–ÆVBròB‚v–æ¦V7F–öäFWF–ÆVBr’¢B‚v6öçFW‡D'&–Vbr’’’ÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v6†—rÒÂB‚w66†VÖr’²rr²‡7FGW3òç66†VÖfW'6–öâóò~(	Br’’ÀĞ¢G&gBçw&—F&ÆRòçVÆÂ¢‚‚w7ârÂ²6Æ74æÖS¢v6†—v&ârÒÂB‚w&VDöæÇ’r’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢w66÷U&÷rrÒÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v×WFVBrÒÂB‚w66÷Rr’’ÀĞ¢‚€Ğ¢w6VÆV7BrÀĞ¢°Ğ¢fÇVS¢66÷T–BÀĞ¢F—6&ÆVC¢'W7’ÇÂ66÷W2æÆVæwF‚ÓÓÒÀĞ¢öä6†ævS¢†WfVçB’Óâ6WE66÷T–B†WfVçBçF&vWBçfÇVR’ÀĞ¢v&–ÖÆ&VÂs¢B‚w66÷W2r’ÀĞ¢ÒÀĞ¢âââ‡66÷W2æÆVæwF‚ÓÓÒò¶‚‚v÷F–öârÂ²¶W“¢væöæRrÂfÇVS¢rrÒÂB‚vÆöF–æu66÷W2r’•Ò¢66÷W2æÖ‚‡66÷R’Óâ‚‚v÷F–öârÂ²¶W“¢66÷Ræ–BÂfÇVS¢66÷Ræ–BÒÂ66÷TÆ&VÂ‡66÷RÂBÂÆær’’’’ÀĞ¢’ÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v6†—rÒÂB‚w66÷U&—fFTæ÷FRr’’ÀĞ¢’ÀĞ¢“°Ğ Ğ¢6öç7Bæ÷F–6RÒ‚€Ğ¢vF—brÀĞ¢çVÆÂÀĞ¢W'&÷ Ğ¢ò‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vÖW76vRW'&÷"rÂ&öÆS¢vÆW'BrÒÀĞ¢W'&÷"ÀĞ¢W'&÷"ÓÓÒB‚v6öæfÆ–7BrĞ¢ò‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÂ‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢6æ6VÂÒÂB‚w&VÆöD66WFVBr’’Ğ¢¢çVÆÂÀĞ¢Ğ¢¢çVÆÂÀĞ¢ÖW76vRò‚‚vF—brÂ²6Æ74æÖS¢vÖW76vR7V66W72rÂ&öÆS¢w7FGW2rÒÂÖW76vR’¢çVÆÂÀĞ¢F—'G’ò‚‚vF—brÂ²6Æ74æÖS¢vÖW76vRrÂ&öÆS¢w7FGW2rÒÂB‚wVç6fVBr’’¢çVÆÂÀĞ¢&Wf–Wrò‚‚vF—brÂ²6Æ74æÖS¢vÖW76vRrÂ&öÆS¢w7FGW2rÒÂ&Wf–Wr’¢çVÆÂÀĞ¢“°Ğ Ğ¢6öç7BtU2Ò°Ğ¢²v÷fW'f–WrrÂ~)jbuÒÀĞ¢²w6WGF–æw2rÂ~)šuÒÀĞ¢²v–çFW&W7G2rÂ~)ˆbuÒÀĞ¢²vVF—BrÂ~(šuÒÀĞ¢²v6öçFW‡BrÂ~)xÂuÒÀĞ¢²w'VÆW2rÂ~)©’uÒÀĞ¢²vFFrÂ~)jBuÒÀĞ¢Ó°Ğ¢6öç7BæbÒ‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vædÆ—7BrÂ&öÆS¢wF&Æ—7BrÂv&–ÖÆ&VÂs¢B‚wF—FÆRr’ÒÀĞ¢ââåtU2æÖ‚…¶¶W’Â–6öåÒ’ÓàĞ¢‚€Ğ¢v'WGFöârÀĞ¢²G—S¢v'WGFöârÂ¶W’Â6Æ74æÖS¢væd'WGFöârÂ&öÆS¢wF"rÂv&–×6VÆV7FVBs¢F"ÓÓÒ¶W’Âöä6Æ–6³¢‚’Óâ6WEF"†¶W’’ÒÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢væd–6öârÂv&–Ö†–FFVâs¢wG'VRrÒÂ–6öâ’ÀĞ¢‚‚w7ârÂçVÆÂÂB†¶W’’’ÀĞ¢’ÀĞ¢’ÀĞ¢“°Ğ¢ÆWB6öçFVçBÒçVÆÃ°Ğ¢–b‡F"ÓÓÒv÷fW'f–Wrr’°Ğ¢–b‚66÷T–B’°Ğ¢6öçFVçBÒ‚‚vF—brÂ²6Æ74æÖS¢wæVÂrÒÂ‚‚wrÂçVÆÂÂB‚væõ66÷W2r’’“°Ğ¢ÒVÇ6R–b‚÷fW'f–Wr’°Ğ¢6öçFVçBÒ‚‚vF—brÂ²6Æ74æÖS¢wæVÂrÂ&öÆS¢w7FGW2rÒÂB‚vÆöF–ærr’“°Ğ¢ÒVÇ6R–b‚÷fW'f–Wrç7FFR’°Ğ¢6öçFVçBÒ‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚wVæWF†÷&—¦VBr’’ÀĞ¢‚‚wrÂ²6Æ74æÖS¢vW'&÷%FW‡BrÒÂ7G&–ær†÷fW'f–WrçVæf–Æ&ÆU&V6öâóò÷fW'f–WræWF†÷&—¦F–öãòç&V6öâóòrr’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w66÷U&—fFTæ÷FRr’’ÀĞ¢“°Ğ¢ÒVÇ6R°Ğ¢6öçFVçBÒ‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wv÷&·76T&ææW"rÒÀĞ¢‚€Ğ¢vF—brÀĞ¢çVÆÂÀĞ¢‚‚w7G&öærrÂçVÆÂÂB‚wv÷&·76TÖ–âr’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂv÷&·76TFFòæ&–æF–æsòç7FFRÓÓÒw&VG’pĞ¢ò‡v÷&·76TFFæ&–æF–ærçF—FÆRÇÂv÷&·76TFFæ&–æF–ærçv÷&·76T–B’²r+rr²‡v÷&·76TFFæ&–æF–ærç6W76–öä6÷VçBóò’²rr²B‚w6W76–öârĞ¢¢B‚wv÷&·76Tæô&–æF–ærr’’ÀĞ¢’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢‚’Óâ6WEF"‚w'VÆW2r’ÒÂB‚w'VÆW2r’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vw&–BrÒÀĞ¢‚…7FFT6&BÂ²Æ&VÃ¢B‚vÖööBr’ÂfÇVS¢÷fW'f–Wrç7FFRæÖööBÂ&6VÆ–æS¢÷fW'f–Wræ&6VÆ–æRæÖööBÂÖ–ã¢ÓÂÖƒ¢ÂF—&V7F–öã¢÷fW'f–WræW‡ÆæF–öâæF—&V7F–öâæÖööBÂBÒ’ÀĞ¢‚…7FFT6&BÂ²Æ&VÃ¢B‚vVæW&w’r’ÂfÇVS¢÷fW'f–Wrç7FFRæVæW&w’Â&6VÆ–æS¢÷fW'f–Wræ&6VÆ–æRæVæW&w’ÂÖ–ã¢ÂÖƒ¢ÂF—&V7F–öã¢÷fW'f–WræW‡ÆæF–öâæF—&V7F–öâæVæW&w’ÂBÒ’ÀĞ¢‚…7FFT6&BÂ²Æ&VÃ¢B‚v7W&–÷6—G’r’ÂfÇVS¢÷fW'f–Wrç7FFRæ7W&–÷6—G’Â&6VÆ–æS¢÷fW'f–Wræ&6VÆ–æRæ7W&–÷6—G’ÂÖ–ã¢ÂÖƒ¢ÂF—&V7F–öã¢÷fW'f–WræW‡ÆæF–öâæF—&V7F–öâæ7W&–÷6—G’ÂBÒ’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂ÷fW'f–WræW‡ÆæF–öâç7VÖÖ'’’ÀĞ¢‚‚wrÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂB‚wFVæFVæ7’r’²~ûÉ¢r’Â÷fW'f–WrçFVæFVæ7’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w6÷W&6Rr’²~ûÉ¢r²†÷fW'f–Wrç66÷Ræ¶–æBÓÓÒwv÷&·76RròB‚wv÷&·76TÖ–âr’¢÷fW'f–Wrç66÷Rç6÷W&6RÓÓÒvÆ–fRròB‚vÆ–fRr’¢B‚vÆö6Âr’’²r+rr²B‚vÖöFRr’²rr²†÷fW'f–Wræ66W73òæÖöFRóò~(	Br’²r+rW'6öær²7G&–ær†÷fW'f–Wrç66÷RçW'6öæ–Bóò~(	Br’ç6Æ–6RƒÂC’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vÆ7EWFFRr’²~ûÉ¢r²æWrFFR†÷fW'f–WrçWFFVDB’çFôÆö6ÆU7G&–ær‚’²r+rr²B‚vÆ7DWfVçBr’²~ûÉ¢r²†÷fW'f–WræÆ7DWfVçDBòæWrFFR†÷fW'f–WræÆ7DWfVçDB’çFôÆö6ÆU7G&–ær‚’¢~(	Br’’ÀĞ¢’ÀĞ¢÷fW'f–Wræ–çFW&W7G2æÆVæwF‚â Ğ¢ò‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚v–çFW&W7G2r’’ÀĞ¢ââæ÷fW'f–Wræ–çFW&W7G2ç6Æ–6RƒÂb’æÖ‚†–çFW&W7B’ÓàĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v–çFW&W7E&÷rrÂ¶W“¢–çFW&W7Bæ–BÒÀĞ¢‚‚vF—brÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂ–çFW&W7BææÖR’Â–çFW&W7BæÖçVÂò‚‚w7ârÂ²6Æ74æÖS¢v6†—rÒÂB‚vÖçVÄ&6VÆ–æRr’’¢çVÆÂ’ÀĞ¢‚‚vF—brÂçVÆÂÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚v&6VÆ–æRr’²rr²f×B†–çFW&W7Bæ&6VÆ–æR’²ròr²B‚v7F—f—G’r’²rr²f×B†–çFW&W7Bæ7F—f—G’’’Â‚‚vF—brÂ²6Æ74æÖS¢v&"rÒÂ‚‚w7ârÂ²7G–ÆS¢²v–GFƒ¢ÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂçVÖ&W"†–çFW&W7Bæ7F—f—G’’’’²rRrÒÒ’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v×WFVBrÒÂ6÷W&6TÆ&VÂ†–çFW&W7Bç6÷W&6RÂÆær’’ÀĞ¢’ÀĞ¢’ÀĞ¢Ğ¢¢‚‚vF—brÂ²6Æ74æÖS¢wæVÂrÒÂ‚‚wrÂçVÆÂÂB‚væô–çFW&W7G2r’’’ÀĞ¢“°Ğ¢ĞĞ¢ÒVÇ6R–b‡F"ÓÓÒw6WGF–æw2r’°Ğ¢6öçFVçBÒ‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚w6WGF–æw2r’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vWföÇWF–öåvT†–çBr’’ÀĞ¢ââç6WGF–æw4f–VÆG2æÖ‚†f–VÆB’ÓàĞ¢‚„f–VÆE&÷rÂ°Ğ¢¶W“¢f–VÆBæ¶W’ÀĞ¢f–VÆBÀĞ¢G&gBÀĞ¢6æ6†÷BÀĞ¢W'&÷'2ÀĞ¢F—6&ÆVBÀĞ¢öä6†ævS¢‡fÇVR’Óâ6†ævTf–VÆB†f–VÆBæ¶W’ÂfÇVR’ÀĞ¢BÀĞ¢ÆærÀĞ¢Ò’ÀĞ¢’ÀĞ¢‚€Ğ¢w6ÖÆÂrÀĞ¢çVÆÂÀĞ¢ÆærÓÓÒvVâpĞ¢òÆö6ÂW7F–ÖFRB6Vç6—F—f—G’G´çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’çFôf—†VBƒ"—Ó¢â÷&F–æ'’–çFW&7F–öâ(˜‚G·6–væVBƒ2¢çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’—ÒÖööBòG·6–væVB‚Ó¢çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’—ÒVæW&w’òG·6–væVBƒ¢çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’—Ò7W&–÷6—G’&Vf÷&R6GW&F–öââW†7B&Wf–Wr—2f–Æ&ÆRVæFW"Gfæ6VBæ Ğ¢¢hÈ[Ù>X˜ŞiXşhIş[ªbG´çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’çFôf—†VBƒ"—ÒKËzé~ûÉ®išî˜	®K©.Xª{ªbG·6–væVBƒ2¢çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’—Ò[ø>h8RòG·6–væVB‚Ó¢çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’—Ò{+îX©²òG·6–væVBƒ¢çVÖ&W"†G&gBçfÇVW2æWfVçE6Vç6—F—f—G’’—ÒZ[ŞZX~ûÈiÊ®Šêš[Y(ÎûÈ8.š¹{ª~Šëî{ÚîhùKé¾{+îzîZëşK‹¾š(NŠx8&ÀĞ¢’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w6ÖU6÷W&6Rr’’ÀĞ¢“°Ğ¢ÒVÇ6R–b‡F"ÓÓÒv–çFW&W7G2r’°Ğ¢6öçFVçBÒ‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vFD–çFW&W7Br’’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢w7F6²rÒÀĞ¢‚‚vÆ&VÂrÂçVÆÂÂB‚væÖRr’Â‚‚v–çWBrÂ²G—S¢wFW‡BrÂfÇVS¢æWt–çFW&W7BææÖRÂÖ„ÆVæwFƒ¢cÂF—6&ÆVBÂöä6†ævS¢†WfVçB’Óâ6WDæWt–çFW&W7B‡²ââææWt–çFW&W7BÂæÖS¢WfVçBçF&vWBçfÇVRÒ’Ò’’ÀĞ¢‚‚vÆ&VÂrÂçVÆÂÂB‚vÖçVÄ&6VÆ–æRr’Â‚‚v–çWBrÂ²G—S¢vçVÖ&W"rÂÖ–ã¢ÂÖƒ¢ÂfÇVS¢æWt–çFW&W7Bæ&6VÆ–æRÂF—6&ÆVBÂöä6†ævS¢†WfVçB’Óâ6WDæWt–çFW&W7B‡²ââææWt–çFW&W7BÂ&6VÆ–æS¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò’Ò’Â‚‚w6ÖÆÂrÂçVÆÂÂB‚w&ævRr’²r(	3+rr²B‚vFVfVÇBr’²rcr’’ÀĞ¢‚‚vÆ&VÂrÂçVÆÂÂB‚vÆ–6W2r’Â‚‚v–çWBrÂ²G—S¢wFW‡BrÂfÇVS¢æWt–çFW&W7BæÆ–6W2ÂF—6&ÆVBÂöä6†ævS¢†WfVçB’Óâ6WDæWt–çFW&W7B‡²ââææWt–çFW&W7BÂÆ–6W3¢WfVçBçF&vWBçfÇVRÒ’Ò’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÂ‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢w&–Ö'’rÂF—6&ÆVC¢F—6&ÆVBÇÂæWt–çFW&W7BææÖRçG&–Ò‚’Âöä6Æ–6³¢FD–çFW&W7BÒÂB‚vFBr’’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚v–çFW&W7G2r’’ÀĞ¢âââ†–çFW&W7G2æÆVæwF‚ÓÓÒ Ğ¢ò¶‚‚wrÂçVÆÂÂB‚væô–çFW&W7G2r’•ĞĞ¢¢–çFW&W7G2æÖ‚†–çFW&W7B’ÓàĞ¢‚€Ğ¢vF—brÀĞ¢²¶W“¢–çFW&W7Bæ–BÂ6Æ74æÖS¢v–çFW&W7E&÷rrÒÀĞ¢‚€Ğ¢vF—brÀĞ¢çVÆÂÀĞ¢‚‚w7G&öærrÂçVÆÂÂ–çFW&W7BææÖR’ÀĞ¢–çFW&W7BæÖçVÂò‚‚w7ârÂ²6Æ74æÖS¢v6†—rÒÂB‚vÖçVÄ&6VÆ–æRr’’¢çVÆÂÀĞ¢–çFW&W7BæF—6&ÆVBò‚‚w7ârÂ²6Æ74æÖS¢v6†—v&ârÒÂB‚vF—6&ÆVBr’’¢çVÆÂÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂ†–çFW&W7BæÆ–6W2óòµÒ’æ¦ö–â‚~8r’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢çVÆÂÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚v&6VÆ–æRr’²rr²f×B†–çFW&W7Bæ&6VÆ–æR’²ròr²B‚v7F—f—G’r’²rr²f×B†–çFW&W7Bæ7F—f—G’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v&"rÒÂ‚‚w7ârÂ²7G–ÆS¢²v–GFƒ¢ÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂçVÖ&W"†–çFW&W7Bæ7F—f—G’’’’²rRrÒÒ’’ÀĞ¢’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v×WFVBrÒÂ6÷W&6TÆ&VÂ†–çFW&W7Bç6÷W&6RÂÆær’’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2–çFW&W7D7F–öç2rÒÀĞ¢VF—F–ærbbVF—F–æræ–BÓÓÒ–çFW&W7Bæ–@Ğ¢ò‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚‚v–çWBrÂ²G—S¢vçVÖ&W"rÂÖ–ã¢ÂÖƒ¢ÂfÇVS¢VF—F–æræ&6VÆ–æRÂv&–ÖÆ&VÂs¢B‚vÖçVÄ&6VÆ–æRr’ÂF—6&ÆVBÂöä6†ævS¢†WfVçB’Óâ6WDVF—F–ær‡²ââæVF—F–ærÂ&6VÆ–æS¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò’Ò’ÀĞ¢‚‚v–çWBrÂ²G—S¢wFW‡BrÂfÇVS¢VF—F–æræÆ–6W2Âv&–ÖÆ&VÂs¢B‚vÆ–6W2r’ÂF—6&ÆVBÂöä6†ævS¢†WfVçB’Óâ6WDVF—F–ær‡²ââæVF—F–ærÂÆ–6W3¢WfVçBçF&vWBçfÇVRÒ’Ò’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢w&–Ö'’rÂF—6&ÆVBÂöä6Æ–6³¢‚’Óâ6fT–çFW&W7B†VF—F–ær’ÒÂB‚wWFFRr’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢‚’Óâ6WDVF—F–ær†çVÆÂ’ÒÂB‚v6Æ÷6Rr’’ÀĞ¢Ğ¢¢‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVBÂöä6Æ–6³¢‚’Óâ6WDVF—F–ær‡²–C¢–çFW&W7Bæ–BÂ&6VÆ–æS¢–çFW&W7Bæ&6VÆ–æRÂÆ–6W3¢†–çFW&W7BæÆ–6W2óòµÒ’æ¦ö–â‚rÂr’Ò’ÒÂB‚vVF—Br’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVBÂöä6Æ–6³¢‚’ÓâFövvÆT–çFW&W7B†–çFW&W7B’ÒÂ–çFW&W7BæF—6&ÆVBòB‚vVæ&ÆRr’¢B‚vF—6&ÆRr’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢vFævW"rÂF—6&ÆVBÂöä6Æ–6³¢‚’ÓâFVÆWFT–çFW&W7B†–çFW&W7B’ÒÂB‚vFVÆWFRr’’ÀĞ¢’ÀĞ¢’ÀĞ¢’ÀĞ¢’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚v–çFW&W7DFVÆWFT†–çBr’’ÀĞ¢’ÀĞ¢“°Ğ¢ÒVÇ6R–b‡F"ÓÓÒvVF—Br’°Ğ¢6öçFVçBÒ‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vVF—Br’’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wF&ÆUw&rÒÀĞ¢‚€Ğ¢wF&ÆRrÀĞ¢çVÆÂÀĞ¢‚‚wF†VBrÂçVÆÂÂ‚‚wG"rÂçVÆÂÂ‚‚wF‚rÂçVÆÂÂB‚wF–ÖRr’’Â‚‚wF‚rÂçVÆÂÂB‚wG—Rr’’Â‚‚wF‚rÂçVÆÂÂB‚vFVÇFr’’Â‚‚wF‚rÂçVÆÂÂB‚w&V6öâr’’Â‚‚wF‚rÂçVÆÂÂB‚w6÷W&6UG'W7Br’’Â‚‚wF‚rÂçVÆÂÂB‚vFWF–Ç2r’’’’ÀĞ¢‚€Ğ¢wF&öG’rÀĞ¢çVÆÂÀĞ¢âââ†VF—Bæ—FV×2æÆVæwF‚ÓÓÒ Ğ¢ò¶‚‚wG"rÂ²¶W“¢vV×G’rÒÂ‚‚wFBrÂ²6öÅ7ã¢bÒÂB‚væôWfVçG2r’’•ĞĞ¢¢VF—Bæ—FV×2æÖ‚†WfVçB’ÓàĞ¢‚€Ğ¢wG"rÀĞ¢²¶W“¢WfVçBæ–BÒÀĞ¢‚‚wFBrÂçVÆÂÂæWrFFR†WfVçBæö67W'&VDB’çFôÆö6ÆU7G&–ær‚’’ÀĞ¢‚‚wFBrÂçVÆÂÂWfVçDÆ&VÂ†WfVçBçG—RÂÆær’’ÀĞ¢‚‚wFBrÂçVÆÂÂFVÇFFW‡B†WfVçBæFVÇF2ÂÆær’’ÀĞ¢‚‚wFBrÂçVÆÂÂWfVçBç7VÖÖ'’’ÀĞ¢‚‚wFBrÂçVÆÂÂ6÷W&6TÆ&VÂ†WfVçBç6÷W&6RÂÆær’²r+rr²G'W7DÆ&VÂ†WfVçBçG'W7BÂÆær’’ÀĞ¢‚€Ğ¢wFBrÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vFWF–Ç2rÀĞ¢çVÆÂÀĞ¢‚‚w7VÖÖ'’rÂçVÆÂÂB‚vFWF–Ç2r’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚v&Vf÷&TgFW"r’²~ûÉ¢r²¥4ôâç7G&–æv–g’†WfVçBæ&Vf÷&R’²r(i"r²¥4ôâç7G&–æv–g’†WfVçBægFW"’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vWf–FVæ6Rr’²~ûÉ¢r²‚†WfVçBæWf–FVæ6U&Vg2óòµÒ’æ¦ö–â‚~8r’ÇÂ~(	Br’’ÀĞ¢†WfVçBæ–çFW&W7D6†ævW2óòµÒ’æÆVæwF‚â Ğ¢ò‚‚w6ÖÆÂrÂçVÆÂÂB‚v–çFW&W7G2r’²~ûÉ¢r²WfVçBæ–çFW&W7D6†ævW2æÖ‚†6†ævR’Óâ6†ævRææÖR²rr²6–væVB†6†ævRæÆ–VB’’æ¦ö–â‚~8r’Ğ¢¢çVÆÂÀĞ¢’ÀĞ¢’ÀĞ¢’ÀĞ¢’’ÀĞ¢’ÀĞ¢’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’ÇÂ7W'&VçEvRÃÒÂöä6Æ–6³¢‚’Óâ6WEvR„ÖF‚æÖ‚ƒÂ7W'&VçEvRÒ’’ÒÂB‚w&Wbr’’ÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v×WFVBrÒÂB‚wvRr’²7W'&VçEvR²B‚wvTöbr’²F÷FÅvW2²r+rr²VF—BçF÷FÂ²rr²B‚wF÷FÂr’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’ÇÂ7W'&VçEvRãÒF÷FÅvW2Âöä6Æ–6³¢‚’Óâ6WEvR†7W'&VçEvR²’ÒÂB‚væW‡Br’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢‚’ÓâÆöDVF—B‡66÷T–BÂ7W'&VçEvRÂvU6—¦R’ÂF—6&ÆVC¢'W7’ÒÂB‚w&Vg&W6‚r’’ÀĞ¢’ÀĞ¢“°Ğ¢ÒVÇ6R–b‡F"ÓÓÒv6öçFW‡Br’°Ğ¢6öç7B6öçFW‡Df–VÆG2Òd”TÄE2æf–ÇFW"‚†f–VÆB’Óâ6öçFW‡D¶W—2æ–æ6ÇVFW2†f–VÆBæ¶W’’“°Ğ¢6öçFVçBÒ‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚v6öçFW‡Br’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚v6öçFW‡EvT†–çBr’’ÀĞ¢ââæ6öçFW‡Df–VÆG2æÖ‚†f–VÆB’ÓàĞ¢‚„f–VÆE&÷rÂ°Ğ¢¶W“¢f–VÆBæ¶W’ÀĞ¢f–VÆBÀĞ¢G&gBÀĞ¢6æ6†÷BÀĞ¢W'&÷'2ÀĞ¢F—6&ÆVBÀĞ¢öä6†ævS¢‡fÇVR’Óâ6†ævTf–VÆB†f–VÆBæ¶W’ÂfÇVR’ÀĞ¢BÀĞ¢ÆærÀĞ¢Ò’ÀĞ¢’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚wFööÅ7FGW2r’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢w6W76–öå&÷rrÒÂ‚‚vF—brÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂB‚wFööÄvWBr’’Â‚‚w6ÖÆÂrÂçVÆÂÂB‚wFööÄF—6&ÆVDæ÷FRr’’’Â‚‚w7ârÂ²6Æ74æÖS¢v6†—ö²rÒÂB‚vVæ&ÆVBr’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢w6W76–öå&÷rrÒÂ‚‚vF—brÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂB‚wFööÄ&—6Rr’’Â‚‚w6ÖÆÂrÂçVÆÂÂB‚væôW‡G&ÖöFVÂr’’’Â‚‚w7ârÂ²6Æ74æÖS¢v6†—r²‡6æ6†÷BçfÇVRæÖöFVÄ&—6ÄVæ&ÆVBòvö²r¢wv&âr’ÒÂ6æ6†÷BçfÇVRæÖöFVÄ&—6ÄVæ&ÆVBòB‚vVæ&ÆVBr’¢B‚vF—6&ÆVBr’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢w6W76–öå&÷rrÒÂ‚‚vF—brÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂB‚wFööÄ–çFW&W7G2r’’Â‚‚w6ÖÆÂrÂçVÆÂÂB‚v6öçFW‡EvT†–çBr’’’Â‚‚w7ârÂ²6Æ74æÖS¢v6†—ö²rÒÂB‚vVæ&ÆVBr’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢w6W76–öå&÷rrÒÂ‚‚vF—brÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂB‚wFööÄ†VÇF‚r’’’Â‚‚w7ârÂ²6Æ74æÖS¢v6†—ö²rÒÂB‚vVæ&ÆVBr’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v†–çD6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚væôW‡G&ÖöFVÂr’’’ÀĞ¢’ÀĞ¢“°Ğ¢ÒVÇ6R–b‡F"ÓÓÒw'VÆW2r’°Ğ¢6öç7BFFÒv÷&·76TFF°Ğ¢6öç7B&–æF–ærÒFFòæ&–æF–æs°Ğ¢6öç7Bv÷&·76W2Ò'&’æ—4'&’†FFòçv÷&·76W3òçv÷&·76W2’òFFçv÷&·76W2çv÷&·76W2¢µÓ°Ğ¢6öç7B6W76–öç2Ò'&’æ—4'&’†FFòç6W76–öç2’òFFç6W76–öç2¢µÓ°Ğ¢6öç7BÖöFT†VÇÒ°Ğ¢6†&VC¢B‚vÖöFU6†&VD†VÇr’ÀĞ¢&VEööæÇ“¢B‚vÖöFU&VDöæÇ”†VÇr’ÀĞ¢—6öÆFVC¢B‚vÖöFT—6öÆFVD†VÇr’ÀĞ¢F—6&ÆVC¢B‚vÖöFTF—6&ÆVD†VÇr’ÀĞ¢Ó°Ğ¢6öçFVçBÒ‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚wv÷&·76TFVfVÇDÖöFRr’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚wv÷&·76T†–çBr’’ÀĞ¢&–æF–æsòç7FFRÓÓÒw&VG’pĞ¢ò‚‚vF—brÂ²6Æ74æÖS¢wv÷&·76T&ææW"rÒÀĞ¢‚‚vF—brÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂ&–æF–ærçF—FÆRÇÂ&–æF–ærçv÷&·76T–B’Â‚‚w6ÖÆÂrÂçVÆÂÂB‚wv÷&·76T&÷VæBr’²r+rr²†&–æF–ærç6W76–öä6÷VçBóò’²rr²B‚w6W76–öâr’²r+rr²B‚vÖöFU6†&VBr’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢&WVW7EVæ&–æBÒÂB‚wVæ&–æEv÷&·76Rr’’ÀĞ¢’ÀĞ¢Ğ¢¢‚‚vF—brÂçVÆÂÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢vÖW76vRrÂ&öÆS¢w7FGW2rÒÂ&–æF–æsòç7FFRÓÓÒwVæ&÷VæBròB‚wv÷&·76Tæô&–æF–ærr’¢&–æF–æsòæÖW76vRÇÂB‚wv÷&·76U&Vv—7G'•Væf–Æ&ÆRr’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚vÆ&VÂrÂçVÆÂÂB‚wv÷&·76U–6²r’ÀĞ¢‚‚w6VÆV7BrÂ²fÇVS¢v÷&·76U–6²ÂF—6&ÆVC¢'W7’ÇÂv÷&·76W2æÆVæwF‚ÓÓÒÂöä6†ævS¢†WfVçB’Óâ6WEv÷&·76U–6²†WfVçBçF&vWBçfÇVR’Âv&–ÖÆ&VÂs¢B‚wv÷&·76U–6²r’ÒÀĞ¢âââ‡v÷&·76W2æÆVæwF‚ÓÓÒ Ğ¢ò¶‚‚v÷F–öârÂ²¶W“¢væöæRrÂfÇVS¢rrÒÂFFòçv÷&·76W3òæf–Æ&ÆRÓÓÒfÇ6RòB‚wv÷&·76U&Vv—7G'•Væf–Æ&ÆRr’¢B‚wv÷&·76U–6²r’•ĞĞ¢¢v÷&·76W2æÖ‚†—FVÒ’Óâ‚‚v÷F–öârÂ²¶W“¢—FVÒçv÷&·76T–BÂfÇVS¢—FVÒçv÷&·76T–BÒÂ†—FVÒçF—FÆRÇÂ—FVÒçv÷&·76T–B’²r+rr²—FVÒç6W76–öä6÷VçB²rr²B‚w6W76–öâr’’’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢w&–Ö'’rÂF—6&ÆVC¢'W7’ÇÂv÷&·76U–6²Âöä6Æ–6³¢&WVW7D&–æBÒÂB‚v&–æEv÷&·76Rr’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v†–çD6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚wv÷&·76TÆVv7’r’’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚w6W76–öå'VÆW2r’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w6W76–öå'VÆW4†–çBr’’ÀĞ¢&–æF–æsòç7FFRÓÒw&VG’pĞ¢ò‚‚wrÂ²6Æ74æÖS¢v×WFVBrÒÂB‚wv÷&·76Tæô&–æF–ærr’Ğ¢¢6W76–öç2æÆVæwF‚ÓÓÒ Ğ¢ò‚‚wrÂ²6Æ74æÖS¢v×WFVBrÒÂB‚væõ6W76–öç2r’Ğ¢¢‚‚vF—brÂçVÆÂÂââç6W76–öç2æÖ‚†VçG'’’Óâ°Ğ¢6öç7BfÇVRÒ'VÆTG&gG5¶VçG'’ç6W76–öä–EÒóòVçG'’æÖöFS°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢w6W76–öå&÷rrÂ¶W“¢VçG'’ç6W76–öä–BÒÀĞ¢‚‚vF—brÂçVÆÂÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢vÖöæòrÒÂVçG'’ç6W76–öä–B’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂVçG'’æ&6†—fVBòB‚v&6†—fVE6W76–öâr’¢VçG'’æW‡Æ–6—BòB‚w6W76–öå'VÆW2r’¢B‚wv÷&·76TFVfVÇDÖöFRr’’ÀĞ¢’ÀĞ¢VçG'’æ&6†—fV@Ğ¢ò‚‚w7ârÂ²6Æ74æÖS¢v6†—v&ârÒÂB‚v&6†—fVE6W76–öâr’Ğ¢¢‚‚w6VÆV7BrÂ°Ğ¢fÇVRÀĞ¢F—6&ÆVC¢'W7’ÀĞ¢v&–ÖÆ&VÂs¢B‚vÖöFRr’ÀĞ¢öä6†ævS¢†WfVçB’Óâ6WE'VÆTG&gG2‡²ââç'VÆTG&gG2Â¶VçG'’ç6W76–öä–EÓ¢WfVçBçF&vWBçfÇVRÒ’ÀĞ¢ÒÂâââ†FFòæÖöFW2óò²w6†&VBrÂw&VEööæÇ’rÂv—6öÆFVBrÂvF—6&ÆVBuÒ’æÖ‚†ÖöFR’Óâ‚‚v÷F–öârÂ²¶W“¢ÖöFRÂfÇVS¢ÖöFRÒÂB‚vÖöFRr²ÖöFRç7Æ—B‚uòr’æÖ‚‡'B’Óâ'Bæ6†$Bƒ’çFõWW$66R‚’²'Bç6Æ–6Rƒ’’æ¦ö–â‚rr’’’’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’ÇÂVçG'’æ&6†—fVBÇÂfÇVRÓÓÒVçG'’æÖöFRÂöä6Æ–6³¢‚’ÓâÇ•'VÆR†VçG'’ç6W76–öä–BÂfÇVR’ÒÂB‚w6fU'VÆRr’’ÀĞ¢VçG'’æW‡Æ–6—Bò‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’ÇÂVçG'’æ&6†—fVBÂöä6Æ–6³¢‚’Óâ6ÆV%'VÆR†VçG'’ç6W76–öä–B’ÒÂB‚v6ÆV%'VÆRr’’¢çVÆÂÀĞ¢’ÀĞ¢“°Ğ¢Ò’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v†–çD6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚w66VæUVæf–Æ&ÆRr’’’ÀĞ¢’ÀĞ¢“°Ğ¢ÒVÇ6R–b‡F"ÓÓÒvFFr’°Ğ¢6öç7BÖ–w&F–öç2Ò'&’æ—4'&’‡v÷&·76TFFòæÖ–w&F–öâ’òv÷&·76TFFæÖ–w&F–öâ¢'&’æ—4'&’†F–væ÷7F–73òæÖ–w&F–öâ’òF–væ÷7F–72æÖ–w&F–öâ¢µÓ°Ğ¢6öçFVçBÒ‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vGfæ6VBr’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vGfæ6VD†–çBr’’ÀĞ¢ââæGfæ6VDf–VÆG2æÖ‚†f–VÆB’ÓàĞ¢‚„f–VÆE&÷rÂ°Ğ¢¶W“¢f–VÆBæ¶W’ÀĞ¢f–VÆBÀĞ¢G&gBÀĞ¢6æ6†÷BÀĞ¢W'&÷'2ÀĞ¢F—6&ÆVBÀĞ¢öä6†ævS¢‡fÇVR’Óâ6†ævTf–VÆB†f–VÆBæ¶W’ÂfÇVR’ÀĞ¢BÀĞ¢ÆærÀĞ¢Ò’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚vÆ&VÂrÂçVÆÂÂB‚w&Wf–WtWfVçBr’Â‚‚w6VÆV7BrÂ²fÇVS¢&Wf–WtWfVçEG—RÂF—6&ÆVBÂöä6†ævS¢†WfVçB’Óâ6WE&Wf–WtWfVçEG—R†WfVçBçF&vWBçfÇVR’ÒÂââäUdTåEõE•U2æÖ‚‡G—R’Óâ‚‚v÷F–öârÂ²¶W“¢G—RÂfÇVS¢G—RÒÂWfVçDÆ&VÂ‡G—RÂÆær’’’’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’ÇÂ†4W'&÷'2ÇÂ66÷T–BÂöä6Æ–6³¢Fõ&Wf–WrÒÂB‚w&Wf–Wrr’’ÀĞ¢’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w&Wf–Wt†–çBr’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚w&W7F÷&TFVfVÇG2r’’ÀĞ¢‚‚wrÂçVÆÂÂB‚w&W7F÷&T6öæf—&Ô&öG’r’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÂ‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVBÂöä6Æ–6³¢&W7F÷&TFVfVÇG2ÒÂB‚w&W7F÷&TFVfVÇG2r’’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚w&W6WBr’’ÀĞ¢‚‚wrÂçVÆÂÂB‚v6öæf—&Õ&W6WD&öG’r’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÂ‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢vFævW"rÂF—6&ÆVC¢F—6&ÆVBÇÂ÷fW'f–Wsòç7FFRÂöä6Æ–6³¢Fõ&W6WBÒÂB‚w&W6WBr’’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vÖ–w&F–öâr’’ÀĞ¢Ö–w&F–öç2æÆVæwF‚ÓÓÒ Ğ¢ò‚‚wrÂ²6Æ74æÖS¢v×WFVBrÒÂB‚vÖ–w&F–öäæöæRr’Ğ¢¢‚‚vF—brÂ²6Æ74æÖS¢wF&ÆUw&rÒÀĞ¢‚‚wF&ÆRrÂ²6Æ74æÖS¢vFFF&ÆRrÒÀĞ¢‚‚wF†VBrÂçVÆÂÂ‚‚wG"rÂçVÆÂÂ‚‚wF‚rÂçVÆÂÂB‚wfW'6–öâr’’Â‚‚wF‚rÂçVÆÂÂB‚wF–ÖRr’’Â‚‚wF‚rÂçVÆÂÂB‚vÖ–w&F–öä&6·Wr’’’’ÀĞ¢‚‚wF&öG’rÂçVÆÂÂââæÖ–w&F–öç2æÖ‚†VçG'’’Óâ‚‚wG"rÂ²¶W“¢VçG'’æ–BÒÀĞ¢‚‚wFBrÂçVÆÂÂVçG'’æg&öÕfW'6–öâ²r(i"r²VçG'’çFõfW'6–öâ²r+rr²VçG'’ç7FGW2’ÀĞ¢‚‚wFBrÂçVÆÂÂVçG'’æ6ö×ÆWFVDBòæWrFFR†VçG'’æ6ö×ÆWFVDB’çFôÆö6ÆU7G&–ær‚’¢~(	Br’ÀĞ¢‚‚wFBrÂ²6Æ74æÖS¢vÖöæòrÒÂVçG'’æ&6·Wf–ÆRÇÂ~(	Br’ÀĞ¢’’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vÆVv7•&W6W'fVBr’’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vFFr’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢vw&–BrÒÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚wfW'6–öâr’’Â‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂF–væ÷7F–73òçfW'6–öâóò7FGW3òçfW'6–öâóò~(	Br’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚w66†VÖr’’Â‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂF–væ÷7F–73òç66†VÖfW'6–öâóò7FGW3òç66†VÖfW'6–öâóò~(	Br’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚v6÷VçG2r’’Â‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂF–væ÷7F–73òæFF&6Sòæ6÷VçG2ò†F–væ÷7F–72æFF&6Ræ6÷VçG2æWfVçG2óò’²ròr²†F–væ÷7F–72æFF&6Ræ6÷VçG2æ–çFW&W7G2óò’¢~(	Br’’ÀĞ¢’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÆ–fT–çFVw&F–öâr’²~ûÉ¢r²†F–væ÷7F–73òæ–çFVw&F–öç3òæÆ–fSòæf–Æ&ÆRò†F–væ÷7F–72æ–çFVw&F–öç2æÆ–fRæVæ&ÆVBòB‚vVæ&ÆVBr’¢B‚vF—6&ÆVBr’’¢B‚væ÷D6öææV7FVBr’’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÖVÖ÷'”–çFVw&F–öâr’²~ûÉ¢r²†F–væ÷7F–73òæ–çFVw&F–öç3òæÖVÖ÷'“òæf–Æ&ÆRò†F–væ÷7F–72æ–çFVw&F–öç2æÖVÖ÷'’æVæ&ÆVBòB‚vVæ&ÆVBr’¢B‚vF—6&ÆVBr’’¢B‚væ÷D6öææV7FVBr’’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÖVÖ÷'•w&—FRr’²~ûÉ¢r²†F–væ÷7F–73òæ–çFVw&F–öç3òæÖVÖ÷'“òçw&—FTf–Æ&ÆRòB‚vÖVÖ÷'•w&—FU6fRr’¢B‚vÖVÖ÷'•w&—FUVæf–Æ&ÆRr’’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vFF&6Rr’²~ûÉ¢r²†F–væ÷7F–73òæFF&6SòæFF&6Róò~(	Br’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÆ7DW'&÷"r’²~ûÉ¢r²†F–væ÷7F–73òæÆ7DW'&÷#òæÖW76vRóò~(	Br’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vFF†–çBr’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢ÆöDF–væ÷7F–72ÂF—6&ÆVC¢'W7’ÒÂB‚w&Vg&W6‚r’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢Fô&6·WÂF—6&ÆVC¢'W7’ÒÂB‚v&6·Wr’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚v&6·W2r’’ÀĞ¢&6·W2æÆVæwF‚ÓÓÒ Ğ¢ò‚‚wrÂçVÆÂÂB‚væô&6·W2r’Ğ¢¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚vÆ&VÂrÂçVÆÂÂB‚w6VÆV7D&6·Wr’ÀĞ¢‚‚w6VÆV7BrÂ²fÇVS¢6VÆV7FVD&6·WÂF—6&ÆVC¢'W7’Âöä6†ævS¢†WfVçB’Óâ6WE6VÆV7FVD&6·W†WfVçBçF&vWBçfÇVR’ÒÀĞ¢ââæ&6·W2æÖ‚†—FVÒ’Óâ‚‚v÷F–öârÂ²¶W“¢—FVÒæf–ÆRÂfÇVS¢—FVÒæf–ÆRÒÂ—FVÒæf–ÆR²r+rr²†—FVÒæ'—FW2óò’²r"+rr²†—FVÒæ7&VFVDBóòrr’’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢vFævW"rÂöä6Æ–6³¢Fõ&W7F÷&RÂF—6&ÆVC¢'W7’ÇÂ6VÆV7FVD&6·WÒÂB‚w&W7F÷&T&6·Wr’’ÀĞ¢’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w&W7F÷&T&6·W†–çBr’’ÀĞ¢’ÀĞ¢“°Ğ¢ÒVÇ6R–b‡F"ÓÓÒvF–væ÷7F–72r’°Ğ¢6öçFVçBÒ‚€Ğ¢&V7Bäg&vÖVçBÀĞ¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vF–væ÷7F–72r’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢vw&–BrÒÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚wfW'6–öâr’’Â‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂF–væ÷7F–73òçfW'6–öâóò7FGW3òçfW'6–öâóò~(	Br’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚w7FFT†VÇF‡’r’’Â‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂF–væ÷7F–73òç7FFRóò7FGW3òç7FFRóò~(	Br’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚w66†VÖr’’Â‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂF–væ÷7F–73òç66†VÖfW'6–öâóò7FGW3òç66†VÖfW'6–öâóò~(	Br’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6&BrÒÂ‚‚w6ÖÆÂrÂçVÆÂÂB‚v6÷VçG2r’’Â‚‚vF—brÂ²6Æ74æÖS¢wfÇVRrÒÂF–væ÷7F–73òæFF&6Sòæ6÷VçG2ò†F–væ÷7F–72æFF&6Ræ6÷VçG2æWfVçG2óò’²ròr²†F–væ÷7F–72æFF&6Ræ6÷VçG2æ–çFW&W7G2óò’¢~(	Br’’ÀĞ¢’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÆ–fT–çFVw&F–öâr’²~ûÉ¢r²†F–væ÷7F–73òæ–çFVw&F–öç3òæÆ–fSòæf–Æ&ÆRò†F–væ÷7F–72æ–çFVw&F–öç2æÆ–fRæVæ&ÆVBòB‚vVæ&ÆVBr’¢B‚vF—6&ÆVBr’’¢B‚væ÷D6öææV7FVBr’’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÖVÖ÷'”–çFVw&F–öâr’²~ûÉ¢r²†F–væ÷7F–73òæ–çFVw&F–öç3òæÖVÖ÷'“òæf–Æ&ÆRò†F–væ÷7F–72æ–çFVw&F–öç2æÖVÖ÷'’æVæ&ÆVBòB‚vVæ&ÆVBr’¢B‚vF—6&ÆVBr’’¢B‚væ÷D6öææV7FVBr’’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÖVÖ÷'•w&—FRr’²~ûÉ¢r²†F–væ÷7F–73òæ–çFVw&F–öç3òæÖVÖ÷'“òçw&—FTf–Æ&ÆRòB‚vÖVÖ÷'•w&—FU6fRr’¢B‚vÖVÖ÷'•w&—FUVæf–Æ&ÆRr’’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vFF&6Rr’²~ûÉ¢r²†F–væ÷7F–73òæFF&6SòæFF&6Róò~(	Br’’ÀĞ¢‚‚wrÂçVÆÂÂB‚vÆ7DW'&÷"r’²~ûÉ¢r²†F–væ÷7F–73òæÆ7DW'&÷#òæÖW76vRóò~(	Br’’ÀĞ¢‚‚wrÂçVÆÂÂB‚v6öæf–u6÷W&6Rr’²~ûÉ¢r²B‚w6ÖU6÷W&6Rr’’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢ÆöDF–væ÷7F–72ÂF—6&ÆVC¢'W7’ÒÂB‚w&Vg&W6‚r’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢Fô&6·WÂF—6&ÆVC¢'W7’ÒÂB‚v&6·Wr’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚v&6·W2r’’ÀĞ¢&6·W2æÆVæwF‚ÓÓÒ Ğ¢ò‚‚wrÂçVÆÂÂB‚væô&6·W2r’Ğ¢¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚vÆ&VÂrÂçVÆÂÂB‚w6VÆV7D&6·Wr’ÀĞ¢‚€Ğ¢w6VÆV7BrÀĞ¢°Ğ¢fÇVS¢6VÆV7FVD&6·WÀĞ¢F—6&ÆVC¢'W7’ÀĞ¢öä6†ævS¢†WfVçB’Óâ6WE6VÆV7FVD&6·W†WfVçBçF&vWBçfÇVR’ÀĞ¢ÒÀĞ¢ââæ&6·W2æÖ‚†—FVÒ’Óâ‚‚v÷F–öârÂ²¶W“¢—FVÒæf–ÆRÂfÇVS¢—FVÒæf–ÆRÒÂ—FVÒæf–ÆR²r+rr²†—FVÒæ'—FW2óò’²r"+rr²†—FVÒæ7&VFVDBóòrr’’’ÀĞ¢’ÀĞ¢’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢vFævW"rÂöä6Æ–6³¢Fõ&W7F÷&RÂF—6&ÆVC¢'W7’ÇÂ6VÆV7FVD&6·WÒÂB‚w&W7F÷&T&6·Wr’’ÀĞ¢’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚w&W7F÷&T&6·W†–çBr’’ÀĞ¢’ÀĞ¢“°Ğ¢ĞĞ Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²vFFÖÖFWW2×7FFRs¢wG'VRrÒÀĞ¢‚‚w7G–ÆRrÂçVÆÂÂ552’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢w6†VÆÂrÒÀĞ¢‚€Ğ¢v6–FRrÀĞ¢²6Æ74æÖS¢w6–FRrÒÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v'&æBrÒÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v'&æDÖ&²rÂv&–Ö†–FFVâs¢wG'VRrÒÂtr’ÀĞ¢‚‚vF—brÂçVÆÂÂ‚‚w7G&öærrÂçVÆÂÂB‚wF—FÆRr’’Â‚‚w6ÖÆÂrÂçVÆÂÂÆærÓÓÒvVâròtÖFWW26÷&R7FFRÖöGVÆRr¢tÖFWW26÷&Rx«nhjŠYÙrr’’ÀĞ¢’ÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢w6–FUFrrÒÂtfrÖÆ"öÖFWW2×7FFRr’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢w6–FTÆ&VÂrÒÂu7FFRr’ÀĞ¢æbÀĞ¢’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v6öçFVçD&VrÒÀĞ¢†VFW"ÀĞ¢æ÷F–6RÀĞ¢6öçFVçBÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2rÂ7G–ÆS¢²Ö&v–åF÷¢sG‚rÒÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢w&–Ö'’rÂF—6&ÆVC¢F—6&ÆVBÇÂ†4W'&÷'2ÇÂF—'G’ÇÂ6öæfÆ–7E&Vbæ7W'&VçBÂöä6Æ–6³¢6fRÒÂ'W7’òB‚w6f–ærr’¢B‚w6fRr’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’ÇÂ‚F—'G’bb6öæfÆ–7E&Vbæ7W'&VçB’Âöä6Æ–6³¢6æ6VÂÒÂB‚v6æ6VÂr’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vFÖ–äæ÷FRr’’ÀĞ¢’ÀĞ¢’ÀĞ¢’ÀĞ¢‚„6öæf—&ÔF–ÆörÂ°Ğ¢÷Vã¢6öæf—&ÒÓÒçVÆÂÀĞ¢F—FÆS¢6öæf—&ÓòçF—FÆRóòrrÀĞ¢&öG“¢6öæf—&Óòæ&öG’óòrrÀĞ¢6öæf—&ÔÆ&VÃ¢6öæf—&Óòæ6öæf—&ÔÆ&VÂóòB‚v6öæf—&Òr’ÀĞ¢6æ6VÄÆ&VÃ¢B‚v6Æ÷6Rr’ÀĞ¢FævW#¢6öæf—&ÓòæFævW"ÓÓÒG'VRÀĞ¢öä6öæf—&Ó¢‚’Óâ6öæf—&Óòæ7F–öãòâ‚’ÀĞ¢öä6æ6VÃ¢‚’Óâ6WD6öæf—&Ò†çVÆÂ’ÀĞ¢Ò’ÀĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâ—57FFU7V&¦V7B‡7V&¦V7B’°Ğ¢–b‚7V&¦V7BÇÂG—Vöb7V&¦V7BÓÒvö&¦V7BrÇÂ7V&¦V7Bç¶sòææÖRÓÒtfrÖÆ"öÖFWW2×7FFRr’&WGW&âfÇ6S°Ğ¢–b‡7V&¦V7Bæ¶–æBÓÓÒv'VæFÆRr’&WGW&âG'VS°Ğ¢–b‡7V&¦V7Bæ¶–æBÓÓÒw&÷rr’°Ğ¢&WGW&â7V&¦V7Bç&÷sòæÖöGVÆTæÖRÓÓÒtfrÖÆ"öÖFWW2×7FFRrÇÂ7V&¦V7Bç&÷sòç&÷t–BÓÓÒvÖFWW2×7FFRs°Ğ¢ĞĞ¢&WGW&âfÇ6S°Ğ§ĞĞ Ğ¦gVæ7F–öâFWF–Ä÷F–öäÆ&VÂ†÷F–öâÂÆær’°Ğ¢6öç7B¦‚Ò°Ğ¢öfc¢~X[>™zÒrÀĞ¢7V'FÆS¢~‹Û¾[êârÀĞ¢7FæF&C¢~j~XxbrÀĞ¢7G&öæs¢~iˆîi‹ârÀĞ¢'&–Vc¢~zèyúŞx«nhrÀĞ¢7FFUö–çFW&W7G3¢~x«nhKˆîX[N‹j2rÀĞ¢Ó°Ğ¢6öç7BVâÒ°Ğ¢öfc¢töfbrÀĞ¢7V'FÆS¢u7V'FÆRrÀĞ¢7FæF&C¢u7FæF&BrÀĞ¢7G&öæs¢tæ÷F–6V&ÆRrÀĞ¢'&–Vc¢t'&–Vb7FFRrÀĞ¢7FFUö–çFW&W7G3¢u7FFRæB–çFW&W7G2rÀĞ¢Ó°Ğ¢&WGW&â†ÆærÓÓÒvVâròVâ¢¦‚•¶÷F–öåÒÇÂ÷F–öã°Ğ§ĞĞ Ğ¦gVæ7F–öâFWF–Å6V7F–öâ‡²7G‚Â7V&¦V7BÒ’°Ğ¢6öç7Bæf–vF÷$ÆæwVvRÒG—Vöbæf–vF÷"ÓÒwVæFVf–æVBrò7G&–ær†æf–vF÷"æÆæwVvRóòw¦‚r’¢w¦‚s°Ğ¢6öç7BÆærÒæf–vF÷$ÆæwVvRçFôÆ÷vW$66R‚’ç7F'G5v—F‚‚w¦‚r’òw¦‚r¢vVâs°Ğ¢6öç7BBÒ&V7BçW6T6ÆÆ&6²‚†¶W’’Óâ„D”5E¶ÆæuÒbbD”5E¶ÆæuÕ¶¶W•Ò’ÇÂD”5Bç¦…¶¶W•ÒÇÂ¶W’Â¶ÆæuÒ“°Ğ¢6öç7B·6æ6†÷BÂ6WE6æ6†÷EÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶G&gBÂ6WDG&gEÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶†VÇF‚Â6WD†VÇF…ÒÒ&V7BçW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶†VÇF„W'&÷"Â6WD†VÇF„W'&÷%ÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B¶'W7’Â6WD'W7•ÒÒ&V7BçW6U7FFR†fÇ6R“°Ğ¢6öç7B¶ÖW76vRÂ6WDÖW76vUÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7B¶W'&÷"Â6WDW'&÷%ÒÒ&V7BçW6U7FFR‚rr“°Ğ¢6öç7Bf÷&Õ&VbÒ&V7BçW6U&Vb†çVÆÂ“°Ğ¢6öç7BG&gE&VbÒ&V7BçW6U&Vb†çVÆÂ“°Ğ¢6öç7B6öæfÆ–7E&VbÒ&V7BçW6U&Vb†fÇ6R“°Ğ¢G&gE&Vbæ7W'&VçBÒG&gC°Ğ Ğ¢6öç7BÆöD†VÇF‚Ò&V7BçW6T6ÆÆ&6²†7–æ2‚’Óâ°Ğ¢G'’°Ğ¢6öç7BFFÒv—B’‚r÷7FGW2r“°Ğ¢6WD†VÇF‚†FF“°Ğ¢6WD†VÇF„W'&÷"‚rr“°Ğ¢Ò6F6‚†R’°Ğ¢6WD†VÇF‚†çVÆÂ“°Ğ¢6WD†VÇF„W'&÷"†RæÖW76vR“°Ğ¢ĞĞ¢ÒÂµÒ“°Ğ Ğ¢&V7BçW6TVffV7B‚‚’Óâ°Ğ¢ÆWBÆ—fRÒG'VS°Ğ¢ÆWBf÷&Ó°Ğ¢G'’°Ğ¢f÷&ÒÒ7G‚æ6öæf–tf÷&×2ævWB„å2“°Ğ¢f÷&Õ&Vbæ7W'&VçBÒf÷&Ó°Ğ¢Ò6F6‚°Ğ¢6WDW'&÷"‡B‚w6WGF–æw5Væf–Æ&ÆRr’“°Ğ¢ĞĞ¢–b‚f÷&Ò’&WGW&â‚’Óâ²Æ—fRÒfÇ6S²Ó°Ğ¢6öç7B7–æ2Ò‚’Óâ°Ğ¢–b‚Æ—fR’&WGW&ã°Ğ¢6öç7BæW‡BÒf÷&ÒævWE6æ6†÷B‚“°Ğ¢6öç7B&Wf–÷W4G&gBÒG&gE&Vbæ7W'&VçC°Ğ¢–b††5&Wf—6–öä6öæfÆ–7B‡&Wf–÷W4G&gBÂæW‡BÂDUD”Åôd”TÄE2Â&Wf–÷W4G&gCòç7FGW2ÓÓÒw&VG’r’’°Ğ¢6öæfÆ–7E&Vbæ7W'&VçBÒG'VS°Ğ¢6WDW'&÷"‡B‚v6öæfÆ–7Br’“°Ğ¢ĞĞ¢6WE6æ6†÷B†æW‡B“°Ğ¢6WDG&gB‚‡&Wf–÷W2’Óâ°Ğ¢–b‡&Wf–÷W2ÓÓÒçVÆÂÇÂ&Wf–÷W2ç7FGW2ÓÒw&VG’r’&WGW&âG&gDg&öÕ6æ6†÷B†æW‡B“°Ğ¢–b‚—4F—'G’‡&Wf–÷W2ÂæW‡BÂDUD”Åôd”TÄE2’’&WGW&âG&gDg&öÕ6æ6†÷B†æW‡B“°Ğ¢&WGW&â²ââç&Wf–÷W2Â&Wf—6–öã¢æW‡Bç&Wf—6–öâÂw&—F&ÆS¢æW‡Bçw&—F&ÆRÂ7FGW3¢æW‡Bç7FGW2Ó°Ğ¢Ò“°Ğ¢Ó°Ğ¢7–æ2‚“°Ğ¢6öç7BVç7V'67&–&RÒf÷&Òç7V'67&–&R‡7–æ2“°Ğ¢ÆöD†VÇF‚‚“°Ğ¢&WGW&â‚’Óâ°Ğ¢Æ—fRÒfÇ6S°Ğ¢Vç7V'67&–&R‚“°Ğ¢òò6öæf–tf÷&×2ævWB‚’&WGW&ç2†÷7BÖ÷væVB6†&VB6öçG&öÆÆW"âöæÇ’Vç7V'67&–&RF†—2f–WràĞ¢Ó°Ğ¢ÒÂ¶7G‚ÂÆöD†VÇF‚ÂEÒ“°Ğ Ğ¢–b‚G&gBÇÂ6æ6†÷BÇÂ6æ6†÷BçfÇVRÇÂ6æ6†÷Bç7FGW2ÓÓÒvÆöF–ærr’°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²vFFÖÖFWW2×7FFRs¢wG'VRrÂ6Æ74æÖS¢vÒÖFWF–ÂrÒÀĞ¢‚‚w7G–ÆRrÂçVÆÂÂ552’ÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vFWF–ÅF—FÆRr’’ÀĞ¢‚‚wrÂ²&öÆS¢w7FGW2rÒÂB‚vÆöF–ærr’’ÀĞ¢W'&÷"ò‚‚vF—brÂ²6Æ74æÖS¢vÖW76vRW'&÷"rÂ&öÆS¢vÆW'BrÒÂW'&÷"’¢çVÆÂÀĞ¢“°Ğ¢ĞĞ¢–b‡6æ6†÷Bç7FGW2ÓÓÒwVæf–Æ&ÆRr’°Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²vFFÖÖFWW2×7FFRs¢wG'VRrÂ6Æ74æÖS¢vÒÖFWF–ÂrÒÀĞ¢‚‚w7G–ÆRrÂçVÆÂÂ552’ÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vFWF–ÅF—FÆRr’’ÀĞ¢‚‚wrÂ²&öÆS¢vÆW'BrÒÂB‚w6WGF–æw5Væf–Æ&ÆRr’’ÀĞ¢“°Ğ¢ĞĞ Ğ¢6öç7BW'&÷'2ÒfÆ–FFTÆÂ†G&gBçfÇVW2ÂDUD”Åôd”TÄE2“°Ğ¢6öç7B†4W'&÷'2Òö&¦V7Bæ¶W—2†W'&÷'2’æÆVæwF‚â°Ğ¢6öç7BF—'G’Ò—4F—'G’†G&gBÂ6æ6†÷BÂDUD”Åôd”TÄE2“°Ğ¢6öç7BF—6&ÆVBÒ'W7’ÇÂG&gBçw&—F&ÆS°Ğ Ğ¢6öç7B6†ævRÒ†¶W’ÂfÇVR’Óâ°Ğ¢6WDG&gB‚‡&Wf–÷W2’Óâ6WDG&gEfÇVR‡&Wf–÷W2Â¶W’ÂfÇVR’“°Ğ¢6WDÖW76vR‚rr“°Ğ¢6WDW'&÷"‚rr“°Ğ¢Ó°Ğ Ğ¢6öç7B6fRÒ7–æ2‚’Óâ°Ğ¢6öç7Bf÷&ÒÒf÷&Õ&Vbæ7W'&VçC°Ğ¢6öç7B7W'&VçBÒf÷&ÓòævWE6æ6†÷B‚“°Ğ¢–b‚f÷&ÒÇÂ7W'&VçB’&WGW&ã°Ğ¢–b†6öæfÆ–7E&Vbæ7W'&VçB’°Ğ¢6WDW'&÷"‡B‚v6öæfÆ–7Br’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b††4W'&÷'2’°Ğ¢6WDW'&÷"‡B‚v–çfÆ–Df–VÆBr’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B÷2Ò'V–ÆE6WD÷2†G&gBÂ7W'&VçBÂDUD”Åôd”TÄE2“°Ğ¢–b†÷2æÆVæwF‚ÓÓÒ’°Ğ¢6WDÖW76vR‡B‚vFWF–Äæô6†ævW2r’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6WD'W7’‡G'VR“°Ğ¢6WDW'&÷"‚rr“°Ğ¢G'’°Ğ¢6öç7Bö²Òv—Bf÷&Òæ×WFFR†÷2Â7W'&VçBç&Wf—6–öâ“°Ğ¢–b‚ö²’°Ğ¢6öæfÆ–7E&Vbæ7W'&VçBÒG'VS°Ğ¢6WDW'&÷"‡B‚v6öæfÆ–7Br’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öæfÆ–7E&Vbæ7W'&VçBÒfÇ6S°Ğ¢6WDÖW76vR‡B‚vFWF–Å6fVBr’“°Ğ¢v—BÆöD†VÇF‚‚“°Ğ¢Ò6F6‚†R’°Ğ¢6WDW'&÷"†RæÖW76vR“°Ğ¢Òf–æÆÇ’°Ğ¢6WD'W7’†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ Ğ¢6öç7B6æ6VÂÒ‚’Óâ°Ğ¢6öç7B7W'&VçBÒf÷&Õ&Vbæ7W'&VçCòævWE6æ6†÷B‚“°Ğ¢–b†7W'&VçB’6WDG&gB†G&gDg&öÕ6æ6†÷B†7W'&VçB’“°Ğ¢6öæfÆ–7E&Vbæ7W'&VçBÒfÇ6S°Ğ¢6WDW'&÷"‚rr“°Ğ¢6WDÖW76vR‚rr“°Ğ¢Ó°Ğ Ğ¢6öç7Bf–VÆD6öçG&öÂÒ†f–VÆB’Óâ°Ğ¢6öç7B†VÇÒf–VÆE¶ÆæuÒÇÂf–VÆBç¦ƒ°Ğ¢6öç7BfÇVRÒG&gBçfÇVW5¶f–VÆBæ¶W•Ó°Ğ¢–b†f–VÆBçG—RÓÓÒv&ööÆVâr’°Ğ¢&WGW&â‚€Ğ¢vÆ&VÂrÀĞ¢²6Æ74æÖS¢w7v—F6‚rÒÀĞ¢‚‚v–çWBrÂ°Ğ¢G—S¢v6†V6¶&÷‚rÀĞ¢6†V6¶VC¢fÇVRÓÓÒG'VRÀĞ¢F—6&ÆVBÀĞ¢öä6†ævS¢†WfVçB’Óâ6†ævR†f–VÆBæ¶W’ÂWfVçBçF&vWBæ6†V6¶VB’ÀĞ¢Ò’ÀĞ¢‚‚w7ârÂçVÆÂÂfÇVRÓÓÒG'VRòB‚vVæ&ÆVBr’¢B‚vF—6&ÆVBr’’ÀĞ¢“°Ğ¢ĞĞ¢–b†f–VÆBçG—RÓÓÒvVçVÒr’°Ğ¢&WGW&â‚€Ğ¢w6VÆV7BrÀĞ¢°Ğ¢fÇVRÀĞ¢F—6&ÆVBÀĞ¢v&–ÖÆ&VÂs¢†VÇæÆ&VÂÀĞ¢öä6†ævS¢†WfVçB’Óâ6†ævR†f–VÆBæ¶W’ÂWfVçBçF&vWBçfÇVR’ÀĞ¢ÒÀĞ¢ââæf–VÆBæVçVÒæÖ‚†÷F–öâ’Óâ‚‚v÷F–öârÂ²¶W“¢÷F–öâÂfÇVS¢÷F–öâÒÂFWF–Ä÷F–öäÆ&VÂ†÷F–öâÂÆær’’’ÀĞ¢“°Ğ¢ĞĞ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v–æÆ–æRrÒÀĞ¢‚‚v–çWBrÂ°Ğ¢G—S¢w&ævRrÀĞ¢Ö–ã¢f–VÆBæÖ–âÀĞ¢Öƒ¢f–VÆBæÖ‚ÀĞ¢7FW¢f–VÆBç7FWóòÀĞ¢fÇVS¢çVÖ&W"‡fÇVR’ÀĞ¢F—6&ÆVBÀĞ¢v&–ÖÆ&VÂs¢†VÇæÆ&VÂÀĞ¢öä6†ævS¢†WfVçB’Óâ6†ævR†f–VÆBæ¶W’Â6Æ×f–VÆEfÇVR†f–VÆBÂWfVçBçF&vWBçfÇVR’’ÀĞ¢Ò’ÀĞ¢‚‚v–çWBrÂ°Ğ¢G—S¢vçVÖ&W"rÀĞ¢Ö–ã¢f–VÆBæÖ–âÀĞ¢Öƒ¢f–VÆBæÖ‚ÀĞ¢7FW¢f–VÆBç7FWóòÀĞ¢fÇVS¢çVÖ&W"‡fÇVR’ÀĞ¢F—6&ÆVBÀĞ¢v&–ÖÆ&VÂs¢†VÇæÆ&VÂÀĞ¢öä6†ævS¢†WfVçB’Óâ6†ævR†f–VÆBæ¶W’Â6Æ×f–VÆEfÇVR†f–VÆBÂWfVçBçF&vWBçfÇVR’’ÀĞ¢Ò’ÀĞ¢“°Ğ¢Ó°Ğ Ğ¢&WGW&â‚€Ğ¢vF—brÀĞ¢²vFFÖÖFWW2×7FFRs¢wG'VRrÂ6Æ74æÖS¢vÒÖFWF–ÂrÒÀĞ¢‚‚w7G–ÆRrÂçVÆÂÂ552’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢wæVÂrÒÀĞ¢‚‚vƒ2rÂçVÆÂÂB‚vFWF–ÅF—FÆRr’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vFWF–Ä–çG&òr’’ÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v6†—2rÒÀĞ¢‚‚w7ârÂ²6Æ74æÖS¢v6†—r²††VÇFƒòç7FFRÓÓÒw&VG’ròvö²r¢wv&âr’ÒÂB‚vFWF–Ä†VÇF‚r’²~ûÉ¢r²††VÇFƒòç7FFRÓÓÒw&VG’ròB‚w7FFT†VÇF‡’r’¢†VÇF„W'&÷"ÇÂB‚vFWF–ÅVæf–Æ&ÆRr’’’ÀĞ¢†VÇFƒòçfW'6–öâò‚‚w7ârÂ²6Æ74æÖS¢v6†—rÒÂwbr²†VÇF‚çfW'6–öâ’¢çVÆÂÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢vv†÷7BrÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢ÆöD†VÇF‚ÒÂB‚w&Vg&W6‚r’’ÀĞ¢’ÀĞ¢ââäDUD”Åôd”TÄE2æÖ‚†f–VÆB’ÓàĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vf–VÆBrÂ¶W“¢f–VÆBæ¶W’ÒÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢vÆ&VÂrÒÀĞ¢†f–VÆE¶ÆæuÒÇÂf–VÆBç¦‚’æÆ&VÂÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂ†f–VÆE¶ÆæuÒÇÂf–VÆBç¦‚’æ†VÇ’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂ†f–VÆBçG—RÓÓÒvçVÖ&W"pĞ¢òB‚w&ævRr’²rr²f–VÆBæÖ–â²~(	2r²f–VÆBæÖ‚²†f–VÆBçVæ—Bòrr²f–VÆBçVæ—B¢rr’²r+rpĞ¢¢rr’²B‚vFVfVÇBr’²rr²7G&–ær†f–VÆBæFVfVÇB’²r+rr²†f–VÆBç&W7F'BòB‚w&W7F'Br’¢B‚vÆ—fRr’’’ÀĞ¢’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢v6öçG&öÂrÒÂf–VÆD6öçG&öÂ†f–VÆB’’ÀĞ¢’ÀĞ¢’ÀĞ¢W'&÷ Ğ¢ò‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢vÖW76vRW'&÷"rÂ&öÆS¢vÆW'BrÒÀĞ¢W'&÷"ÀĞ¢W'&÷"ÓÓÒB‚v6öæfÆ–7Br’ò‚‚vF—brÂ²6Æ74æÖS¢v7F–öç2rÒÂ‚‚v'WGFöârÂ²G—S¢v'WGFöârÂöä6Æ–6³¢6æ6VÂÒÂB‚w&VÆöD66WFVBr’’’¢çVÆÂÀĞ¢Ğ¢¢çVÆÂÀĞ¢ÖW76vRò‚‚vF—brÂ²6Æ74æÖS¢vÖW76vR7V66W72rÂ&öÆS¢w7FGW2rÒÂÖW76vR’¢çVÆÂÀĞ¢‚€Ğ¢vF—brÀĞ¢²6Æ74æÖS¢v7F–öç2rÒÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂ6Æ74æÖS¢w&–Ö'’rÂF—6&ÆVC¢F—6&ÆVBÇÂ†4W'&÷'2ÇÂF—'G’ÇÂ6öæfÆ–7E&Vbæ7W'&VçBÂöä6Æ–6³¢6fRÒÂ'W7’òB‚w6f–ærr’¢B‚w6fRr’’ÀĞ¢‚‚v'WGFöârÂ²G—S¢v'WGFöârÂF—6&ÆVC¢'W7’ÇÂ‚F—'G’bb6öæfÆ–7E&Vbæ7W'&VçB’Âöä6Æ–6³¢6æ6VÂÒÂB‚v6æ6VÂr’’ÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂB‚vFWF–Å&W7F'Br’’ÀĞ¢’ÀĞ¢’ÀĞ¢“°Ğ§ĞĞ Ğ§&WGW&â°Ğ¢–æ¦V7C¢²w6Æ÷G2rÂv6öæf–tf÷&×2uÒÀĞ¢Ç’†7G‚’°Ğ¢ÆWB6WGF–æw47F—fS°Ğ¢ÆWBFWF–Ä7F—fS°Ğ¢òòv†–ÆU6W'fVB¶VW2öfbÒ&Vv—7FW"‚âââ–æB&VÆV6W2—BöæÇ’v†VâF†PĞ¢òòæÖW76R7F÷2&V–ær6W'fVBâ&WGW&æ–ærF—7÷6W"†æB&V–ær–FV×÷FVç@Ğ¢òò7&÷72&WVFVBvF6‚7–æ72’&WfVçG26V6öæB&Vv—7G&F–öâv—F‚F†R6ÖPĞ¢òò6Æ÷B–Bâf—&RÖæBÖf÷&vWB&Vv—7FW"ÆVfW2öffVæFVf–æVBæBGWÆ–6FW0Ğ¢òòF†RVçG'’gFW"F—6&ÆR÷&RÖVæ&ÆRÂ„Õ"÷"Ö—'&÷"&Vg&W6‚àĞ¢6öç7B7F—fFRÒ‚’Óâ°Ğ¢–b‡6WGF–æw47F—fR’&WGW&â6WGF–æw47F—fRæF—7÷6S°Ğ¢ÆWBF—7÷6RÒ‚’Óâ·Ó°Ğ¢G'’°Ğ¢F—7÷6RÒ7G‚ç6Æ÷G2æ–æ¦V7B‚w6WGF–æw2ç6V7F–öârÂ‚’ÓàĞ¢7G‚ç6Æ÷G2ç&Vv—7FW"€Ğ¢°Ğ¢æÖS¢w6WGF–æw2ç6V7F–öârÀĞ¢–C¢vÖFWW2×7FFRrÀĞ¢÷&FW#¢#RÀĞ¢Æ&VÃ¢‚’ÓâtÖFWW2x«nhrÀĞ¢ÒÀĞ¢‚’Óâ‚…æVÂÂ²7G‚Ò’ÀĞ¢’ÀĞ¢’ÇÂ‚‚’Óâ·Ò“°Ğ¢Ò6F6‚†W'&÷"’°Ğ¢6öç6öÆRæW'&÷"‚u¶ÖFWW2×7FFUÒ6WGF–æw2ç6V7F–öâVæf–Æ&ÆRrÂW'&÷"“°Ğ¢ĞĞ¢6öç7BF—7÷6ÂÒ‚’Óâ°Ğ¢–b‚6WGF–æw47F—fRÇÂ6WGF–æw47F—fRæF—7÷6RÓÒF—7÷6Â’&WGW&ã°Ğ¢6WGF–æw47F—fRÒVæFVf–æVC°Ğ¢G'’²F—7÷6R‚“²Ò6F6‚²ò¢Ç&VG’F—7÷6VB¢òĞĞ¢Ó°Ğ¢6WGF–æw47F—fRÒ²F—7÷6S¢F—7÷6ÂÓ°Ğ¢&WGW&âF—7÷6Ã°Ğ¢Ó°Ğ¢6öç7B7F—fFTFWF–ÂÒ‚’Óâ°Ğ¢–b†FWF–Ä7F—fR’&WGW&âFWF–Ä7F—fRæF—7÷6S°Ğ¢ÆWBF—7÷6RÒ‚’Óâ·Ó°Ğ¢G'’°Ğ¢F—7÷6RÒ7G‚ç6Æ÷G2æ–æ¦V7B‚wÇVv–ç2æFWF–Âç6V7F–öârÂ‚’ÓàĞ¢7G‚ç6Æ÷G2ç&Vv—7FW"€Ğ¢°Ğ¢æÖS¢wÇVv–ç2æFWF–Âç6V7F–öârÀĞ¢–C¢vÖFWW2×7FFRÖ&6–2Ö6öæf–rrÀĞ¢÷&FW#¢3ÀĞ¢ÒÀĞ¢‡&÷2’Óâ†—57FFU7V&¦V7B‡&÷3òç7V&¦V7B’ò‚„FWF–Å6V7F–öâÂ²7G‚Â7V&¦V7C¢&÷2ç7V&¦V7BÒ’¢çVÆÂ’ÀĞ¢’ÀĞ¢’ÇÂ‚‚’Óâ·Ò“°Ğ¢Ò6F6‚†W'&÷"’°Ğ¢6öç6öÆRæW'&÷"‚u¶ÖFWW2×7FFUÒÇVv–ç2æFWF–Âç6V7F–öâVæf–Æ&ÆRrÂW'&÷"“°Ğ¢ĞĞ¢6öç7BF—7÷6ÂÒ‚’Óâ°Ğ¢–b‚FWF–Ä7F—fRÇÂFWF–Ä7F—fRæF—7÷6RÓÒF—7÷6Â’&WGW&ã°Ğ¢FWF–Ä7F—fRÒVæFVf–æVC°Ğ¢G'’²F—7÷6R‚“²Ò6F6‚²ò¢Ç&VG’F—7÷6VB¢òĞĞ¢Ó°Ğ¢FWF–Ä7F—fRÒ²F—7÷6S¢F—7÷6ÂÓ°Ğ¢&WGW&âF—7÷6Ã°Ğ¢Ó°Ğ¢–b†7G‚æ6öæf–tf÷&×2bbG—Vöb7G‚æ6öæf–tf÷&×2çv†–ÆU6W'fVBÓÓÒvgVæ7F–öâr’°Ğ¢7G‚æVffV7B‚‚’Óâ7G‚æ6öæf–tf÷&×2çv†–ÆU6W'fVB…´å5ÒÂ7F—fFR’ÂvÖFWW2×7FFS¢6WGF–æw2vRr“°Ğ¢7G‚æVffV7B‚‚’Óâ7G‚æ6öæf–tf÷&×2çv†–ÆU6W'fVB…´å5ÒÂ7F—fFTFWF–Â’ÂvÖFWW2×7FFS¢ÇVv–âFWF–Âr“°Ğ¢ÒVÇ6R°Ğ¢7G‚æVffV7B‚‚’Óâ7F—fFR‚’ÂvÖFWW2×7FFS¢6WGF–æw2vRr“°Ğ¢7G‚æVffV7B‚‚’Óâ7F—fFTFWF–Â‚’ÂvÖFWW2×7FFS¢ÇVv–âFWF–Âr“°Ğ¢ĞĞ¢ÒÀĞ§Ó°Ğ ¢Ğ§Ò“° §&WGW&âFW67&—F÷"æf7F÷'’‡&WV—&R“·Ò’‚’À¢'W'6öæ#¢‚‚“Óç¶ÆWBFW67&—F÷#²6öç7BÆöFW#×¶ÆöC§ƒÓç¶FW67&—F÷#×‡×Ó²6öç7Bv–æF÷rÒæWr&÷‡’†vÆö&ÅF†—2çv–æF÷rÇ¶vWC¢‡F&vWBÆ¶W’“Óç¶–b†¶W“ÓÓÒuõôÖöGVÆTÆöFW%õòr—&WGW&âÆöFW#¶6öç7BfÇVSÕ&VfÆV7BævWB‡F&vWBÆ¶W’ÇF&vWB“·&WGW&âG—VöbfÇVSÓÓÒvgVæ7F–öâs÷fÇVRæ&–æB‡F&vWB“§fÇVW×Ò“°¢òòvVæW&FVB'’67&—G2ö'V–ÆBÖ6Æ–VçBæÖ§2g&öÒ7&2ö6Æ–VçB×æVÂæ§2âFòæ÷BVF—B'’†æBà§v–æF÷råõôÖöGVÆTÆöFW%õòæÆöB‡¶–C¢tfrÖÆ"öÖFWW2×W'6öærÆf7F÷'“¢‡&WV—&R“Óç°¢òòE4‚6WGF–æw2×6V7F–öâ6Æ–VçB6÷W&6RâF†—2f–ÆR—2w&VB–âF†RÆ§’Ô4¥0Ğ¢òòÖöGVÆRÆöFW"'’67&—G2ö'V–ÆBÖ6Æ–VçBæÖ§3²—B—2æ÷B–×÷'FVB'’F†R†÷7BàĞ¦6öç7B²7&VFTVÆVÖVçC¢‚ÂW6TVffV7BÂW6U7FFRÒÒ&WV—&R‚w&V7Br“°Ğ Ğ¦6öç7B•õ$ôõBÒrö’öÖFWW2×W'6öæs°Ğ¦6öç7B4ôå4ôÄUõU$ÂÒ•õ$ôõB²rö6öç6öÆRs°Ğ¦6öç7BÄäuTtUô´U’ÒvÖFWW2çW'6öææÆæwVvRs°Ğ¦6öç7BÄäuTtU2Ò²w¦‚Ô4ârÂvVâÕU2uÓ°Ğ¦6öç7BDTdTÅEôÄäuTtRÒw¦‚Ô4âs°Ğ¢òò&WÆ6VBv—F‚F†R6†&VB7&2ö“†âö6FÆöræ§2FF'’67&—G2ö'V–ÆBÖ6Æ–VçBæÖ§2àĞ¦6öç7B“„åô4DÄôrÒö&¦V7Bæg&VW¦R‡²'¦‚Ô4â#§²&çF—FÆR#¢$ÖFWW2W'6öæ+rh˜iÈˆ^hê~X‹nXû"Â&æ'&æEW'6öæ#¢.K«®Šëâ"Â&æ'&æE7V'F—FÆR#¢.YÎKˆj[ø2+rZI®zxŞŠ‹ëâ"Â&æW–V'&÷r#¢$ÔDUU2+rh˜iÈˆ^hê~X‹nXû"Â&ææd6F–öâ#¢%U%4ôä+rh˜iÈˆ^hê~X‹nXû"Â&ææd&–#¢.K‹¾ZûÎˆŠ¢"Â&æ÷væW$WF†VçF–6FVB#¢.h˜iÈˆ^[{.ŠêNŠø+rkXşŠxYšKˆŞKùŞZÙK«®Šëîx«nh"Â&æfö÷FW"#¢$ÖFWW2W'6öæcã"+rK¸^˜	®‹ør†÷7B¥4ôâ’+riÈ{¸hùzK®ŠøŞXúşŠxh
~[	®iÊ®š¨ÎŠø"Â&æ†÷7E7FGW2#¢$„õ5Bx«nh"Â&çv÷&·76R#¢%v÷&·76R"Â&æ–æ¦V7F–öâ#¢.k:XZR"Â&ç&Wf—6–öâ#¢.KúîŠê.x˜iÊÂ"Â&æ6÷&TæE7G–ÆTæW‡B#¢.j[ø>K«®ŠëîKˆîš8îjÎi»NiK[nYÊKˆ¾jÊjŠYè¾{¸NŠ8^i{nyIşiX8""Â&ææõv÷&·76T–æ¦V7G4æ÷F†–ær#¢.iÊ®{¹Zé¢v÷&·76^ûÈÎYºjÚBW'6öæKˆŞKÉ®k:XZ^K»¾KÙ^Xh^Zë8""Â&ææõv÷&·76T&÷VæB#¢.iÊ®{¹Zé¢v÷&·76R"Â&æÆæwVvTÆ&VÂ#¢.yXÎ™Ú.ŠúŞŠˆ"Â&æÆæwVvT6†–æW6R#¢.KŠŞihr"Â&æÆæwVvTVævÆ—6‚#¢$VævÆ—6‚"Â&çF†VÖTF&²#¢.k{ˆ›.jŠ[Èò"Â&çF†VÖTÆ–v‡B#¢.kX^ˆ›.jŠ[Èò"Â'vRæ÷fW'f–WrçF—FÆR#¢.h¾Šx‚"Â'vRæ÷fW'f–Wrç7V'F—FÆR#¢.KˆKŠ®j[ø>‹ª¾K»ŞûÈÎ˜XŞYhÈYË®išşŠ‹ëîûÉ¾XZ˜:yKyÉşZéâ†÷7Bi[hÚîš›Xª8""Â'vRæÆ–'&'’çF—FÆR#¢.K«®Šëî[©2"Â'vRæÆ–'&'’ç7V'F—FÆR#¢.{»NhªNKˆKŠ®j[ø>K«®ŠëîûÈÎKº^Xø®K»¾hHşi[˜xşy¨NXúşZHŞyJš8îjÎXÚ8""Â'vRæ&–æF–æw2çF—FÆR#¢.YË®išş{¹Zé¢"Â'vRæ&–æF–æw2ç7V'F—FÆR#¢.K‹®Xù~KúK»¾y¨Bv÷&·76RKÉ®ŠùŞKˆî[{.š¨ÎŠøy¨BYË®išş˜hºiˆîzîy¨NjŠ[Èş8""Â'vRæF–væ÷7F–72çF—FÆR#¢.k:XZ^Šø®ijÒ"Â'vRæF–væ÷7F–72ç7V'F—FÆR#¢.˜XŞ{ÚîKˆîY¹î‹>ŠøhÚîXˆnXŠ¾[^zK®ûÈÎ[›nKˆîiÈ{¸hùzK®ŠøŞXúşŠxh
~XË®Xˆn8""Â'vRç6WGF–æw2çF—FÆR#¢.Šëî{Úâ"Â'vRç6WGF–æw2ç7V'F—FÆR#¢.{¹Zé®KˆKŠ¢v÷&·76^ûÈÎ˜hº›¹ŠêNXÎûÈÎhê~X‹nk:XZ^ûÈÎ[›nzêynZH~K»Ş8""Â'vRæ÷fW'f–Wrææb#¢.h¾Šx‚"Â'vRæÆ–'&'’ææb#¢.K«®Šëî[©2"Â'vRæ&–æF–æw2ææb#¢.YË®išş{¹Zé¢"Â'vRæF–væ÷7F–72ææb#¢.Šø®ijÒ"Â'vRç6WGF–æw2ææb#¢.Šëî{Úâ"Â'vRæFö7VÖVçEF—FÆR#¢'·vWÒ+rÖFWW2W'6öæ"Â&6öÖÖöâæF6‚#¢.(	B"Â&6öÖÖöâçVæ¶æ÷vâ#¢.iÊ®yúR"Â&6öÖÖöâææöæR#¢.iz"Â&6öÖÖöâææ÷D&÷VæB#¢.iÊ®{¹Zé¢"Â&6öÖÖöâæVæ&ÆVB#¢.[{.Y
şyJ‚"Â&6öÖÖöâæF—6&ÆVB#¢.[{.zhyJ‚"Â&6öÖÖöâç–W2#¢.iŠò"Â&6öÖÖöâææò#¢.Y
b"Â&6öÖÖöâæÖçVÂ#¢.h˜¾Xª‚"Â&6öÖÖöâç6W76–öç2æöæR#¢#KŠ®KÉ®ŠùÒ"Â&6öÖÖöâç6W76–öç2æ÷F†W"#¢'¶6÷VçGÒKŠ®KÉ®ŠùÒ"Â&6öÖÖöâæ6†&7FW'2#¢'¶6÷VçGÒZÙ~zÊb"Â&6öÖÖöâæW7F–ÖFVEFö¶Vç2#¢.{ªb¶6÷VçGÒFö¶Vâ"Â&6öÖÖöâæ6÷&TöæÇ’#¢.K¸^j[ø>K«®Šëâ"Â&6öÖÖöâæÖ—76–æu7G–ÆR#¢.{Ë®ZKy¨Nš8îjÂ"Â&6öÖÖöâç&Wf—6–öäF6‚#¢.KúîŠê.x˜iÊÂ(	B"Â&6öÖÖöâç&Wf—6–öåfÇVR#¢.KúîŠê.x˜iÊÂ'·&Wf—6–öçÒ"Â&6öÖÖöâç7F÷&vTö²#¢.ZÙX*jÚ>[‹‚"Â&6öÖÖöâç7F÷&vT–çfÆ–B#¢.ZÙX*iziX‚"Â&6öÖÖöâç7F÷&vUVæf–Æ&ÆR#¢.ZÙX*KˆŞXúşyJ‚"Â&6öÖÖöâç7F÷&vUVæ¶æ÷vâ#¢.ZÙX*x«nhiÊ®yúR"Â&6öÖÖöâæ÷væW"#¢.h˜iÈˆR"Â'7FGW2çG'W7FVB#¢.Xù~KúK»²"Â'7FGW2çVçG'W7FVB#¢.KˆŞXù~KúK»²"Â'7FGW2çVæ¶æ÷vâ#¢.iÊ®yúR"Â'7FGW2ææôW‡Æ–6—D&–æF–ær#¢.izi‹î[Èş{¹Zé¢"Â&ÖöFRææôW‡Æ–6—B#¢.izi‹î[Èş{¹Zé¢"Â&ÖöFRæ–æ†W&—B#¢.{º~h›ş›¹ŠêB+r·7G–ÆWÒ"Â&ÖöFRæ6÷&TöæÇ’#¢.K¸^j[ø>K«®Šëâ"Â&ÖöFRç7G–ÆR#¢.š8îjÂ+r·7G–ÆWÒ"Â&ÖöFRæF—6&ÆVB#¢.k:XZ^[{.zhyJ‚"Â&ÖöFRæ–æ†W&—D÷F–öâ#¢.{º~h›òv÷&·76R›¹ŠêB+r·7G–ÆWÒ"Â&ÖöFRæ6÷&TöæÇ”÷F–öâ#¢.K¸^j[ø>K«®Šëâ+rizš8îjÂ"Â&ÖöFRç7V6–f–VE7G–ÆR#¢.hÈ~Zé®š8îjÂ"Â&ÖöFRæF—6&ÆVD÷F–öâ#¢.zhyJ‚+rKˆŞk:XZRW'6öæjë^‰Ò"Â'&V6öâæö²#¢.jÚ>[‹Šz>ié"Â'&V6öâææõ÷6W76–öâ#¢.k*iÈkK¾XªKÉ®ŠùÒ"Â'&V6öâç7V&vVçB#¢.[{.hé.™šNZÙKº>ynKÉ®ŠùÒ"Â'&V6öâç7F÷&vU÷Væf–Æ&ÆR#¢.ZÙX*KˆŞXúşyJ‚"Â'&V6öâæ–æ¦V7F–öåöF—6&ÆVB#¢.k:XZ^[{.zhyJ‚"Â'&V6öâçv÷&·76U÷Væ&÷VæB#¢.iÊ®{¹Zé¢v÷&·76R"Â'&V6öâçv÷&·76UöÖ—76–ær#¢.{¹Zé®y¨Bv÷&·76R[{.KˆŞZÙYÊ‚"Â'&V6öâææ÷E÷v÷&·76UöÖVÖ&W"#¢.KÉ®ŠùŞKˆŞ[îK¨îŠúRv÷&·76R"Â'&V6öâç6W76–öåö–çfÆ–B#¢.KÉ®ŠùŞ‹ª¾K»ŞiziX‚"Â'&V6öâçöÖ–æu÷VçG'W7FVB#¢%YË®išşiŠ[NKˆŞXúşyJh‰nKˆŞXù~KúK»²"Â'&V6öâæ&–æF–æuöF—6&ÆVB#¢.[{.ZûŠú^yºîj~i‹î[ÈşzhyJ‚"Â'&V6öâæ6÷&UöV×G’#¢.j[ø>K«®ŠëîK‹®z›¢"Â'&V6öâç7G–ÆUöÖ—76–ær#¢.h˜˜š8îjÎ[{.KˆŞZÙYÊ‚"Â'&V6öâç÷Væf–Æ&ÆR#¢%†÷7BiŠ[NKˆŞXúşyJ‚"Â'&V6öâç÷&Wfö¶VB#¢%YË®išşhèiØ>[{.i*N™H"Â'&V6öâç÷66VæU÷&Wfö¶VB#¢%YË®išşiŠ[N[{.i*N™H"Â'&V6öâæ&–æF–æu÷v÷&·76UöÖ—6ÖF6‚#¢.{¹Zé®[îK¨îX[nK¹bv÷&·76R"Â'&V6öâævVçEöæ÷EöÆ—fR#¢$vVçB[Ù>X˜ŞKˆŞiŠşkK¾Xªx«nh"Â'&V6öâæ†÷7Eö76VÖ&Ç•öf–ÆVB#¢$†÷7B{¸NŠ8^ZK‹JR"Â'&V6öâæ†÷7Eö76VÖ&Ç•÷Væf–Æ&ÆR#¢$†÷7B{¸NŠ8^KˆŞXúşyJ‚"Â'&V6öâæ–çfÆ–Eö†÷7Eö76VÖ&Ç’#¢$†÷7B{¸NŠ8^{¹>iéÎiziX‚"Â'&V6öâç7FFUö6†ævVEöGW&–æuö6†V6²#¢.j8iú^iÉş™{Nx«nh[{.XùXÉb"Â'&V6öâçVæ¶æ÷vâ#¢.iÊ®yú^XéşYº"Â'7FGW5&V6öâçv÷&·76UöÖVÖ&W"#¢.[Ù>X˜Òv÷&·76Rh‰Y‚"Â'7FGW5&V6öâçfW&–f–VE÷÷66VæR#¢.[{.š¨ÎŠøy¨BYË®išşiŠ[B"Â'7FGW5&V6öâç7G–ÆUöÖ—76–ær#¢.h˜˜š8îjÎ[{.KˆŞZÙYÊ‚"Â'7FGW5&V6öâçv÷&·76U÷Væ&÷VæB#¢.[	®iÊ®{¹Zé¢v÷&·76R"Â'7FGW5&V6öâçv÷&·76UöÖ—76–ær#¢.{¹Zé®y¨Bv÷&·76R[{.KˆŞZÙYÊ‚"Â'7FGW5&V6öâææ÷E÷v÷&·76UöÖVÖ&W"#¢.KÉ®ŠùŞ[{.zk¾[Èv÷&·76R"Â'7FGW5&V6öâç÷Væf–Æ&ÆR#¢%†÷7BiŠ[NKˆŞXúşyJ‚"Â'7FGW5&V6öâçöÖ–æuö–çfÆ–B#¢%iŠ[NKˆŞXhŞXù~KúK»²"Â'7FGW5&V6öâç÷66VæU÷VæÖVB#¢%YË®išşiÊ®iŠ[NX‹[Ù>X˜ŞKÉ®ŠùÒ"Â'7FGW5&V6öâç÷&Wfö¶VB#¢%YË®išşhèiØ>[{.i*N™H"Â'7FGW5&V6öâæ&–æF–æu÷v÷&·76UöÖ—6ÖF6‚#¢.{¹Zé®[îK¨îX[nK¹bv÷&·76R"Â'7FGW5&V6öâæv—F–æuöf—'7E÷6W76–öâ#¢.zØ[è^šinjÊKÉ®ŠùÒ"Â&†—7F÷'’æ7F–öâæ6÷&RçWFFR#¢.j[ø>K«®Šëîi»NikûÈ†6÷&RçWFF^ûÈ’"Â&†—7F÷'’æ7F–öâæ6÷&Rç&öÆÆ&6²#¢.j[ø>K«®ŠëîY¹îk¹®ûÈ†6÷&Rç&öÆÆ&6¾ûÈ’"Â&†—7F÷'’æ7F–öâç7G–ÆRæ7&VFR#¢.š8îjÎX‰¾[»®ûÈ‡7G–ÆRæ7&VF^ûÈ’"Â&†—7F÷'’æ7F–öâç7G–ÆRçWFFR#¢.š8îjÎi»NikûÈ‡7G–ÆRçWFF^ûÈ’"Â&†—7F÷'’æ7F–öâç7G–ÆRæFVÆWFR#¢.š8îjÎXŠ™šNûÈ‡7G–ÆRæFVÆWF^ûÈ’"Â&†—7F÷'’æ7F–öâç7G–ÆRç&öÆÆ&6²#¢.š8îjÎY¹îk¹®ûÈ‡7G–ÆRç&öÆÆ&6¾ûÈ’"Â&†—7F÷'’æ7F–öâæ&–æF–ærçW6W'B#¢.{¹Zé®XiXZ^ûÈ†&–æF–ærçW6W'NûÈ’"Â&†—7F÷'’æ7F–öâæ&–æF–æræFVÆWFR#¢.{¹Zé®XŠ™šNûÈ†&–æF–æræFVÆWF^ûÈ’"Â&†—7F÷'’æ7F–öâæFVfVÇB×7G–ÆRç6WB#¢.Šëî{Úî›¹ŠêNš8îjÎûÈ†FVfVÇB×7G–ÆRç6WNûÈ’"Â&†—7F÷'’æ7F–öâçv÷&·76Ræ&–æB#¢.{¹Zé¢v÷&·76^ûÈ‡v÷&·76Ræ&–æNûÈ’"Â&†—7F÷'’æ7F–öâç6WGF–æw2çWFFR#¢.i»NikŠëî{ÚîûÈ‡6WGF–æw2çWFF^ûÈ’"Â'F&vWBç&—fFR#¢.zxˆ¢"Â'F&vWBæw&÷W#¢.{êNˆ¢"Â'F&vWBç7V'F—FÆR#¢%YË®išò+r&÷B¶&÷GÒ"Â'F&vWBçv—F–æu6W76–öâ#¢.[{.hèiØ2+rzØ[è^šinjÊKÉ®ŠùÒ+r&÷B¶&÷GÒ"Â'F&vWBç7V'F—FÆUv—F…6W76–öâ#¢%YË®išò+r&÷B¶&÷GÒ+rKÉ®ŠùÒ·6W76–öçÒ"Â'F&vWBçv÷&·76U6W76–öâ#¢%v÷&·76RKÉ®ŠùÒ"Â'F&vWBçv÷&·76U6W76–öå&W6WB#¢%v÷&·76RKÉ®ŠùÒ+rvVçBš(NŠëâ·&W6WGÒ"Â'F&vWBç7F÷&VD&–æF–ær#¢.[{.ZÙ{¹Zé¢+r†÷7B[{.KˆŞXhŞX‰~X{®Šú^yºîjr"Â'F&vWBçVæ¶æ÷vâ#¢.iÊ®yúR"Â'F&vWBç7F÷&VE6W76–öâ#¢%v÷&·76RKÉ®ŠùÒ"Â'F&vWBçfW&–f–VE66VæR#¢.[{.š¨ÎŠøYË®išò"Â'F&vWBçv÷&·76U6W76–öäÆ&VÂ#¢%v÷&·76RKÉ®ŠùÒ"Â'F&vWBç7V&vVçE–ÆÂ#¢.ZÙKº>yb"Â'F&vWBç6W76–öäEv÷&·76R#¢%v÷&·76RKÉ®ŠùÒ"Â&VF—F÷"æ6÷&TæÖR#¢.j[ø>K«®Šëâ"Â&VF—F÷"çVç6fVB#¢.iÈiÊ®KùŞZÙy¨Ni»NiK’"Â&VF—F÷"ç6fVB#¢.[{.KùŞZÙ‚+rKˆ¾jÊjŠYè¾{¸NŠ8^yIşiX‚"Â&VF—F÷"æ6†$6÷VçB#¢'¶6÷VçGÒò¶Ö‡ÒZÙ~zÊb"Â&VF—F÷"çFö¶VäW7F–ÖFR#¢.{ªb·Fö¶Vç7ÒKŠ®KËŠêFö¶Vâ+rŠÚnY®™ˆXÂ·v&çÒ"Â&VF—F÷"çFö¶Våv&æ–ær#¢%Fö¶VâKËŠê‹h^‹ør·v&çÒFö¶VâŠÚnY®™ˆXÎ8.‹ùiŠşY
şXù[ÈşKËzé~ûÈÎ[›n™Ùî{+îzîXˆnŠøŞ{¹>iéÎ8""Â&VF—F÷"æ6öæfÆ–7Ev&æ–ær#¢.‹ùjë^ih~ZÙ~Xúşˆ;ŞKˆîj[ø>‹ª¾K»Şh‰bE4‚[z^X[~iØ>™™Xk.z¨8.Šû~jZûhHşY»îûÉ¾jÚNhùzK®KˆŞKÉ®ˆz®Xª™‹¾jÚ.KùŞZÙûÈÎZéî™˜^iØ>™™K¸ŞyK†÷7Bhš~ŠÎ8""Â&VF—F÷"ç6VÆV7D6&B#¢.˜hºKˆ[ÊXÚx˜~‹ù¾ŠÎ{Én‹é8""Â&VF—F÷"ç7G–ÆTæÖR#¢.š8îjÎYŞz{"Â&VF—F÷"æFW67&—F–öâ#¢.KˆXú^ŠùŞhøş‹û"Â&VF—F÷"æ6öÆ÷$Æ&VÂ#¢.š)Îˆ›.j~Šë"Â&VF—F÷"ç7G–ÆT6öÆ÷"#¢.š8îjÎš)Îˆ›""Â&VF—F÷"æ7W7FöÔ6öÆ÷"#¢.ˆz®Zé®K˜š)Îˆ›""Â&6öÆ÷"æw&VVâ#¢.{»şˆ›""Â&6öÆ÷"çf–öÆWB#¢.{J¾ˆ›""Â&6öÆ÷"ç&÷6R#¢.xê¾{ª""Â&6öÆ÷"æ&ÇVR#¢.‰9Şˆ›""Â&6öÆ÷"æÖ&W"#¢.y
^xøˆ›""Â&VF—F÷"ææWu7G–ÆUF—FÆR#¢.ik[»®š8îjÂ"Â&VF—F÷"æVF—D6÷&UF—FÆR#¢.{Én‹éj[ø>K«®Šëâ"Â&VF—F÷"æVF—E7G–ÆUF—FÆR#¢.{Én‹éš8îjÂ"Â&VF—F÷"æ6÷&U7V'F—FÆR#¢.yK{¹Zé®y¨Bv÷&·76RXh^h˜iÈXù~KúK»¾yºîj~X[Kª²"Â&VF—F÷"ç7G–ÆU7V'F—FÆR#¢.XúşŠ*¾i‹î[Èş{¹Zé®h‰bv÷&·76R›¹ŠêNš8îjÎZHŞyJ‚"Â&VF—F÷"æ&FvT6÷&R#¢.j[ø2"Â&VF—F÷"æ&FvU7G–ÆR#¢.š8îjÂ"Â&VF—F÷"ææWu7G–ÆTæ÷FR#¢.ikš8îjÎXú®KÉ®YÊKÚKùŞZÙi{nXiXZR†÷7NûÈÎKˆŞKÉ®š(NZ¾zK®Kè¾K«®Šëîih~iÊÎ8""Â&VF—F÷"æ6÷&T&öG”Æ&VÂ#¢.j[ø>K«®ŠëîjÚ>ihr+r4õTÂ"Â&VF—F÷"ç7G–ÆT&öG”Æ&VÂ#¢.š8îjÎjÚ>ihr+r5E”ÄR"Â&VF—F÷"æ6÷&UÆ6V†öÆFW"#¢.XiKˆ¾X[Kª¾‹ª¾K»Ş8K»~XÎŠx.KˆîŠ‹ëîXéşX‰(
n(
b"Â&VF—F÷"ç7G–ÆUÆ6V†öÆFW"#¢.XiKˆ¾YË®išşK‰>[îy¨NŠ‹ëîKˆîŠÎK‹®hÈ~[É^(
n(
b"Â&VF—F÷"æ†—7F÷'’#¢.XènXû""Â&VF—F÷"æ6÷’#¢.ZHŞX‹b"Â&VF—F÷"æFVÆWFR#¢.XŠ™šB"Â&VF—F÷"æF—66&B#¢.iKî[È>i»NiK’"Â&VF—F÷"æ7&VFR#¢.X‰¾[»®š8îjÂ"Â&VF—F÷"ç6fR#¢.KùŞZÙi»NiK’"Â&VF—F÷"æfö÷Fæ÷FR#¢.i»NiK[nYÊKˆ¾jÊjŠYè¾{¸NŠ8^i{nyIşiX8.xëiÈKÉ®ŠùŞKùŞyYX[bvVçBš(NŠëî8[z^X[~8iØ>™™KˆîXènXû.Šë[Ù^8""Â&VF—F÷"ææõ7G–ÆT6&G2#¢.‹ùk*iÈš8îjÎXÚ8""Â&VF—F÷"æ7&VFTf—'7E7G–ÆR#¢.X‰¾[»®zÊÎKˆKŠ®š8îjÂ"Â&VF—F÷"çW'6öæFVf–æ—F–öç2#¢.K«®ŠëîZé®K˜’"Â&VF—F÷"ææWu7G–ÆR#¢.ik[»®š8îjÂ"Â&VF—F÷"ç6†&VD–FVçF—G’#¢.KˆKŠ®X[Kª¾‹ª¾K»Ò+r4õTÂ"Â&VF—F÷"æ6öæf–wW&VB#¢.[{.˜XŞ{Úâ"Â&VF—F÷"æV×G’#¢.z›¢"Â&VF—F÷"æ6÷&TV×G•FW‡B#¢.j[ø>K«®ŠëîK‹®z›®8.YÊh˜iÈˆ^XiXZ^[›nKùŞZÙK˜¾X˜ŞûÈÎKˆŞKÉ®k:XZ^K»¾KÙ^j[ø>ih~iÊÎ8""Â&VF—F÷"æ6†'5Fö¶Vç2#¢'¶6†'7ÒZÙ~zÊb+r{ªb·Fö¶Vç7ÒFö¶Vâ"Â&VF—F÷"çFö¶Våv&æ–æu7Vff—‚#¢"+rFö¶VâŠÚnY¢"Â&VF—F÷"æVF—D6÷&R#¢.{Én‹éj[ø2"Â&VF—F÷"ç7G–ÆTÆ–'&'’#¢.š8îjÎ[©2"Â&VF—F÷"ç&WW6&ÆR#¢.XúşYÊXù~KúK»¾yºîj~™{NZHŞyJ‚"Â&VF—F÷"æW‡&W76–öäæ÷FUF—FÆR#¢.‹ùiŠşŠ‹ëî[.ûÈÎKˆŞiŠşzÊÎK¨ÎKŠ®K«®Šëî8""Â&VF—F÷"æW‡&W76–öäæ÷FR#¢.š8îjÎXÚXúXªYÊj[ø>K«®ŠëîK˜¾Kˆ®8.Zè>KºÎ{¹ŞKˆŞi»şhÚ"E4‚š(NŠëî8hèK¨[z^X[~ûÈÎK™şKˆŞKÉ®iKXù‚8Æ–f^8ÖVÖ÷'’h‰b7FFRiØ>™™8""Â&VF—F÷"æW7EFö¶Vç2#¢'·Fö¶Vç7ÒKËŠêFö¶Vâ"Â&VF—F÷"æVF—B#¢.{Én‹é"Â&VF—F÷"ç6VÆV7E7G–ÆR#¢.˜hºKˆKŠ®š8îjÎ(
n(
b"Â&VF—F÷"ç&W6WDÆ&VÂ#¢$vVçBš(NŠëâ"Â&VF—F÷"çv÷&·76U6W76–öåF—FÆR#¢%v÷&·76RKÉ®ŠùÒ"Â&&–æF–æw2ç6VÆV7EF&vWB#¢.K¸îX‰~ŠKŠŞ˜hºKˆKŠ¢v÷&·76RKÉ®ŠùŞh‰n[{.š¨ÎŠøy¨BYË®išş8""Â&&–æF–æw2ææôÖF6†W2#¢.k*iÈzÊnYzÙ¾˜iÚK»ny¨NXù~KúK»¾yºîj~8""Â&&–æF–æw2ç6VÆV7EF&vWD†–çB#¢.jÚNZHNXú®i‹îzK®[Ù>X˜ŞXù~KúK»²v÷&·76RKŠŞXùxëy¨Nyºîj~8.k*iÈXúşˆz®yK‹é>XZ^y¨B”BZÙ~jë^8""Â&&–æF–æw2çF&vWE6÷W&6R#¢.yºîj~iÚ^k©"Â&&–æF–æw2çfW&–f–VEÖ–ær#¢.[{.š¨ÎŠøy¨B†÷7BiŠ[B"Â&&–æF–æw2æ7W'&VçDÖVÖ&W'6†—#¢.[Ù>X˜Òv÷&·76Rh‰YX[>{;²"Â&&–æF–æw2ç7FÆUF&vWB#¢.[{.ZÙyºîj~KˆŞXhŞX{®xëYÊZéîi{nk:XhÎŠKŠŞ8""Â&&–æF–æw2ç&WfÆ–FFVB#¢$†÷7BYÊjøşjÊXiXZ^Kˆî{¸NŠ8^i{n˜xŞikš¨ÎŠø8""Â&&–æF–æw2ç7F&ÆT¶W’#¢.z‹>Zé®™Jâ"Â&&–æF–æw2ç7V&vVçDW†6ÇVFVB#¢.ZÙKº>ynKÉ®ŠùŞŠ*¾hé.™šNûÉ¾izk9^K‹®jÚN{¹Zé®KùŞZÙ8""Â&&–æF–æw2æ&–æF–æu&Wf—6–öâ#¢.{¹Zé®KúîŠê.x˜iÊÂ·&Wf—6–öçÒ+r¶FFWÒ"Â&&–æF–æw2æ–æ†W&—G4FVfVÇB#¢.YÊKùŞZÙX˜Ş{º~h›òv÷&·76R›¹ŠêN8""Â&&–æF–æw2ç7V&vVçD&ææW%F—FÆR#¢.ZÙKº>ynKÉ®ŠùŞ8""Â&&–æF–æw2ç7V&vVçD&ææW$&öG’#¢.Šz>iéYšKÉ®hé.™šNXù~KúK»¾iÚ^k©K‹¢Ç7â6Æ73ÕÂ&ÖöæõÂ#ç7V&vVçCÂ÷7ãây¨NKÉ®ŠùŞ8.izk9^K‹®jÚNyºîj~KùŞZÙ{¹Zé®8""Â&&–æF–æw2çVçG'W7FVD&ææW%F—FÆR#¢.[{.ZÙ{¹Zé®[Ù>X˜ŞKˆŞXù~KúK»¾8""Â&&–æF–æw2çVçG'W7FVD&ææW$&öG’#¢'·&V6öçŞ8.{¹Zé®KÉ®Š*¾KùŞyYKº^Ké¾Zê™ˆ^ûÈÎKØnYÊyºîj~˜xŞikXù~KúK»¾K˜¾X˜ŞKˆŞKÉ®k:XZ^8""Â&&–æF–æw2æÖöFTÆ&VÂ#¢.i‹î[ÈşjŠ[Èò"Â&&–æF–æw2æÖöFT†VÇ#¢.i‹î[Èş{¹Zé®KÉXXK¨âv÷&·76R›¹ŠêN8.zhyJKÉ®XÎjÚ.Šú^yºîj~y¨Nj[ø>K«®ŠëîKˆîš8îjÎk:XZ^8""Â&&–æF–æw2ç7G–ÆT6&B#¢.š8îjÎXÚ"Â&&–æF–æw2ç6VÆV7E7G–ÆT÷F–öâ#¢.˜hºKˆKŠ®š8îjÎ(
n(
b"Â&&–æF–æw2ææõ7G–ÆW2#¢.[	®KˆŞZÙYÊš8îjÎ8.KùŞZÙš8îjÎ{¹Zé®X˜ŞûÈÎŠû~XXYÊ(	ÎK«®Šëî[©>(	ŞKŠŞX‰¾[»®KˆKŠ®8""Â&&–æF–æw2ç&W6WD–æ†W&—B#¢.˜xŞ{ÚîK‹®{º~h›ò"Â&&–æF–æw2ç&VÖ÷fR#¢.z{¾™šN{¹Zé¢"Â&&–æF–æw2ç6fR#¢.KùŞZÙ{¹Zé¢"Â&&–æF–æw2æ6öæf–wW&VE&Wf–Wr#¢.˜XŞ{Úîš(NŠx‚"Â&&–æF–æw2ç&Wf–Wtæ÷FR#¢.KˆŞˆ;ŞKÙÎK‹®iÈ{¸hùzK®ŠøŞXúşŠxh
~y¨NŠøhÚâ"Â&&–æF–æw2æFVÆWF–öä–×7EF—FÆR#¢.XŠ™šN[ÛY8ŞûÉ¢"Â&&–æF–æw2æFVÆWF–öä–×7D&öG’#¢.z{¾™šN{¹Zé®Xú®KÉ®iKXùŠú^yºîj~y¨BW'6öæ˜hºûÈÎKˆŞKÉ®XŠ™šNKÉ®ŠùŞ8Šëş™zî8vVçBš(NŠëî8[z^X[~h‰niØ>™™8.˜xŞ{ÚîK‹®{º~h›şKÉ®˜^[ê®[Ù>X˜Òv÷&·76R›¹ŠêN8""Â&&–æF–æw2ææõv÷&·76UF—FÆR#¢.iÊ®{¹Zé¢v÷&·76^8""Â&&–æF–æw2ææõv÷&·76T&öG’#¢.YÊX‰¾[»®h‰n{Én‹éi‹î[Èş{¹Zé®X˜ŞûÈÎŠû~XXYÊŠëî{ÚîKŠŞ{¹Zé¢v÷&·76^8""Â&&–æF–æw2æ÷Vå6WGF–æw2#¢.h™>[ÈŠëî{Úâ"Â&&–æF–æw2ç6V&6„&–#¢.i	Î{J.Xù~KúK»¾yºîjr"Â&&–æF–æw2ç6V&6…Æ6V†öÆFW"#¢.i	Î{J.KÉ®ŠùŞh‰nYË®išò"Â&&–æF–æw2æf–ÇFW$&–#¢.yºîj~zÙ¾˜’"Â&&–æF–æw2æÆÂ#¢.XZ˜:‚¶6÷VçGÒ"Â&&–æF–æw2ç6W76–öç2#¢.KÉ®ŠùÒ¶6÷VçGÒ"Â&&–æF–æw2ç#¢%¶6÷VçGÒ"Â&&–æF–æw2ç7V&vVçG2#¢.ZÙKº>yb"Â&&–æF–æw2æ6–FU&Vf—‚#¢.yºîj~K¸^K¸â"Â&&–æF–æw2æ6–FU7Vff—‚#¢"KˆîXúş˜y¨NXù~KúK»²†÷7BiÈŞXªKŠŞXùxë8.KˆŞˆ;ŞY	Xù~KúK»¾{¹Zé®‹é>XZ^K»¾KÙR”N8""Â&&–æF–æw2ææõ6V7F–öç5F—FÆR#¢.KˆŞk:XZRW'6öæjë^‰Ò"Â&&–æF–æw2æF—6&ÆVD&FvR#¢.[{.zhyJ‚"Â&&–æF–æw2ææõ6V7F–öç4&öG’#¢.Šú^yºîj~y¨NKŠNKŠ¢W'6öæjë^‰Ş˜;ŞKÉ®Šz>iéK‹®z›®ih~iÊÎ8.X[nK¹n{;¾{¹şhùzK®ŠøŞXh^ZëKˆŞXù~[ÛY8Ş8""Â&&–æF–æw2æ6÷&U&Wf–WuF—FÆR#¢.j[ø>K«®Šëâ"Â&&–æF–æw2æ6÷&TV×G•&Wf–Wr#¢.j[ø>K«®ŠëîK‹®z›®ûÉ¾KˆŞKÉ®hùKé¾K»¾KÙ^j[ø>ih~iÊÎ8""Â&&–æF–æw2ææõ7G–ÆTÆ–W%F—FÆR#¢.izš8îjÎ[""Â&&–æF–æw2ææõ7G–ÆTÆ–W$&FvR#¢.K¸^j[ø2"Â&&–æF–æw2ææõ7G–ÆTÆ–W$&öG’#¢.[Ù>X˜ŞˆØz‹şKˆ¾ûÈÎŠú^yºîj~KˆŞKÛşyJK»¾KÙ^š8îjÎih~iÊÎ8""Â&&–æF–æw2ç&W6W'fVEF—FÆR#¢.KùŞyYy¨Nˆ;ŞX©¾™Ú""Â&&–æF–æw2ç&W6W'fVD&öG’#¢$vVçBš(NŠëî8[z^X[~8iØ>™™8‹ùŠÎi{nKˆ®Kˆ¾ih~8hèiØ>8ÖVÖ÷'87FFRKˆâÆ–fRYØ~KˆŞKÉ®Š*²W'6öæKúîiK8""Â'6WGF–æw2æ&÷VæEv÷&·76R#¢.{¹Zé®y¨Bv÷&·76R"Â'6WGF–æw2æ&÷VæEv÷&·76T&öG’#¢%W'6öæhÈz‹>Zé¢”BXú®KúK»¾KˆKŠ¢E4‚v÷&·76^8.Xˆ~hÚ.X˜Şˆz®XªZH~K»Ş[›n[Ù.j>iz~{¹Zé®ûÉ¾ikv÷&·76RKˆŞ{º~h›şiz~YË®išş{¹Zé®8.KˆŞKÉ®XŠ™šNh‰n˜xŞ[»®K»¾KÙ^KÉ®ŠùŞ8""Â'6WGF–æw2çv÷&·76TÆ&VÂ#¢%v÷&·76R"Â'6WGF–æw2ææõv÷&·76T÷F–öâ#¢.iÊ®{¹Zé¢v÷&·76R+rk:XZ^[{.X[>™zÒ"Â'6WGF–æw2çv÷&·76T÷F–öâæöæR#¢'·F—FÆWÒ+rKŠ®KÉ®ŠùÒ"Â'6WGF–æw2çv÷&·76T÷F–öâæ÷F†W"#¢'·F—FÆWÒ+r¶6÷VçGÒKŠ®KÉ®ŠùÒ"Â'6WGF–æw2æ7W'&VçB#¢.[Ù>X˜ŞûÉ§·fÇVWÒ"Â'6WGF–æw2ææöæR#¢.iz"Â'6WGF–æw2ææõv÷&·76TÆ&VÂ#¢.izv÷&·76R"Â'6WGF–æw2ç&Vv—7G'•Væf–Æ&ÆR#¢"+rv÷&·76Rk:XhÎŠKˆŞXúşyJh‰nK‹®z›¢"Â'6WGF–æw2æÇ•v÷&·76T†–çB#¢.j[ø>Kˆîš8îjÎXÚKùŞyYûÉ¾iz~{¹Zé®ˆz®XªZH~K»Ş[›nK¸îkK¾‹x>˜XŞ{ÚîKŠŞkˆ^z›®8""Â'6WGF–æw2æÇ•v÷&·76R#¢.[©NyJ‚v÷&·76R"Â'6WGF–æw2æFVfVÇG4–æ¦V7F–öâ#¢.›¹ŠêNXÎKˆîk:XZR"Â'6WGF–æw2æFVfVÇG4&öG’#¢.[Ù>Xù~KúK»¾yºîj~k*iÈi‹î[Èş{¹Zé®i{nûÈÎKÛşyJ›¹ŠêNš8îjÎ8.i‹î[Èş{¹Zé®Zx¾{¸KÉXX8""Â'6WGF–æw2æFVfVÇE7G–ÆTÆ&VÂ#¢%v÷&·76R›¹ŠêNš8îjÂ"Â'6WGF–æw2æ6÷&TöæÇ”÷F–öâ#¢.K¸^j[ø>K«®Šëâ+riz›¹ŠêNš8îjÂ"Â'6WGF–æw2æFVfVÇE7G–ÆT†–çB#¢.XŠ™šN[Ù>X˜Ş›¹ŠêNš8îjÎYîûÈÎjÚNŠëî{ÚîKÉ®˜xŞ{ÚîK‹®K¸^j[ø>K«®Šëî8""Â'6WGF–æw2æÇ”FVfVÇD†–çB#¢.[{.i‹î[Èş˜hºš8îjÎy¨NxëiÈyºîj~KˆŞXù~[ÛY8Ş8""Â'6WGF–æw2æÇ”FVfVÇB#¢.[©NyJ›¹ŠêB"Â'6WGF–æw2æVæ&ÆT–æ¦V7F–öâ#¢.Y
şyJ‚W'6öæk:XZR"Â'6WGF–æw2æVæ&ÆT–æ¦V7F–öä†VÇ#¢.X[>™zŞYîûÈÎKˆ¾jÊjŠYè¾{¸NŠ8^i{nKŠNKŠ¢W'6öæjë^‰Ş˜;ŞKÉ®Šz>iéK‹®z›®ih~iÊÎ8.xëiÈˆ®ZJXènXû.KˆîKÉ®ŠùŞKùŞhÈKˆŞXù8""Â'6WGF–æw2çF–Ö–ær#¢.i{niË®ûÉ®Kˆ¾jÊjŠYè¾{¸NŠ8^8.KˆŞKÉ®˜xŞ[»®KÉ®ŠùŞûÈÎK™şKˆŞKÉ®i»NiKš(NŠëî8.{;¾{¹şhùzK®ŠøŞXùXÉni{nûÈÄE4‚Xúşˆ;Ş[ÈZx¾iky¨NŠû~k.[¨şX‰~ûÉ¾iÊÎhù.K»nKˆŞh›şŠû®™»nh‰iÊÎ8""Â'6WGF–æw2æ&6·W2#¢.ZH~K»Ò"Â'6WGF–æw2æ&6·W4&öG’#¢.ZH~K»ŞiŠş{¸ş‹ø~j
š¨Îy¨NZèÎi[Nx«nhih~j>8.h.ZHŞX˜ŞKÉ®XXXiXZ^KˆK»ŞZèXZZH~K»ŞûÈÎ[›nKùŞyYXènXû.8""Â'6WGF–æw2æ&6·W&V6öâ#¢.Xúş˜ZH~K»Şj~zÛâ"Â'6WGF–æw2æ&6·W&V6öåÆ6V†öÆFW"#¢.XØ~{ª~X˜Ò"Â'6WGF–æw2æ&6·W†–çB#¢.ZH~K»ŞKˆŞKÉ®iKXù‚W'6öæKúîŠê.x˜iÊÎ8""Â'6WGF–æw2æ7&VFT&6·W#¢.X‰¾[»®ZH~K»Ò"Â'6WGF–æw2æf–Æ&ÆT&6·W2#¢.XúşyJZH~K»Ò"Â'6WGF–æw2æÆöF–æt&6·W2#¢.jÚ>YÊXª‹ÛŞZH~K»Ş(
n(
b"Â'6WGF–æw2æ&6·WVæf–Æ&ÆR#¢.ZH~K»ŞX‰~ŠKˆŞXúşyJ‚"Â'6WGF–æw2ææô&6·W2#¢.‹ùk*iÈiÈiXZH~K»Ş8.Šû~YÊ‹ù¾ŠÎZJ~Yè¾{Én‹éh‰nXØ~{ª~X˜ŞX‰¾[»®KˆKŠ®8""Â'6WGF–æw2çF&ÆRæ&6·W#¢.ZH~K»Ò"Â'6WGF–æw2çF&ÆRæ6GW&VE&Wf—6–öâ#¢.hÙ^ˆë~y¨NKúîŠê.x˜iÊÂ"Â'6WGF–æw2çF&ÆRç&V6öâ#¢.XéşYº"Â'6WGF–æw2çF&ÆRç6—¦R#¢.ZJ~[ò"Â'6WGF–æw2ç&W7F÷&R#¢.h.ZHÒ"Â'6WGF–æw2æ–çfÆ–D&6·W2æöæR#¢.[{.[ûŞyZRKŠ®iziXZH~K»Şih~K»n8""Â'6WGF–æw2æ–çfÆ–D&6·W2æ÷F†W"#¢.[{.[ûŞyZR¶6÷VçGÒKŠ®iziXZH~K»Şih~K»n8""Â'6WGF–æw2ç6V7W&—G’#¢.ZèXZKˆîyÉşZéî‹ëyXÂ"Â'6WGF–æw2ç6V7W&—G”—FVÒæWF‚#¢.jøşKŠ®hê~X‹nXûŠû~k.˜;Ş™ÈŠhYÎk©Šû~k.ûÈÎ[›n˜	®‹ør†÷7B6öææV7F–öâiÈŞXªˆë~[érE4‚÷væW"XxnXZ^8.K¸^Y¹îxêşYËYØKˆŞièNh‰hèiØ>8""Â'6WGF–æw2ç6V7W&—G”—FVÒç7F÷&vR#¢$Æö6Å7F÷&vRK¸^yJK¨îKùŞZÙyXÎ™Ú.ŠúŞŠˆKˆîkX^ˆ›"şk{ˆ›.K‹¾š)XşZ[Ş8%W'6öæ˜XŞ{Úî{¹ŞKˆŞKùŞZÙYÊkXşŠxYšKŠŞ8""Â'6WGF–æw2ç6V7W&—G”—FVÒçf—6–&–Æ—G’#¢.iÈ{¸{;¾{¹şhùzK®ŠøŞXúşŠxh
~YÊXù~KúK»²†÷7Bj8iú^hª^Y®X˜ŞYØ~ŠxnK‹®iÊ®š¨ÎŠø8.K¸^Y¹î‹>Š*¾‹>yJKˆŞiŠşŠøiˆî8""Â'6WGF–æw2ç6V7W&—G”—FVÒçFö¶Vç2#¢%Fö¶VâŠêi[iŠşY
şXù[ÈşKËzé~ûÈÎ[›n™Ùî{+îzîXˆnŠøŞ8.ZÙ~zÊnKˆ®™™yK†÷7B[Ë®X‹nhš~ŠÎ8""Â'6WGF–æw2ç6V7W&—G”—FVÒç#¢%YË®išş‹ª¾K»ŞK¸^hê^Xù~Xúş˜y¨B†÷7BiŠ[NûÉ¾jÚNhê~X‹nXûk*iÈXúşˆz®yK‹é>XZ^y¨B”BZÙ~jë^8""Â&÷fW'f–Wræ†W&ô¶–6¶W"#¢.KˆKŠ®‹ª¾K»Ò+rZI®zxŞŠ‹ëâ"Â&÷fW'f–Wræ†W&õ66÷VB#¢%W'6öæy¨NKÙÎyJYùşiŠş(	Ç·v÷&·76WŞ(	Ş8""Â&÷fW'f–Wræ†W&õVæ&÷VæB#¢.XX{¹Zé®KˆKŠ¢E4‚v÷&·76^8""Â&÷fW'f–Wræ†W&ô&öG’#¢%W'6öæKÉ®K‹®{¹Zé®y¨Bv÷&·76Rk{¾XªKŠNKŠ®xºÎz¸¾y¨N{;¾{¹şhùzK®ŠøŞjë^‰Ş8.Zè>KˆŞKÉ®˜hºš(NŠëî8i»NiK[z^X[~iënièNh‰nhèK¨iØ>™™8.Kº^Kˆ¾h˜iÈXÎYØ~iÚ^ˆz®{¸ş‹ø~ŠêNŠøy¨B†÷7B8""Â&÷fW'f–WræÖævT&–æF–æw2#¢.zêyn{¹Zé¢"Â&÷fW'f–Wræ6†ö÷6Uv÷&·76R#¢.˜hº’v÷&·76R"Â&÷fW'f–WræVF—D6÷&R#¢.{Én‹éj[ø>K«®Šëâ"Â&÷fW'f–Wræ6÷&T6öæf–wW&VB#¢.j[ø>K«®Šëî[{.˜XŞ{Úâ"Â&÷fW'f–Wræ6÷&TV×G’#¢.j[ø>K«®ŠëîK‹®z›¢"Â&÷fW'f–Wræ6÷&U6†&VB#¢.jøşKŠ®{¹Zé®y¨Bv÷&·76RX[Kª¾KˆKŠ¢4õTÂ"Â&÷fW'f–Wrç7G–ÆT6&G2#¢.š8îjÎXÚ"Â&÷fW'f–WræW‡Æ–6—D&–æF–æw2#¢.i‹î[Èş{¹Zé¢"Â&÷fW'f–Wrçv÷&·76TFVfVÇB#¢%v÷&·76R›¹ŠêB"Â&÷fW'f–WrçW'6öæ÷fW'f–Wr#¢.K«®Šëîh¾Šx‚"Â&÷fW'f–Wrç&Wf—6–öäæW‡B#¢.KúîŠê.x˜iÊÂ'·&Wf—6–öçÒ+rKˆ¾jÊjŠYè¾{¸NŠ8^yIşiX‚"Â&÷fW'f–Wræ6÷&UW'6öæ#¢.j[ø>K«®Šëâ"Â&÷fW'f–Wrç&W6VçB#¢.[{.˜XŞ{Úâ"Â&÷fW'f–WræV×G’#¢.z›¢"Â&÷fW'f–Wræ6†&7FW'5Fö¶Vç2#¢'¶6†'7ÒZÙ~zÊb+r·Fö¶Vç7ÒKËŠêFö¶Vâ"Â&÷fW'f–Wrç&WW6&ÆUF&vWG2#¢.XúşYÊXù~KúK»¾yºîj~™{NZHŞyJ‚"Â&÷fW'f–Wrçv÷&·76U6W76–öç5fW&–f–VB#¢'·6W76–öç7ÒKŠ¢v÷&·76RKÉ®ŠùÒ+r·66VæW7ÒKŠ®[{.š¨ÎŠøYË®išò"Â&÷fW'f–Wræ–æ¦V7F–öâ#¢.k:XZR"Â&÷fW'f–WræVæ&ÆVB#¢.[{.Y
şyJ‚"Â&÷fW'f–WræF—6&ÆVB#¢.[{.zhyJ‚"Â&÷fW'f–Wræ&÷VæEFôöæR#¢.[{.{¹Zé®KˆKŠ¢v÷&·76R"Â&÷fW'f–Wrææõv÷&·76R#¢.iÊ®{¹Zé¢v÷&·76R"Â&÷fW'f–Wrçv&æ–æw4&÷VæF&–W2#¢.ŠÚnY®Kˆî‹ëyXÂ"Â&÷fW'f–Wrç&Vg&W6‚#¢.X‹~ik"Â&÷fW'f–Wrææõv&æ–æw5F—FÆR#¢$†÷7BiÊ®hª^Y®˜XŞ{ÚîŠÚnY®8""Â&÷fW'f–Wrææõv&æ–æw4&öG’#¢.‹ù[›nKˆŞŠøiˆîiÈ{¸hùzK®ŠøŞXúşŠxûÉ¾Šû~iú^yÈ¾Šø®ijŞKŠŞy¨NY¹î‹>ŠøhÚî8""Â&÷fW'f–Wræ&÷VæEv÷&·76R#¢.[{.{¹Zé¢v÷&·76R"Â&÷fW'f–Wrç6WGF–æw2#¢.Šëî{Úâ"Â&÷fW'f–Wrçv÷&·76R#¢%v÷&·76R"Â&÷fW'f–WrçG'W7FVDÖVÖ&W'6†—#¢.Xù~KúK»¾h‰Y‚"Â&÷fW'f–Wrç6W76–öç46÷VçBæöæR#¢#KŠ®KÉ®ŠùÒ"Â&÷fW'f–Wrç6W76–öç46÷VçBæ÷F†W"#¢'¶6÷VçGÒKŠ®KÉ®ŠùÒ"Â&÷fW'f–Wrç7V&vVçG4W†6ÇVFVB#¢.ZÙKº>ynhÈXù~KúK»¾iÚ^k©Š*¾hé.™šB"Â&÷fW'f–WræFVfVÇE7G–ÆR#¢.›¹ŠêNš8îjÂ"Â&÷fW'f–WræFVfVÇE7G–ÆT†–çB#¢.yºîj~k*iÈi‹î[Èş{¹Zé®i{nKÛşyJ‚"Â&÷fW'f–WræVffV7F—fUF–Ö–ær#¢.yIşiXi{niË¢"Â&÷fW'f–WrææW‡D76VÖ&Ç’#¢.Kˆ¾jÊjŠYè¾{¸NŠ8R"Â&÷fW'f–Wrææõ&V7&VFR#¢.KˆŞKÉ®˜xŞ[»®KÉ®ŠùÒ"Â&÷fW'f–Wrææõv÷&·76T&÷VæB#¢.[	®iÊ®{¹Zé¢v÷&·76^8""Â&÷fW'f–Wræ6†ö÷6TöæR#¢.˜hºKˆKŠ¢"Â&÷fW'f–Wræ†÷u&W6öÇfW2#¢.Šz>iékXzˆ²"Â&÷fW'f–Wræf–Ä6Æ÷6VB#¢.ZK‹J^XÛ>X[>™zÒ"Â&÷fW'f–Wrç—VÆ–æRæ–FVçF—G”çVÒ#¢#+r‹ª¾K»Ò"Â&÷fW'f–Wrç—VÆ–æRæ–FVçF—G•F—FÆR#¢.Xª‹ÛŞj[ø>XÚ"Â&÷fW'f–Wrç—VÆ–æRæ–FVçF—G”&öG’#¢.K¸^™(Zû{¹Zé®y¨Bv÷&·76R"Â&÷fW'f–Wrç—VÆ–æRçG'W7DçVÒ#¢#"+rKúK»²"Â&÷fW'f–Wrç—VÆ–æRçG'W7EF—FÆR#¢.˜xŞikj8iú^KÉ®ŠùŞh‰YX[>{;²"Â&÷fW'f–Wrç—VÆ–æRçG'W7D&öG’#¢%YË®išş™ÈŠh{¸ş‹ø~š¨ÎŠøy¨B†÷7BiŠ[B"Â&÷fW'f–Wrç—VÆ–æRæ÷fW'&–FTçVÒ#¢#2+rŠhny¹b"Â&÷fW'f–Wrç—VÆ–æRæ÷fW'&–FUF—FÆR#¢.[©NyJi‹î[ÈşjŠ[Èò"Â&÷fW'f–Wrç—VÆ–æRæ÷fW'&–FT&öG’#¢.{º~h›ò(¢K¸^j[ø2(¢š8îjÂ(¢zhyJ‚"Â&÷fW'f–Wrç—VÆ–æRæ76VÖ&Ç”çVÒ#¢#B+r{¸NŠ8R"Â&÷fW'f–Wrç—VÆ–æRæ76VÖ&Ç•F—FÆR#¢.YÊjøşKŠ®jŠYè¾jÚ^šªN˜xŞikŠû¾Xùb"Â&÷fW'f–Wrç—VÆ–æRæ76VÖ&Ç”&öG’#¢.KˆŞiKXùš(NŠëî8[z^X[~h‰niØ>™™"Â&÷fW'f–Wræ6öæf–wW&VD&–æF–æw2#¢.[{.˜XŞ{Úî{¹Zé¢"Â&÷fW'f–Wræ÷Vä&–æF–æw2#¢.h™>[È{¹Zé¢"Â&÷fW'f–WrææôW‡Æ–6—D&–æF–æw2#¢.k*iÈi‹î[Èş{¹Zé®8.KÉ®ŠùŞKˆî[{.š¨ÎŠøYË®išş[nKÛşyJ‚v÷&·76R›¹ŠêNûÈZh.iÈûÈ8""Â&÷fW'f–WrçF&ÆUF&vWB#¢.yºîjr"Â&÷fW'f–WrçF&ÆTÖöFR#¢.jŠ[Èò"Â&÷fW'f–WrçF&ÆU7FGW2#¢.x«nh"Â&÷fW'f–Wræ–ç7V7B#¢.iú^yÈ²"Â&÷fW'f–Wrçv&æ–ærç7F÷&vUF—FÆR#¢%W'6öæZÙX*KˆŞX^[«r"Â&÷fW'f–Wrçv&æ–ærç7F÷&vUFW‡B#¢.k:XZ^KÉ®ZK‹J^X[>™zŞûÈÎXiXZ^KˆŞXúşyJ8.{º~{ºŞX˜ŞŠû~j8iúR†÷7BZÙX*x«nh8""Â&÷fW'f–Wrçv&æ–ærææõv÷&·76UF—FÆR#¢.[	®iÊ®{¹Zé¢v÷&·76R"Â&÷fW'f–Wrçv&æ–ærææõv÷&·76UFW‡B#¢%W'6öæKˆŞKÉ®k:XZ^K»¾KÙ^KÉ®ŠùŞ8.Šû~YÊŠëî{ÚîKŠŞ˜hºKˆKŠ¢v÷&·76^8""Â&÷fW'f–Wrçv&æ–ærçv÷&·76TÖ—76–æuF—FÆR#¢.{¹Zé®y¨Bv÷&·76R[{.KˆŞZÙYÊ‚"Â&÷fW'f–Wrçv&æ–ærçv÷&·76TÖ—76–æuFW‡B#¢.[{.ZÙX*y¨Bv÷&·76R”Bizk9^YÊ‚E4‚k:XhÎŠKŠŞŠz>ié8.Šû~˜xŞik{¹Zé®KˆKŠ®[Ù>X˜Òv÷&·76^8""Â&÷fW'f–Wrçv&æ–æræ–æ¦V7F–öåF—FÆR#¢.k:XZ^[{.zhyJ‚"Â&÷fW'f–Wrçv&æ–æræ–æ¦V7F–öåFW‡B#¢.[{.˜XŞ{Úîy¨NXÚx˜~KÉ®KùŞyYûÈÎKØnjŠYè¾{¸NŠ8^i{nKˆŞKÉ®hùKé¾K»¾KÙRW'6öæjë^‰Ş8""Â&÷fW'f–Wrçv&æ–æræ6÷&UFö¶VåF—FÆR#¢.j[ø>K«®Šëî‹h^‹ørFö¶VâŠÚnY®™ˆXÂ"Â&÷fW'f–Wrçv&æ–æræ6÷&UFö¶VåFW‡B#¢.Šû~j8iú^™[ş[ªn8%Fö¶VâŠêi[iŠşY
şXù[ÈşKËzé~ûÈÎ[›n™Ùî{+îzîXˆnŠøŞ{¹>iéÎ8""Â&÷fW'f–Wrçv&æ–æræ6&G5Fö¶VåF—FÆR#¢.Kˆ[Êh‰nZI®[ÊXÚx˜~‹h^‹ørFö¶VâŠÚnY®™ˆXÂ"Â&÷fW'f–Wrçv&æ–æræ6&G5Fö¶VåFW‡B#¢.zèyúŞ8z‹>Zé®y¨NK«®Šëîih~iÊÎi»Ni‰>Zê™ˆ^ûÈÎK™şKÉ®khˆ	~i»N[	y¨NhùzK®ŠøÒFö¶Vî8""Â&÷fW'f–Wrçv&æ–æræÖVÖ÷'•F—FÆR#¢$ÖVÖ÷'’K«®ŠëîXÚx«nh™ÈŠhZHŞj‚"Â&÷fW'f–Wrçv&æ–æræÖVÖ÷'•FW‡B#¢.[{.ZèŠ8RÖVÖ÷'ûÈÎKØnX[n[Ù>X˜ŞXZÎ[È†÷7BZY{ªniÊ®i«N™Ë.iÈiXy¨NK«®ŠëîXÚ[ÈX[>8.Šû~zîŠêBÖVÖ÷'’y¨BW'6öæVæ&ÆVBKùŞhÈX[>™zŞûÈÎKº^˜şXXŞ˜xŞZHŞy¨N‹ª¾K»ŞhÈ~KºN8""Â&÷fW'f–Wrçv&æ–æræÖ&¶F÷våF—FÆR#¢$Ö&¶F÷vâh©^[ÛKˆŞXúşyJ‚"Â&÷fW'f–Wrçv&æ–æræÖ&¶F÷våFW‡B#¢.{¸ş‹ø~j
š¨Îy¨B¥4ôâKúîŠê.x˜iÊÎK¸ŞxKniÈiX8.Šû~j8iú^hù.K»ni[hÚîyºî[Ù^[›nXhŞjÊKùŞZÙûÈÎKº^˜xŞikyIşh‰4õTÂæÖBKˆîš8îjÎih~K»n8""Â&F–væ÷7F–72ç7FvTæ÷FUFW‡B#¢$E4‚KÉ®YÊ{¸NŠ8^x	[ˆ>K˜¾Yîh.ZHŞ[{.k:XhÎy¨NZèÎi[Një^‰ŞûÈÎYºjÚNK¸^XzŞjë^‰ŞY¹î‹>izk9^ŠøiˆîiÈ{¸hùzK®ŠøŞXúşŠxh
~8%W'6öæKˆŞk:XhÎZèÎi[Një^‰ŞûÉ¾™šN™ÙîXù~KúK»¾y¨B†÷7Bj8iú^hª^Y®{¹>iéÎûÈÎY
nX‰iÈ{¸‚6V7F–öâX‰~ŠŠxnK‹®iÊ®š¨ÎŠø8""Â&F–væ÷7F–72æÆ–Ö—FF–öâæf–æÅf—6–&–Æ—G’#¢.[Ù>X[nK¹nš(NŠëîhùKé¾ZèÎi[Ny¨N{;¾{¹şhùzK®ŠøŞjë^‰Şi{nûÈÎiÈ{¸hùzK®ŠøŞXúşŠxh
~[	®iÊ®š¨ÎŠø8""Â&F–væ÷7F–72æÆ–Ö—FF–öâç66VæR#¢%hùX˜Ş{¹Zé®™ÈŠh[Ù>X˜Òv÷&·76Ry¨N[{.hèiØ>YË®išşûÉ¾Zéî™˜^k:XZ^‹ù™ÈŠhXù~KúK»¾y¨NKÉ®ŠùŞiŠ[N8""Â&F–væ÷7F–72æÆ–Ö—FF–öâçFö¶Vä6÷VçG2#¢%Fö¶VâŠêi[iŠşY
şXù[ÈşKËzé~ûÈÎ[›n™Ùî{+îzîXˆnŠøŞ{¹>iéÎ8""Â&6&–Æ—G’ç&Vv—7FW'5FööÇ2#¢.k:XhÎ[z^X[~ûÈ‡&Vv—7FW'5FööÇ>ûÈ’"Â&6&–Æ—G’æÖöF–f–W5FööÇ2#¢.KúîiK[z^X[~ûÈ†ÖöF–f–W5FööÇ>ûÈ’"Â&6&–Æ—G’ç6VÆV7G5&W6WB#¢.˜hºš(NŠëîûÈ‡6VÆV7G5&W6WNûÈ’"Â&6&–Æ—G’æÖöF–f–W5'VçF–ÖT6öçFW‡B#¢.KúîiK‹ùŠÎi{nKˆ®Kˆ¾ih~ûÈ†ÖöF–f–W5'VçF–ÖT6öçFW‡NûÈ’"Â&6&–Æ—G’ç&VG4ÖVÖ÷'’#¢.Šû¾XùbÖVÖ÷'ûÈ‡&VG4ÖVÖ÷'ûÈ’"Â&6&–Æ—G’ç&VG4Æ–fR#¢.Šû¾XùbÆ–f^ûÈ‡&VG4Æ–f^ûÈ’"Â&6&–Æ—G’ç&VG57FFR#¢.Šû¾Xùb7FF^ûÈ‡&VG57FF^ûÈ’"Â&6&–Æ—G’æ6†ævW5W&Ö—76–öç2#¢.i»NiK’iØ>™™ûÈ†6†ævW5W&Ö—76–öç>ûÈ’"Â&F–væ÷7F–72çG'W7FVE6W76–öç2#¢'¶6÷VçGÒKŠ®Xù~KúK»¾KÉ®ŠùÒ"Â&F–væ÷7F–72æ6öæf–wW&VE6V7F–öç2#¢.[{.˜XŞ{Úîjë^‰Ò"Â&F–væ÷7F–72æ†÷7DvÆö&Â#¢$†÷7BXZ[k:XhÂ"Â&F–væ÷7F–72æ6ÆÆ&6´Wf–FVæ6R#¢.Y¹î‹>ŠøhÚâ"Â&F–væ÷7F–72æödö'6W'fVB#¢.X[·F÷FÇÒjÊŠx.kX¾{¸NŠ8R"Â&F–væ÷7F–72æf–æÅf—6–&–Æ—G’#¢.iÈ{¸XúşŠxh
r"Â&F–væ÷7F–72æW‡Æ–6—D6†V6²#¢.i‹î[Èò†÷7B{¸NŠ8^j8iúR"Â&F–væ÷7F–72ææôf–æÄ6†V6²#¢.[	®iziÈ{¸‚†÷7Bj8iúR"Â&F–væ÷7F–72çf—6–&–Æ—G”ÖöFVÂ#¢.XúşŠxh
~jŠYè²"Â&F–væ÷7F–72ç&Vg&W6‚#¢.X‹~ikŠø®ijÒ"Â&F–væ÷7F–72æ6öæf–wW&VD&FvR#¢.[{.˜XŞ{Úâ"Â&F–væ÷7F–72æ6öæf–wW&VD&öG’#¢.hZ[ŞKŠNKŠ¢†÷7BXZ[jë^‰Şk:XhÎK‹¢Ç7â6Æ73ÕÂ&ÖöæõÂ#æ–çFW'öÆFS¢fÇ6SÂ÷7ãâKˆâÇ7â6Æ73ÕÂ&ÖöæõÂ#æ6ö×ÆWFS¢fÇ6SÂ÷7ãî8""Â&F–væ÷7F–72æ6ÆÆ&6´&FvR#¢.Y¹î‹2"Â&F–væ÷7F–72æ6ÆÆ&6´ö'6W'fVBæöæR#¢.[{.Šx.kX¾X‹jÊ{¸NŠ8^ˆ{>[	‹>yJK¨nKˆKŠ®jë^‰ŞY¹î‹>8""Â&F–væ÷7F–72æ6ÆÆ&6´ö'6W'fVBæ÷F†W"#¢.[{.Šx.kX¾X‹¶6÷VçGÒjÊ{¸NŠ8^ˆ{>[	‹>yJK¨nKˆKŠ®jë^‰ŞY¹î‹>8""Â&F–væ÷7F–72æ6ÆÆ&6´æöæR#¢.ˆz®hù.K»nhÈ.‹ÛŞKº^iÚ^[	®iÊ®Šx.kX¾X‹jë^‰ŞY¹î‹>8""Â&F–væ÷7F–72æ6ÆÆ&6´æ÷FR#¢.Y¹î‹>‹ùŠÎ[›nKˆŞŠøiˆîiÈ{¸hùzK®ŠøŞKùŞyYK¨nih~iÊÎ8""Â&F–væ÷7F–72æf–æÅ&ö×D&FvR#¢.iÈ{¸hùzK®ŠøÒ"Â&F–væ÷7F–72æ†÷7D6†V6²#¢$†÷7Bj8iú^ûÉ§·7FGW7Ş8""Â&F–væ÷7F–72çVçfW&–f–VD'”†÷7B#¢$†÷7B[	®iÊ®š¨ÎŠø8""Â&F–væ÷7F–72æf–æÅ&ö×D&öG’#¢.˜hºKˆKŠ®[{.Šx.kX¾y¨NkK¾XªKÉ®ŠùŞûÈÎ[›n‹ùŠÎi‹î[Èşy¨NiÈ{¸{¸NŠ8^j8iú^8$E4‚Xúşˆ;ŞYÊ{¸NŠ8^x	[ˆ>K˜¾Yîh.ZHŞh‰nŠhny¹një^‰Ş8""Â&F–væ÷7F–72ç7FvTæ÷FUF—FÆR#¢.™‹një^ŠûNiˆâ"Â&F–væ÷7F–72æö'6W'fVD76VÖ&Æ–W2#¢.[{.Šx.kX¾{¸NŠ8R"Â&F–væ÷7F–72ç6VÆV7E&÷r#¢.˜hºKˆŠÎiú^yÈ¾ˆKiXşŠúnh8R"Â&F–væ÷7F–72æV×G”6öæf–wW&VB#¢.iÊ®hª^Y®[{.˜XŞ{Úîjë^‰Ş8""Â&F–væ÷7F–72æV×G”ö'6W'fF–öç2#¢.ˆz®hù.K»nhÈ.‹ÛŞKº^iÚ^[	®iÊ®Šx.kX¾X‹jŠYè¾{¸NŠ8^8.‹ùKˆŞˆ;ŞŠøiˆîk:XZ^h‰X©şh‰nZK‹J^8""Â&F–væ÷7F–72ç6VÆV7FVDö'6W'fF–öâ#¢.h˜˜Šx.kX²"Â&F–væ÷7F–72æ6ÆÆ&6´ö'6W'fVD&FvR#¢.[{.Šx.kX¾Y¹î‹2"Â&F–væ÷7F–72ææô6ÆÆ&6´&FvR#¢.iÊ®Šx.kX¾Y¹î‹2"Â&F–væ÷7F–72æFWF–Äæ÷FR#¢.‹ùK©¾iŠşŠz>iéYšŠx.kX¾ûÈÎKˆŞiŠşiÈ{¸‚7—7FVÒ&ö×By¨N‹ÚÎX*8.Y¹î‹>Š*¾‹>yJXú®Šøiˆîjë^‰Şih~iÊÎX{Şi[‹ùŠÎ‹ø~ûÉ¾XúnKˆKŠ®š(NŠëîy¨NZèÎi[Një^‰ŞK¸ŞXúşˆ;Ş™¨şYîŠhny¹nZè>8""Â&F–væ÷7F–72ç&ö&T'WGFöâ#¢.j8iú^jÚNkK¾XªKÉ®ŠùŞy¨NiÈ{¸‚†÷7B{¸NŠ8R"Â&F–væ÷7F–72æf–æÄ6†V6²#¢.iÈ{¸j8iú^ûÉ§·7FGW7Ò+r·&V6öçÒ+rj[ø2¶6÷&WÒ+rš8îjÂ·7G–ÆWŞ8.KˆŞ‹ùNY¹îK»¾KÙ^hùzK®ŠøŞih~iÊÎ8""Â&F–væ÷7F–72çf—6–&ÆR#¢.XúşŠx"Â&F–væ÷7F–72æ'6VçB#¢.{Ë®ZK"Â&F–væ÷7F–72ææ÷DW‡V7FVB#¢.iÊ®š(NiÉò"Â&F–væ÷7F–72æ6&–Æ—G•F—FÆR#¢.iÈŞXªhª^Y®y¨Nˆ;ŞX©¾‹ëyXÂ"Â&F–væ÷7F–72æ6&–Æ—G”æ÷FR#¢.‹ùK©¾j~[ù~høş‹ûW'6öæk:XhÎK¨nK¸K˜ûÈÎKˆŞš¨ÎŠøiÈ{¸[z^X[~X‰~Šh‰njŠYè¾ŠÎK‹®8""Â&F–væ÷7F–72ææô6&–Æ—F–W2#¢.iÊ®hª^Y®ˆ;ŞX©²"Â&F–væ÷7F–72æÆ–Ö—FF–öç5F—FÆR#¢.[{.yú^™™X‹b"Â&F–væ÷7F–72ææôÆ–Ö—FF–öç2#¢.iÈŞXªiÊ®hª^Y®™™X‹n8""Â&F–væ÷7F–72æW'&÷%F—FÆR#¢.Šø®ijŞ™IŠúò"Â&F–væ÷7F–72ææõ&W6WB#¢.izš(NŠëâ"Â&F–væ÷7F–72çF&ÆRç6V7F–öâ#¢.jë^‰Ò"Â&F–væ÷7F–72çF&ÆRæ÷&FW"#¢.š®[¨ò"Â&F–væ÷7F–72çF&ÆRæ–çFW'öÆFR#¢.hù.XÂ"Â&F–væ÷7F–72çF&ÆRæ6ö×ÆWFR#¢.ZèÎi[B"Â&F–væ÷7F–72çF&ÆRç&Vv—7FW&VB#¢.[{.k:XhÂ"Â&F–væ÷7F–72çF&ÆRæö'6W'fVDB#¢.Šx.kX¾i{n™{B"Â&F–væ÷7F–72çF&ÆRç6W76–öâ#¢.KÉ®ŠùÒ"Â&F–væ÷7F–72çF&ÆRç6÷W&6TÖöFR#¢.iÚ^k©+rjŠ[Èò"Â&F–væ÷7F–72çF&ÆRæ6÷&T6ÆÆ&6²#¢.j[ø>Y¹î‹2"Â&F–væ÷7F–72çF&ÆRç66VæT6ÆÆ&6²#¢.YË®išşY¹î‹2"Â&F–væ÷7F–72çF&ÆRç&V6öâ#¢.XéşYº"Â&F–væ÷7F–72æFWF–Âæö'6W'fVDB#¢.Šx.kX¾i{n™{B"Â&F–væ÷7F–72æFWF–Âç6W76–öâ#¢.KÉ®ŠùÒ"Â&F–væ÷7F–72æFWF–ÂævVçE&W6WB#¢$vVçBš(NŠëâ"Â&F–væ÷7F–72æFWF–Âçv÷&·76R#¢%v÷&·76R"Â&F–væ÷7F–72æFWF–ÂçÖ–ær#¢%iŠ[B"Â&F–væ÷7F–72æFWF–Âç6÷W&6R#¢.iÚ^k©"Â&F–væ÷7F–72æFWF–Âæ&–æF–æt¶W’#¢.{¹Zé®™Jâ"Â&F–væ÷7F–72æFWF–ÂæÖöFU7G–ÆR#¢.jŠ[Èò+rš8îjÂ"Â&F–væ÷7F–72æFWF–Âæ6÷&T6ÆÆ&6²#¢.j[ø>Y¹î‹2"Â&F–væ÷7F–72æFWF–Âç66VæT6ÆÆ&6²#¢.YË®išşY¹î‹2"Â&F–væ÷7F–72æFWF–Âæ6÷&T–æ¦V7FVB#¢.[{.k:XZ^˜XŞ{Úîy¨Nj[ø2"Â&F–væ÷7F–72æFWF–Âç7G–ÆT–æ¦V7FVB#¢.[{.k:XZ^˜XŞ{Úîy¨Nš8îjÂ"Â&F–væ÷7F–72æFWF–Âç&W6öÇWF–öå&V6öâ#¢.Šz>iéXéşYº"Â&F–væ÷7F–72æFWF–Âç7FFU&Wf—6–öâ#¢.x«nhKúîŠê.x˜iÊÂ"Â&F–væ÷7F–72æ–çfö¶VB#¢.[{.‹>yJ‚"Â&F–væ÷7F–72ææ÷Dö'6W'fVB#¢.iÊ®Šx.kX²"Â&F–væ÷7F–72ç7FGW2çVçfW&–f–VB#¢.iÊ®š¨ÎŠøûÈ‡VçfW&–f–VNûÈ’"Â&F–væ÷7F–72ç7FGW2çf—6–&ÆR#¢.XúşŠxûÈ‡f—6–&Æ^ûÈ’"Â&F–væ÷7F–72ç7FGW2æ÷fW'&–FFVâ#¢.Š*¾Šhny¹nûÈ†÷fW'&–FFVîûÈ’"Â&F–væ÷7F–72ç7FGW2çVæf–Æ&ÆR#¢.KˆŞXúşyJûÈ‡Væf–Æ&Æ^ûÈ’"Â&F–væ÷7F–72æÖöFRææöæR#¢.izûÈ†æöæ^ûÈ’"Â&F–væ÷7F–72æÖöFRæ–æ†W&—B#¢.{º~h›şûÈ†–æ†W&—NûÈ’"Â&F–væ÷7F–72æÖöFRæ6÷&RÖöæÇ’#¢.K¸^j[ø>ûÈ†6÷&RÖöæÇûÈ’"Â&F–væ÷7F–72æÖöFRç7G–ÆR#¢.š8îjÎûÈ‡7G–Æ^ûÈ’"Â&F–væ÷7F–72ç6÷W&6RææöæR#¢.izûÈ†æöæ^ûÈ’"Â&F–væ÷7F–72ç6÷W&6RçÖ&–æF–ær#¢%{¹Zé®ûÈ‡Ö&–æF–æ~ûÈ’"Â&F–væ÷7F–72ç6÷W&6Rç6W76–öâÖ&–æF–ær#¢.KÉ®ŠùŞ{¹Zé®ûÈ‡6W76–öâÖ&–æF–æ~ûÈ’"Â&F–væ÷7F–72ç6÷W&6Rçv÷&·76RÖFVfVÇB#¢%v÷&·76R›¹ŠêNûÈ‡v÷&·76RÖFVfVÇNûÈ’"Â&F–væ÷7F–72ç7FFRçfW&–f–VB#¢.[{.š¨ÎŠøûÈ‡fW&–f–VNûÈ’"Â&F–væ÷7F–72ç7FFRæ–çfÆ–B#¢.iziXûÈ†–çfÆ–NûÈ’"Â&F–væ÷7F–72ç7FFRçVæf–Æ&ÆR#¢.KˆŞXúşyJûÈ‡Væf–Æ&Æ^ûÈ’"Â&F–væ÷7F–72ç7FFRææ÷Eö6†V6¶VB#¢.iÊ®j8iú^ûÈ†æ÷Eö6†V6¶VNûÈ’"Â&ÆöF–æræW–V'&÷r#¢.h˜iÈˆ^ŠêNŠøyXÎ™Ú""Â&ÆöF–ærçF—FÆR#¢.jÚ>YÊXª‹ÛÒW'6öæx«nh(
n(
b"Â&ÆöF–æræ&öG’#¢.jÚ>YÊK¸â†÷7BŠû¾Xùbv÷&·76Rk:XhÎŠ8XÚx˜~8{¹Zé®8Šø®ijŞKˆîZH~K»ŞXX>i[hÚî8.kXşŠxYšKˆŞKÉ®ZÙX*K»¾KÙ^Xh^Zë8""Â'Væf–Æ&ÆRçF—FÆR#¢%W'6öæi[hÚîKˆŞXúşyJ‚"Â'Væf–Æ&ÆRæ&öG’#¢.hê~X‹nXûizk9^Xª‹ÛÒ†÷7B8.Šû~j8iúRE4‚÷væW"XxnXZ^KˆîZÙX*X^[«~x«nhYî˜xŞŠù^8""Â'Væf–Æ&ÆRç&WG'’#¢.˜xŞŠùR"Â&&ææW"æ÷væW%&WV—&VEF—FÆR#¢.™ÈŠhh˜iÈˆ^Šëş™zîiØ>™™8""Â&&ææW"æ÷væW%&WV—&VD&öG’#¢.hê~X‹nXûiÊ®˜	®‹ørE4‚÷væW"XxnXZ^8.Xú®Šû¾i[hÚîXúşˆ;Ş[{.‹ø~iÉşûÉ¾YÊK¸î[{.ŠêNŠøy¨BE4‚š^™Ú.h™>[Èhê~X‹nXûK˜¾X˜ŞûÈÎXiXZ^KÉ®Š*¾zhyJ8""Â&&ææW"æ†÷7Df–ÆVEF—FÆR#¢$†÷7BŠû~k.ZK‹J^8""Â&&ææW"æ6öæfÆ–7EF—FÆR#¢$†÷7BKúîŠê.x˜iÊÎ[{.XùXÉnûÈƒCûÈ8""Â&&ææW"æ6öæfÆ–7E&Wf—6–öâ#¢.[Ù>X˜Ò†÷7BKúîŠê.x˜iÊÎûÉ£Ç7â6Æ73ÕÂ&ÖöæõÂ#ç'·&Wf—6–öçÓÂ÷7ãî8""Â&&ææW"æ6öæfÆ–7D¶VWG&gB#¢.KÚy¨NˆØz‹şK¸ŞKùŞyYYÊ[Ù>X˜Şj~zÛîš^8""Â&&ææW"æ¶VWG&gB#¢.˜xŞikXª‹ÛŞiÈiki[hÚîûÈÎKùŞyYˆØz‹ò"Â&&ææW"ç&VÆöB#¢.˜xŞikXª‹ÛŞiÈiki[hÚâ"Â&&ææW"ç&VÆöD†÷7B#¢.˜xŞikXª‹ÛÒ†÷7Bi[hÚâ"Â&&ææW"æF—66&DG&gB#¢.[›niKî[È>ˆØz‹ò"Â&&ææW"æF—6Ö—72#¢.[ûŞyZR"Â&F–Æöræ6Æ÷6R#¢.X[>™zÒ"Â&F–Æöræ6æ6VÂ#¢.Xùnkh‚"Â&F–ÆöræFVÆWFU7G–ÆR#¢.XŠ™šNš8îjÂ"Â&F–Æörç&VÖ÷fT&–æF–ær#¢.z{¾™šN{¹Zé¢"Â&F–Æörç&W7F÷&T&6·W#¢.h.ZHŞZH~K»Ò"Â&F–Æörç&öÆÄ&6²#¢.Y¹îk¹¢"Â&F–Æörç&W7F÷&R#¢.h.ZHŞZH~K»Ò"Â&ÖöFÂçfW'6–öä†—7F÷'’#¢.x˜iÊÎXènXû""Â&ÖöFÂçfW'6–öä†—7F÷'”&öG’#¢.Y¹îk¹®KÉ®X‰¾[»®KˆKŠ®ikKúîŠê.x˜iÊÎ8.[Ù>X˜Şx˜iÊÎKÉ®KùŞyYYÊXènXû.KŠŞûÈÎYºjÚNŠú^i8ŞKÙÎXúş˜n8""Â&ÖöFÂææõ&–÷%fW'6–öç2#¢.jÚNXÚx˜~[	®iz[{.KùŞZÙy¨NXènXû.x˜iÊÎ8""Â&ÖöFÂæ†—7F÷'”VçG'’#¢'¶7F–öçÒ+r'·&Wf—6–öçÒ"Â&ÖöFÂæ†—7F÷'”ÖWF#¢'¶FFWÒ+rXÚx˜~KúîŠê.x˜iÊÂ·&Wf—6–öçÒ"Â&ÖöFÂæFVÆWFU7G–ÆUF—FÆR#¢.XŠ™šN(	Ç¶æÖWŞ(	ŞûÉò"Â&ÖöFÂæFVÆWFU7G–ÆT&öG’#¢.‹ùKÉ®kK˜^XŠ™šNŠú^š8îjÎXÚ8'¶ffV7FVG×¶FVfVÇDæ÷FWŞxëiÈKÉ®ŠùŞ8vVçBš(NŠëî8[z^X[~KˆîiØ>™™YØ~KˆŞKÉ®Š*¾i»NiK8""Â&ÖöFÂæFVÆWFU7G–ÆTæôffV7FVB#¢.[Ù>X˜Şk*iÈi‹î[Èşš8îjÎ{¹Zé®[É^yJZè>8""Â&ÖöFÂæFVÆWFU7G–ÆTffV7FVBæöæR#¢#KŠ®i‹î[Èş{¹Zé®[nY¹î˜X‹{º~h›ş8""Â&ÖöFÂæFVÆWFU7G–ÆTffV7FVBæ÷F†W"#¢'¶6÷VçGÒKŠ®i‹î[Èş{¹Zé®[nY¹î˜X‹{º~h›ş8""Â&ÖöFÂæFVÆWFU7G–ÆTFVfVÇB#¢.Zè>YÎi{nK™şiŠòv÷&·76R›¹ŠêNš8îjÎûÈÎYºjÚN›¹ŠêN[n˜xŞ{ÚîK‹®K¸^j[ø>K«®Šëî8""Â&ÖöFÂç&VÖ÷fT&–æF–æuF—FÆR#¢.z{¾™šNjÚNi‹î[Èş{¹Zé®ûÉò"Â&ÖöFÂç&VÖ÷fT&–æF–æt&öG’#¢.Šú^yºîj~[nY¹î˜X‹v÷&·76R›¹ŠêNûÈ‡¶FVfVÇE7G–ÆWŞûÈûÈÎˆÎKˆŞiŠşX[ni‹î[Èş(	Ç¶ÖöFWŞ(	ŞŠëî{Úî8.KÉ®ŠùŞ8ŠêNŠø8[z^X[~KˆîiØ>™™YØ~KˆŞXù~[ÛY8Ş8""Â&ÖöFÂç&W7F÷&T&öG’#¢.h.ZHŞKúîŠê.x˜iÊÂ·&Wf—6–öçŞûÈ‡¶FFWŞûÈhÙ^ˆë~y¨N˜XŞ{ÚîûÉş[Ù>X˜Ş˜XŞ{Úî[nŠ*¾i»şhÚ.ûÈÎKØnKÉ®XXXiXZ^KˆK»Şh.ZHŞX˜ŞZèXZZH~K»Ş8.KˆŞKÉ®i»NiKK»¾KÙRE4‚KÉ®ŠùŞ8vVçBš(NŠëî8[z^X[~h‰niØ>™™8""Â&ÖöFÂçG—U&W7F÷&R#¢.‹é>XZR$U5Dõ$RKº^zîŠêB"Â&ÖöFÂç&W7F÷&UÆ6V†öÆFW"#¢%$U5Dõ$R"Â'Fö7Bæ6ææ÷E6fR#¢.izk9^KùŞZÙ‚"Â'Fö7BçW'6öæ6fVB#¢%W'6öæ[{.KùŞZÙ‚"Â'Fö7BçW'6öæ6fVDFWF–Â#¢.i»NiK[nYÊKˆ¾jÊjŠYè¾{¸NŠ8^i{nyIşiXûÉ¾KˆŞKÉ®˜xŞ[»®KÉ®ŠùŞ8""Â'Fö7BæG&gDF—66&FVB#¢.ˆØz‹ş[{.iKî[È2"Â'Fö7BæG&gDF—66&FVDFWF–Â#¢.{Én‹éYšxëYÊi‹îzK¢†÷7Bx˜iÊÎ8""Â'Fö7Bç7G–ÆT6÷–VB#¢.š8îjÎ[{.ZHŞX‹b"Â'Fö7Bç7G–ÆT6÷–VDFWF–Â#¢.XšşiÊÎiŠşiky¨Nz‹>Zé®XÚx˜~8.xëiÈ{¹Zé®K¸Ş[É^yJXéşš8îjÎ8""Â'Fö7Bç7G–ÆTFVÆWFVB#¢.š8îjÎ[{.XŠ™šB"Â'Fö7Bç7G–ÆTFVÆWFVDFWF–ÂæöæR#¢#KŠ®{¹Zé®[{.Y¹î˜X‹{º~h›÷¶FVfVÇE&W6WGŞ8""Â'Fö7Bç7G–ÆTFVÆWFVDFWF–Âæ÷F†W"#¢'¶6÷VçGÒKŠ®{¹Zé®[{.Y¹î˜X‹{º~h›÷¶FVfVÇE&W6WGŞ8""Â'Fö7BæFVfVÇE&W6WE7Vff—‚#¢.ûÉ¾›¹ŠêNš8îjÎ[{.˜xŞ{ÚîK‹®K¸^j[ø>K«®Šëâ"Â'Fö7Bç&öÆÆ&6´6öÖÖ—GFVB#¢.Y¹îk¹®[{.hùKªB"Â'Fö7Bç&öÆÆ&6´6öÖÖ—GFVDFWF–Â#¢.[{.h.ZHŞy¨NXÚx˜~iŠşKˆKŠ®ikKúîŠê.x˜iÊÎûÉ¾jÚNX˜ŞXènXû.K¸ŞKùŞyY8""Â'Fö7Bæ&–æF–æu6fVB#¢.{¹Zé®[{.KùŞZÙ‚"Â'Fö7Bæ&–æF–æu6fVDFWF–Â#¢$†÷7B[{.jhÚî[Ù>X˜Şh‰YX[>{;¾KˆîKúK»¾x«nh˜xŞikš¨ÎŠøyºîj~8""Â'Fö7Bæ&–æF–æu&VÖ÷fVB#¢.{¹Zé®[{.z{¾™šB"Â'Fö7Bæ&–æF–æu&VÖ÷fVDFWF–Â#¢.Šú^yºîj~xëYÊ{º~h›òv÷&·76R›¹ŠêN8""Â'Fö7Bæ6ææ÷E6fT&–æF–ær#¢.izk9^KùŞZÙ{¹Zé¢"Â'Fö7Bç7V&vVçDW†6ÇVFVB#¢.ZÙKº>ynKÉ®ŠùŞŠ*¾hé.™šNYÊ‚W'6öæK˜¾ZIn8""Â'Fö7Bææõv÷&·76R#¢.iÊ®{¹Zé¢v÷&·76R"Â'Fö7Bæ&–æEv÷&·76Tf—'7B#¢.Šû~XX{¹Zé¢v÷&·76RXhŞKùŞZÙ{¹Zé®8""Â'Fö7Bç6VÆV7E7G–ÆR#¢.Šû~˜hºš8îjÂ"Â'Fö7Bç6VÆV7E7G–ÆTFWF–Â#¢.š8îjÎ{¹Zé®™ÈŠhKˆ[ÊxëiÈš8îjÎXÚ8""Â'Fö7Bç&W6WDG&gB#¢.ˆØz‹ş[{.˜xŞ{Úâ"Â'Fö7Bç&W6WDG&gDFWF–Â#¢.ˆØz‹şxëYÊ{º~h›òv÷&·76R›¹ŠêN8.KùŞZÙ{¹Zé®Kº^hùKªN8""Â'Fö7Bçv÷&·76UWFFVB#¢%v÷&·76R[{.i»Nik"Â'Fö7Bçv÷&·76UWFFVDFWF–Â#¢.iz~{¹Zé®[{.[Ù.j2¶6÷VçGÒš8.ZH~K»ŞûÉ§¶&6·WŞ8.j[ø>Kˆîš8îjÎXÚKùŞyY8""Â'Fö7BæFVfVÇE7G–ÆUWFFVB#¢.›¹ŠêNš8îjÎ[{.i»Nik"Â'Fö7BæFVfVÇE7G–ÆUWFFVDFWF–Â#¢.i‹î[Èş˜hºš8îjÎy¨Nyºîj~KˆŞXù~[ÛY8Ş8""Â'Fö7Bæ–æ¦V7F–öäVæ&ÆVB#¢.k:XZ^[{.Y
şyJ‚"Â'Fö7Bæ–æ¦V7F–öäF—6&ÆVB#¢.k:XZ^[{.zhyJ‚"Â'Fö7Bæ–æ¦V7F–öäFWF–Â#¢.i»NiK[nYÊKˆ¾jÊjŠYè¾{¸NŠ8^i{nyIşiXûÉ¾KˆŞKÉ®˜xŞ[»®KÉ®ŠùŞ8""Â'Fö7Bæ&6·W7&VFVB#¢.ZH~K»Ş[{.X‰¾[»¢"Â'Fö7Bæ&6·W7&VFVDFWF–Â#¢.ZH~K»Ò¶–GÒ[{.hÙ^ˆë~KúîŠê.x˜iÊÂ·&Wf—6–öçŞ8""Â'Fö7Bæ&6·W7&VFVDfÆÆ&6²#¢$†÷7B[{.XiXZ^KˆK»Ş{¸ş‹ø~j
š¨Îy¨NZH~K»Ş8""Â'Fö7Bæ&6·W&W7F÷&VB#¢.ZH~K»Ş[{.h.ZHÒ"Â'Fö7Bæ&6·W&W7F÷&VDFWF–Â#¢.[{.XXXiXZ^h.ZHŞX˜ŞZèXZZH~K»ŞûÉ¾XènXû.Šë[Ù^[{.KùŞyY8""Â'Fö7Bæ†÷7E&Vg&W6†VB#¢$†÷7Bi[hÚî[{.X‹~ik"Â'Fö7BæG&gD¶WB#¢.iÊ®KùŞZÙy¨NˆØz‹ş[{.KùŞyY8""Â'Fö7BæÆFW7DÆöFVB#¢.iÈik†÷7Bi[hÚî[{.Xª‹ÛÒ"Â'Fö7BæG&gD¶WE&Wf–Wr#¢.ˆØz‹ş[{.KùŞyY8.Šû~j8iú^YîXhŞKùŞZÙ8""Â'Fö7Bæ6öæfÆ–7DG&gG4F—66&FVB#¢.iÊ®KùŞZÙy¨NXk.z¨ˆØz‹ş[{.KŠ.[È>8""Â'Fö7Bç7G–ÆTæ÷Df÷VæB#¢.iÊ®h›îX‹š8îjÂ"Â'Fö7Bç7G–ÆTæ÷Df÷VæDFWF–Â#¢.˜xŞikXª‹ÛŞK«®Šëî[©>Yî˜xŞŠù^8""Â'Fö7BçF&vWEVæf–Æ&ÆR#¢.yºîj~KˆŞXúşyJ‚"Â'Fö7BçF&vWEVæf–Æ&ÆTFWF–Â#¢.X‹~ik†÷7Bi[hÚîYî˜xŞŠù^8""Â'Fö7Bçv÷&·76UVæf–Æ&ÆR#¢%v÷&·76RKˆŞXúşyJ‚"Â'Fö7Bçv÷&·76UVæf–Æ&ÆTFWF–Â#¢.X‹~ikv÷&·76RX‰~Š[›n˜hºKˆKŠ®[Ù>X˜Òv÷&·76^8""Â'Fö7Bææô6†ævR#¢.izi»NiK’"Â'Fö7Bææô6†ævTFWF–Â#¢.ŠúRv÷&·76R[{.{¹Zé®8""Â'Fö7Bç7G–ÆUVæf–Æ&ÆR#¢.š8îjÎKˆŞXúşyJ‚"Â'Fö7Bç7G–ÆUVæf–Æ&ÆTFWF–Â#¢.Šû~˜hºKˆKŠ®xëiÈš8îjÎ8""Â'Fö7Bæ6öæf—&ÖF–öå&WV—&VB#¢.™ÈŠhzîŠêB"Â'Fö7Bæ6öæf—&ÖF–öå&WV—&VDFWF–Â#¢.Šû~Xxnzî‹é>XZR$U5Dõ$RKº^h.ZHŞZH~K»Ş8""Â'Fö7Bæf–æÄ6†V6µVæf–Æ&ÆR#¢.iÈ{¸j8iú^KˆŞXúşyJ‚"Â'Fö7Bæ†÷7D6†V6´f–ÆVB#¢$†÷7Bj8iú^ZK‹J^8""Â'Fö7Bæ&6·Wæ÷Df÷VæB#¢.iÊ®h›îX‹ZH~K»Ò"Â'Fö7Bæ&6·Wæ÷Df÷VæDFWF–Â#¢.X‹~ikZH~K»ŞX‰~ŠYî˜xŞŠù^8""Â'Fö7BæF—66&DVF—F÷$6öæf—&Ò#¢.iKî[È>iÊ®KùŞZÙy¨NˆØz‹ş[›nK¸â†÷7B˜xŞikXª‹ÛŞjÚNXÚx˜~ûÉò"Â'Fö7BæF—66&D6&D6öæf—&Ò#¢.iKî[È>iÊ®KùŞZÙy¨NK«®ŠëîˆØz‹şûÉò"Â'Fö7BæF—66&DæWu7G–ÆT6öæf—&Ò#¢.iKî[È>[Ù>X˜ŞiÊ®KùŞZÙy¨NK«®ŠëîˆØz‹ş[›nik[»®š8îjÎûÉò"Â'Fö7BæF—66&D&–æF–æt6öæf—&Ò#¢.iKî[È>iÊ®KùŞZÙy¨N{¹Zé®ˆØz‹şûÉò"Â'Fö7BæÆVfTVF—F÷$6öæf—&Ò#¢.K«®Šëî{Én‹éYšiÈiÊ®KùŞZÙy¨Ni»NiK8.zk¾[È[›nYÊ[Ù>X˜Şj~zÛîš^KùŞyYˆØz‹şûÉò"Â'Fö7BæÆVfT&–æF–æt6öæf—&Ò#¢.{¹Zé®iÈiÊ®KùŞZÙy¨Ni»NiK8.zk¾[È[›nYÊ[Ù>X˜Şj~zÛîš^KùŞyYˆØz‹şûÉò"Â'Fö7Bæ6÷•6fVDöæÇ’#¢.ZHŞX‹nKÛşyJiÈYîKùŞZÙy¨Nx˜iÊÎûÈÎˆÎ™ÙîiÊ®KùŞZÙy¨N{Én‹é8.{º~{ºŞûÉò"Â'Fö7BæFVÆWFU6fVDöæÇ’#¢.[nXŠ™šN[{.KùŞZÙy¨Nš8îjÎûÉ¾{Én‹éYšKŠŞiÊ®KùŞZÙy¨NˆØz‹şih~iÊÎKˆŞKÉ®XÈ^Y
¾YÊXh^8.{º~{ºŞûÉò"Â'Fö7Bç&öÆÆ&6´6öæf—&Ò#¢.[njÚNXÚx˜~Y¹îk¹®X‹h˜˜XènXû.x˜iÊÎûÉş[nX‰¾[»®ikKúîŠê.x˜iÊÎûÈÎ[Ù>X˜Şx˜iÊÎK¸ŞKùŞyYYÊXènXû.KŠŞ8""Â'Fö7Bæ&–æEv÷&·76T6öæf—&Ò#¢.Xˆ~hÚ.X‹·v÷&·76WŞûÉşizrv÷&·76R[nXÎjÚ.k:XZ^ûÉ·¶6÷VçGÒšiz~{¹Zé®KÉ®XXˆz®XªZH~K»Ş8XhŞK¸îkK¾‹x>˜XŞ{Úîkˆ^z›®8.ikv÷&·76RKˆ¾jÊjŠYè¾{¸NŠ8^yIşiX8.KˆŞKÉ®XŠ™šNKÉ®ŠùŞ8""Â&W'&÷"æWF‚#¢.iÊ®˜	®‹ø~h˜iÈˆ^ŠêNŠø8.Šû~K¸î[{.ŠêNŠøy¨BE4‚Šëî{Úîš^™Ú.h™>[ÈjÚNhê~X‹nXû8""Â&W'&÷"çVæf–Æ&ÆR#¢%W'6öæzêyniÈŞXªKˆŞXúşyJ8.Šû~j8iúRE4‚6öææV7F–öâiÈŞXªKˆîZÙX*X^[«~x«nh8""Â&W'&÷"æ6öæfÆ–7B#¢.XúnKˆKŠ®[{.ŠêNŠøz©~Xú>i»NiKK¨bW'6öæ8.Šû~XX˜xŞikXª‹ÛŞiÈikKúîŠê.x˜iÊÎXhŞ˜xŞŠù^8""Â&W'&÷"ææ÷Df÷VæB#¢.iÊ®h›îX‹Šû~k.y¨BW'6öæšyºî8""Â&W'&÷"ææWGv÷&²#¢.hê~X‹nXûizk9^‹ùîhêRE4‚†÷7B8""Â&W'&÷"ævVæW&–2#¢%W'6öæŠû~k.ZK‹J^8""Â&W'&÷"æ–çfÆ–B#¢.Šû~k.iÊ®˜	®‹ør†÷7Bj
š¨Î8.Šû~j8iú^‹é>XZ^Yî˜xŞŠù^8""Â&W'&÷"ç7F÷&vR#¢%W'6öæZÙX*KˆŞXúşyJ8.k:XZ^KÉ®ZK‹J^X[>™zŞ8""Â&W'&÷"æÖWF†öB#¢.Šú^i8ŞKÙÎKˆŞŠ*¾XXŠë8""Â&W'&÷"æVæGö–çB#¢.Šû~k.y¨BW'6öæzºşx+KˆŞZÙYÊ8""Â&W'&÷"çVç&VF&ÆR#¢$†÷7B‹ùNY¹îK¨nizk9^Šû¾Xùny¨NY8Ş[©NûÈ„…EE·7FGW7ŞûÈ8""Â&W'&÷"ç&WVW7Df–ÆVB#¢.Šû~k.ZK‹J^ûÈ„…EE·7FGW7ŞûÈ8""Â&W'&÷"æ6öFU7Vff—‚#¢.ûÈ™IŠúşKº>z¶6öFWŞûÈ’"Â&W'&÷"æ6öFRåU%4ôäôUD…õ$UT•$TB#¢.iÊ®˜	®‹ø~h˜iÈˆ^ŠêNŠø8.Šû~K¸î[{.ŠêNŠøy¨BE4‚Šëî{Úîš^™Ú.h™>[ÈjÚNhê~X‹nXû8""Â&W'&÷"æ6öFRåU%4ôäôÔätTÔTåEõTäd”Ä$ÄR#¢%W'6öæzêyniÈŞXªKˆŞXúşyJ8.Šû~j8iúRE4‚6öææV7F–öâiÈŞXª8""Â&W'&÷"æ6öFRåU%4ôäô4ôädÄ”5B#¢.XúnKˆKŠ®[{.ŠêNŠøz©~Xú>i»NiKK¨bW'6öæ8.Šû~XX˜xŞikXª‹ÛŞiÈikKúîŠê.x˜iÊÎXhŞ˜xŞŠù^8""Â&W'&÷"æ6öFRåU%4ôäôäõEôdõTäB#¢.iÊ®h›îX‹Šû~k.y¨BW'6öæšyºî8""Â&W'&÷"æ6öFRåU%4ôäô”ådÄ”B#¢.Šû~k.iÊ®˜	®‹ør†÷7Bj
š¨Î8.Šû~j8iú^‹é>XZ^Yî˜xŞŠù^8""Â&W'&÷"æ6öFRåU%4ôäõ5Dõ$tUõTäd”Ä$ÄR#¢%W'6öæZÙX*KˆŞXúşyJ8.k:XZ^KÉ®ZK‹J^X[>™zŞ8""Â&W'&÷"æ6öFRåU%4ôäô”åDU$äÂ#¢$†÷7BZHNybW'6öæŠû~k.i{nX{®xëXh^˜:™IŠúş8.Šû~j8iúR†÷7Biz^[ù~8""Â&W'&÷"æ6öFRåU%4ôäôTäEô”åEõTä´äõtâ#¢.Šû~k.y¨BW'6öæzºşx+KˆŞZÙYÊ8""Â&W'&÷"æ6öFRåU%4ôäôÔUD„ôEôäõEôÄÄõtTB#¢.Šú^i8ŞKÙÎKˆŞŠ*¾XXŠë8""Â&W'&÷"æ6öFRåU%4ôäõtõ$µ54UõTäd”Ä$ÄR#¢%v÷&·76Rk:XhÎŠKˆŞXúşyJ8.Šû~j8iúRE4‚†÷7N8""Â&W'&÷"æ6öFRåU%4ôäõõTäd”Ä$ÄR#¢%†÷7BiŠ[NKˆŞXúşyJ8.Šû~j8iúRhù.K»n8""Â'fÆ–FFRææô6&B#¢.iÊ®˜hºXÚx˜~8""Â'fÆ–FFRç7G–ÆTæÖU&WV—&VB#¢.š8îjÎYŞz{K‹®[ø^Z¾š8""Â'fÆ–FFRç7G–ÆTæÖUFöôÆöær#¢.š8îjÎYŞz{‹ø~™[ş8""Â'fÆ–FFRç7G–ÆTFW67&—F–öåFöôÆöær#¢.š8îjÎhøş‹û‹ø~™[ş8""Â'fÆ–FFRç7G–ÆT&öG•&WV—&VB#¢.š8îjÎjÚ>ih~K‹®[ø^Z¾š8""Â'fÆ–FFRç7G–ÆT&öG•FöôÆöær#¢.š8îjÎjÚ>ih~‹h^‹ør†÷7BKˆ®™™8""Â'fÆ–FFRæ6öÆ÷"#¢.š)Îˆ›.[ø^š¾iŠò7'&vv&"jÎ[Èş8""Â'fÆ–FFRæ6÷&T&öG•FöôÆöær#¢.j[ø>K«®ŠëîjÚ>ih~‹h^‹ør†÷7BKˆ®™™8""Â'æVÂç6V7F–öäÆ&VÂ#¢$ÖFWW2K«®Šëâ"Â'æVÂçF—FÆR#¢$ÖFWW2K«®Šëâ"Â'æVÂæFW67&—F–öâ#¢.ZÙX*X^[«~x«nhKˆâv÷&·76RK¸î[{.ŠêNŠøy¨B†÷7B’Šû¾Xùn8.{Én‹éXú®ˆ;ŞYÊh˜iÈˆ^K‰>[îy¨BvV"hê~X‹nXûKŠŞ‹ù¾ŠÎ8""Â'æVÂç7F÷&vT†VÇF‚#¢.ZÙX*X^[«r"Â'æVÂæ&÷VæEv÷&·76R#¢.[{.{¹Zé¢v÷&·76R"Â'æVÂæ6†V6¶–ær#¢.jÚ>YÊj8iú^(
n(
b"Â'æVÂç7F÷&vT†VÇF‡’#¢.jÚ>[‹‚+rKúîŠê.x˜iÊÂ·&Wf—6–öçÒ"Â'æVÂç7F÷&vT–çfÆ–B#¢.ZÙX*iziX‚+rk:XZ^KÉ®ZK‹J^X[>™zÒ"Â'æVÂç7F÷&vUVæf–Æ&ÆR#¢.ZÙX*KˆŞXúşyJ‚+rk:XZ^KÉ®ZK‹J^X[>™zÒ"Â'æVÂçv÷&·76UfÇVRæöæR#¢'·F—FÆWÒ+rKŠ®KÉ®ŠùÒ"Â'æVÂçv÷&·76UfÇVRæ÷F†W"#¢'·F—FÆWÒ+r¶6÷VçGÒKŠ®KÉ®ŠùÒ"Â'æVÂææ÷D&÷VæB#¢.iÊ®{¹Zé¢+rKˆŞk:XZRW'6öæ"Â'æVÂæ÷Vä6öç6öÆR#¢.h™>[ÈW'6öæhê~X‹nXû"Â'æVÂææ÷FR#¢.™ÈŠhYÎk©Šëş™zîKˆâE4‚÷væW"XxnXZ^8.jÚN™Ú.iÛş{¹ŞKˆŞKÉ®YÊkXşŠxYšKŠŞZÙX*‚W'6öæi[hÚî8""Â'æVÂæÆæwVvR#¢.yXÎ™Ú.ŠúŞŠˆ"Â'æVÂæW'&÷"çVç&VF&ÆR#¢$†÷7B‹ùNY¹îK¨nizk9^Šû¾Xùny¨NY8Ş[©NûÈ„…EE·7FGW7ŞûÈ8""Â'æVÂæW'&÷"æWF‚#¢.Šû~j8iúRE4‚÷væW"ŠêNŠøûÈÎ[›nK¸î[{.ŠêNŠøy¨NŠëî{Úîš^™Ú.h™>[Èhê~X‹nXû8""Â'æVÂæW'&÷"çVæf–Æ&ÆR#¢$†÷7Bx«nhKˆŞXúşyJûÈ„…EE·7FGW7ŞûÈ8""Â'æVÂæW'&÷"ævVæW&–2#¢%W'6öæx«nhKˆŞXúşyJ8"'ÒÂ&VâÕU2#§²&çF—FÆR#¢$ÖFWW2W'6öæ+r÷væW"6öç6öÆR"Â&æ'&æEW'6öæ#¢%W'6öæ"Â&æ'&æE7V'F—FÆR#¢%6ÖR6÷&R+rÖç’W‡&W76–öç2"Â&æW–V'&÷r#¢$ÔDUU2+rõtäU"4ôå4ôÄR"Â&ææd6F–öâ#¢%U%4ôä+rõtäU"4ôå4ôÄR"Â&ææd&–#¢$Ö–âæf–vF–öâ"Â&æ÷væW$WF†VçF–6FVB#¢$÷væW"ÖWF†VçF–6FVB+ræò'&÷w6W"×6–FRW'6öæ7FFR"Â&æfö÷FW"#¢$ÖFWW2W'6öæcã"+r†÷7B¥4ôâ’öæÇ’+rf–æÂ&ö×Bf—6–&–Æ—G’—2VçfW&–f–VB"Â&æ†÷7E7FGW2#¢$„õ5B5DEU2"Â&çv÷&·76R#¢%v÷&·76R"Â&æ–æ¦V7F–öâ#¢$–æ¦V7F–öâ"Â&ç&Wf—6–öâ#¢%&Wf—6–öâ"Â&æ6÷&TæE7G–ÆTæW‡B#¢$6÷&RæB7G–ÆR6†ævW2Ç’BF†RæW‡BÖöFVÂ76VÖ&Ç’â"Â&ææõv÷&·76T–æ¦V7G4æ÷F†–ær#¢$æòv÷&·76R—2&÷VæBÂ6òW'6öæ–æ¦V7G2æ÷F†–ærâ"Â&ææõv÷&·76T&÷VæB#¢$æòv÷&·76R&÷VæB"Â&æÆæwVvTÆ&VÂ#¢%T’ÆæwVvR"Â&æÆæwVvT6†–æW6R#¢.KŠŞihr"Â&æÆæwVvTVævÆ—6‚#¢$VævÆ—6‚"Â&çF†VÖTF&²#¢$F&²ÖöFR"Â&çF†VÖTÆ–v‡B#¢$Æ–v‡BÖöFR"Â'vRæ÷fW'f–WrçF—FÆR#¢$÷fW'f–Wr"Â'vRæ÷fW'f–Wrç7V'F—FÆR#¢$6–ævÆR6÷&R–FVçF—G’æB66VæR×7V6–f–2W‡&W76–öâÂG&—fVâ'’&VÂ†÷7BFFâ"Â'vRæÆ–'&'’çF—FÆR#¢%W'6öæÆ–'&'’"Â'vRæÆ–'&'’ç7V'F—FÆR#¢$Ö–çF–âöæR6÷&RW'6öææBç’çVÖ&W"öb&WW6&ÆR7G–ÆR6&G2â"Â'vRæ&–æF–æw2çF—FÆR#¢%66VæR&–æF–æw2"Â'vRæ&–æF–æw2ç7V'F—FÆR#¢$6†ö÷6RâW‡Æ–6—BÖöFRf÷"G'W7FVBv÷&·76R6W76–öç2æBfW&–f–VB66VæW2â"Â'vRæF–væ÷7F–72çF—FÆR#¢$–æ¦V7F–öâF–væ÷7F–72"Â'vRæF–væ÷7F–72ç7V'F—FÆR#¢$6öæf–wW&F–öâæB6ÆÆ&6²Wf–FVæ6R&R6†÷vâ6W&FVÇ’g&öÒf–æÂ&ö×Bf—6–&–Æ—G’â"Â'vRç6WGF–æw2çF—FÆR#¢%6WGF–æw2"Â'vRç6WGF–æw2ç7V'F—FÆR#¢$&–æBöæRv÷&·76RÂ6†ö÷6RFVfVÇG2Â6öçG&öÂ–æ¦V7F–öâÂæBÖævR&6·W2â"Â'vRæ÷fW'f–Wrææb#¢$÷fW'f–Wr"Â'vRæÆ–'&'’ææb#¢$Æ–'&'’"Â'vRæ&–æF–æw2ææb#¢$&–æF–æw2"Â'vRæF–væ÷7F–72ææb#¢$F–væ÷7F–72"Â'vRç6WGF–æw2ææb#¢%6WGF–æw2"Â'vRæFö7VÖVçEF—FÆR#¢'·vWÒ+rÖFWW2W'6öæ"Â&6öÖÖöâæF6‚#¢.(	B"Â&6öÖÖöâçVæ¶æ÷vâ#¢%Væ¶æ÷vâ"Â&6öÖÖöâææöæR#¢$æöæR"Â&6öÖÖöâææ÷D&÷VæB#¢$æ÷B&÷VæB"Â&6öÖÖöâæVæ&ÆVB#¢$Væ&ÆVB"Â&6öÖÖöâæF—6&ÆVB#¢$F—6&ÆVB"Â&6öÖÖöâç–W2#¢%–W2"Â&6öÖÖöâææò#¢$æò"Â&6öÖÖöâæÖçVÂ#¢&ÖçVÂ"Â&6öÖÖöâç6W76–öç2æöæR#¢#6W76–öâ"Â&6öÖÖöâç6W76–öç2æ÷F†W"#¢'¶6÷VçGÒ6W76–öç2"Â&6öÖÖöâæ6†&7FW'2#¢'¶6÷VçGÒ6†&7FW'2"Â&6öÖÖöâæW7F–ÖFVEFö¶Vç2#¢'ç¶6÷VçGÒFö¶Vç2"Â&6öÖÖöâæ6÷&TöæÇ’#¢$6÷&RöæÇ’"Â&6öÖÖöâæÖ—76–æu7G–ÆR#¢$Ö—76–ær7G–ÆR"Â&6öÖÖöâç&Wf—6–öäF6‚#¢%&Wf—6–öâ(	B"Â&6öÖÖöâç&Wf—6–öåfÇVR#¢%&Wf—6–öâ'·&Wf—6–öçÒ"Â&6öÖÖöâç7F÷&vTö²#¢%7F÷&vRô²"Â&6öÖÖöâç7F÷&vT–çfÆ–B#¢%7F÷&vR–çfÆ–B"Â&6öÖÖöâç7F÷&vUVæf–Æ&ÆR#¢%7F÷&vRVæf–Æ&ÆR"Â&6öÖÖöâç7F÷&vUVæ¶æ÷vâ#¢%7F÷&vR7FGW2Væ¶æ÷vâ"Â&6öÖÖöâæ÷væW"#¢$÷væW""Â'7FGW2çG'W7FVB#¢%G'W7FVB"Â'7FGW2çVçG'W7FVB#¢$æ÷BG'W7FVB"Â'7FGW2çVæ¶æ÷vâ#¢%Væ¶æ÷vâ"Â'7FGW2ææôW‡Æ–6—D&–æF–ær#¢$æòW‡Æ–6—B&–æF–ær"Â&ÖöFRææôW‡Æ–6—B#¢$æòW‡Æ–6—B&–æF–ær"Â&ÖöFRæ–æ†W&—B#¢$–æ†W&—BFVfVÇB+r·7G–ÆWÒ"Â&ÖöFRæ6÷&TöæÇ’#¢$6÷&RöæÇ’"Â&ÖöFRç7G–ÆR#¢%7G–ÆR+r·7G–ÆWÒ"Â&ÖöFRæF—6&ÆVB#¢$–æ¦V7F–öâF—6&ÆVB"Â&ÖöFRæ–æ†W&—D÷F–öâ#¢$–æ†W&—Bv÷&·76RFVfVÇB+r·7G–ÆWÒ"Â&ÖöFRæ6÷&TöæÇ”÷F–öâ#¢$6÷&RöæÇ’+ræò7G–ÆR"Â&ÖöFRç7V6–f–VE7G–ÆR#¢%7V6–f–VB7G–ÆR"Â&ÖöFRæF—6&ÆVD÷F–öâ#¢$F—6&ÆVB+ræòW'6öæ6V7F–öç2"Â'&V6öâæö²#¢%&W6öÇfVBæ÷&ÖÆÇ’"Â'&V6öâææõ÷6W76–öâ#¢$æòÆ—fR6W76–öâ"Â'&V6öâç7V&vVçB#¢%7V&vVçB6W76–öâW†6ÇVFVB"Â'&V6öâç7F÷&vU÷Væf–Æ&ÆR#¢%7F÷&vRVæf–Æ&ÆR"Â'&V6öâæ–æ¦V7F–öåöF—6&ÆVB#¢$–æ¦V7F–öâF—6&ÆVB"Â'&V6öâçv÷&·76U÷Væ&÷VæB#¢%v÷&·76Ræ÷B&÷VæB"Â'&V6öâçv÷&·76UöÖ—76–ær#¢$&÷VæBv÷&·76RæòÆöævW"W†—7G2"Â'&V6öâææ÷E÷v÷&·76UöÖVÖ&W"#¢%6W76–öâ—2æ÷Bv÷&·76RÖVÖ&W""Â'&V6öâç6W76–öåö–çfÆ–B#¢%6W76–öâ–FVçF—G’–çfÆ–B"Â'&V6öâçöÖ–æu÷VçG'W7FVB#¢%66VæRÖ–ærVæf–Æ&ÆR÷"VçG'W7FVB"Â'&V6öâæ&–æF–æuöF—6&ÆVB#¢$W‡Æ–6—FÇ’F—6&ÆVBf÷"F†—2F&vWB"Â'&V6öâæ6÷&UöV×G’#¢$6÷&RW'6öæ—2V×G’"Â'&V6öâç7G–ÆUöÖ—76–ær#¢%6VÆV7FVB7G–ÆRæòÆöævW"W†—7G2"Â'&V6öâç÷Væf–Æ&ÆR#¢%†÷7BÖ–ær—2Væf–Æ&ÆR"Â'&V6öâç÷&Wfö¶VB#¢%66VæRWF†÷&—¦F–öâv2&Wfö¶VB"Â'&V6öâç÷66VæU÷&Wfö¶VB#¢%66VæRÖ–ærv2&Wfö¶VB"Â'&V6öâæ&–æF–æu÷v÷&·76UöÖ—6ÖF6‚#¢$&–æF–ær&VÆöæw2Fòæ÷F†W"v÷&·76R"Â'&V6öâævVçEöæ÷EöÆ—fR#¢$vVçB—2æ÷BÆ—fR"Â'&V6öâæ†÷7Eö76VÖ&Ç•öf–ÆVB#¢$†÷7B76VÖ&Ç’f–ÆVB"Â'&V6öâæ†÷7Eö76VÖ&Ç•÷Væf–Æ&ÆR#¢$†÷7B76VÖ&Ç’—2Væf–Æ&ÆR"Â'&V6öâæ–çfÆ–Eö†÷7Eö76VÖ&Ç’#¢$†÷7B76VÖ&Ç’&W7VÇB—2–çfÆ–B"Â'&V6öâç7FFUö6†ævVEöGW&–æuö6†V6²#¢%7FFR6†ævVBGW&–ærF†R6†V6²"Â'&V6öâçVæ¶æ÷vâ#¢%Væ¶æ÷vâ&V6öâ"Â'7FGW5&V6öâçv÷&·76UöÖVÖ&W"#¢$7W'&VçBv÷&·76RÖVÖ&W""Â'7FGW5&V6öâçfW&–f–VE÷÷66VæR#¢%fW&–f–VB66VæRÖ–ær"Â'7FGW5&V6öâç7G–ÆUöÖ—76–ær#¢%6VÆV7FVB7G–ÆRæòÆöævW"W†—7G2"Â'7FGW5&V6öâçv÷&·76U÷Væ&÷VæB#¢$æòv÷&·76R—2&÷VæB"Â'7FGW5&V6öâçv÷&·76UöÖ—76–ær#¢$&÷VæBv÷&·76RæòÆöævW"W†—7G2"Â'7FGW5&V6öâææ÷E÷v÷&·76UöÖVÖ&W"#¢%6W76–öâÆVgBF†Rv÷&·76R"Â'7FGW5&V6öâç÷Væf–Æ&ÆR#¢%†÷7BÖ–ær—2Væf–Æ&ÆR"Â'7FGW5&V6öâçöÖ–æuö–çfÆ–B#¢%Ö–ær—2æòÆöævW"G'W7FVB"Â'7FGW5&V6öâç÷66VæU÷VæÖVB#¢%66VæR—2æ÷BÖVBFò7W'&VçB6W76–öâ"Â'7FGW5&V6öâç÷&Wfö¶VB#¢%66VæRWF†÷&—¦F–öâv2&Wfö¶VB"Â'7FGW5&V6öâæ&–æF–æu÷v÷&·76UöÖ—6ÖF6‚#¢$&–æF–ær&VÆöæw2Fòæ÷F†W"v÷&·76R"Â'7FGW5&V6öâæv—F–æuöf—'7E÷6W76–öâ#¢$v—F–ærf—'7B6W76–öâ"Â&†—7F÷'’æ7F–öâæ6÷&RçWFFR#¢$6÷&RWFFR†6÷&RçWFFR’"Â&†—7F÷'’æ7F–öâæ6÷&Rç&öÆÆ&6²#¢$6÷&R&öÆÆ&6²†6÷&Rç&öÆÆ&6²’"Â&†—7F÷'’æ7F–öâç7G–ÆRæ7&VFR#¢%7G–ÆR7&VFR‡7G–ÆRæ7&VFR’"Â&†—7F÷'’æ7F–öâç7G–ÆRçWFFR#¢%7G–ÆRWFFR‡7G–ÆRçWFFR’"Â&†—7F÷'’æ7F–öâç7G–ÆRæFVÆWFR#¢%7G–ÆRFVÆWFR‡7G–ÆRæFVÆWFR’"Â&†—7F÷'’æ7F–öâç7G–ÆRç&öÆÆ&6²#¢%7G–ÆR&öÆÆ&6²‡7G–ÆRç&öÆÆ&6²’"Â&†—7F÷'’æ7F–öâæ&–æF–ærçW6W'B#¢$&–æF–ærW6W'B†&–æF–ærçW6W'B’"Â&†—7F÷'’æ7F–öâæ&–æF–æræFVÆWFR#¢$&–æF–ærFVÆWFR†&–æF–æræFVÆWFR’"Â&†—7F÷'’æ7F–öâæFVfVÇB×7G–ÆRç6WB#¢%6WBFVfVÇB7G–ÆR†FVfVÇB×7G–ÆRç6WB’"Â&†—7F÷'’æ7F–öâçv÷&·76Ræ&–æB#¢$&–æBv÷&·76R‡v÷&·76Ræ&–æB’"Â&†—7F÷'’æ7F–öâç6WGF–æw2çWFFR#¢%WFFR6WGF–æw2‡6WGF–æw2çWFFR’"Â'F&vWBç&—fFR#¢%&—fFR"Â'F&vWBæw&÷W#¢$w&÷W"Â'F&vWBç7V'F—FÆR#¢%66VæR+r&÷B¶&÷GÒ"Â'F&vWBçv—F–æu6W76–öâ#¢$WF†÷&—¦VB+rv—F–ærf—'7B6W76–öâ+r&÷B¶&÷GÒ"Â'F&vWBç7V'F—FÆUv—F…6W76–öâ#¢%66VæR+r&÷B¶&÷GÒ+r6W76–öâ·6W76–öçÒ"Â'F&vWBçv÷&·76U6W76–öâ#¢%v÷&·76R6W76–öâ"Â'F&vWBçv÷&·76U6W76–öå&W6WB#¢%v÷&·76R6W76–öâ+r&W6WB·&W6WGÒ"Â'F&vWBç7F÷&VD&–æF–ær#¢%7F÷&VB&–æF–ær+rF&vWB—2æòÆöævW"Æ—7FVB'’F†R†÷7B"Â'F&vWBçVæ¶æ÷vâ#¢'Væ¶æ÷vâ"Â'F&vWBç7F÷&VE6W76–öâ#¢%v÷&·76R6W76–öâ"Â'F&vWBçfW&–f–VE66VæR#¢%fW&–f–VB66VæR"Â'F&vWBçv÷&·76U6W76–öäÆ&VÂ#¢%v÷&·76R6W76–öâ"Â'F&vWBç7V&vVçE–ÆÂ#¢%7V&vVçB"Â'F&vWBç6W76–öäEv÷&·76R#¢%v÷&·76R6W76–öâ"Â&VF—F÷"æ6÷&TæÖR#¢$6÷&RW'6öæ"Â&VF—F÷"çVç6fVB#¢%Vç6fVB6†ævW2"Â&VF—F÷"ç6fVB#¢%6fVB+ræW‡BÖöFVÂ76VÖ&Ç’"Â&VF—F÷"æ6†$6÷VçB#¢'¶6÷VçGÒò¶Ö‡Ò6†&7FW'2"Â&VF—F÷"çFö¶VäW7F–ÖFR#¢'ç·Fö¶Vç7ÒW7F–ÖFVBFö¶Vç2+rv&æ–ærB·v&çÒ"Â&VF—F÷"çFö¶Våv&æ–ær#¢%Fö¶VâW7F–ÖFR—2&÷fRF†R·v&çÒ×Fö¶Vâv&æ–ærF‡&W6†öÆBâF†—2—2†WW&—7F–2Âæ÷BFö¶Væ—¦W"ÖW†7Bâ"Â&VF—F÷"æ6öæfÆ–7Ev&æ–ær#¢%F†—2FW‡BÖ’6öæfÆ–7Bv—F‚F†R6÷&R–FVçF—G’÷"E4‚FööÂW&Ö—76–öç2â6†V6²–÷W"–çFVçC²F†—2v&æ–ærFöW2æ÷B&Æö6²6f–ærÂæBF†R†÷7B7F–ÆÂVæf÷&6W2W&Ö—76–öç2â"Â&VF—F÷"ç6VÆV7D6&B#¢%6VÆV7B6&BFòVF—Bâ"Â&VF—F÷"ç7G–ÆTæÖR#¢%7G–ÆRæÖR"Â&VF—F÷"æFW67&—F–öâ#¢$öæRÖÆ–æRFW67&—F–öâ"Â&VF—F÷"æ6öÆ÷$Æ&VÂ#¢$6öÆ÷"Æ&VÂ"Â&VF—F÷"ç7G–ÆT6öÆ÷"#¢%7G–ÆR6öÆ÷""Â&VF—F÷"æ7W7FöÔ6öÆ÷"#¢$7W7FöÒ6öÆ÷""Â&6öÆ÷"æw&VVâ#¢$w&VVâ"Â&6öÆ÷"çf–öÆWB#¢%f–öÆWB"Â&6öÆ÷"ç&÷6R#¢%&÷6R"Â&6öÆ÷"æ&ÇVR#¢$&ÇVR"Â&6öÆ÷"æÖ&W"#¢$Ö&W""Â&VF—F÷"ææWu7G–ÆUF—FÆR#¢$æWr7G–ÆR"Â&VF—F÷"æVF—D6÷&UF—FÆR#¢$VF—B6÷&RW'6öæ"Â&VF—F÷"æVF—E7G–ÆUF—FÆR#¢$VF—B7G–ÆR"Â&VF—F÷"æ6÷&U7V'F—FÆR#¢%6†&VB'’WfW'’G'W7FVBF&vWB–âF†R&÷VæBv÷&·76R"Â&VF—F÷"ç7G–ÆU7V'F—FÆR#¢%&WW6&ÆRF‡&÷Vv‚âW‡Æ–6—B&–æF–ær÷"F†Rv÷&·76RFVfVÇB"Â&VF—F÷"æ&FvT6÷&R#¢$6÷&R"Â&VF—F÷"æ&FvU7G–ÆR#¢%7G–ÆR"Â&VF—F÷"ææWu7G–ÆTæ÷FR#¢$æWr7G–ÆR—2w&—GFVâFòF†R†÷7BöæÇ’v†Vâ–÷R6fRâæò6×ÆRW'6öæFW‡B—2&RÖf–ÆÆVBâ"Â&VF—F÷"æ6÷&T&öG”Æ&VÂ#¢$6÷&RW'6öæ&öG’+r4õTÂ"Â&VF—F÷"ç7G–ÆT&öG”Æ&VÂ#¢%7G–ÆR&öG’+r5E”ÄR"Â&VF—F÷"æ6÷&UÆ6V†öÆFW"#¢%w&—FRF†R6†&VB–FVçF—G’ÂfÇVW2ÂæBW‡&W76–öâ&–æ6—ÆW>(
b"Â&VF—F÷"ç7G–ÆUÆ6V†öÆFW"#¢%w&—FRF†R66VæR×7V6–f–2W‡&W76–öâæB&V†f–÷W"wV–Fæ6^(
b"Â&VF—F÷"æ†—7F÷'’#¢$†—7F÷'’"Â&VF—F÷"æ6÷’#¢$6÷’"Â&VF—F÷"æFVÆWFR#¢$FVÆWFR"Â&VF—F÷"æF—66&B#¢$F—66&B"Â&VF—F÷"æ7&VFR#¢$7&VFR7G–ÆR"Â&VF—F÷"ç6fR#¢%6fR6†ævW2"Â&VF—F÷"æfö÷Fæ÷FR#¢$6†ævW2F¶RVffV7BBF†RæW‡BÖöFVÂ76VÖ&Ç’âW†—7F–ær6W76–öç2¶VWF†V—"vVçB&W6WBÂFööÇ2ÂW&Ö—76–öç2ÂæB†—7F÷'’â"Â&VF—F÷"ææõ7G–ÆT6&G2#¢$æò7G–ÆR6&G2–WBâ"Â&VF—F÷"æ7&VFTf—'7E7G–ÆR#¢$7&VFRF†Rf—'7B7G–ÆR"Â&VF—F÷"çW'6öæFVf–æ—F–öç2#¢%W'6öæFVf–æ—F–öç2"Â&VF—F÷"ææWu7G–ÆR#¢$æWr7G–ÆR"Â&VF—F÷"ç6†&VD–FVçF—G’#¢$öæR6†&VB–FVçF—G’+r4õTÂ"Â&VF—F÷"æ6öæf–wW&VB#¢$6öæf–wW&VB"Â&VF—F÷"æV×G’#¢$V×G’"Â&VF—F÷"æ6÷&TV×G•FW‡B#¢%F†R6÷&RW'6öæ—2V×G’âæò6÷&RFW‡B—2–æ¦V7FVBVçF–ÂF†R÷væW"w&—FW2æB6fW2öæRâ"Â&VF—F÷"æ6†'5Fö¶Vç2#¢'¶6†'7Ò6†'2+rç·Fö¶Vç7ÒFö¶Vç2"Â&VF—F÷"çFö¶Våv&æ–æu7Vff—‚#¢"+rFö¶Vâv&æ–ær"Â&VF—F÷"æVF—D6÷&R#¢$VF—B6÷&R"Â&VF—F÷"ç7G–ÆTÆ–'&'’#¢%7G–ÆRÆ–'&'’"Â&VF—F÷"ç&WW6&ÆR#¢%&WW6&ÆR7&÷72G'W7FVBF&vWG2"Â&VF—F÷"æW‡&W76–öäæ÷FUF—FÆR#¢$W‡&W76–öâÂæ÷B6V6öæB–FVçF—G’â"Â&VF—F÷"æW‡&W76–öäæ÷FR#¢%7G–ÆR6&G2Æ–W"öâF†R6÷&RW'6öæâF†W’æWfW"&WÆ6RE4‚&W6WG2Âw&çBFööÇ2Â÷"6†ævRÂÆ–fRÂÖVÖ÷'’Â÷"7FFRW&Ö—76–öç2â"Â&VF—F÷"æW7EFö¶Vç2#¢'·Fö¶Vç7ÒW7BâFö¶Vç2"Â&VF—F÷"æVF—B#¢$VF—B"Â&VF—F÷"ç6VÆV7E7G–ÆR#¢%6VÆV7B7G–Æ^(
b"Â&VF—F÷"ç&W6WDÆ&VÂ#¢$vVçB&W6WB"Â&VF—F÷"çv÷&·76U6W76–öåF—FÆR#¢%v÷&·76R6W76–öâ"Â&&–æF–æw2ç6VÆV7EF&vWB#¢%6VÆV7Bv÷&·76R6W76–öâ÷"fW&–f–VB66VæRg&öÒF†RÆ—7Bâ"Â&&–æF–æw2ææôÖF6†W2#¢$æòG'W7FVBF&vWG2ÖF6‚F†—2f–ÇFW"â"Â&&–æF–æw2ç6VÆV7EF&vWD†–çB#¢$öæÇ’F&vWG2F—66÷fW&VBg&öÒF†R7W'&VçBG'W7FVBv÷&·76RV"†W&RâF†W&R—2æòg&VRÖf÷&Ò–Bf–VÆBâ"Â&&–æF–æw2çF&vWE6÷W&6R#¢%F&vWB6÷W&6R"Â&&–æF–æw2çfW&–f–VEÖ–ær#¢%fW&–f–VB†÷7BÖ–ær"Â&&–æF–æw2æ7W'&VçDÖVÖ&W'6†—#¢$7W'&VçBv÷&·76RÖVÖ&W'6†—"Â&&–æF–æw2ç7FÆUF&vWB#¢%7F÷&VBF&vWBæòÆöævW"V'2–âF†RÆ—fR&Vv—7G'’â"Â&&–æF–æw2ç&WfÆ–FFVB#¢%&WfÆ–FFVB'’F†R†÷7BöâWfW'’w&—FRæB76VÖ&Ç’â"Â&&–æF–æw2ç7F&ÆT¶W’#¢%7F&ÆR¶W’"Â&&–æF–æw2ç7V&vVçDW†6ÇVFVB#¢%7V&vVçB6W76–öç2&RW†6ÇVFVC²F†—2&–æF–ær6ææ÷B&R6fVBâ"Â&&–æF–æw2æ&–æF–æu&Wf—6–öâ#¢$&–æF–ær&Wf—6–öâ·&Wf—6–öçÒ+r¶FFWÒ"Â&&–æF–æw2æ–æ†W&—G4FVfVÇB#¢$–æ†W&—G2F†Rv÷&·76RFVfVÇBVçF–Â6fVBâ"Â&&–æF–æw2ç7V&vVçD&ææW%F—FÆR#¢%7V&vVçB6W76–öââ"Â&&–æF–æw2ç7V&vVçD&ææW$&öG’#¢%F†R&W6öÇfW"W†6ÇVFW26W76–öç2v†÷6RG'W7FVB†VFW"÷&–v–â—2Ç7â6Æ73ÕÂ&ÖöæõÂ#ç7V&vVçCÂ÷7ãââæò&–æF–ær6â&R6fVBf÷"F†—2F&vWBâ"Â&&–æF–æw2çVçG'W7FVD&ææW%F—FÆR#¢%7F÷&VB&–æF–ær—2æ÷B7W'&VçFÇ’G'W7FVBâ"Â&&–æF–æw2çVçG'W7FVD&ææW$&öG’#¢'·&V6öçÒâ—B—2&W6W'fVBf÷"&Wf–WrÂ'WB—Bv–ÆÂæ÷B–æ¦V7BVçF–ÂF†RF&vWB&V6öÖW2G'W7FVBv–ââ"Â&&–æF–æw2æÖöFTÆ&VÂ#¢$W‡Æ–6—BÖöFR"Â&&–æF–æw2æÖöFT†VÇ#¢$W‡Æ–6—B&–æF–ærv–ç2÷fW"F†Rv÷&·76RFVfVÇBâF—6&ÆVB7F÷2&÷F‚6÷&RæB7G–ÆR–æ¦V7F–öâf÷"F†—2F&vWBâ"Â&&–æF–æw2ç7G–ÆT6&B#¢%7G–ÆR6&B"Â&&–æF–æw2ç6VÆV7E7G–ÆT÷F–öâ#¢%6VÆV7B7G–Æ^(
b"Â&&–æF–æw2ææõ7G–ÆW2#¢$æò7G–ÆW2W†—7Bâ7&VFRöæR–âÆ–'&'’&Vf÷&R6f–ær7G–ÆR&–æF–ærâ"Â&&–æF–æw2ç&W6WD–æ†W&—B#¢%&W6WBFò–æ†W&—B"Â&&–æF–æw2ç&VÖ÷fR#¢%&VÖ÷fR&–æF–ær"Â&&–æF–æw2ç6fR#¢%6fR&–æF–ær"Â&&–æF–æw2æ6öæf–wW&VE&Wf–Wr#¢$6öæf–wW&VB&Wf–Wr"Â&&–æF–æw2ç&Wf–Wtæ÷FR#¢$æ÷BWf–FVæ6Röbf–æÂ&ö×Bf—6–&–Æ—G’"Â&&–æF–æw2æFVÆWF–öä–×7EF—FÆR#¢$FVÆWF–öâ–×7C¢"Â&&–æF–æw2æFVÆWF–öä–×7D&öG’#¢%&VÖ÷f–ær&–æF–ær6†ævW2öæÇ’F†—2F&vWBw2W'6öæ6VÆV7F–öââ—BFöW2æ÷BFVÆWFR6W76–öç2Â66W72ÂvVçB&W6WG2ÂFööÇ2Â÷"W&Ö—76–öç2â&W6WGF–ærFò–æ†W&—BföÆÆ÷w2F†R7W'&VçBv÷&·76RFVfVÇBâ"Â&&–æF–æw2ææõv÷&·76UF—FÆR#¢$æòv÷&·76R&÷VæBâ"Â&&–æF–æw2ææõv÷&·76T&öG’#¢$&–æBv÷&·76R–â6WGF–æw2&Vf÷&R7&VF–ær÷"VF—F–ærW‡Æ–6—B&–æF–æw2â"Â&&–æF–æw2æ÷Vå6WGF–æw2#¢$÷Vâ6WGF–æw2"Â&&–æF–æw2ç6V&6„&–#¢%6V&6‚G'W7FVBF&vWG2"Â&&–æF–æw2ç6V&6…Æ6V†öÆFW"#¢%6V&6‚6W76–öâ÷"66VæR"Â&&–æF–æw2æf–ÇFW$&–#¢%F&vWBf–ÇFW""Â&&–æF–æw2æÆÂ#¢$ÆÂ¶6÷VçGÒ"Â&&–æF–æw2ç6W76–öç2#¢%6W76–öç2¶6÷VçGÒ"Â&&–æF–æw2ç#¢%¶6÷VçGÒ"Â&&–æF–æw2ç7V&vVçG2#¢%7V&vVçG2"Â&&–æF–æw2æ6–FU&Vf—‚#¢%F&vWG2&RF—66÷fW&VBg&öÒ"Â&&–æF–æw2æ6–FU7Vff—‚#¢"æBF†R÷F–öæÂG'W7FVB†÷7B6W'f–6Râæò–B6â&RG—VB–çFòG'W7FVB&–æF–ærâ"Â&&–æF–æw2ææõ6V7F–öç5F—FÆR#¢$æòW'6öæ6V7F–öç2"Â&&–æF–æw2æF—6&ÆVD&FvR#¢$F—6&ÆVB"Â&&–æF–æw2ææõ6V7F–öç4&öG’#¢$&÷F‚W'6öæ6V7F–öç2&W6öÇfRFòV×G’FW‡Bf÷"F†—2F&vWBâ÷F†W"7—7FVÒ&ö×B6öçFVçB—2VçF÷V6†VBâ"Â&&–æF–æw2æ6÷&U&Wf–WuF—FÆR#¢$6÷&RW'6öæ"Â&&–æF–æw2æ6÷&TV×G•&Wf–Wr#¢$6÷&RW'6öæ—2V×G“²æò6÷&RFW‡Bv÷VÆB&R&÷f–FVBâ"Â&&–æF–æw2ææõ7G–ÆTÆ–W%F—FÆR#¢$æò7G–ÆRÆ–W""Â&&–æF–æw2ææõ7G–ÆTÆ–W$&FvR#¢$6÷&RöæÇ’"Â&&–æF–æw2ææõ7G–ÆTÆ–W$&öG’#¢%F†—2F&vWBW6W2æò7G–ÆRFW‡BVæFW"F†R7W'&VçBG&gBâ"Â&&–æF–æw2ç&W6W'fVEF—FÆR#¢%&W6W'fVB6&–Æ—G’7W&f6R"Â&&–æF–æw2ç&W6W'fVD&öG’#¢$vVçB&W6WBÂFööÇ2ÂW&Ö—76–öç2Â'VçF–ÖR6öçFW‡BÂWF†÷&—¦F–öâÂÖVÖ÷'’Â7FFRÂæBÆ–fR&Ræ÷BÖöF–f–VB'’W'6öæâ"Â'6WGF–æw2æ&÷VæEv÷&·76R#¢$&÷VæBv÷&·76R"Â'6WGF–æw2æ&÷VæEv÷&·76T&öG’#¢%W'6öæG'W7G2W†7FÇ’öæRE4‚v÷&·76R'’7F&ÆR–Bâ&Vf÷&R7v—F6‚ÂöÆB&–æF–æw2&R&6¶VBWæB&6†—fVC²F†RæWrv÷&·76RFöW2æ÷B–æ†W&—BF†VÒâæò6W76–öç2&RFVÆWFVB÷"&V7&VFVBâ"Â'6WGF–æw2çv÷&·76TÆ&VÂ#¢%v÷&·76R"Â'6WGF–æw2ææõv÷&·76T÷F–öâ#¢$æòv÷&·76R&÷VæB+r–æ¦V7F–öâF—6&ÆVB"Â'6WGF–æw2çv÷&·76T÷F–öâæöæR#¢'·F—FÆWÒ+r6W76–öâ"Â'6WGF–æw2çv÷&·76T÷F–öâæ÷F†W"#¢'·F—FÆWÒ+r¶6÷VçGÒ6W76–öç2"Â'6WGF–æw2æ7W'&VçB#¢$7W'&VçC¢·fÇVWÒ"Â'6WGF–æw2ææöæR#¢&æöæR"Â'6WGF–æw2ææõv÷&·76TÆ&VÂ#¢&æòv÷&·76R"Â'6WGF–æw2ç&Vv—7G'•Væf–Æ&ÆR#¢"+rv÷&·76R&Vv—7G'’Væf–Æ&ÆR÷"V×G’"Â'6WGF–æw2æÇ•v÷&·76T†–çB#¢$6÷&RæB7G–ÆR6&G2&VÖ–ã²öÆB&–æF–æw2&R&6¶VBWæB6ÆV&VBg&öÒ7F—fR6öæf–wW&F–öââ"Â'6WGF–æw2æÇ•v÷&·76R#¢$Ç’v÷&·76R"Â'6WGF–æw2æFVfVÇG4–æ¦V7F–öâ#¢$FVfVÇG2æB–æ¦V7F–öâ"Â'6WGF–æw2æFVfVÇG4&öG’#¢%F†RFVfVÇB7G–ÆRÆ–W2v†VâG'W7FVBF&vWB†2æòW‡Æ–6—B&–æF–ærâW‡Æ–6—B&–æF–æw2Çv—2v–ââ"Â'6WGF–æw2æFVfVÇE7G–ÆTÆ&VÂ#¢%v÷&·76RFVfVÇB7G–ÆR"Â'6WGF–æw2æ6÷&TöæÇ”÷F–öâ#¢$6÷&RöæÇ’+ræòFVfVÇB7G–ÆR"Â'6WGF–æw2æFVfVÇE7G–ÆT†–çB#¢$FVÆWF–ærF†R7W'&VçBFVfVÇB7G–ÆR&W6WG2F†—26WGF–ærFò6÷&RÖöæÇ’â"Â'6WGF–æw2æÇ”FVfVÇD†–çB#¢$W†—7F–ærF&vWG2v—F‚âW‡Æ–6—B7G–ÆR&RVæffV7FVBâ"Â'6WGF–æw2æÇ”FVfVÇB#¢$Ç’FVfVÇB"Â'6WGF–æw2æVæ&ÆT–æ¦V7F–öâ#¢$Væ&ÆRW'6öæ–æ¦V7F–öâ"Â'6WGF–æw2æVæ&ÆT–æ¦V7F–öä†VÇ#¢%v†VâöfbÂ&÷F‚W'6öæ6V7F–öç2&W6öÇfRFòV×G’FW‡BBF†RæW‡BÖöFVÂ76VÖ&Ç’âW†—7F–ær6†B†—7F÷'’æB6W76–öç2&VÖ–âVæ6†ævVBâ"Â'6WGF–æw2çF–Ö–ær#¢%F–Ö–æs¢æW‡BÖöFVÂ76VÖ&Ç’âæò6W76–öâ&V7&VF–öâÂæò&W6WB6†ævRâE4‚Ö’7F'BæWr&WVW7B6W&–W2v†VâF†R7—7FVÒ&ö×B6†ævW3²æò¦W&òÖ6÷7B6Æ–Ò—2ÖFRâ"Â'6WGF–æw2æ&6·W2#¢$&6·W2"Â'6WGF–æw2æ&6·W4&öG’#¢$&6·W2&R6ö×ÆWFRfÆ–FFVB7FFRFö7VÖVçG2â&W7F÷&–ærw&—FW2&R×&W7F÷&R6fWG’&6·Wf—'7BæB¶VW2†—7F÷'’â"Â'6WGF–æw2æ&6·W&V6öâ#¢$÷F–öæÂ&6·WÆ&VÂ"Â'6WGF–æw2æ&6·W&V6öåÆ6V†öÆFW"#¢&&Vf÷&RWw&FR"Â'6WGF–æw2æ&6·W†–çB#¢$&6·W2Fòæ÷B6†ævRF†RW'6öæ&Wf—6–öââ"Â'6WGF–æw2æ7&VFT&6·W#¢$7&VFR&6·W"Â'6WGF–æw2æf–Æ&ÆT&6·W2#¢$f–Æ&ÆR&6·W2"Â'6WGF–æw2æÆöF–æt&6·W2#¢$ÆöF–ær&6·W>(
b"Â'6WGF–æw2æ&6·WVæf–Æ&ÆR#¢$&6·WÆ—7BVæf–Æ&ÆR"Â'6WGF–æw2ææô&6·W2#¢$æòfÆ–B&6·W2–WBâ7&VFRöæR&Vf÷&RÆ&vRVF—B÷"Ww&FRâ"Â'6WGF–æw2çF&ÆRæ&6·W#¢$&6·W"Â'6WGF–æw2çF&ÆRæ6GW&VE&Wf—6–öâ#¢$6GW&VB&Wf—6–öâ"Â'6WGF–æw2çF&ÆRç&V6öâ#¢%&V6öâ"Â'6WGF–æw2çF&ÆRç6—¦R#¢%6—¦R"Â'6WGF–æw2ç&W7F÷&R#¢%&W7F÷&R"Â'6WGF–æw2æ–çfÆ–D&6·W2æöæR#¢#–çfÆ–B&6·Wf–ÆR–væ÷&VBâ"Â'6WGF–æw2æ–çfÆ–D&6·W2æ÷F†W"#¢'¶6÷VçGÒ–çfÆ–B&6·Wf–ÆW2–væ÷&VBâ"Â'6WGF–æw2ç6V7W&—G’#¢%6V7W&—G’æB†öæW7B&÷VæF&–W2"Â'6WGF–æw2ç6V7W&—G”—FVÒæWF‚#¢$WfW'’6öç6öÆR&WVW7B&WV—&W26ÖRÖ÷&–v–â&WVW7BæBE4‚÷væW"FÖ—76–öâF‡&÷Vv‚F†R†÷7B6öææV7F–öâ6W'f–6RâÆö÷&6²ÆöæR—2æ÷BWF†÷&—¦F–öââ"Â'6WGF–æw2ç6V7W&—G”—FVÒç7F÷&vR#¢$Æö6Å7F÷&vR—2W6VBöæÇ’f÷"F†RT’ÆæwVvRæBÆ–v‡BöF&²F†VÖR&VfW&Væ6W2âW'6öæ6öæf–wW&F–öâ—2æWfW"7F÷&VB–âF†R'&÷w6W"â"Â'6WGF–æw2ç6V7W&—G”—FVÒçf—6–&–Æ—G’#¢$f–æÂ7—7FVÒ&ö×Bf—6–&–Æ—G’—2VçfW&–f–VBVæÆW72G'W7FVB†÷7B6†V6²&W÷'G2—Bâ6ÆÆ&6²–çfö6F–öâÆöæR—2æ÷B&ööbâ"Â'6WGF–æw2ç6V7W&—G”—FVÒçFö¶Vç2#¢%Fö¶Vâ6÷VçG2&R†WW&—7F–2W7F–ÖFW2Âæ÷BFö¶Væ—¦W"ÖW†7Bâ6†&7FW"Æ–Ö—G2&RVæf÷&6VB'’F†R†÷7Bâ"Â'6WGF–æw2ç6V7W&—G”—FVÒç#¢%66VæR–FVçF—G’—266WFVBöæÇ’g&öÒF†R÷F–öæÂ†÷7BÖ–æs²F†—26öç6öÆR†2æòg&VRÖf÷&Ò–B–çWBâ"Â&÷fW'f–Wræ†W&ô¶–6¶W"#¢$ôäR”DTåD•E’+rÔå’U…$U54”ôå2"Â&÷fW'f–Wræ†W&õ66÷VB#¢%W'6öæ—266÷VBFò(	Ç·v÷&·76WŞ(	Òâ"Â&÷fW'f–Wræ†W&õVæ&÷VæB#¢%7F'B'’&–æF–æröæRE4‚v÷&·76Râ"Â&÷fW'f–Wræ†W&ô&öG’#¢%W'6öæFG2Gvò–æFWVæFVçB7—7FVÒ&ö×B6V7F–öç2f÷"F†R&÷VæBv÷&·76Râ—BFöW2æ÷B6VÆV7B&W6WBÂ6†ævRFööÂ66†VÖ2Â÷"w&çBW&Ö—76–öç2âÆÂfÇVW2&VÆ÷r6öÖRg&öÒF†RWF†VçF–6FVB†÷7B’â"Â&÷fW'f–WræÖævT&–æF–æw2#¢$ÖævR&–æF–æw2"Â&÷fW'f–Wræ6†ö÷6Uv÷&·76R#¢$6†ö÷6Rv÷&·76R"Â&÷fW'f–WræVF—D6÷&R#¢$VF—B6÷&RW'6öæ"Â&÷fW'f–Wræ6÷&T6öæf–wW&VB#¢$6÷&RW'6öæ6öæf–wW&VB"Â&÷fW'f–Wræ6÷&TV×G’#¢$6÷&RW'6öæ—2V×G’"Â&÷fW'f–Wræ6÷&U6†&VB#¢$öæR6†&VB4õTÂW"&÷VæBv÷&·76R"Â&÷fW'f–Wrç7G–ÆT6&G2#¢%7G–ÆR6&G2"Â&÷fW'f–WræW‡Æ–6—D&–æF–æw2#¢$W‡Æ–6—B&–æF–æw2"Â&÷fW'f–Wrçv÷&·76TFVfVÇB#¢%v÷&·76RFVfVÇB"Â&÷fW'f–WrçW'6öæ÷fW'f–Wr#¢%W'6öæ÷fW'f–Wr"Â&÷fW'f–Wrç&Wf—6–öäæW‡B#¢%&Wf—6–öâ'·&Wf—6–öçÒ+ræW‡BÖöFVÂ76VÖ&Ç’"Â&÷fW'f–Wræ6÷&UW'6öæ#¢$6÷&RW'6öæ"Â&÷fW'f–Wrç&W6VçB#¢%&W6VçB"Â&÷fW'f–WræV×G’#¢$V×G’"Â&÷fW'f–Wræ6†&7FW'5Fö¶Vç2#¢'¶6†'7Ò6†&7FW'2+r·Fö¶Vç7ÒW7BâFö¶Vç2"Â&÷fW'f–Wrç&WW6&ÆUF&vWG2#¢%&WW6&ÆR7&÷72G'W7FVBF&vWG2"Â&÷fW'f–Wrçv÷&·76U6W76–öç5fW&–f–VB#¢'·6W76–öç7Òv÷&·76R6W76–öç2+r·66VæW7ÒfW&–f–VB66VæW2"Â&÷fW'f–Wræ–æ¦V7F–öâ#¢$–æ¦V7F–öâ"Â&÷fW'f–WræVæ&ÆVB#¢$Væ&ÆVB"Â&÷fW'f–WræF—6&ÆVB#¢$F—6&ÆVB"Â&÷fW'f–Wræ&÷VæEFôöæR#¢$&÷VæBFòöæRv÷&·76R"Â&÷fW'f–Wrææõv÷&·76R#¢$æòv÷&·76R&÷VæB"Â&÷fW'f–Wrçv&æ–æw4&÷VæF&–W2#¢%v&æ–æw2æB&÷VæF&–W2"Â&÷fW'f–Wrç&Vg&W6‚#¢%&Vg&W6‚"Â&÷fW'f–Wrææõv&æ–æw5F—FÆR#¢$æò6öæf–wW&F–öâv&æ–æw2&W÷'FVB'’F†R†÷7Bâ"Â&÷fW'f–Wrææõv&æ–æw4&öG’#¢%F†—2FöW2æ÷B&÷fRf–æÂ&ö×Bf—6–&–Æ—G“²W6RF–væ÷7F–72f÷"6ÆÆ&6²Wf–FVæ6Râ"Â&÷fW'f–Wræ&÷VæEv÷&·76R#¢$&÷VæBv÷&·76R"Â&÷fW'f–Wrç6WGF–æw2#¢%6WGF–æw2"Â&÷fW'f–Wrçv÷&·76R#¢%v÷&·76R"Â&÷fW'f–WrçG'W7FVDÖVÖ&W'6†—#¢%G'W7FVBÖVÖ&W'6†—"Â&÷fW'f–Wrç6W76–öç46÷VçBæöæR#¢#6W76–öâ"Â&÷fW'f–Wrç6W76–öç46÷VçBæ÷F†W"#¢'¶6÷VçGÒ6W76–öç2"Â&÷fW'f–Wrç7V&vVçG4W†6ÇVFVB#¢%7V&vVçG2&RW†6ÇVFVB'’G'W7FVB÷&–v–â"Â&÷fW'f–WræFVfVÇE7G–ÆR#¢$FVfVÇB7G–ÆR"Â&÷fW'f–WræFVfVÇE7G–ÆT†–çB#¢%W6VBv†VâF&vWB†2æòW‡Æ–6—B&–æF–ær"Â&÷fW'f–WræVffV7F—fUF–Ö–ær#¢$VffV7F—fRF–Ö–ær"Â&÷fW'f–WrææW‡D76VÖ&Ç’#¢$æW‡BÖöFVÂ76VÖ&Ç’"Â&÷fW'f–Wrææõ&V7&VFR#¢$æò6W76–öâ—2&V7&VFVB"Â&÷fW'f–Wrææõv÷&·76T&÷VæB#¢$æòv÷&·76R—2&÷VæBâ"Â&÷fW'f–Wræ6†ö÷6TöæR#¢$6†ö÷6RöæR"Â&÷fW'f–Wræ†÷u&W6öÇfW2#¢$†÷r—B&W6öÇfW2"Â&÷fW'f–Wræf–Ä6Æ÷6VB#¢$f–Â6Æ÷6VB"Â&÷fW'f–Wrç—VÆ–æRæ–FVçF—G”çVÒ#¢#+r”DTåD•E’"Â&÷fW'f–Wrç—VÆ–æRæ–FVçF—G•F—FÆR#¢$ÆöBF†R6÷&R6&B"Â&÷fW'f–Wrç—VÆ–æRæ–FVçF—G”&öG’#¢$öæÇ’f÷"F†R&÷VæBv÷&·76R"Â&÷fW'f–Wrç—VÆ–æRçG'W7DçVÒ#¢#"+rE%U5B"Â&÷fW'f–Wrç—VÆ–æRçG'W7EF—FÆR#¢%&V6†V6²6W76–öâÖVÖ&W'6†—"Â&÷fW'f–Wrç—VÆ–æRçG'W7D&öG’#¢%66VæW2&WV—&RfW&–f–VB†÷7BÖ–ær"Â&÷fW'f–Wrç—VÆ–æRæ÷fW'&–FTçVÒ#¢#2+rõdU%$”DR"Â&÷fW'f–Wrç—VÆ–æRæ÷fW'&–FUF—FÆR#¢$Ç’W‡Æ–6—BÖöFR"Â&÷fW'f–Wrç—VÆ–æRæ÷fW'&–FT&öG’#¢$–æ†W&—B(¢6÷&RÖöæÇ’(¢7G–ÆR(¢F—6&ÆVB"Â&÷fW'f–Wrç—VÆ–æRæ76VÖ&Ç”çVÒ#¢#B+r54TÔ$Å’"Â&÷fW'f–Wrç—VÆ–æRæ76VÖ&Ç•F—FÆR#¢%&VBv–âW"ÖöFVÂ7FW"Â&÷fW'f–Wrç—VÆ–æRæ76VÖ&Ç”&öG’#¢$æò&W6WBÂFööÇ2Â÷"W&Ö—76–öç26†ævVB"Â&÷fW'f–Wræ6öæf–wW&VD&–æF–æw2#¢$6öæf–wW&VB&–æF–æw2"Â&÷fW'f–Wræ÷Vä&–æF–æw2#¢$÷Vâ&–æF–æw2"Â&÷fW'f–WrææôW‡Æ–6—D&–æF–æw2#¢$æòW‡Æ–6—B&–æF–æw2â6W76–öç2æBfW&–f–VB66VæW2W6RF†Rv÷&·76RFVfVÇBÂ–bç’â"Â&÷fW'f–WrçF&ÆUF&vWB#¢%F&vWB"Â&÷fW'f–WrçF&ÆTÖöFR#¢$ÖöFR"Â&÷fW'f–WrçF&ÆU7FGW2#¢%7FGW2"Â&÷fW'f–Wræ–ç7V7B#¢$–ç7V7B"Â&÷fW'f–Wrçv&æ–ærç7F÷&vUF—FÆR#¢%W'6öæ7F÷&vR—2æ÷B†VÇF‡’"Â&÷fW'f–Wrçv&æ–ærç7F÷&vUFW‡B#¢$–æ¦V7F–öâf–Ç26Æ÷6VBæBw&—FW2&RVæf–Æ&ÆRâ–ç7V7BF†R†÷7B7F÷&vR7FFR&Vf÷&R6öçF–çV–ærâ"Â&÷fW'f–Wrçv&æ–ærææõv÷&·76UF—FÆR#¢$æòv÷&·76R—2&÷VæB"Â&÷fW'f–Wrçv&æ–ærææõv÷&·76UFW‡B#¢%W'6öæFöW2æ÷B–æ¦V7B–çFòç’6W76–öââ6VÆV7BöæRv÷&·76R–â6WGF–æw2â"Â&÷fW'f–Wrçv&æ–ærçv÷&·76TÖ—76–æuF—FÆR#¢%F†R&÷VæBv÷&·76R—2Ö—76–ær"Â&÷fW'f–Wrçv&æ–ærçv÷&·76TÖ—76–æuFW‡B#¢%F†R7F÷&VBv÷&·76R–BæòÆöævW"&W6öÇfW2–âF†RE4‚&Vv—7G'’â&V&–æB7W'&VçBv÷&·76Râ"Â&÷fW'f–Wrçv&æ–æræ–æ¦V7F–öåF—FÆR#¢$–æ¦V7F–öâ—2F—6&ÆVB"Â&÷fW'f–Wrçv&æ–æræ–æ¦V7F–öåFW‡B#¢$6öæf–wW&VB6&G2&R&WF–æVBÂ'WBæòW'6öæ6V7F–öç2&R&÷f–FVBBÖöFVÂ76VÖ&Ç’â"Â&÷fW'f–Wrçv&æ–æræ6÷&UFö¶VåF—FÆR#¢$6÷&RW'6öæW†6VVG2F†RFö¶Vâv&æ–ærF‡&W6†öÆB"Â&÷fW'f–Wrçv&æ–æræ6÷&UFö¶VåFW‡B#¢%&Wf–WrÆVæwF‚âFö¶Vâ6÷VçG2&R†WW&—7F–2W7F–ÖFW2Âæ÷BFö¶Væ—¦W"ÖW†7Bâ"Â&÷fW'f–Wrçv&æ–æræ6&G5Fö¶VåF—FÆR#¢$öæR÷"Ö÷&R6&G2W†6VVBF†RFö¶Vâv&æ–ærF‡&W6†öÆB"Â&÷fW'f–Wrçv&æ–æræ6&G5Fö¶VåFW‡B#¢%6†÷'BÂ7F&ÆRW'6öæFW‡B—2V6–W"Fò&Wf–WræB6÷7G2fWvW"&ö×BFö¶Vç2â"Â&÷fW'f–Wrçv&æ–æræÖVÖ÷'•F—FÆR#¢$ÖVÖ÷'’W'6öæ6&B7FGW2æVVG2&Wf–Wr"Â&÷fW'f–Wrçv&æ–æræÖVÖ÷'•FW‡B#¢$ÖVÖ÷'’—2–ç7FÆÆVBÂ'WB—G27W'&VçBV&Æ–2†÷7B6öçG&7BFöW2æ÷BW‡÷6RF†RVffV7F—fRW'6öæÖ6&B7v—F6‚â6öæf—&ÒF†BÖVÖ÷'’W'6öæVæ&ÆVB&VÖ–ç2öfbFòfö–BGWÆ–6FR–FVçF—G’–ç7G'V7F–öç2â"Â&÷fW'f–Wrçv&æ–æræÖ&¶F÷våF—FÆR#¢$Ö&¶F÷vâ&ö¦V7F–öâ—2Væf–Æ&ÆR"Â&÷fW'f–Wrçv&æ–æræÖ&¶F÷våFW‡B#¢%F†RfÆ–FFVB¥4ôâ&Wf—6–öâ&VÖ–ç27F—fRâ6†V6²F†RÇVv–âFFF—&V7F÷'’æB6fRv–âFò&VvVæW&FR4õTÂæÖBæB7G–ÆRf–ÆW2â"Â&F–væ÷7F–72ç7FvTæ÷FUFW‡B#¢$E4‚&W7F÷&W2&Vv—7FW&VB6ö×ÆWFR6V7F–öâgFW"F†R76VÖ&Ç’vFW&fÆÂÂ6òf–æÂ&ö×Bf—6–&–Æ—G’6ææ÷B&R&÷fVâg&öÒF†R6V7F–öâ6ÆÆ&6²ÆöæRâW'6öæ&Vv—7FW'2æò6ö×ÆWFR6V7F–öã²F†Rf–æÂ6V7F–öâÆ—7B—2VçfW&–f–VBVæÆW72G'W7FVB†÷7B6†V6²&W÷'G2—Bâ"Â&F–væ÷7F–72æÆ–Ö—FF–öâæf–æÅf—6–&–Æ—G’#¢&f–æÂ&ö×Bf—6–&–Æ—G’—2VçfW&–f–VBv†Vâæ÷F†W"&W6WB7WÆ–W26ö×ÆWFR7—7FVÒ&ö×B6V7F–öâ"Â&F–væ÷7F–72æÆ–Ö—FF–öâç66VæR#¢%&V&–æF–ær&WV—&W27W'&VçBWF†÷&—¦VB66VæR–âF†R&÷VæBv÷&·76S²7F—fR–æ¦V7F–öâÇ6ò&WV—&W2G'W7FVB6W76–öâÖ–ær"Â&F–væ÷7F–72æÆ–Ö—FF–öâçFö¶Vä6÷VçG2#¢'Fö¶Vâ6÷VçG2&R†WW&—7F–2W7F–ÖFW2Âæ÷BFö¶Væ—¦W"ÖW†7B"Â&6&–Æ—G’ç&Vv—7FW'5FööÇ2#¢%&Vv—7FW'2FööÇ2‡&Vv—7FW'5FööÇ2’"Â&6&–Æ—G’æÖöF–f–W5FööÇ2#¢$ÖöF–f–W2FööÇ2†ÖöF–f–W5FööÇ2’"Â&6&–Æ—G’ç6VÆV7G5&W6WB#¢%6VÆV7G2&W6WB‡6VÆV7G5&W6WB’"Â&6&–Æ—G’æÖöF–f–W5'VçF–ÖT6öçFW‡B#¢$ÖöF–f–W2'VçF–ÖR6öçFW‡B†ÖöF–f–W5'VçF–ÖT6öçFW‡B’"Â&6&–Æ—G’ç&VG4ÖVÖ÷'’#¢%&VG2ÖVÖ÷'’‡&VG4ÖVÖ÷'’’"Â&6&–Æ—G’ç&VG4Æ–fR#¢%&VG2Æ–fR‡&VG4Æ–fR’"Â&6&–Æ—G’ç&VG57FFR#¢%&VG27FFR‡&VG57FFR’"Â&6&–Æ—G’æ6†ævW5W&Ö—76–öç2#¢$6†ævW2W&Ö—76–öç2†6†ævW5W&Ö—76–öç2’"Â&F–væ÷7F–72çG'W7FVE6W76–öç2#¢'¶6÷VçGÒG'W7FVB6W76–öç2"Â&F–væ÷7F–72æ6öæf–wW&VE6V7F–öç2#¢$6öæf–wW&VB6V7F–öç2"Â&F–væ÷7F–72æ†÷7DvÆö&Â#¢$†÷7BÖvÆö&Â&Vv—7G&F–öâ"Â&F–væ÷7F–72æ6ÆÆ&6´Wf–FVæ6R#¢$6ÆÆ&6²Wf–FVæ6R"Â&F–væ÷7F–72æödö'6W'fVB#¢&öb·F÷FÇÒö'6W'fVB76VÖ&Æ–W2"Â&F–væ÷7F–72æf–æÅf—6–&–Æ—G’#¢$f–æÂf—6–&–Æ—G’"Â&F–væ÷7F–72æW‡Æ–6—D6†V6²#¢$W‡Æ–6—B†÷7B76VÖ&Ç’6†V6²"Â&F–væ÷7F–72ææôf–æÄ6†V6²#¢$æòf–æÂ†÷7B6†V6²–WB"Â&F–væ÷7F–72çf—6–&–Æ—G”ÖöFVÂ#¢%f—6–&–Æ—G’ÖöFVÂ"Â&F–væ÷7F–72ç&Vg&W6‚#¢%&Vg&W6‚F–væ÷7F–72"Â&F–væ÷7F–72æ6öæf–wW&VD&FvR#¢$6öæf–wW&VB"Â&F–væ÷7F–72æ6öæf–wW&VD&öG’#¢$W†7FÇ’Gvò†÷7BÖvÆö&Â6V7F–öç2&R&Vv—7FW&VBv—F‚Ç7â6Æ73ÕÂ&ÖöæõÂ#æ–çFW'öÆFS¢fÇ6SÂ÷7ãâæBÇ7â6Æ73ÕÂ&ÖöæõÂ#æ6ö×ÆWFS¢fÇ6SÂ÷7ãââ"Â&F–væ÷7F–72æ6ÆÆ&6´&FvR#¢$6ÆÆ&6²"Â&F–væ÷7F–72æ6ÆÆ&6´ö'6W'fVBæöæR#¢#ö'6W'fVB76VÖ&Ç’–çfö¶VBBÆV7BöæR6V7F–öâ6ÆÆ&6²â"Â&F–væ÷7F–72æ6ÆÆ&6´ö'6W'fVBæ÷F†W"#¢'¶6÷VçGÒö'6W'fVB76VÖ&Æ–W2–çfö¶VBBÆV7BöæR6V7F–öâ6ÆÆ&6²â"Â&F–væ÷7F–72æ6ÆÆ&6´æöæR#¢$æò6V7F–öâ6ÆÆ&6²†2&VVâö'6W'fVB6–æ6RF†RÇVv–âÖ÷VçFVBâ"Â&F–væ÷7F–72æ6ÆÆ&6´æ÷FR#¢$6ÆÆ&6²'Vâ—2æ÷B&ööbF†BF†Rf–æÂ&ö×B&WF–æVBF†RFW‡Bâ"Â&F–væ÷7F–72æf–æÅ&ö×D&FvR#¢$f–æÂ&ö×B"Â&F–væ÷7F–72æ†÷7D6†V6²#¢$†÷7B6†V6³¢·7FGW7Òâ"Â&F–væ÷7F–72çVçfW&–f–VD'”†÷7B#¢%VçfW&–f–VB'’F†R†÷7Bâ"Â&F–væ÷7F–72æf–æÅ&ö×D&öG’#¢%6VÆV7Bâö'6W'fVBÆ—fR6W76–öâæB'VââW‡Æ–6—Bf–æÂ76VÖ&Ç’6†V6²âE4‚Ö’&W7F÷&R÷"÷fW'&–FR6V7F–öç2gFW"F†R76VÖ&Ç’vFW&fÆÂâ"Â&F–væ÷7F–72ç7FvTæ÷FUF—FÆR#¢%7FvRæ÷FR"Â&F–væ÷7F–72æö'6W'fVD76VÖ&Æ–W2#¢$ö'6W'fVB76VÖ&Æ–W2"Â&F–væ÷7F–72ç6VÆV7E&÷r#¢%6VÆV7B&÷rf÷"6æ—F—¦VBFWF–Â"Â&F–væ÷7F–72æV×G”6öæf–wW&VB#¢$æò6öæf–wW&VB6V7F–öç2&W÷'FVBâ"Â&F–væ÷7F–72æV×G”ö'6W'fF–öç2#¢$æòÖöFVÂ76VÖ&Ç’†2&VVâö'6W'fVB6–æ6RF†RÇVv–âÖ÷VçFVBâF†—2—2æ÷BWf–FVæ6RF†B–æ¦V7F–öâv÷&·2÷"f–Ç2â"Â&F–væ÷7F–72ç6VÆV7FVDö'6W'fF–öâ#¢%6VÆV7FVBö'6W'fF–öâ"Â&F–væ÷7F–72æ6ÆÆ&6´ö'6W'fVD&FvR#¢$6ÆÆ&6²ö'6W'fVB"Â&F–væ÷7F–72ææô6ÆÆ&6´&FvR#¢$æò6ÆÆ&6²ö'6W'fVB"Â&F–væ÷7F–72æFWF–Äæ÷FR#¢%F†W6R&R&W6öÇfW"ö'6W'fF–öç2Âæ÷BGV×öbF†Rf–æÂ7—7FVÒ&ö×Bâ6ÆÆ&6²–çfö6F–öâöæÇ’&÷fW2F†R6V7F–öâFW‡BgVæ7F–öâ&ã²æ÷F†W"&W6WBw26ö×ÆWFR6V7F–öâ6â7F–ÆÂ÷fW'&–FR—BÆFW"â"Â&F–væ÷7F–72ç&ö&T'WGFöâ#¢$6†V6²f–æÂ†÷7B76VÖ&Ç’f÷"F†—2Æ—fR6W76–öâ"Â&F–væ÷7F–72æf–æÄ6†V6²#¢$f–æÂ6†V6³¢·7FGW7Ò+r·&V6öçÒ+r6÷&R¶6÷&WÒ+r7G–ÆR·7G–ÆWÒâæò&ö×BFW‡B—2&WGW&æVBâ"Â&F–væ÷7F–72çf—6–&ÆR#¢'f—6–&ÆR"Â&F–væ÷7F–72æ'6VçB#¢&'6VçB"Â&F–væ÷7F–72ææ÷DW‡V7FVB#¢&æ÷BW‡V7FVB"Â&F–væ÷7F–72æ6&–Æ—G•F—FÆR#¢$6&–Æ—G’&÷VæF'’&W÷'FVB'’F†R6W'f–6R"Â&F–væ÷7F–72æ6&–Æ—G”æ÷FR#¢%F†W6RfÆw2FW67&–&Rv†BW'6öæ&Vv—7FW'2âF†W’Fòæ÷BfW&–g’F†Rf–æÂFööÂÆ—7B÷"ÖöFVÂ&V†f–÷"â"Â&F–væ÷7F–72ææô6&–Æ—F–W2#¢$æò6&–Æ—F–W2&W÷'FVB"Â&F–væ÷7F–72æÆ–Ö—FF–öç5F—FÆR#¢$¶æ÷vâÆ–Ö—FF–öç2"Â&F–væ÷7F–72ææôÆ–Ö—FF–öç2#¢$æòÆ–Ö—FF–öç2&W÷'FVB'’F†R6W'f–6Râ"Â&F–væ÷7F–72æW'&÷%F—FÆR#¢$F–væ÷7F–72W'&÷""Â&F–væ÷7F–72ææõ&W6WB#¢&æò&W6WB"Â&F–væ÷7F–72çF&ÆRç6V7F–öâ#¢%6V7F–öâ"Â&F–væ÷7F–72çF&ÆRæ÷&FW"#¢$÷&FW""Â&F–væ÷7F–72çF&ÆRæ–çFW'öÆFR#¢$–çFW'öÆFR"Â&F–væ÷7F–72çF&ÆRæ6ö×ÆWFR#¢$6ö×ÆWFR"Â&F–væ÷7F–72çF&ÆRç&Vv—7FW&VB#¢%&Vv—7FW&VB"Â&F–væ÷7F–72çF&ÆRæö'6W'fVDB#¢$ö'6W'fVBB"Â&F–væ÷7F–72çF&ÆRç6W76–öâ#¢%6W76–öâ"Â&F–væ÷7F–72çF&ÆRç6÷W&6TÖöFR#¢%6÷W&6R+rÖöFR"Â&F–væ÷7F–72çF&ÆRæ6÷&T6ÆÆ&6²#¢$6÷&R6ÆÆ&6²"Â&F–væ÷7F–72çF&ÆRç66VæT6ÆÆ&6²#¢%66VæR6ÆÆ&6²"Â&F–væ÷7F–72çF&ÆRç&V6öâ#¢%&V6öâ"Â&F–væ÷7F–72æFWF–Âæö'6W'fVDB#¢$ö'6W'fVBB"Â&F–væ÷7F–72æFWF–Âç6W76–öâ#¢%6W76–öâ"Â&F–væ÷7F–72æFWF–ÂævVçE&W6WB#¢$vVçB&W6WB"Â&F–væ÷7F–72æFWF–Âçv÷&·76R#¢%v÷&·76R"Â&F–væ÷7F–72æFWF–ÂçÖ–ær#¢%Ö–ær"Â&F–væ÷7F–72æFWF–Âç6÷W&6R#¢%6÷W&6R"Â&F–væ÷7F–72æFWF–Âæ&–æF–æt¶W’#¢$&–æF–ær¶W’"Â&F–væ÷7F–72æFWF–ÂæÖöFU7G–ÆR#¢$ÖöFR+r7G–ÆR"Â&F–væ÷7F–72æFWF–Âæ6÷&T6ÆÆ&6²#¢$6÷&R6ÆÆ&6²"Â&F–væ÷7F–72æFWF–Âç66VæT6ÆÆ&6²#¢%66VæR6ÆÆ&6²"Â&F–væ÷7F–72æFWF–Âæ6÷&T–æ¦V7FVB#¢$6öæf–wW&VB6÷&R–æ¦V7FVB"Â&F–væ÷7F–72æFWF–Âç7G–ÆT–æ¦V7FVB#¢$6öæf–wW&VB7G–ÆR–æ¦V7FVB"Â&F–væ÷7F–72æFWF–Âç&W6öÇWF–öå&V6öâ#¢%&W6öÇWF–öâ&V6öâ"Â&F–væ÷7F–72æFWF–Âç7FFU&Wf—6–öâ#¢%7FFR&Wf—6–öâ"Â&F–væ÷7F–72æ–çfö¶VB#¢$–çfö¶VB"Â&F–væ÷7F–72ææ÷Dö'6W'fVB#¢$æ÷Bö'6W'fVB"Â&F–væ÷7F–72ç7FGW2çVçfW&–f–VB#¢%VçfW&–f–VB‡VçfW&–f–VB’"Â&F–væ÷7F–72ç7FGW2çf—6–&ÆR#¢%f—6–&ÆR‡f—6–&ÆR’"Â&F–væ÷7F–72ç7FGW2æ÷fW'&–FFVâ#¢$÷fW'&–FFVâ†÷fW'&–FFVâ’"Â&F–væ÷7F–72ç7FGW2çVæf–Æ&ÆR#¢%Væf–Æ&ÆR‡Væf–Æ&ÆR’"Â&F–væ÷7F–72æÖöFRææöæR#¢$æöæR†æöæR’"Â&F–væ÷7F–72æÖöFRæ–æ†W&—B#¢$–æ†W&—B†–æ†W&—B’"Â&F–væ÷7F–72æÖöFRæ6÷&RÖöæÇ’#¢$6÷&RöæÇ’†6÷&RÖöæÇ’’"Â&F–væ÷7F–72æÖöFRç7G–ÆR#¢%7G–ÆR‡7G–ÆR’"Â&F–væ÷7F–72ç6÷W&6RææöæR#¢$æöæR†æöæR’"Â&F–væ÷7F–72ç6÷W&6RçÖ&–æF–ær#¢%&–æF–ær‡Ö&–æF–ær’"Â&F–væ÷7F–72ç6÷W&6Rç6W76–öâÖ&–æF–ær#¢%6W76–öâ&–æF–ær‡6W76–öâÖ&–æF–ær’"Â&F–væ÷7F–72ç6÷W&6Rçv÷&·76RÖFVfVÇB#¢%v÷&·76RFVfVÇB‡v÷&·76RÖFVfVÇB’"Â&F–væ÷7F–72ç7FFRçfW&–f–VB#¢%fW&–f–VB‡fW&–f–VB’"Â&F–væ÷7F–72ç7FFRæ–çfÆ–B#¢$–çfÆ–B†–çfÆ–B’"Â&F–væ÷7F–72ç7FFRçVæf–Æ&ÆR#¢%Væf–Æ&ÆR‡Væf–Æ&ÆR’"Â&F–væ÷7F–72ç7FFRææ÷Eö6†V6¶VB#¢$æ÷B6†V6¶VB†æ÷Eö6†V6¶VB’"Â&ÆöF–æræW–V'&÷r#¢$UD„TåD”4DTBõtäU"5U$d4R"Â&ÆöF–ærçF—FÆR#¢$ÆöF–ærW'6öæ7FF^(
b"Â&ÆöF–æræ&öG’#¢%&VF–ærF†Rv÷&·76R&Vv—7G'’Â6&G2Â&–æF–æw2ÂF–væ÷7F–72ÂæB&6·WÖWFFFg&öÒF†R†÷7Bâæ÷F†–ær—27F÷&VB–âF†—2'&÷w6W"â"Â'Væf–Æ&ÆRçF—FÆR#¢%W'6öæFF—2Væf–Æ&ÆR"Â'Væf–Æ&ÆRæ&öG’#¢%F†R6öç6öÆR6÷VÆBæ÷BÆöBF†R†÷7B’â6†V6²E4‚÷væW"FÖ—76–öâæB7F÷&vR†VÇF‚ÂF†Vâ&WG'’â"Â'Væf–Æ&ÆRç&WG'’#¢%&WG'’"Â&&ææW"æ÷væW%&WV—&VEF—FÆR#¢$÷væW"66W72—2&WV—&VBâ"Â&&ææW"æ÷væW%&WV—&VD&öG’#¢%F†R6öç6öÆRF–Bæ÷B72E4‚÷væW"FÖ—76–öââ&VBÖöæÇ’FFÖ’&R7FÆS²w&—FW2&RF—6&ÆVBVçF–Â–÷R÷VâF†R6öç6öÆRg&öÒâWF†VçF–6FVBE4‚vRâ"Â&&ææW"æ†÷7Df–ÆVEF—FÆR#¢$†÷7B&WVW7Bf–ÆVBâ"Â&&ææW"æ6öæfÆ–7EF—FÆR#¢$†÷7B&Wf—6–öâ6†ævVBƒC’’â"Â&&ææW"æ6öæfÆ–7E&Wf—6–öâ#¢$7W'&VçB†÷7B&Wf—6–öã¢Ç7â6Æ73ÕÂ&ÖöæõÂ#ç'·&Wf—6–öçÓÂ÷7ãââ"Â&&ææW"æ6öæfÆ–7D¶VWG&gB#¢%–÷W"G&gB&VÖ–ç2–âF†—2F"â"Â&&ææW"æ¶VWG&gB#¢%&VÆöBÆFW7BÂ¶VWG&gB"Â&&ææW"ç&VÆöB#¢%&VÆöBÆFW7B"Â&&ææW"ç&VÆöD†÷7B#¢%&VÆöB†÷7BFF"Â&&ææW"æF—66&DG&gB#¢"bF—66&BG&gB"Â&&ææW"æF—6Ö—72#¢$F—6Ö—72"Â&F–Æöræ6Æ÷6R#¢$6Æ÷6R"Â&F–Æöræ6æ6VÂ#¢$6æ6VÂ"Â&F–ÆöræFVÆWFU7G–ÆR#¢$FVÆWFR7G–ÆR"Â&F–Æörç&VÖ÷fT&–æF–ær#¢%&VÖ÷fR&–æF–ær"Â&F–Æörç&W7F÷&T&6·W#¢%&W7F÷&R&6·W"Â&F–Æörç&öÆÄ&6²#¢%&öÆÂ&6²"Â&F–Æörç&W7F÷&R#¢%&W7F÷&R&6·W"Â&ÖöFÂçfW'6–öä†—7F÷'’#¢%fW'6–öâ†—7F÷'’"Â&ÖöFÂçfW'6–öä†—7F÷'”&öG’#¢%&öÆÆ–ær&6²7&VFW2æWr&Wf—6–öââF†R7W'&VçBfW'6–öâ—2&WF–æVB–â†—7F÷'’Â6òF†R7F–öâ—2&WfW'6–&ÆRâ"Â&ÖöFÂææõ&–÷%fW'6–öç2#¢$æò&–÷"fW'6–öç2&R7F÷&VBf÷"F†—26&B–WBâ"Â&ÖöFÂæ†—7F÷'”VçG'’#¢'¶7F–öçÒ+r'·&Wf—6–öçÒ"Â&ÖöFÂæ†—7F÷'”ÖWF#¢'¶FFWÒ+r6&B&Wf—6–öâ·&Wf—6–öçÒ"Â&ÖöFÂæFVÆWFU7G–ÆUF—FÆR#¢$FVÆWFR(	Ç¶æÖWŞ(	Óò"Â&ÖöFÂæFVÆWFU7G–ÆT&öG’#¢%F†—2W&ÖæVçFÇ’&VÖ÷fW2F†R7G–ÆR6&Bâ¶ffV7FVG×¶FVfVÇDæ÷FWÒW†—7F–ær6W76–öç2ÂvVçB&W6WG2ÂFööÇ2ÂæBW&Ö—76–öç2&Ræ÷B6†ævVBâ"Â&ÖöFÂæFVÆWFU7G–ÆTæôffV7FVB#¢$æòW‡Æ–6—B7G–ÆR&–æF–ær7W'&VçFÇ’&VfW&Væ6W2—Bâ"Â&ÖöFÂæFVÆWFU7G–ÆTffV7FVBæöæR#¢#W‡Æ–6—B&–æF–ærv–ÆÂfÆÂ&6²Fò–æ†W&—Bâ"Â&ÖöFÂæFVÆWFU7G–ÆTffV7FVBæ÷F†W"#¢'¶6÷VçGÒW‡Æ–6—B&–æF–æw2v–ÆÂfÆÂ&6²Fò–æ†W&—Bâ"Â&ÖöFÂæFVÆWFU7G–ÆTFVfVÇB#¢$—B—2Ç6òF†Rv÷&·76RFVfVÇBÂ6òF†RFVfVÇB&W6WG2Fò6÷&RÖöæÇ’â"Â&ÖöFÂç&VÖ÷fT&–æF–æuF—FÆR#¢%&VÖ÷fRF†—2W‡Æ–6—B&–æF–æsò"Â&ÖöFÂç&VÖ÷fT&–æF–æt&öG’#¢%F†RF&vWBv–ÆÂfÆÂ&6²FòF†Rv÷&·76RFVfVÇB‡¶FVfVÇE7G–ÆWÒ’–ç7FVBöb—G2W‡Æ–6—B(	Ç¶ÖöFWŞ(	Ò6WGF–ærâ6W76–öç2ÂWF†VçF–6F–öâÂFööÇ2ÂæBW&Ö—76–öç2&RVçF÷V6†VBâ"Â&ÖöFÂç&W7F÷&T&öG’#¢%&W7F÷&RF†R6öæf–wW&F–öâ6GW&VBB&Wf—6–öâ·&Wf—6–öçÒ‡¶FFWÒ“ò7W'&VçB6öæf–wW&F–öâ—2&WÆ6VBÂ'WB&R×&W7F÷&R6fWG’&6·W—2w&—GFVâf—'7BâæòE4‚6W76–öâÂvVçB&W6WBÂFööÂÂ÷"W&Ö—76–öâ—26†ævVBâ"Â&ÖöFÂçG—U&W7F÷&R#¢%G—R$U5Dõ$RFò6öæf—&Ò"Â&ÖöFÂç&W7F÷&UÆ6V†öÆFW"#¢%$U5Dõ$R"Â'Fö7Bæ6ææ÷E6fR#¢$6ææ÷B6fR"Â'Fö7BçW'6öæ6fVB#¢%W'6öæ6fVB"Â'Fö7BçW'6öæ6fVDFWF–Â#¢$6†ævW2F¶RVffV7BBF†RæW‡BÖöFVÂ76VÖ&Ç“²æò6W76–öâ—2&V7&VFVBâ"Â'Fö7BæG&gDF—66&FVB#¢$G&gBF—66&FVB"Â'Fö7BæG&gDF—66&FVDFWF–Â#¢%F†RVF—F÷"æ÷r6†÷w2F†R†÷7BfW'6–öââ"Â'Fö7Bç7G–ÆT6÷–VB#¢%7G–ÆR6÷–VB"Â'Fö7Bç7G–ÆT6÷–VDFWF–Â#¢%F†R6÷’—2æWr7F&ÆR6&BâW†—7F–ær&–æF–æw27F–ÆÂ&VfW&Væ6RF†V—"÷&–v–æÂ7G–ÆRâ"Â'Fö7Bç7G–ÆTFVÆWFVB#¢%7G–ÆRFVÆWFVB"Â'Fö7Bç7G–ÆTFVÆWFVDFWF–ÂæöæR#¢#&–æF–ærfVÆÂ&6²Fò–æ†W&—G¶FVfVÇE&W6WGÒâ"Â'Fö7Bç7G–ÆTFVÆWFVDFWF–Âæ÷F†W"#¢'¶6÷VçGÒ&–æF–æw2fVÆÂ&6²Fò–æ†W&—G¶FVfVÇE&W6WGÒâ"Â'Fö7BæFVfVÇE&W6WE7Vff—‚#¢#²F†RFVfVÇB7G–ÆRv2&W6WBFò6÷&RÖöæÇ’"Â'Fö7Bç&öÆÆ&6´6öÖÖ—GFVB#¢%&öÆÆ&6²6öÖÖ—GFVB"Â'Fö7Bç&öÆÆ&6´6öÖÖ—GFVDFWF–Â#¢%F†R&W7F÷&VB6&B—2æWr&Wf—6–öã²&–÷"†—7F÷'’—2&WF–æVBâ"Â'Fö7Bæ&–æF–æu6fVB#¢$&–æF–ær6fVB"Â'Fö7Bæ&–æF–æu6fVDFWF–Â#¢%F†R†÷7B&WfÆ–FFVBF†RF&vWBv–ç7B7W'&VçBÖVÖ&W'6†—æBG'W7Bâ"Â'Fö7Bæ&–æF–æu&VÖ÷fVB#¢$&–æF–ær&VÖ÷fVB"Â'Fö7Bæ&–æF–æu&VÖ÷fVDFWF–Â#¢%F†—2F&vWBæ÷r–æ†W&—G2F†Rv÷&·76RFVfVÇBâ"Â'Fö7Bæ6ææ÷E6fT&–æF–ær#¢$6ææ÷B6fR&–æF–ær"Â'Fö7Bç7V&vVçDW†6ÇVFVB#¢%7V&vVçB6W76–öç2&RW†6ÇVFVBg&öÒW'6öæâ"Â'Fö7Bææõv÷&·76R#¢$æòv÷&·76R&÷VæB"Â'Fö7Bæ&–æEv÷&·76Tf—'7B#¢$&–æBv÷&·76R&Vf÷&R6f–ær&–æF–ærâ"Â'Fö7Bç6VÆV7E7G–ÆR#¢%6VÆV7B7G–ÆR"Â'Fö7Bç6VÆV7E7G–ÆTFWF–Â#¢$7G–ÆR&–æF–ær&WV—&W2âW†—7F–ær7G–ÆR6&Bâ"Â'Fö7Bç&W6WDG&gB#¢%&W6WBG&gB"Â'Fö7Bç&W6WDG&gDFWF–Â#¢%F†RG&gBæ÷r–æ†W&—G2F†Rv÷&·76RFVfVÇBâ6fRF†R&–æF–ærFò6öÖÖ—Bâ"Â'Fö7Bçv÷&·76UWFFVB#¢%v÷&·76RWFFVB"Â'Fö7Bçv÷&·76UWFFVDFWF–Â#¢'¶6÷VçGÒöÆB&–æF–æw2&6†—fVBâ&6·W¢¶&6·WÒâ6÷&RæB7G–ÆR6&G2&VÖ–ââ"Â'Fö7BæFVfVÇE7G–ÆUWFFVB#¢$FVfVÇB7G–ÆRWFFVB"Â'Fö7BæFVfVÇE7G–ÆUWFFVDFWF–Â#¢%F&vWG2F†BW‡Æ–6—FÇ’6VÆV7B7G–ÆR&RVæffV7FVBâ"Â'Fö7Bæ–æ¦V7F–öäVæ&ÆVB#¢$–æ¦V7F–öâVæ&ÆVB"Â'Fö7Bæ–æ¦V7F–öäF—6&ÆVB#¢$–æ¦V7F–öâF—6&ÆVB"Â'Fö7Bæ–æ¦V7F–öäFWF–Â#¢$6†ævW2Ç’BF†RæW‡BÖöFVÂ76VÖ&Ç“²æò6W76–öâ—2&V7&VFVBâ"Â'Fö7Bæ&6·W7&VFVB#¢$&6·W7&VFVB"Â'Fö7Bæ&6·W7&VFVDFWF–Â#¢$&6·W¶–GÒ6GW&VB&Wf—6–öâ·&Wf—6–öçÒâ"Â'Fö7Bæ&6·W7&VFVDfÆÆ&6²#¢%F†R†÷7Bw&÷FRfÆ–FFVB&6·Wâ"Â'Fö7Bæ&6·W&W7F÷&VB#¢$&6·W&W7F÷&VB"Â'Fö7Bæ&6·W&W7F÷&VDFWF–Â#¢$&R×&W7F÷&R6fWG’&6·Wv2w&—GFVâf—'7C²†—7F÷'’v2&WF–æVBâ"Â'Fö7Bæ†÷7E&Vg&W6†VB#¢$†÷7BFF&Vg&W6†VB"Â'Fö7BæG&gD¶WB#¢%–÷W"Vç6fVBG&gBv2¶WBâ"Â'Fö7BæÆFW7DÆöFVB#¢$ÆFW7B†÷7BFFÆöFVB"Â'Fö7BæG&gD¶WE&Wf–Wr#¢%–÷W"G&gB—2&W6W'fVBâ&Wf–Wr—BÂF†Vâ6fRv–ââ"Â'Fö7Bæ6öæfÆ–7DG&gG4F—66&FVB#¢%Vç6fVB6öæfÆ–7BG&gG2vW&RF—66&FVBâ"Â'Fö7Bç7G–ÆTæ÷Df÷VæB#¢%7G–ÆRæ÷Bf÷VæB"Â'Fö7Bç7G–ÆTæ÷Df÷VæDFWF–Â#¢%&VÆöBF†RÆ–'&'’æBG'’v–ââ"Â'Fö7BçF&vWEVæf–Æ&ÆR#¢%F&vWBVæf–Æ&ÆR"Â'Fö7BçF&vWEVæf–Æ&ÆTFWF–Â#¢%&Vg&W6‚F†R†÷7BFFæBG'’v–ââ"Â'Fö7Bçv÷&·76UVæf–Æ&ÆR#¢%v÷&·76RVæf–Æ&ÆR"Â'Fö7Bçv÷&·76UVæf–Æ&ÆTFWF–Â#¢%&Vg&W6‚F†Rv÷&·76RÆ—7BæB6†ö÷6R7W'&VçBv÷&·76Râ"Â'Fö7Bææô6†ævR#¢$æò6†ævR"Â'Fö7Bææô6†ævTFWF–Â#¢%F†Bv÷&·76R—2Ç&VG’&÷VæBâ"Â'Fö7Bç7G–ÆUVæf–Æ&ÆR#¢%7G–ÆRVæf–Æ&ÆR"Â'Fö7Bç7G–ÆUVæf–Æ&ÆTFWF–Â#¢$6†ö÷6RâW†—7F–ær7G–ÆRâ"Â'Fö7Bæ6öæf—&ÖF–öå&WV—&VB#¢$6öæf—&ÖF–öâ&WV—&VB"Â'Fö7Bæ6öæf—&ÖF–öå&WV—&VDFWF–Â#¢%G—R$U5Dõ$RW†7FÇ’Fò&W7F÷&R&6·Wâ"Â'Fö7Bæf–æÄ6†V6µVæf–Æ&ÆR#¢$f–æÂ6†V6²Væf–Æ&ÆR"Â'Fö7Bæ†÷7D6†V6´f–ÆVB#¢$†÷7B6†V6²f–ÆVBâ"Â'Fö7Bæ&6·Wæ÷Df÷VæB#¢$&6·Wæ÷Bf÷VæB"Â'Fö7Bæ&6·Wæ÷Df÷VæDFWF–Â#¢%&Vg&W6‚F†R&6·WÆ—7BæBG'’v–ââ"Â'Fö7BæF—66&DVF—F÷$6öæf—&Ò#¢$F—66&BF†RVç6fVBG&gBæB&VÆöBF†—26&Bg&öÒF†R†÷7Cò"Â'Fö7BæF—66&D6&D6öæf—&Ò#¢$F—66&BF†RVç6fVBW'6öæG&gCò"Â'Fö7BæF—66&DæWu7G–ÆT6öæf—&Ò#¢$F—66&BF†R7W'&VçBVç6fVBW'6öæG&gBæB7&VFRæWr7G–ÆSò"Â'Fö7BæF—66&D&–æF–æt6öæf—&Ò#¢$F—66&BF†RVç6fVB&–æF–ærG&gCò"Â'Fö7BæÆVfTVF—F÷$6öæf—&Ò#¢%F†RW'6öæVF—F÷"†2Vç6fVB6†ævW2âÆVfRæB¶VWF†RG&gB–âF†—2F#ò"Â'Fö7BæÆVfT&–æF–æt6öæf—&Ò#¢%F†R&–æF–ær†2Vç6fVB6†ævW2âÆVfRæB¶VWF†RG&gB–âF†—2F#ò"Â'Fö7Bæ6÷•6fVDöæÇ’#¢%F†R6÷’W6W2F†RÆ7B6fVBfW'6–öâÂæ÷BVç6fVBVF—G2â6öçF–çVSò"Â'Fö7BæFVÆWFU6fVDöæÇ’#¢%F†R6fVB7G–ÆR—2FVÆWFVC²Vç6fVBG&gBFW‡B–âF†—2VF—F÷"—2æ÷B–æ6ÇVFVBâ6öçF–çVSò"Â'Fö7Bç&öÆÆ&6´6öæf—&Ò#¢%&öÆÂ&6²F†—26&BFòF†R6VÆV7FVB†—7F÷'’fW'6–öãòæWr&Wf—6–öâ—27&VFVBæBF†R7W'&VçBfW'6–öâ&VÖ–ç2–â†—7F÷'’â"Â'Fö7Bæ&–æEv÷&·76T6öæf—&Ò#¢%7v—F6‚Fò·v÷&·76WÓòF†RöÆBv÷&·76R7F÷2&V6V—f–ærW'6öæâ¶6÷VçGÒöÆB&–æF–æw2v–ÆÂ&R&6¶VBWÂF†Vâ6ÆV&VBg&öÒ7F—fR6öæf–wW&F–öââF†RæWrv÷&·76R&Vv–ç2BF†RæW‡BÖöFVÂ76VÖ&Ç’âæò6W76–öç2&RFVÆWFVBâ"Â&W'&÷"æWF‚#¢$÷væW"WF†VçF–6F–öâv2æ÷B66WFVBâ÷VâF†—26öç6öÆRg&öÒâWF†VçF–6FVBE4‚6WGF–æw2vRâ"Â&W'&÷"çVæf–Æ&ÆR#¢%W'6öæÖævVÖVçB—2Væf–Æ&ÆRâ6†V6²F†RE4‚6öææV7F–öâ6W'f–6RæB7F÷&vR†VÇF‚â"Â&W'&÷"æ6öæfÆ–7B#¢$æ÷F†W"WF†VçF–6FVBv–æF÷r6†ævVBW'6öæâ&VÆöBF†RÆFW7B&Wf—6–öâ&Vf÷&R&WG'––ærâ"Â&W'&÷"ææ÷Df÷VæB#¢%F†R&WVW7FVBW'6öæ—FVÒv2æ÷Bf÷VæBâ"Â&W'&÷"ææWGv÷&²#¢%F†R6öç6öÆR6÷VÆBæ÷B&V6‚F†RE4‚†÷7B’â"Â&W'&÷"ævVæW&–2#¢%F†RW'6öæ&WVW7Bf–ÆVBâ"Â&W'&÷"æ–çfÆ–B#¢%F†R†÷7B&V¦V7FVBF†R&WVW7Bâ6†V6²F†R–çWBæBG'’v–ââ"Â&W'&÷"ç7F÷&vR#¢%W'6öæ7F÷&vR—2Væf–Æ&ÆRâ–æ¦V7F–öâf–Ç26Æ÷6VBâ"Â&W'&÷"æÖWF†öB#¢%F†B÷W&F–öâ—2æ÷BÆÆ÷vVBâ"Â&W'&÷"æVæGö–çB#¢%F†R&WVW7FVBW'6öæVæGö–çBFöW2æ÷BW†—7Bâ"Â&W'&÷"çVç&VF&ÆR#¢%F†R†÷7B&WGW&æVBâVç&VF&ÆR&W7öç6R„…EE·7FGW7Ò’â"Â&W'&÷"ç&WVW7Df–ÆVB#¢%F†R&WVW7Bf–ÆVB„…EE·7FGW7Ò’â"Â&W'&÷"æ6öFU7Vff—‚#¢"†6öFR¶6öFWÒ’"Â&W'&÷"æ6öFRåU%4ôäôUD…õ$UT•$TB#¢$÷væW"WF†VçF–6F–öâv2æ÷B66WFVBâ÷VâF†—26öç6öÆRg&öÒâWF†VçF–6FVBE4‚6WGF–æw2vRâ"Â&W'&÷"æ6öFRåU%4ôäôÔätTÔTåEõTäd”Ä$ÄR#¢%W'6öæÖævVÖVçB—2Væf–Æ&ÆRâ6†V6²F†RE4‚6öææV7F–öâ6W'f–6Râ"Â&W'&÷"æ6öFRåU%4ôäô4ôädÄ”5B#¢$æ÷F†W"WF†VçF–6FVBv–æF÷r6†ævVBW'6öæâ&VÆöBF†RÆFW7B&Wf—6–öâ&Vf÷&R&WG'––ærâ"Â&W'&÷"æ6öFRåU%4ôäôäõEôdõTäB#¢%F†R&WVW7FVBW'6öæ—FVÒv2æ÷Bf÷VæBâ"Â&W'&÷"æ6öFRåU%4ôäô”ådÄ”B#¢%F†R†÷7B&V¦V7FVBF†R&WVW7Bâ6†V6²F†R–çWBæBG'’v–ââ"Â&W'&÷"æ6öFRåU%4ôäõ5Dõ$tUõTäd”Ä$ÄR#¢%W'6öæ7F÷&vR—2Væf–Æ&ÆRâ–æ¦V7F–öâf–Ç26Æ÷6VBâ"Â&W'&÷"æ6öFRåU%4ôäô”åDU$äÂ#¢$â–çFW&æÂW'&÷"ö67W'&VBv†–ÆRF†R†÷7B†æFÆVBF†RW'6öæ&WVW7Bâ6†V6²F†R†÷7BÆöw2â"Â&W'&÷"æ6öFRåU%4ôäôTäEô”åEõTä´äõtâ#¢%F†R&WVW7FVBW'6öæVæGö–çBFöW2æ÷BW†—7Bâ"Â&W'&÷"æ6öFRåU%4ôäôÔUD„ôEôäõEôÄÄõtTB#¢%F†B÷W&F–öâ—2æ÷BÆÆ÷vVBâ"Â&W'&÷"æ6öFRåU%4ôäõtõ$µ54UõTäd”Ä$ÄR#¢%F†Rv÷&·76R&Vv—7G'’—2Væf–Æ&ÆRâ6†V6²F†RE4‚†÷7Bâ"Â&W'&÷"æ6öFRåU%4ôäõõTäd”Ä$ÄR#¢%F†R†÷7BÖ–ær—2Væf–Æ&ÆRâ6†V6²F†RÇVv–ââ"Â'fÆ–FFRææô6&B#¢$æò6&B—26VÆV7FVBâ"Â'fÆ–FFRç7G–ÆTæÖU&WV—&VB#¢%7G–ÆRæÖR—2&WV—&VBâ"Â'fÆ–FFRç7G–ÆTæÖUFöôÆöær#¢%7G–ÆRæÖR—2FöòÆöærâ"Â'fÆ–FFRç7G–ÆTFW67&—F–öåFöôÆöær#¢%7G–ÆRFW67&—F–öâ—2FöòÆöærâ"Â'fÆ–FFRç7G–ÆT&öG•&WV—&VB#¢%7G–ÆR&öG’—2&WV—&VBâ"Â'fÆ–FFRç7G–ÆT&öG•FöôÆöær#¢%7G–ÆR&öG’W†6VVG2F†R†÷7BÆ–Ö—Bâ"Â'fÆ–FFRæ6öÆ÷"#¢$6öÆ÷"×W7B&R7'&vv&"fÇVRâ"Â'fÆ–FFRæ6÷&T&öG•FöôÆöær#¢$6÷&R&öG’W†6VVG2F†R†÷7BÆ–Ö—Bâ"Â'æVÂç6V7F–öäÆ&VÂ#¢$ÖFWW2W'6öæ"Â'æVÂçF—FÆR#¢$ÖFWW2W'6öæ"Â'æVÂæFW67&—F–öâ#¢$†VÇF‚æBv÷&·76R&R&VBg&öÒF†RWF†VçF–6FVB†÷7B’âVF—F–ær7F—2–âF†R÷væW"ÖöæÇ’vV"6öç6öÆRâ"Â'æVÂç7F÷&vT†VÇF‚#¢%7F÷&vR†VÇF‚"Â'æVÂæ&÷VæEv÷&·76R#¢$&÷VæBv÷&·76R"Â'æVÂæ6†V6¶–ær#¢$6†V6¶–æ~(
b"Â'æVÂç7F÷&vT†VÇF‡’#¢$†VÇF‡’+r&Wf—6–öâ·&Wf—6–öçÒ"Â'æVÂç7F÷&vT–çfÆ–B#¢%7F÷&vR–çfÆ–B+r–æ¦V7F–öâf–Ç26Æ÷6VB"Â'æVÂç7F÷&vUVæf–Æ&ÆR#¢%7F÷&vRVæf–Æ&ÆR+r–æ¦V7F–öâf–Ç26Æ÷6VB"Â'æVÂçv÷&·76UfÇVRæöæR#¢'·F—FÆWÒ+r6W76–öâ"Â'æVÂçv÷&·76UfÇVRæ÷F†W"#¢'·F—FÆWÒ+r¶6÷VçGÒ6W76–öç2"Â'æVÂææ÷D&÷VæB#¢$æ÷B&÷VæB+ræòW'6öæ–æ¦V7F–öâ"Â'æVÂæ÷Vä6öç6öÆR#¢$÷VâW'6öæ6öç6öÆR"Â'æVÂææ÷FR#¢%6ÖRÖ÷&–v–âæBE4‚÷væW"FÖ—76–öâ&R&WV—&VBâF†—2æVÂæWfW"7F÷&W2W'6öæFF–âF†R'&÷w6W"â"Â'æVÂæÆæwVvR#¢%T’ÆæwVvR"Â'æVÂæW'&÷"çVç&VF&ÆR#¢%F†R†÷7B&WGW&æVBâVç&VF&ÆR&W7öç6R„…EE·7FGW7Ò’â"Â'æVÂæW'&÷"æWF‚#¢$6†V6²E4‚÷væW"WF†VçF–6F–öâÂF†Vâ÷VâF†R6öç6öÆRg&öÒâWF†VçF–6FVB6WGF–æw2vRâ"Â'æVÂæW'&÷"çVæf–Æ&ÆR#¢$†÷7B7FGW2—2Væf–Æ&ÆR„…EE·7FGW7Ò’â"Â'æVÂæW'&÷"ævVæW&–2#¢%W'6öæ7FGW2—2Væf–Æ&ÆRâ'×Ò“°Ğ Ğ¦6öç7BäTÅô552Ò Ğ¥¶FFÖÖFWW2×W'6öæ×¶&÷‚×6—¦–æs¦&÷&FW"Ö&÷ƒ¶6öÆ÷#§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×&–Ö'’Â3#3332“¶föçC£7‚óãb7—7FVÒ×V’Ç6ç2×6W&–c¶Ö‚×v–GFƒ£sc‡ĞĞ¥¶FFÖÖFWW2×W'6öæÒ§¶&÷‚×6—¦–æs¦&÷&FW"Ö&÷‡ĞĞ¥¶FFÖÖFWW2×W'6öæÒƒ'¶föçB×6—¦S£#ƒ¶Ö&v–ã£W‡ĞĞ¥¶FFÖÖFWW2×W'6öæÒ¶Ö&v–ã£Gƒ¶÷6—G“¢ãsWĞĞ¥¶FFÖÖFWW2×W'6öæÒçW'6öæÖ†VG¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦fÆW‚×7F'C¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£'‡ĞĞ¥¶FFÖÖFWW2×W'6öæÒæÆæwVvR×6VÆV7G¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3SR“¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3†3†3†3“¶6öÆ÷#¦–æ†W&—C¶&÷&FW"×&F—W3£‡ƒ·FF–æs£G‚wƒ¶föçC¦–æ†W&—C¶föçB×6—¦S£'ƒ¶7W'6÷#§ö–çFW'ĞĞ¥¶FFÖÖFWW2×W'6öæÒç7VÖÖ'—¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVBƒ"ÆÖ–æÖ‚ƒÃg"’“¶v£—ƒ¶Ö&v–ã£G‚ĞĞ¥¶FFÖÖFWW2×W'6öæÒæÖWG&–7¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3†3†3†3SR“¶&÷&FW"×&F—W3£'ƒ·FF–æs£'ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3†3†3†3—ĞĞ¥¶FFÖÖFWW2×W'6öæÒæÖWG&–26ÖÆÇ¶F—7Æ“¦&Æö6³¶÷6—G“¢ãcƒ¶föçB×6—¦S£‡ĞĞ¥¶FFÖÖFWW2×W'6öæÒæÖWG&–27G&öæw¶F—7Æ“¦&Æö6³¶föçB×6—¦S£Gƒ¶Ö&v–â×F÷£7ƒ·v÷&BÖ'&V³¦'&V²×v÷&GĞĞ¥¶FFÖÖFWW2×W'6öæÒ'WGFöç¶&÷&FW#£‚6öÆ–B3s†c“¶&6¶w&÷VæC¢3s†c“¶6öÆ÷#§v†—FS¶&÷&FW"×&F—W3£—ƒ·FF–æs£‡‚Gƒ¶föçC¦–æ†W&—C¶7W'6÷#§ö–çFW'ĞĞ¥¶FFÖÖFWW2×W'6öæÒ'WGFöã¦fö7W2×f—6–&ÆW¶÷WFÆ–æS£'‚6öÆ–B3s†c“¶÷WFÆ–æRÖöfg6WC£'‡ĞĞ¥¶FFÖÖFWW2×W'6öæÒæW'&÷'¶6öÆ÷#¢6#3S3S¶Ö&v–ã£'‚ĞĞ¥¶FFÖÖFWW2×W'6öæÒææ÷FW¶föçB×6—¦S£ƒ¶÷6—G“¢ãc¶Ö&v–ã£'‚ĞĞ¤ÖVF–†Ö‚×v–GFƒ£Sc‚—µ¶FFÖÖFWW2×W'6öæÒç7VÖÖ'—¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'Õ¶FFÖÖFWW2×W'6öæÒçW'6öæÖ†VG¶fÆW‚ÖF—&V7F–öã¦6öÇVÖç×ĞĞ¦°Ğ Ğ¢ò¢ Ğ¢¢W'6—7FVBT’ÆæwVvRöæÇ“²W'6öæ6öæf–wW&F–öâ—2æWfW"'&÷w6W"7FFRàĞ¢¢&WGW&ç2²w¦‚Ô4âwÂvVâÕU2wÒ6fVBÆæwVvR÷"F†R¦‚Ô4âFVfVÇBàĞ¢¢ğĞ¦gVæ7F–öâ&VDÆæwVvR‚’°Ğ¢G'’°Ğ¢6öç7B7F÷&VBÒÆö6Å7F÷&vRævWD—FVÒ„ÄäuTtUô´U’“°Ğ¢–b„ÄäuTtU2æ–æ6ÇVFW2‡7F÷&VB’’&WGW&â7F÷&VC°Ğ¢Ò6F6‚°Ğ¢òò7F÷&vR—2÷F–öæÃ²F†RæVÂ&VÖ–ç2W6&ÆRv—F†÷WB—BàĞ¢ĞĞ¢&WGW&âDTdTÅEôÄäuTtS°Ğ§ĞĞ Ğ¢ò¢ Ğ¢¢&Ò²w¦‚Ô4âwÂvVâÕU2wÒÆæwVvR6VÆV7FVBÆæwVvRàĞ¢¢ğĞ¦gVæ7F–öâ6fTÆæwVvR†ÆæwVvR’°Ğ¢G'’°Ğ¢Æö6Å7F÷&vRç6WD—FVÒ„ÄäuTtUô´U’ÂÆæwVvRÓÓÒvVâÕU2ròvVâÕU2r¢w¦‚Ô4âr“°Ğ¢Ò6F6‚°Ğ¢òòÆæwVvRW'6—7FVæ6R—26öçfVæ–Væ6RÂæWfW"W'6öæ7FFRàĞ¢ĞĞ§ĞĞ Ğ¢ò¢ Ğ¢¢&Ò·7G&–æwÒFV×ÆFRÖW76vRFV×ÆFRàĞ¢¢&Òµ&V6÷&CÇ7G&–ærÂVæ¶æ÷vãçÒ·fÇVW5ÒÆ6V†öÆFW"fÇVW2àĞ¢¢&WGW&ç2·7G&–æwÒ–çFW'öÆFVBFW‡BàĞ¢¢ğĞ¦gVæ7F–öâ–çFW'öÆFR‡FV×ÆFRÂfÇVW2’°Ğ¢&WGW&â7G&–ær‡FV×ÆFR’ç&WÆ6R‚õÇ²…Çr²•ÇÒörÂ†ÖF6‚ÂæÖR’Óâ€Ğ¢fÇVW2bbö&¦V7Bæ†4÷vâ‡fÇVW2ÂæÖR’ò7G&–ær‡fÇVW5¶æÖUÒóòrr’¢ÖF6€Ğ¢’“°Ğ§ĞĞ Ğ¢ò¢ Ğ¢¢&Ò·7G&–æwÒÆæwVvR6VÆV7FVBÆæwVvRàĞ¢¢&Ò·7G&–æwÒ¶W’6FÆör¶W’àĞ¢¢&Òµ&V6÷&CÇ7G&–ærÂVæ¶æ÷vãçÒ·fÇVW5ÒÆ6V†öÆFW"fÇVW2àĞ¢¢&WGW&ç2·7G&–æwÒÆö6Æ—¦VBÖW76vRàĞ¢¢ğĞ¦gVæ7F–öâB†ÆæwVvRÂ¶W’ÂfÇVW2’°Ğ¢6öç7BF&ÆRÒ“„åô4DÄôsòå¶ÆæwVvUÒóò“„åô4DÄôsòå´DTdTÅEôÄäuTtUÒóò·Ó°Ğ¢6öç7BFV×ÆFRÒF&ÆU¶¶W•Ó°Ğ¢&WGW&âG—VöbFV×ÆFRÓÓÒw7G&–ærrò–çFW'öÆFR‡FV×ÆFRÂfÇVW2’¢¶W“°Ğ§ĞĞ Ğ¢ò¢ Ğ¢¢&Ò·7G&–æwÒÆæwVvR6VÆV7FVBÆæwVvRàĞ¢¢&Ò·7G&–æwÒ¶W’&6R¶W’v—F‚æöæVöæ÷F†W&f&–çG2àĞ¢¢&Ò¶çVÖ&W'Ò6÷VçB—FVÒ6÷VçBàĞ¢¢&Òµ&V6÷&CÇ7G&–ærÂVæ¶æ÷vãçÒ·fÇVW5ÒÆ6V†öÆFW"fÇVW2àĞ¢¢&WGW&ç2·7G&–æwÒÆö6Æ—¦VBÇW&ÂÖW76vRàĞ¢¢ğĞ¦gVæ7F–öâFâ†ÆæwVvRÂ¶W’Â6÷VçBÂfÇVW2’°Ğ¢&WGW&âB†ÆæwVvRÂG¶¶W—ÒâG¶6÷VçBÓÓÒòvöæRr¢v÷F†W"wÖÂ²âââ‡fÇVW2óò·Ò’Â6÷VçBÒ“°Ğ§ĞĞ Ğ¦7–æ2gVæ7F–öâ&VD÷fW'f–Wr‚’°Ğ¢6öç7B&W7öç6RÒv—BfWF6‚„•õ$ôõB²rö÷fW'f–WrrÂ°Ğ¢7&VFVçF–Ç3¢w6ÖRÖ÷&–v–ârÀĞ¢†VFW'3¢²66WC¢vÆ–6F–öâö§6öârÒÀĞ¢Ò“°Ğ¢ÆWB–ÆöC°Ğ¢G'’°Ğ¢–ÆöBÒv—B&W7öç6Ræ§6öâ‚“°Ğ¢Ò6F6‚°Ğ¢6öç7BW'&÷"ÒæWrW'&÷"‚wVç&VF&ÆR÷fW'f–Wr&W7öç6Rr“°Ğ¢W'&÷"ç7FGW2Ò&W7öç6Rç7FGW3°Ğ¢F‡&÷rW'&÷#°Ğ¢ĞĞ¢–b‚&W7öç6Ræö²ÇÂ–ÆöCòæö²ÓÒG'VR’°Ğ¢6öç7BW'&÷"ÒæWrW'&÷"‚v÷fW'f–Wr&WVW7Bf–ÆVBr“°Ğ¢W'&÷"ç7FGW2Ò&W7öç6Rç7FGW3°Ğ¢–b‡G—Vöb–ÆöCòæ6öFRÓÓÒw7G&–ærr’W'&÷"æ6öFRÒ–ÆöBæ6öFS°Ğ¢F‡&÷rW'&÷#°Ğ¢ĞĞ¢&WGW&â–ÆöBæFF°Ğ§ĞĞ Ğ¢ò¢ Ğ¢¢6öçfW'B†÷7Bf–ÇW&R–çFòf—†VBÆö6Æ—¦VB6÷’â&r6W'fW"ÖW76vW2æ@Ğ¢¢f–ÆW7—7FVÒF‡2&RæWfW"&VæFW&VBàĞ¢¢&Ò·Væ¶æ÷vçÒf–ÇW&RF‡&÷vâf–ÇW&RàĞ¢¢&Ò·7G&–æwÒÆæwVvR6VÆV7FVBÆæwVvRàĞ¢¢&WGW&ç2·7G&–æwÒÆö6Æ—¦VBW'&÷"ÖW76vRàĞ¢¢ğĞ¦gVæ7F–öâW'&÷$ÖW76vR†f–ÇW&RÂÆæwVvR’°Ğ¢6öç7B6öFRÒf–ÇW&RbbG—Vöbf–ÇW&RÓÓÒvö&¦V7Bròf–ÇW&Ræ6öFR¢VæFVf–æVC°Ğ¢–b‡G—Vöb6öFRÓÓÒw7G&–ærr’°Ğ¢6öç7B¶W’ÒW'&÷"æ6öFRâG¶6öFWÖ°Ğ¢6öç7BF&ÆRÒ“„åô4DÄôsòå¶ÆæwVvUÒóò“„åô4DÄôsòå´DTdTÅEôÄäuTtUÒóò·Ó°Ğ¢–b‡G—VöbF&ÆU¶¶W•ÒÓÓÒw7G&–ærr’&WGW&âB†ÆæwVvRÂ¶W’“°Ğ¢ĞĞ¢6öç7B7FGW2ÒçVÖ&W"†f–ÇW&Sòç7FGW2“°Ğ¢–b‡7FGW2ÓÓÒCÇÂ7FGW2ÓÓÒC2’&WGW&âB†ÆæwVvRÂwæVÂæW'&÷"æWF‚r“°Ğ¢–b‡7FGW2ÓÓÒS2’&WGW&âB†ÆæwVvRÂwæVÂæW'&÷"çVæf–Æ&ÆRrÂ²7FGW2Ò“°Ğ¢–b‡7FGW2ÓÓÒCÇÂ7FGW2ÓÓÒCB’&WGW&âB†ÆæwVvRÂwæVÂæW'&÷"ævVæW&–2r“°Ğ¢–b„çVÖ&W"æ—4f–æ—FR‡7FGW2’’&WGW&âB†ÆæwVvRÂwæVÂæW'&÷"çVæf–Æ&ÆRrÂ²7FGW2Ò“°Ğ¢&WGW&âB†ÆæwVvRÂwæVÂæW'&÷"ævVæW&–2r“°Ğ§ĞĞ Ğ¦gVæ7F–öâÖWG&–2‡²Æ&VÂÂfÇVRÒ’°Ğ¢&WGW&â‚‚vF—brÂ²6Æ74æÖS¢vÖWG&–2rÒÀĞ¢‚‚w6ÖÆÂrÂçVÆÂÂÆ&VÂ’ÀĞ¢‚‚w7G&öærrÂçVÆÂÂfÇVR’“°Ğ§ĞĞ Ğ¦gVæ7F–öâÆæwVvU6VÆV7B‡²ÆæwVvRÂöäÆæwVvT6†ævRÒ’°Ğ¢&WGW&â‚‚w6VÆV7BrÂ°Ğ¢6Æ74æÖS¢vÆæwVvR×6VÆV7BrÀĞ¢–C¢vÖFWW2×W'6öæÖÆæwVvRrÀĞ¢v&–ÖÆ&VÂs¢B†ÆæwVvRÂwæVÂæÆæwVvRr’ÀĞ¢fÇVS¢ÆæwVvRÀĞ¢öä6†ævS¢WfVçBÓâöäÆæwVvT6†ævR†WfVçBçF&vWBçfÇVR’ÀĞ¢ÒÀĞ¢‚‚v÷F–öârÂ²fÇVS¢w¦‚Ô4ârÒÂB†ÆæwVvRÂvæÆæwVvT6†–æW6Rr’’ÀĞ¢‚‚v÷F–öârÂ²fÇVS¢vVâÕU2rÒÂB†ÆæwVvRÂvæÆæwVvTVævÆ—6‚r’’“°Ğ§ĞĞ Ğ¦gVæ7F–öâæVÂ‚’°Ğ¢6öç7B¶ÆæwVvRÂ6WDÆæwVvUÒÒW6U7FFR‡&VDÆæwVvR“°Ğ¢6öç7B¶FFÂ6WDFFÒÒW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶W'&÷"Â6WDW'&÷%ÒÒW6U7FFR†çVÆÂ“°Ğ¢6öç7B¶ÆöF–ærÂ6WDÆöF–æuÒÒW6U7FFR‡G'VR“°Ğ¢6öç7BG"Ò†¶W’ÂfÇVW2’ÓâB†ÆæwVvRÂ¶W’ÂfÇVW2“°Ğ Ğ¢W6TVffV7B‚‚’Óâ°Ğ¢ÆWB7F—fRÒG'VS°Ğ¢6öç7BÆöBÒ7–æ2‚’Óâ°Ğ¢G'’°Ğ¢6öç7B÷fW'f–WrÒv—B&VD÷fW'f–Wr‚“°Ğ¢–b‚7F—fR’&WGW&ã°Ğ¢6WDFF†÷fW'f–Wr“°Ğ¢6WDW'&÷"†çVÆÂ“°Ğ¢Ò6F6‚†f–ÇW&R’°Ğ¢–b‚7F—fR’&WGW&ã°Ğ¢6WDFF†çVÆÂ“°Ğ¢6WDW'&÷"†f–ÇW&R“°Ğ¢Òf–æÆÇ’°Ğ¢–b†7F—fR’6WDÆöF–ær†fÇ6R“°Ğ¢ĞĞ¢Ó°Ğ¢fö–BÆöB‚“°Ğ¢&WGW&â‚’Óâ²7F—fRÒfÇ6S²Ó°Ğ¢ÒÂµÒ“°Ğ Ğ¢6öç7B7F÷&vRÒFFòç7F÷&vS°Ğ¢6öç7Bv÷&·76RÒFFòçv÷&·76S°Ğ¢6öç7B&Wf—6–öâÒ7F÷&vSòç&Wf—6–öâóò~(	Bs°Ğ¢6öç7B7F÷&vTÆ&VÂÒÆöF–æpĞ¢òG"‚wæVÂæ6†V6¶–ærrĞ¢¢7F÷&vSòç7FGW2ÓÓÒvö²pĞ¢òG"‚wæVÂç7F÷&vT†VÇF‡’rÂ²&Wf—6–öâÒĞ¢¢7F÷&vSòç7FGW2ÓÓÒv–çfÆ–BpĞ¢òG"‚wæVÂç7F÷&vT–çfÆ–BrĞ¢¢G"‚wæVÂç7F÷&vUVæf–Æ&ÆRr“°Ğ¢6öç7Bv÷&·76TÆ&VÂÒÆöF–æpĞ¢òG"‚wæVÂæ6†V6¶–ærrĞ¢¢v÷&·76PĞ¢òFâ†ÆæwVvRÂwæVÂçv÷&·76UfÇVRrÂçVÖ&W"‡v÷&·76Rç6W76–öä6÷VçBóò’Â²F—FÆS¢v÷&·76RçF—FÆRÒĞ¢¢G"‚wæVÂææ÷D&÷VæBr“°Ğ Ğ¢&WGW&â‚‚vF—brÂ²vFFÖÖFWW2×W'6öæs¢wG'VRrÒÀĞ¢‚‚w7G–ÆRrÂçVÆÂÂäTÅô552’ÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢wW'6öæÖ†VBrÒÀĞ¢‚‚vƒ"rÂçVÆÂÂG"‚wæVÂçF—FÆRr’’ÀĞ¢‚„ÆæwVvU6VÆV7BÂ°Ğ¢ÆæwVvRÀĞ¢öäÆæwVvT6†ævS¢æW‡BÓâ°Ğ¢–b‚ÄäuTtU2æ–æ6ÇVFW2†æW‡B’’&WGW&ã°Ğ¢6WDÆæwVvR†æW‡B“°Ğ¢6fTÆæwVvR†æW‡B“°Ğ¢ÒÀĞ¢Ò’’ÀĞ¢‚‚wrÂçVÆÂÂG"‚wæVÂæFW67&—F–öâr’’ÀĞ¢W'&÷"ò‚‚vF—brÂ²6Æ74æÖS¢vW'&÷"rÂ&öÆS¢w7FGW2rÒÂW'&÷$ÖW76vR†W'&÷"ÂÆæwVvR’’¢çVÆÂÀĞ¢‚‚vF—brÂ²6Æ74æÖS¢w7VÖÖ'’rÒÀĞ¢‚„ÖWG&–2Â²Æ&VÃ¢G"‚wæVÂç7F÷&vT†VÇF‚r’ÂfÇVS¢7F÷&vTÆ&VÂÒ’ÀĞ¢‚„ÖWG&–2Â²Æ&VÃ¢G"‚wæVÂæ&÷VæEv÷&·76Rr’ÂfÇVS¢v÷&·76TÆ&VÂÒ’’ÀĞ¢‚‚v'WGFöârÂ°Ğ¢G—S¢v'WGFöârÀĞ¢öä6Æ–6³¢‚’Óâv–æF÷ræ÷Vâ„4ôå4ôÄUõU$ÂÂuö&Ææ²rÂvæö÷VæW"Ææ÷&VfW'&W"r’ÀĞ¢ÒÂG"‚wæVÂæ÷Vä6öç6öÆRr’’ÀĞ¢‚‚wrÂ²6Æ74æÖS¢væ÷FRrÒÂG"‚wæVÂææ÷FRr’’“°Ğ§ĞĞ Ğ§&WGW&â°Ğ¢æÖS¢tÖFWW2÷W'6öæÖ6Æ–VçBrÀĞ¢–æ¦V7C¢²w6Æ÷G2uÒÀĞ¢Ç’†7G‚’°Ğ¢G'’°Ğ¢7G‚ç6Æ÷G2æ–æ¦V7B‚w6WGF–æw2ç6V7F–öârÂ‚’Óâ7G‚ç6Æ÷G2ç&Vv—7FW"‡°Ğ¢æÖS¢w6WGF–æw2ç6V7F–öârÀĞ¢–C¢vÖFWW2×W'6öærÀĞ¢÷&FW#¢3"ÀĞ¢Æ&VÃ¢‚’ÓâB‡&VDÆæwVvR‚’ÂwæVÂç6V7F–öäÆ&VÂr’ÀĞ¢ÒÂæVÂ’“°Ğ¢Ò6F6‚†W'&÷"’°Ğ¢6öç6öÆRæW'&÷"‚u¶ÖFWW2×W'6öæÒ6WGF–æw2ç6V7F–öâVæf–Æ&ÆRrÂW'&÷"“°Ğ¢ĞĞ¢ÒÀĞ§Ó°§×Ò“° §&WGW&âFW67&—F÷"æf7F÷'’‡&WV—&R“·Ò’‚—Ó°¦gVæ7F–öâÖ7æVÂ‡·7FFRÇ6W76–öç2Ç&Vg&W6‚ÇGÒ—°Ğ¢6öç7B¶G&gBÇ6WDG&gEÓ×W6U7FFR†çVÆÂ’Å¶W'&÷"Ç6WDW'&÷%Ó×W6U7FFR‚rr’Å¶'W7’Ç6WD'W7•Ó×W6U7FFR†fÇ6R’Å·F"Ç6WEF%Ó×W6U7FFR‚w6W'fW'2r’Å·6V&6‚Ç6WE6V&6…Ó×W6U7FFR‚rr’Å·6V7&WBÇ6WE6V7&WEÓ×W6U7FFR‚rr’Å¶VF—E&Wf—6–öâÇ6WDVF—E&Wf—6–öåÓ×W6U7FFR‡7FFSòç&Wf—6–öâ“°Ğ¢6öç7B&Ææ³Ò‚“Óâ‡¶–C¢w6W'fW"Òr´ÖF‚ç&æFöÒ‚’çFõ7G&–ærƒ3b’ç6Æ–6Rƒ"Ã‚’ÆæÖS¢rrÇG&ç7÷'C¢w7G&VÖ&ÆRÖ‡GGrÇW&Ã¢rrÆVæ&ÆVC¦fÇ6RÇF–ÖV÷WD×3£ÆF–Ç”'VFvWC£Ç6W76–öä–G3¥µÒÇ6W76–öåG—W3¥µÒÇFööÇ3§·×Ò“°Ğ¢6öç7B×WFFSÒ†²Çb“Óç6WDG&gB†CÓâ‡²ââæBÅ¶µÓ§gÒ’“°Ğ¢7–æ2gVæ7F–öâ7F–öâ†fâ—·6WD'W7’‡G'VR“·6WDW'&÷"‚rr“·G'—¶v—Bfâ‚“¶v—B&Vg&W6‚‚“·Ö6F6‚†R—·6WDW'&÷"†RæÖW76vR“·Öf–æÆÇ—·6WD'W7’†fÇ6R“·×ĞĞ¢6öç7B6W'fW'3×7FFSòç6W'fW'3óõµÒÇ6VÆV7FVC×6W'fW'2æf–æB‡3Óç2æ–CÓÓÖG&gCòæ–B’ÆF—66÷fW&VC×6VÆV7FVCòæF—66÷fW&VCóõµÓ°Ğ¢&WGW&â‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖW‡FVç6–öâwÒÆ‚‚vƒ"rÆçVÆÂÇB‚tÔ5zêynKŠŞ[ø2rÂtÔ5ÖævW"r’’ÀĞ¢‚‚wrÆçVÆÂÇB‚~xºÎz¸¾K¨î[›>Xû‹JnXû~8.‹ùîhê^KˆŞzØK¨îhèiØ>ûÉ®jøşKŠ®[z^X[~›¹ŠêNX[>™zŞ8.ZIn˜:høş‹ûKˆî‹é>X{®KˆŞXúşKú8"rÂt–æFWVæFVçBöbÆFf÷&Ò66÷VçG2â6öææV7F–öâw&çG2æòFööÂ66W72âW‡FW&æÂFW67&—F–öç2æB÷WGWG2&RVçG'W7FVBâr’’ÀĞ¢‚‚v'WGFöârÇ¶öä6Æ–6³¢‚“Óç6WEF"‚w6W'fW'2r—ÒÇB‚~iÈŞXªYš‚rÂu6W'fW'2r’’Æ‚‚v'WGFöârÇ¶öä6Æ–6³¢‚“Óç6WEF"‚v6FÆörr—ÒÇB‚~iÈŞXªyºî[ÙRrÂt6FÆörr’’ÀĞ¢W'&÷#ö‚‚wrÇ·&öÆS¢vÆW'BwÒÆW'&÷"“¦çVÆÂÀĞ¢F#ÓÓÒv6FÆörsö‚‚v'F–6ÆRrÆçVÆÂÆ‚‚wrÇ¶6Æ74æÖS¢vÖ7Ö6FÆörÖæ÷FRwÒÇB‚~Yû®zXø.ˆ>yºî[Ù^ûÉ®K¸^X‰~X{®[	˜xşZéikXø.ˆ>iÈŞXªûÈÎKˆŞiŠşZèÎi[Ny¨Nh™zêÔ5[ˆ.YË®8.[Ù>X˜ŞXú®iÈKˆKŠ®Zéikih~K»n{;¾{¹şXø.ˆ>iÈŞXªûÈÎK‰N[	®iÊ®š(NŠ8^h‰n˜:{Û.8"rÂt&6–2&VfW&Væ6R6FÆös¢6ÖÆÂ6WBöböff–6–Â&VfW&Væ6R6W'f–6W2Âæ÷BF†RgVÆÂ†÷7FVBÔ5Ö&¶WBâ—B7W'&VçFÇ’Æ—7G2öæRöff–6–Âf–ÆW7—7FVÒ&VfW&Væ6R6W'f–6RÂv†–6‚—2æ÷B&V–ç7FÆÆVB÷"FWÆ÷–VBâr’’Æ‚‚v–çWBrÇ²v&–ÖÆ&VÂs¢u6V&6‚Ô56FÆörrÇfÇVS§6V&6‚Æöä6†ævS¦SÓç6WE6V&6‚†RçF&vWBçfÇVR’ÇÆ6V†öÆFW#§B‚~i	Î{J.iÈŞXªrÂu6V&6‚6W'f–6W2r—Ò’ÀĞ¢öf–ÆW7—7FV×Îih~K»gÅâBö’çFW7B‡6V&6‚“ö‚‚vF—brÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~ih~K»n{;¾{¹òÔ5ûÈiÊÎYËûÈ’rÂtf–ÆW7—7FVÒÔ5†Æö6Â’r’’Æ‚‚wrÆçVÆÂÇB‚tÖöFVÂ6öçFW‡B&÷Fö6öÂZéikXø.ˆ>iÈŞXª8.™ÈŠhXXˆz®ŠÎZèŠ8^ûÉ´6÷&RKˆŞ‹ùŠÎZèŠ8^ˆI®iÊÎ8.Xúşˆ;ŞŠû¾Xùnh‰nXiXZ^h˜˜yºî[Ù^ûÈÎŠû~˜	šhèiØ>8"rÂtöff–6–ÂÔ5&VfW&Væ6R6W'f–6Râ–ç7FÆÂ6W&FVÇ“²6÷&R'Vç2æò–ç7FÆÆF–öâ67&—G2â&Wf–WrF—&V7F÷'’66W72æBV6‚FööÂâr’’ÀĞ¢‚‚vrÇ¶‡&Vc¢v‡GG3¢òöv—F‡V"æ6öÒöÖöFVÆ6öçFW‡G&÷Fö6öÂ÷6W'fW'2÷G&VRöÖ–â÷7&2öf–ÆW7—7FVÒrÇF&vWC¢uö&Ææ²rÇ&VÃ¢væ÷&VfW'&W"wÒÇB‚~iÚ^k©KˆîZèŠ8^ŠûNiˆârÂu6÷W&6RæB–ç7FÆÆF–öâwV–FRr’’ÀĞ¢‚‚v'WGFöârÇ¶öä6Æ–6³¢‚“Óç·6WDVF—E&Wf—6–öâ‡7FFRç&Wf—6–öâ“·6WDG&gB‡²ââæ&Ææ²‚’ÆæÖS¢tf–ÆW7—7FVÒrÇG&ç7÷'C¢w7FF–òrÆ6öÖÖæC¢rrÆ&w3¥µ×Ò“·6WEF"‚w6W'fW'2r“·×ÒÇB‚~˜XŞ{ÚîiÊÎYËiÈŞXªûÈiÊ®˜:{Û.ûÈ’rÂt6öæf–wW&RÆö6Â6W'f–6R†æ÷BFWÆ÷–VB’r’’“¦‚‚wrÆçVÆÂÇB‚~k*iÈXË˜XŞšûÈÎXúşk{¾Xªˆz®Zé®K˜’Ô58"rÂtæòÖF6†W2âFB7W7FöÒÔ56W'fW"âr’’“ Ğ¢‚‚vF—brÆçVÆÂÆ‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óç·6WDVF—E&Wf—6–öâ‡7FFRç&Wf—6–öâ“·6WDG&gB†&Ææ²‚’“·6WE6V7&WB‚rr“·×ÒÇB‚~k{¾Xªˆz®Zé®K˜’Ô5rÂtFB7W7FöÒÔ5r’’ÀĞ¢ââç6W'fW'2æÖ‡3Óæ‚‚v'F–6ÆRrÇ¶¶W“§2æ–GÒÆ‚‚vƒ2rÆçVÆÂÇ2ææÖR’Æ‚‚wrÆçVÆÂÆG·2ç7FGW7Ò+rG·2çG&ç7÷'GÒ+rG·2æF—66÷fW&VBæÆVæwF‡ÒFööÇ2+rG·2çW6VGÒòG·2æF–Ç”'VFvWGÖ’Ç2æW'&÷#ö‚‚wrÆçVÆÂÇ2æW'&÷"“¦çVÆÂÀĞ¢‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óç¶6öç7B·7FGW2ÆW'&÷"ÇW6VBÆF—66÷fW&VBÂââæ6öæf–wÓ×3·6WDVF—E&Wf—6–öâ‡7FFRç&Wf—6–öâ“·6WDG&gB‡7G'V7GW&VD6ÆöæR†6öæf–r’“·6WE6V7&WB‚rr“·×ÒÇB‚~Šëî{ÚîKˆî[z^X[~hèiØ2rÂu6WGF–æw2æBFööÂW&Ö—76–öç2r’’ÀĞ¢‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7—ÇÂ2æVæ&ÆVBÆöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚röÖ7ö6öææV7BrÇ¶–C§2æ–GÒ’—ÒÇB‚~kX¾Šù^‹ùîhêRò˜xŞik‹ùîhêRrÂuFW7Bò&V6öææV7Br’’ÀĞ¢‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óæ7F–öâ†7–æ2‚“Óç¶6öç7B·7FGW2ÆW'&÷"ÇW6VBÆF—66÷fW&VBÂââæ6öæf–wÓ×3¶v—B’‚röÖ7÷6fRrÇ·&Wf—6–öã§7FFRç&Wf—6–öâÇ6W'fW#§²ââæ6öæf–rÆVæ&ÆVC¢2æVæ&ÆVG×Ò“·Ò—ÒÇ2æVæ&ÆVC÷B‚~XÎyJ‚rÂtF—6&ÆRr“§B‚~Y
şyJ‚rÂtVæ&ÆRr’’ÀĞ¢‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óç¶–b‡v–æF÷ræ6öæf—&Ò‡B‚~z{¾™šNjÚNiÈŞXªûÉşKùŞyY[{.iÈ‹>yJŠë[Ù^8"rÂu&VÖ÷fRF†—26W'fW#òW†—7F–ær6ÆÂ&V6÷&G2&R&WF–æVBâr’’–7F–öâ‚‚“Óæ’‚röÖ7÷&VÖ÷fRrÇ¶–C§2æ–BÇ&Wf—6–öã§7FFRç&Wf—6–öçÒ’“·×ÒÇB‚~z{¾™šBrÂu&VÖ÷fRr’’’’ÀĞ¢G&gCö‚‚v'F–6ÆRrÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~‹ùîhê^˜XŞ{ÚârÂt6öææV7F–öâ6öæf–wW&F–öâr’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÇB‚~YŞz{rÂtæÖRr’Æ‚‚v–çWBrÇ·fÇVS¦G&gBææÖRÆöä6†ævS¦SÓæ×WFFR‚væÖRrÆRçF&vWBçfÇVR—Ò’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÂrG&ç7÷'BrÆ‚‚w6VÆV7BrÇ·fÇVS¦G&gBçG&ç7÷'BÆöä6†ævS¦SÓç¶6öç7BG&ç7÷'CÖRçF&vWBçfÇVS·6WDG&gB†CÓç¶6öç7Bã×²ââæBÇG&ç7÷'GÓ¶–b‡G&ç7÷'CÓÓÒw7FF–òr—¶FVÆWFRâçW&Ã¶FVÆWFRâæ7&VFVçF–Å&Vc¶âæ6öÖÖæCÒrs¶âæ&w3ÕµÓ·ÖVÇ6W¶FVÆWFRâæ6öÖÖæC¶FVÆWFRâæ&w3¶FVÆWFRâæ7vC¶FVÆWFRâæVçe&Vg3¶âçW&ÃÒrs·×&WGW&âã·Ò“·×ÒÆ‚‚v÷F–öârÇ·fÇVS¢w7FF–òwÒÂw7FF–òr’Æ‚‚v÷F–öârÇ·fÇVS¢w7G&VÖ&ÆRÖ‡GGwÒÂu7G&VÖ&ÆR…EEr’’’ÀĞ¢G&gBçG&ç7÷'CÓÓÒw7FF–òsö‚‚vF—brÆçVÆÂÆ‚‚vÆ&VÂrÆçVÆÂÇB‚~Xúşhš~ŠÎih~K»n{¹ŞZû‹zş[èBrÂtW†V7WF&ÆR'6öÇWFRF‚r’Æ‚‚v–çWBrÇ·fÇVS¦G&gBæ6öÖÖæCóòrrÆöä6†ævS¦SÓæ×WFFR‚v6öÖÖæBrÆRçF&vWBçfÇVR—Ò’’Æ‚‚wrÆçVÆÂÇB‚~KˆŞKÛşyJ‚6†VÆÎûÈÎKˆŞˆz®XªZèŠ8^8.Xú®Z¾Xi[{.KúK»¾8[{.ZèŠ8^y¨Nzˆ¾[¨şûÉ¾Xø.i[jøşŠÎKˆš8"rÂtæò6†VÆÂ÷"WFöÖF–2–ç7FÆÆF–öââ6†ö÷6Râ–ç7FÆÆVBÂG'W7FVB&öw&Ó²öæR&wVÖVçBW"Æ–æRâr’’ÀĞ¢‚‚wFW‡F&VrÇ²v&–ÖÆ&VÂs¢tÔ5&wVÖVçG2rÇfÇVS¢†G&gBæ&w3óõµÒ’æ¦ö–â‚uÆâr’Æöä6†ævS¦SÓæ×WFFR‚v&w2rÆRçF&vWBçfÇVRç7Æ—B‚uÆâr’æf–ÇFW"„&ööÆVâ’—Ò’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÇB‚~xêşZ(>Xù˜xşûÈYŞz{ŞXzŞhÚî[É^yJûÈÎjøşŠÎKˆšûÈ’rÂtVçf—&öæÖVçB„äÔSÖ7&VFVçF–Â&VfW&Væ6RÂöæRW"Æ–æR’r’Æ‚‚wFW‡F&VrÇ²v&–ÖÆ&VÂs¢tÔ5Vçf—&öæÖVçB&VfW&Væ6W2rÇfÇVS¤ö&¦V7BæVçG&–W2†G&gBæVçe&Vg3ó÷·Ò’æÖ‚…¶²ÇeÒ“Óæ²²sÒr·b’æ¦ö–â‚uÆâr’Æöä6†ævS¦SÓæ×WFFR‚vVçe&Vg2rÄö&¦V7Bæg&öÔVçG&–W2†RçF&vWBçfÇVRç7Æ—B‚uÆâr’æf–ÇFW"„&ööÆVâ’æÖ‡ƒÓç¶6öç7B“×‚æ–æFW„öb‚sÒr“·&WGW&â·‚ç6Æ–6RƒÆ’’Ç‚ç6Æ–6R†’³•Ó·Ò’’—Ò’’“ Ğ¢‚‚vÆ&VÂrÆçVÆÂÂrU$ÂrÆ‚‚v–çWBrÇ·fÇVS¦G&gBçW&ÃóòrrÆöä6†ævS¦SÓæ×WFFR‚wW&ÂrÆRçF&vWBçfÇVR’ÇÆ6V†öÆFW#¢v‡GG3¢ò÷–÷W"×6W'fW"æW†×ÆRöÖ7wÒ’’ÀĞ¢‚‚wrÆçVÆÂÇB‚~XzŞhÚîK¸^KùŞZÙK¨îjÚN™©Nzk²şyJh‹~i[hÚîyºî[Ù^ûÈÎX‰~ŠKˆŞ‹ùNY¹îXh^Zë8$…EEKÛşyJ‚&V&W.ûÉ·7FF–òKÛşyJXzŞhÚî[É^yJiŠ[N8"rÂt7&VFVçF–Ç27F’–âF†RFFF—&V7F÷'’æB&RæWfW"&WGW&æVB–âÆ—7G2â…EEW6W2&V&W#²7FF–òW6W2Vçf—&öæÖVçB&VfW&Væ6W2âr’’ÀĞ¢‚‚v–çWBrÇ·G—S¢w77v÷&BrÆWFô6ö×ÆWFS¢væWr×77v÷&BrÇfÇVS§6V7&WBÆöä6†ævS¦SÓç6WE6V7&WB†RçF&vWBçfÇVR’Âv&–ÖÆ&VÂs¢tÔ57&VFVçF–ÂwÒ’ÀĞ¢‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7—ÇÂ6V7&WBÆöä6Æ–6³¢‚“Óæ7F–öâ†7–æ2‚“Óç¶6öç7B&W7VÇCÖv—B’‚röÖ7÷6V7&WBrÇ·fÇVS§6V7&WGÒ“·6WE6V7&WB‚rr“¶–b†G&gBçG&ç7÷'CÓÓÒw7G&VÖ&ÆRÖ‡GGr–×WFFR‚v7&VFVçF–Å&VbrÇ&W7VÇBç&VfW&Væ6R“¶VÇ6R×WFFR‚vVçe&Vg2rÇ²ââæG&gBæVçe&Vg2Ä•ô´U“§&W7VÇBç&VfW&Væ6WÒ“·Ò—ÒÇB‚~KùŞZÙXzŞhÚî[É^yJ‚rÂu6fR7&VFVçF–Â&VfW&Væ6Rr’’ÀĞ¢G&gBæ7&VFVçF–Å&Vcö‚‚wrÆçVÆÂÆG&gBæ7&VFVçF–Å&Vb“¦çVÆÂÀĞ¢‚‚vÆ&VÂrÆçVÆÂÇB‚~‹h^i{njú¾zy"rÂuF–ÖV÷WB×2r’Æ‚‚v–çWBrÇ·G—S¢vçVÖ&W"rÆÖ–ã£ÆÖƒ£cÇfÇVS¦G&gBçF–ÖV÷WD×2Æöä6†ævS¦SÓæ×WFFR‚wF–ÖV÷WD×2rÄçVÖ&W"†RçF&vWBçfÇVR’—Ò’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÇB‚~jøşiz^Šû~k.Kˆ®™™rÂtF–Ç’Ö†–×VÒr’Æ‚‚v–çWBrÇ·G—S¢vçVÖ&W"rÆÖ–ã£ÆÖƒ£ÇfÇVS¦G&gBæF–Ç”'VFvWBÆöä6†ævS¦SÓæ×WFFR‚vF–Ç”'VFvWBrÄçVÖ&W"†RçF&vWBçfÇVR’—Ò’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦G&gBæVæ&ÆVBÆöä6†ævS¦SÓæ×WFFR‚vVæ&ÆVBrÆRçF&vWBæ6†V6¶VB—Ò’ÇB‚~Y
şyJ‹ùîhêRrÂtVæ&ÆR6öææV7F–öâr’’ÀĞ¢‚‚vƒ2rÆçVÆÂÇB‚~hèiØ>ˆÈ>Y»NûÈK¸^[Ù>X˜Ò6÷&Rv÷&·76^ûÈ’rÂtWF†÷&—¦F–öâ†7W'&VçB6÷&Rv÷&·76RöæÇ’’r’’ÀĞ¢‚‚wrÇ·&öÆS¢væ÷FRrÆ6Æ74æÖS¢vÖ7Öw&çB×v&æ–ærwÒÇB‚~hÈ{¾Yè¾hèiØ>ûÈ‡Öw&÷Wò×&—fF^ûÈKÉ®hèK¨[Ù>X˜Ò6÷&Rv÷&·76RXh^Šú^{¾Yè¾y¨Nh˜iÈXúşKúKÉ®ŠùŞûÈÎXÈ^hºÎiÊ®iÚ^˜	®‹ø~š¨ÎŠøy¨Nh‰YûÉ·×&—fFR[›n™ÙîK¸^™™÷væW.8.˜hºX[~KÙ>KÉ®ŠùŞK™şKÉ®xºÎz¸¾hèiØ>ûÈKˆî{¾Yè¾hèiØ>K‹®(	Îh‰n(	ŞX[>{;¾ûÈûÉ¾K¸^z{¾™šNX[~KÙ>KÉ®ŠùŞKˆŞˆ;Şi*N™H{¾Yè¾hèiØ>8.›¹ŠêNKˆŞhèK¨K»¾KÙ^iØ>™™ûÈÎh˜iÈ[z^X[~KùŞhÈX[>™zŞ8"rÂuG—Rw&çG2‡Öw&÷Wò×&—fFR’Ç’FòÄÂG'W7FVB6W76–öç2öbF†BG—R–âF†R7W'&VçB6÷&Rv÷&·76RÂ–æ6ÇVF–ærgWGW&RfW&–f–VBÖVÖ&W'2â×&—fFR—2äõB÷væW"ÖöæÇ’â6VÆV7F–ær7V6–f–26W76–öç2Ç6òw&çG2–æFWVæFVçFÇ’„õ"v—F‚G—R“²&VÖ÷f–ær7V6–f–26W76–öâÆöæR6ææ÷B&Wfö¶RG—Rw&çBâæòw&çG2&RÆ–VB'’FVfVÇBæBÆÂFööÇ27F’F—6&ÆVBâr’’ÀĞ¢ââåµ²v÷&F–æ'’rÂ~išî˜	¢E4‚KÉ®ŠùÒuÒÅ²wÖw&÷WrÂu{êNˆ¢uÒÅ²w×&—fFRrÂuzxˆ¢uÕÒæÖ‚…·G—RÆÆ&VÅÒ“Óæ‚‚vÆ&VÂrÇ¶¶W“§G—RÇ7G–ÆS§¶F—7Æ“¢v&Æö6²w×ÒÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦G&gBç6W76–öåG—W2æ–æ6ÇVFW2‡G—R’Æöä6†ævS¦SÓæ×WFFR‚w6W76–öåG—W2rÆRçF&vWBæ6†V6¶VCõ²ââæG&gBç6W76–öåG—W2ÇG—UÓ¦G&gBç6W76–öåG—W2æf–ÇFW"‡cÓçbÓ×G—R’—Ò’ÇB†Æ&VÂÇG—R’’’ÀĞ¢‚‚vf–VÆG6WBrÆçVÆÂÆ‚‚vÆVvVæBrÆçVÆÂÇB‚~h‰n˜hºX[~KÙ>KÉ®ŠùŞûÈhÈXúşKú”BhèiØ>ûÈ’rÂt÷"6†ö÷6R6W76–öç2‡G'W7FVB”G2’r’’ÀĞ¢ââç6W76–öç2æÖ‡3Óæ‚‚vÆ&VÂrÇ¶¶W“§2æ–GÒÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦G&gBç6W76–öä–G2æ–æ6ÇVFW2‡2æ–B’Æöä6†ævS¦SÓæ×WFFR‚w6W76–öä–G2rÆRçF&vWBæ6†V6¶VCõ²ââæG&gBç6W76–öä–G2Ç2æ–EÓ¦G&gBç6W76–öä–G2æf–ÇFW"†–CÓæ–BÓ×2æ–B’—Ò’Ç2çF—FÆR’’ÀĞ¢‚‚vFWF–Ç2rÆçVÆÂÆ‚‚w7VÖÖ'’rÆçVÆÂÇB‚~š¹{ª~ûÉ¥6W76–öâ”BX‰~Š‚rÂtGfæ6VC¢6W76–öâ”G2r’’Æ‚‚wFW‡F&VrÇ²v&–ÖÆ&VÂs¢tÔ56W76–öâ”G2rÇfÇVS¦G&gBç6W76–öä–G2æ¦ö–â‚uÆâr’Æöä6†ævS¦SÓæ×WFFR‚w6W76–öä–G2rÆRçF&vWBçfÇVRç7Æ—B‚uÆâr’æÖ‡ƒÓç‚çG&–Ò‚’’æf–ÇFW"„&ööÆVâ’—Ò’’’ÀĞ¢‚‚vƒ2rÆçVÆÂÇB‚~[z^X[~ûÈšinjÊKùŞZÙ[›n‹ùîhê^YîXùxëûÈ’rÂuFööÇ2†F—66÷fW&VBgFW"6f–æræB6öææV7F–ær’r’’ÀĞ¢ââæF—66÷fW&VBæÖ‡FööÃÓç¶6öç7BsÖG&gBçFööÇ5·FööÂææÖUÓó÷¶Væ&ÆVC¦fÇ6RÆ6FVv÷'“¢ww&—FRrÆÆÆ÷u6–FTVffV7G3¦fÇ6WÓ¶6öç7B6†ævSÒ†²Çb“Óæ×WFFR‚wFööÇ2rÇ²ââæG&gBçFööÇ2Å·FööÂææÖUÓ§²ââærÅ¶µÓ§g×Ò“·&WGW&â‚‚v'F–6ÆRrÇ¶¶W“§FööÂææÖWÒÆ‚‚w7G&öærrÆçVÆÂÇFööÂææÖR’Æ‚‚wrÆçVÆÂÇFööÂæFW67&—F–öâ’Æ‚‚vFWF–Ç2rÆçVÆÂÆ‚‚w7VÖÖ'’rÆçVÆÂÇB‚~Xø.i[66†VÖûÈZIn˜:i[hÚîûÈ’rÂu&ÖWFW"66†VÖ†W‡FW&æÂFF’r’’Æ‚‚w&RrÆçVÆÂÄ¥4ôâç7G&–æv–g’‡FööÂæ–çWE66†VÖÆçVÆÂÃ"’’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦ræVæ&ÆVBÆöä6†ævS¦SÓæ6†ævR‚vVæ&ÆVBrÆRçF&vWBæ6†V6¶VB—Ò’ÇB‚~hèiØ>jÚN[z^X[rrÂtWF†÷&—¦RF†—2FööÂr’’ÀĞ¢‚‚w6VÆV7BrÇ·fÇVS¦ræ6FVv÷'’Æöä6†ævS¦SÓæ6†ævR‚v6FVv÷'’rÆRçF&vWBçfÇVR—ÒÆ‚‚v÷F–öârÇ·fÇVS¢w&VBwÒÇB‚~{¸şzêynYzîŠêNXú®Šû²rÂtFÖ–âÖ6öæf—&ÖVB&VBöæÇ’r’’Æ‚‚v÷F–öârÇ·fÇVS¢ww&—FRwÒÇB‚~XiXZRòZInXùrÂuw&—FRò6VæBr’’Æ‚‚v÷F–öârÇ·fÇVS¢w7—7FVÒwÒÇB‚~{;¾{¹şi8ŞKÙÂrÂu7—7FVÒ÷W&F–öâr’’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦ræÆÆ÷u6–FTVffV7G2Æöä6†ævS¦SÓæ6†ævR‚vÆÆ÷u6–FTVffV7G2rÆRçF&vWBæ6†V6¶VB—Ò’ÇB‚~iˆîzîXXŠëXšşKÙÎyJ‚rÂtW‡Æ–6—FÇ’ÆÆ÷r6–FRVffV7G2r’’“·Ò’ÀĞ¢‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óæ7F–öâ†7–æ2‚“Óç¶v—B’‚röÖ7÷6fRrÇ·&Wf—6–öã¦VF—E&Wf—6–öâÇ6W'fW#¦G&gGÒ“·6WDG&gB†çVÆÂ“·Ò—ÒÇB‚~KùŞZÙ‚rÂu6fRr’’ÀĞ¢‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óç·6WDG&gB†çVÆÂ“·6WE6V7&WB‚rr“·×ÒÇB‚~i*N™HKúîiK’rÂt6æ6VÂVF—G2r’’“¦çVÆÂ’“°Ğ§ĞĞ ¦gVæ7F–öâÆFf÷&ÕæVÂ‡·7FGW2Ç&Vg&W6‚ÇGÒ—°Ğ¢6öç7B·6VÆV7FVBÇ6WE6VÆV7FVEÓ×W6U7FFR†çVÆÂ’Å·F"Ç6WEF%Ó×W6U7FFR‚v66÷VçBr’Å¶f–ÇFW"Ç6WDf–ÇFW%Ó×W6U7FFR‚rr’Å¶W'&÷"Ç6WDW'&÷%Ó×W6U7FFR‚rr’Å¶'W7’Ç6WD'W7•Ó×W6U7FFR†fÇ6R’Å·&W7VÇBÇ6WE&W7VÇEÓ×W6U7FFR†çVÆÂ’Å¶÷W&F–öâÇ6WD÷W&F–öåÓ×W6U7FFR‚w&VBr’Å·F&vWBÇ6WEF&vWEÓ×W6U7FFR‚rr’Å·VW'’Ç6WEVW'•Ó×W6U7FFR‚rr’Å¶–BÇ6WD–EÓ×W6U7FFR‚rr’Å·6V7&WBÇ6WE6V7&WEÓ×W6U7FFR‚rr’Å¶66WFVBÇ6WD66WFVEÓ×W6U7FFR†fÇ6R’Å¶6öÖÖVçEFW‡BÇ6WD6öÖÖVçEFW‡EÓ×W6U7FFR‚rr’Å¶6öÖÖVçD–BÇ6WD6öÖÖVçD–EÓ×W6U7FFR‚rr’Å·6ö6–Ä÷Ç6WE6ö6–Ä÷Ó×W6U7FFR‚vÆ–¶Rr’Å·‡6V5Fö¶VâÇ6WE‡6V5Fö¶VåÓ×W6U7FFR‚rr’Å¶Æöv–ä66÷VçBÇ6WDÆöv–ä66÷VçEÓ×W6U7FFR‚rr’Å¶Æöv–å77v÷&BÇ6WDÆöv–å77v÷&EÓ×W6U7FFR‚rr“°Ğ¢6öç7BÆÃÕ²âââ‡7FGW3òçÆFf÷&×3óõµÒ’Ââââ‡7FGW3òç6–×VÆF–öç3óõµÒ•ÒÇÖÆÂæf–æB‡ƒÓç‚æ–CÓÓ×6VÆV7FVB“°Ğ¢6öç7B6V7F–öç3Õµ²v66÷VçBrÂ~‹JnXûrrÂt66÷VçBuÒÅ²v'&÷w6RrÂ~kXşŠx‚rÂt'&÷w6RuÒÅ²vWFöæö×’rÂ~ˆz®K‹¾kK¾Xª‚rÂtWFöæö×’uÒÅ²wW&Ö—76–öç2rÂ~K©.XªiØ>™™rÂuW&Ö—76–öç2uÒÅ²v†—7F÷'’rÂ~{¸şXènŠë[ÙRrÂtW‡W&–Væ6W2uÒÅ²vF–væ÷7F–72rÂ~Šø®ijÒrÂtF–væ÷7F–72uÕÓ°Ğ¢6öç7BÆ&VÇ3×¶'&÷w6S¥²~x:Ş™z‚òhêˆÙrÂu÷VÆ"ò'&÷w6RuÒÇ6V&6ƒ¥²~i	Î{J"rÂu6V&6‚uÒÇ&VC¥²~Šúnh8RrÂtFWF–Ç2uÒÆ6öÖÖVçG3¥²~ŠøNŠë®XË¢rÂt6öÖÖVçG2uÒÇ&VÆFVC¥²~y»X[>Xh^Zë’rÂu&VÆFVBuÒÇ7V'F—FÆW3¥²~ZÙ~[™RrÂu7V'F—FÆW2uÒÆ–ÖvW3¥²~Y»îx˜rrÂt–ÖvW2uÒÆÆ–¶S¥²~x+‹YârÂtÆ–¶RuÒÆff÷&—FS¥²~iKn‰xòrÂtff÷&—FRuÒÆ6öÖÖVçC¥²~ŠøNŠë¢rÂt6öÖÖVçBuÒÇ&WÇ“¥²~Y¹îZHÒrÂu&WÇ’uÒÆföÆÆ÷s¥²~X[>k:‚rÂtföÆÆ÷ruÒÆÖW76vS¥²~zxKúrÂtÖW76vRuÒÇV&Æ—6ƒ¥²~Xù[ˆ2rÂuV&Æ—6‚u×Ó°Ğ¢6öç7B6ö6–ÃÕ²vÆ–¶RrÂvff÷&—FRrÂv6öÖÖVçBrÂw&WÇ’rÂvföÆÆ÷rrÂvÖW76vRrÂwV&Æ—6‚uÒÇ&VG3Õ²v'&÷w6RrÂw6V&6‚rÂw&VBrÂv6öÖÖVçG2rÂw&VÆFVBrÂw7V'F—FÆW2rÂv–ÖvW2uÓ°Ğ¢6öç7B6F–öãÖ÷ÓçB‚âââ†Æ&VÇ5¶÷Óóõ¶÷Æ÷Ò’“°Ğ¢6öç7B66÷VçC×òæ66÷VçCòæ66÷VçG3òæf–æB†Óæç7FGW3ÓÓÒvWF†VçF–6FVBr“ó÷òæ66÷VçCòæ66÷VçG3òå³ÒÇVæF–æs×òæ66÷VçCòçVæF–æs°Ğ¢6öç7B7FFTÆ&VÃ×ƒÓç‚æ66÷VçCòæF–væ÷7F–73òæÆöv–ãòç&VF–æW73òæ–FVçF—G“ÓÓÒwVæF–ærs÷B‚~{Ùš^[{.y›¾[ÙR+r‹ª¾K»Ş[è^š¨ÎŠørÂuvV'6—FRWF†VçF–6FVB+r–FVçF—G’VæF–ærr“§‚ç6–×VÆFVC÷B‚~jŠh¹şjŠ[ÈòrÂu6–×VÆF–öâr“§‚æ66÷VçCòçVæF–æs÷B‚~zØ[è^iÊÎK«®hèiØ2rÂuv—F–ærf÷"WF†÷&—¦F–öâr“§‚æ66÷VçCòæ66÷VçG3òç6öÖR†Óæç7FGW3ÓÓÒvWF†VçF–6FVBr“ò‡‚æ6&–Æ—F–W2æÆVæwFƒò‡‚çW&Ö—76–öç2ç6öÖR†÷Óç6ö6–Âæ–æ6ÇVFW2†÷’“÷B‚~[{.y›¾[ÙR+rhÈhèiØ>K©.Xª‚rÂt6öææV7FVB+r66÷VB7F–öç2r“§B‚~[{.y›¾[ÙR+rXiXZ^X[>™zÒrÂt6öææV7FVB+rw&—FW2öfbr’“§B‚~[{.y›¾[ÙR+rizXh^ZëŠû¾XùniØ>™™rÂt6öææV7FVB+ræò6öçFVçB66W72r’“§‚æ66÷VçCòæ66÷VçG3òç6öÖR†Óæç7FGW3ÓÓÒv7&VFVçF–Ç5öW‡—&VBr“÷B‚~XzŞhÚî‹ø~iÉşûÈÎŠû~˜xŞik‹ùîhêRrÂt7&VFVçF–Ç2W‡—&VC²&V6öææV7Br“§B‚~iÊ®‹ùîhê^‹JnXûrrÂtæò66÷VçB6öææV7FVBr“°Ğ¢6öç7B66÷VçE7FFS×7FGW3ÓçB‚‡¶WF†VçF–6FVC¢~[{.š¨ÎŠørÆ7&VFVçF–Ç5öW‡—&VC¢~XzŞhÚî[{.‹ø~iÉòrÆF—6&ÆVC¢~[{.XÎyJ‚wÒ•·7FGW5Óóò~x«nhiÊ®yúRrÂ‡¶WF†VçF–6FVC¢ufW&–f–VBrÆ7&VFVçF–Ç5öW‡—&VC¢t7&VFVçF–Ç2W‡—&VBrÆF—6&ÆVC¢tF—6&ÆVBwÒ•·7FGW5ÓóòuVæ¶æ÷vâ7FGW2r“°Ğ¢6öç7BWf–FVæ6U7FFS×fÇVSÓçB‚‡·6–×VÆF–öã¢~jŠh¹òrÂvÆ—fR×&VBs¢~[›>XûZéîŠû²rÂvÆ—fRÖ7F–öâs¢~[›>Xûi8ŞKÙÂwÒ•·fÇVUÓóò~iÊ®yú^ŠøhÚârÂ‡·6–×VÆF–öã¢u6–×VÆF–öârÂvÆ—fR×&VBs¢tÆ—fR&VBrÂvÆ—fRÖ7F–öâs¢tÆ—fR7F–öâwÒ•·fÇVUÓóòuVæ¶æ÷vâWf–FVæ6Rr“°Ğ¢6öç7B&V6÷&E7FFS×fÇVSÓçB‚‡·7F÷&VC¢~[{.KùŞZÙ‚rÇVæF–æs¢~[è^KùŞZÙ‚wÒ•·fÇVUÓóò~x«nhiÊ®yúRrÂ‡·7F÷&VC¢u6fVBrÇVæF–æs¢uVæF–ærwÒ•·fÇVUÓóòuVæ¶æ÷vâ7FGW2r“°Ğ¢6öç7Bf×EF–ÖS×fÇVSÓç¶–b‚‡G—VöbfÇVRÓÒw7G&–ærrbgG—VöbfÇVRÓÒvçVÖ&W"r—ÇÇfÇVSÓÓÒrr—&WGW&âçVÆÃ¶6öç7BCÖæWrFFR‡fÇVR“·&WGW&âçVÖ&W"æ—4f–æ—FR†BævWEF–ÖR‚’“öBçFôÆö6ÆU7G&–ær‚“¦çVÆÃ·Ó°Ğ¢6öç7BW'&÷$†–çCÖ6öFSÓâ‡´4õ$UõÄDdõ$ÕôÄôt”åôÔ•54”äs§B‚~y›¾[Ù^z©~Xú>[{.X[>™zŞh‰nKÉ®ŠùŞZKiXûÈÎŠû~˜xŞik[ÈZx¾hèiØ>ûÉ¾zØiÊÎš^zîŠêN[{.y›¾[Ù^YîXhŞX[>™zŞz©~Xú>8"rÂtÆöv–âv–æF÷r6Æ÷6VB÷"6W76–öâW‡—&VBâ&W7F'BWF†÷&—¦F–öâæB¶VWF†Rv–æF÷r÷VâVçF–Â6öææV7FVBV'2âr’Ä4õ$UõÄDdõ$Õô5$TDTåD”Å5ôU…•$TC§B‚~y›¾[Ù^‹h^i{nûÈÎŠû~˜xŞik[ÈZx¾hèiØ>8"rÂtÆöv–âW‡—&VC²&W7F'BWF†÷&—¦F–öââr’Ä4õ$UõÄDdõ$Õô5D”ôåõTä´äõtã§B‚~{¹>iéÎKˆŞiˆîûÈÎ[{.™HZé®jÚNi8ŞKÙÎûÉ¾Šû~X‹[›>XûjZéîûÈÎKˆŞŠh˜xŞXùrÂt÷WF6öÖRVæ¶æ÷vâæBÆö6¶VC²fW&–g’öâF†RÆFf÷&ÒâFòæ÷B&W6VæBr’Ä4õ$UõÄDdõ$Õô5D”ôåôÅ$TE•õ$T4õ$DTC§B‚~jÚNi8ŞKÙÎ[{.Šë[Ù^ûÈÎzhjÚ.˜xŞZHŞXù˜rÂt7F–öâÇ&VG’&V6÷&FVC²&WÆ’&Æö6¶VBr’Ä4õ$UõÄDdõ$ÕõD$tUEôDTä”TC§B‚~Šû~XXhèiØ27F—f—G’6W76–öârÂtWF†÷&—¦RF†R7F—f—G’6W76–öâf—'7Br’Ä4õ$UõÄDdõ$ÕôÄôt”åõ$UT•$TC§B‚~Šû~XXy›¾[Ù^[›nš¨ÎŠø‹JnXûrrÂtÆör–âæBfW&–g’F†R66÷VçBr’Ä4õ$UõÄDdõ$ÕõU$Ô•54”ôåõ$UT•$TC§B‚~™ÈŠh[›>Xûh‰nzêynYhèiØ2rÂuÆFf÷&Ò÷"FÖ–æ—7G&F÷"W&Ö—76–öâ&WV—&VBr’Ä4õ$UõÄDdõ$Õõ$DUôÄ”Ô•DTC§B‚~[›>Xû™™kXûÈÎŠû~zˆŞYî˜xŞŠùRrÂu&FRÆ–Ö—FVC²&WG'’ÆFW"r’Ä4õ$UõÄDdõ$ÕõD”ÔTõUC§B‚~{Ù{¹ÎŠû~k.‹h^i{brÂtæWGv÷&²&WVW7BF–ÖVB÷WBr’Ä4õ$UõÄDdõ$ÕõD$tUEôäõEôô%4U%dTC§B‚~Šû~XXkXşŠxh‰ni	Î{J.‹ùiÚzÉNŠëûÈÎXhŞhš~ŠÎK©.Xª‚rÂt'&÷w6R÷"6V&6‚F†—2æ÷FR&Vf÷&R–çFW&7F–ærr’Ä4õ$UõÄDdõ$ÕõTå5Uõ%DTC§B‚~jÚNˆ;ŞX©¾[Ù>X˜ŞKˆŞiJşhÈrÂuF†—26&–Æ—G’—2Vç7W÷'FVBr’Ä4õ$UõÄDdõ$Õó3ss§B‚~[©NyJ[	®iÊ®[È˜	®ŠëîZH~hèiØ2rÂtFWf–6Rw&çB—2æ÷BVæ&ÆVBf÷"F†—2r’Ä4õ$UõÄDdõ$Õó3s§B‚~K¨Î{»Nz[{.‹ø~iÉşûÈÎŠû~˜xŞikXù‹[~y›¾[ÙRrÂu"W‡—&VC²&W7F'BÆöv–âr’Ä4õ$UõÄDdõ$Õó3s§B‚~hèiØ>KˆŞZÙYÊh‰niÊ®[È˜	®K‹¾XªŠz>{¹rÂtw&çBVæf–Æ&ÆR÷"7F—fRVæ&–æBæ÷BVæ&ÆVBr’Ä4õ$UõÄDdõ$Õô4ôôÄDõtã§B‚~[	®YÊŠû~k.Xk~XÛNiÉòrÂu&WVW7B6ööÆF÷vâ—27F—fRr’Ä4õ$Uõ$Ud•4”ôåô4ôädÄ”5C§B‚~Šëî{Úî[{.XùXÉnûÈÎŠû~X‹~ikYî˜xŞŠùRrÂu6WGF–æw26†ævVC²&Vg&W6‚æB&WG'’r—Ò•¶6öFUÓó÷B‚~i8ŞKÙÎiÊ®ZèÎh‰ûÈÎŠû~j8iú^˜XŞ{ÚîKˆîŠø®ijÒrÂt÷W&F–öâf–ÆVC²6†V6²6öæf–wW&F–öâæBF–væ÷7F–72r“°Ğ¢7–æ2gVæ7F–öâ7F–öâ†fâ—·6WD'W7’‡G'VR“·6WDW'&÷"‚rr“·6WE&W7VÇB†çVÆÂ“·G'—·6WE&W7VÇB†v—Bfâ‚’“·Ö6F6‚†R—·6WDW'&÷"†W'&÷$†–çB†RæÖW76vR’²r+rr¶RæÖW76vR“·Öf–æÆÇ—·6WE6V7&WB‚rr“·6WDÆöv–å77v÷&B‚rr“·6WE‡6V5Fö¶Vâ‚rr“¶v—B&Vg&W6‚‚“·6WD'W7’†fÇ6R“·×ĞĞ¢6öç7B6fS×F6ƒÓæ7F–öâ‚‚“Óæ’‚r÷ÆFf÷&Òö6öæf–wW&RrÇ·&Wf—6–öã§7FGW2ç&Wf—6–öâÆ–C§æ–BÆ6öæf–s§¶Væ&ÆVC§æVæ&ÆVBÇW&Ö—76–öç3§çW&Ö—76–öç2ÆÖ…&WVW7G3§æÖ…&WVW7G2ÆWFöæöÖ÷W3§æWFöæöÖ÷W2ÆÖ–ä–çFW'fÄ×3§æÖ–ä–çFW'fÄ×2Ç6ö6–Ã§ç6ö6–ÂÂââçF6‡×Ò’“°Ğ¢6öç7BWFƒÒ†æÖRÆ÷F–öç2“Óæ7F–öâ‚‚“Óæ’‚r÷ÆFf÷&Òö66÷VçBrÇ¶–C§æ–BÆ7F–öã¦æÖRÇ&Wf—6–öã§7FGW2ç&Wf—6–öâÆÆöv–ä–C§VæF–æsòæÆöv–ä–BÆ÷F–öç7Ò’“°Ğ¢òòF†—2VffV7BöæÇ’&VG2†÷7B7FFRâÆöv–â&öw&W76W2WfVâv—F‚æòT’Ö÷VçFVBàĞ¢W6TVffV7B‚‚“Óç¶–b‚—&WGW&ã¶ÆWB7F—fS×G'VRÆ–äfÆ–v‡CÖfÇ6S¶6öç7BF–ÖW#×6WD–çFW'fÂ†7–æ2‚“Óç¶–b‚7F—fWÇÆ–äfÆ–v‡B—&WGW&ã¶–äfÆ–v‡C×G'VS·G'—¶v—B&Vg&W6‚‚“·Ö6F6‚†R—¶–b†7F—fR—6WDW'&÷"†W'&÷$†–çB†RæÖW76vR’“·Öf–æÆÇ—¶–äfÆ–v‡CÖfÇ6S·×ÒÃ3“·&WGW&â‚“Óç¶7F—fSÖfÇ6S¶6ÆV$–çFW'fÂ‡F–ÖW"“·Ó·ÒÅ·òæ–EÒ“°Ğ Ğ¢6öç7B'FãÒ‡¦‚ÆVâÆfâÆF—6&ÆVCÖfÇ6R“Óæ‚‚v'WGFöârÇ¶F—6&ÆVC¦'W7—ÇÆF—6&ÆVBÆöä6Æ–6³¦fçÒÇB‡¦‚ÆVâ’“°Ğ¢6öç7B&Ò‡¦‚ÆVâ“Óæ‚‚wrÆçVÆÂÇB‡¦‚ÆVâ’“°Ğ¢6öç7B–çWCÒ†Æ&VÂÇfÇVRÇ6WBÇG—SÒwFW‡Br“Óæ‚‚vÆ&VÂrÆçVÆÂÆÆ&VÂ²rrÆ‚‚v–çWBrÇ·G—RÇfÇVRÆWFô6ö×ÆWFS¢vöfbrÆöä6†ævS¦SÓç6WB†RçF&vWBçfÇVR—Ò’“°Ğ¢6öç7BW&×3Ö÷3Óæ‚‚vf–VÆG6WBrÆçVÆÂÂââæ÷2æÖ†÷Óæ‚‚vÆ&VÂrÇ¶¶W“¦÷Ç7G–ÆS§¶F—7Æ“¢v–æÆ–æRÖ&Æö6²rÆÖ&v–ã£×ÒÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC§çW&Ö—76–öç2æ–æ6ÇVFW2†÷’ÆF—6&ÆVC¦'W7—ÇÂæ6&–Æ—F–W2æ–æ6ÇVFW2†÷’Æöä6†ævS¦SÓç6fR‡·W&Ö—76–öç3¦RçF&vWBæ6†V6¶VCõ²ââççW&Ö—76–öç2Æ÷Ó§çW&Ö—76–öç2æf–ÇFW"‡cÓçbÓÖ÷—Ò—Ò’Æ6F–öâ†÷’Âæ6&–Æ—F–W2æ–æ6ÇVFW2†÷“òr(	Br·B‚~[Ù>X˜ŞKˆŞiJşhÈrÂuVç7W÷'FVBr“¢rr’’“°Ğ¢ÆWBFWF–ÃÖçVÆÃ°Ğ¢–b‡bgF#ÓÓÒv66÷VçBr–FWF–ÃÖ‚‚w6V7F–öârÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~‹ùîhê^‹JnXûrrÂt6öææV7B66÷VçBr’’Æ‚‚wrÆçVÆÂÇ7FFTÆ&VÂ‡’’Çæ66÷VçCòæÆöv–äW'&÷#ö‚‚wrÇ·&öÆS¢vÆW'BwÒÆW'&÷$†–çB‡æ66÷VçBæÆöv–äW'&÷"’“¦çVÆÂÀĞ¢æ66÷VçCòç7F÷&vSÓÓÒwv–æF÷w2ÖG’s÷&‚~XzŞhÚîyKv–æF÷w2[Ù>X˜ŞyJh‹~XªZønKùŞZÙûÉ¾YîXûŠû¾XùnKˆî˜xŞY
şh.ZHŞXùnXk>K¨î‹JnXû~[Ù>X˜Şx«nhûÈÎKˆŞKÉ®K¸^XzŞiÈŞXªYÊ{«şi‹îzK®[{.y›¾[Ù^8"rÂuv–æF÷w2&÷FV7G26fVB7&VFVçF–Ç2f÷"F†R7W'&VçBW6W#²&6¶w&÷VæB&VBæB&W7F'B&V6÷fW'’FWVæBöâF†R66÷VçEÂw27W'&VçB7FFRâ6W'f–6Rf–Æ&–Æ—G’ÆöæRFöW2æ÷BÖVâÆövvVB–ââr“§&‚~jÚNhê^XZ^y¨NXzŞhÚîK¸^KùŞyYYÊ‹ù¾zˆ¾Xh^ûÈÎ˜xŞY
ş™È˜xŞik‹ùîhê^8"rÂuF†—2FFW"¶VW27&VFVçF–Ç2–âÖVÖ÷'“²&V6öææV7BgFW"&W7F'Bâr’ÀĞ¢66÷VçCö‚‚vF—brÆçVÆÂÀĞ¢‚‚wrÆçVÆÂÆG¶66÷VçBæF—7Æ”æÖWÇÇB‚~iÊ®YŞYŞ‹JnXûrrÂuVææÖVB66÷VçBr—Ò+rG¶66÷VçE7FFR†66÷VçBç7FGW2—Ö’ÀĞ¢‚‚wrÆçVÆÂÆf×EF–ÖR†66÷VçBçfW&–f–VDCóö66÷VçBæÆ7EfW&–f–VDB“öG·B‚~iÈ‹ùš¨ÎŠøi{n™{NûÉ¢rÂtÆ7BfW&–f–VC¢r—ÒG¶f×EF–ÖR†66÷VçBçfW&–f–VDCóö66÷VçBæÆ7EfW&–f–VDB—Ö§B‚~iÈ‹ùš¨ÎŠøi{n™{NiÊ®Šë[ÙRrÂtÆ7BfW&–f–6F–öâF–ÖRæ÷B&V6÷&FVBr’’ÀĞ¢f×EF–ÖR†66÷VçBæW‡—&W4B“ö‚‚wrÆçVÆÂÆG·B‚~iÈiXiÉşˆ{>ûÉ¢rÂufÆ–BVçF–Ã¢r—ÒG¶f×EF–ÖR†66÷VçBæW‡—&W4B—Ö“¦çVÆÂÀĞ¢‚‚vFWF–Ç2rÆçVÆÂÆ‚‚w7VÖÖ'’rÆçVÆÂÇB‚~‹JnXû~j~ŠønKˆîŠø®ijÒrÂt66÷VçB–FVçF–f–W'2æBF–væ÷7F–72r’’ÀĞ¢‚‚wrÆçVÆÂÆG·B‚~‹JnXûr”NûÉ¢rÂt66÷VçB”C¢r—ÒG¶66÷VçBæ66÷VçD–GÖ’ÀĞ¢‚‚wrÆçVÆÂÆG·B‚~XéşZx¾x«nhûÉ¢rÂu&r7FGW3¢r—ÒG¶66÷VçBç7FGW7Ö’ÀĞ¢‚‚w&RrÇ·7G–ÆS§·v†—FU76S¢w&R×w&rÇv÷&D'&V³¢v'&V²×v÷&Bw×ÒÄ¥4ôâç7G&–æv–g’†66÷VçBÆçVÆÂÃ"’’’“¦çVÆÂÀĞ¢ç6–×VÆFVC÷&‚~zk¾{«şjŠh¹şiz™Èy›¾[Ù^ûÈÎKˆŞŠû¾XùnXzŞhÚî8"rÂtöffÆ–æR6–×VÆF–öç2Fòæ÷BW6R7&VFVçF–Ç2âr“ Ğ¢‚‚vF—brÆçVÆÂÇæ–CÓÓÒw†–ö†öæw6‡RÖ'&÷w6W"sö‚‚vF—brÆçVÆÂÇ&‚~KÛşyJiÊÎYËhš~ŠÎiÈŞXªYÊYîXûyIşh‰K¨Î{»Nz8.Šû~iÊÎK«®hš¾zûÉ¾X[>™zŞŠëî{Úîš^KˆŞKÉ®KŠŞijŞ8$6öö¶–RyKv–æF÷w2E’XªZønKùŞZÙûÉ¾˜xŞY
şh.ZHŞKº^Zéî™˜^y›¾[Ù^x«nhK‹®Xxn8.iz™ÈKùŞhÈVFvRz©~Xú>h™>[È8"rÂtÆö6Â6W'f–6RvVæW&FW2"–âF†R&6¶w&÷VæBâ66â–÷W'6VÆc²6Æ÷6–ær6WGF–æw2FöW2æ÷B6æ6VÂÆöv–ââE’&÷FV7G26fVB6öö¶–W3²&W7F'B&V6÷fW'’föÆÆ÷w2F†R7GVÂÆöv–â7FFRâæòf—6–&ÆRVFvRv–æF÷r—2&WV—&VBâr’Æ‚‚vÆ&VÂrÆçVÆÂÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦66WFVBÆöä6†ævS¦SÓç6WD66WFVB†RçF&vWBæ6†V6¶VB—Ò’ÇB‚~iÊÎK«®YÎhHşhš¾z‹ùîhê^K‰>yJ‹JnXûrrÂt’6öç6VçBFò6öææV7B×’FVF–6FVB66÷VçBr’’Çæ66÷VçCòæF–væ÷7F–73ö‚‚vFWF–Ç2rÆçVÆÂÆ‚‚w7VÖÖ'’rÆçVÆÂÇB‚~Šø®ijŞKúhòrÂtF–væ÷7F–72r’’Æ‚‚w&RrÇ·7G–ÆS§·v†—FU76S¢w&R×w&rÇv÷&D'&V³¢v'&V²×v÷&Bw×ÒÄ¥4ôâç7G&–æv–g’‡¶&6¶VæC§æ66÷VçBæF–væ÷7F–72æ&6¶VæBÇfW'6–öã§æ66÷VçBæF–væ÷7F–72çfW'6–öâÇ7FvS§æ66÷VçBæF–væ÷7F–72ç7FvRÇ&VF–æW73§æ66÷VçBæF–væ÷7F–72æÆöv–ãòç&VF–æW77ÒÆçVÆÂÃ"’’“¦çVÆÂ“§æ–CÓÓÒw†–ö†öæw6‡Rsö‚‚vF—brÆçVÆÂÀĞ¢&‚~XXyK>Šû~Zêj˜	®‹ø~y¨N[ş{ª.KšbvV"[©NyJ8.ZéikyºîX˜ŞK¸^[ÈiKâ&6–5ö–æfşûÉ¾hš¾zh‰X©şKˆŞ[ÈiKîzÉNŠëi	Î{J.8ŠøNŠë®h‰nXù[ˆ>8"rÂtÇ’f÷"â&÷fVB„…2vV"f—'7BâöæÇ’&6–5ö–æfò—2÷Vã²Æöv–âFöW2æ÷Bw&çBæ÷FW2Â6öÖÖVçG2÷"V&Æ—6†–ærâr’ÀĞ¢‚‚vrÇ¶‡&Vc¢v‡GG3¢òö÷Væ66÷VçBç†–ö†öæw6‡Ræ6öÒö6öç6öÆRö2rÇF&vWC¢uö&Ææ²rÇ&VÃ¢væö÷VæW"æ÷&VfW'&W"wÒÇB‚~Zéik[©NyJzêybrÂtöff–6–ÂÆ–6F–öâ6öç6öÆRr’’ÀĞ¢–çWB‚t”BrÆ–BÇ6WD–B’Æ–çWB‚t6V7&WBrÇ6V7&WBÇ6WE6V7&WBÂw77v÷&Br’Ç&‚u6V7&WBK‹®Xú®Xi‹é>XZ^ûÈÎKˆŞKùŞZÙX‹˜XŞ{ÚîûÉ¾K¸^KÛşyJKÚiÈiØ>zêyny¨N[©NyJ8"rÂu6V7&WB—2w&—FRÖöæÇ’æBW†6ÇVFVBg&öÒ6öæf–s²W6RöæÇ’â–÷R6öçG&öÂâr’“ Ğ¢‚‚vF—brÆçVÆÂÇ&‚~{Ùš^hš¾zKÛşyJ‚.z¹{Ùz¹y›¾[Ù^hê^Xú>ûÈÎ[›n™Ùî[ÈiKî[›>XûôWFûÉ¾XúşyJh
~Xúşˆ;Ş™¨ş[›>XûXùXÉn8.jÚ>[Èş[ÈiKî[›>Xûhê^XZ^™ÈŠh[ÈXùˆ^[©NyJZêj8"rÂuvV""W6W2&–Æ–&–Æ’vV'6—FRÆöv–âÂæ÷B÷VâÆFf÷&ÒôWFƒ²f–Æ&–Æ—G’Ö’6†ævRâ÷VâÆFf÷&Ò66W72&WV—&W2â&÷fVBâr’Æ‚‚vrÇ¶‡&Vc¢v‡GG3¢òö÷Vâæ&–Æ–&–Æ’æ6öÒöFö2rÇF&vWC¢uö&Ææ²rÇ&VÃ¢væö÷VæW"æ÷&VfW'&W"wÒÇB‚~Zéik[ÈiKî[›>XûŠûNiˆârÂtöff–6–Â÷VâÆFf÷&ÒFö72r’’Æ‚‚vÆ&VÂrÆçVÆÂÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦66WFVBÆöä6†ævS¦SÓç6WD66WFVB†RçF&vWBæ6†V6¶VB—Ò’ÇB‚~iÊÎK«®K‹¾XªKÛşyJ{Ùš^hš¾z‹ùîhêRrÂt’6†ö÷6RvV""Æöv–âr’’’ÀĞ¢'Fâ‚~[ÈZx¾hèiØ2rÂu7F'BWF†÷&—¦F–öârÂ‚“ÓæWF‚‚v&Vv–ârÇæ–CÓÓÒw†–ö†öæw6‡RÖ'&÷w6W"s÷¶66WD'&÷w6W#¦66WFVGÓ§æ–CÓÓÒv&–Æ–&–Æ’s÷¶ÖWF†öC¢wvV"×"rÆ66WEvV$FFW#¦66WFVGÓ§¶–BÆ6V7&WC§6V7&WGÒ’ÂVæF–æwÇÂ‡æ–CÓÓÒw†–ö†öæw6‡Rsò‚–GÇÂ6V7&WB“¢66WFVB’’ÀĞ¢VæF–æsö‚‚vF—brÆçVÆÂÇVæF–æræÖWF†öCÓÓÒvFVF–6FVBÖ'&÷w6W"s÷&‚~Šû~YÊxºÎz¸¾z©~Xú>ZèÎh‰y›¾[Ù^ûÉ´†÷7BYîXûKÉ®ˆz®XªzîŠêNûÈÎX[>™zŞŠëî{Úîš^KˆŞKÉ®KŠŞijŞ8.Šû~zØiÊÎš^i‹îzK®[{.y›¾[Ù^YîXhŞX[>™zŞz©~Xú>8"rÂt6ö×ÆWFRÆöv–â–âF†RFVF–6FVBv–æF÷rÂF†Vâ6†V6²WF†÷&—¦F–öââr“¦çVÆÂÇVæF–ærç$FFW&Ãö‚‚v–ÖrrÇ·7&3§VæF–ærç$FFW&ÂÆÇC§B‚~iÊÎK«®hš¾zhèiØ2rÂu66âFòWF†÷&—¦Rr’Çv–GFƒ£#CÆ†V–v‡C£#CÒ“¦çVÆÂÇ&‚~Šû~iÊÎK«®h™>[ÈZéikhèiØ>XZ^Xú>zîŠêNûÈÎ™¨şYîj8iú^x«nh8.X»şXˆnKª¾KˆjÊh
~™;îhê^8"rÂt÷VâF†Röff–6–ÂfW&–f–6F–öâvR–÷W'6VÆbÂF†Vâ6†V6²7FGW2âFòæ÷B6†&RF†RöæR×F–ÖRÆ–æ²âr’Å²vFVF–6FVBÖ'&÷w6W"rÂvÆö6Â×6W'f–6R×"uÒæ–æ6ÇVFW2‡VæF–æræÖWF†öB“öçVÆÃ¦‚‚vrÇ¶‡&Vc§VæF–ærçfW&–f–6F–öåW&ÂÇF&vWC¢uö&Ææ²rÇ&VÃ¢væö÷VæW"æ÷&VfW'&W"wÒÇB‚~h™>[ÈZéikhèiØ>XZ^Xú2rÂt÷Vâöff–6–ÂfW&–f–6F–öâr’’ÇVæF–ærçW6W$6öFSö‚‚v6öFRrÆçVÆÂÇVæF–ærçW6W$6öFR“¦çVÆÂÆ‚‚wrÆçVÆÂÆæWrFFR‡VæF–æræW‡—&W4B’çFôÆö6ÆU7G&–ær‚’’Æ'Fâ‚~X‹~iky›¾[Ù^x«nhrÂu&Vg&W6‚Æöv–â7FGW2rÂ‚“Óæ7F–öâ‚‚“Óç&Vg&W6‚‚’’’Æ'Fâ‚~Xùnkhy›¾[ÙRrÂt6æ6VÂÆöv–ârÂ‚“ÓæWF‚‚vÆöv÷WBr’’“¦çVÆÂÀĞ¢'Fâ‚~˜xŞikš¨ÎŠørÂufW&–g’rÂ‚“ÓæWF‚‚wfW&–g’r’Æ66÷VçCòç7FGW2ÓÒvWF†VçF–6FVBr’Çæ–CÓÓÒw†–ö†öæw6‡Rsö'Fâ‚~X‹~ikiÈiXXzŞhÚârÂu&Vg&W6‚7&VFVçF–Ç2rÂ‚“ÓæWF‚‚w&Vg&W6‚r’Âæ66÷VçCòæ6å&Vg&W6‚“¦çVÆÂÆ'Fâ‚~˜X{®iÊÎYË‹JnXûrrÂtF—66öææV7BÆö6ÆÇ’rÂ‚“ÓæWF‚‚vÆöv÷WBr’’Æ'Fâ‚~i*N™HhèiØ2rÂu&Wfö¶RWF†÷&—¦F–öârÂ‚“ÓæWF‚‚w&Wfö¶Rr’’Æ'Fâ‚~kˆ^™šN‹JnXû~Šë[ÙRrÂt6ÆV"66÷VçB&V6÷&BrÂ‚“ÓæWF‚‚v6ÆV"r’’’“°Ğ¢–b‡bgF#ÓÓÒv'&÷w6Rr–FWF–ÃÖ‚‚w6V7F–öârÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~Xù~hê~Xú®Šû¾kX¾ŠùRrÂt6öçG&öÆÆVB&VBFW7Br’’ÀĞ¢&‚~XX[ÈY
ş[›>XûY(ÎX[~KÙ>Šû¾XùniØ>™™8.kX¾Šù^ZHŞyJ‚7F—f—G’6W76–öâY(ÂÖVÖ÷'’4ÎûÉ¾j~š)8ŠøNŠë®ih~iÊÎKˆŞKº>ŠZèÎi[NŠx.yÈ¾8"rÂtVæ&ÆRF†RÆFf÷&ÒæB7V6–f–2&VG2f—'7BâFW7G2W6R7F—f—G’6W76–öâæBÖVÖ÷'’4Ã²ÖWFFF—2æ÷B6ö×ÆWFRf–Wv–ærâr’ÇW&×2‡&VG2’ÀĞ¢‚‚w6VÆV7BrÇ·fÇVS¦÷W&F–öâÆöä6†ævS¦SÓç6WD÷W&F–öâ†RçF&vWBçfÇVR—ÒÂââç&VG2æÖ†÷Óæ‚‚v÷F–öârÇ·fÇVS¦÷Æ¶W“¦÷ÆF—6&ÆVC¢æ6&–Æ—F–W2æ–æ6ÇVFW2†÷—ÒÆ6F–öâ†÷’’’’Æ–çWB‡B‚~Xh^Zë’”Bò%nXûrrÂt6öçFVçB”Bò%br’ÇF&vWBÇ6WEF&vWB’Æ–çWB‡B‚~i	Î{J.ŠøÒrÂuVW'’r’ÇVW'’Ç6WEVW'’’Çæ–CÓÓÒw†–ö†öæw6‡RÖ'&÷w6W"sö–çWB‡B‚~zÉNŠë™;îhê^KŠŞy¨B‡6V5÷Fö¶VîûÈXúş˜ûÈÎK¸^iÊÎjÊûÈ’rÂtÆ–æ²‡6V5÷Fö¶Vâ‡&WV—&VBÂF†—2&WVW7BöæÇ’’r’Ç‡6V5Fö¶VâÇ6WE‡6V5Fö¶VâÂw77v÷&Br“¦çVÆÂÀĞ¢'Fâ‚~hš~ŠÎXú®Šû¾kX¾ŠùRrÂu'Vâ&VBFW7BrÂ‚“Óæ7F–öâ‚‚“Óæ’‚r÷ÆFf÷&Ò÷&VBrÇ¶–C§æ–BÆ÷W&F–öâÆ–çWC§¶–C§F&vWBÇVW'’Ââââ‡‡6V5Fö¶Vã÷·‡6V5Fö¶VçÓ§·Ò—×Ò’’ÂæVæ&ÆVGÇÂçW&Ö—76–öç2æ–æ6ÇVFW2†÷W&F–öâ’’“°Ğ¢–b‡bgF#ÓÓÒvWFöæö×’r–FWF–ÃÖ‚‚w6V7F–öârÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~[›>XûŠëş™zîKˆîkK¾Xªš(NzérrÂt66W72æB7F—f—G’'VFvWBr’’Æ‚‚vÆ&VÂrÆçVÆÂÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC§æVæ&ÆVBÆF—6&ÆVC¦'W7’Æöä6†ævS¦SÓç6fR‡¶Væ&ÆVC¦RçF&vWBæ6†V6¶VGÒ—Ò’ÇB‚~XXŠëŠëş™zîjÚN[›>XûrÂtÆÆ÷rÆFf÷&Ò66W72r’’ÀĞ¢&‚~ˆz®K‹¾hê.{J.‹ù™ÈŠhXZ[kK¾Xª[ÈX[>Y(ÂÆ–fRYJN˜i.iË®KÉ®ûÉ¾KˆŞikZ)îYîXû‹>[ªn8"rÂtWFöæöÖ÷W2&VG2Ç6ò&WV—&RvÆö&ÂW‡Æ÷&F–öâæBÆ–fRv¶R÷÷'GVæ—F–W3²æòW‡G&66†VGVÆW"âr’Æ‚‚vÆ&VÂrÆçVÆÂÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC§æWFöæöÖ÷W3ÓÓ×G'VRÆF—6&ÆVC¦'W7’Æöä6†ævS¦SÓç6fR‡¶WFöæöÖ÷W3¦RçF&vWBæ6†V6¶VGÒ—Ò’ÇB‚~XXŠëˆz®K‹¾kK¾XªûÈK¸ŞXù~X[~KÙ>iØ>™™{ªniÙşûÈ’rÂtÆÆ÷rWFöæöÖ÷W27F—f—G’‡7V&¦V7BFòw&çG2’r’’Æ‚‚vÆ&VÂrÆçVÆÂÇB‚~Šû~k.™{N™©NûÈjú¾zy.ûÈ’rÂu&WVW7B6ööÆF÷vâ†×2’r’Æ‚‚v–çWBrÇ·G—S¢vçVÖ&W"rÆÖ–ã£ÆÖƒ£3cÆ¶W“§æ–B²v6ööÂr·æÖ–ä–çFW'fÄ×2ÆFVfVÇEfÇVS§æÖ–ä–çFW'fÄ×2Æöä&ÇW#¦SÓç¶–b„çVÖ&W"†RçF&vWBçfÇVR’Ó×æÖ–ä–çFW'fÄ×2—6fR‡¶Ö–ä–çFW'fÄ×3¤çVÖ&W"†RçF&vWBçfÇVR—Ò“·×Ò’’Æ‚‚wrÆçVÆÂÆG·B‚~K¸®iz^KÛşyJ‚òKˆ®™™ûÉ¢rÂuW6VBòF–Ç’Ö†–×VÓ¢r—ÒG·çW6VGÒòG·æÖ…&WVW7G7Ö’Æ‚‚v–çWBrÇ·G—S¢vçVÖ&W"rÆÖ–ã£ÆÖƒ£Âv&–ÖÆ&VÂs§B‚~jøşiz^Šû~k.Kˆ®™™rÂtF–Ç’&WVW7BÆ–Ö—Br’Æ¶W“§æ–B·æÖ…&WVW7G2ÆFVfVÇEfÇVS§æÖ…&WVW7G2Æöä&ÇW#¦SÓç¶6öç7BãÔçVÖ&W"†RçF&vWBçfÇVR“¶–b†âÓ×æÖ…&WVW7G2—6fR‡¶Ö…&WVW7G3¦çÒ“·×Ò’ÀĞ¢&‚~X[N‹j>yK7FFR{»NhªNûÉ¾iÊÎX	˜KˆŞZ)îXª[›>XûxºÎz¸¾X[N‹j>jŠYè¾h‰nˆz®Xª‹ÚîŠú.8"rÂt–çFW&W7G2&VÖ–â–â7FFS²F†—26æF–FFRFG2æò6W&FR–çFW&W7BÖöFVÂ÷"öÆÆ–ærâr’“°Ğ¢–b‡bgF#ÓÓÒwW&Ö—76–öç2r–FWF–ÃÖ‚‚w6V7F–öârÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~K©.XªiØ>™™rÂu6ö6–ÂW&Ö—76–öç2r’’Çç6–×VÆFVC÷&‚~Kº^Kˆ¾K¸^hš~ŠÎYh‰G'’×'Vî8"rÂuF†W6R7F–öç2&R7–çF†WF–2G'’×'Vç2âr“¢‡ç6ö6–Ã÷&‚~[›>XûhèiØ>YîXúşˆz®K‹¾kXşŠx[›nK©.XªûÈÎiz™È˜	iÚh›XxnzÉNŠë8.K¸^KÛşyJyÉşZéîkXşŠxXùn[é~y¨Nyºîj~ûÈÎKùŞyYKÉ®ŠùŞ™©Nzk¾8š)Ş[ªnKˆîXë¾˜xŞ8"rÂuÆFf÷&Òw&çG2ÆÆ÷rWFöæöÖ÷W2'&÷w6–æræB–çFW&7F–öâv—F†÷WBW"Öæ÷FR&÷fÂâF&vWG2×W7B6öÖRg&öÒ7GVÂ'&÷w6–æs²6W76–öâ—6öÆF–öâÂ'VFvWG2æBFVGWÆ–6F–öâ&VÖ–ââr“§&‚~jÚNhê^XZ^i¨.KˆŞiJşhÈyÉşZéîzKîKªNhš~ŠÎ8"rÂuF†—2FFW"FöW2æ÷B7W÷'BÆ—fR6ö6–Â7F–öç2âr’’ÇW&×2‡6ö6–Â’ÀĞ¢ç6ö6–Ãö‚‚vF—brÆçVÆÂÆ‚‚vƒBrÆçVÆÂÇB‚~hèiØ>ˆÈ>Y»BrÂtÆÆ÷vVBF&vWG2r’’ÀĞ¢‚‚wrÆçVÆÂÇB‚~KÛşyJ‚†÷7BX‰¾[»®y¨B6÷&R7F—f—G’6W76–öâˆz®Xªhš~ŠÎûÉ¾iz™Èh˜¾Xª˜hºzÉNŠëh‰nKÉ®ŠùŞ8"rÂuW6W2F†R†÷7BÖ7&VFVB6÷&R7F—f—G’6W76–öâWFöÖF–6ÆÇ“²æòÖçVÂæ÷FR÷"6W76–öâ6VÆV7F–öââr’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÇB‚~jøşzxŞi8ŞKÙÎjøşiz^Kˆ®™™rÂtF–Ç’Æ–Ö—BW"7F–öâr’Æ‚‚v–çWBrÇ·G—S¢vçVÖ&W"rÆÖ–ã£ÆÖƒ£Æ¶W“¢w6ö6–ÂÖÆ–Ö—Br·ç6ö6–ÂæF–Ç”Æ–Ö—BÆFVfVÇEfÇVS§ç6ö6–ÂæF–Ç”Æ–Ö—BÆöä&ÇW#¦SÓç¶–b„çVÖ&W"†RçF&vWBçfÇVR’Ó×ç6ö6–ÂæF–Ç”Æ–Ö—B—6fR‡·6ö6–Ã§²ââçç6ö6–ÂÆF–Ç”Æ–Ö—C¤çVÖ&W"†RçF&vWBçfÇVR—×Ò“·×Ò’’ÀĞ¢‚‚vÆ&VÂrÆçVÆÂÇB‚~jøşzxŞi8ŞKÙÎXk~XÛNjú¾zy"rÂt6ööÆF÷vâW"7F–öâ†×2’r’Æ‚‚v–çWBrÇ·G—S¢vçVÖ&W"rÆÖ–ã£ÆÖƒ£3cÆ¶W“¢w6ö6–ÂÖ6ööÂr·ç6ö6–Âæ6ööÆF÷vä×2ÆFVfVÇEfÇVS§ç6ö6–Âæ6ööÆF÷vä×2Æöä&ÇW#¦SÓç¶–b„çVÖ&W"†RçF&vWBçfÇVR’Ó×ç6ö6–Âæ6ööÆF÷vä×2—6fR‡·6ö6–Ã§²ââçç6ö6–ÂÆ6ööÆF÷vä×3¤çVÖ&W"†RçF&vWBçfÇVR—×Ò“·×Ò’’ÀĞ¢‚‚vƒBrÆçVÆÂÇB‚~hš~ŠÎyÉşZéîK©.Xª‚rÂtW†V7WFR&VÂ7F–öâr’’Æ‚‚w6VÆV7BrÇ·fÇVS§6ö6–Ä÷Æöä6†ævS¦SÓç6WE6ö6–Ä÷†RçF&vWBçfÇVR—ÒÂââå²vÆ–¶RrÂv6öÖÖVçBrÂw&WÇ’uÒæÖ†÷Óæ‚‚v÷F–öârÇ¶¶W“¦÷ÇfÇVS¦÷ÒÆ6F–öâ†÷’’’’Æ–çWB‡æ–CÓÓÒv&–Æ–&–Æ’sò~Šxnš)%b”Bs§B‚~Xh^Zë’”BrÂt6öçFVçB”Br’ÇF&vWBÇ6WEF&vWB’Çæ–CÓÓÒw†–ö†öæw6‡RÖ'&÷w6W"sö–çWB‡B‚~™;îhêR‡6V5÷Fö¶VîûÈXúş˜ûÈÎ[{.kXşŠxyºîj~ˆz®Xªˆë~XùnûÈ’rÂtÆ–æ²‡6V5÷Fö¶Vâ†÷F–öæÂf÷"ö'6W'fVB6öçFVçB’r’Ç‡6V5Fö¶VâÇ6WE‡6V5Fö¶VâÂw77v÷&Br“¦çVÆÂÇ6ö6–Ä÷ÓÓÒw&WÇ’sö–çWB‡B‚~XéşŠøNŠë¢”NûÈ{+îzîY¹îZHŞûÈ’rÂtW†7B&VçB6öÖÖVçB”Br’Æ6öÖÖVçD–BÇ6WD6öÖÖVçD–B“¦çVÆÂÇ6ö6–Ä÷ÓÒvÆ–¶Rsö–çWB‡B‚~ŠøNŠë®Xh^Zë’rÂt6öÖÖVçBFW‡Br’Æ6öÖÖVçEFW‡BÇ6WD6öÖÖVçEFW‡B“¦çVÆÂÀĞ¢&‚~jÚNhÈ™*îKÉ®yÉşy¨NY	[›>XûXùX{®i8ŞKÙÎ8.x+‹YîXú®ŠëîK‹®[{.x+‹YîûÉ¾ŠøNŠë®KˆŞKÉ®ˆz®Xª˜xŞXù8"rÂuF†—2'WGFöâ6VæG2&VÂ7F–öââÆ–¶RöæÇ’6WG2Æ–¶VC×G'VS²6öÖÖVçG2æWfW"WFò×&WG'’âr’ÀĞ¢'Fâ‚~hš~ŠÎ[{.hèiØ>K©.Xª‚rÂtW†V7WFRWF†÷&—¦VB7F–öârÂ‚“Óæ7F–öâ‚‚“Óæ’‚r÷ÆFf÷&Òö7F–öârÇ¶–C§æ–BÆ÷W&F–öã§6ö6–Ä÷Æ–çWC§¶–C§F&vWBÇFW‡C¦6öÖÖVçEFW‡BÆ6öÖÖVçD–BÆÆ–¶VC§G'VRÂâââ‡‡6V5Fö¶Vã÷·‡6V5Fö¶VçÓ§·Ò—×Ò’’ÂæVæ&ÆVGÇÂçW&Ö—76–öç2æ–æ6ÇVFW2‡6ö6–Ä÷’’ÀĞ¢‚‚vƒBrÆçVÆÂÇB‚~i8ŞKÙÎŠë[Ù^ûÈY
¾KˆŞzîZé®{¹>iéÎûÈ’rÂt7F–öâ¦÷W&æÂ†–æ6ÇVF–ærVæ¶æ÷vâ÷WF6öÖW2’r’’Ââââ‡æ7F–öç3óõµÒ’æÖ†Óæ‚‚wrÇ¶¶W“¦æ¶W—ÒÆG¶æ÷W&F–öçÒ+rG¶ææ÷FT–GÒ+rG¶ç7FGW7Ò+rG¶æWrFFR†æB’çFôÆö6ÆU7G&–ær‚—Ö’’“¦çVÆÂ“°Ğ¢–b‡bgF#ÓÓÒv†—7F÷'’r–FWF–ÃÖ‚‚w6V7F–öârÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~iÚ^k©Kˆî{¸şXèbrÂu6÷W&6W2æBW‡W&–Væ6W2r’’Ââââ‡7FGW2æW‡W&–Væ6W3óõµÒ’æf–ÇFW"†SÓæRçÆFf÷&ÓÓÓ×æ–B’æÖ†SÓæ‚‚v'F–6ÆRrÇ¶¶W“¦RæWfVçD–GÒÀĞ¢‚‚w7G&öærrÆçVÆÂÆRæö'6W'fF–öå7VÖÖ'“óö6F–öâ†Ræ÷W&F–öâ’’ÀĞ¢Rç6÷W&6UW&Ãö‚‚vrÇ¶‡&Vc¦Rç6÷W&6UW&ÂÇF&vWC¢uö&Ææ²rÇ&VÃ¢væö÷VæW"æ÷&VfW'&W"wÒÇB‚~iú^yÈ¾XéşZx¾iÚ^k©rÂt÷Vâ6÷W&6Rr’“¦çVÆÂÀĞ¢‚‚wrÆçVÆÂÆG¶Wf–FVæ6U7FFR†RæWf–FVæ6TÆWfVÃóòw6–×VÆF–öâr—Ò+rG¶6F–öâ†Ræ÷W&F–öâ—Ò+rG·&V6÷&E7FFR†Rç7FGW2—Ò+rG¶f×EF–ÖR†Ræö67W'&VDB“ó÷B‚~i{n™{NiÊ®Šë[ÙRrÂuF–ÖRæ÷B&V6÷&FVBr—Ö’ÀĞ¢‚‚vFWF–Ç2rÆçVÆÂÆ‚‚w7VÖÖ'’rÆçVÆÂÇB‚~h¨iÊşX[>ˆB”BrÂuFV6†æ–6Â”G2r’’ÀĞ¢‚‚wrÆçVÆÂÆWfVçC¢G¶RæWfVçD–GÖ’Æ‚‚wrÆçVÆÂÆÖVÖ÷'“¢G¶RæÖVÖ÷'”–Cóò~(	BwÖ’Æ‚‚wrÆçVÆÂÆ7F—f—G“¢G¶Ræ7F—f—G”–Cóò~(	BwÖ’’’’ÀĞ¢‡7FGW2æW‡W&–Væ6W3óõµÒ’ç6öÖR†SÓæRçÆFf÷&ÓÓÓ×æ–B“÷&‚~i¨.iz{¸şXèbrÂtæòW‡W&–Væ6W2–WBr“¦çVÆÂ“°Ğ¢–b‡bgF#ÓÓÒvF–væ÷7F–72r–FWF–ÃÖ‚‚w6V7F–öârÆçVÆÂÆ‚‚vƒ2rÆçVÆÂÇB‚~Šø®ijŞKˆîZèXZXÎjÚ"rÂtF–væ÷7F–72æB7F÷r’’Æ‚‚wrÆçVÆÂÆG·æÖöFWÒ+rG·çfW'6–öçÒ+rG·7FFTÆ&VÂ‡—Ö’ÀĞ¢&‚~{Ù{¹Î8™™kXY(ÎiØ>™™™IŠúşKˆŞKÉ®Y¹î˜K‹¢Öö6¾8.‹ùÎzˆ¾i*N™HKˆŞiJşhÈi{nK¸^ijŞ[ÈiÊÎYËûÈÎŠû~X‹[›>Xû‹JnXû~ZèXZš^z{¾™šNhèiØ>8"rÂtf–ÇW&W2æWfW"fÆÂ&6²FòÖö6²â–b&VÖ÷FR&Wfö¶R—2Vç7W÷'FVBÂF—66öææV7B—2Æö6ÂöæÇ“²&VÖ÷fRWF†÷&—¦F–öâ–âÆFf÷&Ò6WGF–æw2âr’Æ'Fâ‚~z¸¾XÛ>XÎyJ[›>XûrÂu7F÷ÆFf÷&ÒrÂ‚“Óç6fR‡¶Væ&ÆVC¦fÇ6RÇW&Ö—76–öç3¥µ×Ò’’Ç&‚~ZÙ~[™^8X[>™JîyK¾™Ú.Kˆî[Ë[™^[	®iÊ®ZéîxëûÈÎKˆŞhª^Y®ŠxnŠxynŠz>8"rÂu7V'F—FÆW2Â¶W–g&ÖW2æBFæÖ·R&Ræ÷B–×ÆVÖVçFVC²æòf—7VÂVæFW'7FæF–ær—26Æ–ÖVBâr’“°Ğ¢&WGW&â‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖW‡FVç6–öâwÒÆ‚‚vƒ"rÆçVÆÂÇB‚~[›>XûKŠŞ[ø2rÂuÆFf÷&Ò6VçFW"r’’Ç&‚~‹JnXû~8kXşŠxKˆîˆz®K‹¾kK¾Xª{¹şKˆzêynûÉ¾[›>XûY(ÂÔ5y»K©.xºÎz¸¾8"rÂtÖævR66÷VçG2Â'&÷w6–æræB7F—f—F–W3²ÆFf÷&×2&VÖ–â6W&FRg&öÒÔ5âr’ÀĞ¢ö‚‚vF—brÆçVÆÂÆ–çWB‡B‚~i	Î{J.[›>XûrÂu6V&6‚ÆFf÷&×2r’Æf–ÇFW"Ç6WDf–ÇFW"’Æ‚‚vF—brÇ·7G–ÆS§¶F—7Æ“¢vw&–BrÆw&–EFV×ÆFT6öÇVÖç3¢w&WVB†WFòÖf—BÆÖ–æÖ‚ƒ#3‚Ãg"’’rÆv£g×ÒÂââæÆÂæf–ÇFW"‡ƒÓâ‡‚æ–B²rr·‚ææÖR’çFôÆ÷vW$66R‚’æ–æ6ÇVFW2†f–ÇFW"çFôÆ÷vW$66R‚’’’æÖ†—FVÓÓæ‚‚v'F–6ÆRrÇ¶¶W“¦—FVÒæ–BÇ7G–ÆS§¶&÷&FW#¢s‚6öÆ–B7W'&VçD6öÆ÷"rÆ&÷&FW%&F—W3£"ÇFF–æs£g×ÒÆ‚‚vƒ2rÆçVÆÂÆ—FVÒææÖR’Æ‚‚wrÆçVÆÂÆG¶—FVÒæÖöFWÒ+rG¶—FVÒçfW'6–öçÖ’Æ‚‚wrÆçVÆÂÇ7FFTÆ&VÂ†—FVÒ’’Æ‚‚wrÆçVÆÂÆ—FVÒæ6&–Æ—F–W2æÖ†6F–öâ’æ¦ö–â‚ròr—ÇÇB‚~K¸^‹JnXû~‹ª¾K»ÒrÂt66÷VçB–FVçF—G’öæÇ’r’’Æ'Fâ‚~‹ù¾XZ^Šëî{ÚârÂt÷Vâ6WGF–æw2rÂ‚“Óç·6WE6VÆV7FVB†—FVÒæ–B“·6WEF"‚v66÷VçBr“·6WDW'&÷"‚rr“·6WE&W7VÇB†çVÆÂ“·Ò’’’’Æ‚‚vƒ2rÆçVÆÂÇB‚~iÊ®iÚ^[›>XûrÂtgWGW&RÆFf÷&×2r’’Ç&‚~˜	®‹ø~XúşKúXh^{Úî˜.˜XŞYšhš[^ûÈÎKˆŞK¸î{Ùš^ZèŠ8^hš~ŠÎKº>z8"rÂtW‡FVæBF‡&÷Vv‚G'W7FVB'V–ÇBÖ–âFFW'3²vV"vW26ææ÷B–ç7FÆÂ6öFRâr’“ Ğ¢‚‚vF—brÆçVÆÂÆ'Fâ‚~‹ùNY¹î[›>XûX‰~Š‚rÂt&6²FòÆFf÷&×2rÂ‚“Óç·6WE6VÆV7FVB†çVÆÂ“·6WE6V7&WB‚rr“·Ò’Æ‚‚vƒ2rÆçVÆÂÇææÖR’Æ‚‚væbrÇ·7G–ÆS§¶F—7Æ“¢vfÆW‚rÆfÆW…w&¢ww&rÆv£‡×ÒÂââç6V7F–öç2æÖ‚…¶–BÇ¦‚ÆVåÒ“Óæ‚‚v'WGFöârÇ¶¶W“¦–BÂv&–×&W76VBs§F#ÓÓÖ–BÆöä6Æ–6³¢‚“Óç·6WEF"†–B“·6WE&W7VÇB†çVÆÂ“·×ÒÇB‡¦‚ÆVâ’’’’ÆFWF–Â’ÀĞ¢W'&÷#ö‚‚wrÇ·&öÆS¢vÆW'BwÒÆW'&÷"“¦çVÆÂÇ&W7VÇCö‚‚wrÇ·&öÆS¢w7FGW2wÒÇ&W7VÇBç&VÖ÷FSÓÓÒwVç7W÷'FVBs÷B‚~iÊÎYË[{.ijŞ[ÈûÈÎ[›>XûKˆŞiJşhÈ‹ùÎzˆ¾i*N™HûÉ¾Šû~X‹‹JnXû~ZèXZš^˜X{®hèiØ>8"rÂtF—66öææV7FVBÆö6ÆÇ“²&VÖ÷FR&Wfö¶RVç7W÷'FVBâW6RÆFf÷&Ò66÷VçB6V7W&—G’6WGF–æw2âr“§B‚~i8ŞKÙÎZèÎh‰ûÈÎŠû~iú^yÈ¾iÈikx«nhKˆî{¸şXènŠë[Ù^8"rÂt÷W&F–öâ6ö×ÆWFVBâ6VR7W'&VçB7FGW2æBW‡W&–Væ6W2âr’“¦çVÆÂ“°Ğ§ĞĞ ¦6öç7B¶7&VFTVÆVÖVçC¦‚ÇW6U7FFRÇW6TVffV7BÇW6U&VgÓ×&WV—&R‚w&V7Br“°Ğ¦6öç7B¶7&VFU÷'FÇÓ×&WV—&R‚w&V7BÖFöÒr“°Ğ¦6öç7B553Ö Ğ¢æÖFWW2Ö6÷&R×6†VÆÇ°Ğ¢ÒÖ6÷&RÖ66VçC¢3#vCVS²ÒÖ6÷&RÖ66VçB×7G&öæs¢3ƒVSCs²ÒÖ6÷&RÖ66VçB×6ögC¢6SfcVVc²ÒÖ6÷&RÖ66VçBÖÆ–æS¢6#–SC°Ğ¢ÒÖ6÷&R×7W&f6S§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÂ6ffb“°Ğ¢ÒÖ6÷&R×7W&f6RÓ#§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â6cVc†cb“°Ğ¢ÒÖ6÷&R×7W&f6RÓ3§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó2Â6V6c&Vb“°Ğ¢ÒÖ6÷&RÖVÆWfFVC§f"‚ÒÖG7rÖÆ–2Ö'WGFöâÖVÆWfFVBÖf–ÆÂÂ6ffb“°Ğ¢ÒÖ6÷&R×FW‡C§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×&–Ö'’Â33&##b“°Ğ¢ÒÖ6÷&RÖ×WFVC§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×6V6öæF'’Â3c3s3fB“°Ğ¢ÒÖ6÷&RÖf–çC§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×FW'F–'’Â3ƒs“S†b“°Ğ¢ÒÖ6÷&RÖ&÷&FW#§f"‚ÒÖG7rÖÆ–2Ö&÷&FW"ÖÃ"Çf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â6F6SfS’“°Ğ¢ÒÖ6÷&RÖ&÷&FW"×7G&öæs§f"‚ÒÖG7rÖÆ–2Ö&÷&FW"×&–Ö'’Â63VCf6R“°Ğ¢ÒÖ6÷&RÖ†÷fW#§f"‚ÒÖG7rÖÆ–2Ö–çFW&7F—fRÖ&rÖ†÷fW"Â6VFc&Vb“°Ğ¢ÒÖ6÷&RÖ7F—fS§f"‚ÒÖG7rÖÆ–2Ö–çFW&7F—fRÖ&rÖ7F—fRÂ6SS–SR“°Ğ¢ÒÖ6÷&RÖFævW#§f"‚ÒÖG7rÖÆ–2×7FFRÖW'&÷"×&–Ö'’Â6#S63CB“°Ğ¢ÒÖ6÷&R×v&ã§f"‚ÒÖG7r×7FF–2ÖÖ&W"ÓcÂ6cf"“°Ğ¢ÒÖ6÷&RÖö³§f"‚ÒÖG7r×7FF–2Öw&VVâÓSÂ3c–Cf"“°Ğ¢ÒÖ6÷&R×&F—W3£gƒ°Ğ¢ÒÖ6÷&R×6†F÷s£‚'‚3“3#ƒÃ'‚3'‚3“3#ƒC°Ğ¢&÷‚×6—¦–æs¦&÷&FW"Ö&÷ƒ¶Ö–â×v–GFƒ£¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“°Ğ¢föçBÖfÖ–Ç“¦–æ†W&—C¶föçB×6—¦S£Gƒ¶Æ–æRÖ†V–v‡C£ãc²×vV&¶—BÖföçB×6Öö÷F†–æs¦çF–Æ–6VGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÅ¶FFÖ6÷&R×F†VÖSÖF&µ×°Ğ¢ÒÖ6÷&RÖ66VçC¢3c6Cf#²ÒÖ6÷&RÖ66VçB×7G&öæs¢3†6Sv3“²ÒÖ6÷&RÖ66VçB×6ögC¢3s63²ÒÖ6÷&RÖ66VçBÖÆ–æS¢3&CVSFS°Ğ¢ÒÖ6÷&R×7W&f6S§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÂ3ƒ#3b“°Ğ¢ÒÖ6÷&R×7W&f6RÓ#§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó"Â3#&3#‚“°Ğ¢ÒÖ6÷&R×7W&f6RÓ3§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"Ó2Â3#ƒ3S3“°Ğ¢ÒÖ6÷&RÖVÆWfFVC§f"‚ÒÖG7rÖÆ–2Ö'WGFöâÖVÆWfFVBÖf–ÆÂÂ3#&3#‚“°Ğ¢ÒÖ6÷&R×FW‡C§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×&–Ö'’Â6S†cVB“°Ğ¢ÒÖ6÷&RÖ×WFVC§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×6V6öæF'’Â6v#v#“°Ğ¢ÒÖ6÷&RÖf–çC§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×FW'F–'’Â3ƒ“C†B“°Ğ¢ÒÖ6÷&RÖ&÷&FW#§f"‚ÒÖG7rÖÆ–2Ö&÷&FW"ÖÃ"Çf"‚ÒÖG7rÖÆ–2Ö&÷&FW"×6V6öæF'’Â3&cC3’’“°Ğ¢ÒÖ6÷&RÖ&÷&FW"×7G&öæs§f"‚ÒÖG7rÖÆ–2Ö&÷&FW"×&–Ö'’Â3CSƒFR“°Ğ¢ÒÖ6÷&RÖ†÷fW#§f"‚ÒÖG7rÖÆ–2Ö–çFW&7F—fRÖ&rÖ†÷fW"Â6fffffc"“°Ğ¢ÒÖ6÷&RÖ7F—fS§f"‚ÒÖG7rÖÆ–2Ö–çFW&7F—fRÖ&rÖ7F—fRÂ6fffffcb“°Ğ¢ÒÖ6÷&R×6†F÷s£‚'‚3rÃG‚3‡‚3GĞĞ¢æÖFWW2Ö6÷&R×6†VÆÅ¶FFÖ6÷&R×F†VÖSÖF&µÒæ6÷&RÖÖ&·¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçBƒCVFVrÂ3c†c‚Â3&cvf—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÅ¶FFÖ6÷&R×F†VÖSÖF&µÒæ6÷&RÖ'FâÒ×&–Ö'—¶6öÆ÷#¢3sGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÅ¶FFÖ6÷&R×F†VÖSÖF&µÒæ6÷&RÖ'FâÒ×&–Ö'“¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶6öÆ÷#¢3sGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÅ¶FFÖ6÷&R×F†VÖSÖF&µÒæ6÷&RÖW‡FVç6–öâ'WGFöå¶&–×&W76VC×G'VU×¶6öÆ÷#¢3sGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ§¶&÷‚×6—¦–æs¦&÷&FW"Ö&÷‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂƒ"ÂæÖFWW2Ö6÷&R×6†VÆÂƒ2ÂæÖFWW2Ö6÷&R×6†VÆÂƒBÂæÖFWW2Ö6÷&R×6†VÆÂ¶Ö&v–â×F÷£ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂƒ'¶föçB×6—¦S£#ƒ¶Æ–æRÖ†V–v‡C£ã#S¶ÆWGFW"×76–æs¢Òã&VÓ¶Ö&v–ã£ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂƒ7¶föçB×6—¦S£Wƒ¶Æ–æRÖ†V–v‡C£ã3S¶ÆWGFW"×76–æs¢ÒãVÓ¶Ö&v–ã£ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂƒG¶föçB×6—¦S£7ƒ¶Æ–æRÖ†V–v‡C£ãC¶Ö&v–ã£‡‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ6öFRÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖÖöæ÷¶föçBÖfÖ–Ç“§V’ÖÖöæ÷76RÅ4dÖöæòÕ&VwVÆ"Ä6öç6öÆ2ÂtÆ–&W&F–öâÖöæòrÆÖöæ÷76S¶föçB×6—¦S¢ã“&V×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“·FW‡B×VæFW&Æ–æRÖöfg6WC£'‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ§v†W&R†'WGFöâÆ–çWBÇ6VÆV7BÇFW‡F&VÇ7VÖÖ'’Æ“¦fö7W2×f—6–&ÆW¶÷WFÆ–æS£'‚6öÆ–Bf"‚ÒÖ6÷&RÖ66VçB“¶÷WFÆ–æRÖöfg6WC£'‡ĞĞ¢æ6÷&RÖ÷fW&Æ—·÷6—F–öã¦f—†VC¶–ç6WC£·¢Ö–æFWƒ£““““¶F—7Æ“¦w&–C·Æ6RÖ—FV×3¦6VçFW#·FF–æs¦Ö–âƒGf‚Ã3'‚’Ö–âƒGgrÃC‚“¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Â3s2sRÇG&ç7&VçB“¶&6¶G&÷Öf–ÇFW#¦&ÇW"ƒg‚—ĞĞ¢æ6÷&RÖF–Æöw¶&÷‚×6—¦–æs¦&÷&FW"Ö&÷ƒ¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã·v–GFƒ¦Ö–âƒ#ƒ‚ÃR“¶†V–v‡C¦Ö–âƒ“‚Ã“&Gf‚“¶Ö–âÖ†V–v‡C£¶÷fW&fÆ÷s¦†–FFVã¶&÷&FW#£‚6öÆ–Bf"‚ÒÖG7rÖÆ–2Ö&÷&FW"ÖÃ"Â6FfS–SB“¶&÷&FW"×&F—W3£#'ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÂ6ffb“¶6öÆ÷#§f"‚ÒÖG7rÖÆ–2ÖÆ&VÂ×&–Ö'’Â33&##b“¶&÷‚×6†F÷s£3'‚“‚3s#CSRÃG‚‡‚3s#C&WĞĞ¢æ6÷&RÖF–ÆöræÖFWW2Ö6÷&R×6†VÆÇ¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶†V–v‡C£S¶Ö–âÖ†V–v‡C£·FF–æs£#‚#G‚ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÃâæ6÷&RÖ†VFW'¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦fÆW‚×7F'C¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£‡ƒ¶fÆWƒ¦æöæS·FF–æs£Gƒ¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æ6÷&RÖ'&æG¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£'ƒ¶Ö–â×v–GFƒ£ĞĞ¢æ6÷&RÖÖ&·¶F—7Æ“¦w&–C·Æ6RÖ—FV×3¦6VçFW#¶fÆWƒ¦æöæS·v–GFƒ£C'ƒ¶†V–v‡C£C'ƒ¶&÷&FW"×&F—W3£7ƒ¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçBƒCVFVrÇf"‚ÒÖ6÷&RÖ66VçB’Â3&cvf“¶6öÆ÷#¢6ffc¶föçB×6—¦S£‡ƒ¶föçB×vV–v‡C£ƒ¶ÆWGFW"×76–æs¢ÒãFVÓ¶&÷‚×6†F÷s£‡‚‡‚6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖ66VçB’#‚RÇG&ç7&VçB—ĞĞ¢æ6÷&RÖ'&æB×FW‡G¶Ö–â×v–GFƒ£ĞĞ¢æ6÷&RÖ'&æB×FW‡Bƒ'·v†—FR×76S¦æ÷w&¶÷fW&fÆ÷s¦†–FFVã·FW‡BÖ÷fW&fÆ÷s¦VÆÆ—6—7ĞĞ¢æ6÷&R×FvÆ–æW¶Ö&v–ã£7‚–×÷'FçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£'ƒ¶Æ–æRÖ†V–v‡C£ãGĞĞ¢æ6÷&RÖ†VFW"Ö7F–öç7¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶§W7F–g’Ö6öçFVçC¦fÆW‚ÖVæC¶v£‡ƒ¶fÆW‚×w&§w&¶fÆWƒ¦æöæWĞĞ¢æ6÷&RÖ'Fç¶V&æ6S¦æöæS¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶§W7F–g’Ö6öçFVçC¦6VçFW#¶v£gƒ¶Ö–âÖ†V–v‡C£3gƒ·FF–æs£w‚7ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖVÆWfFVB“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçC¦–æ†W&—C¶föçB×6—¦S£7ƒ¶föçB×vV–v‡C£c¶Æ–æRÖ†V–v‡C£ã#·v†—FR×76S¦æ÷w&¶7W'6÷#§ö–çFW#·G&ç6—F–öã¦&6¶w&÷VæBãG2Æ&÷&FW"Ö6öÆ÷"ãG2Æ6öÆ÷"ãG2Æ&÷‚×6†F÷rãG2ÇG&ç6f÷&ÒãG7ĞĞ¢æ6÷&RÖ'Fã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær—ĞĞ¢æ6÷&RÖ'Fã¦7F—fS¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ7F—fR“·G&ç6f÷&Ó§G&ç6ÆFU’ƒ‚—ĞĞ¢æ6÷&RÖ'Fã¦F—6&ÆVG¶÷6—G“¢ãCS¶7W'6÷#¦æ÷BÖÆÆ÷vVC¶&÷‚×6†F÷s¦æöæWĞĞ¢æ6÷&RÖ'FâÒÖv†÷7G¶&6¶w&÷VæC§G&ç7&VçGĞĞ¢æ6÷&RÖ'FâÒ×&–Ö'—¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB“¶6öÆ÷#¢6ffgĞĞ¢æ6÷&RÖ'FâÒ×&–Ö'“¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶6öÆ÷#¢6ffgĞĞ¢æ6÷&RÖ'FâÒÖFævW'¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’—ĞĞ¢æ6÷&RÖ'FâÒÖ6Æ÷6W¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"“¶Ö&v–âÖÆVgC£G‡ĞĞ¢æ6÷&R×F'7¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£Gƒ¶fÆWƒ¦æöæS·FF–æs£‚¶÷fW&fÆ÷r×ƒ¦WFó·67&öÆÆ&"×v–GFƒ§F†–ã¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æ6÷&R×F'3£¢×vV&¶—B×67&öÆÆ&'¶†V–v‡C£W‡ĞĞ¢æ6÷&R×F'2'WGFöç¶V&æ6S¦æöæS¶fÆWƒ¦æöæS¶&÷&FW#£‚6öÆ–BG&ç7&VçC¶&÷&FW"×&F—W3£““—ƒ·FF–æs£w‚7ƒ¶&6¶w&÷VæC§G&ç7&VçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçC¦–æ†W&—C¶föçB×6—¦S£7ƒ¶föçB×vV–v‡C£c·v†—FR×76S¦æ÷w&¶7W'6÷#§ö–çFW#·G&ç6—F–öã¦&6¶w&÷VæBãG2Æ6öÆ÷"ãG2Æ&÷&FW"Ö6öÆ÷"ãG7ĞĞ¢æ6÷&R×F'2'WGFöã¦†÷fW'¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B—ĞĞ¢æ6÷&R×F'2'WGFöå¶&–×&W76VC×G'VU×¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×6ögB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær—ĞĞ¢æ6÷&RÖÆW'G¶fÆWƒ¦æöæS¶Ö&v–ã£'‚·FF–æs£‚Gƒ¶&÷&FW#£‚6öÆ–B6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"“¶föçB×6—¦S£7ƒ¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æ6÷&RÖ&ææW'¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£'ƒ¶fÆW‚×w&§w&¶fÆWƒ¦æöæS¶Ö&v–ã£'‚·FF–æs£‚Gƒ¶&÷&FW#£‚6öÆ–B6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’3"RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’‚RÇf"‚ÒÖ6÷&R×7W&f6R’“¶föçB×6—¦S£7‡ĞĞ¢æ6÷&RÖ&ææW"æ6÷&RÖ'Fç¶fÆWƒ¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÃâæ6÷&RÖÖ–ç¶fÆWƒ£¶Ö–âÖ†V–v‡C£¶÷fW&fÆ÷r×“¦WFó¶÷fW&fÆ÷r×ƒ¦†–FFVã·FF–æs£‡‚'‚#gƒ·67&öÆÆ&"×v–GFƒ§F†–çĞĞ¢æÖFWW2Ö6÷&R×6†VÆÃâæ6÷&RÖÖ–ã£¢×vV&¶—B×67&öÆÆ&'·v–GFƒ£‡‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÃâæ6÷&RÖÖ–ã£¢×vV&¶—B×67&öÆÆ&"×F‡VÖ'¶&÷&FW"×&F—W3£‡ƒ¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2×67&öÆÆ&"Ö&rÖÃ"Â66&C†C"—ĞĞ¢æ6÷&RÖÖ–â×W'6öæÂæ6÷&RÖÖ–âÖÖVÖ÷'—¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶÷fW&fÆ÷s¦†–FFVâ–×÷'FçGĞĞ¢æ6÷&RÖÖ–â×W'6öæ·FF–ærÖ&÷GFöÓ£‡‚–×÷'FçGĞĞ¢æ6÷&RÖÖ–âÖÖVÖ÷'—·FF–ærÖ&÷GFöÓ£‡‚–×÷'FçGĞĞ¢æ6÷&RÖÖ–âÖÖVÖ÷'“âæÖæVÖR×‡¶fÆWƒ£¶Ö–âÖ†V–v‡C£¶†V–v‡C¦WF÷ĞĞ¢æ6÷&RÖ÷fW'f–Ww¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶v£G‡ĞĞ¢æ6÷&RÖ†W&÷·÷6—F–öã§&VÆF—fS¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒÃg"’Ö–æÖ‚ƒ#C‚Ã33‚“¶v£#ƒ¶Æ–vâÖ—FV×3¦6VçFW#·FF–æs£#'‚#Gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶&÷&FW"×&F—W3£#ƒ¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçBƒ3VFVrÇf"‚ÒÖ6÷&RÖ66VçB×6ögB’RÇf"‚ÒÖ6÷&R×7W&f6RÓ"’S‚RÇf"‚ÒÖ6÷&R×7W&f6R’R“¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r“¶÷fW&fÆ÷s¦†–FFVçĞĞ¢æ6÷&RÖ†W&ó¦gFW'¶6öçFVçC¢rs·÷6—F–öã¦'6öÇWFS·&–v‡C¢Ósƒ·F÷¢Óƒ·v–GFƒ£#ƒƒ¶†V–v‡C£#ƒƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶&÷&FW"×&F—W3£SS·ö–çFW"ÖWfVçG3¦æöæS¶÷6—G“¢ãgĞĞ¢æ6÷&RÖW–V'&÷w¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£wƒ¶6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶föçB×6—¦S£ãWƒ¶föçB×vV–v‡C£ƒ¶ÆWGFW"×76–æs¢ãFV×ĞĞ¢æ6÷&RÖ†W&òƒ'¶föçB×6—¦S£#Gƒ¶Æ–æRÖ†V–v‡C£ã3S¶Ö&v–ã£—‚w‡ĞĞ¢æ6÷&RÖ†W&ò¶Ö&v–ã£¶Ö‚×v–GFƒ£c#ƒ¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£7‡ĞĞ¢æ6÷&RÖ&FvW7¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£wƒ¶fÆW‚×w&§w&¶Ö&v–â×F÷£G‡ĞĞ¢æ6÷&RÖf7G7¶F—7Æ“¦w&–C¶v£¶Ö&v–ã£·FF–æs£G‚gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£Wƒ¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×7W&f6R’s‚RÇG&ç7&VçB“¶&6¶G&÷Öf–ÇFW#¦&ÇW"ƒG‚“·÷6—F–öã§&VÆF—fS·¢Ö–æFWƒ£ĞĞ¢æ6÷&RÖf7G¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦&6VÆ–æS¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£'ƒ·FF–æs£w‚¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶föçB×6—¦S£'‡ĞĞ¢æ6÷&RÖf7C¦Æ7BÖ6†–ÆG¶&÷&FW"Ö&÷GFöÓ£ĞĞ¢æ6÷&RÖf7BGG¶fÆWƒ¦æöæS¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB—ĞĞ¢æ6÷&RÖf7BFG¶Ö&v–ã£¶Ö–â×v–GFƒ£·FW‡BÖÆ–vã§&–v‡C¶föçB×vV–v‡C£c¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æ6÷&R×7FBÖw&–G¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVBƒ2ÆÖ–æÖ‚ƒÃg"’“¶v£'‡ĞĞ¢æ6÷&R×7FG¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶v£Gƒ¶Ö–â×v–GFƒ£·FF–æs£W‚gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£Wƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶&÷‚×6†F÷s£‚'‚3“3#ƒ‡ĞĞ¢æ6÷&R×7FBÖÆ&VÇ¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£‡ƒ¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£'ƒ¶föçB×vV–v‡C£cĞĞ¢æ6÷&R×7FBÖF÷G·v–GFƒ£‡ƒ¶†V–v‡C£‡ƒ¶fÆWƒ¦æöæS¶&÷&FW"×&F—W3£SS¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB“¶&÷‚×6†F÷s£7‚f"‚ÒÖ6÷&RÖ66VçB×6ögB—ĞĞ¢æ6÷&R×7FB×fÇVW¶Ö&v–ã£7‚¶föçB×6—¦S£#Gƒ¶Æ–æRÖ†V–v‡C£ã#¶föçB×vV–v‡C£sS¶ÆWGFW"×76–æs¢Òã6VÓ¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æ6÷&R×7FB×fÇVRÒ×FW‡G¶föçB×6—¦S£wƒ¶Æ–æRÖ†V–v‡C£ã3S¶ÆWGFW"×76–æs¢ÒãV×ĞĞ¢æ6÷&R×7FB×7V'¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£ãWƒ¶Æ–æRÖ†V–v‡C£ãCS¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æ6÷&RÖ6&G¶Ö–â×v–GFƒ£·FF–æs£‡‚—ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3§f"‚ÒÖ6÷&R×&F—W2“¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r—ĞĞ¢æ6÷&RÖ6&BÖ†VG¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦fÆW‚×7F'C¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£Gƒ¶fÆW‚×w&§w&¶Ö&v–âÖ&÷GFöÓ£'‡ĞĞ¢æ6÷&RÖ6&BÖ†VBƒ'¶föçB×6—¦S£g‡ĞĞ¢æ6÷&RÖ6&BÖ†VBƒ7¶föçB×6—¦S£W‡ĞĞ¢æ6÷&RÖ6&B×7V'¶Ö&v–ã£G‚–×÷'FçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£'ƒ¶Æ–æRÖ†V–v‡C£ãSWĞĞ¢æ6÷&RÖÖöGVÆRÖw&–G¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVBƒ"ÆÖ–æÖ‚ƒÃg"’“¶v£‡‡ĞĞ¢æ6÷&RÖÖöGVÆW¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶§W7F–g’Ö6öçFVçC§76RÖ&WGvVVã¶v£'ƒ¶Ö–â×v–GFƒ£·FF–æs£‚'ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"—ĞĞ¢æ6÷&RÖÖöGVÆRÖæÖW¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦&6VÆ–æS¶v£‡ƒ¶Ö–â×v–GFƒ£ĞĞ¢æ6÷&RÖÖöGVÆRÖæÖR7G&öæw¶föçB×6—¦S£7ƒ¶föçB×vV–v‡C£cSĞĞ¢æ6÷&RÖÖöGVÆRÖæÖR6öFW¶6öÆ÷#§f"‚ÒÖ6÷&RÖf–çB“¶föçB×6—¦S£‡ĞĞ¢æ6÷&RÖ&FvW¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£Wƒ¶fÆWƒ¦æöæS·FF–æs£'‚‡ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ2“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£ƒ¶föçB×vV–v‡C£cS¶Æ–æRÖ†V–v‡C£ãc·v†—FR×76S¦æ÷w&ĞĞ¢æ6÷&RÖ&FvS¦&Vf÷&W¶6öçFVçC¢rs·v–GFƒ£gƒ¶†V–v‡C£gƒ¶&÷&FW"×&F—W3£SS¶&6¶w&÷VæC¦7W'&VçD6öÆ÷#¶÷6—G“¢ã‡ĞĞ¢æ6÷&RÖ&FvRÒÖö·¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’3"RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’sBRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æ6÷&RÖ&FvRÒ×v&ç¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’sbRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æ6÷&RÖ&FvRÒÖFævW'¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æ6÷&RÖ&FvRÒÖ66VçG¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×6ögB“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær—ĞĞ¢æ6÷&RÖ&FvRÒ×Æ–ã¦&Vf÷&W¶F—7Æ“¦æöæWĞĞ¢æ6÷&R×6WGF–æw7¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶v£G‡ĞĞ¢æ6÷&RÖf–VÆG7¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶Ö–â×v–GFƒ£ĞĞ¢æ6÷&RÖf–VÆG¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒ#W‚Ã“‚’Ö–æÖ‚ƒÃg"“¶v£w‚‡ƒ¶Æ–vâÖ—FV×3¦6VçFW#¶Ö–â×v–GFƒ£·FF–æs£‚¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æ6÷&RÖf–VÆC¦Æ7BÖ6†–ÆG¶&÷&FW"Ö&÷GFöÓ£ĞĞ¢æ6÷&RÖf–VÆBÖÆ&VÇ¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦&6VÆ–æS¶v£wƒ¶fÆW‚×w&§w&¶Ö–â×v–GFƒ£¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£"ãWƒ¶föçB×vV–v‡C£cS¶Æ–æRÖ†V–v‡C£ãCWĞĞ¢æ6÷&RÖf–VÆBÖÆ&VÂ6öFW¶6öÆ÷#§f"‚ÒÖ6÷&RÖf–çB“¶föçB×6—¦S£ãWƒ¶föçB×vV–v‡C£SĞĞ¢æ6÷&RÖf–VÆCç6ÖÆÂÂæ6÷&RÖf–VÆBÖ†–çG¶w&–BÖ6öÇVÖã£#¶Ö&v–ã£¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£ãWƒ¶Æ–æRÖ†V–v‡C£ãWĞĞ¢æ6÷&RÖf–VÆCæ–çWBÂæ6÷&RÖf–VÆCç6VÆV7G·v–GFƒ£S¶Ö–â×v–GFƒ£ĞĞ¢æ6÷&RÖf–VÆBÒ×7FF–3æ6öFW¶Ö–â×v–GFƒ£¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æ6÷&RÖ–çWBÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ–çWC¦æ÷B…·G—SÖ6†V6¶&÷…Ò“¦æ÷B…·G—S×&ævUÒ’ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ6VÆV7BÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFW‡F&VÂæÖFWW2Ö6÷&R×6†VÆÃâæ6÷&RÖÖ–â6VÆV7G¶&÷‚×6—¦–æs¦&÷&FW"Ö&÷ƒ·v–GFƒ£S¶Ö–âÖ†V–v‡C£3gƒ·FF–æs£‡‚ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£—ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçC¦–æ†W&—C¶föçB×6—¦S£7ƒ¶Æ–æRÖ†V–v‡C£ã3S·G&ç6—F–öã¦&÷&FW"Ö6öÆ÷"ãG2Æ&÷‚×6†F÷rãG2Æ&6¶w&÷VæBãG7ĞĞ¢æ6÷&RÖ–çWC¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ–çWC¦æ÷B…·G—SÖ6†V6¶&÷…Ò“¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ6VÆV7C¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFW‡F&V¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær—ĞĞ¢æ6÷&RÖ–çWC¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ–çWC¦æ÷B…·G—SÖ6†V6¶&÷…Ò“¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ6VÆV7C¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFW‡F&V¦fö7W7¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶÷WFÆ–æS¦æöæS¶&÷‚×6†F÷s£7‚6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖ66VçB’bRÇG&ç7&VçB—ĞĞ¢æ6÷&RÖ–çWC¦F—6&ÆVBÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ–çWC¦F—6&ÆVBÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ6VÆV7C¦F—6&ÆVBÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFW‡F&V¦F—6&ÆVG¶÷6—G“¢ãS¶7W'6÷#¦æ÷BÖÆÆ÷vVC¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ2—ĞĞ¢æ6÷&RÖf–VÆCæ–çWE·G—SÖçVÖ&W%×¶Ö‚×v–GFƒ£##‡ĞĞ¢æ6÷&RÖ7F–öç7¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£‡ƒ¶fÆW‚×w&§w&¶Ö&v–â×F÷£'‡ĞĞ¢æ6÷&RÖ7F–öç2Ò×7F'G¶Ö&v–ã£G‡ĞĞ¢æ6÷&R×7v—F6‡¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦fÆW‚×7F'C¶v£ƒ¶Ö&v–ã£‡‚·FF–æs£‚'ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£"ãWƒ¶Æ–æRÖ†V–v‡C£ãSS¶7W'6÷#§ö–çFW'ĞĞ¢æ6÷&R×7v—F6‚–çWE·G—SÖ6†V6¶&÷…×¶fÆWƒ¦æöæS·v–GFƒ£wƒ¶†V–v‡C£wƒ¶Ö&v–ã£'‚¶66VçBÖ6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶7W'6÷#§ö–çFW'ĞĞ¢æ6÷&R×7v—F6‚ÒÖ6öæf—&×¶Ö&v–â×F÷£G‡ĞĞ¢æ6÷&RÖæ÷FW¶Ö&v–ã£‚–×÷'FçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£'ƒ¶Æ–æRÖ†V–v‡C£ãcWĞĞ¢æ6÷&RÖV×G—·FF–æs£#g‚#ƒ¶&÷&FW#£‚F6†VBf"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær“¶&÷&FW"×&F—W3£Gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£7ƒ·FW‡BÖÆ–vã¦6VçFW'ĞĞ¢æ6÷&R×W'6öæÖ†÷7G¶†V–v‡C£s'fƒ¶Ö–âÖ†V–v‡C£S#ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£gƒ¶÷fW&fÆ÷s¦†–FFVã¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"—ĞĞ¢æ6÷&RÖF–Æöræ6÷&R×W'6öæÖ†÷7G¶†V–v‡C¦WFó¶Ö–âÖ†V–v‡C£¶fÆWƒ£ĞĞ¢æ6÷&R×W'6öæÖg&ÖW¶F—7Æ“¦&Æö6³·v–GFƒ£S¶†V–v‡C£S¶Ö–âÖ†V–v‡C£S#ƒ¶&÷&FW#£¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R—ĞĞ¢æ6÷&RÖF–Æöræ6÷&R×W'6öæÖg&ÖW¶Ö–âÖ†V–v‡C£ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öç¶F—7Æ“¦&Æö6³¶Ö–â×v–GFƒ£¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£7ƒ¶Æ–æRÖ†V–v‡C£ãcWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâƒ'¶föçB×6—¦S£#ƒ¶Æ–æRÖ†V–v‡C£ã3¶Ö&v–ã£‡ƒ¶ÆWGFW"×76–æs¢Òã&V×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâƒ7¶föçB×6—¦S£Wƒ¶Ö&v–ã£G‚‡‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâƒG¶föçB×6—¦S£7ƒ¶Ö&v–ã£7‚w‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ¶Ö&v–ã£w‚¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ'WGFöç¶V&æ6S¦æöæS¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶§W7F–g’Ö6öçFVçC¦6VçFW#¶Ö–âÖ†V–v‡C£3Gƒ¶Ö&v–ã£g‚g‚·FF–æs£w‚'ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£—ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖVÆWfFVB“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçC¦–æ†W&—C¶föçB×6—¦S£"ãWƒ¶föçB×vV–v‡C£c¶Æ–æRÖ†V–v‡C£ã3¶7W'6÷#§ö–çFW#·G&ç6—F–öã¦&6¶w&÷VæBãG2Æ&÷&FW"Ö6öÆ÷"ãG2Æ6öÆ÷"ãG7ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ'WGFöã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ'WGFöå¶&–×&W76VC×G'VU×¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶6öÆ÷#¢6ffgĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ'WGFöã¦F—6&ÆVG¶÷6—G“¢ãCS¶7W'6÷#¦æ÷BÖÆÆ÷vVGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâæg¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£Gƒ¶fÆW‚×w&§w&¶Ö&v–ã£‚ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâf–VÆG6WG¶Ö–â×v–GFƒ£¶Ö&v–ã£g‚·FF–æs£'‚Gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâÆVvVæG·FF–æs£wƒ¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×vV–v‡C£cSĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâÆ&VÇ¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£‡ƒ¶fÆW‚×w&§w&¶Ö&v–ã£w‚'‚w‚¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ–çWE·G—SÖ6†V6¶&÷…×¶66VçBÖ6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ–çWE·G—SÖçVÖ&W%×·v–GFƒ£'‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFW‡F&V¶F—7Æ“¦&Æö6³·v–GFƒ¦Ö–âƒs#‚ÃR“¶Ö–âÖ†V–v‡C£“'ƒ·&W6—¦S§fW'F–6ÇĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ'F–6ÆW¶Ö–â×v–GFƒ£¶Ö&v–ã£'‚·FF–æs£W‚gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£7ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ&W¶Ö‚Ö†V–v‡C£#ƒƒ¶÷fW&fÆ÷s¦WFó·FF–æs£'ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“·v†—FR×76S§&R×w&¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâæÖ7Öw&çB×v&æ–æw¶Ö&v–ã£‡‚'ƒ·FF–æs£‚'ƒ¶&÷&FW#£‚6öÆ–B6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’3"RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’‚RÇf"‚ÒÖ6÷&R×7W&f6R’“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£'ƒ¶Æ–æRÖ†V–v‡C£ãcWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFWF–Ç7¶Ö&v–ã£‡‚ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ7VÖÖ'—¶7W'6÷#§ö–çFW#¶föçB×vV–v‡C£cSĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâF&ÆW¶&÷&FW"Ö6öÆÆ6S¦6öÆÆ6S¶Ö‚×v–GFƒ£WĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâF‚ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFG·FF–æs£w‚—ƒ¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“·FW‡BÖÆ–vã¦ÆVgC·fW'F–6ÂÖÆ–vã§F÷ĞĞ¢æ6÷&RÖF–Æöræ6÷&RÖW‡FVç6–öç¶Ö‚×v–GFƒ£WĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâÆ&VÃ¦†2ƒæ–çWE·G—S×FW‡EÒ’ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâÆ&VÃ¦†2ƒæ–çWE·G—S×77v÷&EÒ—¶F—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒc‚Ã##‚’Ö–æÖ‚ƒÃg"“·v–GFƒ¦Ö–âƒRÃƒ‚“¶Ö&v–ã£'‚¶v£'‡ĞĞ¤ÖVF–†Ö‚×v–GFƒ£cC‚—²æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâÆ&VÃ¦†2ƒæ–çWE·G—S×FW‡EÒ’ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâÆ&VÃ¦†2ƒæ–çWE·G—S×77v÷&EÒ—¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fU×°Ğ¢ÒÖÖÂÖÆ–æS§f"‚ÒÖ6÷&RÖ&÷&FW"“²ÒÖÖÂ×7W&f6S§f"‚ÒÖ6÷&R×7W&f6R“²ÒÖÖÂ×7W&f6RÓ#§f"‚ÒÖ6÷&R×7W&f6RÓ"“²ÒÖÖÂ×FW‡C§f"‚ÒÖ6÷&R×FW‡B“²ÒÖÖÂÖ×WFVC§f"‚ÒÖ6÷&RÖ×WFVB“²ÒÖÖÂÖ66VçC§f"‚ÒÖ6÷&RÖ66VçB“²ÒÖÖÂÖ66VçB×7G&öæs§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“²ÒÖÖÂÖ66VçB×6ögC§f"‚ÒÖ6÷&RÖ66VçB×6ögB“°Ğ¢FF–ærÖ&÷GFöÓ£¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£2ãWƒ¶Æ–æRÖ†V–v‡C£ãgĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF÷&'·FF–æs£#‚#'ƒ¶Ö&v–âÖ&÷GFöÓ£Gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶&÷&FW"×&F—W3§f"‚ÒÖ6÷&R×&F—W2“¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçBƒ3VFVrÇf"‚ÒÖ6÷&RÖ66VçB×6ögB’RÇf"‚ÒÖ6÷&R×7W&f6RÓ"’S‚RÇf"‚ÒÖ6÷&R×7W&f6R’R“¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF÷&"ƒ'¶föçB×6—¦S£#'ƒ¶ÆWGFW"×76–æs¢Òã&V×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF÷&"¶Ö‚×v–GFƒ£cc‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF'7¶v£Gƒ·FF–æs£—‚¶Ö&v–ã£'‚Gƒ¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF'2'WGFöç·FF–æs£w‚7ƒ¶&÷&FW#£‚6öÆ–BG&ç7&VçC¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§G&ç7&VçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£7ƒ¶föçB×vV–v‡C£c¶&÷‚×6†F÷s¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF'2'WGFöã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF'2'WGFöå¶&–×6VÆV7FVC×G'VU×¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×6ögB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶&÷‚×6†F÷s¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ'WGFöç¶Ö–âÖ†V–v‡C£3gƒ·FF–æs£w‚7ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖVÆWfFVB“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£7ƒ¶föçB×vV–v‡C£c¶Æ–æRÖ†V–v‡C£ã#·G&ç6—F–öã¦&6¶w&÷VæBãG2Æ&÷&FW"Ö6öÆ÷"ãG2Æ6öÆ÷"ãG7ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ'WGFöã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ'WGFöâç&–Ö'—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶6öÆ÷#¢6ffc¶&÷‚×6†F÷s¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ'WGFöâç&–Ö'“¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶6öÆ÷#¢6ffgĞĞ¢æÖFWW2Ö6÷&R×6†VÆÅ¶FFÖ6÷&R×F†VÖSÖF&µÒ¶FFÖÖFWW2ÖÆ–fUÒ'WGFöâç&–Ö'—¶6öÆ÷#¢3sGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ'WGFöâæFævW'¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&6¶w&÷VæC§G&ç7&VçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ'WGFöã¦fö7W2×f—6–&ÆRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ–çWC¦fö7W2×f—6–&ÆRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ6VÆV7C¦fö7W2×f—6–&ÆRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒFW‡F&V¦fö7W2×f—6–&ÆRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ7VÖÖ'“¦fö7W2×f—6–&ÆW¶÷WFÆ–æS£'‚6öÆ–Bf"‚ÒÖ6÷&RÖ66VçB“¶÷WFÆ–æRÖöfg6WC£'‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6†—·FF–æs£'‚‡ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£ƒ¶föçB×vV–v‡C£cS¶Æ–æRÖ†V–v‡C£ãwĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6†—æö·¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’3"RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’sBRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6†—çv&ç¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’sbRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6†—æ&G¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæw&–G¶v£Gƒ¶Ö&v–ã£'‚g‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6&BÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçæVÇ·FF–æs£w‚‡ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3§f"‚ÒÖ6÷&R×&F—W2“¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6&C¦†÷fW'·G&ç6f÷&Ó¦æöæS¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6&BçfÇVW¶föçB×6—¦S£#Gƒ¶föçB×vV–v‡C£sS¶ÆWGFW"×76–æs¢Òã6V×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçæVÇ¶Ö&v–âÖ&÷GFöÓ£G‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæf–VÆG¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒÃãg"’Ö–æÖ‚ƒƒ‚Âã–g"“¶v£Gƒ·FF–æs£'‚¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæf–VÆB7G&öæw¶föçB×6—¦S£"ãW‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ–çWE·G—SÖçVÖ&W%ÒÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ–çWE·G—S×FW‡EÒÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒFW‡F&VÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ6VÆV7G¶Ö–âÖ†V–v‡C£3gƒ·FF–æs£‡‚ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£—ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£7ƒ·G&ç6—F–öã¦&÷&FW"Ö6öÆ÷"ãG2Æ&6¶w&÷VæBãG2Æ&÷‚×6†F÷rãG7ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ–çWC¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ6VÆV7C¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒFW‡F&V¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ–çWC¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒ6VÆV7C¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒFW‡F&V¦fö7W7¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶÷WFÆ–æS¦æöæS¶&÷‚×6†F÷s£7‚6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖ66VçB’bRÇG&ç7&VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒç7v—F6‡·FF–æs£—‚ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒç7v—F6‚–çWG¶66VçBÖ6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæÖW76vW·FF–æs£‚7ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶Ö&v–ã£‚ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæÖW76vRæW'&÷'¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæÖW76vRç7V66W77¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’3"RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’sBRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF&ÆUw&¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£Gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶&÷‚×6†F÷s¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒF‡¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒFG¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒF&öG’G#¦†÷fW'¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ×WFVG¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæW'&÷%FW‡BÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæW'&÷%FW‡G¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒFWF–Ç27VÖÖ'—¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFU×²ÒÖÒ×7FFRÖ66VçC§f"‚ÒÖ6÷&RÖ66VçB“²ÒÖÒ×7FFRÖ66VçB×7G&öæs§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“²ÒÖÒ×7FFRÖöâÖ66VçC¢6ffc·FF–ærÖ&÷GFöÓ£¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£2ãWƒ¶Æ–æRÖ†V–v‡C£ãgĞĞ¢æÖFWW2Ö6÷&R×6†VÆÅ¶FFÖ6÷&R×F†VÖSÖF&µÒ¶FFÖÖFWW2×7FFU×²ÒÖÒ×7FFRÖöâÖ66VçC¢3sGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçF÷&'·FF–æs£#‚#'ƒ¶Ö&v–âÖ&÷GFöÓ£Gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶&÷&FW"×&F—W3§f"‚ÒÖ6÷&R×&F—W2“¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçBƒ3VFVrÇf"‚ÒÖ6÷&RÖ66VçB×6ögB’RÇf"‚ÒÖ6÷&R×7W&f6RÓ"’S‚RÇf"‚ÒÖ6÷&R×7W&f6R’R“¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r“¶Æ–vâÖ—FV×3¦6VçFW'ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçF÷&"ƒ'¶föçB×6—¦S£#'ƒ¶föçB×vV–v‡C£s¶ÆWGFW"×76–æs¢Òã&V×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçF÷&"ç7V'¶÷6—G“£¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæW–V'&÷w¶6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶föçB×6—¦S£ãWƒ¶föçB×vV–v‡C£ƒ¶ÆWGFW"×76–æs¢ãFV×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒç6†VÆÇ¶w&–B×FV×ÆFRÖ6öÇVÖç3£g#¶v£G‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒç6–FW·÷6—F–öã§7FF–3·F÷¦WFó¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶fÆW‚×w&§w&¶v£g‚ƒ·FF–æs£‚'ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶&÷‚×6†F÷s¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ'&æG¶F—7Æ“¦fÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£‡ƒ¶Ö&v–ã£·FF–æs£g‚¶&÷&FW#£ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ'&æDÖ&·¶F—7Æ“¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ'&æB7G&öæw¶föçB×6—¦S£'ƒ¶föçB×vV–v‡C£cS¶Æ–æRÖ†V–v‡C£ã'ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ'&æB6ÖÆÂÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒç6–FUFrÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒç6–FTÆ&VÇ¶F—7Æ“¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæædÆ—7G¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã§&÷s¶fÆW‚×w&§w&¶v£Gƒ¶Ö–â×v–GFƒ£ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒææd'WGFöç¶F—7Æ“¦–æÆ–æRÖfÆWƒ¶Æ–vâÖ—FV×3¦6VçFW#¶v£gƒ¶Ö–âÖ†V–v‡C£3Gƒ·FF–æs£w‚'ƒ¶&÷&FW#£‚6öÆ–BG&ç7&VçC¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§G&ç7&VçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£"ãWƒ¶föçB×vV–v‡C£c¶Æ–æRÖ†V–v‡C£ã#·FW‡BÖÆ–vã¦ÆVgGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒææd'WGFöã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒææd'WGFöå¶&–×6VÆV7FVC×G'VU×¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×6ögB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçBÖÆ–æR“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶föçB×vV–v‡C£cSĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒææd–6öç·v–GFƒ¦WFó¶föçB×6—¦S£7ƒ¶÷6—G“¢ãwĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒææd'WGFöå¶&–×6VÆV7FVC×G'VUÒææd–6öç¶÷6—G“£ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæw&–G¶v£Gƒ¶Ö&v–ã£'‚g‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ6&G·FF–æs£g‚wƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ6&BçfÇVW¶föçB×6—¦S£#Gƒ¶föçB×vV–v‡C£sS¶ÆWGFW"×76–æs¢Òã6V×ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçæVÇ·FF–æs£‡ƒ¶Ö&v–ã£Gƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶&÷‚×6†F÷s§f"‚ÒÖ6÷&R×6†F÷r—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ&'¶†V–v‡C£‡ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ2—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ&"7ç¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçv÷&·76T&ææW'·FF–æs£7‚Wƒ¶Ö&v–ã£'‚¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæÖöFTw&–G¶v£G‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæÖöFT6&G·FF–æs£'ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæÖöFT6&Bæ7F—fW¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×6ögB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒç6W76–öå&÷rÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ–çFW&W7E&÷w¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ†–çD6&G·FF–æs£‚7ƒ¶&÷&FW#£‚F6†VB6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’‚RÇf"‚ÒÖ6÷&R×7W&f6R’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ'WGFöç¶Ö–âÖ†V–v‡C£3gƒ·FF–æs£w‚7ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖVÆWfFVB“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B“¶föçB×6—¦S£7ƒ¶föçB×vV–v‡C£c¶Æ–æRÖ†V–v‡C£ã'ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ'WGFöã¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ'WGFöâç&–Ö'—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖöâÖ66VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ'WGFöâç&–Ö'“¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB×7G&öær“¶6öÆ÷#§f"‚ÒÖÒ×7FFRÖöâÖ66VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ'WGFöâæFævW'¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶&6¶w&÷VæC§G&ç7&VçC¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ'WGFöâæv†÷7G¶&6¶w&÷VæC§G&ç7&VçGĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ'WGFöã¦fö7W2×f—6–&ÆRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWC¦fö7W2×f—6–&ÆRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ6VÆV7C¦fö7W2×f—6–&ÆRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ7VÖÖ'“¦fö7W2×f—6–&ÆW¶÷WFÆ–æS£'‚6öÆ–Bf"‚ÒÖ6÷&RÖ66VçB“¶÷WFÆ–æRÖöfg6WC£'‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—SÖçVÖ&W%ÒÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—S×FW‡EÒÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—S×&ævUÒÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ6VÆV7BÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒFW‡F&V¶föçB×6—¦S£7‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—SÖçVÖ&W%ÒÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—S×FW‡EÒÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ6VÆV7BÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒFW‡F&V¶Ö–âÖ†V–v‡C£3gƒ·FF–æs£‡‚ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£—ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—SÖçVÖ&W%Ó¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—S×FW‡EÓ¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ6VÆV7C¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB’ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒFW‡F&V¦†÷fW#¦æ÷Bƒ¦F—6&ÆVB—¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ&÷&FW"×7G&öær—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—SÖçVÖ&W%Ó¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—S×FW‡EÓ¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ6VÆV7C¦fö7W2ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒFW‡F&V¦fö7W7¶&÷&FW"Ö6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB“¶÷WFÆ–æS¦æöæS¶&÷‚×6†F÷s£7‚6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖ66VçB’bRÇG&ç7&VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒ–çWE·G—S×&ævU×¶66VçBÖ6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒç7v—F6‚–çWG¶66VçBÖ6öÆ÷#§f"‚ÒÖ6÷&RÖ66VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ6†—·FF–æs£'‚‡ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£““—ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶föçB×6—¦S£ƒ¶föçB×vV–v‡C£cS¶Æ–æRÖ†V–v‡C£ãwĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ6†—æö·¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’3"RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’sBRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ6†—çv&ç¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&R×v&â’sbRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ6†—æ&G¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3BRÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæÖW76vW·FF–æs£‚7ƒ¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶Ö&v–ã£‚ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæÖW76vRæW'&÷'¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖFævW"’3RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#§f"‚ÒÖ6÷&RÖFævW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæÖW76vRç7V66W77¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’RÇf"‚ÒÖ6÷&R×7W&f6R’“¶&÷&FW"Ö6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’3"RÇf"‚ÒÖ6÷&RÖ&÷&FW"’“¶6öÆ÷#¦6öÆ÷"ÖÖ—‚†–â7&v"Çf"‚ÒÖ6÷&RÖö²’sBRÇf"‚ÒÖ6÷&R×FW‡B’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçF&ÆUw&¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£Gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒF‡¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6RÓ"“¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB“¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒFG¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒF&öG’G#¦†÷fW'¶&6¶w&÷VæC§f"‚ÒÖ6÷&RÖ†÷fW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæF–Æöw¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"“¶&÷&FW"×&F—W3£gƒ¶&6¶w&÷VæC§f"‚ÒÖ6÷&R×7W&f6R“¶6öÆ÷#§f"‚ÒÖ6÷&R×FW‡B—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ÷fW&Æ—¶&6¶w&÷VæC¦6öÆ÷"ÖÖ—‚†–â7&v"Â3s2sRÇG&ç7&VçB—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ×WFVG¶÷6—G“£¶6öÆ÷#§f"‚ÒÖ6÷&RÖ×WFVB—ĞĞ¢ò¢ÆöærW'6—7FVBF‡2æB–FVçF–f–W'2×W7Bæ÷BW‡æBÖöGVÆRw&–G2â¢ğĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæw&–BÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæw&–G¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVB†WFòÖf—BÆÖ–æÖ‚†Ö–âƒ##‚ÃR’Ãg"’—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæ6&BÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæ6&G¶Ö–â×v–GFƒ£¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçfÇVRÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçfÇVW¶÷fW&fÆ÷r×w&¦ç—v†W&WĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF&ÆUw&ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçF&ÆUw&¶Ö‚×v–GFƒ£S¶÷fW&fÆ÷r×ƒ¦WF÷ĞĞ¤ÖVF–†Ö‚×v–GFƒ£cC‚—²æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæf–VÆG¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'×ĞĞ¤ÖVF–†Ö‚×v–GFƒ£“‚—°Ğ¢æ6÷&RÖ÷fW&Æ—·FF–æs£'‡ĞĞ¢æ6÷&RÖF–Æöw·v–GFƒ¦Ö–âƒRÃ“ƒ‚“¶†V–v‡C¦Ö–âƒ“C‚Ã“FGf‚“¶&÷&FW"×&F—W3£‡‡ĞĞ¢æ6÷&RÖF–ÆöræÖFWW2Ö6÷&R×6†VÆÇ·FF–æs£g‚‡‚ĞĞ¢æ6÷&RÖ†W&÷¶w&–B×FV×ÆFRÖ6öÇVÖç3¦Ö–æÖ‚ƒÃg"“¶Æ–vâÖ—FV×3§7F'GĞĞ¢æ6÷&RÖf7G7¶Ö‚×v–GFƒ£S#‡ĞĞ¢æ6÷&R×7FBÖw&–G¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVBƒ"ÆÖ–æÖ‚ƒÃg"’—ĞĞ¢æ6÷&RÖÖöGVÆRÖw&–G¶w&–B×FV×ÆFRÖ6öÇVÖç3£g'ĞĞ§ĞĞ¤ÖVF–†Ö‚×v–GFƒ£cC‚—°Ğ¢æ6÷&RÖ÷fW&Æ—·FF–æs£·Æ6RÖ—FV×3§7G&WF6‡ĞĞ¢æ6÷&RÖF–Æöw·v–GFƒ£gs¶†V–v‡C£Gfƒ¶Ö‚Ö†V–v‡C¦æöæS¶&÷&FW"×&F—W3£¶&÷&FW#£ĞĞ¢æ6÷&RÖF–ÆöræÖFWW2Ö6÷&R×6†VÆÇ·FF–æs£7‚7‚ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÃâæ6÷&RÖ†VFW'¶v£ƒ¶fÆW‚×w&§w&·FF–ærÖ&÷GFöÓ£‡ĞĞ¢æ6÷&RÖÖ&··v–GFƒ£3gƒ¶†V–v‡C£3gƒ¶&÷&FW"×&F—W3£ƒ¶föçB×6—¦S£g‡ĞĞ¢æ6÷&RÖ'&æB×FW‡Bƒ'¶föçB×6—¦S£‡‡ĞĞ¢æ6÷&R×FvÆ–æW¶F—7Æ“¦æöæWĞĞ¢æ6÷&RÖ†VFW"Ö7F–öç7·v–GFƒ£S¶§W7F–g’Ö6öçFVçC¦fÆW‚×7F'C¶v£g‡ĞĞ¢æ6÷&RÖ'Fç¶Ö–âÖ†V–v‡C£3Gƒ·FF–æs£g‚ƒ¶föçB×6—¦S£'‡ĞĞ¢æ6÷&RÖ'FâÒÖ6Æ÷6W¶Ö&v–âÖÆVgC¦WF÷ĞĞ¢æ6÷&R×F'7·FF–æs£‡‚¶Ö&v–ã£Ó'‡ĞĞ¢æ6÷&R×F'2'WGFöç·FF–æs£g‚ƒ¶föçB×6—¦S£'‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÃâæ6÷&RÖÖ–ç·FF–æs£G‚#‡ĞĞ¢æ6÷&RÖ†W&÷·FF–æs£w‚gƒ¶&÷&FW"×&F—W3£W‡ĞĞ¢æ6÷&RÖ†W&òƒ'¶föçB×6—¦S£#‡ĞĞ¢æ6÷&RÖ†W&ò¶föçB×6—¦S£"ãW‡ĞĞ¢æ6÷&RÖf7G7·FF–æs£‚7‡ĞĞ¢æ6÷&R×7FBÖw&–G¶w&–B×FV×ÆFRÖ6öÇVÖç3£g#¶v£—‡ĞĞ¢æ6÷&R×7FG·FF–æs£'‚7‡ĞĞ¢æ6÷&R×7FB×fÇVW¶föçB×6—¦S£#‡ĞĞ¢æ6÷&RÖ6&G·FF–æs£G‚Gƒ¶&÷&FW"×&F—W3£7‡ĞĞ¢æ6÷&RÖf–VÆG¶w&–B×FV×ÆFRÖ6öÇVÖç3£g#¶v£Wƒ·FF–æs£‚ĞĞ¢æ6÷&RÖf–VÆCç6ÖÆÂÂæ6÷&RÖf–VÆBÖ†–çG¶w&–BÖ6öÇVÖã£ĞĞ¢æ6÷&RÖf–VÆCæ–çWE·G—SÖçVÖ&W%×¶Ö‚×v–GFƒ¦æöæWĞĞ¢æ6÷&RÖ7F–öç7¶v£w‡ĞĞ¢æ6÷&RÖ&ææW'¶Æ–vâÖ—FV×3¦fÆW‚×7F'GĞĞ¢æ6÷&RÖÖöGVÆW¶fÆW‚×w&§w&ĞĞ¢æ6÷&R×W'6öæÖ†÷7G¶†V–v‡C£s'fƒ¶Ö–âÖ†V–v‡C£C#ƒ¶&÷&FW"×&F—W3£7‡ĞĞ¢æ6÷&R×W'6öæÖg&ÖW¶Ö–âÖ†V–v‡C£C#‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF÷&"ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçF÷&'·FF–æs£gƒ¶&÷&FW"×&F—W3£W‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒçF÷&"ƒ"ÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçF÷&"ƒ'¶föçB×6—¦S£#‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2ÖÆ–fUÒæw&–BÂæÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæw&–G¶v£‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒç6–FW·FF–æs£‡‚ƒ¶v£G‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒæædÆ—7G¶fÆW‚×w&¦æ÷w&¶÷fW&fÆ÷r×ƒ¦WFó·67&öÆÆ&"×v–GFƒ§F†–ã·v–GFƒ£S·FF–ærÖ&÷GFöÓ£'‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒææd'WGFöç¶fÆWƒ¦æöæWĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂ¶FFÖÖFWW2×7FFUÒçæVÇ·FF–æs£G‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæÖæVÖR×†Ö–ç¶fÆW‚ÖF—&V7F–öã¦6öÇVÖçĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæÖæVÖR×‡6–FW·v–GFƒ£S¶Ö‚Ö†V–v‡C£#ƒ¶&÷&FW"×&–v‡C£¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæÖæVÖRÖVçG¶fÆW‚ÖF—&V7F–öã¦6öÇVÖçĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæÖæVÖRÖVçG&–Ç·v–GFƒ£S¶Ö‚Ö†V–v‡C£“ƒ¶&÷&FW"×&–v‡C£¶&÷&FW"Ö&÷GFöÓ£‚6öÆ–Bf"‚ÒÖ6÷&RÖ&÷&FW"—ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâƒ'¶föçB×6—¦S£—‡ĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâÆ&VÇ¶Æ–vâÖ—FV×3¦fÆW‚×7F'GĞĞ¢æÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ–çWC¦æ÷B…·G—SÖ6†V6¶&÷…Ò’ÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâ6VÆV7BÂæÖFWW2Ö6÷&R×6†VÆÂæ6÷&RÖW‡FVç6–öâFW‡F&V¶Ö‚×v–GFƒ£WĞĞ§ĞĞ¦°Ğ¦6öç7B$ôõCÒrö’öÖFWW2Ö6÷&Rs°Ğ¦7–æ2gVæ7F–öâ’‡F‚Æ&öG’—¶6öç7B#Öv—BfWF6‚…$ôõB·F‚Ç¶ÖWF†öC¦&öG“òuõ5Bs¢ttUBrÆ7&VFVçF–Ç3¢w6ÖRÖ÷&–v–ârÆ†VFW'3¦&öG“÷²v6öçFVçB×G—Rs¢vÆ–6F–öâö§6öârÂw‚ÖÖFWW2Ö6÷&Rs¢swÓ§·ÒÂâââ†&öG“÷¶&öG“¤¥4ôâç7G&–æv–g’†&öG’—Ó§·Ò—Ò“¶6öç7B£Öv—B"æ§6öâ‚“¶–b‚"æö·ÇÂ¢æö²—F‡&÷rW'&÷"†¢æW'&÷'ÇÂu&WVW7Bf–ÆVBr“·&WGW&â¢æFF·ĞĞ¦gVæ7F–öâf÷&×2‚—¶6öç7B66†SÖæWrÖ‚’Æ6†ævW3ÖæWr6WB‚“·&WGW&â·7V'67&–&T6†ævW3¦fãÓç¶6†ævW2æFB†fâ“·&WGW&â‚“Óæ6†ævW2æFVÆWFR†fâ—ÒÇ&Vg&W6„ÆÃ¢‚“Óå&öÖ—6RæÆÂ…²ââæ66†RçfÇVW2‚•ÒæÖ†cÓæbç&Vg&W6‚‚’’’Çv†–ÆU6W'fVC¢…ö¶W—2Æfâ“Óæfâ‚’ÆvWB†–B—°Ğ¢6öç7B¶W“Õ7G&–ær†–B’ç&WÆ6R‚õæÖFWW2ÒòÂrr’ç&WÆ6R‚vG6‚ÖÖæVÖRrÂvÖVÖ÷'’r“°Ğ¢–b†66†Ræ†2†¶W’’—&WGW&â66†RævWB†¶W’“°Ğ¢ÆWB6æ6†÷C×·7FGW3¢vÆöF–ærrÇw&—F&ÆS¦fÇ6WÒÆÆ—7FVæW'3ÖæWr6WB‚“°Ğ¢6öç7Bæ÷F–g“Ò‚“ÓæÆ—7FVæW'2æf÷$V6‚†fãÓæfâ‚’“°Ğ¢6öç7B&Vg&W6ƒÖ7–æ2‚“Óç·G'—·6æ6†÷CÖv—B’‚röf÷&×2òr¶¶W’—Ö6F6‚†R—·6æ6†÷C×·7FGW3¢wVæf–Æ&ÆRrÇw&—F&ÆS¦fÇ6RÆW'&÷#¦RæÖW76vW×Öæ÷F–g’‚—Ó°Ğ¢6öç7Bf÷&Ó×¶vWE6æ6†÷C¢‚“Óç6æ6†÷BÇ7V'67&–&S¦fãÓç¶Æ—7FVæW'2æFB†fâ“·&WGW&â‚“ÓæÆ—7FVæW'2æFVÆWFR†fâ—ÒÆ×WFFS¦7–æ2†÷2Ç&Wf—6–öâ“Óç·G'—·6æ6†÷CÖv—B’‚röf÷&×2òr¶¶W’Ç¶÷2Ç&Wf—6–öçÒ“¶æ÷F–g’‚“¶6†ævW2æf÷$V6‚†fãÓæfâ‚’“·&WGW&âG'VWÖ6F6‚†R—¶v—B&Vg&W6‚‚“·F‡&÷rW×ÒÇ&Vg&W6‡Ó°Ğ¢66†Rç6WB†¶W’Æf÷&Ò“·&Vg&W6‚‚“·&WGW&âf÷&Ó°Ğ§×Ó·ĞĞ¦6öç7BF'3Õµ²v÷fW'f–WrrÂ~h¾Šx‚rÂt÷fW'f–WruÒÅ²wW'6öærÂ~K«®jÂrÂuW'6öæuÒÅ²vÖVÖ÷'’rÂ~Šë[øbrÂtÖVÖ÷'’uÒÅ²w7FFRrÂ~x«nhrÂu7FFRuÒÅ²vÆ–fRrÂ~yIşkK²rÂtÆ–fRuÒÅ²wÆFf÷&×2rÂ~[›>XûrÂuÆFf÷&×2uÒÅ²vÖ7rÂtÔ5rÂtÔ5uÒÅ²vW‡W&–Væ6W2rÂ~{¸şXèbrÂtW‡W&–Væ6W2uÒÅ²w6WGF–æw2rÂ~Šëî{ÚârÂu6WGF–æw2uÕÓ°Ğ¦6öç7B4õ$UôÔôETÄUôÄ$TÅ3×¶ÖVÖ÷'“¥²~Šë[øbrÂtÖVÖ÷'’uÒÆÆ–fS¥²~yIşkK²rÂtÆ–fRuÒÇ7FFS¥²~x«nhrÂu7FFRuÒÇW'6öæ¥²~K«®jÂrÂuW'6öæu×Ó°Ğ¦6öç7B4õ$Uô”Õõ%EôÄ$TÅ3×¶ÖVÖ÷'“¥²~Šë[øbrÂtÖVÖ÷'’uÒÆÆ–fS¥²~yIşkK²rÂtÆ–fRuÒÇ7FFS¥²~x«nhrÂu7FFRuÒÇW'6öæ¥²~K«®jÂrÂuW'6öæu×Ó°Ğ¦gVæ7F–öâ'6T7746öÆ÷"‡fÇVR—°Ğ¢6öç7BÖF6ƒÒõç&v&õÂ‚…µâ•Ò²•Â’Bö’æW†V2…7G&–ær‡fÇVWÇÂrr’çG&–Ò‚’“°Ğ¢–b‚ÖF6‚—&WGW&âçVÆÃ°Ğ¢6öç7B'G3ÖÖF6…³Òç7Æ—B‚õ²ÅÇ2õÒ²ò’æf–ÇFW"„&ööÆVâ“°Ğ¢–b‡'G2æÆVæwFƒÃ2—&WGW&âçVÆÃ°Ğ¢6öç7B6†ææVÃÒ‡'B“Óç'BæVæG5v—F‚‚rRr“ôçVÖ&W"‡'Bç6Æ–6RƒÂÓ’’£"ãSS¤çVÖ&W"‡'B“°Ğ¢6öç7B#Ö6†ææVÂ‡'G5³Ò’ÆsÖ6†ææVÂ‡'G5³Ò’Æ#Ö6†ææVÂ‡'G5³%Ò’Æ×'G5³5ÓÓÓ×VæFVf–æVCó§'G5³5ÒæVæG5v—F‚‚rRr“ôçVÖ&W"‡'G5³5Òç6Æ–6RƒÂÓ’’ó¤çVÖ&W"‡'G5³5Ò“°Ğ¢–b‚·"ÆrÆ"ÆÒæWfW'’„çVÖ&W"æ—4f–æ—FR’—&WGW&âçVÆÃ°Ğ¢&WGW&â·"ÆrÆ"ÆÓ°Ğ§ĞĞ¦gVæ7F–öâ&VÆF—fTÇVÖ–ææ6R†6öÆ÷"—°Ğ¢6öç7B6†ææVÃ×fÇVSÓç¶6öç7BcÔÖF‚æÖ‚ƒÄÖF‚æÖ–âƒ#SRÇfÇVR’’ó#SS·&WGW&âcÃÒã3“#ƒ÷bó"ã“#¤ÖF‚ç÷r‚‡b²ãSR’óãSRÃ"ãB—Ó°Ğ¢&WGW&âã##b¦6†ææVÂ†6öÆ÷"ç"’²ãsS"¦6†ææVÂ†6öÆ÷"ær’²ãs#"¦6†ææVÂ†6öÆ÷"æ"“°Ğ§ĞĞ¦gVæ7F–öâFWFV7D6÷&UF†VÖR‡6†VÆÂ—°Ğ¢6öç7B&ö&SÖFö7VÖVçBæ7&VFTVÆVÖVçB‚w7âr“·&ö&Rç7G–ÆRæ775FW‡CÒw÷6—F–öã¦f—†VC·f—6–&–Æ—G“¦†–FFVã¶&6¶w&÷VæC§f"‚ÒÖG7rÖÆ–2Ö&rÖÆ–W"ÓÇG&ç7&VçB’s¶Fö7VÖVçBæ&öG’æVæD6†–ÆB‡&ö&R“¶6öç7B†÷7D6öÆ÷#×'6T7746öÆ÷"†vWD6ö×WFVE7G–ÆR‡&ö&R’æ&6¶w&÷VæD6öÆ÷"“·&ö&Rç&VÖ÷fR‚“¶–b††÷7D6öÆ÷"bf†÷7D6öÆ÷"æãÒãƒR—&WGW&â&VÆF—fTÇVÖ–ææ6R††÷7D6öÆ÷"“ÂãC#òvF&²s¢vÆ–v‡Bs°Ğ¢6öç7B6æF–FFW3Õ¶Fö7VÖVçBæ&öG’ÆFö7VÖVçBæFö7VÖVçDVÆVÖVçEÒæf–ÇFW"„&ööÆVâ“°Ğ¢f÷"†6öç7BVÆVÖVçBöb6æF–FFW2—°Ğ¢6öç7B6öÆ÷#×'6T7746öÆ÷"†vWD6ö×WFVE7G–ÆR†VÆVÖVçB’æ&6¶w&÷VæD6öÆ÷"“°Ğ¢–b†6öÆ÷"bf6öÆ÷"æãÒãƒR—&WGW&â&VÆF—fTÇVÖ–ææ6R†6öÆ÷"“ÂãC#òvF&²s¢vÆ–v‡Bs°Ğ¢ĞĞ¢6öç7B66†VÖSÕ7G&–ær†vWD6ö×WFVE7G–ÆR†Fö7VÖVçBæFö7VÖVçDVÆVÖVçB’æ6öÆ÷%66†VÖWÇÂrr’çFôÆ÷vW$66R‚“°Ğ¢–b‚õÆ&F&µÆ"òçFW7B‡66†VÖR’bbõÆ&Æ–v‡EÆ"òçFW7B‡66†VÖR’—&WGW&âvF&²s°Ğ¢–b‚õÆ&Æ–v‡EÆ"òçFW7B‡66†VÖR’bbõÆ&F&µÆ"òçFW7B‡66†VÖR’—&WGW&âvÆ–v‡Bs°Ğ¢&WGW&âv–æF÷ræÖF6„ÖVF–òâ‚r‡&VfW'2Ö6öÆ÷"×66†VÖS¢F&²’r’æÖF6†W3òvF&²s¢vÆ–v‡Bs°Ğ§ĞĞ¦gVæ7F–öâW6T6÷&UF†VÖR‡6†VÆÅ&Vb—°Ğ¢6öç7B·F†VÖRÇ6WEF†VÖUÓ×W6U7FFR‚vÆ–v‡Br“°Ğ¢W6TVffV7B‚‚“Óç°Ğ¢6öç7BWFFSÒ‚“Óç6WEF†VÖR†FWFV7D6÷&UF†VÖR‡6†VÆÅ&Vbæ7W'&VçB’“°Ğ¢WFFR‚“°Ğ¢6öç7Bö'6W'fW#ÖæWr×WFF–öäö'6W'fW"‡WFFR“°Ğ¢6öç7BF&vWG3ÖæWr6WB…¶Fö7VÖVçBæFö7VÖVçDVÆVÖVçBÆFö7VÖVçBæ&öG•Ò“°Ğ¢ÆWB&VçC×6†VÆÅ&Vbæ7W'&VçCòç&VçDVÆVÖVçC°Ğ¢v†–ÆR‡&VçB—·F&vWG2æFB‡&VçB“·&VçC×&VçBç&VçDVÆVÖVçGĞĞ¢f÷"†6öç7BF&vWBöbF&vWG2––b‡F&vWB–ö'6W'fW"æö'6W'fR‡F&vWBÇ¶GG&–'WFW3§G'VRÆGG&–'WFTf–ÇFW#¥²v6Æ72rÂw7G–ÆRrÂvFF×F†VÖRrÂvFFÖ6öÆ÷"×66†VÖRu×Ò“°Ğ¢6öç7BÖVF–×v–æF÷ræÖF6„ÖVF–òâ‚r‡&VfW'2Ö6öÆ÷"×66†VÖS¢F&²’r“°Ğ¢ÖVF–òæFDWfVçDÆ—7FVæW#òâ‚v6†ævRrÇWFFR“°Ğ¢6öç7Bg&ÖS×&WVW7Dæ–ÖF–öäg&ÖR‡WFFR“°Ğ¢&WGW&â‚“Óç¶ö'6W'fW"æF—66öææV7B‚“¶ÖVF–òç&VÖ÷fTWfVçDÆ—7FVæW#òâ‚v6†ævRrÇWFFR“¶6æ6VÄæ–ÖF–öäg&ÖR†g&ÖR—Ó°Ğ¢ÒÅµÒ“°Ğ¢&WGW&âF†VÖS°Ğ§ĞĞ¦gVæ7F–öâÖF6…W'6öæF†VÖR†g&ÖRÇF†VÖRÆföçDfÖ–Ç’—°Ğ¢G'—°Ğ¢6öç7BFö3Ög&ÖSòæ6öçFVçDFö7VÖVçBÇ&ö÷CÖFö3òæFö7VÖVçDVÆVÖVçC°Ğ¢–b‚&ö÷B—&WGW&ã°Ğ¢&ö÷BæFF6WBçF†VÖS×F†VÖSÓÓÒvF&²sòvF&²s¢vÆ–v‡Bs°Ğ¢&ö÷Bç7G–ÆRæ6öÆ÷%66†VÖS×F†VÖSÓÓÒvF&²sòvF&²s¢vÆ–v‡Bs°Ğ¢6öç7B†÷7E7G–ÆSÖvWD6ö×WFVE7G–ÆR†g&ÖRæ6Æ÷6W7B‚ræÖFWW2Ö6÷&R×6†VÆÂr’“°Ğ¢f÷"†6öç7B¶¶W’ÇfÇVUÒöbö&¦V7BæVçG&–W2‡²rÒÖ&rs¢rÒÖ6÷&R×7W&f6RrÂrÒ×W"s¢rÒÖ6÷&R×7W&f6RrÂrÒ×6ögBs¢rÒÖ6÷&R×7W&f6RÓ"rÂrÒ×FW‡Bs¢rÒÖ6÷&R×FW‡BrÂrÒ×FW‡C"s¢rÒÖ6÷&R×FW‡BrÂrÒÖ×WFVBs¢rÒÖ6÷&RÖ×WFVBrÂrÒÖÆ–æRs¢rÒÖ6÷&RÖ&÷&FW"rÂrÒÖÆ–æS"s¢rÒÖ6÷&RÖ&÷&FW"×7G&öærrÂrÒÖw&VVâs¢rÒÖ6÷&RÖ66VçBrÂrÒÖFVWs¢rÒÖ6÷&RÖ66VçB×7G&öærrÂrÒÖw&VVâÖ&rs¢rÒÖ6÷&RÖ66VçB×6ögBwÒ’—&ö÷Bç7G–ÆRç6WE&÷W'G’†¶W’Æ†÷7E7G–ÆRævWE&÷W'G•fÇVR‡fÇVR’“°Ğ¢&ö÷Bç7G–ÆRæföçDfÖ–Ç“ÖföçDfÖ–Ç—ÇÂw7—7FVÒ×V’Ç6ç2×6W&–bs°Ğ¢ÆWB7G–ÆSÖFö2ævWDVÆVÖVçD'”–B‚v6÷&R×W'6öæÖVÖ&VB×F†VÖRr“°Ğ¢–b‚7G–ÆR—·7G–ÆSÖFö2æ7&VFTVÆVÖVçB‚vÆ–æ²r“·7G–ÆRæ–CÒv6÷&R×W'6öæÖVÖ&VB×F†VÖRs·7G–ÆRç&VÃÒw7G–ÆW6†VWBs·7G–ÆRæ‡&VcÒrö’öÖFWW2Ö6÷&R÷W'6öæÖVÖ&VBæ772s¶Fö2æ†VBæVæD6†–ÆB‡7G–ÆR—ĞĞ¢Ö6F6‡·ĞĞ§ĞĞ¦gVæ7F–öâ&VæFW$ÖöGVÆUF"‡·F"Ç7FGW2Çf–Ww2ÆÆ–fU7VÖÖ'’ÇBÆ‡Ò—°Ğ¢6öç7BV×G“Ö‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖV×G’wÒÇB‚~Šû~XX˜hº[z^KÙÎXË®[›n[©NyJ˜XŞ{ÚîûÈÎh‰nY
şyJjÚNjŠYÙ~8"rÂt6†ö÷6Rv÷&·76RæBÇ’6öæf–wW&F–öâÂ÷"Væ&ÆRF†—2ÖöGVÆRâr’“°Ğ¢–b‚7FGW3òæÖöGVÆW3òå·F%ÓòæÖ÷VçFVB—&WGW&âV×G“°Ğ¢–b‡F#ÓÓÒvÖVÖ÷'’wÇÇF#ÓÓÒw7FFRr—&WGW&âf–Ww5·F%Óòâ‚“óöV×G“°Ğ¢6öç7B7VÖÖ'“ÖÆ–fU7VÖÖ'’bf‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ6&BÖ†VBwÒÆ‚‚vƒ"rÆçVÆÂÇB‚~[Ù>X˜ŞyIşkK¾jh.XkRrÂt7W'&VçBÆ–fR7VÖÖ'’r’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒ×Æ–âwÒÇB‚~kKîyIşŠxnY»ârÂtFW&—fVBf–Wrr’’’ÀĞ¢‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖ6&B×7V"wÒÇB‚~jh.Xk^yKÆ–f^87FFRY(Î{¸şXènŠë[Ù^yIşh‰ûÈÎKˆŞX‰¾[»®iky¨NŠë[ønh‰n‹>[ªn8"rÂtFW&—fVBg&öÒÆ–fRÂ7FFRæBW‡W&–Væ6W3²—B7&VFW2æòÖVÖ÷'’÷"66†VGVÆW"âr’’ÀĞ¢Æ–fU7VÖÖ'’æW'&÷'3òæÆVæwFƒö‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÆW'BrÇ&öÆS¢w7FGW2wÒÇB†˜:Xˆni[hÚîKˆŞXúşyJûÉ¢G¶Æ–fU7VÖÖ'’æW'&÷'2æ¦ö–â‚~ûÉ²r—ÖÆ6öÖRFF—2Væf–Æ&ÆS¢G¶Æ–fU7VÖÖ'’æW'&÷'2æ¦ö–â‚s²r—Ö’“¦çVÆÂÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRÖw&–BwÒÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~Kˆ¾KˆjÊZHŞiúRrÂtæW‡B&Wf–Wrr’’Æ‚‚w7ârÆçVÆÂÆÆ–fU7VÖÖ'’æÆ–fRææW‡E&Wf–WtGÇÇB‚~i¨.izrÂtæöæRr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~[Ù>X˜Ş‹ùŠÎkK¾Xª‚rÂu'Vææ–ær7F—f—G’r’’Æ‚‚w7ârÆçVÆÂÆÆ–fU7VÖÖ'’æÆ–fRæ7W'&VçD7F—f—G“òæFW67&—F–öçÇÇB‚~izrÂtæöæRr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~iÈ‹ù[{.KùŞZÙ{¸şXèbrÂtÆFW7B7F÷&VBW‡W&–Væ6Rr’’Æ‚‚w7ârÆçVÆÂÆÆ–fU7VÖÖ'’ç&V6VçDW‡W&–Væ6Sòç7VÖÖ'—ÇÇB‚~i¨.izrÂtæöæRr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~X[N‹j2rÂt–çFW&W7G2r’’Æ‚‚w7ârÆçVÆÂÆÆ–fU7VÖÖ'’ç7FFRæ–çFW&W7G2æÖ†“Óæ’ææÖR’æf–ÇFW"„&ööÆVâ’æ¦ö–â‚~8r—ÇÇB‚~i¨.izrÂtæöæRr’’’’“°Ğ¢&WGW&â‚‚vF—brÆçVÆÂÇf–Ww2æÆ–fSòâ‚’Ç7VÖÖ'’“°Ğ§ĞĞ¦gVæ7F–öâ6÷&UæVÂ‡¶7G‚Çf–Ww2Æf÷&×56W'f–6RÆöä6Æ÷6WÒ—°Ğ¢6öç7B·F"Ç6WEF%Ó×W6U7FFR‚v÷fW'f–Wrr’Å·7FGW2Ç6WE7FGW5Ó×W6U7FFR†çVÆÂ’Å¶W'&÷"Ç6WDW'&÷%Ó×W6U7FFR‚rr’Å·v÷&·76RÇ6WEv÷&·76UÓ×W6U7FFR‚rr’Å¶'W7’Ç6WD'W7•Ó×W6U7FFR†fÇ6R’Å¶VævÆ—6‚Ç6WDVævÆ—6…Ó×W6U7FFR†fÇ6R“°Ğ¢6öç7B·6÷W&6W2Ç6WE6÷W&6W5Ó×W6U7FFR‡¶ÖVÖ÷'“¢rrÆÆ–fS¢rrÇ7FFS¢rrÇW'6öæ¢rwÒ’Å¶öffÆ–æT6öæf—&ÖVBÇ6WDöffÆ–æT6öæf—&ÖVEÓ×W6U7FFR†fÇ6R“°Ğ¢6öç7B6†VÆÅ&Vc×W6U&Vb†çVÆÂ’ÇW'6öæg&ÖS×W6U&Vb†çVÆÂ’ÇF†VÖS×W6T6÷&UF†VÖR‡6†VÆÅ&Vb“°Ğ¢6öç7B&Vg&W6ƒÒ‚“Óæ’‚r÷7FGW2r’çF†Vâ‡6WE7FGW2’æ6F6‚†SÓç6WDW'&÷"†RæÖW76vR’“°Ğ¢W6TVffV7B‚‚“Óç·&Vg&W6‚‚“·&WGW&âf÷&×56W'f–6Sòç7V'67&–&T6†ævW2‡&Vg&W6‚—ÒÅ¶f÷&×56W'f–6UÒ“°Ğ¢W6TVffV7B‚‚“Óç¶–b‡7FGW3òçv÷&·76T–B—6WEv÷&·76R‡7FGW2çv÷&·76T–B—ÒÅ·7FGW3òçv÷&·76T–EÒ“°Ğ¢W6TVffV7B‚‚“Óç¶–b‡F"ÓÒwW'6öæwÇÂ7FGW3òæÖöGVÆW3òçW'6öæòæÖ÷VçFVB—&WGW&ã¶6öç7Bg&ÖS×W'6öæg&ÖRæ7W'&VçC¶–b†g&ÖR–ÖF6…W'6öæF†VÖR†g&ÖRÇF†VÖRÆvWD6ö×WFVE7G–ÆR‡6†VÆÅ&Vbæ7W'&VçGÇÆg&ÖR’æföçDfÖ–Ç’—ÒÅ·F"ÇF†VÖRÇ7FGW3òæÖöGVÆW3òçW'6öæòæÖ÷VçFVEÒ“°Ğ¢7–æ2gVæ7F–öâ7F–öâ†fâ—·6WD'W7’‡G'VR“·6WDW'&÷"‚rr“·G'—¶v—Bfâ‚“¶v—B&Vg&W6‚‚—Ö6F6‚†R—·6WDW'&÷"†RæÖW76vR—Öf–æÆÇ—·6WD'W7’†fÇ6R—×ĞĞ¢6öç7BCÒ‡¦‚ÆVâ“ÓæVævÆ—6ƒöVã§¦ƒ°Ğ¢6öç7BÖöGVÆTÆ&VÃÖæÖSÓçB‚âââ„4õ$UôÔôETÄUôÄ$TÅ5¶æÖUÓóõ¶æÖRÆæÖUÒ’“°Ğ¢6öç7B–×÷'DÆ&VÃÖæÖSÓçB‚âââ„4õ$Uô”Õõ%EôÄ$TÅ5¶æÖUÓóõ¶æÖRÆæÖUÒ’“°Ğ¢6öç7BÖöGVÆW3Ôö&¦V7BæVçG&–W2‡7FGW3òæÖöGVÆW3ó÷·Ò’ÆVæ&ÆVDÖöGVÆW3ÖÖöGVÆW2æf–ÇFW"‚…²ÇfÇVUÒ“ÓçfÇVRæVæ&ÆVB’æÆVæwF‚ÆÖ÷VçFVDÖöGVÆW3ÖÖöGVÆW2æf–ÇFW"‚…²ÇfÇVUÒ“ÓçfÇVRæÖ÷VçFVB’æÆVæwFƒ°Ğ¢6öç7B&VÅÆFf÷&×3×7FGW3òçÆFf÷&×3óõµÒÇ6–×VÆF–öç3×7FGW3òç6–×VÆF–öç3óõµÒÆW‡W&–Væ6W3×7FGW3òæW‡W&–Væ6W3óõµÒÆÖ76W'fW'3×7FGW3òæÖ7òç6W'fW'3óõµÒÆÆ–fU7VÖÖ'“×7FGW3òæÆ–fU7VÖÖ'“óöçVÆÃ°Ğ¢6öç7Bv÷&·76T–æfóÒ‡7FGW3òçv÷&·76W3óõµÒ’æf–æB†—FVÓÓæ—FVÒæ–CÓÓ×7FGW3òçv÷&·76T–B’Çv÷&·76TæÖS×v÷&·76T–æfóòçF—FÆWÇÇ7FGW3òçv÷&·76T–GÇÇB‚~iÊ®{¹Zé¢rÂuVæ&÷VæBr“°Ğ¢6öç7B†6S×7FGW3òæ7F—f—G“òç†6Sóòt–FÆRrÇ†6TÆ&VÃ×†6SÓÓÒt–FÆRs÷B‚~z›®™{"rÂt–FÆRr“§†6SÓÓÒtW‡Æ÷&–ærs÷B‚~hê.{J.KŠÒrÂtW‡Æ÷&–ærr“§†6SÓÓÒtFVÆ–&W&F–ærs÷B‚~h	Şˆ>KŠÒrÂtFVÆ–&W&F–ærr“§†6SÓÓÒuW6VBs÷B‚~[{.i¨.XÂrÂuW6VBr“§†6SÓÓÒt6ö×ÆWFVBs÷B‚~[{.ZèÎh‰rÂt6ö×ÆWFVBr“§†6S°Ğ¢6öç7B7FGW5FöæS×fÇVSÓå²w&VG’rÂvö²uÒæ–æ6ÇVFW2…7G&–ær‡fÇVR’çFôÆ÷vW$66R‚’“òvö²s¥²v&Æö6¶VBrÂvW'&÷"rÂvf–ÆVBuÒæ–æ6ÇVFW2…7G&–ær‡fÇVR’çFôÆ÷vW$66R‚’“òvFævW"s¥²w&W7F'F–ærrÂvÆöF–ærrÂwW6VBuÒæ–æ6ÇVFW2…7G&–ær‡fÇVR’çFôÆ÷vW$66R‚’“òwv&âs¢wÆ–âs°Ğ¢6öç7B7FG3Õ°Ğ¢¶Æ&VÃ§B‚~[z^KÙÎXË¢rÂuv÷&·76Rr’ÇfÇVS§v÷&·76TæÖRÇFW‡C§G'VRÇ7V#§7FGW3òçv÷&·76T–C÷B‚~[{.{¹Zé¢E4‚[z^KÙÎXË¢rÂt&÷VæBFòE4‚v÷&·76Rr“§B‚~YÊŠëî{ÚîKŠŞ˜hºKˆKŠ®[z^KÙÎXË¢rÂt6†ö÷6Rv÷&·76R–â6WGF–æw2r—ÒÀĞ¢¶Æ&VÃ§B‚~jŠYÙrrÂtÖöGVÆW2r’ÇfÇVS§7FGW3öG¶Væ&ÆVDÖöGVÆW7ÒòG¶ÖöGVÆW2æÆVæwF‡Ö¢~(	BrÇ7V#§7FGW3öG¶Ö÷VçFVDÖöGVÆW7ÒG·B‚~‹ùŠÎKŠÒrÂw'Vææ–ærr—Ö§B‚~Xª‹ÛŞKŠÒrÂtÆöF–ærr—ÒÀĞ¢¶Æ&VÃ§B‚~[›>XûrÂuÆFf÷&×2r’ÇfÇVS§7FGW3õ7G&–ær‡&VÅÆFf÷&×2æÆVæwF‚“¢~(	BrÇ7V#§7FGW3öG·&VÅÆFf÷&×2æf–ÇFW"†—FVÓÓæ—FVÒæVæ&ÆVB’æÆVæwF‡ÒG·B‚~[{.Y
şyJ‚rÂvVæ&ÆVBr—Ò+rG·6–×VÆF–öç2æÆVæwF‡ÒG·B‚~jŠh¹òrÂw6–×VÆFVBr—Ö§B‚~Xª‹ÛŞKŠÒrÂtÆöF–ærr—ÒÀĞ¢¶Æ&VÃ§B‚~{¸şXèbrÂtW‡W&–Væ6W2r’ÇfÇVS§7FGW3õ7G&–ær†W‡W&–Væ6W2æÆVæwF‚“¢~(	BrÇ7V#¦W‡W&–Væ6W5³Óòæö67W'&VDC÷B‚~iÈ‹ùrÂtÆFW7Br’µ7G&–ær†W‡W&–Væ6W5³Òæö67W'&VDB’ç6Æ–6RƒÃb’ç&WÆ6R‚uBrÂrr“§B‚~i¨.izŠë[ÙRrÂtæò&V6÷&G2r—ÒÀĞ¢¶Æ&VÃ§B‚~kK¾Xª‚rÂt7F—f—G’r’ÇfÇVS§7FGW3÷†6TÆ&VÃ¢~(	BrÇ7V#§7FGW3öG·B‚~š(NzérrÂt'VFvWBr—ÒG´ÖF‚ç&÷VæB‚‡7FGW2æ7F—f—G”'VFvWD×3óó#’ó—×6§B‚~Xª‹ÛŞKŠÒrÂtÆöF–ærr—ÒÀĞ¢¶Æ&VÃ¢tÔ5rÇfÇVS§7FGW3õ7G&–ær†Ö76W'fW'2æÆVæwF‚“¢~(	BrÇ7V#§7FGW3öG¶Ö76W'fW'2æf–ÇFW"†—FVÓÓæ—FVÒæVæ&ÆVB’æÆVæwF‡ÒG·B‚~[{.Y
şyJ‚rÂvVæ&ÆVBr—Ö§B‚~Xª‹ÛŞKŠÒrÂtÆöF–ærr—ĞĞ¢Ó°Ğ¢6öç7Bf7G3Õ°Ğ¢·B‚~‹ùŠÎx˜iÊÂrÂu'VçF–ÖRfW'6–öâr’Ç7FGW3òçfW'6–öãóò~(	BuÒÀĞ¢·B‚~˜XŞ{ÚîKúîŠê"rÂt6öæf–r&Wf—6–öâr’Ç7FGW3õ7G&–ær‡7FGW2ç&Wf—6–öãóó“¢~(	BuÒÀĞ¢·B‚~i[hÚîKº2rÂtFFvVæW&F–öâr’Ç7FGW3òæFFvVæW&F–öãóò~(	BuÒÀĞ¢·B‚~kK¾XªKÉ®ŠùÒrÂt7F—f—G’6W76–öâr’Ç7FGW3òæ7F—f—G“òç6W76–öä–Có÷B‚~iÊ®XxnZHrrÂtæ÷B&W&VBr•ĞĞ¢Ó°Ğ¢ÆWB6öçFVçC°Ğ¢–b‡F#ÓÓÒvÖ7r–6öçFVçCÖ‚„Ö7æVÂÇ·7FFS§7FGW3òæÖ7Ç6W76–öç3§7FGW3òç6W76–öç3óõµÒÇ&Vg&W6‚ÇGÒ“°Ğ¢VÇ6R–b…²vÖVÖ÷'’rÂw7FFRrÂvÆ–fRuÒæ–æ6ÇVFW2‡F"’–6öçFVçC×&VæFW$ÖöGVÆUF"‡·F"Ç7FGW2Çf–Ww2ÆÆ–fU7VÖÖ'’ÇBÆ‡Ò“°Ğ¢VÇ6R–b‡F#ÓÓÒwW'6öær–6öçFVçC×7FGW3òæÖöGVÆW3òçW'6öæòæÖ÷VçFVCö‚‚vF—brÇ¶6Æ74æÖS¢v6÷&R×W'6öæÖ†÷7BwÒÆ‚‚v–g&ÖRrÇ·&Vc§W'6öæg&ÖRÇF—FÆS¢tÖFWW2W'6öærÇ7&3¢rö’öÖFWW2×W'6öæö6öç6öÆRrÆ6Æ74æÖS¢v6÷&R×W'6öæÖg&ÖRrÆöäÆöC¢‚“ÓæÖF6…W'6öæF†VÖR‡W'6öæg&ÖRæ7W'&VçBÇF†VÖRÆvWD6ö×WFVE7G–ÆR‡6†VÆÅ&Vbæ7W'&VçGÇÇW'6öæg&ÖRæ7W'&VçB’æföçDfÖ–Ç’—Ò’“¦‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖV×G’wÒÇB‚~Šû~Y
şyJK«®jÎjŠYÙ~8"rÂtVæ&ÆRF†RW'6öæÖöGVÆRâr’“°Ğ¢VÇ6R–b‡F#ÓÓÒwÆFf÷&×2r–6öçFVçCÖ‚…ÆFf÷&ÕæVÂÇ·7FGW2Ç&Vg&W6‚ÇGÒ“°Ğ¢VÇ6R–b‡F#ÓÓÒvW‡W&–Væ6W2r–6öçFVçCÖ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&R×6WGF–æw2wÒÆ‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÆ‚‚vƒ"rÆçVÆÂÇB‚~{¸şXèni{n™{N{«òrÂtW‡W&–Væ6RF–ÖVÆ–æRr’’Æ‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖ6&B×7V"wÒÇB‚~hÈiÚ^k©XË®XˆnjŠh¹şKˆîyÉşZéîŠû¾XùnûÉ¾j~š)Y(Îih~iÊÎKˆŞKº>ŠyÈ¾‹ø~ZèÎi[NŠxnš)8"rÂtWf–FVæ6RF—7F–æwV—6†W26–×VÆF–öâæBÆ—fR&VG3²ÖWFFF—2æ÷BgVÆÂf–FVòVæFW'7FæF–ærâr’’Â‡7FGW3òæW‡W&–Væ6W3óõµÒ’æÆVæwFƒ÷7FGW2æW‡W&–Væ6W2æÖ†SÓæ‚‚v'F–6ÆRrÇ¶¶W“¦RæWfVçD–BÆ6Æ74æÖS¢v6÷&RÖÖöGVÆRrÇ7G–ÆS§¶F—7Æ“¢v&Æö6²rÆÖ&v–ã¢s‚w×ÒÆ‚‚w7G&öærrÆçVÆÂÆRçÆFf÷&Ò’Æ‚‚wrÇ·7G–ÆS§¶Ö&v–ã¢s7‚w×ÒÆG¶Ræö67W'&VDGÒ+rG¶Rç7FGW7Ö’Æ‚‚v6öFRrÆçVÆÂÆRæWfVçD–B’’“¦‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖæ÷FRwÒÇB‚~i¨.iz{¸şXènŠë[Ù^8"rÂtæòW‡W&–Væ6W2–WBâr’’’“°Ğ¢VÇ6R–b‡F#ÓÓÒw6WGF–æw2r–6öçFVçCÖ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&R×6WGF–æw2wÒÀĞ¢‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ6&BÖ†VBwÒÆ‚‚vF—brÆçVÆÂÆ‚‚vƒ"rÆçVÆÂÇB‚~YJşKˆ[z^KÙÎXË¢rÂu6–ævÆRv÷&·76Rr’’Æ‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖ6&B×7V"wÒÇB‚t6÷&RXú®{¹Zé®KˆKŠ¢E4‚[z^KÙÎXË®ûÉ¾KùŞZÙYîKˆŞKÉ®Y[›nXúnKˆZY~XènXû.8"rÂt6÷&R&–æG2FòöæRE4‚v÷&·76S²6f–æræWfW"ÖW&vW2æ÷F†W"†—7F÷'’âr’’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖf–VÆG2wÒÆ‚‚vÆ&VÂrÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBwÒÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖÆ&VÂwÒÇB‚~[z^KÙÎXË¢rÂuv÷&·76Rr’’Æ‚‚w6VÆV7BrÇ²v&–ÖÆ&VÂs¢t6÷&Rv÷&·76RrÆ6Æ74æÖS¢v6÷&RÖ–çWBrÇfÇVS§v÷&·76RÆöä6†ævS¦SÓç6WEv÷&·76R†RçF&vWBçfÇVR—ÒÆ‚‚v÷F–öârÇ·fÇVS¢rwÒÇB‚~˜hº’E4‚v÷&·76RrÂt6†ö÷6RE4‚v÷&·76Rr’’Ââââ‡7FGW3òçv÷&·76W3óõµÒ’æÖ‡sÓæ‚‚v÷F–öârÇ¶¶W“§ræ–BÇfÇVS§ræ–GÒÇrçF—FÆWÇÇræ–B’’’Æ‚‚w6ÖÆÂrÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖ†–çBwÒÇB‚~Xˆ~hÚ.[z^KÙÎXË®X˜ŞŠû~zîŠêN[Ù>X˜ŞZéîKè¾z›®™{.8"rÂt6öæf—&ÒF†R7W'&VçB–ç7Fæ6R—2–FÆR&Vf÷&R7v—F6†–ærâr’’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ7F–öç2wÒÆ‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'Fâ6÷&RÖ'FâÒ×&–Ö'’rÆF—6&ÆVC¦'W7—ÇÂv÷&·76RÆöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚rö6öæf–wW&RrÇ·&Wf—6–öã§7FGW2ç&Wf—6–öâÇv÷&·76T–C§v÷&·76WÒ’—ÒÇB‚~KùŞZÙ[z^KÙÎXË¢rÂu6fRv÷&·76Rr’’’’ÀĞ¢‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ6&BÖ†VBwÒÆ‚‚vF—brÆçVÆÂÆ‚‚vƒ"rÆçVÆÂÇB‚~kK¾XªKˆîhê.{J"rÂt7F—f—G’æBW‡Æ÷&F–öâr’’Æ‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖ6&B×7V"wÒÇB‚~yÉşZéî[›>Xû™ÈŠhXÙ^xºÎhèiØ>ûÉ¾ZK‹J^KˆŞKÉ®Y¹î˜K‹®jŠh¹şXh^Zë8"rÂtÆ—fRÆFf÷&×2æVVB6W&FRw&çG3²f–ÇW&W2æWfW"fÆÂ&6²FòÖö6²6öçFVçBâr’’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ7F–öç26÷&RÖ7F–öç2Ò×7F'BwÒÀĞ¢‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'FârÆF—6&ÆVC¦'W7—ÇÇ7FGW3òç7FGW2ÓÒw&VG’rÆöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚r÷6–×VÆFRrÇ·Ò’—ÒÇB‚~‹ùŠÎKŠNKŠ®jŠh¹ş[›>Xûy¨NXú®Šû¾š¨ÎiKbrÂu'VâGvò6–×VÆFVB&VBÖöæÇ’ÆFf÷&×2r’’ÀĞ¢‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'FârÆF—6&ÆVC¦'W7—ÇÇ7FGW3òç7FGW2ÓÒw&VG’rÆöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚r÷&W&RÖW‡Æ÷&F–öârÇ·Ò’—ÒÇB‚~XxnZH~hÈK˜^kK¾XªKÉ®ŠùÒrÂu&W&RW'6—7FVçB7F—f—G’6W76–öâr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRÖw&–BwÒÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚tÆ–fRYJN˜i"rÂtÆ–fRv¶Rr’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÒr²‡7FGW3òæÆ–fTFVÆ—fW'“òç7FFSÓÓÒv7F—fRsòvö²s§7FGW3òæÆ–fTFVÆ—fW'“òç7FFSÓÓÒvFVw&FVBsòwv&âs¢wÆ–âr—ÒÇ7FGW3òæÆ–fTFVÆ—fW'“òç7FFSó÷B‚~KˆŞXúşyJ‚rÂuVæf–Æ&ÆRr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~YJN˜i.KÉ®ŠùÒrÂuv¶R6W76–öç2r’’Æ‚‚w7ârÆçVÆÂÇ7FGW3òæÆ–fTFVÆ—fW'“òæÆÆ÷vVE6W76–öç3óó’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~ZInXùhùzK¢rÂtW‡FW&æÂÖÖW76vR÷BÖ–âr’’Æ‚‚w7ârÆçVÆÂÇB‚~yKÆ–fRõXÙ^xºÎhèiØ2rÂu6W&FRÆ–fRõ÷BÖ–âr’’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ7F–öç2wÒÀĞ¢‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'FârÆF—6&ÆVC¦'W7—ÇÇ7FGW3òç7FGW2ÓÒw&VG’wÇÂ7FGW3òæÖöGVÆW3òæÆ–fSòæÖ÷VçFVGÇÂ7FGW3òæ7F—f—G“òç6W76–öä–BÆöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚r÷&W&RÖWFöæöÖ÷W2ÖÆ–fRrÇ·Ò’—ÒÇB‚~{¹Zé®kK¾XªKÉ®ŠùŞ[›nY
şyJ‚Æ–fRYJN˜i"rÂt&–æB7F—f—G’6W76–öâæBVæ&ÆRÆ–fRv¶Rr’’’ÀĞ¢‚‚vÆ&VÂrÇ¶6Æ74æÖS¢v6÷&R×7v—F6‚wÒÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC§7FGW3òæW‡Æ÷&F–öäVæ&ÆVCÓÓ×G'VRÆF—6&ÆVC¦'W7’Æöä6†ævS¦SÓæ7F–öâ‚‚“Óæ’‚rö6öæf–wW&RrÇ·&Wf—6–öã§7FGW2ç&Wf—6–öâÆW‡Æ÷&F–öäVæ&ÆVC¦RçF&vWBæ6†V6¶VGÒ’—Ò’Æ‚‚w7ârÆçVÆÂÇB‚~XXŠëkK¾XªKÉ®ŠùŞˆz®K‹¾KÛşyJ[{.hèiØ>[›>Xûˆ;ŞX©¾ûÈ›¹ŠêNX[>™zŞûÈ’rÂtÆÆ÷r7F—f—G’6W76–öâFòW6RWF†÷&—¦VBÆFf÷&Ò6&–Æ—F–W2†öfb'’FVfVÇB’r’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖf–VÆG2wÒÀĞ¢‚‚vÆ&VÂrÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBwÒÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖÆ&VÂwÒÇB‚~XÙ^jÊkK¾Xªh¾i{n™™rÂt7F—f—G’vÆÂÖ6Æö6²Æ–Ö—Br’’Æ‚‚v–çWBrÇ·G—S¢vçVÖ&W"rÆÖ–ã£ÆÖƒ£3Æ6Æ74æÖS¢v6÷&RÖ–çWBrÆ¶W“§7FGW3òæ7F—f—G”'VFvWD×2ÆFVfVÇEfÇVS¢‡7FGW3òæ7F—f—G”'VFvWD×3óó#’óÆöä&ÇW#¦SÓç¶6öç7BfÇVSÔçVÖ&W"†RçF&vWBçfÇVR’£¶–b‡fÇVRÓ×7FGW2æ7F—f—G”'VFvWD×2–7F–öâ‚‚“Óæ’‚rö6öæf–wW&RrÇ·&Wf—6–öã§7FGW2ç&Wf—6–öâÆ7F—f—G”'VFvWD×3§fÇVWÒ’“·×Ò’Æ‚‚w6ÖÆÂrÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖ†–çBwÒÇB‚~zy.ûÈÎXÈ^Y
¾jŠYè¾h	Şˆ>ûÉ¾Kˆ¾jÊkK¾XªyIşiX8"rÂu6V6öæG2Â–æ6ÇVF–ærÖöFVÂF†–æ¶–æs²æW‡B7F—f—G’âr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖf–VÆB6÷&RÖf–VÆBÒ×7FF–2wÒÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖÆ&VÂwÒÇB‚~kK¾XªKÉ®ŠùÒrÂt7F—f—G’6W76–öâr’’Æ‚‚v6öFRrÆçVÆÂÇ7FGW3òæ7F—f—G“òç6W76–öä–Có÷B‚~[	®iÊ®XxnZHrrÂtæ÷B&W&VBr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖf–VÆB6÷&RÖf–VÆBÒ×7FF–2wÒÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖÆ&VÂwÒÇB‚~kK¾Xªx«nhrÂt7F—f—G’7FFRr’’Æ‚‚w7ârÆçVÆÂÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÒr²‡†6SÓÓÒuW6VBsòwv&âs§†6SÓÓÒt–FÆRsòwÆ–âs¢vö²r—ÒÇ†6TÆ&VÂ’’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ7F–öç2wÒÀĞ¢‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'FârÆF—6&ÆVC¦'W7—ÇÇ7FGW3òæ7F—f—G“òç†6RÓÒuW6VBrÆöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚rö7F—f—G’rÇ¶7F–öã¢w&W7VÖRwÒ’—ÒÇB‚~YÊXéşš(Nzé~Xh^h.ZHŞkK¾Xª‚rÂu&W7VÖRv—F†–â÷&–v–æÂ'VFvWBr’’ÀĞ¢‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'FârÆF—6&ÆVC¦'W7—ÇÇ7FGW3òæ7F—f—G“òç†6SÓÓÒt–FÆRrÆöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚rö7F—f—G’rÇ¶7F–öã¢vf–æ—6‚wÒ’—ÒÇB‚~ZèXZ{¹>iÙş[Ù>X˜ŞkK¾Xª‚rÂu6fVÇ’f–æ—6‚7W'&VçB7F—f—G’r’’’ÀĞ¢‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖæ÷FRwÒÇB‚~hÈ™*îXú®KÉ®h¨®[Ù>X˜ŞkK¾XªKÉ®ŠùŞXªXZRÆ–fRÆÆ÷vÆ—7B[›nY
şyJ[{.iÈ’†÷7BYJN˜i.ûÉ¾KùŞZÙYî™È[©NyJ[è^˜xŞY
ş˜XŞ{Úî8.ZInXùhùzK®K¸Ş›¹ŠêNX[>™zŞûÈÅXù˜‹ù™Èyºîjr66VæRˆz®[{y¨NhèiØ>8.KˆŞKÉ®X‰¾[»®zÊÎK¨ÎZY~‹>[ªn8"rÂuF†—27F–öâöæÇ’FG2F†R7F—f—G’6W76–öâFòÆ–fUÂw2ÆÆ÷vÆ—7BæBVæ&ÆW2F†RW†—7F–ær†÷7Bv¶S²Ç’F†RVæF–ær&W7F'BgFW'v&BâW‡FW&æÂÖÖW76vRwV–Fæ6R7F—2öfbÂæB6VæF–ær7F–ÆÂ&WV—&W2F&vWB66VæRWF†÷&—¦F–öââæò6V6öæB66†VGVÆW"—27&VFVBâr’’’ÀĞ¢‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ6&BÖ†VBwÒÆ‚‚vF—brÆçVÆÂÆ‚‚vƒ"rÆçVÆÂÇB‚~jŠYÙrrÂtÖöGVÆW2r’’Æ‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖ6&B×7V"wÒÇB‚tÆ–fR˜XŞ{ÚîKùŞZÙYî™È[©NyJûÉµ7FFR˜XŞ{ÚîKùŞZÙYîZéîi{nyIşiX8.[©NyJi{nh¹.{¹ŞKŠŞijŞkK¾XªjŠYè¾Y¹îY8"rÂtÇ’Æ–fR6†ævW3²7FFR6†ævW2F¶RVffV7BÆ—fRâÇ––ær&VgW6W2Fò–çFW''WB7F—fRÖöFVÂGW&ç2âr’’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖf–VÆG2wÒÂââæÖöGVÆW2æÖ‚…¶æÖRÇfÇVUÒ“Óæ‚‚vÆ&VÂrÇ¶¶W“¦æÖRÆ6Æ74æÖS¢v6÷&R×7v—F6‚wÒÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC§fÇVRæVæ&ÆVBÆF—6&ÆVC¦'W7’Æöä6†ævS¦SÓæ7F–öâ‚‚“Óæ’‚rö6öæf–wW&RrÇ·&Wf—6–öã§7FGW2ç&Wf—6–öâÆÖöGVÆS¦æÖRÆVæ&ÆVC¦RçF&vWBæ6†V6¶VGÒ’—Ò’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖÆ&VÂwÒÆÖöGVÆTÆ&VÂ†æÖR’Æ‚‚v6öFRrÆçVÆÂÆæÖR’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÒr²‡fÇVRæÖ÷VçFVCòvö²s§fÇVRæVæ&ÆVCòwv&âs¢wÆ–âr—ÒÇfÇVRæÖ÷VçFVC÷B‚~‹ùŠÎKŠÒrÂw'Vææ–ærr“§fÇVRæVæ&ÆVC÷B‚~iÊ®hÈ.‹ÛÒrÂv–æ7F—fRr“§B‚~[{.XÎyJ‚rÂvF—6&ÆVBr’’’’’’ÀĞ¢‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ6&BÖ†VBwÒÆ‚‚vF—brÆçVÆÂÆ‚‚vƒ"rÆçVÆÂÇB‚~K¸îXéşY¹¾hù.K»nZûÎXZRrÂt–×÷'BF†Rf÷W"÷&–v–æÂÖöGVÆW2r’’Æ‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖ6&B×7V"wÒÇB‚~KùŞyYXéşyºî[Ù^ûÈÎXXyIşh‰Kˆˆ{Nh
~[ú¾xZ~ûÈÎXhŞXˆ~hÚ.X‹xºÎz¸¾i[hÚîXšşiÊÎ8.Y¹¾KŠ®iÚ^k©[ø^š¾{¹Zé®[Ù>X˜ŞYÎKˆKŠ¢v÷&·76^ûÉ¾KˆŞKÉ®Y[›nKŠNZY~XènXû.8"rÂu&W6W'fR6÷W&6RF—&V7F÷&–W2Â6æ6†÷B6öç6—7FVçFÇ’ÂF†Vâ7F—fFR6W&FR6÷’âÆÂ6÷W&6W2×W7B6†&RF†—2v÷&·76S²†—7F÷&–W2&Ræ÷BÖW&vVBâr’’’’ÀĞ¢‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖæ÷FRwÒÇB‚~ZûÎXZ^ZIn˜:iz~i[hÚîX˜ŞûÈÎŠû~YÊ[Ù>X˜ÒE4‚KùŞyYY¹¾KŠ®[{.XÎyJy¨Niz~hù.K»niÚyºîXø®Xéş˜XŞ{ÚîûÈÎ[›nzîKùŞi[hÚî‹zş[èNKˆîKˆ¾ikyºî[Ù^Kˆˆ{NûÈiJşhÈ[{.jZéîx˜iÊÎy¨N›¹ŠêN‹zş[èNûÈ8.{Ë®[	XúşjZéî˜XŞ{Úîi{nKÉ®h¹.{¹ŞZûÎXZ^ûÈÎ˜şXXŞKŠ.ZKXéşŠëî{Úî8"rÂt¶VWF†Rf÷W"F—6&ÆVBÆVv7’ÇVv–âVçG&–W2æBF†V—"6öæf–wW&F–öâ–âF†—2E4‚&öf–ÆRâF†V—"&W6öÇfVBFFF‡2Â–æ6ÇVF–ærfW&–f–VB&VÆV6VBFVfVÇG2Â×W7BÖF6‚F†RF—&V7F÷&–W2&VÆ÷râ–×÷'B&VgW6W2Ö—76–ær÷"Ö—6ÖF6†VB6öæf–wW&F–öââr’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖf–VÆG2wÒÂââäö&¦V7Bæ¶W—2‡6÷W&6W2’æÖ†æÖSÓæ‚‚vÆ&VÂrÇ¶¶W“¦æÖRÆ6Æ74æÖS¢v6÷&RÖf–VÆBwÒÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖf–VÆBÖÆ&VÂwÒÆ–×÷'DÆ&VÂ†æÖR’Æ‚‚v6öFRrÆçVÆÂÆæÖR’’Æ‚‚v–çWBrÇ²v&–ÖÆ&VÂs¢t–×÷'Br¶æÖRÆ6Æ74æÖS¢v6÷&RÖ–çWBrÇfÇVS§6÷W&6W5¶æÖUÒÇÆ6V†öÆFW#§B‚~Xéşhù.K»ni[hÚîyºî[Ù^{¹ŞZû‹zş[èBrÂt'6öÇWFR6÷W&6RFFF—&V7F÷'’r’Æöä6†ævS¦SÓç6WE6÷W&6W2‡²ââç6÷W&6W2Å¶æÖUÓ¦RçF&vWBçfÇVWÒ—Ò’’’’ÀĞ¢‚‚vÆ&VÂrÇ¶6Æ74æÖS¢v6÷&R×7v—F6‚6÷&R×7v—F6‚ÒÖ6öæf—&ÒwÒÆ‚‚v–çWBrÇ·G—S¢v6†V6¶&÷‚rÆ6†V6¶VC¦öffÆ–æT6öæf—&ÖVBÆöä6†ævS¦SÓç6WDöffÆ–æT6öæf—&ÖVB†RçF&vWBæ6†V6¶VB—Ò’Æ‚‚w7ârÆçVÆÂÇB‚~h‰[{.XÎyJXéşY¹¾hù.K»nûÈÎ[›nX[>™zŞX[nK¹nXúşˆ;ŞXiXZ^‹ùK©¾yºî[Ù^y¨BE4‚ZéîKè¾8"rÂt’F—6&ÆVBF†Rf÷W"öÆBÇVv–ç2æB6Æ÷6VB÷F†W"E4‚–ç7Fæ6W2w&—F–ærF†W6RF—&V7F÷&–W2âr’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ7F–öç2wÒÀĞ¢‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'Fâ6÷&RÖ'FâÒ×&–Ö'’rÆF—6&ÆVC¦'W7—ÇÂöffÆ–æT6öæf—&ÖVGÇÄö&¦V7BçfÇVW2‡6÷W&6W2’ç6öÖR‡ƒÓâ‚çG&–Ò‚’’Æöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚rö–×÷'BrÇ·&Wf—6–öã§7FGW2ç&Wf—6–öâÇ6÷W&6W2ÆöffÆ–æT6öæf—&ÖVGÒ’—ÒÇB‚~ZH~K»Ş[›nZûÎXZRrÂt&6²WæB–×÷'Br’’ÀĞ¢7FGW3òæ6å&öÆÆ&6³ö‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'FârÆF—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óæ7F–öâ‚‚“Óæ’‚r÷&öÆÆ&6²rÇ·&Wf—6–öã§7FGW2ç&Wf—6–öçÒ’—ÒÇB‚~h.ZHŞX˜ŞKˆKŠ®i[hÚîKº>ûÈKˆŞXŠ™šNi[hÚîûÈ’rÂu&W7F÷&R&Wf–÷W2FFvVæW&F–öâ†¶VWÆÂFF’r’“¦çVÆÂ’’“°Ğ¢VÇ6R6öçFVçCÖ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ÷fW'f–WrwÒÀĞ¢‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ†W&òwÒÀĞ¢‚‚vF—brÆçVÆÂÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖW–V'&÷rwÒÂtÔDUU24õ$Rr’Æ‚‚vƒ"rÆçVÆÂÇB‚~KˆKŠ®‹ª¾K»ŞûÈÎhÈ{ºŞy¨NŠë[øn8x«nhKˆîyIşkK¾8"rÂtöæR–FVçF—G’Â6öçF–çV÷W2ÖVÖ÷'’Â7FFRæBÆ–fRâr’’Æ‚‚wrÆçVÆÂÇB‚~YÊYÎKˆKŠ®[z^KÙÎXË®˜xÎûÈÎzêynK«®jÎ8Šë[øn8x«nhKˆî‹z[›>XûyIşkK¾8"rÂtÖævR–FVçF—G’ÂÖVÖ÷'’Â7FFRæB7&÷72×ÆFf÷&ÒÆ–fR–âöæRv÷&·76Râr’’Æ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ&FvW2wÒÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÒr·7FGW5FöæR‡7FGW3òç7FGW3óòvÆöF–ærr—ÒÇ7FGW3òç7FGW3ó÷B‚~Xª‹ÛŞKŠÒrÂvÆöF–ærr’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÖ66VçBwÒÆbG·7FGW3òçfW'6–öãóòsã"ãÖÇ†ãbwÖ’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvRwÒÇ7FGW3òçv÷&·76T–C÷B‚~[z^KÙÎXË®[{.{¹Zé¢rÂuv÷&·76R&÷VæBr“§B‚~[	®iÊ®{¹Zé®[z^KÙÎXË¢rÂtæòv÷&·76Rr’’’’ÀĞ¢‚‚vFÂrÇ¶6Æ74æÖS¢v6÷&RÖf7G2wÒÂââæf7G2æÖ‚…¶Æ&VÂÇfÇVUÒ“Óæ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖf7BrÆ¶W“¦Æ&VÇÒÆ‚‚vGBrÆçVÆÂÆÆ&VÂ’Æ‚‚vFBrÆçVÆÂÇfÇVR’’’’’ÀĞ¢‚‚vF—brÇ¶6Æ74æÖS¢v6÷&R×7FBÖw&–BwÒÂââç7FG2æÖ‡7FCÓæ‚‚v'F–6ÆRrÇ¶6Æ74æÖS¢v6÷&R×7FBrÆ¶W“§7FBæÆ&VÇÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&R×7FBÖÆ&VÂwÒÆ‚‚w7ârÆçVÆÂÇ7FBæÆ&VÂ’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&R×7FBÖF÷BrÂv&–Ö†–FFVâs¢wG'VRwÒ’’Æ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&R×7FB×fÇVRr²‡7FBçFW‡Còr6÷&R×7FB×fÇVRÒ×FW‡Bs¢rr—ÒÇ7FBçfÇVR’Æ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&R×7FB×7V"wÒÇ7FBç7V"’’’’ÀĞ¢‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ6&BÖ†VBwÒÆ‚‚vƒ2rÆçVÆÂÇB‚~jŠYÙ~x«nhrÂtÖöGVÆR7FGW2r’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÒr²†Ö÷VçFVDÖöGVÆW3ÓÓÖÖöGVÆW2æÆVæwF‚bfÖöGVÆW2æÆVæwFƒòvö²s¢wÆ–âr—ÒÆG¶Ö÷VçFVDÖöGVÆW7ÒòG¶ÖöGVÆW2æÆVæwF‡ÒG·B‚~‹ùŠÎKŠÒrÂw'Vææ–ærr—Ö’’ÆÖöGVÆW2æÆVæwFƒö‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRÖw&–BwÒÂââæÖöGVÆW2æÖ‚…¶æÖRÇfÇVUÒ“Óæ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRrÆ¶W“¦æÖWÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRÖæÖRwÒÆ‚‚w7G&öærrÆçVÆÂÆÖöGVÆTÆ&VÂ†æÖR’’Æ‚‚v6öFRrÆçVÆÂÆæÖR’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÒr²‡fÇVRæÖ÷VçFVCòvö²s§fÇVRæVæ&ÆVCòwv&âs¢wÆ–âr—ÒÇfÇVRæÖ÷VçFVC÷B‚~‹ùŠÎKŠÒrÂw'Vææ–ærr“§fÇVRæVæ&ÆVC÷B‚~iÊ®hÈ.‹ÛÒrÂv–æ7F—fRr“§B‚~[{.XÎyJ‚rÂvF—6&ÆVBr’’’’“¦‚‚wrÇ¶6Æ74æÖS¢v6÷&RÖæ÷FRwÒÇB‚~x«nhXª‹ÛŞKŠŞ8"rÂtÆöF–ær7FGW2âr’’’ÀĞ¢‚‚w6V7F–öârÇ¶6Æ74æÖS¢v6÷&RÖ6&BwÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ6&BÖ†VBwÒÆ‚‚vƒ2rÆçVÆÂÇB‚~i[hÚîKˆîŠNhêRrÂtFFæB6öçF–çV—G’r’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒ×Æ–âwÒÇB‚~Xú®Šû¾jh.Šx‚rÂu&VBÖöæÇ’r’’’Æ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRÖw&–BwÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRÖæÖRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~{¸şXènŠë[ÙRrÂtW‡W&–Væ6W2r’’Æ‚‚v6öFRrÆçVÆÂÂvWfVçG2r’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvRwÒÅ7G&–ær†W‡W&–Væ6W2æÆVæwF‚’’’Æ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRwÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÖöGVÆRÖæÖRwÒÆ‚‚w7G&öærrÆçVÆÂÇB‚~Xúşh.ZHŞi[hÚîKº2rÂu&öÆÆ&6²vVæW&F–öâr’’Æ‚‚v6öFRrÆçVÆÂÂvFFr’’Æ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖ&FvR6÷&RÖ&FvRÒÒr²‡7FGW3òæ6å&öÆÆ&6³òvö²s¢wÆ–âr—ÒÇ7FGW3òæ6å&öÆÆ&6³÷B‚~Xúşh.ZHÒrÂvf–Æ&ÆRr“§B‚~izrÂvæöæRr’’’’’“°Ğ¢&WGW&â‚‚w6V7F–öârÇ·&Vc§6†VÆÅ&VbÆ6Æ74æÖS¢vÖFWW2Ö6÷&R×6†VÆÂrÂvFFÖ6÷&R×F†VÖRs§F†VÖWÒÀĞ¢‚‚w7G–ÆRrÆçVÆÂÄ552’ÀĞ¢‚‚v†VFW"rÇ¶6Æ74æÖS¢v6÷&RÖ†VFW"wÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ'&æBwÒÆ‚‚w7ârÇ¶6Æ74æÖS¢v6÷&RÖÖ&²rÂv&–Ö†–FFVâs¢wG'VRwÒÂtr’Æ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ'&æB×FW‡BwÒÆ‚‚vƒ"rÆçVÆÂÂtÖFWW26÷&Rr’Æ‚‚wrÇ¶6Æ74æÖS¢v6÷&R×FvÆ–æRwÒÇB‚~KˆKŠ®‹ª¾K»Ò+rhÈ{ºŞy¨NŠë[øn8x«nhKˆîyIşkK²rÂtöæR–FVçF—G’+r6öçF–çV÷W2ÖVÖ÷'’Â7FFRæBÆ–fRr’’’’Æ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ†VFW"Ö7F–öç2wÒÆ‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'Fâ6÷&RÖ'FâÒÖv†÷7BrÆöä6Æ–6³¢‚“Óç6WDVævÆ—6‚‚VævÆ—6‚—ÒÆVævÆ—6ƒò~KŠŞihrs¢tVævÆ—6‚r’Æ‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'Fâ6÷&RÖ'FâÒÖv†÷7BrÆöä6Æ–6³§&Vg&W6‡ÒÇB‚~X‹~ikrÂu&Vg&W6‚r’’Æöä6Æ÷6Sö‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'Fâ6÷&RÖ'FâÒÖ6Æ÷6RrÆöä6Æ–6³¦öä6Æ÷6WÒÂ~X[>™zÒò6Æ÷6Rr“¦çVÆÂ’’ÀĞ¢‚‚væbrÇ¶6Æ74æÖS¢v6÷&R×F'2rÂv&–ÖÆ&VÂs§B‚tÖFWW26÷&RZûÎˆŠ¢rÂtÖFWW26÷&Ræf–vF–öâr—ÒÂââçF'2æÖ‚…¶–BÇ¦‚ÆVåÒ“Óæ‚‚v'WGFöârÇ¶¶W“¦–BÇG—S¢v'WGFöârÂv&–×&W76VBs§F#ÓÓÖ–BÆöä6Æ–6³¢‚“Óç6WEF"†–B—ÒÆVævÆ—6ƒöVã§¦‚’’’ÀĞ¢W'&÷'ÇÇ7FGW3òç&ö&ÆVÓö‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖÆW'BrÇ&öÆS¢vÆW'BwÒÆW'&÷'ÇÇ7FGW2ç&ö&ÆVÒ“¦çVÆÂÀĞ¢7FGW3òçVæF–æu&W7F'Cö‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ&ææW"wÒÆ‚‚w7ârÆçVÆÂÇB‚~KùŞZÙy¨N˜XŞ{Úî[	®iÊ®[©NyJ8"rÂu6fVB6öæf–wW&F–öâ—2æ÷B7F—fR–WBâr’’Æ‚‚v'WGFöârÇ·G—S¢v'WGFöârÆ6Æ74æÖS¢v6÷&RÖ'FârÆF—6&ÆVC¦'W7’Æöä6Æ–6³¢‚“Óæ7F–öâ†7–æ2‚“Óç¶v—B’‚röÇ’rÇ·Ò“¶v—Bf÷&×56W'f–6Sòç&Vg&W6„ÆÂ‚—Ò—ÒÇB‚~[©NyJ˜XŞ{ÚârÂtÇ’6öæf–wW&F–öâr’’“¦çVÆÂÀĞ¢‚‚vÖ–ârÇ¶6Æ74æÖS¢v6÷&RÖÖ–â6÷&RÖÖ–âÒr·F'ÒÆ6öçFVçB’“°Ğ§ĞĞ¦gVæ7F–öâ6÷&TÆVæ6†W"‡¶7G‚Çf–Ww2Æf÷&×56W'f–6WÒ—°Ğ¢6öç7B¶÷VâÇ6WD÷VåÓ×W6U7FFR†fÇ6R“°Ğ¢W6TVffV7B‚‚“Óç¶–b‚÷Vâ—&WGW&ã¶6öç7BöÆCÖFö7VÖVçBæ7F—fTVÆVÖVçBÆfãÖSÓç¶–b†Ræ¶W“ÓÓÒtW66Rr—6WD÷Vâ†fÇ6R—Ó¶Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚v¶W–F÷vârÆfâ“·&WGW&â‚“Óç¶Fö7VÖVçBç&VÖ÷fTWfVçDÆ—7FVæW"‚v¶W–F÷vârÆfâ“¶öÆCòæfö7W3òâ‚—×ÒÅ¶÷VåÒ“°Ğ¢&WGW&â‚‚vF—brÆçVÆÂÆ‚‚v'WGFöârÇ·G—S¢v'WGFöârÆöä6Æ–6³¢‚“Óç6WD÷Vâ‡G'VR’Ç7G–ÆS§¶föçC¢v–æ†W&—BrÇFF–æs¢s‡‚'‚rÆ&÷&FW%&F—W3£Æ&÷&FW#¢s‚6öÆ–B3sƒ“s†CSRrÆ&6¶w&÷VæC¢wG&ç7&VçBrÆ6öÆ÷#¢v–æ†W&—Bw×ÒÂtÖFWW26÷&Rr’Æ÷Vãö7&VFU÷'FÂ†‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖ÷fW&Æ’wÒÆ‚‚vF—brÇ¶6Æ74æÖS¢v6÷&RÖF–ÆörrÇ&öÆS¢vF–ÆörrÂv&–ÖÖöFÂs§G'VRÂv&–ÖÆ&VÂs¢tÖFWW26÷&RwÒÆ‚„6÷&UæVÂÇ¶7G‚Çf–Ww2Æf÷&×56W'f–6RÆöä6Æ÷6S¢‚“Óç6WD÷Vâ†fÇ6R—Ò’’’ÆFö7VÖVçBæ&öG’“¦çVÆÂ“°Ğ§ĞĞ§&WGW&â¶–æ¦V7C¥²w6Æ÷G2rÂvÆö6ÆRrÂv6öæf–tf÷&×2uÒÆÇ’†7G‚—°Ğ¢6öç7Bf–Ww3×·ÒÆ6öæf–tf÷&×3Öf÷&×2‚“°Ğ¢f÷"†6öç7B¶âÆÖöGVÆUÒöbö&¦V7BæVçG&–W2†ÖöGVÆW2’—°Ğ¢6öç7B6Æ÷G3×¶–æ¦V7C¢†æÖRÆfâ“ÓææÖSÓÓÒw6WGF–æw2ç6V7F–öâwÇÂ†ãÓÓÒvÖVÖ÷'’rbb²w6–FV&"æfö÷FW"æ7F–öâuÒæ–æ6ÇVFW2†æÖR’“öfâ‚“¢‚“Óç·ÒÇ&Vv—7FW#¢‡7V2Ç&VæFW"“Óç°Ğ¢–b‡7V2ææÖSÓÓÒw6WGF–æw2ç6V7F–öâr—·f–Ww5¶åÓÒ‚“Óæ‚‡&VæFW"Ç·Ò“·&WGW&â‚“Óç¶FVÆWFRf–Ww5¶å××Ó°Ğ¢–b†ãÓÓÒvÖVÖ÷'’rbb²wÇVv–ç2æFWF–Âç6V7F–öârÂwÇVv–ç2ç&÷ræ6öæf–rrÂw6–FV&"æfö÷FW"æ7F–öâuÒæ–æ6ÇVFW2‡7V2ææÖR’—&WGW&â7G‚ç6Æ÷G2ç&Vv—7FW"‡7V2Ç&VæFW"“°Ğ¢&WGW&â‚“Óç·Ó°Ğ¢×Ó°Ğ¢6öç7B66÷VCÖæWr&÷‡’†7G‚Ç¶vWC¢‡F&vWBÆ¶W’“Óæ¶W“ÓÓÒw6Æ÷G2s÷6Æ÷G3¦¶W“ÓÓÒv6öæf–tf÷&×2sö6öæf–tf÷&×3¥&VfÆV7BævWB‡F&vWBÆ¶W’—Ò“°Ğ¢ÖöGVÆRæÇ’‡66÷VB“°Ğ¢–b†ãÓÓÒvÖVÖ÷'’r—f–Ww2æÖVÖ÷'“Ò‚“ÓæÖöGVÆRæ6÷&Uf–Wr‡66÷VB“°Ğ¢ĞĞ¢7G‚ç6Æ÷G2æ–æ¦V7B‚w6WGF–æw2ç6V7F–öârÂ‚“Óæ7G‚ç6Æ÷G2ç&Vv—7FW"‡¶æÖS¢w6WGF–æw2ç6V7F–öârÆ–C¢vÖFWW2Ö6÷&RrÆ÷&FW#£#2ÆÆ&VÃ¢‚“ÓâtÖFWW26÷&RwÒÂ‚“Óæ‚„6÷&UæVÂÇ¶7G‚Çf–Ww2Æf÷&×56W'f–6S¦6öæf–tf÷&×7Ò’’“°Ğ¢7G‚ç6Æ÷G2æ–æ¦V7B‚w6–FV&"æfö÷FW"æ7F–öârÂ‚“Óæ7G‚ç6Æ÷G2ç&Vv—7FW"‡¶æÖS¢w6–FV&"æfö÷FW"æ7F–öârÆ–C¢vÖFWW2Ö6÷&RrÆ÷&FW#£RÆÆ&VÃ¢‚“ÓâtÖFWW26÷&RwÒÂ‚“Óæ‚„6÷&TÆVæ6†W"Ç¶7G‚Çf–Ww2Æf÷&×56W'f–6S¦6öæf–tf÷&×7Ò’’“°Ğ§×Ó°Ğ Ğ §×Ò“° 