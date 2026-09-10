import type { LlmMode } from '../lib/llm/types'

interface Props {
  mode: LlmMode | null
  fallbackMessage?: string
}

export function ModeBanner({ mode, fallbackMessage }: Props) {
  if (!mode) {
    return (
      <div className="banner banner-info" role="status">
        <strong>Ready</strong> — No API key → Demo stub. Add a key in Settings for Live LLM.
      </div>
    )
  }
  if (mode === 'stub') {
    return (
      <div className="banner banner-demo" role="status">
        <strong>Demo stub mode</strong> — Deterministic fake LLM extract (no API key). Not for
        clinical use.
      </div>
    )
  }
  if (mode === 'live-fallback') {
    return (
      <div className="banner banner-warn" role="status">
        <strong>Live failed → stub fallback</strong>
        {fallbackMessage ? ` ${fallbackMessage}` : ''}
      </div>
    )
  }
  return (
    <div className="banner banner-live" role="status">
      <strong>Live LLM mode</strong> — OpenAI-compatible chat/completions. Still a SIM / demo —
      not for clinical use.
    </div>
  )
}
