const N8N_BASE_URL = process.env.N8N_BASE_URL!;
const N8N_API_KEY = process.env.N8N_API_KEY!;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;

// Default follow-up schedule (in minutes from quote creation)
// 1: immediate (0), 2: 3 hours (180), 3: 9 hours (540), 4: 24 hours (1440)
export const DEFAULT_FOLLOW_UP_SCHEDULE = [0, 180, 540, 1440] as const;

export interface QuoteWebhookPayload {
  quoteId: string;
  customerName: string | null;
  customerPhone: string;
  contractorName: string;
  businessName: string;
  contractorPhone: string;
  quoteAmount: number;
  jobDescription: string | null;
  callbackBaseUrl: string;
  callbackSecret: string;
  formLink: string | null;
  // Fixed schedule: follow-ups at 3h, 9h, 24h (first is sent immediately by the API)
  followUp2Minutes: number;
  followUp3Minutes: number;
  followUp4Minutes: number;
}

export async function triggerFollowUpWorkflow(
  data: QuoteWebhookPayload
): Promise<{ executionId: string } | null> {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("n8n webhook error:", res.status, text);
      return null;
    }

    const result = await res.json();
    return { executionId: result.executionId };
  } catch (error) {
    console.error("Failed to trigger n8n workflow:", error);
    return null;
  }
}

export async function cancelExecution(
  executionId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${N8N_BASE_URL}/api/v1/executions/${executionId}/stop`,
      {
        method: "POST",
        headers: {
          "X-N8N-API-KEY": N8N_API_KEY,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("n8n cancel error:", res.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to cancel n8n execution:", error);
    return false;
  }
}

export async function getExecutionStatus(
  executionId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${N8N_BASE_URL}/api/v1/executions/${executionId}`,
      {
        headers: {
          "X-N8N-API-KEY": N8N_API_KEY,
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.data?.status || data.status || null;
  } catch (error) {
    console.error("Failed to get n8n execution status:", error);
    return null;
  }
}
