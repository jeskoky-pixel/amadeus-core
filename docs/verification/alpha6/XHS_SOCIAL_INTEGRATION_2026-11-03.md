# Alpha 6 native social integration — 2026-11-03

The Windows native adapter now routes like, comment and reply through the authenticated local client. Provider acknowledgments are translated into the existing registry receipt contract with `confirmation: upstream-acknowledged`; they are not advertised as independently verified live acceptance. Exact note ID, exact reply comment ID, account identity, Workspace/Session authorization, durable anti-replay journal and per-action budgets remain required. xsec_token is required for these upstream routes.

The pinned upstream overlay limits likes to one click, refuses a like when initial state cannot be established, propagates cancellation to comment pages, and refuses submission when identical text is already visible. There is no automatic retry after an uncertain send. Upstream DOM confirmation still has limitations; real social acceptance remains pending and no arbitrary public note was used for test posts.

Validation: 189 Core tests passed; client build and npm pack content/hash checks passed; upstream xiaohongshu Go tests passed; DPAPI roundtrip/corruption regression passed. The broader upstream cookies suite failed because its fixtures require plaintext legacy cookies. This intentional incompatibility is not counted as passing; explicit legacy migration is required. Native executable rebuilt from the pinned source and reviewed overlay.

Earlier real read evidence is in XHS_LIVE_READ_2026-11-03.md. The previous unsupported social result describes the earlier binary, not this integration. No real like/comment/reply has yet been verified on an authorized test note. No npm, Release, tag or merge is performed.

Installation: covered the primary Desktop Core package using pnpm (one package added), preserving user data and configuration. Installed executable SHA matched the candidate manifest. Post-install native account restoration and real recommendation read succeeded without scanning again. Desktop was restarted after the isolated read check. The package remains 0.2.0-alpha.6, identified by SHA-256 f39fcb61b98ab20e2a358ce7c79aeb315087abf44776d71185fc90cfb3bb6a98.
