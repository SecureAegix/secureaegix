const crypto = require("crypto");
const User = require("../models/user.js");

// Load .env in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

module.exports.restform = async (req, res) => {
  res.render("emailer/emailSent.ejs", {
    message: "Please enter your registered email address.",
    alertmsg: false,
  });
};

module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("emailer/emailSent.ejs", {
        message: "This email address is not registered with SecureAegix. Please verify your email and try again.",
        alertmsg: true,
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Auto-detect domain
    const domain =
      process.env.DOMAIN ||
      (process.env.NODE_ENV === "production"
        ? "https://secureaegix.com"
        : "http://localhost:3000");
    const resetLink = `${domain}/reset-password/${token}`;

    const brevo = require("@getbrevo/brevo");
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY,
    );

    // Professional Email HTML - Cleaned for SecureAegix
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password | SecureAegix</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            margin: 0;
            padding: 0;
            background-color: #0a0c10;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #0d1117 0%, #0a0c10 100%);
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          
          .logo {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
          }
          
          .logo span:first-child {
            background: linear-gradient(135deg, #60a5fa 0%, #22d3ee 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          
          .logo span:last-child {
            color: white;
          }
          
          .subtitle {
            font-size: 14px;
            opacity: 0.9;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-weight: 500;
          }
          
          .content {
            padding: 40px;
          }
          
          .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 24px;
          }
          
          .message {
            color: #9ca3af;
            margin-bottom: 32px;
            font-size: 15px;
            line-height: 1.7;
          }
          
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 30px 0;
            transition: all 0.3s ease;
          }
          
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
          }
          
          .link-container {
            background: linear-gradient(135deg, #1e293b 0%, #111827 100%);
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            border: 1px solid #334155;
            word-break: break-all;
          }
          
          .link {
            color: #22d3ee;
            text-decoration: none;
            font-size: 13px;
          }
          
          .expiry-note {
            background: rgba(245, 158, 11, 0.1);
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin: 30px 0;
            color: #fcd34d;
          }
          
          .security-note {
            background: rgba(34, 211, 238, 0.1);
            border-left: 4px solid #22d3ee;
            padding: 16px;
            border-radius: 8px;
            margin: 30px 0;
            color: #67e8f9;
          }
          
          .footer {
            background: #0a0c10;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #1f2937;
            color: #6b7280;
            font-size: 13px;
          }
          
          .contact-link {
            color: #22d3ee;
            text-decoration: none;
          }
          
          @media (max-width: 600px) {
            .content, .footer {
              padding: 30px 20px;
            }
            
            .header {
              padding: 30px 20px;
            }
            
            .reset-button {
              display: block;
              margin: 20px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <span>Secure</span><span>Aaegix</span>
            </div>
            <div class="subtitle">Cybersecurity Training Platform</div>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hello ${user.name || user.username || "SecureAegix User"},
            </div>
            
            <div class="message">
              We received a request to reset your password for your SecureAegix account. 
              If you made this request, please use the button below to securely reset your password.
            </div>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="reset-button">
                Reset Your Password
              </a>
            </div>
            
            <div class="link-container">
              <strong>Alternative Method:</strong> If the button doesn't work, copy and paste this link:<br><br>
              <a href="${resetLink}" class="link">${resetLink}</a>
            </div>
            
            <div class="expiry-note">
              <strong>⏰ Important:</strong> This password reset link is valid for <strong>1 hour</strong> only.
            </div>
            
            <div class="security-note">
              <strong>🔒 Security Notice:</strong> If you didn't request this, please ignore this email. 
              No changes have been made to your account.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>SecureAegix</strong><br>Cybersecurity & Web Development Education</p>
            <p>
              📧 <a href="mailto:info@secureaegix.com" class="contact-link">info@secureaegix.com</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px;">
              This is an automated message. Please do not reply.<br>
              © ${new Date().getFullYear()} SecureAegix. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
      Reset Your SecureAegix Password
      ===============================

      Hello ${user.name || user.username || "SecureAegix User"},

      We received a request to reset your password for your SecureAegix account.

      To reset your password, please visit the following link:
      ${resetLink}

      This link will expire in 1 hour.

      If you didn't request this password reset, please ignore this email.
      No changes have been made to your account.

      Need help? Contact us at info@secureaegix.com

      ---
      SecureAegix
      Cybersecurity & Web Development Education
    `;

    await apiInstance.sendTransacEmail({
      sender: { email: "info@secureaegix.com", name: "SecureAegix" },
      to: [{ email: user.email, name: user.name || user.username }],
      subject: "🔒 Reset Your Password | SecureAegix",
      htmlContent: htmlContent,
      textContent: textContent,
    });

    req.flash(
      "success",
      "Password reset instructions have been sent to your email. Please check your inbox (and spam folder)."
    );
    return res.redirect("/login");
  } catch (err) {
    console.error("Email Error:", err);
    req.flash(
      "error",
      "Unable to send reset email. Please try again later."
    );
    return res.redirect("/login");
  }
};

// Show reset page
module.exports.getResetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash(
      "error",
      "This password reset link has expired or is invalid. Please request a new one."
    );
    return res.redirect("/login");
  }

  res.render("emailer/reset.ejs", {
    token: req.params.token,
    message: req.query.message || null,
    alertmsg: req.query.error || null,
  });
};

// Reset password submit
module.exports.postResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash(
      "error",
      "This password reset link has expired. Please request a new one."
    );
    return res.redirect("/login");
  }

  if (password.length < 6) {
    req.flash("error", "Password must be at least 6 characters long.");
    return res.redirect(`/reset-password/${token}`);
  }

  user.setPassword(password, async (err, updatedUser) => {
    if (err) {
      req.flash("error", "Unable to update password. Please try again.");
      return res.redirect(`/reset-password/${token}`);
    }

    updatedUser.resetPasswordToken = undefined;
    updatedUser.resetPasswordExpires = undefined;
    await updatedUser.save();

    // Send confirmation email
    try {
      const brevo = require("@getbrevo/brevo");
      const apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY,
      );

      const htmlContent = `
        <!DOCTYPE html>
        <html>SecureAegix
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Updated | SecureAegix</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              background-color: #0a0c10;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(135deg, #0d1117 0%, #0a0c10 100%);
              border-radius: 24px;
              overflow: hidden;
              border: 1px solid rgba(6, 182, 212, 0.2);
            }
            .header {
              background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: 800;
            }
            .logo span:first-child {
              background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
            .logo span:last-child { color: white; }
            .content { padding: 40px; }
            .greeting { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
            .message { color: #9ca3af; margin-bottom: 24px; }
            .security-box {
              background: rgba(34, 211, 238, 0.1);
              border-left: 4px solid #22d3ee;
              padding: 16px;
              border-radius: 8px;
              margin: 24px 0;
              color: #67e8f9;
            }
            .footer {
              background: #0a0c10;
              padding: 24px;
              text-align: center;
              border-top: 1px solid #1f2937;
              color: #6b7280;
              font-size: 12px;
            }
            a { color: #22d3ee; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 48px;">✅</div>
              <div class="logo"><span>Secure</span><span>Aaegix</span></div>
              <div style="font-size: 14px; color: #99f6e4;">Password Updated</div>
            </div>
            <div class="content">
              <div class="greeting">Hello ${user.name || user.username || "SecureAegix User"},</div>
              <div class="message">
                Your SecureAegix account password was successfully updated on ${new Date().toLocaleString()}.
              </div>
              <div class="security-box">
                <strong>🔒 Security Tips:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                  <li>Use a unique password for SecureAegix</li>
                  <li>Never share your password with anyone</li>
                  <li>Contact support if you didn't make this change</li>
                </ul>
              </div>
              <div class="message">
                If you did not make this change, please contact us immediately at info@secureaegix.com
              </div>
            </div>
            <div class="footer">
              <p>SecureAegix Cybersecurity Training</p>
              <p>© ${new Date().getFullYear()} SecureAegix. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await apiInstance.sendTransacEmail({
        sender: { email: "info@secureaegix.com", name: "SecureAegix" },
        to: [{ email: user.email, name: user.name || user.username }],
        subject: "✅ Password Updated Successfully | SecureAegix",
        htmlContent: htmlContent,
      });
    } catch (emailErr) {
      console.error("Confirmation email error:", emailErr);
    }

    req.flash("success", "Password updated successfully! You can now log in.");
    res.redirect("/login");
  });
};