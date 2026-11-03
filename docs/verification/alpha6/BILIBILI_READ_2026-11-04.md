# Bilibili read acceptance — 2026-11-04

The account holder reported successful QR login. Existing Host account metadata records authenticated, unexpired identity in the selected Workspace. No account credentials were extracted. The installed configuration still has Bilibili disabled and no granted read permissions, so login alone does not authorize Core activity.

Independent live adapter checks without account credentials:

| Operation | Result |
| --- | --- |
| Popular browse | 10 real items |
| Detail of an observed video | 1 real item |
| Related videos | 10 real items |
| Comments | Platform rate/risk rejection |
| Search | HTTP 412 risk response (currently surfaced as NETWORK_ERROR) |

These public adapter checks are not authenticated Host acceptance. Native UI automation failed with kernel-assets os error 3; the ordinary Desktop has no usable CDP connection. Desktop was not restarted, credentials were not extracted or forged, and authorization was not bypassed. Requested a normal Owner GUI read after enabling platform access/read grant. Its result remains pending.

No social writes, NapCat changes, configuration edits or data deletion were performed. The previous QR repair commit has passing Linux and Windows CI.
