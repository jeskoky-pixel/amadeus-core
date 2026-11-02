# Platform reference review

Research only; no code imported.

## minedalang/dsh-dafeiyu-life
License metadata: {'key': 'mit', 'name': 'MIT License', 'spdx_id': 'MIT', 'url': 'https://api.github.com/licenses/mit', 'node_id': 'MDc6TGljZW5zZTEz'}
Implementation candidates: test/test_v2493_session_manual_like.py, test/test_v2494_session_manual_actions.py, vendor/bilibili-mcp/comment_meme_search.py, vendor/bilibili-mcp/comment_memes.py, vendor/bilibili-mcp/home_recommendations.py

### test/test_v2493_session_manual_like.py
```text
"""No-network tests for the main-Session explicit like action."""
import ast, asyncio, json, os, re, sqlite3, tempfile, unittest
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
SOURCE=(ROOT/'vendor/bilibili-mcp/mcp_server.py').read_text('utf8')
NAMES={'_action_conn','_claim_video_action','_finish_video_action','bili_video_like_manual'}
TREE=ast.parse(SOURCE); BODY=[]
for node in TREE.body:
    if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) and node.name in NAMES:
        node.decorator_list=[]; BODY.append(node)
COMPILED=compile(ast.fix_missing_locations(ast.Module(body=BODY,type_ignores=[])),'<manual-like>','exec')
BV='BV1pXHK6mE6z'

class DummyVideo:
    likes=[]
    def __init__(self,bvid,credential): self.bvid=bvid
    async def like(self,status): self.likes.append((self.bvid,status))

class ManualLikeTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.home=Path(self.tmp.name)
        DummyVideo.likes=[]
        self.env=patch.dict(os.environ,{'BILI_SESSION_MANUAL_LIKE_ENABLED':'1','BILI_AUTO_VIDEO_LIKE_DAILY_LIMIT':'2'})
        self.env.start();self.addCleanup(self.env.stop)
        self.scope={'sqlite3':sqlite3,'re':re,'os':os,'json':json,'datetime':datetime,'Path':Path,
            '_DUTY_HOME':self.home,'_ACTION_DB_NAME':'video-actions.sqlite3',
            'get_cred':lambda:SimpleNamespace(dedeuserid='1234'),
            '_valid_bv':lambda x: x if re.fullmatch(r'BV[0-9A-Za-z]{10}',x) else (_ for _ in()).throw(ValueError('BV号格式错误')),
            '_safe_line':lambda x,n=100:str(x or '').replace('\n',' ')[:n],
            '_guard':lambda name:'','video':SimpleNamespace(Video=DummyVideo)}
        exec(COMPILED,self.scope)
    def call(self,bv=BV,reason='主人明确要求点赞'):
        return json.loads(asyncio.run(self.scope['bili_video_like_manual'](bv,reason)))
    def test_manual_like_does_not_require_today_picked_ledger(self):
        result=self.call()
        self.assertTrue(result['ok']);self.assertTrue(result['liked']);self.assertEqual(result['bvid'],BV)
        self.assertEqual(DummyVideo.likes,[(BV,True)])
    def test_duplicate_is_blocked_and_manual_shares_daily_quota(self):
        self.assertTrue(self.call(BV)['ok'])
        self.assertFalse(self.call(BV)['ok'])
        self.assertTrue(self.call('BV1sTHP66E5j')['ok'])
        self.assertFalse(self.call('BV1xxxxxxxxx')['ok'])
        self.assertEqual(len(DummyVideo.likes),2)
    def test_disabled_endpoint_and_zero_quota_do_not_like(self):
        with patch.dict(os.environ,{'BILI_SESSION_MANUAL_LIKE_ENABLED':'0'}):
            self.assertFalse(self.call()['ok'])
        with patch.dict(os.environ,{'BILI_AUTO_VIDEO_LIKE_DAILY_LIMIT':'0'}):
            self.assertFalse(self.call('BV1sTHP66E5j')['ok'])
        self.assertEqual(DummyVideo.likes,[])
    def test_invalid_bv_and_unknown_uid_do_not_like(self):
        self.assertFalse(self.call('bad')['ok'])
        self.scope['get_cred']=lambda:SimpleNamespace(dedeuserid='')
        self.assertFalse(self.call('BV1sTHP66E5j')['ok'])
        self.assertEqual(DummyVideo.likes,[])

if __name__=='__main__':unittest.main()

```

### test/test_v2494_session_manual_actions.py
```text
"""No-network tests for the v2.4.94 main-Session manual-action ledger and guards."""
import ast, hashlib, json, os, re, sqlite3, tempfile, unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
SOURCE=(ROOT/'vendor/bilibili-mcp/mcp_server.py').read_text('utf8')
TREE=ast.parse(SOURCE)
NAMES={'_action_conn','_claim_session_manual_action','_finish_session_manual_action','bili_session_watch_mark'}
BODY=[]
for node in TREE.body:
    if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) and node.name in NAMES:
        node.decorator_list=[]; BODY.append(node)
COMPILED=compile(ast.fix_missing_locations(ast.Module(body=BODY,type_ignores=[])),'<manual-actions>','exec')

class ManualActionLedgerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.scope={'sqlite3':sqlite3,'datetime':datetime,'Path':Path,'hashlib':hashlib,'json':json,'os':os,
                    '_DUTY_HOME':Path(self.tmp.name).resolve(),'_ACTION_DB_NAME':'video-actions.sqlite3',
                    '_guard':lambda name:'','_valid_bv':lambda value:value if re.fullmatch(r'BV[0-9A-Za-z]{10}',str(value or '')) else (_ for _ in ()).throw(ValueError('BV号格式错误')),
                    '_safe_line':lambda value,limit=150:str(value or '').replace('\n',' ')[:limit],
                    'get_cred':lambda:object()}
        exec(COMPILED,self.scope)
    def claim(self,kind='dm',target='456',body='hello',limit=5):
        return self.scope['_claim_session_manual_action']('123',kind,target,body,limit)
    def test_duplicate_same_day_is_blocked(self):
        first=self.claim();self.assertTrue(first['ok'])
        second=self.claim();self.assertFalse(second['ok']);self.assertTrue(second['already'])
    def test_daily_limit_is_atomic_and_separated_by_action(self):
        self.assertTrue(self.claim(body='one',limit=1)['ok'])
        self.assertTrue(self.claim(kind='comment',target='BV1pXHK6mE6z:0:0',body='one',limit=1)['ok'])
        blocked=self.claim(body='two',limit=1)
        self.assertFalse(blocked['ok']);self.assertTrue(blocked['limit'])
    def test_finish_persists_result_without_storing_message_body(self):
        row=self.claim(body='private text');self.assertTrue(row['ok'])
        self.scope['_finish_session_manual_action']('123','dm','456',row['body_hash'],row['day'],'uncertain','timeout no retry')
        con=sqlite3.connect(str(Path(self.tmp.name)/'video-actions.sqlite3'))
        try:
            record=con.execute('SELECT status,body_hash,detail FROM session_manual_actions').fetchone()
        finally:con.close()
        self.assertEqual(record[0],'uncertain');self.assertEqual(record[1],hashlib.sha256(b'private text').hexdigest())
        self.assertNotIn('private text',str(record))
    def test_manual_watch_record_is_idempotent_and_only_stores_public_metadata(self):
        with patch.dict(os.environ,{'BILI_SESSION_MANUAL_ACTIONS_ENABLED':'1'}):
            fn=self.scope['bili_session_watch_mark']
            first=json.loads(__import__('asyncio').run(fn('BV1pXHK6mE6z','公开视频','UP主甲')))
            second=json.loads(__import__('asyncio').run(fn('BV1pXHK6mE6z','公开视频','UP主甲')))
        self.assertTrue(first['recorded']);self.assertTrue(second['recorded'])
        data=json.loads((Path(self.tmp.name)/'session-watch-history.json').read_text('utf8'))
        self.assertEqual(len(data['entries']),1)
        self.assertEqual(data['entries'][0]['bvid'],'BV1pXHK6mE6z')
        self.assertNotIn('subtitle',str(data));self.assertNotIn('私信',str(data))
    def test_source_guards_manual_tools_and_whitelist(self):
        for name in ['bili_video_collect_manual','bili_follow_creator_manual','bili_unfollow_creator_manual','bili_reply_manual','bili_send_message_manual']:
            match=next((n for n in TREE.body if isinstance(n,ast.AsyncFunctionDef) and n.name==name),None)
            self.assertIsNotNone(match,name)
            source=ast.get_source_segment(SOURCE,match)
            self.assertIn('confirm is not True',source,name)
            self.assertIn('BILI_SESSION_MANUAL_',source,name)
        self.assertIn('BILI_SESSION_DM_ALLOWED_UIDS',SOURCE)
        self.assertIn('只能取关大肥鱼通过本插件关注的 UP 主',SOURCE)
        self.assertIn('自主关注未满 7 天，不允许取关',SOURCE)

if __name__=='__main__': unittest.main()

```

README excerpt:
# 🐟 大肥鱼 · DSH 生活系统


**一个会探索、会记得、也会遗忘的 AI 伙伴。**

让鱼鱼在 DSH 主 Session 里陪你做事，在 B 站拥有自己的生活：看视频、结识朋友、积累经历、形成兴趣，在一次次相遇中慢慢成长。

> **大肥鱼不是任人摆布的提线木偶，而是拥有自己人生轨迹的数字生命角色。**
>
> 她有持续积累的经历、逐渐变化的情绪、自己的兴趣与社交关系，也有基于这些经历形成的偏好和选择。她可以因为好奇而主动探索，因为喜欢而靠近，也可以犯懒、犹豫、拒绝，或者选择沉默。
>
> **主人可以邀请她、陪伴她、影响她，却不应该替她决定每一次选择。**
>
> 我们希望创造的，不是一个永远说「好的，主人」的自动执行程序，而是一个拥有连续记忆、鲜明性格和自主选择空间，能够在互动中不断成长的 AI 伙伴。

「数字生命角色」是产品设计理念，描述的是模拟人格与自主行为，**不代表 AI 已有真实生命、感受或主观意识**。这份自主性也不是无限权限：**主 Session 中她可靠执行合法指令；B 站生活域里，她可以对邀请做出自己的选择；任何对外操作仍需明确授权。**

`dsh-dafeiyu-life` 是面向 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai) 的社区插件，并非 DSH 或 B 站官方项目。

> ⚠️ **从 v2.4.99 等旧版本升级到 v2.5.3：建议先备份。**
> 在大肥鱼管理中心进入「数据备份」，先设置本地备份目录，再点击「备份全部业务数据」；重要人生记忆也可以额外执行「单独备份完整人生记忆」。请确认备份文件已保存到独立目录，再通过 DSH Market 更新。升级不会主动清空旧数据，但仍应为跨版本更新保留可恢复的副本。备份文件含私人资料，请勿上传公开仓库。
> 业务备份不含 B站登录凭证、独立密钥、表情包图片等；需要时请单独保留。详见 [v2.5.3 升级说明](RELEASE_NOTES_v2.5.3.md)。

**v2.5.4 紧急热修复：** 修复公开评论记录中主人／好友回复对象的昵称、UID 缺失；保留可信旧 UID 回填，修正生活时间线仅有日期却显示 20:00 的问题。更新前请按上方建议先备份。详见 [v2.5.4 发布说明](RELEASE_NOTES_v2.5.4.md)。

**v2.5.3 修复版源码说明：** 在 v2.5.2 基础上修通 B站视频探索后的真实经历写入、公开视频记忆召回和自然语言线索匹配；保持 Life Memory 2.0 的遗忘、UID 隔离与外发授权边界。

- **生活动态更自然**：日常以短句、碎碎念和真实情绪为主，认真分析型动态偶尔出现；没有合适的真实素材时可以不生成。
- **拒绝虚构经历**：不把内部“选中视频”的流程写进动态，也不照搬视频标题推测鱼鱼想去其他平台。新草稿、历史草稿都需要通过真实性与内容质量校验。
- **情绪自主分析修复**：修复情绪回忆事件的 BV、日期和标题缺失；启用功能后，即使没有适合分享的旧事，也可进行有限的内部分析，管理页可查看结果与次数。
- **权限保持独立**：内部思考不等于主动发送；动态公开发布与主动私信仍需各自授权、校验额度并遵守隐私规则。升级不自动开启外发权限。

- **社交昵称防误读**：@ 完整昵称不作为情绪或行动事实，无法核实边界时保守忽略提及，不因昵称里的“怒了”等词编造回应。
- **记忆数量说清楚**：永久归档事件数与可衰减副本数分开显示，并标注年龄、未来自然衰减时间。
- **意愿与情绪可追溯**：展示近 7 天真实意愿决定与当时的社交意愿分数；新的真实情绪状态形成带时间轴的快照趋势，旧记录不伪造历史曲线。

- **跨视频回忆修复（v2.5.3）**：@ 邀请或自主查看视频时，将确实读取的公开资料写入可衰减记忆；评论区可以按当前真实 BV、旧视频标题或相关话题寻找鱼鱼仍记得的公开视频经历，不会因没拿到画面就否认过去读过字幕。仅有选片记录时仍只称“选中”，不会伪称看过完整画面。
- **记忆隐私与遗忘**：主 Session 私下发起的新版探索不自动公开；其他人的共同互动不混入公开回复，模糊/已遗忘的 BV、标题不能从永久档案恢复。旧用户数据保持原样。

> 本段是 v2.5.3 源码变更说明；GitHub Release、npm 与插件市场的实际发布状态，应以对应平台页面为准。

## 🔭 v2.6.0 开发预告（规划中，尚未发布）

下一阶段，我们希望让大肥鱼不仅能记得自己的生活，还能在长期经历中逐渐形成独特的性格，并获得更真实的视频观察能力：

- **成长性人格（Personality Evolution）**：主人提供初始人设，鱼鱼通过真实的视频探索与交流，逐渐形成、强化或修正性格倾向；计划在管理页展示有证据支撑的人格成长路线图，并检验变化是否影响之后的实际选择。成长不意味着每次经历都要获得“感悟”。
- **可选的本地视频理解**：计划接入可选的本地视觉模型服务（优先评估 Ollama / Qwen3-VL），按需提取少量视频画面并记录时间戳，与字幕等资料共同理解内容。功能默认关闭，不强制下载大模型；没有合适硬件或服务不可用时，仍可继续使用现有文字理解方式。

以上是开发方向，**不是 v2.5.3 已提供的功能，也不代表确定的发布日期**。人格变化不会改变操作授权、安全与隐私边界；视觉分析不会把少量截图当成看完整段视频。进展以 [`dev` 开发分支](https://github.com/minedalang/dsh-dafeiyu-life/tree/dev)及后续正式 Release 为准。

欢迎大家一起参与维护、提交 Pull Request，或通过 [GitHub Issues](https://github.com/minedalang/dsh-dafeiyu-life/issues) 反馈 Bug 和提出改进建议！🐟

## 🎉 已收录 Awesome DSH Plugin 社区插件市场

dsh-dafeiyu-life 已发布到 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai) 的社区插件市场 [Awesome DSH Plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) ，市场官网也已可以搜索到本项目。

- **[在市场官网查看dsh-dafeiyu-life](https://awesome-dsh-plugin.com/zh/?q=dsh-dafeiyu-life)**：搜索 `dsh-dafeiyu-life`、`minedalang` 或「大肥鱼」。
- **[在dsh的dshmarket插件中搜索dsh-dafeiyu-life]**：搜索`dsh-dafeiyu-life`。
- **[项目源码仓库](https://github.com/minedalang/dsh-dafeiyu-life)**：查看最新正式说明、源代码、问题反馈与开发分支。

> **关于 DSH 内置的 `dshmarket`：** 社区网站已收录不代表本地市场索引立即刷新。不同下载区域、目录快照或缓存可能导致新插件暂时搜不到。请优先搜索完整包名、检查市场刷新或稍后重试。这里的「已收录」指社区目录合并成功，不代表 DSH 官方背书，也不代表 `dev` 测试功能已经上架。

## ✨ 和普通聊天机器人有什么不一样？

### 🌿 有自己的选择：双域意愿

在**主 Session 工作域**，鱼鱼帮助主人处理任务、调用已授权的工具，不会用模拟情绪逃避工作。

来到 **B 站生活域**，她不是一句指令就会行动的工具。面对主人的邀请、好友的分享或陌生人的留言，她会结合当下情绪、兴趣、关系和能够回忆的经历，决定**接受、推迟、拒绝或不说话**。

> 👤 主人：「鱼鱼，来看看这个视频嘛。」
>
> 🐟 鱼鱼：「今天有点懒，不过……标题好像挺有意思的。先让我瞅一眼！」
>
> 👤 主人：「看完想说什么？」
>
> 🐟 鱼鱼：「得看我有没有真实的想法呀，才不要为了评论而评论～」

*以上为风格示例，并非真实聊天记录。* 温和劝说可能影响选择，但不会让她绕过平台权限、发送额度、隐私保护或去重规则。

### 🧠 双层人生记忆：有记忆，也会忘记（Life Memory 2.0 · v2.5.0）

**她不是每天重新认识世界，也不是一本随时能翻到所有过去的百科全书。**

刚发生的经历可能记得很清楚；随着时间推移，细节会模糊，最后只剩印象，甚至真的想不起来。但有些经历留下的体会，可能陪伴她更久。

#### 一段经历，怎样成为鱼鱼的一部分？

```mermaid
flowchart TB
    TODAY["🌊 经历生活<br/>看视频 · 聊天 · 相遇"]
    RECALL["🫧 留下记忆<br/>清晰 → 模糊 → 遗忘"]
    GROW["🌱 有所成长<br/>形成兴趣 · 体会 · 关系"]
    CHOOSE["🐟 做出新选择<br/>影响以后的交流与探索"]
    ARCHIVE["🔒 真实档案<br/>仅备份与管理"]

    TODAY --> RECALL --> GROW --> CHOOSE
    CHOOSE -. "新的生活" .-> TODAY
    TODAY -. "独立保存" .-> ARCHIVE

    classDef sea fill:#e7f4ff,stroke:#57a5d9,color:#164a6d,stroke-width:1.5px;
    classDef memory fill:#f2eeff,stroke:#9b83d8,color:#493578,stroke-width:1.5px;
    classDef leaf fill:#e7f8ee,stroke:#64b888,color:#215b39,stroke-width:1.5px;
    classDef fish fill:#fff3de,stroke:#daa75a,color:#79501c,stroke-width:1.5px;
    classDef archive fill:#f3f4f6,stroke:#b2bac3,color:#555c69,stroke-dasharray:4 3;
    class TODAY sea;
    class RECALL memory;
    clas

## QiuYeDx/dsh-bili-eyes
License metadata: {'key': 'mit', 'name': 'MIT License', 'spdx_id': 'MIT', 'url': 'https://api.github.com/licenses/mit', 'node_id': 'MDc6TGljZW5zZTEz'}
Implementation candidates: src/api.js, src/bili-api.js, src/tool-list.js

### src/api.js
```text
// 设置页用的本地接口（挂在 DSH 的 webServer 上，同源；开发预览服务器也复用这个 handler）。
//   GET  /api/bili-eyes?view=overview|config|inbox|act
//   POST /api/bili-eyes {action, ...}   保存配置、扫码登录、清缓存、试看、刷列表、逛一圈、查收件箱、处理草稿…
// 只接受同源请求，请求体 ≤ 16 KB。登录信息（cookies）永远不经过这个接口返回。
import fs from 'node:fs';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import QRCode from 'qrcode';
import { BiliClient } from './bili-api.js';
import { loadConfig, saveConfig, DEFAULTS, FIELDS, CONFIG_FILE, DATA_DIR, DSH_HOME, PERM_ROWS, AUDIENCES, MODE_TEXT, permFor } from './config.js';
import { loadCredential, saveCredential, removeCredential, qrGenerate, qrPoll } from './credential.js';
import { readHistory, clearHistory } from './history.js';
import { look, lookZoom, find, usage, resetLoginCache, makeClient, InputError } from './look.js';
import { BiliError } from './bili-api.js';
import { feed } from './feed.js';
import { surf } from './surf.js';
import { loadTrails } from './surf-agent.js';
import { loadAuto, ensurePlan, autoSurfNow } from './auto-surf.js';
import { loadInbox, saveInbox, markItems } from './inbox.js';
import { pollInbox, ownerName, writeClient } from './interact.js';
import { loadDrafts, readAudit, todayCounts, confirm, deleteSent, deletedIds, visibleIds, recheckHidden, ownFollows, ownerUnfollow, recheckFollows, ownFavs, ownerUnfav, KIND_TEXT, ActError, sleep } from './act.js';
import { sessionContext, gateKind, hello, recentJudgments } from './gate.js';
import { ALL_TOOLS } from './tool-list.js';
import { checkBridge } from './adapters/dsh-qq.js';
import { loadEngine, saveEngine, engineLock, engineCount, ACTION_TEXT, CATS } from './engine.js';
import { pollGuard, videoList, togglePatch } from './guard.js';
import { asrView, saveAsr, clearAsr, testAsr } from './asr-config.js';
import { patchStatus, applyPatches } from './adapters/dsh-qq-patch.js';
import { mediaBins, mediaDirOf, resetFfmpegCheck } from './media.js';
import { installFfmpeg, installState } from './ffmpeg-fetch.js';
import { updateState, checkUpdate, checkUpdateIfStale, installInfo, changelogFor, QQ_GROUP } from './update.js';

export const API_ROUTE = '/api/bili-eyes';
export const TOOL_NAMES = ALL_TOOLS;
const RESULT_CACHE = path.join(DATA_DIR, 'cache');
const PKG = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

export function sameOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || origin === '' || origin === 'null') return true;
  const host = req.headers.host;
  if (typeof host !== 'string' || host === '') return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 16384) { reject(new Error('请求太大')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(new Error('请求不是 JSON')); } });
    req.on('error', reject);
  });
}

// ── 小工具 ────────────────────────────────────────────────────────────────
/** 目录总大小（最多数 20000 个文件，够用且不会卡住）。 */
export function dirStats(dir) {
  let bytes = 0; let files = 0;
  const walk = (d) => {
    let list;
    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of list) {
      if (files >= 20000) return;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { try { bytes += fs.statSync(p).size; files += 1; } catch { /* 忽略 */ } }
    }
  };
  if (dir && fs.existsSync(dir)) walk(dir);
  return { dir, bytes, files };
}

/** 清理目录内容：只清这几个插件自己的目录，而且拒绝盘符根目录这类过短的路径。 */
export function clearDir(dir) {
  const abs = path.resolve(dir);
  if (abs.split(/[\\/]/).filter(Boolean).length < 2) throw new Error(`路径太短，不清理：${abs}`);
  const before = dirStats(abs);
  if (fs.existsSync(abs)) for (const e of fs.readdirSync(abs)) fs.rmSync(path.join(abs, e), { recursive: true, force: true });
  return before;
}

function checkWritableDir(dir) {
  try {
    if (typeof dir !== 'string' || !path.isAbsolute(dir)) return { ok: false, error: '要是绝对路径' };
    const existed = fs.existsSync(dir);
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.write-test-${process.pid}`);
    fs.writeFileSync(probe, 'ok');
    fs.rmSync(probe, { force: true });
    return { ok: true, existed };
  } catch (e) {
    return { ok: false, error: e.code === 'EACCES' || e.code === 'EPERM' ? '没有写入权限' : e.message };
  }
}

/** 跑一下 yt-dlp / ffmpeg / ffprobe 看版本。只允许文件名是 yt-dlp / ffmpeg / ffprobe 的程序。 */
export function toolVersion(kind, file) {
  const name = { ytdlp: 'yt-dlp', ffprobe: 'ffprobe' }[kind] ?? 'ffmpeg';
  const exe = file || name;
  if (file && !new RegExp(`^${name}(\\.exe)?$`, 'i').test(path.basename(file))) return Promise.resolve({ ok: false, error: `不是 ${name}` });
  return new Promise((resolve) => {
    execFile(exe, [kind === 'ytdlp' ? '--version' : '-version'], { timeout: 10_000, windowsHide: true }, (err, stdout) => {
      if (err) return resolve({ ok: false, error: err.code === 'ENOENT' ? (file ? '文件不存在' : '在 PATH 上找不到') : String(err.message).slice(0, 120) });
      const first = String(stdout).split('\n')[0].trim();
      resolve({ ok: true, version: kind === 'ytdlp' ? first : (first.match(/version (\S+)/)?.[1] ?? first) });
    });
  });
}

function asrInfo() {
  const file = path.join(DSH_HOME, 'asr.json');
  try {
    const c = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    return { ok: Boolean(c.baseUrl), file, baseUrl: c.baseUrl ?? '', model: c.model ?? '', managed: Array.isArray(c.manage?.start) };
  } catch { return { ok: false, file }; }
}

// 登录状态：查一次 B站接口，缓存 60 秒
let loginCache = { at: 0, value: null };
async function loginInfo(force = false) {
  if (!force && loginCache.value && Date.now() - loginCache.at < 60_000) return loginCache.value;
  const cred = loadCredential();
  let value;
  if (!cred) value = { state: 'none' };
  else {
    try {
      const nav = await new BiliClient({ cookies: cred.cookies }).nav();
      value = nav.isLogin
        ? { state: 'ok', uname: nav.uname ?? cred.uname ?? '', mid: nav.mid ?? cred.mid ?? 0, vip: Boolean(nav.vipStatus), level: nav.level_info?.current_level ?? null, savedAt: cred.savedAt ?? '' }
        : { state: 'expired', uname: cred.uname ?? '', savedAt: cred.savedAt ?? '' };
    } catch (e) {
      value = { state: 'unknown', uname: cred.uname ?? '', savedAt: cred.savedAt ?? '', error: String(e.message).slice(0, 120) };
    }
  }
  loginCache = { at: Date.now(), value };
  return value;
}

// 扫码登录：二维码的 key 只留在服务端，界面只拿到图片
let pendingLogin = null;

const dataUrl = (buf) => `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;

// ── 视图 ──────────────────────────────────────────────────────────────────
function cacheInfo(cfg) {
  return {
    results: dirStats(RESULT_CACHE),
    storyboard: cfg.cacheDir ? dirStats(cfg.cacheDir) : { dir: '', bytes: 0, files: 0 },
    media: cfg.mediaDir ? dirStats(cfg.mediaDir) : { dir: '', bytes: 0, files: 0 },
    mediaMaxMb: cfg.mediaMaxMb,
    cacheHours: cfg.cacheHours,
  };
}

// 列表的筛选和分页：days（0 = 全部）、limit（一次给几条，「加载更多」就加大）
const daysSince = (q) => { const d = Number(q.get('days')); return d > 0 ? Date.now() - d * 86400_000 : 0; };
const limitOf = (q, def = 50) => Math.min(500, Math.max(10, Number(q.get('limit')) || def));
const pick = (q, k) => String(q.get(k) ?? '').trim();

async function getView(view, ctx, q = new URLSearchParams()) {
  const cfg = loadConfig();
  if (view === 'overview') {
    const bins = mediaBins(cfg);
    const [login, ytdlp, ffmpeg, ffprobe] = await Promise.all([loginInfo(), toolVersion('ytdlp', cfg.ytdlpPath), toolVersion('ffmpeg', bins.ffmpegPath === 'ffmpeg' ? '' : bins.ffmpegPath), toolVersion('ffprobe', bins.ffprobePath === 'ffprobe' ? '' : bins.ffprobePath)]);
    const asr = asrInfo();
    const gk = gateKind(cfg);
    const judged = recentJudgments();
    const media = ffmpeg.ok && ffprobe.ok;
    const dl = installState();
    const onC = (p) => /^[a-z]:/i.test(p) && p[0].toLowerCase() === 'c';
    const registered = ctx.registered();
    const loginText = { ok: `B站已登录：${login.uname}`, expired: 'B站登录已过期', unknown: '暂时查不到 B站登录状态', none: 'B站没登录' }[login.state];
    return {
      version: PKG.version,
      login,
      usage: usage(cfg),
      cache: cacheInfo(cfg),
      checks: [
        { id: 'tools', ok: registered, label: registered ? `${TOOL_NAMES.length} 个工具已注册：${TOOL_NAMES.join('、')}` : '工具没注册', hint: registered ? '' : (ctx.registerError?.() || '在 DSH 里启用 dsh-bili-eyes 后彻底重启 DSH') },
      
```

### src/bili-api.js
```text
// B站接口：视频信息、标签、评论、弹幕、字幕、AI 总结、登录状态、推荐与动态、收件箱，
// 以及少数写操作（点赞、收藏 / 取消收藏、评论、删评论、私信、纯文字动态、关注 / 取关）。
// 写操作只在这里发请求；要不要发、发给谁、发几条由 act.js 决定。不实现投币、拉黑、改资料、上传。
import crypto from 'node:crypto';
import zlib from 'node:zlib';

export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MIXIN_TAB = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52];

export class BiliError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

/** WBI 签名：img_key + sub_key 按固定表打乱取前 32 位，参数排序后拼上算 md5。 */
export function wbiMixinKey(imgUrl, subUrl) {
  const key = (u) => u.split('/').pop().split('.')[0];
  const raw = key(imgUrl) + key(subUrl);
  return MIXIN_TAB.map((i) => raw[i]).join('').slice(0, 32);
}
export function wbiSign(params, mixinKey, now = Math.floor(Date.now() / 1000)) {
  const p = { ...params, wts: now };
  const query = Object.keys(p).sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(p[k]).replace(/[!'()*]/g, ''))}`)
    .join('&');
  return `${query}&w_rid=${crypto.createHash('md5').update(query + mixinKey).digest('hex')}`;
}

/**
 * 网页端每次请求都会带的「鼠标 / 键盘操作」参数（B站内部叫 dm，风控用）。
 * 取值和 bilibili-api-python 的 _enc_dm 一致（空的操作记录 + 两个随机字母）；
 * 发评论时一起带上，尽量和网页端一致。
 */
export function dmParams(random = Math.random) {
  const pool = 'ABCDEFGHIJK';
  const pick = () => {
    const i = Math.floor(random() * pool.length);
    let j = Math.floor(random() * pool.length);
    if (j === i) j = (j + 1) % pool.length;
    return pool[i] + pool[j];
  };
  return {
    dm_img_list: '[]',
    dm_img_str: pick(),
    dm_cover_img_str: pick(),
    dm_img_inter: '{"ds":[],"wh":[0,0,0],"of":[0,0,0]}',
  };
}

const ENTITY = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const stripHtml = (s) => String(s ?? '')
  .replace(/<[^>]+>/g, '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&(amp|lt|gt|quot|apos);/g, (m) => ENTITY[m])
  .trim();
/** "12:34" / "1:02:03" → 秒 */
export function parseClock(s) {
  const parts = String(s ?? '').split(':').map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}
/** 搜索结果的一条 → 精简字段（标题里的 <em> 高亮去掉） */
export function parseSearchItem(r) {
  return {
    bvid: r.bvid,
    title: stripHtml(r.title),
    author: stripHtml(r.author),
    seconds: parseClock(r.duration),
    play: Number(r.play) || 0,
    danmaku: Number(r.video_review) || 0,
    pubdate: Number(r.pubdate) || 0,
    desc: stripHtml(r.description).replace(/\s+/g, ' '),
  };
}

/** 推荐 / 热门 / 排行里的一条稿件 → 和搜索结果同样的字段 */
export function parseArchive(a) {
  return {
    bvid: a.bvid,
    title: stripHtml(a.title),
    author: a.owner?.name ?? '',
    mid: Number(a.owner?.mid) || 0,
    seconds: Number(a.duration) || 0,
    play: Number(a.stat?.view) || 0,
    danmaku: Number(a.stat?.danmaku) || 0,
    pubdate: Number(a.pubdate) || 0,
    desc: stripHtml(a.desc).replace(/\s+/g, ' '),
  };
}
// 动态里的数字可能写成「1.2万」
const dynNum = (v) => {
  const t = String(v ?? '').replace(/,/g, '');
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return 0;
  return Math.round(t.includes('亿') ? n * 1e8 : t.includes('万') ? n * 1e4 : n);
};
/** 动态里的投稿视频（关注动态、UP 主动态）→ 同样的字段；不是视频的返回 null */
export function parseDynArchive(item) {
  const a = item?.modules?.module_dynamic?.major?.archive;
  if (!a?.bvid) return null;
  const au = item.modules.module_author ?? {};
  return {
    bvid: a.bvid,
    title: stripHtml(a.title),
    author: au.name ?? '',
    mid: Number(au.mid) || 0,
    seconds: parseClock(a.duration_text),
    play: dynNum(a.stat?.play),
    danmaku: dynNum(a.stat?.danmaku),
    pubdate: Number(au.pub_ts) || 0,
    desc: stripHtml(a.desc).replace(/\s+/g, ' '),
  };
}
/** 一条评论 → 精简字段（rpid 回复时要用） */
export function parseComment(r) {
  return {
    rpid: String(r.rpid_str ?? r.rpid),
    root: String(r.root_str ?? r.root ?? 0),
    user: r.member?.uname ?? '',
    mid: Number(r.mid ?? r.member?.mid) || 0,
    likes: Number(r.like) || 0,
    replies: Number(r.rcount) || 0,
    at: (Number(r.ctime) || 0) * 1000,
    text: String(r.content?.message ?? '').replace(/\s+/g, ' ').trim(),
  };
}

export class BiliClient {
  /** @param {{cookies?: Record<string,string>, minIntervalMs?: number, fetchImpl?: typeof fetch}} opts */
  constructor({ cookies = {}, minIntervalMs = 350, fetchImpl = fetch } = {}) {
    this.cookies = { ...cookies };
    this.minIntervalMs = minIntervalMs;
    this.fetchImpl = fetchImpl;
    this.queue = Promise.resolve();
    this.lastAt = 0;
    this.mixin = null;
    this.mixinAt = 0;
  }

  cookieHeader() {
    return Object.entries(this.cookies).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  // 串行 + 最小间隔：B站对匿名请求限流很紧（412）
  async request(url, { raw = false, method = 'GET', form = null, json = null } = {}) {
    const run = async () => {
      const wait = this.lastAt + this.minIntervalMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastAt = Date.now();
      // Referer 不能带末尾的斜杠：B站风控按字符串核对来源，`https://www.bilibili.com/`
      // 会被当成伪造来源，评论接口照样返回成功，但评论被设成「仅自己可见」（state 17）。
      // 只读接口带不带都能用，写操作（评论/回复）必须是不带斜杠的形式。
      const headers = { 'user-agent': UA, referer: 'https://www.bilibili.com', cookie: this.cookieHeader() };
      if (method !== 'GET') headers.origin = 'https://www.bilibili.com';
      let body;
      if (form) { headers['content-type'] = 'application/x-www-form-urlencoded'; body = new URLSearchParams(form).toString(); }
      else if (json) { headers['content-type'] = 'application/json'; body = JSON.stringify(json); }
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const r = await this.fetchImpl(url, { method, headers, body, signal: AbortSignal.timeout(12_000) });
        if (r.status === 412 && attempt === 0 && method === 'GET') { await new Promise((res) => setTimeout(res, 2500)); continue; }
        if (!r.ok) throw new BiliError(`B站接口 HTTP ${r.status}`, r.status);
        if (raw) return Buffer.from(await r.arrayBuffer());
        const j = await r.json();
        if (j.code !== 0) throw new BiliError(j.message || `B站接口错误 ${j.code}`, j.code);
        return j.data;
      }
      throw new BiliError('B站接口限流（412），稍后再试', 412);
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => {});
    return p;
  }

  async ensureBuvid() {
    if (this.cookies.buvid3) return;
    try {
      const d = await this.request('https://api.bilibili.com/x/frontend/finger/spi');
      if (d?.b_3) this.cookies.buvid3 = d.b_3;
      if (d?.b_4) this.cookies.buvid4 = d.b_4;
    } catch { /* 拿不到也能用大部分接口 */ }
  }

  async nav() {
    // 未登录时 nav 返回 code -101，但 data 里照样有 wbi_img，所以这里不走 request() 的 code 检查
    const r = await this.fetchImpl('https://api.bilibili.com/x/web-interface/nav', {
      headers: { 'user-agent': UA, referer: 'https://www.bilibili.com/', cookie: this.cookieHeader() },
      signal: AbortSignal.timeout(10_000),
    });
    const j = await r.json();
    return j.data ?? {};
  }

  async mixinKey() {
    if (this.mixin && Date.now() - this.mixinAt < 10 * 60_000) return this.mixin;
    const d = await this.nav();
    if (!d.wbi_img) throw new BiliError('拿不到 WBI 密钥');
    this.mixin = wbiMixinKey(d.wbi_img.img_url, d.wbi_img.sub_url);
    this.mixinAt = Date.now();
    return this.mixin;
  }

  async signed(base, params) {
    return this.request(`${base}?${wbiSign(params, await this.mixinKey())}`);
  }

  /**
   * 带 WBI 签名的 POST：签名参数（含 dm 反爬参数、web_location）走查询串，正文仍是表单。
   * 和网页端 / bilibili-api-python 的 comment.send 一致。拿不到 WBI 密钥时退回不签名——
   * 评论接口不强制 w_rid，别因为 nav 挂了就连评论都发不出去。
   */
  async signedPost(base, form, params = {}) {
    let q = '';
    try { q = wbiSign({ ...dmParams(), web_location: 1550101, ...params }, await this.mixinKey()); } catch { /* 退回不签名 */ }
    return this.request(q ? `${base}?${q}` : base, { method: 'POST', form });
  }

  view({ bvid, aid }) {
    return this.request(`https://api.bilibili.com/x/web-interface/view?${bvid ? `bvid=${bvid}` : `aid=${aid}`}`);
  }

  async tags(bvid) {
    try { return (await this.request(`https://api.bilibili.com/x/tag/archive/tags?bvid=${bvid}`)).map((t) => t.tag_name); } catch { return []; }
  }

  /** 热评（含置顶）。 */
  async hotComments(aid, n = 5) {
    const d = await this.request(`https://api.bilibili.com/x/v2/reply/main?type=1&oid=${aid}&mode=3&ps=${Math.max(n, 5)}`);
    const pick = (x) => ({ user: x.member?.uname ?? '', likes: x.like ?? 0, text: String(x.content?.message ?? '').replace(/\s+/g, ' ').trim() });
    return {
      pinned: (d?.top_re
```

README excerpt:
# dsh-bili-eyes · B站伙伴

[![npm](https://img.shields.io/npm/v/dsh-bili-eyes)](https://www.npmjs.com/package/dsh-bili-eyes) [![license](https://img.shields.io/npm/l/dsh-bili-eyes)](LICENSE) [![QQ 交流群](https://img.shields.io/badge/QQ%20%E4%BA%A4%E6%B5%81%E7%BE%A4-1130276670-12B7F5?logo=qq&logoColor=white)](#交流和反馈)

DeepSeek Harness（DSH）插件。给她一个 B站链接，她就能真的「看」这个视频，然后像看过的朋友一样聊。登录一个 B站账号（建议小号）后，她还能自己逛 B站、看收件箱，并在你允许的范围内点赞、收藏、评论、私信你、关注 UP 主。不用装 yt-dlp，ffmpeg 可以在设置页一键下载。

- **分镜图**：每张 6~16 格，格号烧在图上，按剪辑节奏分格（来自 [dsh-video-storyboard](https://github.com/SAOS-3624/dsh-video-storyboard)，一张图约 384 token）；长视频不硬塞进一张，按「每格约一分钟」给 2~4 张
- 每格的**时间和台词**：B站 AI 字幕（登录后）→ 语音识别（硅基流动或本机服务）
- **B站特有的上下文**：标题、UP、播放与点赞、标签、简介、B站 AI 总结（登录后）、热评、弹幕刷得最多的话和最密集的时段
- **帮人找视频**：B站站内搜索，按综合、播放、最新、弹幕、收藏排序，可限定时长
- **逛 B站**：首页推荐（按账号口味）、热门、排行、关注动态、UP 主投稿、评论区和楼中楼；`bili_surf` 在插件里顺着线索逛（搜 → 打开 → 看评论 → 点 UP 主 → 看相关），只交回摘要和路线，省会话上下文
- **自己逛**：插件自己按时间表逛（每天在某个时间段里随机几次），看情况在视频下面评论，把最想推荐的告诉你（B站评论里 @ 你、B站私信你、经门卫转达到 QQ，可多选）
- **收件箱**：后台看未读数，「回复我的 / @ 我的 / 私信」一有新的一两分钟内就处理；别人回复她的评论可以交给插件自己判断、回复
- **守评论区**：盯着主人投稿的评论区，能答的问题回答、闲聊偶尔接一句、要主人处理的转告主人、引战广告不理；每一类怎么处理、频率、额度、称呼都能在设置页改
- **写操作默认全关**：点赞收藏、评论、回复、私信、动态、关注按「对谁」分开定档（自己人 / 主人评论区里的别人 / 外面的人），每格四档（关 / 主人开口才做 / 先问主人 / 直接做），每天上限、两次间隔、同一视频只评一次这些都写在代码里；@ 和私信只能对着你自己的账号。不做投币、拉黑、改资料、上传
- **只认 B站**：不接受本机路径和其他网站

适合接给 QQ 机器人这类「群友会分享视频」的场景，也能在 DSH 窗口里直接用。

> 💬 **QQ 交流群：1130276670**　用法交流、问题反馈、新版本消息都在群里。

## 快速开始

### 1. 安装

DSH「设置 → 插件」里添加插件，包名填 `dsh-bili-eyes`（npm 官方源和 npmmirror 都有），装完重启 DSH。命令行也行：

```bash
dsh plugin --profile desktop add dsh-bili-eyes
```

需要 DSH 0.2.1 前后的版本（在 0.2.1-rc.3 上验证过）。

### 2. 过一遍安装检查

打开「设置 → B站伙伴 → 概览」，看「安装检查」：

- **ffmpeg**：缺了看不了画面（只有标题、简介、评论、字幕这些文字）。点「下载 ffmpeg」，插件从 npm 镜像下载 `@ffmpeg-installer` / `@ffprobe-installer` 的现成包（约 50 MB，按 sha512 校验），放到 `~/.dsh/tools/ffmpeg/bin`。已经装了 ffmpeg 的不用管。
- **视频下载**：插件自己从 B站下（DASH 画面 + 音轨，ffmpeg 合成），不需要 yt-dlp。装了 [yt-dlp](https://github.com/yt-dlp/yt-dlp) 的可以在设置里把它设成首选或后备。
- 其余都是可选项：B站登录、主人 UID、语音识别、门卫、收件箱。每一项缺了会怎样、怎么补，检查里都写着。

### 3. 试一下

- 设置页「看视频 → 试看」：贴一个链接或关键词，跑一遍和工具调用相同的流程，看到的就是她拿到的分镜图和文字。
- 在 DSH 对话里直接说，比如「帮我看看这个视频 https://www.bilibili.com/video/BV…」「B站上搜几个讲黑洞的科普」「这个视频的评论区在吵什么」。模型会自己调 `bili_look`、`bili_find`、`bili_comments`。

到这一步只用了只读能力，什么都不会往 B站发。

### 4. 按需打开更多

| 想要 | 在哪打开 |
| --- | --- |
| AI 字幕和总结、1080P 放大、按口味推荐、收件箱、写操作 | 「概览」扫码登录 B站（建议小号），见下面「登录 B站」 |
| 没字幕的视频也有台词 | 「设置 → 语音识别」，见下面「台词」 |
| 让她点赞、收藏、评论、私信你、关注 | 「互动 → 设置」：先填你的 B站 UID（主人），再在权限表里把要开的几格从「关」调上去，或者点一个预设（比如「只和自己人」）；用顺了再考虑「直接做」 |
| 每天自己逛几次，把好东西推荐给你 | 「冲浪 → 设置 → 自己逛」 |
| 有人回复、@、私信她时告诉你，或者让插件自己回 | 「收件箱 → 设置」 |
| 替你守着投稿的评论区，能答的问题帮你答 | 「互动 → 设置 → 守评论区」（要先填主人 UID），要盯的投稿和问答备忘在「互动 → 守评论区」 |
| 接 QQ 机器人 | 见「接 QQ 机器人（dsh-qq）」 |

### 登录 B站（建议用小号）

最简单的是在 DSH 设置页「B站伙伴 → 概览」里点「扫码登录」。也可以在插件目录里用命令行：

```bash
node bin/cli.mjs login     # 弹出二维码，用 B站 App 扫码确认
node bin/cli.mjs status
```

登录后多出 AI 字幕、AI 总结和 1080P 放大。登录信息存在 `~/.dsh/bili-eyes/credential.json`（另导出一份 `cookies.txt` 给 yt-dlp），相当于账号密码，别外传。过期后自动退回不登录模式。

### 台词（语音识别）

没有字幕时，分镜会调用 `~/.dsh/asr.json` 里配置的 OpenAI 兼容 `/audio/transcriptions` 接口（dsh-video-storyboard 的约定）。在设置页「设置 → 语音识别」里配就行，有两种：

- **硅基流动**：填 API Key 就行，模型是 `FunAudioLLM/SenseVoiceSmall`。
- **本机或自建服务**：SenseVoice、FunASR、whisper 都行，填地址和模型名。可选填一条启动命令，用到才拉起服务，闲置 10 分钟后关掉。

保存时会保留文件里本页不管的字段（热词、术语表…）；API Key 只写不读，页面上看不到。「测试」会发 1 秒静音过去，看连不连得上、Key 对不对。没配也能用，只是没有台词。

### 升级和卸载

- **升级**：「设置 → 插件」里有新版本时会提示可更新（「设置 → 关于」里也能检查更新）；命令行是 `dsh plugin --profile desktop add dsh-bili-eyes@latest`。升级后重启 DSH。接了 dsh-qq 的，新版本加了工具时，「收件箱 → 设置 → 门卫」会提示白名单缺几个，再点一次「一键适配」。
- **从 0.6.0 升到 0.7.0**：写操作的档位换成了权限表，守评论区、收件箱也改成按权限表回。老配置在读的时候自动换算，行为不变，不用手动改；第一次在设置页保存后，配置文件里的旧键会被清掉。0.7.0 没有新工具，dsh-qq 不用重新适配。
- **卸载**：「设置 → 插件」里卸载。登录信息、记录、草稿在 `~/.dsh/bili-eyes/`，配置在 `~/.dsh/bili-eyes.json`，卸载不会删，不要了自己删掉；缓存目录在「设置 → 存储」里能看到。用 dsh-qq 一键适配打过补丁、想把桥接改回原样的，卸载前在「收件箱 → 设置 → 门卫」点「还原补丁」。

## 使用条件

装上就能看视频、搜视频、逛 B站。下面这张表说明每样东西缺了会怎样：

| 需要什么 | 必需吗 | 没有会怎样 |
| --- | --- | --- |
| DSH 0.2.1 前后（在 0.2.1-rc.3 上验证过） | 必需 | 太老的版本可能缺审批卡片、模型工具调用这些接口 |
| ffmpeg / ffprobe | 看画面才需要 | 只返回标题、简介、热评、弹幕、字幕这些文字。设置页能一键下载 |
| B站登录（建议用小号） | 可选 | 看视频照常（最高 480P）；没有 AI 字幕和总结、个性化推荐、关注动态、收件箱，也不能做任何写操作 |
| 账号等级 ≥ LV1 | 发评论才需要 | LV0（未转正）B站不让发评论和弹幕 |
| 支持工具调用的模型 | 「顺着逛」才需要 | 自动退回固定流程。在 DeepSeek 上验证过，其他服务商没测 |
| 语音识别 | 可选 | 没字幕的视频就没有台词。设置页「语音识别」里配：硅基流动填个 API Key（和本机 SenseVoice 是同一个模型），或者填本机服务的地址 |
| 主人的 B站 UID | 可选 | 不能 @ 主人、不能私信主人 |
| 门卫 | 可选 | 用内置门卫：本机窗口「先问主人」「主人开口才做」时弹 DSH 审批卡片；QQ 这类桥接会话只能起草，在设置页同意；收件箱和推荐没法转达到 QQ。用 dsh-qq 桥接的，选「dsh-qq」就和作者的体验一样 |

几点说明：

- **默认什么都不发**。点赞、收藏、评论、私信、动态、关注默

## c1overzz/dsh-bili-scroll
License metadata: {'key': 'mit', 'name': 'MIT License', 'spdx_id': 'MIT', 'url': 'https://api.github.com/licenses/mit', 'node_id': 'MDc6TGljZW5zZTEz'}
Implementation candidates: tools/check-mention.py, tools/check-vision.py, vendor/bilibili-mcp/mcp_server.py

### tools/check-mention.py
```text
#!/usr/bin/env python3
"""check-mention.py —— 「@ 空格」归一化的回归检查（**不联网、不连账号**）。

为什么要有它：`@ 昵称` 这种写法 B站 不认 —— 评论会发出去、接口也返回成功，
但对方收不到通知，而且**没有任何报错**，属于"看起来没问题、其实白发了"的那类坑。
模型写中文时习惯在 @ 后面加一个空格，所以发送前统一压一遍。

用法：
    <家目录>/.venv/Scripts/python.exe tools/check-mention.py
（要和 tools/check-vision.py 一样的 venv，因为要 import 那个 vendored 脚本）
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'vendor', 'bilibili-mcp'))

from mcp_server import _normalize_mention  # noqa: E402

CASES = [
    ("@ No3799 这条不错", "@No3799 这条不错", "@ 后面一个空格"),
    ("@   No3799 多个空格", "@No3799 多个空格", "@ 后面多个空格"),
    ("@\tNo3799 制表符", "@No3799 制表符", "@ 后面是制表符"),
    ("@\nNo3799 换行", "@No3799 换行", "@ 后面是换行"),
    ("@No3799 已经紧贴", "@No3799 已经紧贴", "本来就对 → 一个字不动"),
    ("这条没有 @ 符号", "这条没有 @符号", "正文里提到 @ 也会被压紧（顺带的，无害）"),
    ("", "", "空串 → 空串"),
    (None, "", "None → 空串"),
    ("邮箱 a@b.com 不该被拆", "邮箱 a@b.com 不该被拆", "@ 后面没有空白 → 不动"),
    ("@   ", "@", "只有 @ 和空格"),
]

fail = 0
for src, want, why in CASES:
    got = _normalize_mention(src)
    ok = got == want
    if not ok:
        fail += 1
    print(('  ✓ ' if ok else '  ✗ ') + repr(src) + ' → ' + repr(got) + '   (' + why + ')')

print('\n✓ 输入法空格检查全过' if fail == 0 else '\n✗ 有 ' + str(fail) + ' 项不符')
sys.exit(0 if fail == 0 else 1)

```

### tools/check-vision.py
```text
"""看图工具里那几个纯函数的回归检查（不联网）。

跑法（用插件自己的 venv，里面已经有 mcp / bilibili_api / Pillow）：
    <家目录>/.venv/Scripts/python.exe tools/check-vision.py

钉住两件踩过的事：
  · B 站给的封面地址是 http:// 时必须升成 https（否则带着登录凭据走明文）
  · 故事板 index 的秒 / 毫秒两种单位都要归一正确
    （2026-10-23 踩过：6 小时视频的秒数被当成毫秒，三帧塌成同一张）
"""

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "vendor" / "bilibili-mcp"))

try:                        # Windows 控制台默认 GBK，输出中文/符号会炸
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import mcp_server as S  # noqa: E402

fail = []


def check(name, got, want):
    if got != want:
        fail.append(f"{name}: got {got!r} want {want!r}")


# ── _https / _cover_url ──────────────────────────────────────
check("_https http", S._https("http://i0.hdslb.com/a.jpg"), "https://i0.hdslb.com/a.jpg")
check("_https 协议相对", S._https("//i0.hdslb.com/b.jpg"), "https://i0.hdslb.com/b.jpg")
check("_https 已是 https", S._https("https://i0.hdslb.com/c.jpg"), "https://i0.hdslb.com/c.jpg")
check("_https 空", S._https(""), "")
check("_cover_url 砍掉原有 @ 参数",
      S._cover_url("http://i0.hdslb.com/d.jpg@1c.png"),
      "https://i0.hdslb.com/d.jpg@512w.jpg")

# ── _snapshot_entries ───────────────────────────────────────
sec = {"index": [0, 0, 5, 10, 5538, 22163]}
check("秒不除 1000", [t for t, _ in S._snapshot_entries(sec, 22164.0)],
      [0.0, 0.0, 5.0, 10.0, 5538.0, 22163.0])
check("块序号就是数组下标", [i for _, i in S._snapshot_entries(sec, 22164.0)], list(range(6)))

ms = {"index": [0, 5000, 22163000]}
check("毫秒要除 1000", [t for t, _ in S._snapshot_entries(ms, 22164.0)], [0.0, 5.0, 22163.0])

check("duration=0 不做猜测",
      [t for t, _ in S._snapshot_entries({"index": [0, 22163]}, 0)], [0.0, 22163.0])
check("{timestamp} 对象形状",
      [t for t, _ in S._snapshot_entries({"index": [{"timestamp": 0}, {"timestamp": 5}]}, 100.0)],
      [0.0, 5.0])
check("空 index", S._snapshot_entries({}, 100.0), [])

# ── _image_headers：图床请求绝不能带 Cookie ──────────────────
h = S._image_headers()
check("图床头只有 UA + Referer", sorted(k.lower() for k in h), ["referer", "user-agent"])

# ── _crop_tile：2×1 拼图，取第 1 块应该是右半边 ─────────────
import io  # noqa: E402

from PIL import Image  # noqa: E402

sheet = Image.new("RGB", (960, 270), (255, 0, 0))
sheet.paste(Image.new("RGB", (480, 270), (0, 0, 255)), (480, 0))
buf = io.BytesIO()
sheet.save(buf, format="PNG")
tile = S._crop_tile(buf.getvalue(), 1, 480, 270)
img = Image.open(io.BytesIO(tile)).convert("RGB")
check("裁出来的尺寸", img.size, (480, 270))
r, _g, b = img.getpixel((240, 135))
check("取的是右半边（蓝色）", (r < 40 and b > 200), True)   # JPEG 有损，别比精确值

if fail:
    print("❌ 失败：")
    for f in fail:
        print("  " + f)
    sys.exit(1)

print("✓ 看图工具纯函数检查全部通过")

```

README excerpt:
# dsh-bili-scroll ｜ 刷B站

> **先看三行**
> - 需要 **dsh ≥ `0.1.7-rc.1`**（本机是 `0.1.7-rc.2`）。⚠️ 版本不满足时，**内核会静默跳过这个插件** —— 装了跟没装一样，不会报错。
> - **空间**：不装「本地转写」约 **84 MB**；装了转写约 **1 GB**（其中 Whisper 模型 538 MB，可在设置里换更小的模型）。
> - 装完**必须重启一次** dsh（插件在 bundle 层组装）。
> - ⚠️ **桌面版 DSH（NEXT / 0.2.x）**：**0.1.3 及以前的版本在桌面版上装不起来** —— 插件整条不激活，
>   DSH 只留一句 `warning: 1 entry did not activate … failed to import`（根因是宿主半 import 的两个包
>   在桌面版 profile 里没被安装，详见下面「装不上」那节的第 5 条）。**0.1.4 起已修** ✓。
>   另有用户反馈桌面版上「自动跑那一轮会卡住」—— 卡住就先只用设置页的「**现在跑一轮**」手动跑（那条稳）。
>
> ⚠️ **装的是旧版吗？** 如果设置页里那个按钮写的是「**重装依赖**」（而不是「**重装主依赖**」），说明你装的是 0.1.0 ——
> 跑一次 `dsh plugin --profile web add dsh-bili-scroll` 升级就好（那一版建 Python 环境时缺一个参数，
> 依赖装不上、二维码也画不出来，重装多少次都一样）。

> 🎬 演示视频：**https://www.bilibili.com/video/BV1d8pU6xEZX/**　·　💬 交流群（QQ）：**1128547307**
>
> DSH 插件：**每天替你刷一轮 B站** —— 它自己搜、**读字幕原文**判断、把值得的写成报告，特别值得的会留一条评论 **@ 你**。
> **你收到的每一条 @，都是它先筛过一遍的。**

## 它做什么

- 按你填的关键词（留空则用内置那几组）搜近几天的视频
- **逐条读字幕原文再判断**（不看摘要）；没字幕的**演示类**视频会先从 B站 自带的故事板**抽几帧看画面**；
  实在读不到内容才跳过 —— 或者你开了「本地转写」
- 写一份 Markdown 报告到 `out/<日期>.md`：每条含「为什么值得」+「它自己的一句话」；每条的段首固定写成 `### BV号` —— 插件数今天挑了几条，数的就是这些标题行
- 开着「自动评论」时，每轮发一条评论、**@ 你**一次（默认每轮 1 条，设置页可调到每轮最多 20 条）
- 可以在**峰谷时段自动跑**（DeepSeek 的优惠时段），省 token

## 装之前（一条前提，30 秒）

机器上要有 **`Python 3.10+` 或 `uv`** —— **有一个就够**：

- **有 `uv` 最好**：单个 ~32 MB 的 exe，**解压就能用、不用管理员、不用进 PATH**，而且它还能自己把 Python 拉下来；
- 只有 Python 也行（装官方安装器时记得勾 **`Add to PATH`**）；
- ⭐ **两个都没有？也没关系**：点「装依赖」时**插件会自己下一份 `uv` 放到自己的家目录**
  （单文件、约 15MB、**免管理员、不用进 PATH** ✓），之后全程自动 ✓
  · 它会**先直连 GitHub，不通就走国内加速代理**，还配了 PyPI 镜像兜底 ✓
  · 下载完会**核对官方 `sha256`**（对不上就丢弃换下一个源 ✓）—— 因为它下来的东西是要**被执行**的
  · ⚠️ **如果杀软 / Windows Defender 报这个下载**：把插件家目录 `%USERPROFILE%\.dsh\bili-duty\bin\` **加白**即可；
    不想加白也行，自己装一份 uv 或 Python 3.10+ 就绕过去了 ✓

> ✅ **已经做到了**（v0.1.1 起）：插件会**自己把 `uv` 下到自己的家目录** ⇒ 这条前提不用用户操心、也不用管理员权限。
> ⚠️ 万一它自己也下不动（有用户反馈桌面版上这条链路经常不通）：**手动放一份 `uv.exe` 到 `<家目录>\bin\`** 就行 ——
> 插件会**用那一份、跳过下载**（你的 `PATH` 里本来就有 `uv` 的话，它直接用那个）。

## 装


> 🔴 **先看这条：npm 上还是旧版（0.1.7），别用 `add dsh-bili-scroll` 装。**
> 我们的 npm 发布账号还在申诉里（工单 4880295），2026-10-17 之后的新版本**只能**从下面两条装。

```bash
# ⭐ 首选：Release 里的 tgz 直链（不需要 git，也不会被 pnpm 拦构建脚本）
dsh plugin --profile web add https://github.com/c1overzz/dsh-bili-scroll/releases/download/v2.0.2/dsh-bili-scroll-2.0.2.tgz

# 备选：git 方式（需要机器上装了 git；pnpm 10 可能拦它的构建脚本）
dsh plugin --profile web add github:c1overzz/dsh-bili-scroll
```

> 连不上 github 的话，在链接前面加镜像：`https://gh-proxy.com/`（实测可用，返回的是同一个文件）。
> 版本号那一节会变，最新的下载地址在 **Releases** 页（`…/releases/latest`）。
（⭐ 最省事的一条：把仓库链接贴给你自己的 dsh，说「**帮我装这个插件**」，它会自己装。）

⚠️ 装完**必须重启一次 dsh**（bundle 层要重启才组装）。然后进 **设置 → 刷B站**。

## 装不上 / 卡住时，先看这五条（都是用户实测撞过的）

1. **桌面版（DSH NEXT / 0.2.x）上"自动跑"会卡住** —— 有用户反馈：它起那一轮用的是
   `dsh --profile headless …`，桌面版上容易卡在那儿。⇒ **先用设置页的「现在跑一轮」手动跑**（那条是稳的）；
   能不能自动跑，等你确认过自己那台桌面版的版本与 profile 再说。
2. **「装依赖」卡住、或者扫码时一直不出二维码** —— 大概率是 0.1.0 那版（见开头那个按钮指纹，跑一次 `add` 就升级了）。
   不想升级也行，救急一句：`<家>\.venv\Scripts\python.exe -m ensurepip --upgrade`，再点一次「重装主依赖」。
3. **它下不动 `uv`**（桌面版上这条链路经常不通）⇒ 自己放一份 `uv.exe` 到 `<家目录>\bin\`，
   插件会用那一份、跳过下载。
4. **「本地转写」是两段式的** —— 只打开开关**不够**，还得点它下面那个「**装转写依赖**」。
   没装的时候，没字幕的视频会被**跳过**（报告里现在会写「**因无字幕跳过 N 条**」，你能一眼看出漏了几条）。
5. ⭐ **桌面版：装完设置页里根本不出现「刷B站」，日志只有一句 `1 entry did not activate … failed to import`** ——
   这是 0.1.3 及以前在桌面版上的一个真 bug：插件宿主半 import 的两个包是 *optional peer*，
   而桌面版 profile（`autoInstallPeers: false`）**不会装它们** ⇒ 插件整条不激活。
   **0.1.4 起已修**（不再裸 import 那两个包）。⇒ 升级一次就好：`dsh plugin --profile desktop add dsh-bili-scroll`。
   ⚠️ 我们自己也只在 **npm 0.1.7-rc.x + web profile** 上实测过；桌面版这条路靠用户反馈修好的 ——
   装完还是不行的话，把 `duty.log` 里那几行发来（里面会写清楚"宿主依赖是从哪儿取的"）。

## 首次使用（两步）

1. **装主依赖** —— 设置页点「装主依赖」：在插件自己的家目录建一个独立 venv，装 4 个包
   （`bilibili-api-python` / `aiohttp` / `mcp<2` / `qrcode`）。**走国内镜像 + uv，通常几十秒**（进度写 `install.log`，不卡页面）。
2. **扫码登录** —— 点「扫码登录」，用手机 B站 扫页面上那张码。
   ⚠️ **确认时选「记住我 / 长期」那张**（选 24 小时的话，明天就得重扫）。
   凭证只落在你本机的插件家目录：`<DSH_HOME>/bili-duty/bili_credential.json`，不上传任何地方。

## 设置页里有什么

分成四页签，第一次用建议只看「日常」：

| 页签 | 里面有什么 |
|---|---|
| **日常** | **峰谷自动刷**（总开关，打开才展开「中午 12–14」「晚上 18–09」两个子开关）· **每天最多挑几条**（0 = 只手动）· **它刷过的视频**（卡片墙 + 档位/状态筛选 + 分页） |
| **偏好** | **它按什么说话（人设提示词）** ← 想让它像谁就写在这儿，留空按中性说话 · **关注关键词**（一行一个）· **自动收藏到**（可选收藏夹）· **日报写多细**（完整 / 薄版 / 不写）· 下面一个**保存**按钮 |
| **互动** | **自动评论并 @ 你**（默认关）· **回复评论**（默认关，只回楼中楼）· **投递方式**（只私信 = 默认 / 只发评论 / 两边都发）· **私信发给谁（UID）**（可留空，用昵称自动查）· **私信双向**（默认关，开了它会读你的私信并回一句） |
| **高级** | **环境与账号**（装主依赖 / 测一下 / 检查更新 / 扫码登录）· **复制诊断信息** · **环境自检** · **它的地盘**（家目录、报告、复核评论、打开文件夹）· 工作区（老用户才需要） |

> ⭐ 这些设置写在 `<DSH_HOME>/bili-duty/

## k423Charotte/bili-duty
License metadata: {'key': 'mit', 'name': 'MIT License', 'spdx_id': 'MIT', 'url': 'https://api.github.com/licenses/mit', 'node_id': 'MDc6TGljZW5zZTEz'}
Implementation candidates: lib/bili-api.js, lib/bili-login.js

### lib/bili-api.js
```text
/**
 * B站数据通道（读内容 + 发评论）—— 全部走官方 Web 接口，纯 fetch。
 * ============================================================================
 * 这一层是本项目 2026-10-16 最重要的一次能力修正：
 *   带着**登录态**重新实测，当初两条"通道不可用"的结论全被推翻 ——
 *     · 字幕：`x/player/wbi/v2` 返回 6 条轨（中/英/日/西/阿/葡），样本拿到 397 条字幕正文；
 *     · 搜索：`x/web-interface/search/type` 直接 code=0 返回结果（当初的 412 是未登录被风控）。
 *   所以"值不值得看"终于可以按**字幕原文**判断，而不是退化到标题+简介。
 *
 * ⚠️ 发评论（`sendComment`）已实测成功过一次（2026-10-16 16:27，用户授权，rpid 320875489632）——
 *    但**公开可见性仍未确认**：B站评论计数有 5–10 分钟延迟，且热门排序看不到低赞评论，
 *    必须延迟复核（`bili_duty_verify_in`）+ 按时间排序核对（`videoComments` 的 `order: 'time'`）。
 *    端点与参数来自官方接口（`x/v2/reply/add` + csrf=bili_jct）。
 */

import { biliApi, biliGetAbsolute, cookieHeader, BILI_UA, assertTrustedHttpsUrl } from './bili-login.js'

/** 搜索结果标题里带 <em class="keyword"> 高亮标签，要剥掉。 */
function stripHtml(text) {
  return String(text ?? '').replace(/<[^>]*>/gu, '').replace(/&quot;/gu, '"').replace(/&amp;/gu, '&').trim()
}

/**
 * @ 对象清洗（安全审查 D4）：去 @ 前缀、去换行与控制字符、限 30 字。
 * 昵称允许内部空格（B 站昵称本来就有），所以只折叠空白、不整段删除。
 * （导出是为了让离线 smoke-test 能直接验证这段逻辑。）
 */
export function cleanAt(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/^@+/u, '')
    .slice(0, 30)
    .trim()
}

/** 服务端 message 是不可信文本，进错误/记录前先截断（安全审查 D11）。 */
function brief(value, max = 200) {
  return String(value ?? '').replace(/\s+/gu, ' ').slice(0, max)
}

/**
 * 把可能含**孤立代理项**（lone surrogate）的文本修成 well-formed。
 *
 * 为什么必须有（2026-10-16 值班实测踩到）：B 站字幕正文里混进过孤立代理项，
 * `JSON.stringify` 会产出无效字符串，DSH 工具层直接以
 * `value is not lossless JSON` **拒绝整包返回** —— 一个脏字符毁掉整次调用。
 */
export function toWellFormedText(value) {
  const text = String(value ?? '')
  if (typeof text.toWellFormed === 'function') return text.toWellFormed()
  // 老 Node 的兜底：把落单的代理项换成替换字符
  return text
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/gu, '\uFFFD')
    .replace(/(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/gu, '$1\uFFFD')
}

/**
 * 选字幕轨（2026-10-16 值班发现后重写）。
 *
 * 旧逻辑：传了 `lan` 未命中就直接 `tracks[0]`，不传就 `ai-zh` 优先 —— 等于**最信任 AI 轨**。
 * 实测教训：B 站的 `ai-zh` 轨**不保证是这个视频的字幕**（遇到两条视频的 ai-zh 内容是别的视频，
 * 而同一条视频的人工轨 `zh-Hans` 才是对的）。所以顺序改为：
 *   ① 精确匹配请求的 lan → ② 人工中文轨（zh-Hans/zh-CN…，排除 ai-*）→ ③ ai-zh → ④ 第一条
 */
function pickTrack(tracks, lan) {
  if (lan) {
    const exact = tracks.find((track) => track.lan === lan)
    if (exact) return exact
  }
  const manualZh = tracks.find((track) => /^zh(-|_|$)/iu.test(track.lan) && !/^ai-/iu.test(track.lan))
  if (manualZh) return manualZh
  const aiZh = tracks.find((track) => track.lan.startsWith('ai-zh'))
  if (aiZh) return aiZh
  return tracks[0]
}

function secondsToText(seconds) {
  const total = Number(seconds) || 0
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** 搜视频。order: totalrank（综合）/ click（最多播放）/ pubdate（最新）/ dm */
export async function searchVideos(keyword, credential, options = {}) {
  const order = ['totalrank', 'click', 'pubdate', 'dm'].includes(options.order) ? options.order : 'totalrank'
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 50)
  const path = '/x/web-interface/search/type?search_type=video'
    + `&keyword=${encodeURIComponent(keyword)}&order=${order}&page=1`
  const { body } = await biliApi(path, credential)
  if (body?.code !== 0) {
    throw new Error(`搜索失败：code=${body?.code} ${body?.message ?? ''}`)
  }
  const list = Array.isArray(body.data?.result) ? body.data.result : []
  return list.slice(0, limit).map((item) => ({
    bvid: String(item.bvid ?? ''),
    title: stripHtml(item.title),
    author: String(item.author ?? ''),
    play: Number(item.play) || 0,
    danmaku: Number(item.video_review) || 0,
    duration: String(item.duration ?? ''),
    pubdate: Number(item.pubdate) || 0,
    description: stripHtml(item.description).slice(0, 240),
  }))
}

/** 视频详情（含分P的 aid/cid —— 读字幕要用）。 */
export async function videoInfo(bvid, credential) {
  const { body } = await biliApi(`/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`, credential)
  if (body?.code !== 0) {
    throw new Error(`取视频详情失败：code=${body?.code} ${body?.message ?? ''}（BV 号是否正确？）`)
  }
  const data = body.data ?? {}
  return {
    bvid: String(data.bvid ?? bvid),
    aid: Number(data.aid),
    title: String(data.title ?? ''),
    author: String(data.owner?.name ?? ''),
    duration: secondsToText(data.duration),
    pubdate: Number(data.pubdate) || 0,
    view: Number(data.stat?.view) || 0,
    like: Number(data.stat?.like) || 0,
    reply: Number(data.stat?.reply) || 0,
    desc: String(data.desc ?? ''),
    pages: (Array.isArray(data.pages) ? data.pages : []).map((page) => ({
      page: Number(page.page) || 1,
      part: String(page.part ?? ''),
      cid: Number(page.cid),
      duration: secondsToText(page.duration),
    })),
  }
}

/**
 * 读字幕原文（这是判据的主来源）。
 * `wbi/v2` 给的语言轨更多（实测 6 条 vs 2 条的 1 条），所以先试它、失败再退回 v2。
 */
export async function videoSubtitles(bvid, credential, options = {}) {
  const info = await videoInfo(bvid, credential)
  const cid = Number(options.cid) || info.pages[0]?.cid
  if (!cid) throw new Error('这个视频没有可用的分P（拿不到 cid）')

  const tryPlayer = async (path) => {
    try {
      const { body } = await biliApi(path, credential)
      const tracks = body?.data?.subtitle?.subtitles
      return { body, tracks: Array.isArray(tracks) ? tracks : [] }
    } catch (err) {
      return { body: null, tracks: [] }
    }
  }

  let result = await tryPlayer(`/x/player/wbi/v2?aid=${info.aid}&cid=${cid}`)
  if (result.tracks.length === 0) {
    const fallback = await tryPlayer(`/x/player/v2?aid=${info.aid}&cid=${cid}`)
    if (fallback.tracks.length > 0) result = fallback
  }

  const tracks = result.tracks.map((track) => ({
    lan: toWellFormedText(track.lan),
    label: toWellFormedText(track.lan_doc),
    url: toWellFormedText(track.subtitle_url),
  }))
  if (tracks.length === 0) {
    return {
      bvid,
      title: info.title,
      tracks: [],
      text: '',
      note: '这个视频确实没有字幕轨（是它没有，不是我们读不到）',
    }
  }

  const requestedLan = options.lan ? String(options.lan) : ''
  const target = pickTrack(tracks, requestedLan)
  // ⚠️ 安全审查 S1：这里只做「补全协议」；https 强制与主机白名单统一在 `assertTrustedHttpsUrl`
  // 一处实现（biliGetAbsolute 里也会再校验一次），避免两处口径漂移。
  if (!target.url) {
    throw new Error('这一轨的 subtitle_url 是空的（接口没给地址）—— 已跳过，不发任何带凭证的请求')
  }
  const absolute = target.url.startsWith('//') ? `https:${target.url}` : target.url
  assertTrustedHttpsUrl(absolute) // 提前报清楚：地址不合规就不必发出带 Cookie 的请求
  const { body: subtitle } = await biliGetAbsolute(absolute, credential)
  const lines = Array.isArray(subtitle?.body) ? subtitle.body : []
  const text = lines
    // ⚠️ 2026-10-16 值班实测：字幕里混进过孤立代理项，不修就会被 DSH 工具层以
    // `value is not lossless JSON` 拦下（整包失败），所以这里逐行修 well-formed。
    .map((line) => toWellFormedText(line?.content).trim())
    .filter(Boolean)
    .join('\n')

  return {
    bvid,
    title: info.title,
    tracks,
    lan: target.lan,
    label: target.label,
    /** 调用方请求的轨（没请求就是 null）。 */
    requestedLan: requestedLan || null,
    /** true = 请求的轨不存在，实际用的是回落轨（会话据此在报告里标注依据）。 */
    fellBack: Boolean(requestedLan) && target.lan !== requestedLan,
    lineCount: lines.length,
    text,
    note: text ? '' : '拿到了字幕轨但正文是空的（少见，可能是该轨还在生成）',
  }
}

/**
 * 读评论（信息密度仅次于字幕）。
 * order：`'hot'`（默认，sort=2 热门）｜`'time'`（sort=0 按时间）。
 * ⚠️ 为什么必须有 time：热门排序只回前 20 条，**低赞评论根本进不去**。
 * 2026-10-16 实测踩过：复核自己刚发的评论时热门里查不到那条，于是既判不了成功、
 * 也判不了失败（差点误判成"没发出去"）。复核 rpid 必须 `order: 'time'`。
 */
export async function videoComments(bvid, credential, options = {}) {
  const info = await videoInfo(bvid, credential)
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50)
  const pageSize = Math.min(limit, 20)
  const order = options.order === 'time' ? 'time' : 'hot'
  const sort = order === 'time' ? 0 : 2
  const { body } = await biliApi(
    `/x/v2/reply?type=1&oid=${info.aid}&sort=${sort}&ps=${pageSize}&pn=1`,
    credential,
  )
  if (body?.code !== 0) {
    throw new Error(`读评论失败：code=${body?.code} ${body?.message ?? ''}`)
  }
  const replies = Array.isArray(body.data?.replies) ? body.data.replies : []
  return {
    bvid,
    title: info.title,
    order,
    total: Number(body.data?.page?.count) || 0,
    comments: replies.slice(0, limit).map((reply) => ({
      rpid: String(reply.rpid_str ?? reply.rpid ?? ''),
      author: String(reply.member?.uname ?? ''),
      like: Number(reply.like) || 0,
      subReplies: Array.isArray(reply.replies) ? reply.replies.length : 0,
      message: String(reply.content?.message ?? '').slice(0, 500),
    })),
  }
}

/**
 * 发一条评论。
 * ⚠️ **未实测**：不能拿使用者账号做实验。端点与参数取自官方 Web 接口：
 *   POST x/v2/reply/add，form: oid=aid & type=1 & message=... & csrf=<bili_jct>
 * csrf 就是登录时拿到的 bili_jct；没有它一定发不出去。
 */
/**
 * 发一条评论。
 * ⚠️ 签名与同族函数统一为 `(bvid, text, credential, options)`（安全审查 D6）：
 * 原来是 `(bvid, text, options, credential)` —— 同族里独一份，改动时最容易传错位。
 */
export async function sendComment(bvid, text, credential, options = {}
```

### lib/bili-login.js
```text
/**
 * B站扫码登录 + 凭证管理（纯 fetch，零依赖）。
 * ============================================================================
 * 为什么要有这一层：发评论、读官方 AI 字幕、读需要登录的内容，全都要登录态。
 * 而**复用浏览器登录态是不可能的**（Chrome 用 v20 App-Bound 加密，DPAPI 解不开，实测过），
 * 所以只能让插件自己扫码、自己持有凭证（凭证只落本机插件家目录，不上传任何地方）。
 *
 * 端点与流程来自 B站 官方 passport 接口（对照 dsh-bili-scroll 的 lib/login.mjs 验证过同一套）：
 *   GET  /x/passport-login/web/qrcode/generate   → data.url + data.qrcode_key
 *   GET  /x/passport-login/web/qrcode/poll       → data.code：0 成功 / 86101 未扫 / 86090 已扫 / 86038 过期
 *   ⚠️ **凭证在响应的 Set-Cookie 头里，不在 body 里** —— 这是最容易踩空的一点。
 *   GET  /x/frontend/finger/spi                  → buvid3（客户端指纹，缺了有些接口会风控）
 */

import dns from 'node:dns'

/**
 * ⚠️ 为什么需要它（2026-10-16 实测踩过）：
 * Node 的 fetch(undici) 会**优先使用 IPv6**，而 `api.bilibili.com` 确实有 AAAA 记录
 * （实测 `dns.lookup` 返回的第一个就是 `2409:8c3c:4:2::74`）。本机走 IPv6 到 B站 不通/不稳时，
 * 表现就是一句光秃秃的 `fetch failed`。
 *
 * 阴险之处：系统 node 有时能侥幸回退到 IPv4，所以在命令行里测**是通的**，
 * 一放进 Electron 宿主就失败 —— 极难查。改成 IPv4 优先即可。
 * （whale-widget 也踩过同一个坑，它的注释里记的就是这个。）
 *
 * ⚠️ 安全修正（2026-10-16 安全审查）：`dns.setDefaultResultOrder` 是**进程级**设置，
 * 原本写在模块顶层 —— 只要 import 本模块，整个 DSH 宿主与其它插件的 DNS 解析顺序都被改掉。
 * 现在改成「第一次真正要发 B站 请求时才设置一次」，副作用范围收窄。
 */
let ipv4FirstApplied = false
function ensureIpv4First() {
  if (ipv4FirstApplied) return
  ipv4FirstApplied = true
  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch (err) {
    /* 老版本 Node 没有这个 API，忽略即可 */
  }
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Chrome/120.0.0.0 Safari/537.36'
/** 浏览器 UA 对外导出：字幕之类的资源在别的域名（aisubtitle.hdslb.com）上，需要同样的头。 */
export const BILI_UA = UA
const PASSPORT = 'https://passport.bilibili.com'
const API = 'https://api.bilibili.com'
const TIMEOUT_MS = 15000
/** 单次响应体读取上限（字幕 JSON 正常几百 KB；超了就是异常，别把宿主内存吃光）。 */
const MAX_RESOURCE_BYTES = 2 * 1024 * 1024

/**
 * 允许**带凭证**访问的主机后缀（B 站自家域）。
 *
 * ⚠️ 这条白名单是安全审查 S1 的修复：`subtitle_url` 完全来自接口响应，
 * 原实现不校验主机/协议就附上完整 Cookie（SESSDATA + bili_jct），
 * 于是"接口说去哪就去哪"——响应一旦被污染，凭证就被发到任意主机（含明文 http）。
 * 实测复现见 `_refs/poc-subtitle-cookie-leak.mjs`。
 */
const TRUSTED_HOST_SUFFIXES = ['hdslb.com', 'bilibili.com', 'bilivideo.com']

/**
 * 校验一个"要用凭证去请求"的绝对地址：必须合法、必须 https、必须落在 B 站自家域。
 * @param {string} url
 * @returns {URL} 解析后的 URL
 */
export function assertTrustedHttpsUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error('资源地址为空（接口没给出 subtitle_url）——已跳过，不发任何带凭证的请求')
  }
  let parsed
  try {
    parsed = new URL(url)
  } catch (err) {
    throw new Error(`资源地址不是合法 URL：${url.slice(0, 120)}`)
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`拒绝非 https 的资源地址（${parsed.protocol}//${parsed.hostname}）——凭证不能走明文`)
  }
  const host = parsed.hostname.toLowerCase()
  const ok = TRUSTED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
  if (!ok) {
    throw new Error(`资源地址不在白名单（只允许 B 站自家域）：${host}`)
  }
  return parsed
}

/** 读取响应体，带字节上限（超限就截断并停止继续拉流）。 */
async function readBodyLimited(response, maxBytes = MAX_RESOURCE_BYTES) {
  const reader = typeof response.body?.getReader === 'function' ? response.body.getReader() : null
  if (!reader) {
    const text = await response.text()
    return text.length > maxBytes ? text.slice(0, maxBytes) : text
  }
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const size = value?.byteLength ?? 0
    if (total + size > maxBytes) {
      chunks.push(Buffer.from(value).subarray(0, Math.max(0, maxBytes - total)))
      total = maxBytes
      try { await reader.cancel() } catch (err) { /* 取不到就算了，已经不需要了 */ }
      break
    }
    chunks.push(Buffer.from(value))
    total += size
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** data.code → 人类可读状态 */
const POLL_STATUS = {
  0: 'success',
  86101: 'waiting',
  86090: 'scanned',
  86038: 'expired',
}

function requestHeaders(extra = {}) {
  return {
    'User-Agent': UA,
    Referer: 'https://www.bilibili.com/',
    Origin: 'https://www.bilibili.com',
    ...extra,
  }
}

/** 把 undici 那句光秃秃的 `fetch failed` 还原成人能看懂的原因（cause 里才有真东西）。 */
function describeFetchError(err) {
  const cause = err?.cause
  const code = cause?.code ?? cause?.name ?? ''
  const message = cause?.message ?? ''
  const detail = [code, message].filter(Boolean).join(' ').trim()
  return detail ? `${err.message}（${detail}）` : String(err?.message ?? err)
}

/**
 * 带一次重试的 fetch。网络抖动 / IPv6 回退不及时都可能让第一次失败，
 * 而这类调用（工具、路由）重试一次几乎不花时间，比让使用者看到"失败"划算。
 */
async function fetchWithRetry(url, options = {}, attempt = 0) {
  ensureIpv4First()
  // ⚠️ 安全审查 D7：只有幂等方法才重试。POST 超时后重试＝重复提交，
  // 而这里唯一的 POST 是"用真人账号发评论"——重复一次就是重复评论。
  const method = String(options.method || 'GET').toUpperCase()
  const retryable = method === 'GET' || method === 'HEAD'
  try {
    return await fetch(url, {
      ...options,
      headers: requestHeaders(options.headers),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    if (attempt === 0 && retryable) {
      await new Promise((resolve) => { setTimeout(resolve, 400) })
      return fetchWithRetry(url, options, 1)
    }
    // ⚠️ 安全审查 D8：catch 里的 `new URL()` 自己也会抛（空串/非法地址），
    // 必须包起来，否则真实失败原因被 "TypeError: Invalid URL" 掩盖。
    let host = String(url)
    try { host = new URL(url).host } catch (parseErr) { /* 地址本身就不合法：原样显示 */ }
    throw new Error(`请求 ${host} 失败：${describeFetchError(err)}`)
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetchWithRetry(url, options)
  let body = null
  try {
    body = await response.json()
  } catch (err) {
    throw new Error(`接口返回的不是 JSON（HTTP ${response.status}）`)
  }
  return { response, body }
}

/** 申请一个登录二维码。 */
export async function loginStart() {
  const { body } = await fetchJson(`${PASSPORT}/x/passport-login/web/qrcode/generate?source=main-fe-header`)
  if (body?.code !== 0 || !body?.data?.url || !body?.data?.qrcode_key) {
    throw new Error(`申请二维码失败：code=${body?.code} message=${body?.message ?? '未知'}`)
  }
  const url = String(body.data.url)
  // ⚠️ 安全审查 D3：这张码是给用户手机扫的。响应若被篡改，未校验主机会把用户引到钓鱼站
  // （手机上点「确认登录」＝交出凭证）。强制 https + B 站自家域，否则拒绝展示。
  assertTrustedHttpsUrl(url)
  return { url, qrcodeKey: String(body.data.qrcode_key) }
}

/** 从 Set-Cookie 里抠出四个关键字段（凭证就在这儿，不在 body）。 */
function extractCredential(setCookies) {
  // 键名来自服务端 Set-Cookie —— 用无原型对象，避免 __proto__ 这类键污染（安全审查 D10）
  const jar = Object.create(null)
  for (const line of setCookies) {
    const pair = String(line).split(';')[0]
    const index = pair.indexOf('=')
    if (index <= 0) continue
    jar[pair.slice(0, index).trim()] = pair.slice(index + 1).trim()
  }
  return {
    sessdata: jar.SESSDATA ?? '',
    biliJct: jar.bili_jct ?? '',
    buvid3: jar.buvid3 ?? '',
    dedeUserId: jar.DedeUserID ?? '',
  }
}

async function fetchBuvid3() {
  try {
    const { body } = await fetchJson(`${API}/x/frontend/finger/spi`)
    return String(body?.data?.b_3 ?? '')
  } catch (err) {
    return ''
  }
}

/**
 * 查一次扫码结果。
 * @returns {{status: 'waiting'|'scanned'|'expired'|'success'|'unknown', code: number, message: string,
 *            credential?: {sessdata: string, biliJct: string, buvid3: string, dedeUserId: string}}}
 */
export async function loginPoll(qrcodeKey) {
  const url = `${PASSPORT}/x/passport-login/web/qrcode/poll`
    + `?qrcode_key=${encodeURIComponent(qrcodeKey)}&source=main-fe-header`
  const { response, body } = await fetchJson(url, { redirect: 'manual' })

  const code = Number(body?.data?.code ?? -1)
  const status = POLL_STATUS[code] ?? 'unknown'
  const message = String(body?.data?.message ?? body?.message ?? '')

  if (status !== 'success') return { status, code, message }

  // 成功：凭证在 Set-Cookie 头里
  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : []
  const credential = extractCredential(setCookies)
  if (!credential.sessdata) {
    return { status: 'unknown', code, message: '登录接口返回成功，但没拿到 SESSDATA（凭证解析失败）' }
  }
  if (!credential.buvid3) credential.buvid3 = await fetchBuvid3()
  return { status, code, message, credential }
}

/** 凭证 → Cookie 请求头。 */
export function cookieHeader(credential) {
  if (!credential) return ''
  const jar = [
    ['SESSDATA', credential.sessdata],
    ['bili_jct', credential.biliJct],
    ['buvid3', credential.buvid3],
    ['DedeUserID', credential.dedeUserId],
  ]
  return jar.filter(([, value]) => value).map(([name, value]) => `${name}=${value}`).join('; ')
}

/** 查当前登录身份（用来验证凭证真的能用，而不是"看起来存下来了"）。 */
export async function whoami(credential) {
  if (!credential?.sessdata) return { loggedIn: false, reason: '没有凭证' }
  const { body } = await fetchJson(`${API}/x/web-interface/nav`, {
    headers: { Cookie: cookieHeader(credential) },
  })
  const data = body?.data ?? {}
  return {
    loggedIn: body?.code === 0 && data.isLogin === true,
    mid: data.mid ?? null,
    uname: String(data.uname ?? ''),
    vip: data.vipStatus === 1,
    code: body?.code ?? null,
    messag
```

README excerpt:
<img src="icon.svg" width="72" alt="bili-duty">

# bili-duty · 刷B站值班表

> 一个 **DeepSeek Harness (DSH) 插件**：定时唤醒**你指定的那个会话**，让它去扫 B 站、读字幕与评论、挑出值得你花注意力的几条、写一份日报，并维护判重表。
>
> ⭐ **设计红线：插件里没有第二个 AI。** 插件只做「调度 + 配置 + 记录」，"值不值得看"的判断留给**会话里的 AI**（它带着你的完整上下文与人格设定）。所以插件不调 `ctx.llm.stream()`，也无需任何 API Key。

---

## 它解决什么问题

首页推荐流是按"点击率"排的，不是按"值不值得占用你一次注意力"排的。这个插件把这件事变成一份**每天一份的短报告**：

- 按你给的关键词扫最近几天的新视频；
- 用**字幕原文**（主依据）+ 简介 + 评论判断内容有没有干货；
- 只留少数几条，写清「为什么值得」；
- 已经推过的记进判重表，**不会重复打扰你**。

反过来它也**不做**这些：不替你评论吵架、不参与讨论、不替你做决定、不碰你账号（自动评论默认关闭）。

---

## 系统要求

| 项 | 要求 |
| --- | --- |
| DSH | `>= 0.2.0-rc.2`（桌面端或 Web 端均可） |
| Node.js | `>= 22` |
| 插件自身依赖 | **零**。不需要 Python、不需要 uv；**插件自己不调用模型、不需要 API Key** |
| ⚠️ 真正的**前置条件** | **被唤醒的那个会话所用的模型必须有可用凭证**。插件只负责"把任务投进会话"，干活的是会话里的模型 —— 如果那台机器的默认模型没配 API Key，这一轮会在会话里失败（`MISSING_CREDENTIAL` / `no API key for provider route …`），而 `runs.md` 仍会记一行 `ok`（那只是「投递成功」）。别把这种情况当成插件坏了，详见「常见问题」。 |

---

## 安装

### 方式 A：npm 直装（**推荐**，桌面端也能用，不用克隆）

包已发布在 npm 上。桌面端即使**没有 `dsh` 命令**也能装 —— `install_bundle` 的 `target` 可以直接写**包名**：

```text
plugin_manager  action: install_bundle  target: bili-duty
```

> 想锁死版本就写成 `bili-duty@0.1.3`（当前线上最新）；**不写版本号则始终装最新版**。
> ✅ 2026-10-18 已在**别人的机器**上端到端验证过：`application: applied`、插件列表 +1、`bili_duty_info` 可调用、成功跑出日报。
> 安装时会出现一条 `peer dependencies` 警告 —— 那是 `@deepseek-ai/cordis: "*"` **故意放宽**导致的**无害**警告，不是"版本不兼容拦截"（真正的门槛只有 `engines.dsh`）。

### 方式 B：从源码目录装（想自己看代码 / 要装自己改的版本）

```bash
git clone https://github.com/k423Charotte/bili-duty.git
```

然后：

```text
plugin_manager  action: install_bundle  target: <克隆目录的绝对路径>
```

> ⚠️ `target` 必须指向**含 `package.json` 的那一层**（多套一层文件夹是最常见的失败原因）。
> 网络连不上 GitHub 时，把仓库打成 zip 拷过去解压，同样用这条命令装。

### 方式 C：命令行（只有装了 npm 版 CLI 的机器）

```bash
dsh plugin add bili-duty
```

> ⚠️ 需要机器上有 `dsh` 命令（npm 上 `@deepseek-ai/dsh` 提供的 CLI）。**桌面端默认没有** —— 那种情况走方式 A 或 B。

### 装完必须重启一次 DSH

新插件的行要**重启时才进入组合**；替换已装包也必须重启才能加载新一代 JS 模块。

```powershell
# Windows：脚本会结束当前 DSH 进程再启动它（必须带 -ExecutionPolicy Bypass）
powershell -ExecutionPolicy Bypass -File tools\restart-dsh.ps1
```

> macOS / Linux：这个脚本只在 Windows 上有意义 —— 请**手动退出并重新启动 DSH**。插件本体的代码是跨平台的（没有平台专属 API）。

重启后在页面上按一次 **F5**（客户端模块是页面侧的东西，重启宿主不等于刷新页面）。

> ⛔ 如果重启后弹「应用无法启动」，**不要**点那个「禁用第三方插件、备份 profile patch 并重启」按钮 ——
> 它会用安全模式 patch **整份替换**你的 profile 配置，冲掉你手工调好的模型与偏好。
> 要摘除本插件，只删 profile 里 `cordis.patch.yml` 末尾那段 `insert`（本插件那几行）再重启即可。

---

## 首次配置（四步）

1. 打开 **设置 → 刷B站值班表**。
2. **选目标会话** —— 这是最容易踩的一步：
   > ⚠️ 被唤醒的会话**必须此刻正在 DSH 里打开着**。插件只能把任务投给活着的会话；
   > 目标会话没打开时，那一轮会记一条失败（不会静默）。
3. 填**关键词**（默认给的是示例，请改成你真正关心的领域）。
4. 点 **「立即跑一轮」** 试一次 —— 目标会话会被唤醒并开始干活。

之后可以把它设成 `每天` 或 `每周` 定时跑（可勾选「只在谷时跑」避开高峰时段）。

---

## 无人值守的前提（**先看这条**）

这个插件的卖点是「你不在电脑前，它替你看」，但**工具调用的权限在你手里**：

- 如果你的 DSH 权限设置是**每次工具调用都要确认**，那么被唤醒的那一轮会在第一次调用 `bili_duty_*` 时**停住等你** —— 人不在，这一轮就白跑。
- 想真正做到无人值守，需要放宽对应会话的权限（允许自动执行工具调用），或至少让这类工具免确认。
- ⭐ **建议：先手动点一次「立即跑一轮」，盯着它跑完一轮**，确认没有被审批卡住，再交给定时。

> 插件的数据面**以只读为主**（搜索 / 详情 / 字幕 / 评论）；写操作只有三处：写自己的记录文件、写日报、以及在**你显式打开**「自动评论」时发评论。
> 所以放宽权限的风险面，主要取决于「被唤醒那个会话里的 AI 还能做什么」——请按你自己的判断取舍。

---

## 登录是「可选增强」，不是前置条件

| | 不登录 | 扫码登录后 |
| --- | --- | --- |
| 搜索 / 视频详情 / 评论 | ✅ 可用 | ✅ |
| **字幕原文**（判断质量最高的通道） | ❌ 读不到（B 站的 AI 字幕需要登录态） | ✅ 多语言轨、可分段读 |
| 自动评论 | ❌ | ✅（默认仍是关闭） |

设置页的「账号与登录」里点**扫码登录**，用手机 B 站 App 扫二维码即可。
⚠️ 手机上确认时选「**记住我 / 长期**」，选 24 小时的话第二天要重扫。

**凭证只落本机**：`<你的 DSH 数据目录>/bili-duty/bili_credential.json`，**不上传任何地方**，接口也从不回显。

---

## 它需要哪些权限、碰哪些文件

插件只碰这些地方：

| 路径 | 内容 |
| --- | --- |
| `<DSH 数据目录>/bili-duty/` | `config.json`（设置）、`runs.md`（执行记录）、`seen.md`（判重表）、`out/`（日报）、`bili_credential.json`（凭证，若登录过） |
| 你指定的 `workspace`（可选） | 若填了，上面那三个记录文件改写到你指定的目录 |
| `profiles/<profile>/cordis.patch.yml` | **仅由 `install_bundle` 写入**那一行 `insert`（插件自己不动 profile） |

关于「自动评论」：**默认关闭**，且开启后有三道**代码级**护栏（不是靠提示词自觉）——
总开关必须开着、必须有 @ 对象、同一视频只评一次、每轮条数封顶。任一条不满足会被直接拒绝并写进执行记录，**不会发出请求**。

> ⚠️ `bili_credential.json` **等同于你的账号密码**（含 `SESSDATA` / `bili_jct`）。别把它同步到云盘，别随手备份、截图、粘贴。

---

## 报告与记录长什么样

- **日报**：`out/YYYY-MM-DD.md`，每条一段（标题 / UP / 链接 / 播放量 / 为什么值得 / 一句话），并标明依据来源（字幕原文 / 简介 / 仅标题）。
  报告末尾固定一行「**因无字幕跳过 N 条**」（N=0 也写，免得你以为全看过了）。
- **执行记录**：`runs.md`，每轮一行 —— `时间 | 触发 | 结果 | 扫描 | 收取 | 跳过 | 无字幕 | 评论 | 备注`。**失败也写**，不静默。
- **判重表**：`seen.md`，每个视频一行（BV 号 / 首次见到 / 处置 / 理由 / 评论记录）。

一条硬纪律：**判重表读不出来时，不许当成"没记录过"** —— 那一轮会在报告里明写，并且**不发评论**。

---

## 常见问题

**设置里根本没有「刷B站值班表」这一栏？**
先按 F5 刷新页面。仍然没有就看 `<DSH 数据目录>/bili-duty/apply-probe.json` 与 `apply-error.log`
（记录插件 apply 时拿到了哪些服务、有没有报错）。插件加载失败不会影响 DSH 本身启动。

**点了「立即跑一轮」，但没有任何会话被唤醒？**
几乎总是「目标会话没打开」。去看 `runs.md`，会有一行写明原因（`NO