/** Read VITE_LLM_* env + localStorage overrides for API key / base / model. */

const LS_KEY = 'pdf2fhir.llm.settings'

export interface LlmSettings {
  apiKey: string
  baseUrl: string
  model: string
}

const DEFAULTS: LlmSettings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
}

function envDefaults(): LlmSettings {
  return {
    apiKey: (import.meta.env.VITE_LLM_API_KEY as string | undefined)?.trim() || '',
    baseUrl:
      (import.meta.env.VITE_LLM_BASE_URL as string | undefined)?.trim() ||
      DEFAULTS.baseUrl,
    model:
      (import.meta.env.VITE_LLM_MODEL as string | undefined)?.trim() || DEFAULTS.model,
  }
}

export function loadSettings(): LlmSettings {
  const env = envDefaults()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return env
    const parsed = JSON.parse(raw) as Partial<LlmSettings>
    return {
      apiKey: parsed.apiKey ?? env.apiKey,
      baseUrl: parsed.baseUrl?.trim() || env.baseUrl,
      model: parsed.model?.trim() || env.model,
    }
  } catch {
    return env
  }
}

export function saveSettings(partial: Partial<LlmSettings>): LlmSettings {
  const current = loadSettings()
  const next: LlmSettings = {
    apiKey: partial.apiKey !== undefined ? partial.apiKey : current.apiKey,
    baseUrl: partial.baseUrl !== undefined ? partial.baseUrl.trim() || DEFAULTS.baseUrl : current.baseUrl,
    model: partial.model !== undefined ? partial.model.trim() || DEFAULTS.model : current.model,
  }
  localStorage.setItem(LS_KEY, JSON.stringify(next))
  return next
}

export function clearApiKey(): LlmSettings {
  return saveSettings({ apiKey: '' })
}

export function hasApiKey(settings?: LlmSettings): boolean {
  const s = settings ?? loadSettings()
  return Boolean(s.apiKey && s.apiKey.trim().length > 0)
}
