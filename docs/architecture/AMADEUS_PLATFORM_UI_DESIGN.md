# Platform center
One Platforms page, searchable responsive platform cards, then six nested sections: Account, Browse, Autonomy, Social permissions, Experiences, Diagnostics. Core language switch supplies Chinese/English. Existing theme variables/style and one Bundle client loader remain in use.

Account UI exposes explicit connection choice, approved-app requirements, local QR and official verification link, check/cancel, verify/refresh, disconnect/revoke/clear. Password-type write-only App Secret input is cleared after requests; no localStorage. Unsupported capabilities are disabled. Authentication is separate from read permissions; read access is separate from autonomous activity.

Browse uses Owner HTTP and the same router/Memory ACL as activities. Autonomy exposes enable, daily request budget, request cooldown and separate autonomous-read permission. Interests stay in State, wake frequency in Life. Diagnostics can immediately stop a platform; errors are sanitized codes. Experience list links IDs logically to Memory and Activity, without rendering remote HTML.

States include simulation, no account, pending, expired, authenticated/no-content, enabled/disabled and unsupported capabilities. Current code does not claim an external platform is reachable based only on a login form or saved config. Empty lists/errors are visible. Platform icons are local text marks; no unlicensed remote logo assets.
