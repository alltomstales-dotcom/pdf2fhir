/** Structured clinical extract produced by stub or live LLM. */

export interface Coding {
  system: string
  code: string
  display: string
  /** Stub / terminology confidence 0–1 */
  confidence?: number
}

export interface ExtractedPatient {
  name?: string
  birthDate?: string
  gender?: string
  identifier?: string
}

export interface ExtractedCondition {
  display: string
  coding: Coding[]
  clinicalStatus?: string
  onsetDate?: string
}

export interface ExtractedObservation {
  display: string
  coding: Coding[]
  valueQuantity?: { value: number; unit: string }
  valueString?: string
  effectiveDateTime?: string
}

export interface ExtractedMedication {
  display: string
  coding: Coding[]
  dosageInstruction?: string
  status?: string
}

export interface ExtractedEncounter {
  type?: string
  periodStart?: string
  periodEnd?: string
  reason?: string
}

export interface ClinicalExtract {
  patient: ExtractedPatient
  encounter?: ExtractedEncounter
  conditions: ExtractedCondition[]
  observations: ExtractedObservation[]
  medications: ExtractedMedication[]
  diagnoses: ExtractedCondition[]
  rawNotes?: string
  source: 'stub' | 'live'
}

export type LlmMode = 'stub' | 'live' | 'live-fallback'
