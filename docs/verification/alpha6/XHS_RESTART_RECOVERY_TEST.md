# Restart recovery

Observed: isolated upstream process can restart and respond to /health with v2.7.0. Its cookie-write/browser errors recur. No saved authenticated session existed; this is process restart only, NOT login recovery.

Synthetic tests: restart backoff bounded to two retries; explicit stop prevents later retry; failed cleanup retains ownership; restored state requires matching persisted identity plus fresh same-account read.

NOT RUN: actual encrypted cookie load, same account/no-rescan read, console close/reopen, Core Host restart, isolated Desktop restart. Production Desktop was not restarted or reinstalled. These checks remain blocking.
