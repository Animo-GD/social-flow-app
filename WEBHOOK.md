# SocialFlow n8n Webhook Guide

This guide details the webhooks needed in your n8n workflows to interact with the SocialFlow application.

You must configure these webhook URLs in your `.env.local` (for development) and in your Coolify deployment environment variables (for production).

---

## 1. Content Generation Webhook
**Environment Variable:** `N8N_CONTENT_GENERATE_URL`
**Purpose:** Triggered when the user clicks "Generate Text" or "Generate Both". This workflow is responsible for using AI to generate the post content. It is asynchronous.

### The Request (from SocialFlow to n8n)
SocialFlow makes a `POST` request to this webhook with the following JSON body:
```json
{
  "jobId": "uuid-from-supabase",
  "topic": "AI marketing tools",
  "platform": "instagram",
  "tone": "Casual",
  "language": "English",
  "user_id": "user-uuid"
}
```

### The n8n Workflow Responsibilities
1. Receive the Webhook trigger.
2. Immediately respond to the webhook with `200 OK` so the UI isn't blocked.
3. Process the AI generation using the topic, platform, tone, and language.
4. **Crucial Step**: The workflow MUST update the Supabase table `generation_jobs` when it finishes.
   - Send a `PATCH` request to your Supabase REST API: `https://[YOUR_REF].supabase.co/rest/v1/generation_jobs?id=eq.[jobId]`
   - Include headers: `apikey: [YOUR_ANON_KEY]`, `Authorization: Bearer [YOUR_ANON_KEY]`, `Content-Type: application/json`, `Prefer: return=minimal`.
   - Body for Success:
     ```json
     {
       "status": "completed",
       "result": {
         "text": "Your generated post text here..."
       }
     }
     ```
   - Body for Failure:
     ```json
     {
       "status": "failed",
       "error_msg": "The AI failed to generate content."
     }
     ```

---

## 2. Post Scheduling Webhook (Future Implementation)
**Environment Variable:** `N8N_POST_SCHEDULE_URL`
**Purpose:** Triggered when the user clicks "Schedule Post". This passes the post to n8n to be scheduled natively or published directly.

### The Request (from SocialFlow to n8n)
```json
{
  "post_id": "uuid",
  "user_id": "user-uuid",
  "platform": "instagram",
  "content": "This is the post text",
  "scheduled_time": "2026-05-01T15:00:00Z"
}
```

### The Expected Output
Respond immediately with `200 OK`. No callback to Supabase is strictly required if the post scheduling is instantaneous in your system, but you can choose to update the `posts` table's `status` column from `scheduled` to `posted` later.

---

## 3. Message Reply Webhook (Future Implementation)
**Environment Variable:** `N8N_MESSAGE_REPLY_URL`
**Purpose:** Triggered when a user replies to a message conversation manually from the SocialFlow UI.

### The Request (from SocialFlow to n8n)
```json
{
  "conversation_id": "uuid",
  "user_id": "user-uuid",
  "platform": "whatsapp",
  "reply_text": "Hello, how can I help you today?"
}
```

### The Expected Output
Respond immediately with `200 OK`. n8n should then take the `reply_text` and route it to the specific platform API (WhatsApp/Telegram).
