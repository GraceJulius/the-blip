import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { allow } from './guard';

const cache = (globalThis.__blipClaudeCache = globalThis.__blipClaudeCache || new Map());
let client = null;

export function claudeModel() {
  return process.env.CLAUDE_MODEL || 'claude-opus-5';
}

export function claudeAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  if (!claudeAvailable()) return null;
  if (!client) client = new Anthropic({ timeout: 25000, maxRetries: 1 });
  return client;
}

// Ask Claude for a structured answer. Never throws: returns { ok: false, reason } on any problem
// so callers can fall back to plain code.
export async function claudeParse({ system, user, schema, maxTokens = 2000, cacheKey }) {
  const c = getClient();
  if (!c) return { ok: false, reason: 'no_key' };

  const key = cacheKey ? crypto.createHash('sha256').update(claudeModel() + '|' + cacheKey).digest('hex') : null;
  if (key && cache.has(key)) return { ok: true, data: cache.get(key), cached: true };

  const budget = Number(process.env.CLAUDE_CALLS_PER_10MIN) || 40;
  if (!allow('claude:all', budget, 10 * 60 * 1000)) return { ok: false, reason: 'budget' };

  try {
    const res = await c.messages.parse({
      model: claudeModel(),
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'low', format: zodOutputFormat(schema) },
    });
    if (res.stop_reason === 'refusal') return { ok: false, reason: 'refusal' };
    if (!res.parsed_output) return { ok: false, reason: 'unparsed' };
    if (key) {
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(key, res.parsed_output);
    }
    return { ok: true, data: res.parsed_output, usage: res.usage };
  } catch (e) {
    return { ok: false, reason: 'error', message: e && e.message ? String(e.message).slice(0, 200) : 'error' };
  }
}
