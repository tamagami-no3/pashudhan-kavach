# Chatbot Integration Specification & Drop-in Contract

This document defines the contract interface for the **Pashudhan Kavach Veterinary Chatbot Engine**.
All HTTP session handling, message persistence, authenticated context fetching, and frontend floating widget UI are fully built in **Section 8** and **Section 9**.

To replace the canned FAQ keyword responder with your real AI/LLM/NLU agent, simply replace the implementation of the `respond()` function in [`lib/services/chatbotPlaceholder.ts`](file:///c:/sih2026/project/lib/services/chatbotPlaceholder.ts).

---

## 1. Function Signature & Types

```typescript
export interface ChatbotContext {
  userId?: string | null;
  role?: string;
  district?: string;
  preferredLanguage?: 'en' | 'hi' | 'mr';
  animals?: Array<{
    id: string;
    tag_uid: string;
    species: string;
    health_status: string;
  }>;
  openReports?: Array<{
    id: string;
    status: string;
    animalTag?: string;
    reportedAt: string;
  }>;
  openLabCases?: Array<{
    sampleId: string;
    status: string;
  }>;
  upcomingVaccinations?: Array<{
    animalTag: string;
    description: string;
    nextDueAt: string;
  }>;
}

export interface ChatbotResponse {
  reply: string;                // The final formatted text reply to display to the user
  intent_matched?: string;      // Canonical intent name (e.g., 'symptoms_fmd', 'vaccination_due')
  confidence?: number;          // Confidence score between 0.0 and 1.0
  suggestions?: string[];       // Optional list of follow-up quick-reply chips
}

/**
 * Drop-in responder function
 */
export async function respond(
  message: string,
  context?: ChatbotContext
): Promise<ChatbotResponse>;
```

---

## 2. API Endpoints Built & Ready

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/chatbot/context/[userId]` | `GET` | Fetches compact JSON context (district, language, animals, open cases, vaccine due dates) | Auth (Self, Vet, Admin) |
| `/api/chatbot/sessions` | `POST` | Creates a new chat session (`channel: "web"` or `"inapp"`) | Public & Auth |
| `/api/chatbot/sessions/[id]/messages` | `POST` | Appends user message, executes `respond()`, appends bot message, returns both | Public & Auth |
| `/api/chatbot/sessions/[id]/messages` | `GET` | Retrieves paginated message history for session reload | Public & Auth |

---

## 3. Supported Languages

The chatbot engine supports 3 languages:
1. **English (`en`)**
2. **Hindi (`hi`)**
3. **Marathi (`mr`)**

When `context.preferredLanguage` is set to `'hi'` or `'mr'`, responses should naturally favor that language.

---

## 4. Example Drop-in with Gemini / LangChain / custom API

```typescript
// in lib/services/chatbotPlaceholder.ts
import { GoogleGenAI } from '@google/genai';

export async function respond(message: string, context?: ChatbotContext): Promise<ChatbotResponse> {
  // 1. Build prompt injecting context (user district, animals, language)
  // 2. Call LLM
  // 3. Return { reply: responseText, intent_matched: 'llm_generated', confidence: 0.95 }
}
```

No database schema, route changes, or UI modifications are needed!

