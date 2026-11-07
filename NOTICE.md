Core retains MIT source from Amadeus Memory/Life/State/Persona. Memory includes Mneme by modusensus: see src/modules/memory/LICENSE and UPSTREAM.md. No Bilibili/Xiaohongshu reference source imported. SOURCE_MANIFEST records unmodified import hashes; integration modifications must be listed separately.

## Alpha 0.6 local XHS executor candidate

The optional Windows executable under lib/xhs is a reviewed adaptation of xpzouying/xiaohongshu-mcp v2.7.0, source d6352e5435b45ebb48fe240dc03a2bec0476bd56 (Apache-2.0; license included beside the executable). Amadeus overlays are in services/xhs-executor. Platform action/parsing code remains upstream; the browser launcher and persistent storage are replaced by native Windows Job Objects, verified installed Edge, and CurrentUser DPAPI. No bundled Chromium or leakless helper is launched. This is an Alpha candidate, not an upstream-signed release. No platform security or anti-abuse success is claimed.
