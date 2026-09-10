/**
 * Deterministic fake structured clinical extract.
 * Regex-ish parsing of uploaded text + rich canned discharge when text is short.
 */
import { SAMPLE_DISCHARGE_TEXT } from '../../data/sampleDischarge'
import type {
  ClinicalExtract,
  Coding,
  ExtractedCondition,
  ExtractedMedication,
  ExtractedObservation,
  ExtractedPatient,
} from './types'

const ICD10 = 'http://hl7.org/fhir/sid/icd-10-cm'
const LOINC = 'http://loinc.org'
const SNOMED = 'http://snomed.info/sct'
const RXNORM = 'http://www.nlm.nih.gov/research/umls/rxnorm'

function code(
  system: string,
  code: string,
  display: string,
  confidence = 0.85,
): Coding {
  return { system, code, display, confidence }
}

/** Rich canned extract used when input is short / empty / sample. */
function cannedDischargeExtract(sourceText: string): ClinicalExtract {
  return {
    patient: {
      name: 'Jane A. Doe',
      birthDate: '1968-07-22',
      gender: 'female',
      identifier: 'MG-482917',
    },
    encounter: {
      type: 'Inpatient encounter',
      periodStart: '2024-03-12',
      periodEnd: '2024-03-18',
      reason: 'Shortness of breath, chest pain',
    },
    conditions: [
      {
        display: 'Non-ST elevation myocardial infarction (NSTEMI)',
        coding: [
          code(ICD10, 'I21.4', 'Non-ST elevation (NSTEMI) myocardial infarction', 0.92),
          code(SNOMED, '401314000', 'Acute non-ST segment elevation myocardial infarction', 0.88),
        ],
        clinicalStatus: 'active',
        onsetDate: '2024-03-12',
      },
      {
        display: 'Type 2 diabetes mellitus without complications',
        coding: [
          code(ICD10, 'E11.9', 'Type 2 diabetes mellitus without complications', 0.95),
          code(SNOMED, '44054006', 'Diabetes mellitus type 2', 0.9),
        ],
        clinicalStatus: 'active',
      },
      {
        display: 'Essential (primary) hypertension',
        coding: [
          code(ICD10, 'I10', 'Essential (primary) hypertension', 0.95),
          code(SNOMED, '59621000', 'Essential hypertension', 0.9),
        ],
        clinicalStatus: 'active',
      },
      {
        display: 'Hyperlipidemia, unspecified',
        coding: [
          code(ICD10, 'E78.5', 'Hyperlipidemia, unspecified', 0.9),
          code(SNOMED, '55822004', 'Hyperlipidemia', 0.85),
        ],
        clinicalStatus: 'active',
      },
    ],
    diagnoses: [
      {
        display: 'Non-ST elevation myocardial infarction (NSTEMI)',
        coding: [code(ICD10, 'I21.4', 'Non-ST elevation (NSTEMI) myocardial infarction', 0.92)],
        clinicalStatus: 'active',
        onsetDate: '2024-03-12',
      },
    ],
    observations: [
      {
        display: 'Glucose',
        coding: [code(LOINC, '2345-7', 'Glucose [Mass/volume] in Serum or Plasma', 0.95)],
        valueQuantity: { value: 142, unit: 'mg/dL' },
        effectiveDateTime: '2024-03-18',
      },
      {
        display: 'Hemoglobin A1c',
        coding: [code(LOINC, '4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood', 0.95)],
        valueQuantity: { value: 7.8, unit: '%' },
        effectiveDateTime: '2024-03-18',
      },
      {
        display: 'Troponin I',
        coding: [code(LOINC, '10839-9', 'Troponin I.cardiac [Mass/volume] in Serum or Plasma', 0.9)],
        valueQuantity: { value: 0.08, unit: 'ng/mL' },
        effectiveDateTime: '2024-03-18',
      },
      {
        display: 'Total cholesterol',
        coding: [code(LOINC, '2093-3', 'Cholesterol [Mass/volume] in Serum or Plasma', 0.92)],
        valueQuantity: { value: 198, unit: 'mg/dL' },
        effectiveDateTime: '2024-03-18',
      },
      {
        display: 'LDL cholesterol',
        coding: [code(LOINC, '2089-1', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma', 0.92)],
        valueQuantity: { value: 118, unit: 'mg/dL' },
        effectiveDateTime: '2024-03-18',
      },
      {
        display: 'Blood pressure',
        coding: [code(LOINC, '85354-9', 'Blood pressure panel with all children optional', 0.88)],
        valueString: '132/78 mmHg',
        effectiveDateTime: '2024-03-18',
      },
    ],
    medications: [
      {
        display: 'Aspirin 81 mg',
        coding: [code(RXNORM, '243670', 'Aspirin 81 MG Oral Tablet', 0.9)],
        dosageInstruction: '81 mg PO daily',
        status: 'active',
      },
      {
        display: 'Clopidogrel 75 mg',
        coding: [code(RXNORM, '309362', 'Clopidogrel 75 MG Oral Tablet', 0.9)],
        dosageInstruction: '75 mg PO daily',
        status: 'active',
      },
      {
        display: 'Atorvastatin 40 mg',
        coding: [code(RXNORM, '617312', 'Atorvastatin 40 MG Oral Tablet', 0.9)],
        dosageInstruction: '40 mg PO at bedtime',
        status: 'active',
      },
      {
        display: 'Lisinopril 10 mg',
        coding: [code(RXNORM, '314076', 'Lisinopril 10 MG Oral Tablet', 0.92)],
        dosageInstruction: '10 mg PO daily',
        status: 'active',
      },
      {
        display: 'Metformin 1000 mg',
        coding: [code(RXNORM, '861004', 'Metformin hydrochloride 1000 MG Oral Tablet', 0.92)],
        dosageInstruction: '1000 mg PO twice daily',
        status: 'active',
      },
    ],
    rawNotes: sourceText.slice(0, 500),
    source: 'stub',
  }
}

const CONDITION_PATTERNS: Array<{
  re: RegExp
  display: string
  coding: Coding[]
}> = [
  {
    re: /\b(NSTEMI|non[- ]?ST\s*elevation\s*myocardial\s*infarction)\b/i,
    display: 'Non-ST elevation myocardial infarction (NSTEMI)',
    coding: [code(ICD10, 'I21.4', 'Non-ST elevation (NSTEMI) myocardial infarction', 0.88)],
  },
  {
    re: /\b(STEMI|ST\s*elevation\s*myocardial\s*infarction)\b/i,
    display: 'ST elevation myocardial infarction',
    coding: [code(ICD10, 'I21.3', 'ST elevation (STEMI) myocardial infarction of unspecified site', 0.85)],
  },
  {
    re: /\b(type\s*2\s*diabetes|DM2|T2DM|diabetes mellitus type 2)\b/i,
    display: 'Type 2 diabetes mellitus',
    coding: [code(ICD10, 'E11.9', 'Type 2 diabetes mellitus without complications', 0.9)],
  },
  {
    re: /\b(essential\s+)?hypertension\b|\bHTN\b/i,
    display: 'Essential hypertension',
    coding: [code(ICD10, 'I10', 'Essential (primary) hypertension', 0.9)],
  },
  {
    re: /\bhyperlipid(a)?emia\b|\bhigh\s+cholesterol\b/i,
    display: 'Hyperlipidemia',
    coding: [code(ICD10, 'E78.5', 'Hyperlipidemia, unspecified', 0.85)],
  },
  {
    re: /\basthma\b/i,
    display: 'Asthma',
    coding: [code(ICD10, 'J45.909', 'Unspecified asthma, uncomplicated', 0.8)],
  },
  {
    re: /\bCOPD\b|chronic obstructive/i,
    display: 'COPD',
    coding: [code(ICD10, 'J44.9', 'Chronic obstructive pulmonary disease, unspecified', 0.8)],
  },
  {
    re: /\bpneumonia\b/i,
    display: 'Pneumonia',
    coding: [code(ICD10, 'J18.9', 'Pneumonia, unspecified organism', 0.8)],
  },
  {
    re: /\bCHF\b|heart failure|congestive heart/i,
    display: 'Heart failure',
    coding: [code(ICD10, 'I50.9', 'Heart failure, unspecified', 0.82)],
  },
  {
    re: /\bAtrial fibrillation\b|\bAFib\b|\bAF\b/i,
    display: 'Atrial fibrillation',
    coding: [code(ICD10, 'I48.91', 'Unspecified atrial fibrillation', 0.85)],
  },
]

const OBS_PATTERNS: Array<{
  re: RegExp
  display: string
  coding: Coding[]
  unit?: string
}> = [
  {
    re: /(?:glucose|blood sugar)[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dL)?/i,
    display: 'Glucose',
    coding: [code(LOINC, '2345-7', 'Glucose [Mass/volume] in Serum or Plasma', 0.85)],
    unit: 'mg/dL',
  },
  {
    re: /(?:hemoglobin\s*A1c|HbA1c|A1c)[:\s]+(\d+(?:\.\d+)?)\s*%?/i,
    display: 'Hemoglobin A1c',
    coding: [code(LOINC, '4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood', 0.9)],
    unit: '%',
  },
  {
    re: /(?:troponin\s*I?)[:\s]+(\d+(?:\.\d+)?)\s*(ng\/mL)?/i,
    display: 'Troponin',
    coding: [code(LOINC, '10839-9', 'Troponin I.cardiac [Mass/volume] in Serum or Plasma', 0.85)],
    unit: 'ng/mL',
  },
  {
    re: /(?:LDL)[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dL)?/i,
    display: 'LDL cholesterol',
    coding: [code(LOINC, '2089-1', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma', 0.85)],
    unit: 'mg/dL',
  },
  {
    re: /(?:total\s+)?cholesterol[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dL)?/i,
    display: 'Total cholesterol',
    coding: [code(LOINC, '2093-3', 'Cholesterol [Mass/volume] in Serum or Plasma', 0.85)],
    unit: 'mg/dL',
  },
  {
    re: /(?:blood\s+pressure|BP)[:\s]+(\d{2,3}\s*\/\s*\d{2,3})\s*(mmHg)?/i,
    display: 'Blood pressure',
    coding: [code(LOINC, '85354-9', 'Blood pressure panel with all children optional', 0.8)],
  },
]

const MED_PATTERNS: Array<{
  re: RegExp
  display: string
  coding: Coding[]
  dosage?: string
}> = [
  {
    re: /\baspirin\b(?:\s+(\d+)\s*mg)?/i,
    display: 'Aspirin',
    coding: [code(RXNORM, '243670', 'Aspirin 81 MG Oral Tablet', 0.85)],
    dosage: 'PO daily',
  },
  {
    re: /\bclopidogrel\b(?:\s+(\d+)\s*mg)?/i,
    display: 'Clopidogrel',
    coding: [code(RXNORM, '309362', 'Clopidogrel 75 MG Oral Tablet', 0.85)],
    dosage: 'PO daily',
  },
  {
    re: /\batorvastatin\b(?:\s+(\d+)\s*mg)?/i,
    display: 'Atorvastatin',
    coding: [code(RXNORM, '617312', 'Atorvastatin 40 MG Oral Tablet', 0.85)],
    dosage: 'PO at bedtime',
  },
  {
    re: /\blisinopril\b(?:\s+(\d+)\s*mg)?/i,
    display: 'Lisinopril',
    coding: [code(RXNORM, '314076', 'Lisinopril 10 MG Oral Tablet', 0.88)],
    dosage: 'PO daily',
  },
  {
    re: /\bmetformin\b(?:\s+(\d+)\s*mg)?/i,
    display: 'Metformin',
    coding: [code(RXNORM, '861004', 'Metformin hydrochloride 1000 MG Oral Tablet', 0.88)],
    dosage: 'PO twice daily',
  },
  {
    re: /\bmetoprolol\b(?:\s+(\d+)\s*mg)?/i,
    display: 'Metoprolol',
    coding: [code(RXNORM, '866427', 'Metoprolol tartrate 25 MG Oral Tablet', 0.8)],
    dosage: 'PO twice daily',
  },
]

function extractPatient(text: string): ExtractedPatient {
  const patient: ExtractedPatient = {}
  const nameMatch =
    text.match(/Patient[:\s]+([A-Z][a-zA-Z.'\-]+(?:\s+[A-Z][a-zA-Z.'\-]+){1,3})/) ||
    text.match(/Name[:\s]+([A-Z][a-zA-Z.'\-]+(?:\s+[A-Z][a-zA-Z.'\-]+){1,3})/)
  if (nameMatch) patient.name = nameMatch[1].trim()

  const dob =
    text.match(/(?:DOB|Date of Birth|Birth(?:\s*Date)?)[:\s]+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  if (dob) {
    const raw = dob[1]
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) patient.birthDate = raw
    else {
      const parts = raw.split('/')
      if (parts.length === 3) {
        const [m, d, y] = parts
        const year = y.length === 2 ? `19${y}` : y
        patient.birthDate = `${year.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }
    }
  }

  const sex = text.match(/(?:Sex|Gender)[:\s]+(Male|Female|Other|Unknown|M|F)/i)
  if (sex) {
    const g = sex[1].toLowerCase()
    patient.gender = g === 'm' ? 'male' : g === 'f' ? 'female' : g
  }

  const mrn = text.match(/(?:MRN|Medical Record)[:\s#]+([A-Z0-9\-]+)/i)
  if (mrn) patient.identifier = mrn[1]

  return patient
}

function parseFromText(text: string): ClinicalExtract {
  const patient = extractPatient(text)

  const conditions: ExtractedCondition[] = []
  for (const p of CONDITION_PATTERNS) {
    if (p.re.test(text)) {
      conditions.push({
        display: p.display,
        coding: p.coding,
        clinicalStatus: 'active',
      })
    }
  }

  const observations: ExtractedObservation[] = []
  for (const p of OBS_PATTERNS) {
    const m = text.match(p.re)
    if (m) {
      const obs: ExtractedObservation = {
        display: p.display,
        coding: p.coding,
      }
      if (m[1] && p.unit && !m[1].includes('/')) {
        obs.valueQuantity = { value: parseFloat(m[1]), unit: p.unit }
      } else if (m[1] && m[1].includes('/')) {
        obs.valueString = `${m[1].replace(/\s+/g, '')} mmHg`
      } else if (m[1]) {
        obs.valueString = m[1]
      }
      observations.push(obs)
    }
  }

  const medications: ExtractedMedication[] = []
  for (const p of MED_PATTERNS) {
    const m = text.match(p.re)
    if (m) {
      const dose = m[1] ? `${m[1]} mg ${p.dosage ?? ''}`.trim() : p.dosage
      medications.push({
        display: m[1] ? `${p.display} ${m[1]} mg` : p.display,
        coding: p.coding,
        dosageInstruction: dose,
        status: 'active',
      })
    }
  }

  const admit = text.match(/Admission Date[:\s]+(\d{4}-\d{2}-\d{2})/i)
  const discharge = text.match(/Discharge Date[:\s]+(\d{4}-\d{2}-\d{2})/i)
  const chief = text.match(/Chief Complaint[:\s]+([^\n]+)/i)

  // If almost nothing matched, fall back to canned so demo always works
  const thin =
    conditions.length === 0 &&
    observations.length === 0 &&
    medications.length === 0 &&
    !patient.name

  if (thin) {
    return cannedDischargeExtract(text || SAMPLE_DISCHARGE_TEXT)
  }

  return {
    patient: Object.keys(patient).length ? patient : { name: 'Unknown Patient' },
    encounter: {
      type: 'Encounter',
      periodStart: admit?.[1],
      periodEnd: discharge?.[1],
      reason: chief?.[1]?.trim(),
    },
    conditions,
    diagnoses: conditions.slice(0, 1),
    observations,
    medications,
    rawNotes: text.slice(0, 500),
    source: 'stub',
  }
}

/**
 * Deterministic stub extract from any clinical text.
 * Short / empty text → rich canned discharge summary.
 */
export function stubExtract(text: string): ClinicalExtract {
  const trimmed = (text || '').trim()
  // Treat very short input or explicit sample as canned
  if (trimmed.length < 80 || trimmed === SAMPLE_DISCHARGE_TEXT) {
    return cannedDischargeExtract(trimmed || SAMPLE_DISCHARGE_TEXT)
  }
  // Sample-like discharge → prefer canned richness if it looks like our sample
  if (/Jane A\. Doe/i.test(trimmed) && /NSTEMI/i.test(trimmed)) {
    return cannedDischargeExtract(trimmed)
  }
  return parseFromText(trimmed)
}
