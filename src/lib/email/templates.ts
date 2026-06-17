import "server-only";

import { siteConfig } from "@/config/site";

interface WelcomeTemplateInput {
  name: string;
  appUrl: string;
}

/**
 * Plain-HTML email templates. Keep them ugly but functional — Gmail
 * strips most CSS, and tracking pixel/link rewriting from your sender
 * domain matters more than aesthetics.
 *
 * For richer templates use `react-email` and render to string here.
 *
 * Note: Verify-email and password-reset emails are sent by Supabase Auth
 * directly (configured in the Supabase dashboard → Authentication → Email
 * Templates). Do NOT duplicate them here.
 */
export function welcomeEmail({ name, appUrl }: WelcomeTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Welcome to ${siteConfig.name}`,
    html: `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:24px auto;">
  <h1 style="font-size:20px;">Welcome, ${escapeHtml(name)}.</h1>
  <p>Thanks for signing up to ${escapeHtml(siteConfig.name)}.</p>
  <p><a href="${appUrl}/dashboard" style="display:inline-block;background:#000;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open dashboard</a></p>
  <p style="color:#666;font-size:12px;margin-top:32px;">If you didn't sign up, ignore this email.</p>
</body></html>`,
    text: `Welcome, ${name}.\n\nThanks for signing up to ${siteConfig.name}.\n\nOpen dashboard: ${appUrl}/dashboard\n\nIf you didn't sign up, ignore this email.`,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}
