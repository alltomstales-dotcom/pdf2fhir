import { useCallback, useState } from 'react'
import { BundleView } from './components/BundleView'
import { ModeBanner } from './components/ModeBanner'
import { ResourceCards } from './components/ResourceCards'
import { SettingsPanel } from './components/SettingsPanel'
import { SAMPLE_DISCHARGE_TEXT } from './data/sampleDischarge'
import { mapToBundle, terminologyFlags, type FhirBundle } from './lib/fhir/mapToBundle'
import { extractClinical } from './lib/llm/client'
import { hasApiKey, loadSettings, type LlmSettings } from './lib/llm/settings'
import type { LlmMode } from './lib/llm/types'
import { extractTextFromPdf } from './lib/pdf/extractText'
import './App.css'

export default function App() {
  const [settings, setSettings] = useState<LlmSettings>(() => loadSettings())
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [bundle, setBundle] = useState<FhirBundle | null>(null)
  const [flags, setFlags] = useState<string[]>([])
  const [mode, setMode] = useState<LlmMode | null>(null)
  const [fallbackMessage, setFallbackMessage] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runExtract = useCallback(
    async (sourceText: string) => {
      setBusy(true)
      setError(null)
      setFallbackMessage(undefined)
      try {
        const result = await extractClinical(sourceText, settings)
        const b = mapToBundle(result.extract)
        setBundle(b)
        setFlags(terminologyFlags(b))
        setMode(result.mode)
        setFallbackMessage(result.fallbackMessage)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setBundle(null)
      } finally {
        setBusy(false)
      }
    },
    [settings],
  )

  async function onFile(file: File | null) {
    if (!file) return
    setBusy(true)
    setError(null)
    setFileName(file.name)
    try {
      const extracted = await extractTextFromPdf(file)
      if (!extracted.trim()) {
        throw new Error('No text could be extracted from this PDF (scanned/image-only?).')
      }
      setText(extracted)
      await runExtract(extracted)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  async function onRunSample() {
    setFileName('sample-discharge.txt')
    setText(SAMPLE_DISCHARGE_TEXT)
    await runExtract(SAMPLE_DISCHARGE_TEXT)
  }

  async function onRunText() {
    if (!text.trim()) {
      setError('Paste text or upload a PDF first.')
      return
    }
    await runExtract(text)
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>PDF2FHIR</h1>
          <p className="tagline">
            Medical PDF → FHIR R4 Bundle · V0 demo ·{' '}
            <strong>NOT FOR CLINICAL USE</strong>
          </p>
        </div>
        <div className="header-meta">
          <span className={`pill ${hasApiKey(settings) ? 'pill-live' : 'pill-demo'}`}>
            {hasApiKey(settings) ? 'Key set → Live' : 'No key → Stub'}
          </span>
        </div>
      </header>

      <ModeBanner mode={mode} fallbackMessage={fallbackMessage} />

      <SettingsPanel
        onChange={(s) => {
          setSettings(s)
        }}
      />

      <section className="panel upload-panel">
        <h2>1. Upload PDF or run sample</h2>
        <div className="row wrap">
          <label className="file-btn btn btn-primary">
            Upload PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="button" className="btn btn-accent" onClick={onRunSample} disabled={busy}>
            Run sample
          </button>
          <button type="button" className="btn btn-ghost" onClick={onRunText} disabled={busy}>
            Extract from text below
          </button>
          {fileName && <span className="hint">Source: {fileName}</span>}
        </div>
        {busy && <p className="busy">Working…</p>}
        {error && (
          <div className="banner banner-warn" role="alert">
            {error}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>2. Extracted text preview</h2>
        <textarea
          className="text-preview"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Upload a PDF or click Run sample. You can also paste clinical text here."
          rows={12}
        />
      </section>

      <ResourceCards bundle={bundle} />
      <BundleView bundle={bundle} flags={flags} />

      <footer className="footer">
        <p>
          PDF2FHIR is a SIM / educational prototype. Outputs are not clinical decision support.
          Stub codes are illustrative (ICD-10 / LOINC / SNOMED / RxNorm).
        </p>
      </footer>
    </div>
  )
}
