const brevo = require("@getbrevo/brevo");
const SiteSetting = require("../models/siteSetting");

const SETTING_KEY = "contactNotificationEmail";
const DEFAULT_RECIPIENT = process.env.NOTIFICATION_EMAIL;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function getContactNotificationEmail() {
  const setting = await SiteSetting.findOne({ key: SETTING_KEY }).lean();
  return setting?.value || DEFAULT_RECIPIENT;
}

async function sendContactNotificationEmail(contact) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const recipient = await getContactNotificationEmail();
  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
  );

  const safeName = escapeHtml(contact.name);
  const safeEmail = escapeHtml(contact.email);
  const safeMobile = escapeHtml(contact.mobile || "Not provided");
  const safeSubject = escapeHtml(contact.subject);
  const safeMessage = escapeHtml(contact.message || "No message provided").replace(/\r?\n/g, "<br>");

  await apiInstance.sendTransacEmail({
    sender: { email: "info@secureaegix.com", name: "SecureAegix Website" },
    to: [{ email: recipient }],
    replyTo: { email: contact.email, name: contact.name },
    subject: `New website inquiry: ${contact.subject}`,
    textContent: [
      `Name: ${contact.name}`,
      `Email: ${contact.email}`,
      `Mobile: ${contact.mobile || "Not provided"}`,
      `Subject: ${contact.subject}`,
      "",
      contact.message || "No message provided",
    ].join("\n"),
    htmlContent: `
      <h2>New SecureAegix contact form submission</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Mobile:</strong> ${safeMobile}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Message:</strong><br>${safeMessage}</p>
    `,
  });
}

module.exports = {
  DEFAULT_RECIPIENT,
  SETTING_KEY,
  sendContactNotificationEmail,
};
