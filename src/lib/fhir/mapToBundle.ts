/**
 * Map clinical extract → FHIR R4 Bundle (Patient, Encounter, Condition,
 * Observation, MedicationRequest).
 */
import { v4 as uuidv4 } from 'uuid'
import type {
  ClinicalExtract,
  Coding,
  ExtractedCondition,
  ExtractedMedication,
  ExtractedObservation,
} from '../llm/types'

export interface FhirResource {
  resourceType: string
  id: string
  [key: string]: unknown
}

export interface FhirBundle {
  resourceType: 'Bundle'
  type: 'collection'
  id: string
  timestamp: string
  meta?: {
    tag?: Array<{ system: string; code: string; display: string }>
  }
  entry: Array<{
    fullUrl: string
    resource: FhirResource
  }>
}

function fhirCoding(c: Coding) {
  return {
    system: c.system,
    code: c.code,
    display: c.display,
    extension: c.confidence != null
      ? [
          {
            url: 'https://pdf2fhir.demo/StructureDefinition/coding-confidence',
            valueDecimal: c.confidence,
          },
        ]
      : undefined,
  }
}

function codeableConcept(codings: Coding[], text?: string) {
  return {
    coding: codings.map(fhirCoding),
    text: text ?? codings[0]?.display,
  }
}

function mapCondition(
  c: ExtractedCondition,
  patientRef: string,
  id: string,
): FhirResource {
  return {
    resourceType: 'Condition',
    id,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: c.clinicalStatus ?? 'active',
        },
      ],
    },
    code: codeableConcept(c.coding, c.display),
    subject: { reference: patientRef },
    onsetDateTime: c.onsetDate,
  }
}

function mapObservation(
  o: ExtractedObservation,
  patientRef: string,
  id: string,
): FhirResource {
  const resource: FhirResource = {
    resourceType: 'Observation',
    id,
    status: 'final',
    code: codeableConcept(o.coding, o.display),
    subject: { reference: patientRef },
    effectiveDateTime: o.effectiveDateTime,
  }
  if (o.valueQuantity) {
    resource.valueQuantity = {
      value: o.valueQuantity.value,
      unit: o.valueQuantity.unit,
      system: 'http://unitsofmeasure.org',
      code: o.valueQuantity.unit,
    }
  } else if (o.valueString) {
    resource.valueString = o.valueString
  }
  return resource
}

function mapMedication(
  m: ExtractedMedication,
  patientRef: string,
  id: string,
): FhirResource {
  return {
    resourceType: 'MedicationRequest',
    id,
    status: m.status ?? 'active',
    intent: 'order',
    medicationCodeableConcept: codeableConcept(m.coding, m.display),
    subject: { reference: patientRef },
    dosageInstruction: m.dosageInstruction
      ? [{ text: m.dosageInstruction }]
      : undefined,
  }
}

export function mapToBundle(extract: ClinicalExtract): FhirBundle {
  const bundleId = uuidv4()
  const patientId = uuidv4()
  const patientRef = `Patient/${patientId}`
  const entries: FhirBundle['entry'] = []

  const nameParts = (extract.patient.name ?? 'Unknown Patient').trim().split(/\s+/)
  const family = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0]
  const given = nameParts.length > 1 ? nameParts.slice(0, -1) : undefined

  const patient: FhirResource = {
    resourceType: 'Patient',
    id: patientId,
    name: [{ use: 'official', family, given }],
    gender: extract.patient.gender?.toLowerCase(),
    birthDate: extract.patient.birthDate,
  }
  if (extract.patient.identifier) {
    patient.identifier = [
      {
        system: 'urn:pdf2fhir:mrn',
        value: extract.patient.identifier,
      },
    ]
  }
  entries.push({ fullUrl: `urn:uuid:${patientId}`, resource: patient })

  if (extract.encounter) {
    const encId = uuidv4()
    const enc: FhirResource = {
      resourceType: 'Encounter',
      id: encId,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IMP',
        display: 'inpatient encounter',
      },
      type: extract.encounter.type
        ? [{ text: extract.encounter.type }]
        : undefined,
      subject: { reference: patientRef },
      period: {
        start: extract.encounter.periodStart,
        end: extract.encounter.periodEnd,
      },
      reasonCode: extract.encounter.reason
        ? [{ text: extract.encounter.reason }]
        : undefined,
    }
    entries.push({ fullUrl: `urn:uuid:${encId}`, resource: enc })
  }

  const seenConditions = new Set<string>()
  const allConditions = [...extract.conditions, ...extract.diagnoses]
  for (const c of allConditions) {
    const key = c.coding[0]?.code ?? c.display
    if (seenConditions.has(key)) continue
    seenConditions.add(key)
    const id = uuidv4()
    entries.push({
      fullUrl: `urn:uuid:${id}`,
      resource: mapCondition(c, patientRef, id),
    })
  }

  for (const o of extract.observations) {
    const id = uuidv4()
    entries.push({
      fullUrl: `urn:uuid:${id}`,
      resource: mapObservation(o, patientRef, id),
    })
  }

  for (const m of extract.medications) {
    const id = uuidv4()
    entries.push({
      fullUrl: `urn:uuid:${id}`,
      resource: mapMedication(m, patientRef, id),
    })
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    id: bundleId,
    timestamp: new Date().toISOString(),
    meta: {
      tag: [
        {
          system: 'https://pdf2fhir.demo/CodeSystem/extraction-source',
          code: extract.source,
          display:
            extract.source === 'stub'
              ? 'Demo stub (not clinical)'
              : 'Live LLM extract (not clinical)',
        },
      ],
    },
    entry: entries,
  }
}

/** Light terminology post-check: flag low-confidence stub codes. */
export function terminologyFlags(bundle: FhirBundle): string[] {
  const flags: string[] = []
  for (const e of bundle.entry) {
    const code = e.resource.code as
      | { coding?: Array<{ code?: string; extension?: Array<{ valueDecimal?: number }> }> }
      | undefined
    const med = e.resource.medicationCodeableConcept as
      | { coding?: Array<{ code?: string; extension?: Array<{ valueDecimal?: number }> }> }
      | undefined
    const codings = code?.coding ?? med?.coding ?? []
    for (const c of codings) {
      const conf = c.extension?.[0]?.valueDecimal
      if (conf != null && conf < 0.85) {
        flags.push(
          `${e.resource.resourceType}/${e.resource.id}: code ${c.code} confidence ${conf.toFixed(2)} (review)`,
        )
      }
    }
  }
  return flags
}
