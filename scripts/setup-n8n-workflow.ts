/**
 * One-time setup script to create the QuoteLoop follow-up workflow in n8n.
 *
 * Run with: npx tsx scripts/setup-n8n-workflow.ts
 *
 * This creates a webhook-triggered workflow that:
 * 1. Receives quote data via webhook
 * 2. Responds immediately with the execution ID
 * 3. Waits for followUp1Minutes
 * 4. Checks if quote is still PENDING
 * 5. Sends follow-up 1 via Telegram
 * 6. Waits for followUp2Minutes (if set)
 * 7. Checks status again
 * 8. Sends follow-up 2 via Telegram
 */

import "dotenv/config";

const N8N_BASE_URL = process.env.N8N_BASE_URL!;
const N8N_API_KEY = process.env.N8N_API_KEY!;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_TEST_CHAT_ID = process.env.TELEGRAM_TEST_CHAT_ID!;
const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET!;

const workflowData = {
  name: "QuoteLoop Follow-Up",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "quote-followup",
        responseMode: "responseNode",
        options: {},
      },
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [0, 300],
      id: "webhook-trigger",
      name: "Webhook",
      webhookId: "quote-followup",
    },
    {
      parameters: {
        respondWith: "json",
        responseBody:
          '={{ JSON.stringify({ executionId: $execution.id }) }}',
        options: {},
      },
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [220, 300],
      id: "respond-webhook",
      name: "Respond with Execution ID",
    },
    {
      parameters: {
        amount: "={{ $('Webhook').item.json.body.followUp1Minutes }}",
        unit: "minutes",
      },
      type: "n8n-nodes-base.wait",
      typeVersion: 1.1,
      position: [440, 300],
      id: "wait-followup1",
      name: "Wait for Follow-up 1",
    },
    {
      parameters: {
        method: "GET",
        url: '={{ "http://host.docker.internal:3000/api/quotes/" + $("Webhook").item.json.body.quoteId + "/status" }}',
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: `Bearer ${N8N_CALLBACK_SECRET}`,
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [660, 300],
      id: "check-status-1",
      name: "Check Status 1",
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict",
          },
          conditions: [
            {
              id: "condition-pending-1",
              leftValue: "={{ $json.status }}",
              rightValue: "PENDING",
              operator: {
                type: "string",
                operation: "equals",
              },
            },
          ],
          combinator: "and",
        },
        options: {},
      },
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [880, 300],
      id: "if-pending-1",
      name: "If Still Pending 1",
    },
    {
      parameters: {
        method: "POST",
        url: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "chat_id",
              value: TELEGRAM_TEST_CHAT_ID,
            },
            {
              name: "text",
              value:
                '={{ (() => { const d = $("Webhook").item.json.body; const greeting = d.customerName ? "Hi " + d.customerName : "Hi there"; const link = d.formLink ? "\\n\\nBook your appointment here: " + d.formLink : ""; if (d.useCustomMessage1 && d.customMessage1) return d.customMessage1 + link; const job = d.jobDescription ? " for " + d.jobDescription : ""; return greeting + ", just following up on the quote " + d.businessName + " sent you" + job + " ($" + d.quoteAmount + "). Happy to answer any questions or get started when you\'re ready. - " + d.contractorName + link; })() }}',
            },
            {
              name: "parse_mode",
              value: "HTML",
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1100, 200],
      id: "send-telegram-1",
      name: "Send Follow-up 1",
    },
    {
      parameters: {
        method: "POST",
        url: '={{ "http://host.docker.internal:3000/api/quotes/" + $("Webhook").item.json.body.quoteId + "/mark-sent" }}',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: `Bearer ${N8N_CALLBACK_SECRET}`,
            },
          ],
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "followUpNumber",
              value: "1",
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1320, 200],
      id: "mark-sent-1",
      name: "Mark Follow-up 1 Sent",
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict",
          },
          conditions: [
            {
              id: "condition-has-fu2",
              leftValue:
                '={{ $("Webhook").item.json.body.followUp2Minutes }}',
              rightValue: "",
              operator: {
                type: "string",
                operation: "isNotEmpty",
              },
            },
          ],
          combinator: "and",
        },
        options: {},
      },
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [1540, 200],
      id: "if-has-followup2",
      name: "Has Follow-up 2?",
    },
    {
      parameters: {
        amount:
          '={{ Math.max(1, $("Webhook").item.json.body.followUp2Minutes - $("Webhook").item.json.body.followUp1Minutes) }}',
        unit: "minutes",
      },
      type: "n8n-nodes-base.wait",
      typeVersion: 1.1,
      position: [1760, 100],
      id: "wait-followup2",
      name: "Wait for Follow-up 2",
    },
    {
      parameters: {
        method: "GET",
        url: '={{ "http://host.docker.internal:3000/api/quotes/" + $("Webhook").item.json.body.quoteId + "/status" }}',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: `Bearer ${N8N_CALLBACK_SECRET}`,
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1980, 100],
      id: "check-status-2",
      name: "Check Status 2",
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict",
          },
          conditions: [
            {
              id: "condition-pending-2",
              leftValue: "={{ $json.status }}",
              rightValue: "PENDING",
              operator: {
                type: "string",
                operation: "equals",
              },
            },
          ],
          combinator: "and",
        },
        options: {},
      },
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [2200, 100],
      id: "if-pending-2",
      name: "If Still Pending 2",
    },
    {
      parameters: {
        method: "POST",
        url: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "chat_id",
              value: TELEGRAM_TEST_CHAT_ID,
            },
            {
              name: "text",
              value:
                '={{ (() => { const d = $("Webhook").item.json.body; const greeting = d.customerName ? "Hi " + d.customerName : "Hi there"; const link = d.formLink ? "\\n\\nBook your appointment here: " + d.formLink : ""; if (d.useCustomMessage2 && d.customMessage2) return d.customMessage2 + link; const job = d.jobDescription ? " for " + d.jobDescription : ""; if (d.expiresAt) { const exp = new Date(d.expiresAt).toLocaleDateString("en-US", {month: "short", day: "numeric"}); return greeting + ", this is " + d.contractorName + " from " + d.businessName + ". Just a heads up — your quote" + job + " ($" + d.quoteAmount + ") expires on " + exp + ". Let us know if you\'d like to move forward before then. - " + d.contractorName + link; } return greeting + ", this is " + d.contractorName + " from " + d.businessName + " checking in one last time about your quote" + job + " ($" + d.quoteAmount + "). No pressure at all — just let us know if you\'d like to move forward. - " + d.contractorName + link; })() }}',
            },
            {
              name: "parse_mode",
              value: "HTML",
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [2420, 0],
      id: "send-telegram-2",
      name: "Send Follow-up 2",
    },
    {
      parameters: {
        method: "POST",
        url: '={{ "http://host.docker.internal:3000/api/quotes/" + $("Webhook").item.json.body.quoteId + "/mark-sent" }}',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: `Bearer ${N8N_CALLBACK_SECRET}`,
            },
          ],
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "followUpNumber",
              value: "2",
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [2640, 0],
      id: "mark-sent-2",
      name: "Mark Follow-up 2 Sent",
    },
  ],
  connections: {
    Webhook: {
      main: [[{ node: "Respond with Execution ID", type: "main", index: 0 }]],
    },
    "Respond with Execution ID": {
      main: [[{ node: "Wait for Follow-up 1", type: "main", index: 0 }]],
    },
    "Wait for Follow-up 1": {
      main: [[{ node: "Check Status 1", type: "main", index: 0 }]],
    },
    "Check Status 1": {
      main: [[{ node: "If Still Pending 1", type: "main", index: 0 }]],
    },
    "If Still Pending 1": {
      main: [
        // true branch
        [{ node: "Send Follow-up 1", type: "main", index: 0 }],
        // false branch (not pending) - ends
        [],
      ],
    },
    "Send Follow-up 1": {
      main: [[{ node: "Mark Follow-up 1 Sent", type: "main", index: 0 }]],
    },
    "Mark Follow-up 1 Sent": {
      main: [[{ node: "Has Follow-up 2?", type: "main", index: 0 }]],
    },
    "Has Follow-up 2?": {
      main: [
        // true branch - has follow-up 2
        [{ node: "Wait for Follow-up 2", type: "main", index: 0 }],
        // false branch - no follow-up 2, ends
        [],
      ],
    },
    "Wait for Follow-up 2": {
      main: [[{ node: "Check Status 2", type: "main", index: 0 }]],
    },
    "Check Status 2": {
      main: [[{ node: "If Still Pending 2", type: "main", index: 0 }]],
    },
    "If Still Pending 2": {
      main: [
        // true branch
        [{ node: "Send Follow-up 2", type: "main", index: 0 }],
        // false branch
        [],
      ],
    },
    "Send Follow-up 2": {
      main: [[{ node: "Mark Follow-up 2 Sent", type: "main", index: 0 }]],
    },
  },
  settings: {
    executionOrder: "v1",
  },
};

async function main() {
  console.log("Creating QuoteLoop Follow-Up workflow in n8n...\n");

  // Check if workflow already exists
  const listRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
    headers: { "X-N8N-API-KEY": N8N_API_KEY },
  });

  if (listRes.ok) {
    const { data: workflows } = await listRes.json();
    const existing = workflows.find(
      (w: { name: string }) => w.name === "QuoteLoop Follow-Up"
    );
    if (existing) {
      console.log(
        `Workflow already exists (ID: ${existing.id}). Updating...`
      );

      const updateRes = await fetch(
        `${N8N_BASE_URL}/api/v1/workflows/${existing.id}`,
        {
          method: "PUT",
          headers: {
            "X-N8N-API-KEY": N8N_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflowData),
        }
      );

      if (!updateRes.ok) {
        const err = await updateRes.text();
        console.error("Failed to update workflow:", err);
        process.exit(1);
      }

      // Activate
      await fetch(
        `${N8N_BASE_URL}/api/v1/workflows/${existing.id}/activate`,
        {
          method: "POST",
          headers: { "X-N8N-API-KEY": N8N_API_KEY },
        }
      );

      console.log(`Workflow updated and activated!`);
      console.log(`Webhook URL: ${N8N_BASE_URL}/webhook/quote-followup`);
      return;
    }
  }

  // Create new workflow
  const createRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
    method: "POST",
    headers: {
      "X-N8N-API-KEY": N8N_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workflowData),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error("Failed to create workflow:", err);
    process.exit(1);
  }

  const created = await createRes.json();
  console.log(`Workflow created (ID: ${created.id})`);

  // Activate the workflow
  const activateRes = await fetch(
    `${N8N_BASE_URL}/api/v1/workflows/${created.id}/activate`,
    {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_API_KEY },
    }
  );

  if (!activateRes.ok) {
    const err = await activateRes.text();
    console.error("Failed to activate workflow:", err);
    process.exit(1);
  }

  console.log("Workflow activated!");
  console.log(`\nWebhook URL: ${N8N_BASE_URL}/webhook/quote-followup`);
  console.log(
    `\nAdd this to your .env:\nN8N_WEBHOOK_URL="${N8N_BASE_URL}/webhook/quote-followup"`
  );
}

main().catch(console.error);
