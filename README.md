# SecureAaegix - Cybersecurity Training Platform

A comprehensive cybersecurity training and certification platform offering industry-recognized courses, hands-on labs, and professional security services.

## 🚀 Features

### 👤 User Features
- User registration & login with email verification
- OTP-based email authentication
- Password reset functionality
- User profile management
- Dark/Light mode toggle
- Responsive design for all devices

### 📚 Courses
- Industry-recognized certifications (OSCP, OSWE, CRTO, eJPT, etc.)
- Course enrollment system
- Progress tracking
- Certificate generation upon completion

### 🛡️ Services
- Penetration Testing
- Vulnerability Assessment
- Incident Response
- Red Team Operations

### 📝 Blog
- Cybersecurity articles and tutorials
- Search and filter functionality
- Comment system
- Category-based browsing

## Security configuration

- Configure `CAPTCHA_SITE_KEY` and `CAPTCHA_SECRET_KEY` with the public and
  secret keys from the same Cloudflare Turnstile site. CAPTCHA is verified on
  the server for contact, newsletter, and diploma submissions. Login uses
  CAPTCHA only after four attempts from the same IP within 15 minutes; signup,
  OTP, and password-reset forms use their server-side rate limits.
- The Turnstile widget's hostname allowlist is separate from the Cloudflare DNS
  zone. Add the exact public app hostname (`secureaegix.com`) to the widget's
  allowlist; add any other hostname that directly serves the app as well.
- For local development, use Cloudflare Turnstile's documented test key pair
  instead of production keys that may only accept your deployed hostname.
  Production requests are checked against the submitted token's hostname and
  the request hostname. If a trusted proxy or canonical-domain alias makes
  those hostnames differ, set `CAPTCHA_ALLOWED_HOSTNAMES` to a comma-separated
  list containing both hostnames; configure only hostnames you control.
- In production, the app trusts one reverse-proxy hop by default so secure
  session cookies work behind a TLS-terminating proxy. Set `TRUST_PROXY_HOPS`
  to the exact number of trusted proxy hops if your deployment uses a different
  topology; set it to `0` when the app is directly exposed.
- Rate limits use an in-process store; deployments with multiple app instances
  should use a shared rate-limit store to enforce limits across all instances.

## Chatbot model configuration

- Set `GOOGLE_AI_API_KEY` for the Gemini API. The chatbot uses the Gemini Live
  API over a server-side WebSocket and returns the model's text transcription
  in the existing chat interface; the key is not sent to the browser.
- By default, it tries `gemini-3.8-live`, then
  `gemini-3.1-flash-live-preview` and
  `gemini-2.5-flash-native-audio-preview-12-2025` if a model is unavailable
  (`404`), reports a rate/quota (`429`), or temporary capacity (`503`) error.
- Set `GOOGLE_AI_LIVE_MODELS` to a comma-separated list of Live API model IDs
  enabled for your Google AI project to choose a different order or fallback.
  Quota and billing limits still apply; switching models cannot bypass
  project-wide limits. An "Unlimited" RPM display does not remove token,
  throughput, or service availability limits.
