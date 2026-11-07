# 如何登录 / Account connection

## Bilibili
在隔离 Core → 平台 → Bilibili → 账号，阅读“网页扫码”说明并主动勾选，再点击开始授权。用本人 B站 App 扫描本地生成的二维码并确认，然后点检查授权状态。无需发送密码、Cookie 或 Token。该方式为网站登录适配，不是官方开放平台 OAuth；遇到风控或验证码请由本人处理，Core 不绕过。

登录后先验证身份，再在自主活动页开启平台、浏览页只打开详情读取，用一个 BV 号做只读测试，检查经历显示 live-read/metadata。只有元数据不代表看过视频。此 B站适配器不支持真实社交操作。未登录也可尝试少量公开详情，但不保证所有请求可用。

## 小红书
先在 https://openaccount.xiaohongshu.com/console/apps 申请并审核通过自己的 Web 应用及设备授权能力。在平台账号页输入 App ID 和只写 App Secret（仅留在 Host 内存），点击开始授权，用本人小红书 App 扫码或打开官方验证入口完成授权，再检查状态。

当前官方仅开放 basic_info。连接成功后可验证昵称和 open_id；不会因此开放笔记搜索、推荐流、评论或发布。需要主动远程解绑的应用还须申请对应能力。没有应用批准时，界面会显示缺少配置，不能跳过。

## 重启、取消与撤销
凭据暂不持久化，Host 重启后需重新登录。配置、权限、账号历史及原有记忆不清空；真实平台不会继承 Mock 授权。取消/退出/切换会清除本地凭据并撤销平台权限。若远程撤销不支持/失败，请到平台账号安全页处理；Core 不会谎报远程撤销成功。

## 本人联调清单
先确认隔离环境与正确账号；验证身份；B站只读详情→评论/相关内容（可能被限流）；检查经历与重启配置；再考虑只读自主探索。官方小红书适配器只验账号身份；独立浏览器模式见下文。字幕/画面、真实写入、生产安装不在本次已完成验收内。

English: Bilibili uses explicit website QR login, not developer OAuth. XHS requires an approved Web application and device grant; basic_info only. Secrets remain in Host memory. Restart requires reconnecting. Begin with identity verification and a single authorized public Bilibili metadata read. Official OAuth social writes are unsupported; the separate browser candidate is described below.


## 小红书独立浏览器（新增候选，真实账号验收待完成）
1. 在平台中心选择“小红书浏览器”，不是“小红书”官方应用入口。需要本机安装 Microsoft Edge。
2. 勾选本人登录，开始授权，在新打开的独立窗口用小红书扫码或平台提供的方式登录。验证码由本人处理；随后回控制台检查授权状态。不要扫描控制台中普通网页地址当成登录二维码。
3. 登录只保留本次进程会话；关闭浏览器、退出账号或重启 Core 后重新登录。不会读取日常浏览器 Cookie。
4. 开启平台，授权 read/comments，填写笔记的 24 位 ID。若该笔记链接要求 xsec_token，可在只写字段填入链接参数，仅用于本次请求。
5. 在互动权限页分别授权点赞、评论、回复，填入允许的笔记 ID，勾选准备好的 Core Activity Session，并设置每种操作的每日额度与冷却。没有授权范围就不能发送。
6. 回复必须填写原评论 ID；点赞只设置为已点赞，不提供盲目切换。GUI“执行已授权互动”会真实发送，使用前核对账号、笔记与文本。自主互动还需全局活动开关、平台自主开关和 Life 的既有活动流程。
7. 不确定结果会保留在操作记录中，并锁定相同操作。到平台手工核对，不要反复重发或改字绕过去重。诊断页可以立即停用平台；不能撤回已经被平台接受的动作。

English: Dedicated browser mode requires locally installed Edge and your own interactive login. It is separate from official device OAuth. Enable operation grants, note IDs and the Activity Session explicitly; defaults grant nothing. Replies require an exact parent comment ID. Unknown outcomes are durably locked against replay. Real XHS account acceptance remains pending.
