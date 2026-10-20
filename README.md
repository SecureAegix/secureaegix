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
- If the app runs behind a trusted reverse proxy, set `TRUST_PROXY_HOPS` to the
  exact number of trusted proxy hops (commonly `1`). Leave it unset when the
  app is directly exposed so client-supplied forwarding headers are not trusted.
- Rate limits use an in-process store; deployments with multiple app instances
  should use a shared rate-limit store to enforce limits across all instances.
