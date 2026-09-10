/**
 * OpenAI-compatible chat/completions JSON extraction when API key is present.
 */
import type { LlmSettings } from './settings'
import type { ClinicalExtract } from './types'

const SYSTEM_PROMPT = `You are a clinical information extraction engine for a DEMO tool (not for clinical use).
Extract structured data from the medical document text into JSON matching this schema exactly:
{
  "patient": { "name"?: string, "birthDate"?: string (YYYY-MM-DD), "gender"?: string, "identifier"?: string },
  "encounter": { "type"?: string, "periodStart"?: string, "periodEnd"?: string, "reason"?: string },
  "conditions": [{ "display": string, "coding": [{ "system": string, "code": string, "display": string, "confidence"?: number }], "clinicalStatus"?: string, "onsetDate"?: string }],
  "diagnoses": [ same shape as conditions ],
  "observations": [{ "display": string, "coding": [...], "valueQuantity"?: { "value": number, "unit": string }, "valueString"?: string, "effectiveDateTime"?: string }],
  "medications": [{ "display": string, "coding": [...], "dosageInstruction"?: string, "status"?: string }],
  "rawNotes"?: string
}
Use ICD-10-CM (http://hl7.org/fhir/sid/icd-10-cm), LOINC (http://loinc.org), SNOMED CT (http://snomed.info/sct), RxNorm (http://www.nlm.nih.gov/research/umls/rxnorm) when possible.
Set confidence 0-1 on each coding. Respond with JSON only, no markdown.`

export async function liveExtract(
  text: string,
  settings: LlmSettings,
): Promise<ClinicalExtract> {
  const base = settings.baseUrl.replace(/\/+$/, '')
  const url = `${base}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract clinical entities from this document:\n\n${text.slice(0, 120000)}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`LLM request failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM returned empty content')

  const parsed = JSON.parse(content) as Omit<ClinicalExtract, 'source'>
  return {
    patient: parsed.patient ?? {},
    encounter: parsed.encounter,
    conditions: parsed.conditions ?? [],
    diagnoses: parsed.diagnoses ?? [],
    observations: parsed.observations ?? [],
    medications: parsed.medications ?? [],
    rawNotes: parsed.rawNotes,
    source: 'live',
  }
}
