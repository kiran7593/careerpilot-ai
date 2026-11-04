import { Resend } from "resend";

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(apiKey);

  return resend.emails.send({
    from: "CareerPilot AI <onboarding@resend.dev>",
    to: email,
    subject: "Reset your CareerPilot AI password",
    text: `We received a request to reset your password.

Use this link to reset it:
${resetUrl}

This link expires in 15 minutes. If you didn't request a password reset, you can ignore this email.`,
  });
}