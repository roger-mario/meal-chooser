import "server-only";

/** Background estimates normally finish within a minute; older ones were cut off and count as failed. */
export const JOB_TIMEOUT_MS = 150_000;

export function isRunning(startedAt: Date | null | undefined) {
  return !!startedAt && Date.now() - startedAt.getTime() < JOB_TIMEOUT_MS;
}

/** Status of a background estimate, for the page. */
export function jobStatus(startedAt: Date | null, error: string | null) {
  if (isRunning(startedAt)) return { running: true as const, startedAt: startedAt!.toISOString(), error: null };
  if (startedAt) return { running: false as const, startedAt: null, error: "The estimate took too long and was stopped. Please try again." };
  return { running: false as const, startedAt: null, error };
}

type ErrorLike = { name?: string; type?: string; message?: string; statusCode?: number; lastError?: unknown; cause?: unknown };

function unwrap(e: unknown): ErrorLike {
  let err = (e ?? {}) as ErrorLike;
  // Retries wrap the real error.
  while (err.lastError) err = err.lastError as ErrorLike;
  return err;
}

function is(err: ErrorLike, type: string, name: string) {
  return err.type === type || err.name === name;
}

function short(text: string | undefined) {
  const t = (text ?? "").replace(/\x1b\[[0-9;]*m/g, "").replace(/\s+/g, " ").trim();
  return t.length > 220 ? `${t.slice(0, 220)}…` : t;
}

/** Turns an AI Gateway / AI SDK error into a message that says what to fix. */
export function aiErrorMessage(e: unknown): string {
  const err = unwrap(e);
  const model = process.env.AI_MODEL ?? "";
  const detail = short(err.message);

  if (/free tier/i.test(detail)) {
    return `The AI Gateway free tier can't use the model "${model}". Either add paid credits on the AI Gateway page in Vercel, or set AI_MODEL to a model the free tier allows, then redeploy.`;
  }
  if (is(err, "authentication_error", "GatewayAuthenticationError") || err.statusCode === 401) {
    return process.env.AI_GATEWAY_API_KEY
      ? "The AI Gateway did not accept the key. Check AI_GATEWAY_API_KEY in Vercel (create a new key under AI Gateway → API Keys), then redeploy."
      : "The AI Gateway could not log in. Add AI_GATEWAY_API_KEY in Vercel (AI Gateway → API Keys → Create key), then redeploy.";
  }
  if (is(err, "model_not_found", "GatewayModelNotFoundError")) {
    return `The AI model "${model}" does not exist. Set AI_MODEL in Vercel to an id from the AI Gateway model list (it looks like "provider/model-name"), then redeploy.`;
  }
  if (is(err, "rate_limit_exceeded", "GatewayRateLimitError") || err.statusCode === 429) {
    return "The AI Gateway is out of credits or got too many requests. Check the credits on the AI Gateway page in Vercel, then try again.";
  }
  if (is(err, "forbidden", "GatewayForbiddenError") || is(err, "failed_dependency", "GatewayFailedDependencyError") || err.statusCode === 402 || err.statusCode === 403) {
    return `The AI Gateway refused the request: ${detail || "access denied"}. This usually means billing or free credits aren't activated for the team yet (AI Gateway page in Vercel).`;
  }
  if (err.name === "AI_NoObjectGeneratedError" || err.name === "AI_TypeValidationError" || err.name === "AI_JSONParseError") {
    return `The AI answered, but not in the expected format. Try again, or choose a stronger model in AI_MODEL (currently "${model}").`;
  }
  if (is(err, "invalid_request_error", "GatewayInvalidRequestError") || err.statusCode === 400) {
    return `The AI Gateway rejected the request: ${detail || "invalid request"}. Check that AI_MODEL ("${model}") is a text model.`;
  }
  return `The AI request failed${detail ? `: ${detail}` : "."} Please try again.`;
}
