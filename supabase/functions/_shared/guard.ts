export const MAX_BODY_CHARS = 8_000;
export const MAX_SUBJECT_CHARS = 500;
export const MAX_SENDER_CHARS = 200;
export const MAX_PROMPT_CHARS = 3_000;
export const MAX_OUTPUT_CHARS = 6_000;
export const MAX_AI_TOKENS = 1024;
export const MAX_WORKFLOW_STEPS = 8;

export function getClientKey(req: Request, deviceId?: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return deviceId ? `${ip}:${deviceId}` : ip;
}

export function validateAction(action: unknown, allowed: readonly string[]): string | null {
  if (typeof action !== "string" || !allowed.includes(action)) return "Unknown action";
  return null;
}

export function validateDeviceId(id: unknown): boolean {
  return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function requireDeviceId(id: unknown): string | null {
  if (!id || typeof id !== "string" || !validateDeviceId(id)) return "device_id required";
  return null;
}

export function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

export function validateEmailFields(data: Record<string, unknown>): string | null {
  const subject = sanitizeString(data.subject, MAX_SUBJECT_CHARS);
  const body = sanitizeString(data.body, MAX_BODY_CHARS);
  const sender = sanitizeString(data.sender, MAX_SENDER_CHARS);
  if (!subject && !body) return "subject or body required";
  if (typeof data.subject === "string" && data.subject.length > MAX_SUBJECT_CHARS) return "subject too long";
  if (typeof data.body === "string" && data.body.length > MAX_BODY_CHARS) return "body too long";
  if (typeof data.sender === "string" && data.sender.length > MAX_SENDER_CHARS) return "sender too long";
  data.subject = subject;
  data.body = body;
  data.sender = sender;
  return null;
}

export function validatePromptField(data: Record<string, unknown>, field = "problem"): string | null {
  const value = sanitizeString(data[field], MAX_PROMPT_CHARS);
  if (!value) return `${field} required`;
  data[field] = value;
  return null;
}

export function validatePayloadSize(data: Record<string, unknown>): string | null {
  const serialized = JSON.stringify(data);
  if (serialized.length > 20_000) return "request too large";
  return null;
}

export function aiTokenLimit(): number {
  return MAX_AI_TOKENS;
}
