import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export const twilioClient = twilio(accountSid, authToken);

/**
 * Format a phone number to E.164.
 * Strips non-digits, then prepends +1 (US) if no country code.
 */
export function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Already has country code (11+ digits starting with 1 for US)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // 10-digit US number — add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Already full international number
  if (digits.length > 10) {
    return `+${digits}`;
  }

  // Return as-is with + prefix — Twilio will reject if invalid
  return `+${digits}`;
}

/**
 * Send an SMS via Twilio. Returns true if sent, false if failed.
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const formattedTo = formatPhoneE164(to);
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedTo,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);
    return false;
  }
}
