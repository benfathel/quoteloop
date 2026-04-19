// Fixed follow-up schedule: immediate, 3h, 9h, 24h

export function getFollowUpMessage(
  followUpNumber: 1 | 2 | 3 | 4,
  customerName: string | null,
  contractorName: string,
  businessName: string,
  formLink?: string | null
): string {
  const greeting = customerName ? `Hi ${customerName}` : "Hi there";
  let msg: string;

  switch (followUpNumber) {
    case 1:
      msg = `${greeting}, thanks for getting a quote from ${businessName}! We'd love to get started whenever you're ready. - ${contractorName}`;
      break;
    case 2:
      msg = `${greeting}, just checking in on the quote from ${businessName}. Happy to answer any questions. - ${contractorName}`;
      break;
    case 3:
      msg = `${greeting}, this is ${contractorName} from ${businessName}. Just a friendly reminder about your quote — let us know if you'd like to move forward. - ${contractorName}`;
      break;
    case 4:
      msg = `${greeting}, this is ${contractorName} from ${businessName} reaching out one last time about your quote. If we don't hear back, we'll close it out. No worries either way! - ${contractorName}`;
      break;
  }

  if (formLink) {
    msg += `\n\nBook your appointment here: ${formLink}`;
  }

  return msg;
}
