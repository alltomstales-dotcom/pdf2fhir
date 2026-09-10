/**
 * If no API key → stub; if key → live (catch errors → stub fallback).
 */
import { hasApiKey, loadSettings, type LlmSettings } from './settings'
import { liveExtract } from './liveExtract'
import { stubExtract } from './stubExtract'
import type { ClinicalExtract, LlmMode } from './types'

export interface ExtractResult {
  extract: ClinicalExtract
  mode: LlmMode
  /** Shown when live failed and stub was used */
  fallbackMessage?: string
}

export async function extractClinical(
  text: string,
  settings?: LlmSettings,
): Promise<ExtractResult> {
  const s = settings ?? loadSettings()

  if (!hasApiKey(s)) {
    return {
      extract: stubExtract(text),
      mode: 'stub',
    }
  }

  try {
    const extract = await liveExtract(text, s)
    return { extract, mode: 'live' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      extract: stubExtract(text),
      mode: 'live-fallback',
      fallbackMessage: `Live LLM failed — using Demo stub. (${message})`,
    }
  }
}

export { hasApiKey, loadSettings }
