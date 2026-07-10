/**
 * Minimal OpenAI chat helper with a cost-first model fallback chain.
 * Extraction-style jobs (screenshot drafting, cluster triage) run fine on
 * the cheapest nano-tier models, so callers list models cheapest-first and
 * we step up only if the account doesn't have one. Server-side only.
 */

type ChatContent = string | Array<Record<string, unknown>>;

export async function chatJSON(input: {
  /** cheapest-first; first available model wins */
  models: string[];
  system: string;
  user: ChatContent;
  maxOutputTokens: number;
}): Promise<
  | { ok: true; json: Record<string, unknown>; model: string }
  | { ok: false; error: string }
> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "AI isn't configured yet (OPENAI_API_KEY missing)." };
  }

  let lastError = "No model in the fallback chain responded.";
  for (const model of input.models) {
    const isReasoningFamily = /^(gpt-5|o\d)/.test(model);
    const body: Record<string, unknown> = {
      model,
      response_format: { type: "json_object" },
      max_completion_tokens: input.maxOutputTokens,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      // gpt-5 / o-series: fixed temperature, but reasoning effort is tunable
      // and "minimal"/"low" is right for extraction jobs
      ...(isReasoningFamily ? { reasoning_effort: "minimal" } : { temperature: 0.2 }),
    };

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          lastError = `${model} returned an empty response.`;
          continue;
        }
        try {
          return { ok: true, json: JSON.parse(content), model };
        } catch {
          lastError = `${model} returned unparseable JSON.`;
          continue;
        }
      }

      const errBody = await res.text();
      // Key/quota problems affect every model — stop immediately
      if (res.status === 401) return { ok: false, error: "OpenAI rejected the API key (401)." };
      if (res.status === 429) {
        return {
          ok: false,
          error:
            "OpenAI says the account is out of quota — top up billing at platform.openai.com and try again.",
        };
      }
      // Anything else (unknown model, unsupported param) → try the next model
      lastError = `${model}: ${res.status} ${errBody.slice(0, 160)}`;
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "TimeoutError"
          ? `${model} timed out.`
          : `${model}: network error.`;
    }
  }
  return { ok: false, error: lastError };
}

/** Cheapest-first chain, with an env override at the front. */
export function modelChain(envOverride: string | undefined): string[] {
  const chain = ["gpt-5-nano", "gpt-4.1-nano", "gpt-4o-mini"];
  return envOverride ? [envOverride, ...chain.filter((m) => m !== envOverride)] : chain;
}
