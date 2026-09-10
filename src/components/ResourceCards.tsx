import type { FhirBundle, FhirResource } from '../lib/fhir/mapToBundle'

interface Props {
  bundle: FhirBundle | null
}

function summary(r: FhirResource): string {
  switch (r.resourceType) {
    case 'Patient': {
      const name = (r.name as Array<{ family?: string; given?: string[] }>)?.[0]
      return [name?.given?.join(' '), name?.family].filter(Boolean).join(' ') || r.id
    }
    case 'Condition':
    case 'Observation':
      return (
        (r.code as { text?: string })?.text ||
        (r.code as { coding?: Array<{ display?: string }> })?.coding?.[0]?.display ||
        r.id
      )
    case 'MedicationRequest':
      return (
        (r.medicationCodeableConcept as { text?: string })?.text ||
        (r.medicationCodeableConcept as { coding?: Array<{ display?: string }> })?.coding?.[0]
          ?.display ||
        r.id
      )
    case 'Encounter':
      return (r.type as Array<{ text?: string }>)?.[0]?.text || 'Encounter'
    default:
      return r.id
  }
}

function confidenceLabel(r: FhirResource): string | null {
  const code = r.code as
    | { coding?: Array<{ extension?: Array<{ valueDecimal?: number }> }> }
    | undefined
  const med = r.medicationCodeableConcept as
    | { coding?: Array<{ extension?: Array<{ valueDecimal?: number }> }> }
    | undefined
  const conf =
    code?.coding?.[0]?.extension?.[0]?.valueDecimal ??
    med?.coding?.[0]?.extension?.[0]?.valueDecimal
  if (conf == null) return null
  return `confidence ${conf.toFixed(2)}${conf < 0.85 ? ' ⚠' : ''}`
}

export function ResourceCards({ bundle }: Props) {
  if (!bundle) return null
  const byType = new Map<string, FhirResource[]>()
  for (const e of bundle.entry) {
    const list = byType.get(e.resource.resourceType) ?? []
    list.push(e.resource)
    byType.set(e.resource.resourceType, list)
  }

  return (
    <section className="panel">
      <h2>Resources ({bundle.entry.length})</h2>
      <div className="cards">
        {[...byType.entries()].map(([type, resources]) => (
          <div key={type} className="card-group">
            <h3>
              {type} <span className="count">{resources.length}</span>
            </h3>
            <ul>
              {resources.map((r) => (
                <li key={r.id} className="resource-card">
                  <span className="res-title">{summary(r)}</span>
                  {confidenceLabel(r) && (
                    <span className="res-meta">{confidenceLabel(r)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
