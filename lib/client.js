Warning: truncated output (original token count: 327232)
... 260349 bytes omitted ...

window.__ModuleLoader__.load({id:'@fg-lab/amadeus-core',factory:(require)=>{
const modules={"memory": (()=>{let descriptor; const loader={load:x=>{descriptor=x}}; const window = new Proxy(globalThis.window,{get:(target,key)=>{if(key==='__ModuleLoader__')return loader;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}});
window.__ModuleLoader__.load({
  id: "@fg-lab/amadeus-memory",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    let react = require("react");
    let primitives = require("@deepseek-ai/dsh-client-ui-primitives");
    let { useState, useEffect, useCallback, useRef } = react;

    // #178 无障碍批次一：aria-live 网络。模块级单例 polite live region +
    // announce()：面板所有瞬时反馈（保存成功/失败、队列刷新、裁决完成、
    // 复制成功）经此播报，读屏用户不再依赖纯视觉 span。单例挂 <body>，
    // 与面板组件生命周期解耦；文本先清空下一帧再写入，让连续两次相同
    // 文案也能各播报一次。
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

    // #177 词级 diff：经典 LCS 对齐——删除片段标红、新增标绿、公共部分原样。
    // 分词两段式：Han 段先切出再逐字打散（\p{L} 把整句中文当一个词，必须单列），
    // 其余按 Unicode 词边界（拉丁按词、标点独立）。相邻同侧片段合并成 run。
    // 输入先截 800 字符；O(n·m) DP 仅在小文本启用（任一侧 > 800 词或 edit run
    // > 200 时返回 null），caller 退回原文展示，不为极端文本烧内存。
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
      if (n > 800 || m > 800) return null; // ponytail: O(n·m) DP，800×800 封顶（~2.5MB Int32），超限退回原文
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
    // --- mneme mark：插件自己的标识图标 -------------------------------------
    // 不再借宿主的 IconArchiveOutline*，两个原因：
    //  · 语义撞车——「归档盒」和记忆库里的归档动作是同一个符号，用户反馈看不出
    //    这是记忆插件（issue 走维护者自开通道）；
    //  · 宿主耦合——宿主图标名会换代（#287：Outline20 → OutlineRegular/Medium），
    //    只认某一代就取到 undefined，h(undefined) 即 React #130 把整个 slot entry
    //    崩掉。改用本地 Lucide 路径数据后，不再需要「探测多代名字 + 缺名降级」。
    // Lucide Brain（项目现有 Lucide 1.42 图标数据，ISC）；静态内嵌路径，避免插件运行时加载 ESM 包。
    // 宿主图标名会随版本换代，因此插件标识仍由本地 helper 渲染；插件列表 SVG 与这里共用同一路径。
    const MNEME_MARK_D = "M12 18V5M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5M17.997 5.125a4 4 0 0 1 2.526 5.77M18 18a4 4 0 0 0 2-7.464M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517M6 18a4 4 0 0 1-2-7.464M6.003 5.125a4 4 0 0 0-2.526 5.77";

    /** 24 栅格 Lucide Brain 映射到宿主 16 栅格，颜色仍随主题走。 */
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

    /** 渲染 mneme mark：四个入口（浮层标题栏 / footer 回退 / 侧边栏 portal / better-sidebar tab）共用同一颗。 */
    const renderMnemeMark = (props) => h(MnemeMark, props);

    // Portal target for the hero fallback surface. The host whitelists
    // react-dom for its own bundles (dsh-client-ui-trajectory requires it);
    // when the runtime rejects it for plugins the overlay renders in place —
    // position:fixed keeps it viewport-sized either way.
    let reactDom = null;
    try { reactDom = require("react-dom"); } catch { reactDom = null; }

    // Node-graph pictogram (three nodes joined by edges). The primitives kit
    // ships no network/graph icon, and its share-style glyph reads as
    // "share" — exactly the confusion this custom 16px replacement avoids.
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
    // tuples — the plugin runtime cannot require third-party libraries, so
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
      // 意见与反馈入口的行首图标（Lucide 数据，同上 ISC 惯例内联）
      bug: [["path", { d: "m8 2 1.88 1.88" }], ["path", { d: "M14.12 3.88 16 2" }], ["path", { d: "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" }], ["path", { d: "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" }], ["path", { d: "M12 20v-9" }], ["path", { d: "M6.53 9C4.6 8.8 3 7.1 3 5" }], ["path", { d: "M6 13H2" }], ["path", { d: "M3 21c0-2.1 1.7-3.9 3.8-4" }], ["path", { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4" }], ["path", { d: "M22 13h-4" }], ["path", { d: "M17.2 17c2.1.1 3.8 1.9 3.8 4" }]],
      mail: [["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }], ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }]],
      // star 是设置页鼓励入口的行首图标（Lucide 数据，同上 ISC 惯例内联）。
      // Icon 对未注册的名字静默 return null——漏了它就是一行缺图标、闸门全绿，
      // 所以这条表与用法必须同处出现（见 test/client.test.js 的图标名锁）。
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

    // Lucide v1.42 star path（morphicons 官方配套的数据包）。morphicons 本体
    // 是 ESM-only 的变形动画引擎、插件运行时不允许 require 第三方库，故按
    // 既有惯例内联图标数据静态渲染；实心/空心由 fill 区分，空心降透明度。
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

    // 单颗星（与 ImportanceStars 同一份 Lucide 路径）：筛选 chip、实体提及数、
    // 注入预览这类行内小指标用它渲染，替换此前的文本星号——文本星号角更尖锐，
    // 与卡片/抽屉的 SVG 星并排时明显不同形（用户反馈后全线统一）。
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

    // 热度徽章（阶段二）：flame 图标 + 整数百分比，三档配色（热/温/冷）。
    // /list 仅在 heatEnabled=true 时下发 heat 字段——缺省即不渲染，开关关闭
    // 时徽章全站自动消失，前端无需感知开关状态。
    const HeatBadge = ({ value, size = 12 }) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return null;
      const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
      const tier = pct >= 66 ? "hot" : pct >= 33 ? "warm" : "cold";
      return h("span", { className: `mneme-heat mneme-heat--${tier}`, title: `${pct}%` },
        h(Icon, { name: "flame", size, className: "mneme-heatico" }),
        h("span", { className: "mneme-heatpct" }, `${pct}%`));
    };

    /**
     * v0.8.0 A4（issue #17）：scope 标注徽章——条目的归属来源一行摘要。
     *
     * 仅在条目带任一 scope 标注（agent_scope / workspace_scope / sensitivity）
     * 时渲染；字段缺省返回 null（未标注条目视觉零变化，前端不感知开关状态，
     * 与 HeatBadge 的「数据缺省即不渲染」同一模式）。tooltip 展示完整归属，
     * 标签复用详情抽屉的 i18n 键（云端复验观察点：tooltip 曾硬编码英文）。
     *
     * @param {{m: object, t: (key: string) => string}} props
     * @param {object} props.m 记忆条目（/list、/search 透出的 toApiList 形状，
     *   scope 四字段条件存在）
     * @param {(key: string) => string} props.t i18n 取词函数（调用点闭包提供）
     * @returns {object|null} 徽章 vnode；无任何标注时为 null
     */
    const ScopeBadge = ({ m, t }) => {
      if (!m || (!m.agent_scope && !m.workspace_scope && !m.sensitivity)) return null;
      const tip = [
        m.agent_scope ? `${t("memory.explorer.detail.agentScope")}: ${m.agent_scope}` : null,
        m.workspace_scope ? `${t("memory.explorer.detail.workspaceScope")}: ${m.workspace_scope}` : null,
        m.sensitivity ? `${t("memory.explorer.detail.sensitivity")}: ${m.sensitivity}` : null
      ].filter(Boolean).join(" · ");
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

    // ⚠️ 'betterSidebar' 绝不能进模块级 inject（issue #88 实锤）：loader 对
    // inject 声明的服务是硬等待——未安装 better-sidebar 的环境里整个 entry
    // 永远 pending（"1 entry did not activate" → Failed to load plugins）。
    // 软依赖靠内层动态子插件探测（见 apply 内 better-sidebar 挂载块）。
    const inject = ["slots", "locale", "configForms"];

    const NS = "memory";

    const dictionaries = {
      zh: {
        "memory.panel.empty": "暂无记忆条目",
        "memory.panel.open": "记忆",
        "memory.tab.all": "全部",
        "memory.tab.preference": "偏好",
        "memory.tab.project": "项目",
        "memory.tab.decision": "决策",
        "memory.tab.history": "历史",
        "memory.tab.summary": "小结",
        "memory.am.nav": "Amadeus 记忆",
        "memory.am.title": "Amadeus Memory",
        "memory.am.subtitle": "查看记忆库运行状态，调整记忆与向量检索设置。严格场景模式下可在下方按场景查看图谱。",
        "memory.am.loading": "正在读取状态…",
        "memory.am.refresh": "刷新状态",
        "memory.am.openPanel": "打开完整记忆管理",
        "memory.am.section.overview": "运行概览",
        "memory.am.section.core": "自动记忆与整理",
        "memory.am.section.config": "注入与记忆参数",
        "memory.am.section.memories": "记忆管理",
        "memory.am.section.backup": "备份与恢复",
        "memory.am.default": "默认",
        "memory.am.range": "范围",
        "memory.am.unit.items": "条",
        "memory.am.unit.chars": "字符",
        "memory.am.unit.ms": "毫秒",
        "memory.am.unit.minutes": "分钟",
        "memory.am.unit.turns": "轮",
        "memory.am.unit.score": "分数",
        "memory.am.memory.search": "搜索",
        "memory.am.memory.searchPlaceholder": "标题或正文…",
        "memory.am.memory.archived": "显示归档",
        "memory.am.memory.new": "新建记忆",
        "memory.am.memory.refresh": "刷新",
        "memory.am.memory.empty": "没有匹配的记忆",
        "memory.am.memory.edit": "编辑",
        "memory.am.memory.archive": "归档",
        "memory.am.memory.unarchive": "取消归档",
        "memory.am.memory.delete": "删除",
        "memory.am.memory.deleteConfirm": "确认永久删除这条记忆？",
        "memory.am.memory.deleteHint": "删除不可撤销；建议先创建备份。",
        "memory.am.memory.confirmDelete": "确认删除",
        "memory.am.memory.cancel": "取消",
        "memory.am.memory.save": "保存记忆",
        "memory.am.memory.saving": "保存中…",
        "memory.am.memory.type": "类型",
        "memory.am.memory.typeImmutable": "已有记忆的类型不可修改",
        "memory.am.memory.title": "标题",
        "memory.am.memory.content": "正文",
        "memory.am.memory.importance": "重要度（1–5）",
        "memory.am.memory.tags": "标签（英文逗号分隔）",
        "memory.am.memory.tagsHint": "普通标签可手工编辑；受保护的事件标签无法通过普通管理伪造。",
        "memory.am.memory.tagsPlaceholder": "项目, 工作",
        "memory.am.memory.type.preference": "偏好",
        "memory.am.memory.type.project": "项目",
        "memory.am.memory.type.decision": "决策",
        "memory.am.memory.type.history": "历史",
        "memory.am.memory.type.summary": "摘要",
        "memory.am.memory.type.pattern": "模式",
        "memory.am.memory.type.rejected_solution": "被拒方案",
        "memory.am.memory.type.pitfall": "教训",
        "memory.am.memory.type.constraint": "约束",
        "memory.am.memory.titleRequired": "标题不能为空",
        "memory.am.memory.contentRequired": "正文不能为空",
        "memory.am.memory.saved": "记忆已保存",
        "memory.am.memory.created": "记忆已创建",
        "memory.am.memory.merged": "已并入同标题记忆",
        "memory.am.memory.autoArchived": "已创建，但质量过滤将其归档；打开“显示归档”后可恢复。",
        "memory.am.memory.core": "核心记忆（受保护）",
        "memory.am.memory.coreHint": "受保护记忆不会被自动归档、遗忘、合并或删除；解除保护后才能删除。",
        "memory.am.memory.coreNote": "第一人称短记（可选）",
        "memory.am.memory.coreBadge": "核心",
        "memory.am.memory.coreSaved": "核心保护状态已更新",
        "memory.am.scene.title": "场景与近期上下文",
        "memory.am.scene.isolation": "场景隔离",
        "memory.am.scene.strict": "严格 QQ 模式",
        "memory.am.scene.hostUnavailable": "可信 Host 不可用：跨场景共享保持关闭（安全降级）",
        "memory.am.scene.current": "当前场景",
        "memory.am.scene.unknownPolicy": "无来源旧记忆：不视为公共；有场景标记的记忆默认隐藏",
        "memory.am.scene.legacyNote": "未标记来源的旧记忆提升为核心后仍保持未标记；在原有模式下可能被其他会话读取，不能视为私密记忆",
        "memory.am.scene.legacy": "legacy/未标注",
        "memory.am.scene.grants": "已授权读取关系",
        "memory.am.scene.noGrants": "没有跨场景授权",
        "memory.am.scene.degraded": "严格 Scene 模式下，普通图谱/身份/偏好读取受限，管理员场景图谱仍可用；已启用的 autoDream/Sleep 按持久化 Scene 分批运行。",
        "memory.am.recent.title": "近期上下文",
        "memory.am.recent.enabled": "已启用",
        "memory.am.recent.disabled": "未启用",
        "memory.am.recent.ttl": "保留时长（分钟）",
        "memory.am.recent.count": "缓冲事件数",
        "memory.am.recent.clear": "清空近期缓冲",
        "memory.am.recent.cleared": "近期缓冲已清空",
        "memory.am.workspace.title": "工作区",
        "memory.am.workspace.hint": "Amadeus Memory 同一时间只使用一个工作区。切换会立即停止旧工作区提供模型记忆；旧数据保留，重启或重载插件后新工作区才会生效。",
        "memory.am.workspace.selectLabel": "选择工作区",
        "memory.am.workspace.choose": "请选择一个工作区…",
        "memory.am.workspace.none": "尚未选择工作区",
        "memory.am.workspace.untitled": "未命名工作区",
        "memory.am.workspace.sessions": "Session 数",
        "memory.am.workspace.selected": "已选择",
        "memory.am.workspace.active": "当前运行",
        "memory.am.workspace.activeNone": "运行时尚未绑定工作区",
        "memory.am.workspace.selectedUnknown": "已选择的工作区不在当前注册表中",
        "memory.am.workspace.pendingBadge": "待重启",
        "memory.am.workspace.pending": "选择已保存。重启或重载 Amadeus Memory 插件后，新工作区才会激活；当前运行时仍指向旧工作区，并会立即拒绝模型记忆操作。旧工作区数据未被删除或迁移。",
        "memory.am.workspace.save": "保存选择",
        "memory.am.workspace.saving": "保存中…",
        "memory.am.workspace.cancel": "取消",
        "memory.am.workspace.sameSelection": "已是当前选择，无需保存。",
        "memory.am.workspace.invalidSelection": "所选工作区不在当前注册表中，请重新选择。",
        "memory.am.workspace.registryUnavailable": "工作区注册表不可用，暂时无法切换或保存。",
        "memory.am.workspace.registryEmpty": "当前工作区注册表为空，暂时没有可选择的项目。",
        "memory.am.workspace.reason": "原因代码",
        "memory.am.workspace.loadFailed": "读取工作区失败",
        "memory.am.workspace.saveFailed": "保存工作区选择失败",
        "memory.am.workspace.savedPending": "已保存；重启或重载插件后生效。",
        "memory.am.workspace.savedNoChange": "选择未变化，无需重启。",
        "memory.am.workspace.confirmTitle": "确认切换工作区？",
        "memory.am.workspace.confirmTarget": "将选择“{title}”。",
        "memory.am.workspace.confirmStop": "保存后，当前运行时会立即停止为旧工作区提供模型记忆。",
        "memory.am.workspace.confirmRetained": "旧工作区的数据会保留，不会被删除、合并或迁移。",
        "memory.am.workspace.confirmRestart": "必须重启或重载 Amadeus Memory 插件，新工作区才会生效；保存不会自动切换当前运行时。",
        "memory.am.workspace.confirmAction": "确认切换",
        "memory.am.recentActivity.title": "跨会话近期动态",
        "memory.am.recentActivity.hint": "按 Workspace 隔离：Session 可选择是否参与，并决定近期摘要的共享范围。预览始终由服务器按目标 Session 的权限过滤。",
        "memory.am.recentActivity.summaryTitle": "近期动态概览",
        "memory.am.recentActivity.workspaceSelected": "已选择 Workspace",
        "memory.am.recentActivity.workspaceActive": "运行中 Workspace",
        "memory.am.recentActivity.workspaceNone": "尚未选择工作区",
        "memory.am.recentActivity.enabled": "已启用",
        "memory.am.recentActivity.disabled": "已停用",
        "memory.am.recentActivity.configuredOn": "配置为启用",
        "memory.am.recentActivity.configuredOff": "配置为停用",
        "memory.am.recentActivity.pendingBadge": "待重启",
        "memory.am.recentActivity.pending": "配置已保存，但当前运行时尚未切换；重启或重载 Amadeus Memory 插件后完全生效。",
        "memory.am.recentActivity.participating": "参与 Session",
        "memory.am.recentActivity.summaries": "摘要条数",
        "memory.am.recentActivity.lastUpdated": "最后更新",
        "memory.am.recentActivity.storage": "近似占用",
        "memory.am.recentActivity.injectionBudget": "注入预算",
        "memory.am.recentActivity.previewTokens": "估算注入 Token",
        "memory.am.recentActivity.policyCount": "已保存策略",
        "memory.am.recentActivity.sources": "来源分布",
        "memory.am.recentActivity.never": "从未更新",
        "memory.am.recentActivity.unknown": "未知",
        "memory.am.recentActivity.sessionsTitle": "Session 参与与共享",
        "memory.am.recentActivity.sessionsHint": "列表来自 owner API。可按标题或稳定 Session ID 过滤；点击一行编辑。",
        "memory.am.recentActivity.searchLabel": "搜索 Session",
        "memory.am.recentActivity.searchPlaceholder": "按标题或精确 Session ID 过滤",
        "memory.am.recentActivity.sessionsEmpty": "当前 Workspace 没有可管理的 Session。",
        "memory.am.recentActivity.searchEmpty": "没有匹配的 Session。",
        "memory.am.recentActivity.sessionId": "稳定 ID",
        "memory.am.recentActivity.lastActive": "最近活动",
        "memory.am.recentActivity.participatingBadge": "参与中",
        "memory.am.recentActivity.pausedBadge": "已暂停",
        "memory.am.recentActivity.modeSelf": "仅自己",
        "memory.am.recentActivity.modeOwner": "仅 Owner",
        "memory.am.recentActivity.modeShared": "指定 Session",
        "memory.am.recentActivity.modeOwnerGated": "（服务器确认绑定后生效）",
        "memory.am.recentActivity.detailTitle": "Session 共享设置",
        "memory.am.recentActivity.detailHint": "保存只提交此 Session 的精确策略；权限仍由服务器执行。",
        "memory.am.recentActivity.participation": "参与跨会话近期动态",
        "memory.am.recentActivity.participationHint": "关闭后，此 Session 不再写入或读取跨 Session 近期摘要。",
        "memory.am.recentActivity.modeLabel": "共享模式",
        "memory.am.recentActivity.modeSelfHint": "只保留给自己，不提供给其他 Session。",
        "memory.am.recentActivity.modeOwnerHint": "仅在服务器确认可信 Owner 绑定时提供给 Owner 目标；否则安全降级。",
        "memory.am.recentActivity.modeSharedHint": "只提供给下方勾选的 Session。",
        "memory.am.recentActivity.ownerDegraded": "当前状态未声明可信 Owner 绑定。Owner 模式由服务器安全降级；界面不会把它显示为已生效。",
        "memory.am.recentActivity.sharedLabel": "共享给（精确 Session ID）",
        "memory.am.recentActivity.sharedHint": "仅勾选的其他 Session 可读取此 Session 的近期摘要；列表有上限。",
        "memory.am.recentActivity.sharedEmpty": "没有其他可选 Session。",
        "memory.am.recentActivity.sharedUnknown": "既有但当前列表不可用的 Session（保留精确 ID）",
        "memory.am.recentActivity.sharedSelected": "已选 {count} 个 Session",
        "memory.am.recentActivity.sharedLimit": "共享 Session 最多 32 个。",
        "memory.am.recentActivity.savePolicy": "保存共享设置",
        "memory.am.recentActivity.saving": "保存中…",
        "memory.am.recentActivity.policySaved": "共享设置已保存，预览已刷新。",
        "memory.am.recentActivity.policyInvalid": "请检查 Session 共享设置后再保存。",
        "memory.am.recentActivity.policyModeInvalid": "请选择有效的共享模式。",
        "memory.am.recentActivity.policySharedInvalid": "共享列表包含无效、重复或过多的 Session ID。",
        "memory.am.recentActivity.selectSession": "选择一个 Session 以编辑。",
        "memory.am.recentActivity.closeDetail": "收起设置",
        "memory.am.recentActivity.previewTitle": "服务器权限预览",
        "memory.am.recentActivity.previewHint": "预览以目标 Session 的权限在服务器过滤，仅返回安全摘要，不显示原始对话。",
        "memory.am.recentActivity.previewTarget": "预览目标 Session",
        "memory.am.recentActivity.previewChoose": "选择要预览的 Session…",
        "memory.am.recentActivity.previewRefresh": "刷新预览",
        "memory.am.recentActivity.previewEmpty": "此目标暂无可见的近期摘要。",
        "memory.am.recentActivity.previewDenied": "服务器未授权此预览。",
        "memory.am.recentActivity.previewTruncated": "结果已按条数或 Token 预算截断。",
        "memory.am.recentActivity.previewCount": "条数",
        "memory.am.recentActivity.previewEstimated": "估算 Token",
        "memory.am.recentActivity.previewSource": "来源",
        "memory.am.recentActivity.kindConversation": "对话摘要",
        "memory.am.recentActivity.kindAgentAction": "代理操作摘要",
        "memory.am.recentActivity.configTitle": "全局配置",
        "memory.am.recentActivity.configHint": "这些开关只影响当前 Workspace 的近期动态；不会更改 Session 热记忆。",
        "memory.am.recentActivity.featureEnabled": "启用跨会话近期动态",
        "memory.am.recentActivity.ttlLabel": "保留时长",
        "memory.am.recentActivity.ttl1": "1 小时",
        "memory.am.recentActivity.ttl6": "6 小时",
        "memory.am.recentActivity.ttl24": "24 小时",
        "memory.am.recentActivity.ttl72": "72 小时",
        "memory.am.recentActivity.autoInject": "自动注入近期动态",
        "memory.am.recentActivity.autoInjectHint": "在授权方向自动注入服务器过滤后的近期摘要；不会注入原始对话。",
        "memory.am.recentActivity.maxItems": "最多摘要条数（1–10）",
        "memory.am.recentActivity.maxTokens": "Token 预算（100–800）",
        "memory.am.recentActivity.validationEnabled": "请选择是否启用。",
        "memory.am.recentActivity.validationTtl": "保留时长必须是 1、6、24 或 72 小时。",
        "memory.am.recentActivity.validationAutoInject": "请选择是否自动注入。",
        "memory.am.recentActivity.validationMaxItems": "摘要条数必须是 1–10 的整数。",
        "memory.am.recentActivity.validationMaxTokens": "Token 预算必须是 100–800 的整数。",
        "memory.am.recentActivity.saveConfig": "保存全局配置",
        "memory.am.recentActivity.configSaved": "全局配置已保存。",
        "memory.am.recentActivity.configPendingSaved": "全局配置已保存；重启或重载插件后完全生效。",
        "memory.am.recentActivity.strategyTitle": "摘要策略（固定、确定性）",
        "memory.am.recentActivity.strategy": "每个已完成的对话轮次结束后，服务器按固定规则确定性生成受长度约束的摘要；不调用模型自由生成，不返回原始对话。",
        "memory.am.recentActivity.loadFailed": "读取跨会话近期动态失败",
        "memory.am.recentActivity.saveFailed": "保存跨会话近期动态设置失败",
        "memory.am.recentActivity.previewFailed": "读取预览失败",
        "memory.am.recentActivity.backendError": "服务器返回错误；未显示可能包含路径或敏感信息的详情。",
        "memory.am.recentActivity.reasonSourceDisabled": "目标 Session 已暂停参与",
        "memory.am.recentActivity.reasonAccessDenied": "服务器拒绝访问此 Session",
        "memory.am.recentActivity.reasonInvalidPolicy": "策略无效或不可读",
        "memory.am.recentActivity.reasonMissingSession": "缺少目标 Session ID",
        "memory.am.recentActivity.reasonUnavailable": "近期动态存储暂不可用",
        "memory.am.recentActivity.reasonUnknown": "未识别的安全原因代码",
        "memory.am.graph.title": "场景知识图谱（只读）",
        "memory.am.graph.scope": "选择场景",
        "memory.am.graph.choose": "请选择场景",
        "memory.am.graph.chooseHint": "选择一个场景查看该场景的实体与关系；不会合并其他场景。",
        "memory.am.graph.empty": "该场景没有可显示的实体证据",
        "memory.am.graph.truncated": "结果已截断；请缩小场景或使用更小的范围。",
        "memory.am.graph.nodes": "节点",
        "memory.am.graph.edges": "关系",
        "memory.am.graph.relations": "关系列表",
        "memory.am.graph.noRelations": "没有关系证据",
        "memory.am.graph.related": "相关记忆",
        "memory.am.graph.overview": "图中展示前 {shown}/{total} 个节点；完整节点列表见下",
        "memory.am.graph.nodesList": "节点列表（键盘可选择）",
        "memory.am.graph.search": "搜索节点",
        "memory.am.graph.searchPlaceholder": "按名称或类型筛选",
        "memory.am.graph.searchClear": "清除搜索",
        "memory.am.graph.searchEmpty": "没有匹配的节点",
        "memory.am.graph.focused": "当前聚焦",
        "memory.explorer.title": "完整记忆浏览器",
        "memory.explorer.close": "关闭",
        "memory.explorer.all": "全部",
        "memory.explorer.allScenes": "全部场景",
        "memory.explorer.scopeHint": "选择一个或多个场景会收窄结果；空选表示全部。",
        "memory.explorer.keyword": "关键词搜索",
        "memory.explorer.searchPlaceholder": "标题/内容/标签关键字",
        "memory.explorer.type": "类型",
        "memory.explorer.allTypes": "全部类型",
        "memory.explorer.minImportance": "最低重要性",
        "memory.explorer.date": "时间",
        "memory.explorer.archived": "仅归档",
        "memory.explorer.cards": "卡片",
        "memory.explorer.scene": "场景",
        "memory.explorer.editTitle": "标题",
        "memory.explorer.editContent": "内容",
        "memory.explorer.prev": "上一页",
        "memory.explorer.next": "下一页",
        "memory.explorer.hop1": "1 跳",
        "memory.explorer.hop2": "2 跳",
        "memory.explorer.hops": "跳数",
        "memory.explorer.reset": "重置",
        "memory.explorer.statusOverview": "运行概览",
        "memory.explorer.conflicts": "待确认冲突",
        "memory.explorer.dreamRuns": "Dream 运行",
        "memory.explorer.audit7d": "近 7 天用量",
        "memory.explorer.tokenShare": "按操作的 Token 占比",
        "memory.explorer.requests": "请求",
        "memory.explorer.tokens": "Token",
        "memory.explorer.noData": "暂无真实数据",
        "memory.explorer.acl": "读白名单（方向性）",
        "memory.explorer.aclHint": "允许一个 QQ 群读取另一个同 bot 群的长记忆；只读、不传递、不含私聊/旧数据。浏览器选择不会直接授权。",
        "memory.explorer.aclEmpty": "暂无手动授权",
        "memory.explorer.revoke": "撤销",
        "memory.explorer.reader": "读取方群",
        "memory.explorer.grant": "授予读取",
        "memory.explorer.bot": "机器人 QQ 号",
        "memory.explorer.readerGroup": "读取方群号",
        "memory.explorer.sourceGroup": "来源方群号",
        "memory.explorer.aclDirection": "群 {reader} 可读取群 {source} 的长期记忆",
        "memory.am.tabs.memory": "记忆",
        "memory.am.tabs.entities": "实体",
        "memory.am.tabs.status": "状态",
        "memory.am.tabs.settings": "设置",
        "memory.am.memoryView.longTerm": "长期记忆",
        "memory.am.memoryView.recent": "跨会话近期动态",
        "memory.am.settings.general": "基础",
        "memory.am.settings.personalization": "个性化",
        "memory.personalization.profile": "用户画像",
        "memory.personalization.profileHint": "画像与规则由当前 owner 设置直接读取；保存后下一次注入生效。",
        "memory.personalization.defaultCard": "默认人格卡",
        "memory.personalization.agentCards": "按 Agent 的人格卡",
        "memory.personalization.name": "名称",
        "memory.personalization.personality": "人格",
        "memory.personalization.replyStyle": "回复风格",
        "memory.personalization.enabled": "启用",
        "memory.personalization.preview": "实际注入预览",
        "memory.personalization.previewHint": "由服务端与注入器同一渲染函数产出；仅展示画像/人格/规则，不含跨场景记忆正文。",
        "memory.personalization.saveProfile": "保存画像",
        "memory.personalization.savePersona": "保存人格卡",
        "memory.personalization.saved": "个性化设置已保存",
        "memory.am.settings.retrieval": "检索",
        "memory.am.settings.scene": "场景",
        "memory.am.settings.backup": "备份",
        "memory.am.settings.acl": "访问白名单",
        "memory.am.recent.hotTitle": "Session 热记忆",
        "memory.am.recent.hotHint": "当前 Session 最近几轮原文，仅存于内存并随 Session 生命周期消失；不是 SQLite 记忆，owner API 无法枚举或列出其内容。",
        "memory.am.recent.hotState": "热记忆注入",
        "memory.am.recent.trustedTitle": "可信 Scene 近期上下文",
        "memory.am.recent.trustedHint": "10 分钟 TTL 的进程内缓冲；管理员可查看各 Scene 的事件数，不返回原文。",
        "memory.am.entitiesHint": "单场景只读图谱，必须先选择场景；不会合并其他场景。",
        "memory.am.entitiesFullHint": "存在 Scene 记忆或启用严格模式时，旧版面板的图谱与身份接口会停用；别名和规范实体管理须等场景安全入口补齐。",
        "memory.am.entitiesOpenFull": "打开完整记忆/实体面板",
        "memory.am.entitiesWeights": "标签/实体权重",
        "memory.am.memory.archivedDone": "已归档",
        "memory.am.memory.unarchivedDone": "已取消归档",
        "memory.am.memory.deleted": "已删除",
        "memory.am.memory.stale": "这条记忆已被其他页面修改；请重新打开后再保存。",
        "memory.am.memory.loadError": "加载记忆失败",
        "memory.am.memory.prev": "上一页",
        "memory.am.memory.next": "下一页",
        "memory.am.restoreDefaultsHint": "只重置参数，不会删除记忆。",
        "memory.am.backup.create": "创建备份",
        "memory.am.backup.creating": "备份中…",
        "memory.am.backup.refresh": "刷新备份",
        "memory.am.backup.empty": "还没有备份",
        "memory.am.backup.hint": "备份是 SQLite 一致性快照，保存在 memoryDir/backups；恢复只在重启后应用。",
        "memory.am.backup.check": "校验",
        "memory.am.backup.checked": "校验通过",
        "memory.am.backup.restore": "暂存恢复",
        "memory.am.backup.restoreTitle": "恢复备份",
        "memory.am.backup.restoreHint": "恢复会在下次 DSH 启动时替换当前数据库，并先自动保留一份 pre-restore 现场；运行中不会覆盖。",
        "memory.am.backup.ack": "我了解需要重启并确认恢复",
        "memory.am.backup.stage": "暂存并在重启后恢复",
        "memory.am.backup.staged": "已暂存；重启 DSH 后应用。",
        "memory.am.backup.failed": "备份操作失败",
        "memory.am.backup.restart": "重启 DSH 后生效",
        "memory.am.backup.sha": "SHA-256",
        "memory.am.backup.memories": "条记忆",
        "memory.am.backup.createdAt": "创建时间",
        "memory.am.section.embedding": "向量检索与 Embedding",
        "memory.am.section.preferences": "Tag 与实体偏好",
        "memory.am.section.advanced": "高级与诊断",
        "memory.am.runState": "记忆库状态",
        "memory.am.memories": "记忆",
        "memory.am.archived": "已归档",
        "memory.am.forgotten": "已遗忘",
        "memory.am.running": "运行中",
        "memory.am.paused": "已暂停",
        "memory.am.database": "SQLite",
        "memory.am.autoMemory": "自动记忆/总结",
        "memory.am.lastError": "最近错误",
        "memory.am.none": "无",
        "memory.am.version": "版本",
        "memory.am.lastDream": "最近自动巩固",
        "memory.am.lastSleep": "最近 Sleep",
        "memory.am.never": "尚未运行",
        "memory.am.vector": "向量检索",
        "memory.am.vectorReady": "可用",
        "memory.am.vectorInitializing": "初始化中",
        "memory.am.vectorDisabled": "未配置/不可用",
        "memory.am.dimension": "维度",
        "memory.am.coverage": "索引覆盖",
        "memory.am.featureHint": "开关改的是同一份运行时覆盖；保存后按提示重载插件。",
        "memory.am.configUnavailable": "当前 DSH 没有提供 Config Forms；请到插件管理器修改这些参数。",
        "memory.am.configHint": "这些结构参数通过 Config Forms 保存；请按宿主提示应用配置或重载插件后生效。",
        "memory.am.conflict": "配置已被其他页面修改；请取消后重新编辑，避免覆盖别人的保存。",
        "memory.am.save": "保存",
        "memory.am.cancel": "取消",
        "memory.am.restoreDefaults": "恢复默认",
        "memory.am.saved": "已保存。",
        "memory.am.savedRestart": "已保存；插件重载后生效。",
        "memory.am.restartHint": "已写入，重载插件后生效。",
        "memory.am.embedHint": "只显示服务方、模型、维度与索引状态；密钥永不回传浏览器。",
        "memory.am.vectorEnabled": "启用向量检索",
        "memory.am.vectorEnabledHint": "关闭后仍可使用关键词检索。",
        "memory.am.local": "本地 ONNX",
        "memory.am.baseUrl": "Base URL",
        "memory.am.model": "模型",
        "memory.am.apiKey": "API Key",
        "memory.am.apiKeyKeep": "留空或保持掩码 = 保留现有密钥。",
        "memory.am.saveEmbedding": "保存 Embedding 配置",
        "memory.am.embeddingSavedRestart": "已保存；模型/提供方变化会重建索引，重载插件后生效。",
        "memory.am.test": "测试连通性",
        "memory.am.testing": "测试中…",
        "memory.am.testWarning": "会发起一次真实远端请求（若当前是远端 Provider）。",
        "memory.am.testOk": "连通成功",
        "memory.am.testFailed": "连通失败",
        "memory.am.preferenceHint": "复用记忆库已有的权重存储；恢复默认只清权重，不删除任何记忆。",
        "memory.am.tagWeights": "Tag 权重",
        "memory.am.entityWeights": "实体权重",
        "memory.am.delete": "删除",
        "memory.am.reset": "恢复默认权重",
        "memory.am.resetConfirm": "确认恢复默认权重",
        "memory.am.invalid": "数值超出允许范围。",
        "memory.am.noChanges": "没有改动。",
        "memory.am.package": "插件包",
        "memory.am.dataDir": "数据库路径",
        "memory.am.vectorIndex": "向量索引",
        "memory.am.trustedIntake": "受信经历入口",
        "memory.am.enabled": "已启用",
        "memory.am.disabled": "未启用",
        "memory.am.advancedTitle": "展开高级与诊断信息",
        "memory.am.advancedHint": "别名、合并、维护与审计请用「打开完整记忆管理」；严格场景模式下普通图谱会安全关闭，请使用上方场景图谱。",
        "memory.am.languageZh": "中文",
        "memory.am.languageEn": "English",
        "memory.am.field.language": "记忆语言",
        "memory.am.field.dreamThresholdCount": "自动整理触发条数",
        "memory.am.field.dreamThresholdChars": "自动整理触发字符数",
        "memory.am.field.dreamDelayMs": "自动整理延迟（毫秒）",
        "memory.am.field.sleepIdleMinutes": "Sleep 空闲分钟数",
        "memory.am.field.maxInjectedItems": "每轮最多注入条数",
        "memory.am.field.importanceThreshold": "自动注入重要性门槛",
        "memory.am.field.injectContentMaxChars": "注入正文截断字符数",
        "memory.am.field.injectRotationTurns": "注入轮换轮数",
        "memory.am.field.vectorSearchTopK": "向量候选数",
        "memory.am.field.vectorSearchThreshold": "向量相似度阈值",
        "memory.am.field.hybridSearchVectorWeight": "混合检索向量权重",
        "memory.am.field.autoReindexOnBoot": "启动时自动补齐索引",
        "memory.am.fieldHint.language": "记忆标题与后台提示词语言。",
        "memory.am.fieldHint.dreamThresholdCount": "新增记忆达到该条数后触发自动整理。",
        "memory.am.fieldHint.dreamThresholdChars": "新增正文达到该字符数后触发自动整理。",
        "memory.am.fieldHint.dreamDelayMs": "触发后等待多久再开始整理。",
        "memory.am.fieldHint.sleepIdleMinutes": "空闲多久后运行 Sleep。",
        "memory.am.fieldHint.maxInjectedItems": "每轮自动注入的条数上限。",
        "memory.am.fieldHint.importanceThreshold": "达到该重要性的记忆才会自动注入。",
        "memory.am.fieldHint.injectContentMaxChars": "单条注入正文的截断上限。",
        "memory.am.fieldHint.injectRotationTurns": "避免连续多轮注入同一批记忆。",
        "memory.am.fieldHint.vectorSearchTopK": "语义检索进入融合池的候选数。",
        "memory.am.fieldHint.vectorSearchThreshold": "低于该相似度的向量不参与。",
        "memory.am.fieldHint.hybridSearchVectorWeight": "混合检索时向量分数的权重。",
        "memory.am.fieldHint.autoReindexOnBoot": "启动后补齐缺失向量的索引。",
        "memory.settings.title": "记忆库设置",
        "memory.settings.group.identity": "身份与偏好",
        "memory.settings.identity.title": "身份与偏好权重",
        "memory.settings.identity.desc": "同名实体只作为候选，不会自动合并；为标签或规范实体设置 0.5–2.0 的偏好权重（默认 1.0，组合后夹在 0.6–1.6）。总开关关闭或权重全为 1.0 时检索行为不变。",
        "memory.settings.identity.tags": "标签权重",
        "memory.settings.identity.tagPlaceholder": "标签，如 person:close",
        "memory.settings.identity.weight": "权重",
        "memory.settings.identity.addTag": "添加标签权重",
        "memory.settings.identity.entities": "实体偏好",
        "memory.settings.identity.entityPlaceholder": "实体 UUID 或名称",
        "memory.settings.identity.addEntity": "添加实体权重",
        "memory.settings.identity.candidates": "重复候选",
        "memory.settings.identity.candidatesHint": "只根据名称/别名提出候选；确认前不会合并或改写任何记忆。先预览影响，再确认。",
        "memory.settings.identity.preview": "预览影响",
        "memory.settings.identity.previewLeft": "以左侧为准",
        "memory.settings.identity.previewRight": "以右侧为准",
        "memory.settings.identity.confirm": "确认合并",
        "memory.settings.identity.undo": "撤销合并",
        "memory.settings.identity.links": "已建立的规范映射",
        "memory.settings.identity.noCandidates": "没有待确认的候选",
        "memory.settings.identity.noLinks": "没有规范映射",
        "memory.settings.identity.counts": "实体 {entities} · 属性 {attrs} · 关系 {relations} · 记忆 {memories} · 冲突 {conflicts}",
        "memory.settings.identity.blocked": "存在阻断项：{reason}",
        "memory.settings.identity.dryRun": "影响报告已生成（未写入）",
        "memory.settings.identity.saved": "已保存",
        "memory.settings.identity.deleted": "已删除",
        "memory.settings.identity.error": "操作失败",
        "memory.settings.identity.delete": "删除",
        "memory.settings.identity.save": "保存",
        "memory.identity.needToken": "身份与来源详情需要服务端 apiToken：在插件配置里设置 apiToken，并在「设置 → 连接与安全 → API Token」填入同一个值。",
        "memory.identity.title": "身份",
        "memory.identity.aliases": "别名",
        "memory.identity.externalIds": "外部标识",
        "memory.identity.history": "历史与证据",
        "memory.identity.aliasPlaceholder": "新增别名…",
        "memory.identity.addAlias": "添加",
        "memory.identity.confirmAlias": "确认",
        "memory.identity.editAlias": "改名",
        "memory.identity.unlink": "解除",
        "memory.identity.externalPlaceholder": "外部 ID",
        "memory.identity.platformPlaceholder": "平台，如 qq",
        "memory.identity.typePlaceholder": "类型",
        "memory.identity.addExternal": "绑定外部 ID",
        "memory.identity.preference": "偏好权重",
        "memory.identity.preferenceHint": "当前规范实体的偏好权重（0.5–2.0，默认 1.0）。",
        "memory.identity.members": "规范成员",
        "memory.identity.merged": "已合并视图",
        "memory.identity.provenance": "来源",
        "memory.identity.weight": "权重",
        "memory.identity.saveWeight": "保存权重",
        "memory.identity.noAliases": "暂无别名",
        "memory.identity.noExternal": "暂无外部标识",
        "memory.identity.duplicateName": "同名实体",
        "memory.graph.edgeWeight": "权重 {weight} · 来源 {source}",
        "memory.graph.canonicalHint": "此节点是规范视图，包含 {n} 个原始实体",
        "memory.settings.group.personal": "个性化",
        "memory.settings.group.engine": "记忆引擎",
        "memory.settings.group.search": "搜索",
        "memory.settings.group.connect": "连接与安全",
        "memory.settings.group.help": "帮助",
        "memory.settings.profile": "用户画像",
        "memory.settings.profileHint": "写一段自我介绍（角色、背景、偏好），Agent 每轮对话都会自动带上。",
        "memory.settings.profileSave": "保存画像",
        "memory.settings.profileSaved": "画像已保存",
        "memory.settings.profileExtract": "从记忆提取草稿",
        "memory.settings.profileExtracting": "正在提取…",
        "memory.settings.profileExtractHint": "会花一次模型调用，只在你点这个按钮时发生；提取出来的是草稿，不采用就不进库，你手写的画像也不会被覆盖。",
        "memory.settings.profileExtractDisabled": "没有提取：功能开关里的「画像提取草稿」还没打开。",
        "memory.settings.profileExtractEmpty": "库里没有可用的记忆条目，这次没有能提炼的内容（空输入下硬写一段画像只会是编的）。",
        "memory.settings.profileExtractNoRoute": "没有可用的模型：先在宿主里选一个默认模型（或在配置里填 dreamProvider / dreamModel），再点一次。",
        "memory.settings.profileSaveFailed": "画像没存进去",
        "memory.settings.profileExtractFailed": "提取没成：模型没按格式返回，或这次调用失败了。你现有的画像一个字都没被改动。",
        "memory.settings.profileDraftTitle": "草稿（还没保存）",
        "memory.settings.profileDraftRows": "依据记忆条数",
        "memory.settings.profileDraftTruncated": "条目较多，这次只读了前面一部分",
        "memory.settings.profileDraftApply": "采用为画像",
        "memory.settings.profileDraftDiscard": "丢弃草稿",
        "memory.settings.persona": "人格定义（beta）",
        "memory.settings.personaHint": "给这位 Agent 一张角色卡：名字、性格、回复要求。开关打开且下方「人格定义」总闸开启时，每轮对话都会注入。",
        "memory.settings.personaName": "名字",
        "memory.settings.personaNamePlaceholder": "例如：Nyx",
        "memory.settings.personaPersonality": "性格设定",
        "memory.settings.personaPersonalityPlaceholder": "例如：轻松幽默，讲难题时用类比帮用户快速理解",
        "memory.settings.personaReplyStyle": "回复要求",
        "memory.settings.personaReplyStylePlaceholder": "例如：先给结论再解释；用人在用的词，不用机制名",
        "memory.settings.personaSave": "保存人格",
        "memory.settings.personaSaved": "人格已保存",
        "memory.settings.personaSaveFailed": "保存失败",
        "memory.settings.personaEnabledToggle": "启用这张卡",
        "memory.settings.personaEnabledOn": "已启用——身份命中的会话会注入这张卡",
        "memory.settings.personaEnabledOff": "未启用——默认口径下这个身份的会话会改用默认卡；开着「严格人格寻址」时则完全不注入人格",
        "memory.settings.personaDefaultCard": "默认卡（兜底）",
        "memory.settings.personaAdd": "添加卡",
        "memory.settings.personaAddPlaceholder": "输入 agent 身份名（如 nyx），按它寻址注入",
        "memory.settings.personaEditingDefault": "正在编辑：默认卡——解析不到身份的会话一定用它；身份解析到了却没建卡（或卡被关掉）的会话，在默认口径下也落到这里，开着「严格人格寻址」则不注入人格",
        "memory.settings.personaEditingFor": "正在编辑身份卡：",
        "memory.settings.personaDeleteCard": "删除这张卡",
        "memory.settings.personaView": "Agent 眼中的你（注入生效文本）",
        "memory.settings.personaViewHint": "下面是这一轮真正会送进模型的整段文本：人格 → 画像 → 规则（后写的覆盖前写的，规则最硬）。文本由插件渲染，前端只显示。",
        "memory.settings.personaViewEmpty": "三项都是空的——Agent 每轮只会看到记忆库。",
        "memory.settings.personaViewUnknown": "读不到注入文本（预览请求失败或后端版本过旧）。这里不显示猜测的内容。",
        "memory.settings.personaViewSourceDefault": "当前按「解析不到会话身份」的会话预览，取默认卡。",
        "memory.settings.personaViewSourceFallback": "这个身份解析到了，但它没有可用的卡（没建或已关掉），所以落回默认卡——默认口径下这正是「关掉这张卡」不生效的原因；打开「严格人格寻址」后这种情况改为不注入人格。",
        "memory.settings.personaViewSourceCard": "当前按你正在编辑的这张身份卡预览。",
        "memory.settings.personaViewSourceNone": "按当前寻址口径，这个身份不会注入任何人格——默认卡只兜「解析不到会话身份」的会话。",
        "memory.settings.personaViewGateOff": "总闸「人格定义（beta）」现在是关的：下面这段里不会出现人格，只有画像与规则。",
        "memory.settings.personaViewRefresh": "刷新预览",
        "memory.features.personaEnabled": "人格定义（beta）",
        "memory.features.personaEnabled.hint": "把「设置 → 个性化」里的人格卡注入到每轮对话。默认关（beta）；总闸与人格卡内的开关同时打开才生效。",
        "memory.features.personaStrictAddressing": "严格人格寻址",
        "memory.features.personaStrictAddressing.hint": "开：会话身份没有对应人格卡、或那张卡被关掉时，就不注入人格——默认卡只兜「解析不到会话身份」的会话。宿主里跑着自带身份的 bot（DS Bot 那类）时关掉这种兜底，免得两句「你是谁」撞在同一轮。默认关 = 未命中就落默认卡（历史行为）。",
        "memory.features.profileExtractEnabled": "画像提取草稿",
        "memory.features.profileExtractEnabled.hint": "打开「设置 → 个性化 → 用户画像」里的「从记忆提取草稿」按钮：读一批活跃记忆、花一次模型调用，产一段「助手眼中的用户」草稿。草稿要你点「采用」才会写进画像，绝不自动覆盖你手写的原文。轻量档预设关（用户显式勾选仍然赢）。",
        "memory.settings.rules": "规则",
        "memory.settings.rulesHint": "给 Agent 立下必须遵守的规矩，随时增删，下一轮即生效。",
        "memory.settings.ruleAdd": "添加规则",
        "memory.settings.rulePlaceholder": "例如：回答时总是先给结论",
        "memory.settings.commands": "自定义指令",
        "memory.settings.commandsHint": "把常用提示词存成 / 命令，聊天时直接键入调用。",
        "memory.settings.cmdName": "命令名",
        "memory.settings.cmdDesc": "描述",
        "memory.settings.cmdInstruction": "指令内容",
        "memory.settings.cmdAdd": "添加命令",
        "memory.settings.cmdDelete": "删除",
        "memory.settings.empty": "暂无内容",
        "memory.panel.semantic": "语义",
        "memory.sidebar.aria": "打开记忆库",
        "memory.view.label": "记忆库",
        "memory.overlay.close": "关闭",
        "memory.explorer.tabMemory": "记忆",
        "memory.explorer.tabEntities": "实体",
        "memory.explorer.tabSettings": "设置",
        "memory.explorer.tabStatus": "状态",
        "memory.explorer.tabAmadeus": "Amadeus 增强",
        "memory.am.enhancementsIntro": "场景隔离、检索偏好、人格兼容和备份等 Amadeus 专属设置。严格场景模式下，可通过完整记忆浏览器按场景查看安全图谱。",
        "memory.entities.count": "{n} 个实体",
        "memory.entities.loadMore": "加载更多实体",
        "memory.entities.pick": "从左侧选择一个实体，查看它的属性与关系",
        // 搜索框有字但一条没筛出来时用它；与 entities.none（库里真没实体）分开，
        // 否则「暂无实体」会把打错一个字误导成「你还没开抽取」。
        "memory.entities.noMatch": "没有匹配的实体，换个词试试",
        "memory.entities.none": "暂无实体：开启实体抽取后，记忆里的人物 / 项目 / 概念会自动沉淀到这里",
        "memory.entities.restart": "实体抽取已开启，但当前运行时尚未装载；重载插件后开始抽取",
        "memory.entities.restartOff": "实体抽取已关闭，但当前运行时仍在抽取；重载插件后停止",
        "memory.entities.pending": "实体抽取正在处理中…",
        "memory.entities.emptyEnabled": "实体抽取已开启，暂无实体；新写入的记忆会自动沉淀人物 / 项目 / 概念",
        "memory.entities.failed": "最近一次实体抽取失败；新的记忆仍会继续尝试抽取",
        "memory.entities.failedParse": "最近一次实体抽取失败：模型返回的内容无法解析；新的记忆仍会继续尝试抽取",
        "memory.entities.forbidden": "没有权限读取实体目录；请确认当前身份或 Scene 授权",
        "memory.entities.network": "网络错误，无法加载实体目录",
        "memory.entities.httpError": "加载实体目录失败（服务返回错误）",
        "memory.entities.refresh": "刷新",
        "memory.entities.attrs": "属性",
        "memory.entities.relations": "关系",
        "memory.entities.mentions": "{n} 次提及",
        "memory.entities.lastSeen": "最近出现",
        "memory.entity.person": "人物",
        "memory.entity.project": "项目",
        "memory.entity.concept": "概念",
        "memory.entity.technology": "技术",
        "memory.entity.organization": "组织",
        "memory.entity.other": "其他",
        "memory.explorer.search": "搜索标题或内容…",
        "memory.explorer.searchTitle": "语义检索",
        "memory.explorer.types": "分类",
        "memory.explorer.timeline": "时间树",
        "memory.explorer.detail": "详情",
        "memory.explorer.emptyDetail": "在时间树中选择一条记忆查看全文",
        "memory.explorer.copy": "复制全文",
        "memory.explorer.copied": "已复制",
        "memory.explorer.refresh": "刷新",
        "memory.explorer.loadMore": "加载更多",
        "memory.explorer.count": "共 {n} 条",
        "memory.explorer.empty": "暂无记忆条目",
        "memory.explorer.source": "来源",
        "memory.explorer.created": "创建",
        "memory.explorer.updated": "更新",
        "memory.explorer.tags": "标签",
        "memory.explorer.preference": "偏好权重",
        "memory.explorer.importance": "重要性",
        "memory.explorer.heat": "热度",
        "memory.explorer.heatSort": "热度优先",
        "memory.explorer.heatSortHint": "对已加载条目按热度降序（页内排序，非全局序；时间树保持时间序）",
        "memory.explorer.filterDeposited": "沉淀",
        "memory.explorer.filterDepositedHint": "只看 autoDream 巩固/更新过的记忆",
        "memory.explorer.filterArchived": "已归档",
        "memory.explorer.filterArchivedHint": "只看已归档的记忆（默认列表不含它们）",
        "memory.explorer.topK": "返回数量",
        "memory.explorer.topKOption": "返回 {n} 条",
        "memory.card.open": "在记忆库中查看全文",
        "memory.time.now": "刚刚",
        "memory.time.seconds": "{n}秒前",
        "memory.time.minutes": "{n}分钟前",
        "memory.time.hours": "{n}小时前",
        "memory.time.days": "{n}天前",
        "memory.graph.title": "记忆图谱",
        "memory.graph.aria": "记忆图谱",
        "memory.graph.placeholder": "输入实体名，查看关联网络…",
        "memory.graph.depth": "跳数",
        "memory.graph.empty": "图谱待积累：随对话记忆的沉淀，实体与关系会自动进入图谱",
        "memory.graph.notFound": "未找到该实体",
        "memory.graph.related": "关联记忆",
        "memory.graph.relation": "关系",
        "memory.graph.sourceMemory": "查看来源记忆",
        "memory.graph.sourceLoading": "正在读取来源记忆…",
        "memory.graph.sourceDenied": "无权读取这条来源记忆。",
        "memory.graph.sourceMissing": "来源记忆已不存在。",
        "memory.graph.sourceError": "来源记忆读取失败，请稍后重试。",
        "memory.graph.hint": "拖拽节点调整布局 · 空白处拖动平移 · 滚轮缩放",
        "memory.graph.resetView": "重置视图",
        "memory.graph.summary": "实体关系图：{entity} 及其 {nodes} 个节点、{edges} 条关系",
        "memory.graph.viewInGraph": "在实体视图中打开",
        "memory.graph.loading": "加载中…",
        "memory.graph.distance": "距中心 {n} 跳",
        "memory.settings.vectorTitle": "向量搜索",
        "memory.settings.vectorHint": "搜索不再只认字面：接入任意 OpenAI 兼容的 embedding 接口后，意思相近的记忆也能被召回。",
        "memory.settings.vectorEnabled": "启用向量搜索",
        "memory.settings.vectorBaseUrl": "API 地址 (Base URL)",
        "memory.settings.vectorApiKey": "API Key",
        "memory.settings.vectorModel": "模型名",
        "memory.settings.vectorSave": "保存配置",
        "memory.settings.vectorSaved": "配置已保存",
        "memory.settings.vectorReindex": "重建索引",
        "memory.settings.vectorReindexing": "索引中…",
        "memory.settings.vectorReindexDone": "已索引 {n} 条",
        "memory.settings.apiTokenTitle": "API Token（可选）",
        "memory.settings.apiTokenHint": "这里只把 Token 存在当前浏览器（localStorage），供面板请求携带；服务端的锁是插件配置里的 apiToken，两边填同一个值才真正上锁。只填这里不改服务端 = 没上锁。",
        "memory.settings.apiTokenPlaceholder": "与插件配置的 apiToken 保持一致",
        "memory.settings.apiTokenSave": "保存 Token",
        "memory.settings.apiTokenSaved": "Token 已保存",
        "memory.settings.feedback.title": "意见与反馈",
        "memory.settings.feedback.desc": "遇到问题？直接告诉我们，或先看看有没有人遇到过：",
        "memory.settings.feedback.newIssue": "在 GitHub 上反馈问题",
        "memory.settings.feedback.newIssue.sub": "自动带上插件版本与环境信息",
        "memory.settings.feedback.email": "邮件反馈",
        "memory.settings.feedback.email.sub": "work@modusensus.space",
        "memory.settings.feedback.browse": "浏览已知问题",
        "memory.settings.feedback.browse.sub": "先搜搜，省一份重复 issue",
        "memory.settings.feedback.hint": "反馈前先搜搜是否已有相同问题，能省一份重复的 issue～",
        "memory.settings.update.check": "检测更新",
        "memory.settings.update.latest": "已是最新版本 ✓",
        "memory.settings.update.ahead": "当前版本比 registry 还新（本地开发版）",
        "memory.settings.update.error": "检测失败：稍后再试",
        // 检测更新点出的第三种结果（发现新版本）；横幅形态已删，它现在只是
        // 按需那一行的文案，占位 {v}/{c} 由 checkResultText 填。
        "memory.settings.version.outdated": "有新版本 {v}（当前运行 {c}）",
        "memory.settings.version.outdatedHint": "若安装时指定过版本号，常规升级不会跨大/小版本（pnpm 钉子）——请重新安装或在升级命令加 --latest；npm 已发布而市场暂未收录属正常（约 1 天延迟）。",
        "memory.settings.star": "给项目点个 Star",
        "memory.settings.star.sub": "它对你是好用的，就鼓励一下作者吧 (●'◡'●)",
        "memory.settings.mode.title": "运行模式",
        "memory.settings.mode.desc": "轻量模式只保留核心能力：记忆读写、自动注入、热记忆；巩固、实体抽取、语义搜索等全部关闭，适合低配机器或只想「记住偏好」的场景。标准模式开启全部功能。",
        "memory.settings.mode.light": "轻量",
        "memory.settings.mode.standard": "标准",
        "memory.settings.mode.savedHint": "已保存，重启 DSH 后生效",
        "memory.settings.mode.offList": "已关闭：巩固（autoDream）· 实体抽取 · 语义搜索",
        "memory.settings.extapi.title": "外部访问 API",
        "memory.settings.extapi.desc": "开放一个本机接口，让其他工具（插件、命令行、桌面应用）也能读写这份记忆库，默认只允许本机连接。改动保存后重启 DSH 生效。",
        "memory.settings.extapi.enabled": "启用",
        "memory.settings.extapi.disabled": "停用",
        "memory.settings.extapi.address": "地址",
        "memory.settings.extapi.port": "端口",
        "memory.settings.extapi.token": "Token",
        "memory.settings.extapi.copy": "复制",
        "memory.settings.extapi.copied": "已复制",
        "memory.settings.serve.title": "独立服务 dsh-mneme-serve",
        "memory.settings.serve.desc": "不启动 DSH 也能以 HTTP 方式访问同一份记忆库（无 LLM 数据面）。",
        "memory.settings.serve.cmd": "npx -p @fg-lab/amadeus-memory dsh-mneme-serve --memory-dir <记忆库目录> --port <端口>",
        "memory.settings.serve.copy": "复制",
        "memory.settings.serve.copied": "已复制",
        "memory.settings.serve.hint": "与「外部访问 API」同源：同一套路由与鉴权，指向同一记忆库目录时，调用方应使用面板这张令牌（通常有效，非承诺）。两者默认抢同一端口，二选一或用 --port 错开。",
        "memory.settings.mcp.title": "MCP 服务 dsh-mneme-mcp",
        "memory.settings.mcp.desc": "stdio MCP 服务器：任何 MCP 客户端（Claude Code / Cursor 等）挂载后，即可获得与 DSH 内一致的记忆工具六件套。",
        "memory.settings.mcp.snippet": "{ \"mcpServers\": { \"dsh-mneme\": { \"command\": \"dsh-mneme-mcp\", \"env\": { \"DSH_MNEME_TOKEN\": \"<外部访问 API 的 token>\" } } } }",
        "memory.settings.mcp.copy": "复制",
        "memory.settings.mcp.copied": "已复制",
        "memory.settings.mcp.hint": "数据面走「外部访问 API」（默认 127.0.0.1:8790，Bearer），token 就是上面那张；可用 DSH_MNEME_URL / DSH_MNEME_TOKEN 环境变量或 ~/.dsh-mneme/cli.json 覆盖。command 需在 PATH 上（随 @fg-lab/amadeus-memory 安装自带）。",
        "memory.settings.extapi.savedHint": "已保存，重启 DSH 后生效",
        "memory.settings.extapi.invalidPort": "端口需为 1-65535 的数字",
        "memory.tab.rejected_solution": "被否决方案",
        "memory.tab.pitfall": "踩坑记录",
        "memory.tab.constraint": "工程约束",
        "memory.tab.document": "文档",
        "memory.features.title": "功能开关",
        "memory.features.desc": "控制插件在后台做哪些事。先看「常用」里的总开关就够了，其余项收在「全部设置」里。改动即时保存，重启 DSH 后生效。",
        // Issue #427：分组原先按「实现」分（基础/检索与增强/巩固与睡眠/多会话隔离
        // 是架构图的分区），而人真正会问的是四个问题：它会记住什么、它什么时候
        // 写进去、它怎么用回来、不同会话会不会串。组名改成人话，术语留在 hint。
        // group.basic 是首屏层：新用户不读文档就该答得出「会不会自动记」；
        // 「别的会话能不能看到」由同在首屏的 scope 组回答。
        "memory.features.group.basic": "常用（先动这几个）",
        "memory.features.group.core": "它会记住什么",
        // group.mo 是 v0.9.0 新增的独立分组（座位闸门，不是行为开关）；渲染
        // 走 t(`memory.features.${g.key}`)，缺这行会把键名直接写上屏。
        "memory.features.group.mo": "它的工作流（M.O.）",
        "memory.features.group.enhance": "它什么时候写进去",
        "memory.features.group.dream": "它怎么用回来",
        "memory.features.group.scope": "不同会话之间",
        "memory.features.group.scene": "场景、近期与核心记忆",
        "memory.features.sceneGuide": "QQ 记忆要同时打开下面两个开关：场景隔离记录可信场景归属，严格 QQ 模式才允许 QQ 会话使用长期记忆；只开一个都会拒绝 QQ 模型访问。升级旧库前先停写并整体复制旧 memoryDir 到一个新的隔离目录，确认新实例能读到数据再停用旧库；不要原地复用或让两个实例同时写同一份 memory.db。",
        "memory.features.sceneIsolationEnabled": "按 QQ 场景隔离记忆",
        "memory.features.sceneIsolationEnabled.hint": "开：记录并过滤可信 Host 的场景归属；只开这一项还不足以让 QQ 会话使用长期记忆，还需打开严格 QQ 场景模式",
        "memory.features.sceneStrictQQ": "严格 QQ 场景模式",
        "memory.features.sceneStrictQQ.hint": "开：跨场景普通记忆、图谱和普通 HTTP 内容接口全部拒绝；autoDream 与 Sleep 暂停，可信 QQ Session 的自动摘要仍可运行。必须与场景隔离同时打开。默认关",
        "memory.features.recentContextEnabled": "近期上下文（10 分钟）",
        "memory.features.recentContextEnabled.hint": "开：在内存中保留有限近期事件，仅在授权方向注入；不调用嵌入/模型，不写长期记忆",
        "memory.features.coreMemoryEnabled": "核心记忆（受保护）",
        "memory.features.coreMemoryEnabled.hint": "开：允许授权管理员私聊保存受保护核心记忆；保护不等于重要度，普通维护不能删除或覆盖",
        "memory.features.group.advanced": "高级",
        // 「全部设置」= 第一层折叠（issue #427 建议 1），常显只留 basic + scope
        // 两组；「高级」是它内部的第二层（进阶 7 项）。
        "memory.features.allToggle": "全部设置",
        "memory.features.advancedToggle": "更少用的 7 个开关",
        "memory.features.restartHint": "重启 DSH 后生效",
        "memory.features.loadFailed": "加载失败",
        "memory.features.saveFailed": "保存失败",
        // Issue #427 建议 2：条目名给「打开会怎样、关掉会怎样」，术语放末尾。
        // 括号里的英文是设置项键名，末尾的「（BM25）」才是术语。
        "memory.features.autoInject": "自动带上旧记忆（每轮都用）",
        "memory.features.autoInject.hint": "开：每轮自动挑相关记忆塞给 Agent，它不用问就能想起；关：Agent 得自己调用查记忆的工具",
        "memory.features.injectGuidanceEnabled": "顺带教 Agent 怎么用记忆",
        "memory.features.injectGuidanceEnabled.hint": "开：在记忆工具的说明里写清什么时候该查、什么时候该写；关：只给工具不给用法",
        "memory.features.continuityRescueEnabled": "长对话被压缩前先存一份快照",
        "memory.features.continuityRescueEnabled.hint": "开：压缩前先存「正在做什么 / 下一步 / 未决问题」，关键上下文活过压缩；关：压缩可能把它压掉",
        "memory.features.parentOff": "上一项关闭时不生效",
        // 「默认 / 已改」徽标：overrides 里没有这个键 = 值来自 config schema 的
        // 默认值，一条命令就能退回。徽标让这件事不必去读配置文件才成立。
        "memory.features.tagDefault": "默认",
        "memory.features.tagDefault.hint": "这一项用的是出厂默认值，没有被你改过",
        "memory.features.tagChanged": "已改",
        "memory.features.tagChanged.hint": "你改过这一项，它不再用默认值",
        // 「待重启」是第三态，不是「已改」的加强版：#481 之前面板只有「已改」，
        // 用户改完总闸看到徽标亮起就以为生效了，实际运行时还在用启动时的旧值。
        "memory.features.tagPending": "待重启",
        "memory.features.tagPending.hint": "这一项已存进配置，但本次启动还没用上——重启 DSH（或在插件管理里关开一次本插件）后才生效",
        "memory.features.pendingRestartNotice": "有改动还没生效：标着「待重启」的开关要等重启 DSH 后才起作用（在插件管理里把本插件关开一次也行）。",
        "memory.features.autoSummarize": "自动把对话记下来（自动注入之外）",
        "memory.features.autoSummarize.hint": "开：对话结束自动提炼成长期记忆条目（autoSummarize）；关：只有你手动存或 Agent 主动存才有记忆",
        "memory.features.hotMemoryEnabled": "顺带带上最近几轮原话",
        "memory.features.hotMemoryEnabled.hint": "开：注入时把最近几轮的对话原文一并带上，Agent 眼前就是刚才聊的内容；关：只带提炼后的长期记忆。这几轮原文不会写进长期记忆（热记忆，默认开）",
        "memory.features.injectTimePrefix": "会话开头告诉它今天几号",
        "memory.features.injectTimePrefix.hint": "开：每个新会话的第一轮注入一次日期与星期，「今天」「上周」这类说法更稳；关：注入里不带时间（时间前缀，默认关）",
        "memory.features.entityExtractionEnabled": "顺手抽出人名、项目和概念",
        "memory.features.entityExtractionEnabled.hint": "开：每条新记忆里抽出人物/项目/概念，关系图谱自己长起来，也能按「谁」找记忆；关：只存整条记忆，不建关系（实体抽取，默认关）",
        "memory.features.memoryPreferenceEnabled": "偏好权重参与检索",
        "memory.features.memoryPreferenceEnabled.hint": "开：标签权重与规范实体权重以 0.6–1.6 的温和乘数参与召回（先过相关度下限），只影响排序，不改自动重要性；关（默认）：检索与改动前一致。",
        "memory.features.trustedIntakeEnabled": "受信经历写入接口",
        "memory.features.trustedIntakeEnabled.hint": "开：允许 Life 通过 POST /intake 携带来源、参与者与完成状态写入共同经历；需要服务端配置 apiToken，缺省关闭。不会让模型从闲聊里猜「做过」。",
        "memory.features.entityExtractionProvider": "实体抽取 Provider",
        "memory.features.entityExtractionModel": "实体抽取模型",
        "memory.features.entityExtractionReasoning": "实体抽取思考强度",
        "memory.features.entityExtractionReasoning.none": "跟随默认",
        "memory.features.entityExtractionReasoning.low": "低",
        "memory.features.entityExtractionReasoning.medium": "中",
        "memory.features.entityExtractionReasoning.high": "高",
        "memory.features.summarizeReasoningEffort": "蒸馏思考强度",
        "memory.features.summarizeReasoningEffort.off": "关闭思考",
        "memory.features.summarizeReasoningEffort.none": "跟随默认",
        "memory.features.summarizeReasoningEffort.low": "低",
        "memory.features.summarizeReasoningEffort.medium": "中",
        "memory.features.summarizeReasoningEffort.high": "高",
        "memory.features.summarizeReasoningEffort.hint": "思考型模型建议选「低」或「关闭思考」，避免推理占满输出导致总结失败",
        "memory.features.entityExtractionModelHint": "Provider / 模型留空 = 跟随主对话模型；思考强度选「跟随默认」= 服务商默认",
        "memory.features.codingRetrospect": "写代码的过程也记下来",
        "memory.features.codingRetrospect.hint": "开：整段编码过程（含报错与工具调用）一并回顾，沉淀踩坑、约束和被否决的方案；关：只提炼对话内容（编码记忆蒸馏，默认关）",
        "memory.features.rerankEnabled": "搜出来的结果再精排一遍",
        "memory.features.rerankEnabled.hint": "开：本地重排模型给召回结果重新打分，更准但更慢；关：直接用检索时的排序（结果重排，默认关）",
        "memory.features.heatEnabled": "越久没用越靠后（像会忘）",
        "memory.features.heatEnabled.hint": "开：像遗忘曲线一样给记忆降温，长期没用过的往后排、不占注入名额；关：一直按相关度排（热度衰减，默认关）",
        "memory.features.documentMemoryEnabled": "长文档只存一张摘要卡",
        "memory.features.documentMemoryEnabled.hint": "开：Agent 写的长文档在记忆里只放「摘要卡」，正文仍由 Agent 保管、按需读取，注入只带摘要；关：整篇都往上下文里带（document 型记忆，默认关）",
        // --- v0.9.0 M.O.（Modus Operandi，beta）---
        // M.O. = Modus Operandi，拉丁语「一个人一贯的做事方式」；也是 org 词根
        // modus（modusensus）。界面主显示 M.O.，设置项 hint 第一句给全名。
        "memory.actions.beta": "beta",
        "memory.actions.notice": "提炼结果是候选，可能有错、过时、会被推翻。",
        "memory.actions.title": "M.O. · 工作流",
        "memory.actions.open": "打开 M.O.",
        "memory.actions.viewFull": "完整视图",
        "memory.actions.openPane": "在右栏打开完整视图",
        "memory.actions.announce.open": "M.O. 面板已打开",
        "memory.actions.announce.close": "M.O. 面板已关闭",
        "memory.actions.close": "关闭",
        "memory.actions.candidates": "候选 {n} 条",
        "memory.actions.runs": "最近运行",
        "memory.actions.runOf": "运行 {n}",
        "memory.actions.run.ok": "成功",
        "memory.actions.run.failed": "失败",
        "memory.actions.run.refuted": "被推翻",
        "memory.actions.state.candidate": "候选",
        "memory.actions.state.trusted": "可信",
        "memory.actions.state.stale": "过时",
        "memory.actions.state.refuted": "被推翻",
        "memory.actions.gate.has": "有闸门证据",
        "memory.actions.gate.none": "还没闸门",
        "memory.actions.gate.tag": "闸",
        "memory.actions.who.main": "主",
        "memory.actions.who.human": "人",
        "memory.actions.who.ci": "CI",
        "memory.actions.ov.done": "完成判据",
        "memory.actions.ov.trigger": "何时触发",
        "memory.actions.band.count": "{n} 步",
        "memory.actions.legend.states": "状态",
        "memory.actions.detail.situation": "情形",
        "memory.actions.detail.action": "动作",
        "memory.actions.detail.why": "为什么",
        "memory.actions.detail.cf": "反事实",
        "memory.actions.detail.noCf": "该节点还没有反事实记录",
        "memory.actions.detail.source": "来源记忆",
        "memory.actions.credit": "复用",
        "memory.actions.creditValue": "{n} 次 · 上次 {d} 天前",
        "memory.actions.dep": "依赖",
        "memory.actions.zoom.value": "缩放 {n}%",
        "memory.actions.zoom.in": "放大",
        "memory.actions.zoom.out": "缩小",
        "memory.actions.zoom.fit": "适应宽度",
        "memory.actions.zoom.hint": "Ctrl/⌘ + 滚轮也能缩放",
        // 缩放百分比指示（{n} 由画布工具条填）；基线 4568614 起就缺这两行，
        // 工具条上会直接显示键名。
        "memory.actions.list.heading": "这个项目里的工作流",
        "memory.actions.list.count": "工作流 {n} 条",
        "memory.actions.list.meta": "{steps} 步 · {gates} 道闸门 · 反事实 {cf}/{steps}",
        "memory.actions.scope.project": "项目 {name}",
        "memory.actions.scope.global": "全局",
        "memory.actions.scope.none": "项目未知",
        "memory.actions.broken": "有文件读不出来：",
        "memory.actions.empty.title": "这个项目里还没有工作流",
        "memory.actions.empty.body": "工作流的本体住在项目里的 .mneme/pipelines/ 下——跟着仓库走，能被提交、能被 review、能被 CI 读。做法被复用第二次才算节点类型，第一次只是实例；同一路径被走通两次之后，它才会从会话里被提炼出来、落到那个目录里。",
        "memory.actions.distill.action": "现在沉淀一次",
        "memory.actions.distill.busy": "正在读会话…",
        "memory.actions.distill.hint": "看一遍这个项目自己的会话日志，把反复走通的动作挖成提议。只写提议，不落草稿、不改仓库。",
        "memory.actions.distill.noProject": "读不到会话的工作目录，所以不知道该看哪个项目的日志",
        "memory.actions.distill.saved": "已提出 {n} 条提议（本次挖到 {m} 条候选）",
        "memory.actions.distill.none": "这一遍没挖到新的重复动作",
        "memory.actions.distill.noSessions": "这个项目还没有自己的会话日志，先攒几轮再来",
        "memory.actions.distill.unreadable": "会话日志读不出来（这是环境问题，不是「没有重复动作」）",
        "memory.actions.distill.failed": "这一遍没跑完，详见插件日志",
        "memory.actions.noRuns": "这一条还没有运行记录，所以每个节点都还是候选。",
        "memory.actions.settle.title": "本次运行",
        "memory.actions.settle.line": "「{title}」",
        "memory.actions.settle.used": "本次复用 {n} 条做法（勾选为被用上）",
        "memory.actions.settle.refutedWarn": "本次路径里有已被推翻的节点，结果仅供参考",
        "memory.features.actionPipelineEnabled": "M.O.（beta）",
        "memory.features.actionPipelineEnabled.hint": "只读视图：把真实会话里反复走通的动作连成一张图谱——会话头图标、右栏完整视图、每次运行的结算卡。看 ≠ 写：沉淀由「M.O. 自动沉淀」单独开，执行记账由 /mo-run 单独开。Modus Operandi（工作流）。重启 DSH 后生效",
        "memory.features.actionNudgeEnabled": "自动沉淀工作流（beta）",
        "memory.features.actionNudgeEnabled.hint": "开：每轮结束后看一眼这个项目自己的会话日志，把反复走通的动作挖成记忆库里的一条「提议」，等你确认才可能变成工作流。只产草稿、不自动启用、不往仓库里塞文件。挂热路径且要解压日志，轻量档会强制关掉。重启 DSH 后生效",
        "memory.features.resilientModelDownload": "模型下载断了能续上",
        "memory.features.resilientModelDownload.hint": "开：下载中断后从断点续传并自动重试；关：中断就整份重来（断点续传，默认开）",
        "memory.features.searchSemanticDedup": "搜到意思相同的只留一条",
        "memory.features.searchSemanticDedup.hint": "开：检索结果里意思相近的条目合并成一条，少占名额；关：同义条目一起出现（语义去重，默认关）",
        "memory.features.autoDream": "后台自动整理记忆（合并 · 去重）",
        "memory.features.autoDream.hint": "开：后台自动合并、沉淀碎片记忆（autoDream）；关：记忆只增不减，越用越散",
        "memory.features.sleepModeEnabled": "你不在的时候它整理记忆",
        "memory.features.sleepModeEnabled.hint": "开：空闲时段做分层压缩与整理，白天少打扰；关：只有你手动触发的整理（睡眠模式，默认关）",
        // #427 建议 5：hybridInject / selectiveInjectEnabled / adaptiveThresholdEnabled
        // 是同一件事「带什么回来」的三档，相邻摆放并在 hint 里点明，不再摊成
        // 三个不相干的并列开关。
        "memory.features.hybridInject": "关键词 + 意思 两路一起找",
        "memory.features.hybridInject.hint": "开：两路检索各取一批再合并，召回更全；关：只用一路。「带什么回来」共三档（混合注入 / 选择性注入 / 自适应阈值），可只开其中一档（混合注入，默认开）",
        "memory.features.selectiveInjectEnabled": "只带真正相关的记忆",
        "memory.features.selectiveInjectEnabled.hint": "开：按相关性筛一遍再注入，上下文更干净；关：带出去的更多也更杂。三档之一（选择性注入，默认开）",
        "memory.features.adaptiveThresholdEnabled": "按检索质量自动调松紧",
        "memory.features.adaptiveThresholdEnabled.hint": "开：召回质量差时放宽门槛、好时收紧；关：门槛固定。三档之一（自适应阈值，默认开）",
        "memory.features.reflectionUpdateEnabled": "整理时允许改已有记忆",
        "memory.features.reflectionUpdateEnabled.hint": "开：巩固可以改写、合并已有条目，不是只增不改；关：旧记忆永不被自动改动（反思更新，默认开）",
        "memory.features.distill": "蒸馏与限流",
        "memory.features.distillRateLimitIntervalMs": "蒸馏放行间隔 (ms)",
        "memory.features.distillRateLimitRetries": "429 重试次数",
        "memory.features.distillRateLimitBaseDelayMs": "退避起始延迟 (ms)",
        "memory.features.distillMaxChars": "转录截断上限（字符）",
        // #399 的两个留存键。此前只有后端白名单、面板够不着，而
        // docs/CONFIGURATION.md 写的是「面板可启停」——补 UI 让文档成真。
        // hint 必须写清两件事：这是**原始对话**落盘（隐私面），以及天数只管
        // 启动期裁剪（reclaim 走另一条 --older-than，不读这个键）。
        "memory.features.distillRecords.enabled": "留存蒸馏原文",
        "memory.features.distillRecords.enabled.hint": "蒸馏时把窗口内的公开对话原文一并落盘，并记下每条记忆的来源区间；私密推理与工具结果不落。关 = 一行不写、连收集都不做",
        "memory.features.distillRecords.retentionDays": "原文保留天数",
        "memory.features.distillRecords.retentionDays.hint": "1–3650 天；只管启动期裁剪。想让 reclaim 也按这个天数回收，需显式传 --older-than 同一数值",
        "memory.features.codingBoostFactor": "编码记忆加权",
        "memory.features.memoryQualityFilter.enabled": "没价值的记忆自动收起来",
        "memory.features.memoryQualityFilter.enabled.hint": "开：低价值条目自动归档、注入时按质量降权；关：什么都留着，噪声也一起带（记忆质量过滤，默认开）",
        "memory.features.llmAudit.enabled": "记下后台用了多少模型调用",
        "memory.features.llmAudit.enabled.hint": "开：巩固/总结的后台调用与 token 消耗都有账可查；关：后台开销无从核对（调用审计，默认开）",
        // #254：写入准入两层。检测关时整条路径不碰；检测开、拦截关 = 仅告警 +
        // 留审计；两个都开才真拦。文案要写清「只留审计」与「真拦下」的区别，
        // 否则操作者会以为打开检测就已经在拦。
        "memory.features.writeAdmission.enabled": "写入前先判一下是不是废话（只记不拦）",
        "memory.features.writeAdmission.enabled.hint": "开：空白/噪声写入判为命中并留一条审计记录，但仍存进去；关：完全不判。要真拦，见下一项（写入准入判定，默认关）",
        "memory.features.writeAdmission.enforce": "真把没用的写入挡下来",
        "memory.features.writeAdmission.enforce.hint": "开：命中直接拒绝写入；关：只留审计、照存不误。需先打开上面那项判定（写入准入拦截，默认关）",
        "memory.features.preInjectGate.enabled": "注入前先筛掉「只是我的看法」的记忆（只记不拦）",
        "memory.features.preInjectGate.enabled.hint": "开：注入前判出意见/立场类记忆并留审计，先观察分布；关：照常注入（注入前判定，默认关）",
        "memory.features.preInjectGate.enforce": "注入时真滤掉判定不合适的",
        "memory.features.preInjectGate.enforce.hint": "开：命中的候选在注入时丢掉；关：只留审计、照常注入。需先打开上面那项判定（注入前判定拦截，默认关）",
        // #164 A2：密钥/PII 判据自己的闸。文案要写清它管的是哪一批判据（与上面的
        // 空白/噪声分开）、它跑在「写入准入判定」里面（那一项关着就不跑），以及
        // 「开着也不拦」——拦是上面那项的事。
        "memory.features.sensitiveScanEnabled": "写入前扫一遍密钥和个人信息",
        "memory.features.sensitiveScanEnabled.hint": "开：在写入准入判定里面扫密钥/个人信息，命中只留审计；要真拦，再打开「写入准入拦截」。判定关着时它不跑（密钥/PII 扫描，默认关）",
        "memory.features.bm25SearchEnabled": "也用关键词方式找记忆",
        "memory.features.bm25SearchEnabled.hint": "开：多一个字少一个字也搜得到，专名、报错码、路径更易命中，与「按意思找」互补；关：只按语义相近度（BM25 关键词检索，默认开）",
        "memory.features.conflictFreezeEnabled": "互相矛盾的记忆先冻结",
        "memory.features.conflictFreezeEnabled.hint": "开：整理发现矛盾时先冻结待你确认，不让两条同时生效；关：两边都照用（冲突冻结，默认关）",
        "memory.features.scopeEnabled": "记住每条记忆来自哪个会话",
        "memory.features.scopeEnabled.hint": "开：每条新记忆标上来自哪个 Agent / 工作区，别的会话能不能看到由它说了算；关：新记忆不带来源，所有会话共用一批记忆（作用域标注，默认关）",
        "memory.features.strictScope": "别人设为私有的记忆我看不见",
        "memory.features.strictScope.hint": "开：其他会话明确标私有的记忆对你彻底不可见；关：仍可见、只是排到后面。要彻底隔离请用条目的「敏感度」字段。需先打开上面那项标注（严格隔离，默认关）",
        "memory.features.trustEpistemicWeighting": "按来源可信度调排序",
        "memory.features.trustEpistemicWeighting.hint": "开：可信度高的来源排前面；关：一视同仁（可信度加权，实验性，默认关）",
        "memory.features.reflectionFailureTracking": "整理失败时留下案例",
        "memory.features.reflectionFailureTracking.hint": "开：把失败原因与案例记下来供诊断改进；关：失败不留记录（失败追踪，默认开）",
        "memory.features.embedRoute": "语义检索路线",
        "memory.features.embedProvider": "Embedding 提供方",
        "memory.features.embedProvider.openai": "OpenAI 兼容接口",
        "memory.features.embedProvider.local": "本地模型（离线）",
        "memory.features.embedProvider.ollama": "Ollama",
        "memory.features.embedProvider.openai.hint": "接口地址 / Key / 模型在「向量搜索」卡片配置",
        "memory.features.embedProvider.local.hint": "首次使用会下载模型，之后完全离线",
        "memory.features.embedProvider.ollama.hint": "需要本机 Ollama 服务在运行",
        "memory.features.localEmbedModel": "本地 embedding 模型",
        "memory.features.ollamaBaseUrl": "Ollama 服务地址",
        "memory.features.ollamaModel": "Ollama 模型名",
        "memory.features.dreamProvider": "巩固模型 Provider",
        "memory.features.dreamModel": "巩固用模型名",
        "memory.features.dreamModelHint": "留空 = 跟随主对话模型；只影响记忆巩固（autoDream）用的模型",
        "memory.features.dreamPeakHours": "高峰时段（不做梦）",
        "memory.features.dreamPeakHours.hint": "设置忙碌时段，巩固会避开这些时间、事后补跑。写法：09:00-18:00，多段用逗号分隔，可带星期（如 mon-fri 08:00-12:00），支持跨零点；留空 = 不限制",
        "memory.features.summarizePeakHours": "高峰时段（不蒸馏）",
        "memory.features.summarizePeakHours.hint": "与巩固侧同一份写法；蒸馏会避开这些时段，窗口先攒着、非高峰一次蒸完",
        "memory.features.sleepProvider": "睡眠 Provider",
        "memory.features.sleepModel": "睡眠模型",
        "memory.features.sleepModelHint": "留空 = 用巩固模型或当前模型；建议选非思考模型",
        // Issue #478：max_tokens 预算键。hint 写清两件事：这是「单轮输出预算」，
        // 以及服务商硬上限更小时后端会按报错自动降级重试（对齐 #478 的后端行为）。
        "memory.features.dreamMaxTokens": "巩固单轮输出上限 (max_tokens)",
        "memory.features.dreamMaxTokens.hint": "单轮巩固最多生成多少 token，256–131072。默认 131072 超过部分服务商硬上限时，后端会按报错里的上限自动降级重试",
        "memory.features.sleepMaxTokens": "睡眠单轮输出上限 (max_tokens)",
        "memory.features.sleepMaxTokens.hint": "睡眠阶段冲突/模式判断的单轮输出预算，256–131072；超上限同样自动降级",
        "memory.features.routeFollowDefault": "跟随默认路由",
        "memory.features.modelTest": "测试连通性",
        "memory.features.modelTesting": "测试中…",
        "memory.features.modelTestOk": "连通正常",
        "memory.features.modelTestFail": "测试失败",
        "memory.features.modelTestHint": "真实发起一次最小巩固调用，验证 Provider/模型连通与 effort 支持",
        "memory.features.modelTestDowngraded": "档位不被该模型接受，已去掉档位连通（与真实巩固一致）",
        "memory.features.routeStaleMark": "（不在可用列表）",
        "memory.features.routeStaleHint": "该值不在当前可用列表（常见于切换过 Provider）：请重新选择，或点「测试连通性」当场验证",
        "memory.explorer.viewCards": "卡片",
        "memory.explorer.viewTimeline": "时间线",
        "memory.explorer.viewAria": "视图切换",
        "memory.explorer.dateLabel": "时间",
        "memory.explorer.date.all": "全部时间",
        "memory.explorer.date.7d": "近 7 天",
        "memory.explorer.date.30d": "近 30 天",
        "memory.explorer.date.90d": "近 90 天",
        "memory.explorer.more": "更多操作",
        "memory.explorer.exportJson": "导出 JSON",
        "memory.explorer.exportMarkdown": "导出 Markdown",
        "memory.explorer.importMd": "导入 Markdown 镜像…",
        "memory.explorer.importTitle": "导入 Markdown 镜像",
        "memory.explorer.importHint": "选择一个镜像类型的 Markdown 文件，解析其中的人工编辑并合并进记忆库。",
        "memory.explorer.importType": "镜像类型",
        "memory.explorer.importPick": "选择文件…",
        "memory.explorer.importConfirm": "导入",
        "memory.explorer.importCancel": "取消",
        "memory.explorer.importing": "导入中…",
        "memory.explorer.imported": "已合并 {n} 条编辑",
        "memory.explorer.importFailed": "导入失败",
        "memory.explorer.importNoFile": "请先选择文件",
        "memory.explorer.newMemory": "新增记忆…",
        "memory.explorer.newTitle": "新增记忆",
        "memory.explorer.newHint": "手动写一条记忆。同类型同标题会并入既有条目，而不是长出第二行。",
        "memory.explorer.newType": "类型",
        "memory.explorer.newTitlePlaceholder": "短标题，也是去重键",
        "memory.explorer.newContentPlaceholder": "正文",
        "memory.explorer.newTagsPlaceholder": "标签，逗号分隔（可留空）",
        "memory.explorer.newConfirm": "新建",
        "memory.explorer.newSaving": "保存中…",
        "memory.explorer.newCreated": "已新建",
        "memory.explorer.newMerged": "已并入同标题的既有条目",
        "memory.explorer.newFailed": "新建失败",
        "memory.explorer.newNoTitle": "请先填写标题",
        "memory.explorer.newNoContent": "请先填写内容",
        "memory.explorer.exportFailed": "导出失败",
        "memory.explorer.conflictBadge": "冲突",
        "memory.explorer.archivedBadge": "已归档",
        "memory.explorer.scopeBadge": "作用域",
        "memory.explorer.detail.agentScope": "Agent 作用域",
        "memory.explorer.detail.workspaceScope": "工作区作用域",
        "memory.explorer.detail.scopeGlobal": "全局（所有会话可见）",
        "memory.explorer.detail.scopeSourceAuto": "自动",
        "memory.explorer.detail.scopeSourceExplicit": "显式",
        "memory.explorer.detail.scopeEditHint": "留空 = 全局；也可填写具体标签收窄归属",
        "memory.explorer.detail.scopeWidenConfirm": "确认放宽可见性？",
        "memory.explorer.detail.scopeWidenHint": "放宽后该记忆将对所有会话可见",
        "memory.explorer.detail.sensitivity": "敏感度",
        "memory.explorer.detail.occurred": "发生时间",
        "memory.explorer.detail.edit": "编辑",
        "memory.explorer.detail.save": "保存",
        "memory.explorer.detail.cancel": "取消",
        "memory.explorer.detail.archive": "归档",
        "memory.explorer.detail.restore": "恢复",
        "memory.explorer.detail.restored": "已恢复到主列表",
        "memory.explorer.detail.archived": "已归档",
        "memory.explorer.detail.archiveFailed": "操作失败",
        "memory.explorer.detail.saved": "已保存，镜像同步更新",
        "memory.explorer.detail.quality": "质量分",
        "memory.explorer.detail.entities": "关联实体",
        "memory.explorer.detail.entitiesEmpty": "开启实体抽取后，相关人物/项目会出现在这里",
        "memory.explorer.detail.closeAria": "关闭详情",
        "memory.explorer.detail.editTitle": "标题",
        "memory.explorer.detail.editContent": "内容",
        "memory.explorer.detail.editImportance": "重要性",
        "memory.explorer.detail.starLabel": "设为 {n} 星",
        "memory.status.dream": "最近巩固",
        "memory.status.dreamNever": "尚未运行",
        "memory.status.conflicts": "待确认冲突",
        "memory.status.conflictsHint": "冻结的矛盾记忆，等待人工确认",
        "memory.status.injectSuppressed": "极简模式下注入按宿主设计关闭",
        "memory.status.injectSuppressedHint": "当前会话使用 minimal 预设：记忆注入 / 用户画像 / 热记忆不会送达模型（宿主设计，非插件缺陷）。切到标准模式，或在 ~/.dsh/settings.yaml 设 agent-presets.default: standard；过渡方案：把画像与规则写进 AGENTS.md",
        "memory.status.injectPreview": "注入预览",
        "memory.status.injectPreviewNone": "暂无预览——尚未发生注入（新会话或注入已关闭）",
        "memory.status.injectPreview.chars": "总体积",
        "memory.status.injectPreview.charsUnit": " 字符",
        "memory.status.injectPreview.maxItems": "注入上限",
        "memory.status.injectPreview.threshold": "相关性门槛",
        "memory.status.injectPreview.scope": "会话归属",
        "memory.status.injectPreview.query": "查询「{query}…」",
        "memory.status.injectPreview.hot": "hot memory",
        "memory.status.injectPreview.adaptiveOn": "自适应条数",
        "memory.status.injectPreview.rotated": "轮换抑制",
        "memory.status.injectPreview.empty": "本次组装未注入任何跨会话记忆（阈值或轮换过滤）",
        "memory.status.conflictQueue.reason": "原因",
        "memory.status.conflictQueue.sideA": "A 方",
        "memory.status.conflictQueue.sideB": "B 方",
        "memory.status.conflictQueue.keepA": "保留 A",
        "memory.status.conflictQueue.keepB": "保留 B",
        "memory.status.conflictQueue.markReviewed": "仅标记已处理",
        "memory.status.conflictQueue.applyHint": "确认后：保留方正文追加已否决注记，另一方归档。",
        "memory.status.conflictQueue.missing": "（该记忆已不存在）",
        "memory.status.conflictQueue.goto": "查看待确认冲突队列",
        "memory.status.conflictQueue.resolved": "已裁决：保留{name}",
        "memory.status.conflictQueue.refresh": "刷新队列",
        "memory.status.conflictQueue.refreshed": "冲突队列已刷新",
        "memory.status.conflictQueue.frozenBadge": "⏸ 冻结中",
        "memory.status.conflictQueue.frozenTitle": "冻结中：不参与注入与巩固，等你裁决",
        "memory.status.conflictQueue.similarity": "相似度",
        "memory.status.conflictQueue.diffTitle": "差异已高亮：红=删除、绿=新增",
        "memory.status.conflictQueue.diffFallback": "两段文本差异较大，请对照原文阅读",
        "memory.status.conflictQueue.expand": "展开全文",
        "memory.status.conflictQueue.collapse": "收起全文",
        "memory.status.conflictQueue.copySide": "复制本侧",
        "memory.status.conflictQueue.copiedSide": "本侧全文已复制",
        "memory.status.conflictQueue.importance": "重要度 {n}",
        "memory.status.conflictQueue.chars": "{n} 字符",
        "memory.status.conflictQueue.updated": "更新于 {time}",
        "memory.status.conflictQueue.created": "创建于 {time}",
        "memory.status.conflictQueue.emptyTitle": "暂无待确认冲突",
        "memory.status.conflictQueue.emptyBody": "当巩固发现两条互相矛盾或高度相似的记忆时，会先冻结在这里等你裁决，不会自动修改。裁决前双方都不参与注入。",
        "memory.status.conflictQueue.applyHintTitle": "确认后：保留方正文追加已否决注记，另一方归档",
        "memory.status.workbench": "工作动态",
        "memory.status.dreamConsolidate": "记忆巩固",
        "memory.status.summarize": "总结提炼",
        "memory.status.tokens": "{n} tokens",
        "memory.status.deposited": "沉淀 {n} 条记忆",
        "memory.status.failed": "失败",
        "memory.status.success": "成功",
        "memory.status.skipped": "跳过",
        "memory.status.emptyFeed": "还没有后台活动：对话结束后会自动提炼记忆",
        "memory.status.consolidated": "沉淀的记忆",
        "memory.status.consolidatedEmpty": "autoDream / autoSummarize 沉淀的记忆会出现在这里",
        "memory.status.archivedMemories": "已归档的记忆",
        "memory.status.heatDistribution": "热度分布",
        "memory.status.heat.hot": "热门（≥66%）",
        "memory.status.heat.warm": "温热（33–66%）",
        "memory.status.heat.cold": "冷却（<33%）",
        "memory.status.heat.sample": "按最近 {sample} 条采样",
        "memory.status.recallStats": "记忆复用",
        "memory.status.recall.zombie": "僵尸记忆",
        "memory.status.recall.exempt": "豁免",
        "memory.status.recall.runs": "30 天回执",
        "memory.status.recall.top": "常被召回",
        "memory.status.recall.inject": "注入",
        "memory.status.recall.archive": "归档",
        "memory.status.recallInject": "{runs} 轮 · {count} 条 · 槽位 {fill}%",
        "memory.status.recallArchive": "{total} 行 · +{add}/天 · 可压掉 {compress}",
        "memory.status.viewAll": "查看全部",
        "memory.status.depositedCount": "沉淀的记忆（{n}）",
        "memory.status.archivedCount": "已归档的记忆（{n}）",
        "memory.status.archivedEmpty": "没有归档的记忆",
        "memory.status.restore": "恢复",
        "memory.settings.extapi.reveal": "显示",
        "memory.settings.extapi.hide": "隐藏",
        "memory.settings.extapi.maskHint": "Token 已遮蔽；「复制」可复制完整值",
        "memory.explorer.delete": "删除",
        "memory.explorer.confirmDelete": "确认删除?",
        "memory.explorer.cancel": "取消",
        "memory.explorer.deleted": "已删除",
        "memory.explorer.deleteFailed": "删除失败",
        "memory.status.memories": "记忆总数",
        "memory.status.entities": "实体",
        "memory.status.vector": "向量索引",
        "memory.status.vectorOff": "未启用",
        "memory.status.vectorInit": "初始化中",
        "memory.status.vectorInitHint": "embedder 不可达，正在重试",
        "memory.status.vectorRuntimeMissing": "缺少本地推理运行时",
        "memory.status.vectorRuntimeHint": "本地推理运行时未就绪（{status}）",
        "memory.status.vectorRuntimeCost": "本地向量化需要额外一份本地推理运行时（解包后数百 MB）。下面的按钮会优先收编本机已有的那份（同盘硬链接、不占额外空间），没有再从 npm 下载并逐个校验。也可以让 Agent 代劳，或在终端自己跑：node scripts/mneme-runtime.mjs status / adopt / verify（见 docs/LOCAL_MODEL.md）",
        "memory.runtime.title": "本地推理运行时",
        "memory.runtime.available": "已就绪",
        "memory.runtime.missing": "未就绪 —— 只有用本地嵌入（embedProvider: local）时才需要它",
        "memory.runtime.restart": "本地嵌入要重启 DSH 才会生效",
        "memory.status.vectorRuntimeReady": "运行时已就绪",
        "memory.status.vectorRuntimeReadyHint": "本地嵌入尚未初始化（进程里的 embedder 在运行时缺失时已经失败过一次）：若一直停在这里，重启 DSH 即可。",
        "memory.status.vectorRuntimeFetch": "取回本地运行时",
        "memory.status.vectorRuntimeFetchBusy": "正在取回…（先试收编，必要时下载，数千个文件，请稍候）",
        "memory.status.vectorRuntimeFetchAdopted": "已收编本机已有的运行时：{n} 个包 / {m} 个文件（{mode}）。**请重启 DSH 使本地嵌入生效。**",
        "memory.status.vectorRuntimeFetchDownloaded": "下载完成：{n} 个包 / {m} 个文件。**请重启 DSH 使本地嵌入生效**（取回不会让当前进程里的 embedder 复活）。",
        "memory.status.vectorRuntimeFetchFailed": "取回失败：{reason}",
        "memory.status.vectorIndexed": "已索引 {n} / {m} 条",
      "memory.status.vectorUnconfigured": "未配置",
      "memory.status.vectorUnconfiguredHint": "未填 embedding 端点/模型或未启用，语义召回不可用",
      "memory.status.vectorDegradedHint": "已索引 0 / {m} 条，语义召回实际不可用",
        "memory.status.mirror": "Markdown 镜像",
        "memory.status.mirror.ok": "正常",
        "memory.status.mirror.degraded": "降级",
        "memory.status.mirror.unknown": "未知",
        "memory.status.mirror.dirty": "有未落盘改动",
        "memory.status.mirror.yes": "是",
        "memory.status.mirror.lastError": "最近错误",
        "memory.status.mirror.err.noSpace": "磁盘空间不足",
        "memory.status.mirror.err.permission": "权限不足",
        "memory.status.mirror.err.syncFailed": "同步失败",
        "memory.status.mirror.lastAttempt": "上次尝试",
        "memory.status.mirror.successAt": "上次成功",
        "memory.status.mirror.foot": "记忆条目在磁盘上的 Markdown 副本同步状态",
        "memory.status.sec.overview": "库内一览",
        "memory.status.sec.engine": "后台运转",
        "memory.status.sec.maintenance": "维护",
        "memory.status.maint": "存储回收",
        "memory.status.maint.freelist": "空闲页可立刻回收",
        "memory.status.maint.plannedInputs": "待清理输入快照",
        "memory.status.maint.plannedEmbeddings": "待清理归档向量",
        "memory.status.maint.window": "保留窗口",
        "memory.status.maint.windowUnit": "天",
        "memory.status.maint.windowLabel": "保留窗口（天）",
        "memory.status.maint.reestimate": "重新估算",
        "memory.status.maint.reestimating": "估算中…",
        "memory.status.maint.stale": "窗口已改动：先点「重新估算」再执行，否则执行的是上一次估算的数字。",
        "memory.status.maint.vacuum": "同时 VACUUM",
        "memory.status.maint.vacuumHint": "VACUUM 会短暂独占数据库，期间其它读写要等待；不做也不影响清理结果。",
        "memory.status.maint.execute": "执行回收",
        "memory.status.maint.confirm": "确认执行（不可逆）",
        "memory.status.maint.running": "执行中…",
        "memory.status.maint.cancel": "取消",
        "memory.status.maint.confirmHint": "将清理 {inputs} 行输入快照与 {embeddings} 行归档向量，且不可逆。",
        "memory.status.maint.badWindow": "保留窗口要填不小于 0 的整数",
        "memory.status.maint.failed": "回收失败",
        "memory.status.maint.done": "回收已完成",
        "memory.status.maint.size": "体积（前 → 后）",
        "memory.status.maint.reclaimed": "实际释放",
        "memory.status.maint.clearedInputs": "已清理输入快照",
        "memory.status.maint.clearedEmbeddings": "已清理归档向量",
        "memory.status.maint.receipt": "审计回执",
        "memory.status.maint.receiptNone": "未记录（审计未启用或回执写入失败）",
        "memory.status.maint.duration": "耗时",
        "memory.status.maint.vacuumRan": "VACUUM 已执行",
        "memory.status.maint.vacuumOff": "未 VACUUM",
        "memory.status.maint.vacuumFailed": "VACUUM 失败",
        "memory.status.maint.vacuumFailedHint": "清理已完成且不可逆，但文件暂时不会变小；稍后重跑即可（清理是幂等的）。",
        "memory.status.sec.token": "Token 去向 · 近 7 天",
        "memory.status.token.in": "输入",
        "memory.status.token.out": "输出",
        "memory.status.token.total": "7 天 token 总量",
        "memory.status.token.calls": "调用次数",
        "memory.status.token.callsCap": "近 7 天 · 全部后台组件",
        "memory.status.token.share": "巩固占比",
        "memory.status.token.shareFoot": "dream_consolidate · {n} token",
        "memory.status.token.conflicts": "待确认冲突",
        "memory.status.token.conflictsFoot": "来自 /dream-status · 实时",
        "memory.status.token.donut": "按组件 · 谁花了这些 token",
        "memory.status.token.days": "按天 · 7 天趋势",
        "memory.status.token.heat": "8 周热力 · 每天花了多少",
        "memory.status.token.heatLess": "少",
        "memory.status.token.heatMore": "多",
        "memory.status.token.last7": "近 7 天",
        "memory.status.token.meterOnly": "（只计量）",
        "memory.status.token.detail": "详细状态卡（原「库内一览 / 后台运转」9 张，点击展开）",
        "memory.status.token.op.dream_consolidate": "记忆巩固",
        "memory.status.token.op.summarize_compress": "会话蒸馏",
        "memory.status.token.op.entity_extract": "实体抽取",
        "memory.status.token.op.dream_summarize": "总览摘要",
        "memory.status.token.op.sleep_pattern": "睡眠模式",
        "memory.status.token.op.write_admission": "写入准入",
        "memory.status.error": "加载失败"
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
        "memory.am.loading": "Loading status…",
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
        "memory.am.memory.searchPlaceholder": "Title or body…",
        "memory.am.memory.archived": "Show archived",
        "memory.am.memory.new": "New memory",
        "memory.am.memory.refresh…202152 tokens truncated…cit style binding currently references it.","modal.deleteStyleAffected.one":"1 explicit binding will fall back to inherit.","modal.deleteStyleAffected.other":"{count} explicit bindings will fall back to inherit.","modal.deleteStyleDefault":"It is also the Workspace default, so the default resets to core-only.","modal.removeBindingTitle":"Remove this explicit binding?","modal.removeBindingBody":"The target will fall back to the Workspace default ({defaultStyle}) instead of its explicit “{mode}” setting. Sessions, QQ authentication, tools, and permissions are untouched.","modal.restoreBody":"Restore the configuration captured at revision {revision} ({date})? Current configuration is replaced, but a pre-restore safety backup is written first. No DSH Session, Agent preset, tool, or permission is changed.","modal.typeRestore":"Type RESTORE to confirm","modal.restorePlaceholder":"RESTORE","toast.cannotSave":"Cannot save","toast.personaSaved":"Persona saved","toast.personaSavedDetail":"Changes take effect at the next model assembly; no Session is recreated.","toast.draftDiscarded":"Draft discarded","toast.draftDiscardedDetail":"The editor now shows the Host version.","toast.styleCopied":"Style copied","toast.styleCopiedDetail":"The copy is a new stable card. Existing bindings still reference their original style.","toast.styleDeleted":"Style deleted","toast.styleDeletedDetail.one":"1 binding fell back to inherit{defaultReset}.","toast.styleDeletedDetail.other":"{count} bindings fell back to inherit{defaultReset}.","toast.defaultResetSuffix":"; the default style was reset to core-only","toast.rollbackCommitted":"Rollback committed","toast.rollbackCommittedDetail":"The restored card is a new revision; prior history is retained.","toast.bindingSaved":"Binding saved","toast.bindingSavedDetail":"The Host revalidated the target against current membership and trust.","toast.bindingRemoved":"Binding removed","toast.bindingRemovedDetail":"This target now inherits the Workspace default.","toast.cannotSaveBinding":"Cannot save binding","toast.subagentExcluded":"Subagent Sessions are excluded from Persona.","toast.noWorkspace":"No Workspace bound","toast.bindWorkspaceFirst":"Bind a Workspace before saving a binding.","toast.selectStyle":"Select a style","toast.selectStyleDetail":"A style binding requires an existing style card.","toast.resetDraft":"Reset draft","toast.resetDraftDetail":"The draft now inherits the Workspace default. Save the binding to commit.","toast.workspaceUpdated":"Workspace updated","toast.workspaceUpdatedDetail":"{count} old bindings archived. Backup: {backup}. Core and style cards remain.","toast.defaultStyleUpdated":"Default style updated","toast.defaultStyleUpdatedDetail":"Targets that explicitly select a style are unaffected.","toast.injectionEnabled":"Injection enabled","toast.injectionDisabled":"Injection disabled","toast.injectionDetail":"Changes apply at the next model assembly; no Session is recreated.","toast.backupCreated":"Backup created","toast.backupCreatedDetail":"Backup {id} captured revision {revision}.","toast.backupCreatedFallback":"The Host wrote a validated backup.","toast.backupRestored":"Backup restored","toast.backupRestoredDetail":"A pre-restore safety backup was written first; history was retained.","toast.hostRefreshed":"Host data refreshed","toast.draftKept":"Your unsaved draft was kept.","toast.latestLoaded":"Latest Host data loaded","toast.draftKeptReview":"Your draft is preserved. Review it, then save again.","toast.conflictDraftsDiscarded":"Unsaved conflict drafts were discarded.","toast.styleNotFound":"Style not found","toast.styleNotFoundDetail":"Reload the library and try again.","toast.targetUnavailable":"Target unavailable","toast.targetUnavailableDetail":"Refresh the Host data and try again.","toast.workspaceUnavailable":"Workspace unavailable","toast.workspaceUnavailableDetail":"Refresh the Workspace list and choose a current Workspace.","toast.noChange":"No change","toast.noChangeDetail":"That Workspace is already bound.","toast.styleUnavailable":"Style unavailable","toast.styleUnavailableDetail":"Choose an existing style.","toast.confirmationRequired":"Confirmation required","toast.confirmationRequiredDetail":"Type RESTORE exactly to restore a backup.","toast.finalCheckUnavailable":"Final check unavailable","toast.hostCheckFailed":"Host check failed.","toast.backupNotFound":"Backup not found","toast.backupNotFoundDetail":"Refresh the backup list and try again.","toast.discardEditorConfirm":"Discard the unsaved draft and reload this card from the Host?","toast.discardCardConfirm":"Discard the unsaved persona draft?","toast.discardNewStyleConfirm":"Discard the current unsaved persona draft and create a new style?","toast.discardBindingConfirm":"Discard the unsaved binding draft?","toast.leaveEditorConfirm":"The persona editor has unsaved changes. Leave and keep the draft in this tab?","toast.leaveBindingConfirm":"The binding has unsaved changes. Leave and keep the draft in this tab?","toast.copySavedOnly":"The copy uses the last saved version, not unsaved edits. Continue?","toast.deleteSavedOnly":"The saved style is deleted; unsaved draft text in this editor is not included. Continue?","toast.rollbackConfirm":"Roll back this card to the selected history version? A new revision is created and the current version remains in history.","toast.bindWorkspaceConfirm":"Switch to {workspace}? The old Workspace stops receiving Persona. {count} old bindings will be backed up, then cleared from active configuration. The new Workspace begins at the next model assembly. No Sessions are deleted.","error.auth":"Owner authentication was not accepted. Open this console from an authenticated DSH settings page.","error.unavailable":"Persona management is unavailable. Check the DSH Connection service and storage health.","error.conflict":"Another authenticated window changed Persona. Reload the latest revision before retrying.","error.notFound":"The requested Persona item was not found.","error.network":"The console could not reach the DSH Host API.","error.generic":"The Persona request failed.","error.invalid":"The Host rejected the request. Check the input and try again.","error.storage":"Persona storage is unavailable. Injection fails closed.","error.method":"That operation is not allowed.","error.endpoint":"The requested Persona endpoint does not exist.","error.unreadable":"The Host returned an unreadable response (HTTP {status}).","error.requestFailed":"The request failed (HTTP {status}).","error.codeSuffix":" (code {code})","error.code.PERSONA_AUTH_REQUIRED":"Owner authentication was not accepted. Open this console from an authenticated DSH settings page.","error.code.PERSONA_MANAGEMENT_UNAVAILABLE":"Persona management is unavailable. Check the DSH Connection service.","error.code.PERSONA_CONFLICT":"Another authenticated window changed Persona. Reload the latest revision before retrying.","error.code.PERSONA_NOT_FOUND":"The requested Persona item was not found.","error.code.PERSONA_INVALID":"The Host rejected the request. Check the input and try again.","error.code.PERSONA_STORAGE_UNAVAILABLE":"Persona storage is unavailable. Injection fails closed.","error.code.PERSONA_INTERNAL":"An internal error occurred while the Host handled the Persona request. Check the Host logs.","error.code.PERSONA_ENDPOINT_UNKNOWN":"The requested Persona endpoint does not exist.","error.code.PERSONA_METHOD_NOT_ALLOWED":"That operation is not allowed.","error.code.PERSONA_WORKSPACE_UNAVAILABLE":"The Workspace registry is unavailable. Check the DSH Host.","error.code.PERSONA_QQ_UNAVAILABLE":"The QQ Host mapping is unavailable. Check the QQ plugin.","validate.noCard":"No card is selected.","validate.styleNameRequired":"Style name is required.","validate.styleNameTooLong":"Style name is too long.","validate.styleDescriptionTooLong":"Style description is too long.","validate.styleBodyRequired":"Style body is required.","validate.styleBodyTooLong":"Style body exceeds the Host limit.","validate.color":"Color must be a #rrggbb value.","validate.coreBodyTooLong":"Core body exceeds the Host limit.","panel.sectionLabel":"Amadeus Persona","panel.title":"Amadeus Persona","panel.description":"Health and Workspace are read from the authenticated Host API. Editing stays in the owner-only Web Console.","panel.storageHealth":"Storage health","panel.boundWorkspace":"Bound Workspace","panel.checking":"Checking…","panel.storageHealthy":"Healthy · revision {revision}","panel.storageInvalid":"Storage invalid · injection fails closed","panel.storageUnavailable":"Storage unavailable · injection fails closed","panel.workspaceValue.one":"{title} · 1 session","panel.workspaceValue.other":"{title} · {count} sessions","panel.notBound":"Not bound · no Persona injection","panel.openConsole":"Open Persona console","panel.note":"Same-origin and DSH Owner admission are required. This panel never stores Persona data in the browser.","panel.language":"UI language","panel.error.unreadable":"The Host returned an unreadable response (HTTP {status}).","panel.error.auth":"Check DSH Owner authentication, then open the console from an authenticated settings page.","panel.error.unavailable":"Host status is unavailable (HTTP {status}).","panel.error.generic":"Persona status is unavailable."}});

const PANEL_CSS = `
[data-amadeus-persona]{box-sizing:border-box;color:var(--dsw-alias-label-primary,#203333);font:13px/1.6 system-ui,sans-serif;max-width:760px}
[data-amadeus-persona] *{box-sizing:border-box}
[data-amadeus-persona] h2{font-size:21px;margin:0 0 5px}
[data-amadeus-persona] p{margin:0 0 14px;opacity:.75}
[data-amadeus-persona] .persona-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
[data-amadeus-persona] .language-select{border:1px solid var(--dsw-alias-border-secondary,#8c8c8c55);background:var(--dsw-alias-bg-layer-2,#8c8c8c10);color:inherit;border-radius:8px;padding:4px 7px;font:inherit;font-size:12px;cursor:pointer}
[data-amadeus-persona] .summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}
[data-amadeus-persona] .metric{border:1px solid var(--dsw-alias-border-secondary,#8c8c8c55);border-radius:12px;padding:12px;background:var(--dsw-alias-bg-layer-2,#8c8c8c10)}
[data-amadeus-persona] .metric small{display:block;opacity:.68;font-size:11px}
[data-amadeus-persona] .metric strong{display:block;font-size:14px;margin-top:3px;word-break:break-word}
[data-amadeus-persona] button{border:1px solid #178a69;background:#178a69;color:white;border-radius:9px;padding:8px 14px;font:inherit;cursor:pointer}
[data-amadeus-persona] button:focus-visible{outline:2px solid #178a69;outline-offset:2px}
[data-amadeus-persona] .error{color:#ab3535;margin:12px 0}
[data-amadeus-persona] .note{font-size:11px;opacity:.6;margin:12px 0 0}
@media(max-width:560px){[data-amadeus-persona] .summary{grid-template-columns:1fr}[data-amadeus-persona] .persona-head{flex-direction:column}}
`;

/**
 * Persisted UI language only; Persona configuration is never browser state.
 * @returns {'zh-CN'|'en-US'} saved language or the zh-CN default.
 */
function readLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (LANGUAGES.includes(stored)) return stored;
  } catch {
    // Storage is optional; the panel remains usable without it.
  }
  return DEFAULT_LANGUAGE;
}

/**
 * @param {'zh-CN'|'en-US'} language selected language.
 */
function saveLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language === 'en-US' ? 'en-US' : 'zh-CN');
  } catch {
    // Language persistence is a convenience, never Persona state.
  }
}

/**
 * @param {string} template message template.
 * @param {Record<string, unknown>} [values] placeholder values.
 * @returns {string} interpolated text.
 */
function interpolate(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (match, name) => (
    values && Object.hasOwn(values, name) ? String(values[name] ?? '') : match
  ));
}

/**
 * @param {string} language selected language.
 * @param {string} key catalog key.
 * @param {Record<string, unknown>} [values] placeholder values.
 * @returns {string} localized message.
 */
function t(language, key, values) {
  const table = I18N_CATALOG?.[language] ?? I18N_CATALOG?.[DEFAULT_LANGUAGE] ?? {};
  const template = table[key];
  return typeof template === 'string' ? interpolate(template, values) : key;
}

/**
 * @param {string} language selected language.
 * @param {string} key base key with `.one`/`.other` variants.
 * @param {number} count item count.
 * @param {Record<string, unknown>} [values] placeholder values.
 * @returns {string} localized plural message.
 */
function tn(language, key, count, values) {
  return t(language, `${key}.${count === 1 ? 'one' : 'other'}`, { ...(values ?? {}), count });
}

async function readOverview() {
  const response = await fetch(API_ROOT + '/overview', {
    credentials: 'same-origin',
    headers: { accept: 'application/json' },
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    const error = new Error('unreadable overview response');
    error.status = response.status;
    throw error;
  }
  if (!response.ok || payload?.ok !== true) {
    const error = new Error('overview request failed');
    error.status = response.status;
    if (typeof payload?.code === 'string') error.code = payload.code;
    throw error;
  }
  return payload.data;
}

/**
 * Convert a Host failure into fixed localized copy. Raw server messages and
 * filesystem paths are never rendered.
 * @param {unknown} failure thrown failure.
 * @param {string} language selected language.
 * @returns {string} localized error message.
 */
function errorMessage(failure, language) {
  const code = failure && typeof failure === 'object' ? failure.code : undefined;
  if (typeof code === 'string') {
    const key = `error.code.${code}`;
    const table = I18N_CATALOG?.[language] ?? I18N_CATALOG?.[DEFAULT_LANGUAGE] ?? {};
    if (typeof table[key] === 'string') return t(language, key);
  }
  const status = Number(failure?.status);
  if (status === 401 || status === 403) return t(language, 'panel.error.auth');
  if (status === 503) return t(language, 'panel.error.unavailable', { status });
  if (status === 400 || status === 404) return t(language, 'panel.error.generic');
  if (Number.isFinite(status)) return t(language, 'panel.error.unavailable', { status });
  return t(language, 'panel.error.generic');
}

function Metric({ label, value }) {
  return h('div', { className: 'metric' },
    h('small', null, label),
    h('strong', null, value));
}

function LanguageSelect({ language, onLanguageChange }) {
  return h('select', {
    className: 'language-select',
    id: 'amadeus-persona-language',
    'aria-label': t(language, 'panel.language'),
    value: language,
    onChange: event => onLanguageChange(event.target.value),
  },
  h('option', { value: 'zh-CN' }, t(language, 'app.languageChinese')),
  h('option', { value: 'en-US' }, t(language, 'app.languageEnglish')));
}

function Panel() {
  const [language, setLanguage] = useState(readLanguage);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const tr = (key, values) => t(language, key, values);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const overview = await readOverview();
        if (!active) return;
        setData(overview);
        setError(null);
      } catch (failure) {
        if (!active) return;
        setData(null);
        setError(failure);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const storage = data?.storage;
  const workspace = data?.workspace;
  const revision = storage?.revision ?? '—';
  const storageLabel = loading
    ? tr('panel.checking')
    : storage?.status === 'ok'
      ? tr('panel.storageHealthy', { revision })
      : storage?.status === 'invalid'
        ? tr('panel.storageInvalid')
        : tr('panel.storageUnavailable');
  const workspaceLabel = loading
    ? tr('panel.checking')
    : workspace
      ? tn(language, 'panel.workspaceValue', Number(workspace.sessionCount ?? 0), { title: workspace.title })
      : tr('panel.notBound');

  return h('div', { 'data-amadeus-persona': 'true' },
    h('style', null, PANEL_CSS),
    h('div', { className: 'persona-head' },
      h('h2', null, tr('panel.title')),
      h(LanguageSelect, {
        language,
        onLanguageChange: next => {
          if (!LANGUAGES.includes(next)) return;
          setLanguage(next);
          saveLanguage(next);
        },
      })),
    h('p', null, tr('panel.description')),
    error ? h('div', { className: 'error', role: 'status' }, errorMessage(error, language)) : null,
    h('div', { className: 'summary' },
      h(Metric, { label: tr('panel.storageHealth'), value: storageLabel }),
      h(Metric, { label: tr('panel.boundWorkspace'), value: workspaceLabel })),
    h('button', {
      type: 'button',
      onClick: () => window.open(CONSOLE_URL, '_blank', 'noopener,noreferrer'),
    }, tr('panel.openConsole')),
    h('p', { className: 'note' }, tr('panel.note')));
}

return {
  name: '@amadeus/persona-client',
  inject: ['slots'],
  apply(ctx) {
    try {
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'amadeus-persona',
        order: 32,
        label: () => t(readLanguage(), 'panel.sectionLabel'),
      }, Panel));
    } catch (error) {
      console.error('[amadeus-persona] settings.section unavailable', error);
    }
  },
};
}});

return descriptor.factory(require);})()};
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
  tab==='catalog'?h('article',null,h('p',{className:'mcp-catalog-note'},t('基础参考目录：仅列出少量官方参考服务，不是完整的托管 MCP 市场。当前只有一个官方文件系统参考服务，且尚未预装或部署。','Basic reference catalog: a small set of official reference services, not the full hosted MCP market. It currently lists one official filesystem reference service, which is not preinstalled or deployed.')),h('input',{'aria-label':'Search MCP catalog',value:search,onChange:e=>setSearch(e.target.value),placeholder:t('搜索服务','Search services')}),
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
    h('p',{role:'note',className:'mcp-grant-warning'},t('按类型授权（qq-group / qq-private）会授予当前 Core Workspace 内该类型的所有可信会话，包括未来通过验证的成员；qq-private 并非仅限 Owner。选择具体会话也会独立授权（与类型授权为“或”关系）；仅移除具体会话不能撤销类型授权。默认不授予任何权限，所有工具保持关闭。','Type grants (qq-group / qq-private) apply to ALL trusted Sessions of that type in the current Core Workspace, including future verified members. qq-private is NOT Owner-only. Selecting specific Sessions also grants independently (OR with type); removing a specific Session alone cannot revoke a type grant. No grants are applied by default and all tools stay disabled.')),
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

function PlatformPanel({status,refresh,t}){
 const [selected,setSelected]=useState(null),[tab,setTab]=useState('account'),[filter,setFilter]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState(null),[operation,setOperation]=useState('read'),[target,setTarget]=useState(''),[query,setQuery]=useState(''),[appId,setAppId]=useState(''),[secret,setSecret]=useState(''),[accepted,setAccepted]=useState(false),[commentText,setCommentText]=useState(''),[commentId,setCommentId]=useState(''),[socialOp,setSocialOp]=useState('like'),[xsecToken,setXsecToken]=useState(''),[loginAccount,setLoginAccount]=useState(''),[loginPassword,setLoginPassword]=useState('');
 const all=[...(status?.platforms??[]),...(status?.simulations??[])],p=all.find(x=>x.id===selected);
 const sections=[['account','账号','Account'],['browse','浏览','Browse'],['autonomy','自主活动','Autonomy'],['permissions','互动权限','Permissions'],['history','经历记录','Experiences'],['diagnostics','诊断','Diagnostics']];
 const labels={browse:['热门 / 推荐','Popular / Browse'],search:['搜索','Search'],read:['详情','Details'],comments:['评论区','Comments'],related:['相关内容','Related'],subtitles:['字幕','Subtitles'],images:['图片','Images'],like:['点赞','Like'],favorite:['收藏','Favorite'],comment:['评论','Comment'],reply:['回复','Reply'],follow:['关注','Follow'],message:['私信','Message'],publish:['发布','Publish']};
 const social=['like','favorite','comment','reply','follow','message','publish'],reads=['browse','search','read','comments','related','subtitles','images'];
 const caption=op=>t(...(labels[op]??[op,op]));
 const account=p?.account?.accounts?.find(a=>a.status==='authenticated')??p?.account?.accounts?.[0],pending=p?.account?.pending;
 const stateLabel=x=>x.account?.diagnostics?.login?.readiness?.identity==='pending'?t('网页已登录 · 身份待验证','Website authenticated · identity pending'):x.simulated?t('模拟模式','Simulation'):x.account?.pending?t('等待本人授权','Waiting for authorization'):x.account?.accounts?.some(a=>a.status==='authenticated')?(x.capabilities.length?(x.permissions.some(op=>social.includes(op))?t('已登录 · 按授权互动','Connected · scoped actions'):t('已登录 · 写入关闭','Connected · writes off')):t('已登录 · 无内容读取权限','Connected · no content access')):x.account?.accounts?.some(a=>a.status==='credentials_expired')?t('凭据过期，请重新连接','Credentials expired; reconnect'):t('未连接账号','No account connected');
 const accountState=status=>t(({authenticated:'已验证',credentials_expired:'凭据已过期',disabled:'已停用'})[status]??'状态未知',({authenticated:'Verified',credentials_expired:'Credentials expired',disabled:'Disabled'})[status]??'Unknown status');
 const evidenceState=value=>t(({simulation:'模拟','live-read':'平台实读','live-action':'平台操作'})[value]??'未知证据',({simulation:'Simulation','live-read':'Live read','live-action':'Live action'})[value]??'Unknown evidence');
 const recordState=value=>t(({stored:'已保存',pending:'待保存'})[value]??'状态未知',({stored:'Saved',pending:'Pending'})[value]??'Unknown status');
 const fmtTime=value=>{if((typeof value!=='string'&&typeof value!=='number')||value==='')return null;const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString():null;};
 const errorHint=code=>({CORE_PLATFORM_LOGIN_MISSING:t('登录窗口已关闭或会话失效，请重新开始授权；等本页确认已登录后再关闭窗口。','Login window closed or session expired. Restart authorization and keep the window open until Connected appears.'),CORE_PLATFORM_CREDENTIALS_EXPIRED:t('登录超时，请重新开始授权。','Login expired; restart authorization.'),CORE_PLATFORM_ACTION_UNKNOWN:t('结果不明，已锁定此操作；请到平台核实，不要重发','Outcome unknown and locked; verify on the platform. Do not resend'),CORE_PLATFORM_ACTION_ALREADY_RECORDED:t('此操作已记录，禁止重复发送','Action already recorded; replay blocked'),CORE_PLATFORM_TARGET_DENIED:t('请先授权 Activity Session','Authorize the Activity Session first'),CORE_PLATFORM_LOGIN_REQUIRED:t('请先登录并验证账号','Log in and verify the account'),CORE_PLATFORM_PERMISSION_REQUIRED:t('需要平台或管理员授权','Platform or administrator permission required'),CORE_PLATFORM_RATE_LIMITED:t('平台限流，请稍后重试','Rate limited; retry later'),CORE_PLATFORM_TIMEOUT:t('网络请求超时','Network request timed out'),CORE_PLATFORM_TARGET_NOT_OBSERVED:t('请先浏览或搜索这条笔记，再执行互动','Browse or search this note before interacting'),CORE_PLATFORM_UNSUPPORTED:t('此能力当前不支持','This capability is unsupported'),CORE_PLATFORM_37007:t('应用尚未开通设备授权','Device grant is not enabled for this app'),CORE_PLATFORM_37001:t('二维码已过期，请重新发起登录','QR expired; restart login'),CORE_PLATFORM_37010:t('授权不存在或未开通主动解绑','Grant unavailable or active unbind not enabled'),CORE_PLATFORM_COOLDOWN:t('尚在请求冷却期','Request cooldown is active'),CORE_REVISION_CONFLICT:t('设置已变化，请刷新后重试','Settings changed; refresh and retry')})[code]??t('操作未完成，请检查配置与诊断','Operation failed; check configuration and diagnostics');
 async function action(fn){setBusy(true);setError('');setResult(null);try{setResult(await fn());}catch(e){setError(errorHint(e.message)+' · '+e.message);}finally{setSecret('');setLoginPassword('');setXsecToken('');await refresh();setBusy(false);}}
 const save=patch=>action(()=>api('/platform/configure',{revision:status.revision,id:p.id,config:{enabled:p.enabled,permissions:p.permissions,maxRequests:p.maxRequests,autonomous:p.autonomous,minIntervalMs:p.minIntervalMs,social:p.social,...patch}}));
 const auth=(name,options)=>action(()=>api('/platform/account',{id:p.id,action:name,revision:status.revision,loginId:pending?.loginId,options}));
 // This effect only reads Host state. Login progresses even with no UI mounted.
 useEffect(()=>{if(!p)return;let active=true,inFlight=false;const timer=setInterval(async()=>{if(!active||inFlight)return;inFlight=true;try{await refresh();}catch(e){if(active)setError(errorHint(e.message));}finally{inFlight=false;}},3000);return()=>{active=false;clearInterval(timer);};},[p?.id]);

 const btn=(zh,en,fn,disabled=false)=>h('button',{disabled:busy||disabled,onClick:fn},t(zh,en));
 const para=(zh,en)=>h('p',null,t(zh,en));
 const input=(label,value,set,type='text')=>h('label',null,label+' ',h('input',{type,value,autoComplete:'off',onChange:e=>set(e.target.value)}));
 const perms=ops=>h('fieldset',null,...ops.map(op=>h('label',{key:op,style:{display:'inline-block',margin:10}},h('input',{type:'checkbox',checked:p.permissions.includes(op),disabled:busy||!p.capabilities.includes(op),onChange:e=>save({permissions:e.target.checked?[...p.permissions,op]:p.permissions.filter(v=>v!==op)})}),caption(op),!p.capabilities.includes(op)?' — '+t('当前不支持','Unsupported'):'')));
 let detail=null;
 if(p&&tab==='account')detail=h('section',null,h('h3',null,t('连接账号','Connect account')),h('p',null,stateLabel(p)),p.account?.loginError?h('p',{role:'alert'},errorHint(p.account.loginError)):null,
  p.account?.storage==='windows-dpapi'?para('凭据由 Windows 当前用户加密保存；后台读取与重启恢复取决于账号当前状态，不会仅凭服务在线显示已登录。','Windows protects saved credentials for the current user; background read and restart recovery depend on the account\'s current state. Service availability alone does not mean logged in.'):para('此接入的凭据仅保留在进程内，重启需重新连接。','This adapter keeps credentials in memory; reconnect after restart.'),
  account?h('div',null,
   h('p',null,`${account.displayName||t('未命名账号','Unnamed account')} · ${accountState(account.status)}`),
   h('p',null,fmtTime(account.verifiedAt??account.lastVerifiedAt)?`${t('最近验证时间：','Last verified: ')}${fmtTime(account.verifiedAt??account.lastVerifiedAt)}`:t('最近验证时间未记录','Last verification time not recorded')),
   fmtTime(account.expiresAt)?h('p',null,`${t('有效期至：','Valid until: ')}${fmtTime(account.expiresAt)}`):null,
   h('details',null,h('summary',null,t('账号标识与诊断','Account identifiers and diagnostics')),
    h('p',null,`${t('账号 ID：','Account ID: ')}${account.accountId}`),
    h('p',null,`${t('原始状态：','Raw status: ')}${account.status}`),
    h('pre',{style:{whiteSpace:'pre-wrap',wordBreak:'break-word'}},JSON.stringify(account,null,2)))):null,
  p.simulated?para('离线模拟无需登录，不读取凭据。','Offline simulations do not use credentials.'):
  h('div',null,p.id==='xiaohongshu-browser'?h('div',null,para('使用本地执行服务在后台生成二维码。请本人扫码；关闭设置页不会中断。Cookie 由 Windows DPAPI 加密保存；重启恢复以实际登录状态为准。无需保持 Edge 窗口打开。','A local service generates QR in the background. Scan yourself; closing settings does not cancel login. DPAPI protects saved cookies; restart recovery follows the actual login state. No visible Edge window is required.'),h('label',null,h('input',{type:'checkbox',checked:accepted,onChange:e=>setAccepted(e.target.checked)}),t('本人同意扫码连接专用账号','I consent to connect my dedicated account')),p.account?.diagnostics?h('details',null,h('summary',null,t('诊断信息','Diagnostics')),h('pre',{style:{whiteSpace:'pre-wrap',wordBreak:'break-word'}},JSON.stringify({backend:p.account.diagnostics.backend,version:p.account.diagnostics.version,stage:p.account.diagnostics.stage,readiness:p.account.diagnostics.login?.readiness},null,2))):null):p.id==='xiaohongshu'?h('div',null,
   para('先申请审核通过的小红书 Web 应用。官方目前仅开放 basic_info；扫码成功不开放笔记搜索、评论或发布。','Apply for an approved XHS Web app first. Only basic_info is open; login does not grant notes, comments or publishing.'),
   h('a',{href:'https://openaccount.xiaohongshu.com/console/apps',target:'_blank',rel:'noopener noreferrer'},t('官方应用管理','Official application console')),
   input('App ID',appId,setAppId),input('App Secret',secret,setSecret,'password'),para('Secret 为只写输入，不保存到配置；仅使用你有权管理的应用。','Secret is write-only and excluded from config; use only an app you control.')):
   h('div',null,para('网页扫码使用 B站网站登录接口，并非开放平台 OAuth；可用性可能随平台变化。正式开放平台接入需要开发者应用审核。','Web QR uses Bilibili website login, not Open Platform OAuth; availability may change. Open Platform access requires an approved app.'),h('a',{href:'https://open.bilibili.com/doc',target:'_blank',rel:'noopener noreferrer'},t('官方开放平台说明','Official Open Platform docs')),h('label',null,h('input',{type:'checkbox',checked:accepted,onChange:e=>setAccepted(e.target.checked)}),t('本人主动使用网页扫码连接','I choose web QR login'))),
   btn('开始授权','Start authorization',()=>auth('begin',p.id==='xiaohongshu-browser'?{acceptBrowser:accepted}:p.id==='bilibili'?{method:'web-qr',acceptWebAdapter:accepted}:{appId,appSecret:secret}),!!pending||(p.id==='xiaohongshu'?(!appId||!secret):!accepted)),
   pending?h('div',null,pending.method==='dedicated-browser'?para('请在独立窗口完成登录；Host 后台会自动确认，关闭设置页不会中断。请等本页显示已登录后再关闭窗口。','Complete login in the dedicated window, then check authorization.'):null,pending.qrDataUrl?h('img',{src:pending.qrDataUrl,alt:t('本人扫码授权','Scan to authorize'),width:240,height:240}):null,para('请本人打开官方授权入口确认，随后检查状态。勿分享一次性链接。','Open the official verification page yourself, then check status. Do not share the one-time link.'),['dedicated-browser','local-service-qr'].includes(pending.method)?null:h('a',{href:pending.verificationUrl,target:'_blank',rel:'noopener noreferrer'},t('打开官方授权入口','Open official verification')),pending.userCode?h('code',null,pending.userCode):null,h('p',null,new Date(pending.expiresAt).toLocaleString()),btn('刷新登录状态','Refresh login status',()=>action(()=>refresh())),btn('取消登录','Cancel login',()=>auth('logout'))):null,
   btn('重新验证','Verify',()=>auth('verify'),account?.status!=='authenticated'),p.id==='xiaohongshu'?btn('刷新有效凭据','Refresh credentials',()=>auth('refresh'),!p.account?.canRefresh):null,btn('退出本地账号','Disconnect locally',()=>auth('logout')),btn('撤销授权','Revoke authorization',()=>auth('revoke')),btn('清除账号记录','Clear account record',()=>auth('clear'))));
 if(p&&tab==='browse')detail=h('section',null,h('h3',null,t('受控只读测试','Controlled read test')),
  para('先开启平台和具体读取权限。测试复用 Activity Session 和 Memory ACL；标题、评论文本不代表完整观看。','Enable the platform and specific reads first. Tests use Activity Session and Memory ACL; metadata is not a complete viewing.'),perms(reads),
  h('select',{value:operation,onChange:e=>setOperation(e.target.value)},...reads.map(op=>h('option',{value:op,key:op,disabled:!p.capabilities.includes(op)},caption(op)))),input(t('内容 ID / BV号','Content ID / BV'),target,setTarget),input(t('搜索词','Query'),query,setQuery),p.id==='xiaohongshu-browser'?input(t('笔记链接中的 xsec_token（可选，仅本次）','Link xsec_token (required, this request only)'),xsecToken,setXsecToken,'password'):null,
  btn('执行只读测试','Run read test',()=>action(()=>api('/platform/read',{id:p.id,operation,input:{id:target,query,...(xsecToken?{xsecToken}:{})}})),!p.enabled||!p.permissions.includes(operation)));
 if(p&&tab==='autonomy')detail=h('section',null,h('h3',null,t('平台访问与活动预算','Access and activity budget')),h('label',null,h('input',{type:'checkbox',checked:p.enabled,disabled:busy,onChange:e=>save({enabled:e.target.checked})}),t('允许访问此平台','Allow platform access')),
  para('自主探索还需要全局活动开关和 Life 唤醒机会；不新增后台调度。','Autonomous reads also require global exploration and Life wake opportunities; no extra scheduler.'),h('label',null,h('input',{type:'checkbox',checked:p.autonomous===true,disabled:busy,onChange:e=>save({autonomous:e.target.checked})}),t('允许自主活动（仍受具体权限约束）','Allow autonomous activity (subject to grants)')),h('label',null,t('请求间隔（毫秒）','Request cooldown (ms)'),h('input',{type:'number',min:0,max:3600000,key:p.id+'cool'+p.minIntervalMs,defaultValue:p.minIntervalMs,onBlur:e=>{if(Number(e.target.value)!==p.minIntervalMs)save({minIntervalMs:Number(e.target.value)});}})),h('p',null,`${t('今日使用 / 上限：','Used / daily maximum: ')}${p.used}/${p.maxRequests}`),h('input',{type:'number',min:1,max:1000,'aria-label':t('每日请求上限','Daily request limit'),key:p.id+p.maxRequests,defaultValue:p.maxRequests,onBlur:e=>{const n=Number(e.target.value);if(n!==p.maxRequests)save({maxRequests:n});}}),
  para('兴趣由 State 维护；本候选不增加平台独立兴趣模型或自动轮询。','Interests remain in State; this candidate adds no separate interest model or polling.'));
 if(p&&tab==='permissions')detail=h('section',null,h('h3',null,t('互动权限','Social permissions')),p.simulated?para('以下仅执行合成 Dry-run。','These actions are synthetic dry-runs.'):(p.social?para('平台授权后可自主浏览并互动，无需逐条批准笔记。仅使用真实浏览取得的目标，保留会话隔离、额度与去重。','Platform grants allow autonomous browsing and interaction without per-note approval. Targets must come from actual browsing; session isolation, budgets and deduplication remain.'):para('此接入暂不支持真实社交执行。','This adapter does not support live social actions.')),perms(social),
  p.social?h('div',null,h('h4',null,t('授权范围','Allowed targets')),
  h('p',null,t('使用 Host 创建的 Core Activity Session 自动执行；无需手动选择笔记或会话。','Uses the Host-created Core Activity Session automatically; no manual note or session selection.')),
  h('label',null,t('每种操作每日上限','Daily limit per action'),h('input',{type:'number',min:1,max:100,key:'social-limit'+p.social.dailyLimit,defaultValue:p.social.dailyLimit,onBlur:e=>{if(Number(e.target.value)!==p.social.dailyLimit)save({social:{...p.social,dailyLimit:Number(e.target.value)}});}})),
  h('label',null,t('每种操作冷却毫秒','Cooldown per action (ms)'),h('input',{type:'number',min:1000,max:3600000,key:'social-cool'+p.social.cooldownMs,defaultValue:p.social.cooldownMs,onBlur:e=>{if(Number(e.target.value)!==p.social.cooldownMs)save({social:{...p.social,cooldownMs:Number(e.target.value)}});}})),
  h('h4',null,t('执行真实互动','Execute a real action')),h('select',{value:socialOp,onChange:e=>setSocialOp(e.target.value)},...['like','comment','reply'].map(op=>h('option',{key:op,value:op},caption(op)))),input(p.id==='bilibili'?'视频 BV ID':t('内容 ID','Content ID'),target,setTarget),p.id==='xiaohongshu-browser'?input(t('链接 xsec_token（可选，已浏览目标自动获取）','Link xsec_token (optional for observed content)'),xsecToken,setXsecToken,'password'):null,socialOp==='reply'?input(t('原评论 ID（精确回复）','Exact parent comment ID'),commentId,setCommentId):null,socialOp!=='like'?input(t('评论内容','Comment text'),commentText,setCommentText):null,
  para('此按钮会真的向平台发出操作。点赞只设为已点赞；评论不会自动重发。','This button sends a real action. Like only sets liked=true; comments never auto-retry.'),
  btn('执行已授权互动','Execute authorized action',()=>action(()=>api('/platform/action',{id:p.id,operation:socialOp,input:{id:target,text:commentText,commentId,liked:true,...(xsecToken?{xsecToken}:{})}})),!p.enabled||!p.permissions.includes(socialOp)),
  h('h4',null,t('操作记录（含不确定结果）','Action journal (including unknown outcomes)')),...(p.actions??[]).map(a=>h('p',{key:a.key},`${a.operation} · ${a.noteId} · ${a.status} · ${new Date(a.at).toLocaleString()}`))):null);
 if(p&&tab==='history')detail=h('section',null,h('h3',null,t('来源与经历','Sources and experiences')),...(status.experiences??[]).filter(e=>e.platform===p.id).map(e=>h('article',{key:e.eventId},
  h('strong',null,e.observationSummary??caption(e.operation)),
  e.sourceUrl?h('a',{href:e.sourceUrl,target:'_blank',rel:'noopener noreferrer'},t('查看原始来源','Open source')):null,
  h('p',null,`${evidenceState(e.evidenceLevel??'simulation')} · ${caption(e.operation)} · ${recordState(e.status)} · ${fmtTime(e.occurredAt)??t('时间未记录','Time not recorded')}`),
  h('details',null,h('summary',null,t('技术关联 ID','Technical IDs')),
   h('p',null,`Event: ${e.eventId}`),h('p',null,`Memory: ${e.memoryId??'—'}`),h('p',null,`Activity: ${e.activityId??'—'}`)))),
  !(status.experiences??[]).some(e=>e.platform===p.id)?para('暂无经历','No experiences yet'):null);
 if(p&&tab==='diagnostics')detail=h('section',null,h('h3',null,t('诊断与安全停止','Diagnostics and stop')),h('p',null,`${p.mode} · ${p.version} · ${stateLabel(p)}`),
  para('网络、限流和权限错误不会回退为 Mock。远程撤销不支持时仅断开本地，请到平台账号安全页移除授权。','Failures never fall back to Mock. If remote revoke is unsupported, disconnect is local only; remove authorization in platform settings.'),btn('立即停用平台','Stop platform',()=>save({enabled:false,permissions:[]})),para('字幕、关键画面与弹幕尚未实现，不报告视觉理解。','Subtitles, keyframes and danmaku are not implemented; no visual understanding is claimed.'));
 return h('div',{className:'core-extension'},h('h2',null,t('平台中心','Platform center')),para('账号、浏览与自主活动统一管理；平台和 MCP 相互独立。','Manage accounts, browsing and activities; platforms remain separate from MCP.'),
  !p?h('div',null,input(t('搜索平台','Search platforms'),filter,setFilter),h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16}},...all.filter(x=>(x.id+' '+x.name).toLowerCase().includes(filter.toLowerCase())).map(item=>h('article',{key:item.id,style:{border:'1px solid currentColor',borderRadius:12,padding:16}},h('h3',null,item.name),h('p',null,`${item.mode} · ${item.version}`),h('p',null,stateLabel(item)),h('p',null,item.capabilities.map(caption).join(' / ')||t('仅账号身份','Account identity only')),btn('进入设置','Open settings',()=>{setSelected(item.id);setTab('account');setError('');setResult(null);})))),h('h3',null,t('未来平台','Future platforms')),para('通过可信内置适配器扩展，不从网页安装执行代码。','Extend through trusted built-in adapters; web pages cannot install code.')):
  h('div',null,btn('返回平台列表','Back to platforms',()=>{setSelected(null);setSecret('');}),h('h3',null,p.name),h('nav',{style:{display:'flex',flexWrap:'wrap',gap:8}},...sections.map(([id,zh,en])=>h('button',{key:id,'aria-pressed':tab===id,onClick:()=>{setTab(id);setResult(null);}},t(zh,en)))),detail),
  error?h('p',{role:'alert'},error):null,result?h('p',{role:'status'},result.remote==='unsupported'?t('本地已断开，平台不支持远程撤销；请到账号安全页退出授权。','Disconnected locally; remote revoke unsupported. Use platform account security settings.'):t('操作完成，请查看最新状态与经历记录。','Operation completed. See current status and experiences.')):null);
}

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
.amadeus-core-shell [data-amadeus-life]{
 --aml-line:var(--core-border);--aml-surface:var(--core-surface);--aml-surface-2:var(--core-surface-2);--aml-text:var(--core-text);--aml-muted:var(--core-muted);--aml-accent:var(--core-accent);--aml-accent-strong:var(--core-accent-strong);--aml-accent-soft:var(--core-accent-soft);
 padding-bottom:0;color:var(--core-text);font-size:13.5px;line-height:1.6}
.amadeus-core-shell [data-amadeus-life] .topbar{padding:20px 22px;margin-bottom:14px;border:1px solid var(--core-accent-line);border-radius:var(--core-radius);background:linear-gradient(135deg,var(--core-accent-soft) 0%,var(--core-surface-2) 58%,var(--core-surface) 100%);box-shadow:var(--core-shadow)}
.amadeus-core-shell [data-amadeus-life] .topbar h2{font-size:22px;letter-spacing:-.02em}
.amadeus-core-shell [data-amadeus-life] .topbar p{max-width:660px}
.amadeus-core-shell [data-amadeus-life] .tabs{gap:4px;padding:9px 0;margin:2px 0 14px;border-bottom:1px solid var(--core-border)}
.amadeus-core-shell [data-amadeus-life] .tabs button{padding:7px 13px;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--core-muted);font-size:13px;font-weight:600;box-shadow:none}
.amadeus-core-shell [data-amadeus-life] .tabs button:hover:not(:disabled){background:var(--core-hover);color:var(--core-text)}
.amadeus-core-shell [data-amadeus-life] .tabs button[aria-selected=true]{background:var(--core-accent-soft);border-color:var(--core-accent-line);color:var(--core-accent-strong);box-shadow:none}
.amadeus-core-shell [data-amadeus-life] button{min-height:36px;padding:7px 13px;border:1px solid var(--core-border);border-radius:10px;background:var(--core-elevated);color:var(--core-text);font-size:13px;font-weight:600;line-height:1.2;transition:background .14s,border-color .14s,color .14s}
.amadeus-core-shell [data-amadeus-life] button:hover:not(:disabled){background:var(--core-hover);border-color:var(--core-border-strong)}
.amadeus-core-shell [data-amadeus-life] button.primary{background:var(--core-accent);border-color:var(--core-accent);color:#fff;box-shadow:none}
.amadeus-core-shell [data-amadeus-life] button.primary:hover:not(:disabled){background:var(--core-accent-strong);border-color:var(--core-accent-strong);color:#fff}
.amadeus-core-shell[data-core-theme=dark] [data-amadeus-life] button.primary{color:#071a14}
.amadeus-core-shell [data-amadeus-life] button.danger{border-color:color-mix(in srgb,var(--core-danger) 34%,var(--core-border));background:transparent;color:var(--core-danger)}
.amadeus-core-shell [data-amadeus-life] button:focus-visible,.amadeus-core-shell [data-amadeus-life] input:focus-visible,.amadeus-core-shell [data-amadeus-life] select:focus-visible,.amadeus-core-shell [data-amadeus-life] textarea:focus-visible,.amadeus-core-shell [data-amadeus-life] summary:focus-visible{outline:2px solid var(--core-accent);outline-offset:2px}
.amadeus-core-shell [data-amadeus-life] .chip{padding:2px 8px;border:1px solid var(--core-border);border-radius:999px;background:var(--core-surface-2);color:var(--core-muted);font-size:11px;font-weight:650;line-height:1.7}
.amadeus-core-shell [data-amadeus-life] .chip.ok{background:color-mix(in srgb,var(--core-ok) 10%,var(--core-surface));border-color:color-mix(in srgb,var(--core-ok) 32%,var(--core-border));color:color-mix(in srgb,var(--core-ok) 74%,var(--core-text))}
.amadeus-core-shell [data-amadeus-life] .chip.warn{background:color-mix(in srgb,var(--core-warn) 10%,var(--core-surface));border-color:color-mix(in srgb,var(--core-warn) 34%,var(--core-border));color:color-mix(in srgb,var(--core-warn) 76%,var(--core-text))}
.amadeus-core-shell [data-amadeus-life] .chip.bad{background:color-mix(in srgb,var(--core-danger) 9%,var(--core-surface));border-color:color-mix(in srgb,var(--core-danger) 34%,var(--core-border));color:var(--core-danger)}
.amadeus-core-shell [data-amadeus-life] .grid{gap:14px;margin:12px 0 16px}
.amadeus-core-shell [data-amadeus-life] .card,.amadeus-core-shell [data-amadeus-life] .panel{padding:17px 18px;border:1px solid var(--core-border);border-radius:var(--core-radius);background:var(--core-surface);box-shadow:var(--core-shadow)}
.amadeus-core-shell [data-amadeus-life] .card:hover{transform:none;box-shadow:var(--core-shadow)}
.amadeus-core-shell [data-amadeus-life] .card .value{font-size:24px;font-weight:750;letter-spacing:-.03em}
.amadeus-core-shell [data-amadeus-life] .panel{margin-bottom:14px}
.amadeus-core-shell [data-amadeus-life] .field{grid-template-columns:minmax(0,1.1fr) minmax(180px,.9fr);gap:14px;padding:12px 0;border-bottom:1px solid var(--core-border)}
.amadeus-core-shell [data-amadeus-life] .field strong{font-size:12.5px}
.amadeus-core-shell [data-amadeus-life] input[type=number],.amadeus-core-shell [data-amadeus-life] input[type=text],.amadeus-core-shell [data-amadeus-life] textarea,.amadeus-core-shell [data-amadeus-life] select{min-height:36px;padding:8px 10px;border:1px solid var(--core-border);border-radius:9px;background:var(--core-surface-2);color:var(--core-text);font-size:13px;transition:border-color .14s,background .14s,box-shadow .14s}
.amadeus-core-shell [data-amadeus-life] input:hover:not(:disabled),.amadeus-core-shell [data-amadeus-life] select:hover:not(:disabled),.amadeus-core-shell [data-amadeus-life] textarea:hover:not(:disabled){border-color:var(--core-border-strong)}
.amadeus-core-shell [data-amadeus-life] input:focus,.amadeus-core-shell [data-amadeus-life] select:focus,.amadeus-core-shell [data-amadeus-life] textarea:focus{border-color:var(--core-accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--core-accent) 16%,transparent)}
.amadeus-core-shell [data-amadeus-life] .switch{padding:9px 11px;border:1px solid var(--core-border);border-radius:10px;background:var(--core-surface-2)}
.amadeus-core-shell [data-amadeus-life] .switch input{accent-color:var(--core-accent)}
.amadeus-core-shell [data-amadeus-life] .message{padding:10px 13px;border:1px solid var(--core-border);border-radius:12px;background:var(--core-surface-2);margin:10px 0}
.amadeus-core-shell [data-amadeus-life] .message.error{background:color-mix(in srgb,var(--core-danger) 9%,var(--core-surface));border-color:color-mix(in srgb,var(--core-danger) 30%,var(--core-border));color:var(--core-danger)}
.amadeus-core-shell [data-amadeus-life] .message.success{background:color-mix(in srgb,var(--core-ok) 10%,var(--core-surface));border-color:color-mix(in srgb,var(--core-ok) 32%,var(--core-border));color:color-mix(in srgb,var(--core-ok) 74%,var(--core-text))}
.amadeus-core-shell [data-amadeus-life] .tableWrap{border:1px solid var(--core-border);border-radius:14px;background:var(--core-surface);box-shadow:none}
.amadeus-core-shell [data-amadeus-life] th{background:var(--core-surface-2);color:var(--core-muted);border-bottom:1px solid var(--core-border)}
.amadeus-core-shell [data-amadeus-life] td{border-bottom:1px solid var(--core-border)}
.amadeus-core-shell [data-amadeus-life] tbody tr:hover{background:var(--core-hover)}
.amadeus-core-shell [data-amadeus-life] .muted{color:var(--core-muted)}
.amadeus-core-shell [data-amadeus-life] .errorText,.amadeus-core-shell [data-amadeus-state] .errorText{color:var(--core-danger)}
.amadeus-core-shell [data-amadeus-life] details summary{color:var(--core-text)}
.amadeus-core-shell [data-amadeus-state]{--am-state-accent:var(--core-accent);--am-state-accent-strong:var(--core-accent-strong);--am-state-on-accent:#fff;padding-bottom:0;color:var(--core-text);font-size:13.5px;line-height:1.6}
.amadeus-core-shell[data-core-theme=dark] [data-amadeus-state]{--am-state-on-accent:#071a14}
.amadeus-core-shell [data-amadeus-state] .topbar{padding:20px 22px;margin-bottom:14px;border:1px solid var(--core-accent-line);border-radius:var(--core-radius);background:linear-gradient(135deg,var(--core-accent-soft) 0%,var(--core-surface-2) 58%,var(--core-surface) 100%);box-shadow:var(--core-shadow);align-items:center}
.amadeus-core-shell [data-amadeus-state] .topbar h2{font-size:22px;font-weight:700;letter-spacing:-.02em}
.amadeus-core-shell [data-amadeus-state] .topbar .sub{opacity:1;color:var(--core-muted)}
.amadeus-core-shell [data-amadeus-state] .eyebrow{color:var(--core-accent-strong);font-size:10.5px;font-weight:800;letter-spacing:.14em}
.amadeus-core-shell [data-amadeus-state] .shell{grid-template-columns:1fr;gap:14px}
.amadeus-core-shell [data-amadeus-state] .side{position:static;top:auto;display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;padding:10px 12px;border:1px solid var(--core-border);border-radius:16px;background:var(--core-surface-2);box-shadow:none}
.amadeus-core-shell [data-amadeus-state] .brand{display:flex;align-items:center;gap:8px;margin:0;padding:0 6px 0 0;border:0}
.amadeus-core-shell [data-amadeus-state] .brandMark{display:none}
.amadeus-core-shell [data-amadeus-state] .brand strong{font-size:12px;font-weight:650;line-height:1.2}
.amadeus-core-shell [data-amadeus-state] .brand small,.amadeus-core-shell [data-amadeus-state] .sideTag,.amadeus-core-shell [data-amadeus-state] .sideLabel{display:none}
.amadeus-core-shell [data-amadeus-state] .navList{display:flex;flex-direction:row;flex-wrap:wrap;gap:4px;min-width:0}
.amadeus-core-shell [data-amadeus-state] .navButton{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:7px 12px;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--core-muted);font-size:12.5px;font-weight:600;line-height:1.2;text-align:left}
.amadeus-core-shell [data-amadeus-state] .navButton:hover:not(:disabled){background:var(--core-hover);color:var(--core-text)}
.amadeus-core-shell [data-amadeus-state] .navButton[aria-selected=true]{background:var(--core-accent-soft);border-color:var(--core-accent-line);color:var(--core-accent-strong);font-weight:650}
.amadeus-core-shell [data-amadeus-state] .navIcon{width:auto;font-size:13px;opacity:.7}
.amadeus-core-shell [data-amadeus-state] .navButton[aria-selected=true] .navIcon{opacity:1}
.amadeus-core-shell [data-amadeus-state] .grid{gap:14px;margin:12px 0 16px}
.amadeus-core-shell [data-amadeus-state] .card{padding:16px 17px;border:1px solid var(--core-border);border-radius:16px;background:var(--core-surface);box-shadow:var(--core-shadow)}
.amadeus-core-shell [data-amadeus-state] .card .value{font-size:24px;font-weight:750;letter-spacing:-.03em}
.amadeus-core-shell [data-amadeus-state] .panel{padding:18px;margin:0 0 14px;border:1px solid var(--core-border);border-radius:16px;background:var(--core-surface);box-shadow:var(--core-shadow)}
.amadeus-core-shell [data-amadeus-state] .bar{height:8px;background:var(--core-surface-3)}
.amadeus-core-shell [data-amadeus-state] .bar span{background:var(--core-accent)}
.amadeus-core-shell [data-amadeus-state] .workspaceBanner{padding:13px 15px;margin:12px 0;border:1px solid var(--core-border);border-radius:16px;background:var(--core-surface-2)}
.amadeus-core-shell [data-amadeus-state] .modeGrid{gap:14px}
.amadeus-core-shell [data-amadeus-state] .modeCard{padding:12px;border:1px solid var(--core-border);border-radius:12px;background:var(--core-surface-2)}
.amadeus-core-shell [data-amadeus-state] .modeCard.active{border-color:var(--core-accent);background:var(--core-accent-soft)}
.amadeus-core-shell [data-amadeus-state] .sessionRow,.amadeus-core-shell [data-amadeus-state] .interestRow{border-bottom:1px solid var(--core-border)}
.amadeus-core-shell [data-amadeus-state] .hintCard{padding:11px 13px;border:1px dashed color-mix(in srgb,var(--core-warn) 34%,var(--core-border));border-radius:12px;background:color-mix(in srgb,var(--core-warn) 8%,var(--core-surface))}
.amadeus-core-shell [data-amadeus-state] button{min-height:36px;padding:7px 13px;border:1px solid var(--core-border);border-radius:10px;background:var(--core-elevated);color:var(--core-text);font-size:13px;font-weight:600;line-height:1.2}
.amadeus-core-shell [data-amadeus-state] button:hover:not(:disabled){background:var(--core-hover);border-color:var(--core-border-strong)}
.amadeus-core-shell [data-amadeus-state] button.primary{background:var(--core-accent);border-color:var(--core-accent);color:var(--am-state-on-accent)}
.amadeus-core-shell [data-amadeus-state] button.primary:hover:not(:disabled){background:var(--core-accent-strong);border-color:var(--core-accent-strong);color:var(--am-state-on-accent)}
.amadeus-core-shell [data-amadeus-state] button.danger{border-color:color-mix(in srgb,var(--core-danger) 34%,var(--core-border));background:transparent;color:var(--core-danger)}
.amadeus-core-shell [data-amadeus-state] button.ghost{background:transparent}
.amadeus-core-shell [data-amadeus-state] button:focus-visible,.amadeus-core-shell [data-amadeus-state] input:focus-visible,.amadeus-core-shell [data-amadeus-state] select:focus-visible,.amadeus-core-shell [data-amadeus-state] summary:focus-visible{outline:2px solid var(--core-accent);outline-offset:2px}
.amadeus-core-shell [data-amadeus-state] input[type=number],.amadeus-core-shell [data-amadeus-state] input[type=text],.amadeus-core-shell [data-amadeus-state] input[type=range],.amadeus-core-shell [data-amadeus-state] select,.amadeus-core-shell [data-amadeus-state] textarea{font-size:13px}
.amadeus-core-shell [data-amadeus-state] input[type=number],.amadeus-core-shell [data-amadeus-state] input[type=text],.amadeus-core-shell [data-amadeus-state] select,.amadeus-core-shell [data-amadeus-state] textarea{min-height:36px;padding:8px 10px;border:1px solid var(--core-border);border-radius:9px;background:var(--core-surface-2);color:var(--core-text)}
.amadeus-core-shell [data-amadeus-state] input[type=number]:hover:not(:disabled),.amadeus-core-shell [data-amadeus-state] input[type=text]:hover:not(:disabled),.amadeus-core-shell [data-amadeus-state] select:hover:not(:disabled),.amadeus-core-shell [data-amadeus-state] textarea:hover:not(:disabled){border-color:var(--core-border-strong)}
.amadeus-core-shell [data-amadeus-state] input[type=number]:focus,.amadeus-core-shell [data-amadeus-state] input[type=text]:focus,.amadeus-core-shell [data-amadeus-state] select:focus,.amadeus-core-shell [data-amadeus-state] textarea:focus{border-color:var(--core-accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--core-accent) 16%,transparent)}
.amadeus-core-shell [data-amadeus-state] input[type=range]{accent-color:var(--core-accent)}
.amadeus-core-shell [data-amadeus-state] .switch input{accent-color:var(--core-accent)}
.amadeus-core-shell [data-amadeus-state] .chip{padding:2px 8px;border:1px solid var(--core-border);border-radius:999px;background:var(--core-surface-2);color:var(--core-muted);font-size:11px;font-weight:650;line-height:1.7}
.amadeus-core-shell [data-amadeus-state] .chip.ok{background:color-mix(in srgb,var(--core-ok) 10%,var(--core-surface));border-color:color-mix(in srgb,var(--core-ok) 32%,var(--core-border));color:color-mix(in srgb,var(--core-ok) 74%,var(--core-text))}
.amadeus-core-shell [data-amadeus-state] .chip.warn{background:color-mix(in srgb,var(--core-warn) 10%,var(--core-surface));border-color:color-mix(in srgb,var(--core-warn) 34%,var(--core-border));color:color-mix(in srgb,var(--core-warn) 76%,var(--core-text))}
.amadeus-core-shell [data-amadeus-state] .chip.bad{background:color-mix(in srgb,var(--core-danger) 9%,var(--core-surface));border-color:color-mix(in srgb,var(--core-danger) 34%,var(--core-border));color:var(--core-danger)}
.amadeus-core-shell [data-amadeus-state] .message{padding:10px 13px;border:1px solid var(--core-border);border-radius:12px;background:var(--core-surface-2);margin:10px 0}
.amadeus-core-shell [data-amadeus-state] .message.error{background:color-mix(in srgb,var(--core-danger) 9%,var(--core-surface));border-color:color-mix(in srgb,var(--core-danger) 30%,var(--core-border));color:var(--core-danger)}
.amadeus-core-shell [data-amadeus-state] .message.success{background:color-mix(in srgb,var(--core-ok) 10%,var(--core-surface));border-color:color-mix(in srgb,var(--core-ok) 32%,var(--core-border));color:color-mix(in srgb,var(--core-ok) 74%,var(--core-text))}
.amadeus-core-shell [data-amadeus-state] .tableWrap{border:1px solid var(--core-border);border-radius:14px;background:var(--core-surface)}
.amadeus-core-shell [data-amadeus-state] th{background:var(--core-surface-2);color:var(--core-muted);border-bottom:1px solid var(--core-border)}
.amadeus-core-shell [data-amadeus-state] td{border-bottom:1px solid var(--core-border)}
.amadeus-core-shell [data-amadeus-state] tbody tr:hover{background:var(--core-hover)}
.amadeus-core-shell [data-amadeus-state] .dialog{border:1px solid var(--core-border);border-radius:16px;background:var(--core-surface);color:var(--core-text)}
.amadeus-core-shell [data-amadeus-state] .overlay{background:color-mix(in srgb,#0a1713 70%,transparent)}
.amadeus-core-shell [data-amadeus-state] .muted{opacity:1;color:var(--core-muted)}
/* Long persisted paths and identifiers must not expand module grids. */
.amadeus-core-shell [data-amadeus-life] .grid,.amadeus-core-shell [data-amadeus-state] .grid{grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))}
.amadeus-core-shell [data-amadeus-life] .card,.amadeus-core-shell [data-amadeus-state] .card{min-width:0;overflow-wrap:anywhere}
.amadeus-core-shell [data-amadeus-life] .value,.amadeus-core-shell [data-amadeus-state] .value{overflow-wrap:anywhere}
.amadeus-core-shell [data-amadeus-life] .tableWrap,.amadeus-core-shell [data-amadeus-state] .tableWrap{max-width:100%;overflow-x:auto}
@media(max-width:640px){.amadeus-core-shell [data-amadeus-life] .field{grid-template-columns:1fr}}
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
 .amadeus-core-shell [data-amadeus-life] .topbar,.amadeus-core-shell [data-amadeus-state] .topbar{padding:16px;border-radius:15px}
 .amadeus-core-shell [data-amadeus-life] .topbar h2,.amadeus-core-shell [data-amadeus-state] .topbar h2{font-size:20px}
 .amadeus-core-shell [data-amadeus-life] .grid,.amadeus-core-shell [data-amadeus-state] .grid{gap:10px}
 .amadeus-core-shell [data-amadeus-state] .side{padding:8px 10px;gap:4px}
 .amadeus-core-shell [data-amadeus-state] .navList{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:thin;width:100%;padding-bottom:2px}
 .amadeus-core-shell [data-amadeus-state] .navButton{flex:none}
 .amadeus-core-shell [data-amadeus-state] .panel{padding:14px}
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
function renderModuleTab({tab,status,views,lifeSummary,t,h}){
 const empty=h('div',{className:'core-empty'},t('请先选择工作区并应用配置，或启用此模块。','Choose a workspace and apply configuration, or enable this module.'));
 if(!status?.modules?.[tab]?.mounted)return empty;
 if(tab==='memory'||tab==='state')return views[tab]?.()??empty;
 const summary=lifeSummary&&h('section',{className:'core-card'},
  h('div',{className:'core-card-head'},h('h2',null,t('当前生活概况','Current life summary')),h('span',{className:'core-badge core-badge--plain'},t('派生视图','Derived view'))),
  h('p',{className:'core-card-sub'},t('概况由 Life、State 和经历记录生成，不创建新的记忆或调度。','Derived from Life, State and Experiences; it creates no memory or scheduler.')),
  lifeSummary.errors?.length?h('div',{className:'core-alert',role:'status'},t(`部分数据不可用：${lifeSummary.errors.join('；')}`,`Some data is unavailable: ${lifeSummary.errors.join('; ')}`)):null,
  h('div',{className:'core-module-grid'},
   h('div',{className:'core-module'},h('strong',null,t('下一次复查','Next review')),h('span',null,lifeSummary.life.nextReviewAt||t('暂无','None'))),
   h('div',{className:'core-module'},h('strong',null,t('当前运行活动','Running activity')),h('span',null,lifeSummary.life.currentActivity?.description||t('无','None'))),
   h('div',{className:'core-module'},h('strong',null,t('最近已保存经历','Latest stored experience')),h('span',null,lifeSummary.recentExperience?.summary||t('暂无','None'))),
   h('div',{className:'core-module'},h('strong',null,t('兴趣','Interests')),h('span',null,lifeSummary.state.interests.map(i=>i.name).filter(Boolean).join('、')||t('暂无','None')))));
 return h('div',null,views.life?.(),summary);
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
 const realPlatforms=status?.platforms??[],simulations=status?.simulations??[],experiences=status?.experiences??[],mcpServers=status?.mcp?.servers??[],lifeSummary=status?.lifeSummary??null;
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
 else if(['memory','state','life'].includes(tab))content=renderModuleTab({tab,status,views,lifeSummary,t,h});
 else if(tab==='persona')content=status?.modules?.persona?.mounted?h('div',{className:'core-persona-host'},h('iframe',{ref:personaFrame,title:'Amadeus Persona',src:'/api/amadeus-persona/console',className:'core-persona-frame',onLoad:()=>matchPersonaTheme(personaFrame.current,theme,getComputedStyle(shellRef.current||personaFrame.current).fontFamily)})):h('div',{className:'core-empty'},t('请启用人格模块。','Enable the Persona module.'));
 else if(tab==='platforms')content=h(PlatformPanel,{status,refresh,t});
 else if(tab==='experiences')content=h('div',{className:'core-settings'},h('section',{className:'core-card'},h('h2',null,t('经历时间线','Experience timeline')),h('p',{className:'core-card-sub'},t('按来源区分模拟与真实读取；标题和文本不代表看过完整视频。','Evidence distinguishes simulation and live reads; metadata is not full video understanding.')),(status?.experiences??[]).length?status.experiences.map(e=>h('article',{key:e.eventId,className:'core-module',style:{display:'block',margin:'10px 0'}},h('strong',null,e.platform),h('p',{style:{margin:'3px 0'}},`${e.occurredAt} · ${e.status}`),h('code',null,e.eventId))):h('p',{className:'core-note'},t('暂无经历记录。','No experiences yet.'))));
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
   h('div',{className:'core-module-grid'},
    h('div',{className:'core-module'},h('strong',null,t('Life 唤醒','Life wake')),h('span',{className:'core-badge core-badge--'+(status?.lifeDelivery?.state==='active'?'ok':status?.lifeDelivery?.state==='degraded'?'warn':'plain')},status?.lifeDelivery?.state??t('不可用','Unavailable'))),
    h('div',{className:'core-module'},h('strong',null,t('唤醒会话','Wake sessions')),h('span',null,status?.lifeDelivery?.allowedSessions??0)),
    h('div',{className:'core-module'},h('strong',null,t('外发提示','External-message opt-in')),h('span',null,t('由 Life/QQ 单独授权','Separate Life/QQ opt-in')))),
   h('div',{className:'core-actions'},
    h('button',{type:'button',className:'core-btn',disabled:busy||status?.status!=='ready'||!status?.modules?.life?.mounted||!status?.activity?.sessionId,onClick:()=>action(()=>api('/prepare-autonomous-life',{}))},t('绑定活动会话并启用 Life 唤醒','Bind Activity Session and enable Life wake'))),
   h('label',{className:'core-switch'},h('input',{type:'checkbox',checked:status?.explorationEnabled===true,disabled:busy,onChange:e=>action(()=>api('/configure',{revision:status.revision,explorationEnabled:e.target.checked}))}),h('span',null,t('允许活动会话自主使用已授权平台能力（默认关闭）','Allow Activity Session to use authorized platform capabilities (off by default)'))),
   h('div',{className:'core-fields'},
    h('label',{className:'core-field'},h('span',{className:'core-field-label'},t('单次活动总时限','Activity wall-clock limit')),h('input',{type:'number',min:10,max:300,className:'core-input',key:status?.activityBudgetMs,defaultValue:(status?.activityBudgetMs??120000)/1000,onBlur:e=>{const value=Number(e.target.value)*1000;if(value!==status.activityBudgetMs)action(()=>api('/configure',{revision:status.revision,activityBudgetMs:value}));}}),h('small',{className:'core-field-hint'},t('秒，包含模型思考；下次活动生效。','Seconds, including model thinking; next activity.'))),
    h('div',{className:'core-field core-field--static'},h('span',{className:'core-field-label'},t('活动会话','Activity session')),h('code',null,status?.activity?.sessionId??t('尚未准备','Not prepared'))),
    h('div',{className:'core-field core-field--static'},h('span',{className:'core-field-label'},t('活动状态','Activity state')),h('span',null,h('span',{className:'core-badge core-badge--'+(phase==='Paused'?'warn':phase==='Idle'?'plain':'ok')},phaseLabel)))),
   h('div',{className:'core-actions'},
    h('button',{type:'button',className:'core-btn',disabled:busy||status?.activity?.phase!=='Paused',onClick:()=>action(()=>api('/activity',{action:'resume'}))},t('在原预算内恢复活动','Resume within original budget')),
    h('button',{type:'button',className:'core-btn',disabled:busy||status?.activity?.phase==='Idle',onClick:()=>action(()=>api('/activity',{action:'finish'}))},t('安全结束当前活动','Safely finish current activity'))),
   h('p',{className:'core-note'},t('按钮只会把当前活动会话加入 Life allowlist 并启用已有 Host 唤醒；保存后需应用待重启配置。外发提示仍默认关闭，QQ 发送还需目标 Scene 自己的授权。不会创建第二套调度。','This action only adds the Activity Session to Life\'s allowlist and enables the existing Host wake; apply the pending restart afterward. External-message guidance stays off, and QQ sending still requires target Scene authorization. No second scheduler is created.'))),
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
   h('div',null,h('span',{className:'core-eyebrow'},'AMADEUS CORE'),h('h2',null,t('一个身份，持续的记忆、状态与生活。','One identity, continuous memory, state and life.')),h('p',null,t('在同一个工作区里，管理人格、记忆、状态与跨平台生活。','Manage identity, memory, state and cross-platform life in one workspace.')),h('div',{className:'core-badges'},h('span',{className:'core-badge core-badge--'+statusTone(status?.status??'loading')},status?.status??t('加载中','loading')),h('span',{className:'core-badge core-badge--accent'},`v${status?.version??'0.2.0-alpha.6'}`),h('span',{className:'core-badge'},status?.workspaceId?t('工作区已绑定','Workspace bound'):t('尚未绑定工作区','No workspace')))),
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

}});

