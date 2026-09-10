import type { FhirBundle } from '../lib/fhir/mapToBundle'

interface Props {
  bundle: FhirBundle | null
  flags: string[]
}

export function BundleView({ bundle, flags }: Props) {
  if (!bundle) return null

  const json = JSON.stringify(bundle, null, 2)
  const shortId = bundle.id.slice(0, 8)

  function download() {
    const blob = new Blob([json], {
      type: 'application/fhir+json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pdf2fhir-bundle-${shortId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copy() {
    await navigator.clipboard.writeText(json)
  }

  return (
    <section className="panel">
      <div className="row between">
        <h2>FHIR R4 Bundle</h2>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={copy}>
            Copy JSON
          </button>
          <button type="button" className="btn btn-primary" onClick={download}>
            Download Bundle
          </button>
        </div>
      </div>
      {flags.length > 0 && (
        <div className="banner banner-warn flags">
          <strong>Terminology flags (light check)</strong>
          <ul>
            {flags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      <pre className="json">{json}</pre>
    </section>
  )
}
