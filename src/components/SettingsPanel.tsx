import { useState } from 'react'
import {
  clearApiKey,
  loadSettings,
  saveSettings,
  type LlmSettings,
} from '../lib/llm/settings'

interface Props {
  onChange: (s: LlmSettings) => void
}

export function SettingsPanel({ onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<LlmSettings>(() => loadSettings())
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const next = saveSettings(form)
    setForm(next)
    onChange(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function handleClearKey() {
    const next = clearApiKey()
    setForm(next)
    onChange(next)
  }

  return (
    <section className="panel settings-panel">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? '▾' : '▸'} Settings (API key / base URL / model)
      </button>
      {open && (
        <form className="settings-form" onSubmit={handleSave}>
          <p className="hint">
            Placeholders only — leave API key empty to use Demo stub mode. Key is stored in
            localStorage on this browser (never committed).
          </p>
          <label>
            API key
            <input
              type="password"
              autoComplete="off"
              placeholder="sk-… (leave empty for Demo stub)"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
          </label>
          <label>
            Base URL
            <input
              type="url"
              placeholder="https://api.openai.com/v1"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            />
          </label>
          <label>
            Model
            <input
              type="text"
              placeholder="gpt-4o-mini"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </label>
          <div className="row">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleClearKey}>
              Clear API key
            </button>
            {saved && <span className="ok">Saved</span>}
          </div>
        </form>
      )}
    </section>
  )
}
