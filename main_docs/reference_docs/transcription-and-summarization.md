# Transcription & Summarization (Replicate + DeepSeek) 🔊🧠

## Overview ✅
This document describes how audio transcription and transcript summarization/parsing are implemented in this project using Replicate models and DeepSeek (via Replicate). It lists the files that implement the flow, the exact model identifiers used, the API endpoints, request/response shape, prompts and environment variables.

---

## Relevant files 🔧
- `app/api/transcribe/route.ts` — Server side implementation: creates a signed Supabase URL for audio, calls Replicate Whisper to transcribe, then calls DeepSeek (via Replicate) to parse and generate a summary, and optionally upserts the results into the `transcripts` table.
- `lib/api.ts` — Client helper `transcribeAudio(audioPath, visitId?)` that calls the endpoint (`POST /api/transcribe`).
- `app/new/page.tsx` and `app/visits/new/page.tsx` — Example pages that call `transcribeAudio` to trigger transcription.

---

## Models used (Replicate) 🧾
- Whisper (audio → text):
  - **Model identifier:** `vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c`
  - **Input:** `{ audio: <signed_audio_url> }` (the code passes the Supabase signed URL directly so Replicate can fetch the audio)

- DeepSeek LLM (parsing & summary):
  - **Model identifier:** `deepseek-ai/deepseek-v3.1`
  - **Usage:** called twice — once to parse the transcript into strict JSON and once to produce a human-readable summary.

---

## How it works (flow) 🔁
1. Client uploads audio to Supabase storage and obtains a storage path (e.g. `uploads/recordings/abc.wav`).
2. Client calls `POST /api/transcribe` with JSON body `{ path: string, visit_id?: string }` (see API usage below).
3. `app/api/transcribe/route.ts`:
   - Creates a signed URL for the given storage `path` using Supabase (`createSignedUrl(path, 3600)` — valid for 1 hour).
   - Initializes Replicate with `REPLICATE_API_KEY` and calls:
     - Whisper model with `{ input: { audio: signedUrl } }` to get transcription text.
     - DeepSeek model with a custom *parsing prompt* (expects only JSON in a strict schema) to extract structured medical fields.
     - DeepSeek model again with a *summary prompt* to generate a short readable summary.
   - Attempts to parse returned DeepSeek output as JSON and, if `visit_id` was provided, upserts into the `transcripts` table.

---

## Prompts & parameters used 📝
- Parsing prompt: A long instruction that tells DeepSeek to return only valid JSON in the exact schema:
  ```json
  {
    "past_medical_history": [],
    "current_symptoms": {},
    "physical_exam_findings": {},
    "diagnosis": "",
    "treatment_plan": [],
    "prescriptions": []
  }
  ```
  Parsing call parameters (as used in the code):
  - `prompt`: (the prompt above + the transcript)
  - `max_tokens`: 8096
  - `response_format`: "json"
  - `temperature`: 0.2

- Summary call parameters:
  - `prompt`: a short prompt instructing a 2–3 paragraph concise summary including chief complaint, key exam findings, diagnosis, and treatment plan
  - `max_tokens`: 1000
  - `temperature`: 0.3

---

## API endpoints & request/response ✅
- Endpoint: **POST** `/api/transcribe`
  - Request body (JSON):
    - `path` (string) — path/identifier in Supabase storage (required)
    - `visit_id` (string) — optional; if provided the result is upserted into `transcripts` table with `visit_id`
  - Example client call (the app uses `lib/api.ts` helper `transcribeAudio` which includes auth headers):
    ```js
    await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
      body: JSON.stringify({ path: 'uploads/recordings/abc.wav', visit_id: 'visit_123' })
    })
    ```

  - Response (JSON):
    - `transcript`: string — full raw transcript
    - `structured`: object — parsed JSON with fields:
      - `past_medical_history`: string[]
      - `current_symptoms`: Record<string, any>
      - `physical_exam_findings`: Record<string, any>
      - `diagnosis`: string | string[]
      - `treatment_plan`: string[]
      - `prescriptions`: Array<{ medication?, dosage?, frequency?, duration? }>
    - `summary`: string — short readable summary

---

## Environment variables & dependencies ⚙️
- Required environment variables:
  - `REPLICATE_API_KEY` — API key for Replicate (used by the `replicate` npm client)
  - `STORAGE_BUCKET` — Supabase storage bucket name
- Dependencies:
  - `replicate` npm package (present in `package.json`)
  - Supabase server client (`lib/supabaseServer`) for signed URLs and DB upserts

---

## Notes & troubleshooting ⚠️
- The audio file URL is created using Supabase `createSignedUrl(path, 3600)`. The signed URL must be reachable by Replicate (i.e., not blocked by firewall or short-lived tokens).
- The code handles several response formats from the Whisper model — sometimes a string is returned, other times an object with `text`, `transcription`, or `output` fields.
- When parsing DeepSeek output, the code attempts to JSON.parse the response; if parsing fails it attempts to extract the JSON substring.
- If `REPLICATE_API_KEY` or `STORAGE_BUCKET` is missing, `/api/transcribe` returns a 500 with a clear error message.

---

If you want, I can add a couple of concrete example request/response payloads or add a small troubleshooting checklist with example failures and their likely causes. 💡