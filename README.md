# PDF2FHIR

**Medical PDF → FHIR R4 Bundle** (V0 demo / SIM)

> **NOT FOR CLINICAL USE.** This is an educational prototype. Outputs are illustrative only and must not be used for diagnosis, treatment, billing, or any clinical decision support.

Live demo (GitHub Pages): https://alltomstales-dotcom.github.io/pdf2fhir/

## What it does

1. Upload a clinical PDF (or click **Run sample**)
2. Extract text with pdf.js
3. Structure clinical entities via **Demo stub** (no API key) or **Live LLM** (OpenAI-compatible)
4. Map to a FHIR R4 `Bundle` with `Patient`, `Encounter`, `Condition`, `Observation`, `MedicationRequest`
5. Preview resource cards + download Bundle JSON

Stub codes include realistic ICD-10-CM, LOINC, SNOMED CT, and RxNorm examples. A light terminology check flags low-confidence stub codes in the UI.

## Stub vs Live

| Mode | When | Behavior |
|------|------|----------|
| **Demo stub** | No API key in Settings / env | Deterministic regex + canned discharge extract |
| **Live** | API key present | `POST {baseUrl}/chat/completions` JSON extract |
| **Live → stub fallback** | Live request errors | Stub runs; banner explains the failure |

Settings (API key, base URL, model) use placeholders from `.env` (`VITE_LLM_*`) with **localStorage overrides**. The API key is never committed.

## Quick start

```bash
npm install
cp .env.example .env   # optional placeholders only
npm run dev
```

Build for production (base path `/pdf2fhir/` for GitHub Pages):

```bash
npm run build
npm run preview
```

Deploy Pages:

```bash
npm run deploy   # builds then gh-pages -d dist
```

Or enable GitHub Pages on the `gh-pages` branch (root).

## Environment

See `.env.example`:

```
VITE_LLM_API_KEY=
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_MODEL=gpt-4o-mini
```

Leave `VITE_LLM_API_KEY` empty for stub-only demos.

## License

MIT — demo software, no clinical warranty.
