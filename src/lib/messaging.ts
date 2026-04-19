import { sendFollowUpMessage } from "@/lib/telegram";

export type MessageProvider = "telegram" | "sms" | "whatsapp";

/**
 * Unified messaging abstraction.
 * Currently routes everything through Telegram for testing.
 * When switching to production SMS, only this file changes.
 */
export async function sendMessage(
  to: string,
  message: string,
  provider: MessageProvider = "telegram"
): Promise<boolean> {
  switch (provider) {
    case "telegram":
      return sendFollowUpMessage(to, message);
    case "sms":
      // TODO: Implement Twilio SMS
      console.warn("[messaging] SMS provider not yet implemented, falling back to Telegram");
      return sendFollowUpMessage(to, message);
    case "whatsapp":
      // TODO: Implement WhatsApp
      console.warn("[messaging] WhatsApp provider not yet implemented, falling back to Telegram");
      return sendFollowUpMessage(to, message);
    default:
      return sendFollowUpMessage(to, message);
  }
}
