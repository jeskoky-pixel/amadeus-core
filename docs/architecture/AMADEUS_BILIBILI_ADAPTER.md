# Bilibili adapter
Research: [official Open Platform](https://open.bilibili.com/doc), [official server demo](https://github.com/bilibili-openplatform/demo), and [dsh-bili-eyes](https://github.com/QiuYeDx/dsh-bili-eyes). References informed protocol investigation only; no reference source was copied or installed. Original Mneme attribution remains unchanged.

Implemented website client (not Open Platform OAuth): passport web qrcode generate/poll; session verified through /x/web-interface/nav. User explicitly chooses website QR. All credentials are session-only. Application OAuth requires developer registration/approval and is not offered as a working flow in this candidate.

Read request implementations: /x/web-interface/view (BV metadata), popular (public popular, not personalized recommendation), search/type (unsigned website search), archive/related, v2/reply/main (comments via verified video aid). Parse whitelisted fields; never accept arbitrary target URLs. Rate limits and login/permission failures remain errors. Public endpoint availability is not an official API guarantee or proof that all account uses are permitted.

A minimal unauthenticated view request for BV1xx411c7mD returned real title/metadata, including in isolated Desktop through the actual GUI and Memory experience path. Other endpoints have protocol fixtures, not account acceptance. Search may be rejected by platform signing/anti-abuse policy; no signing or challenge bypass is attempted.

Not implemented: official OAuth, subtitles, video download/keyframe analysis, danmaku, account events, live social writes. No full-video viewing claim. Remote website-session revocation is unsupported: local disconnect removes Core credentials; manage device sessions in Bilibili account security.
