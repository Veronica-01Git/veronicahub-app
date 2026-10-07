# Veronica conversation — /veronica

Additive dedicated experience on the existing TanStack/Cloudflare stack. Existing Home, Escola, Portfolio, client routes and financial tables are preserved. Navigation entry under Criar. Responsive sidebar, session-only threads (20 threads / 80 turns each), no automatic persistence, a plain-text transcript, explicit copy/device reading, no invented tools or memories.

## Channels

Text uses the existing server-side text-generation router with bounded input/context and sanitized errors. Audio playback on an ordinary message is explicitly labeled as device speech, not the ElevenLabs Veronica voice. No microphone/camera access occurs on page load.

Vidu S1 and S2 are selectable real-time Avatar models. The real-time edition supplies RTC, ASR, LLM and TTS; it is not the asynchronous Q-series video API. Native Vidu voices must be tested in Brazilian Portuguese; ElevenLabs voice IDs are not interchangeable. Avatar Component is a future alternative when preserving the existing text router and ElevenLabs voice exactly is required; that alternative requires separately managed RTC, ASR and PCM24k TTS.

Create Live uses POST https://api.vidu.com/live/s_avatar/realtime, server-only API credentials and a fixed persona. No recording or provider long-term memory is requested. User camera is never published. Microphone publication is opt-in after joining. Authenticated administrator-only live sessions during acceptance testing. This is deliberately not advertised as a working public Vidu service before credentials/credits and devices pass live tests.

A 120-second HMAC ticket permits a same-origin Worker WebSocket handshake. API key never reaches the browser; only the Worker-to-Vidu App WebSocket carries it, as the `authorization` query parameter the official quick start uses (plus the header). Worker injects live/connection identifiers, limits signaling type/size/count, and closes after five minutes. Client waits for conn_init_ack, re-sends conn_init on NOT_READY every 2 s (at most 20 times, 45 s limit, same session), joins AliRTC, and distinguishes reference image from actual remote video. Hangup/disconnect/pagehide/unmount stop WS and RTC; no silent model retry creates a second billable session. No UI waits for an acknowledgement that Vidu does not provide for text messages.

## Activation checklist

Configure Worker secrets VIDU_API_KEY (Global MaaS), VIDU_SESSION_SECRET (random >=32 characters), VIDU_AVATAR_IMAGE_URL (one canonical Veronica, HTTPS), optional VIDU_VOICE_ID. Keep VIDU_LIVE_ENABLED=false until ready. Do not paste credentials into chat or commit them. Set true for administrator acceptance tests: S1 and S2, audio/video, Portuguese speech, remote playback, mic permission denial, hangup, disconnect, expiration and remaining credit errors. Verify no lingering billable session in Vidu console. Only after those tests design durable per-user quotas/ownership before public rollout.

Production /veronica alone allows microphone=(self); camera and geolocation remain disabled. Other routes retain their existing permission policy. WebSocket response bypasses normal SSR header cloning so the upgrade socket survives.

## Acceptance status (2026-10-07)

- Worker `veronicahub-app` exists. Its secrets cannot be written from the agent sessions: the Cloudflare connector is read-only and no Cloudflare API token is present. Production deploys through Cloudflare's Git build.
- The supplied Vidu key authenticates (`GET /ent/v2/credits` → 200) but the account shows no packages or remaining credits. Create Live for `vidu-s2` and `vidu-s1` (video) returns HTTP 400 `CreditInsufficient` before any session opens. No live session, WebSocket, RTC, audio, lip-sync or Portuguese speech test has run yet.
- `/images/yo-campus/core-1280.webp` is HTTPS, 1280×720 WebP, one short-haired Veronica with the YO pin. The face is small in this wide frame. If lip-sync quality is weak, use a tighter portrait.
- A credit refusal now shows a specific message; the provider body never reaches the browser.

## Sources (retrieved 2026-10-06)

- https://platform.vidu.com/vidu-stream/doc/s2-avatar/realtime/parameters
- https://platform.vidu.com/vidu-stream/doc/s2-avatar/realtime/quick-start
- https://platform.vidu.com/live-doc/files/s2-avatar/realtime/quick-start/index.html
- https://platform.vidu.com/vidu-stream/doc/s2-avatar/component/parameters
- https://platform.vidu.com/docs/model-map
- RTC SDK version pinned to the official quickstart: https://g.alicdn.com/apsara-media-box/imp-web-rtc/7.1.9/aliyun-rtc-sdk.js
