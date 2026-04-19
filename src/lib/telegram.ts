const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_TEST_CHAT_ID = process.env.TELEGRAM_TEST_CHAT_ID!;

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

// For testing: all OTPs go to the hardcoded test chat ID
export async function sendOTP(
  phone: string,
  otp: string
): Promise<boolean> {
  const message = `🔐 Your QuoteLoop verification code:\n\n<b>${otp}</b>\n\nExpires in 5 minutes. Don't share this code.`;
  // In production, this would send SMS to the actual phone number
  // For testing, all messages go to the test Telegram chat
  console.log(`[OTP] Sending code to phone ${phone} via Telegram test chat`);
  return sendTelegramMessage(TELEGRAM_TEST_CHAT_ID, message);
}

// For follow-up messages: all go to test chat ID for now
export async function sendFollowUpMessage(
  customerPhone: string,
  text: string
): Promise<boolean> {
  console.log(
    `[Follow-up] Sending to ${customerPhone} via Telegram test chat`
  );
  return sendTelegramMessage(TELEGRAM_TEST_CHAT_ID, text);
}
