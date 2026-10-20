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
  the server for public account, contact, newsletter, and diploma submissions.
- In production, the app trusts one reverse-proxy hop by default so secure
  session cookies work behind a TLS-terminating proxy. Set `TRUST_PROXY_HOPS`
  to the exact number of trusted proxy hops if your deployment uses a different
  topology; set it to `0` when the app is directly exposed.
- Rate limits use an in-process store; deployments with multiple app instances
  should use a shared rate-limit store to enforce limits across all instances.
