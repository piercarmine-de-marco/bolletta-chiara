/**
 * Test isolato per tutti i prompt di BollettaChiara.
 * Usa il CLI claude (già autenticato via Claude Code) — nessuna API key necessaria.
 * Uso: node scripts/test-prompts.mjs
 */

import { spawnSync } from 'child_process'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

// ── Dati di test ─────────────────────────────────────────────────────────────

const BOLLETTA_TESTO = `
FATTURA N. 2025-03847 — LuceItalia S.p.A.
Intestatario: Maria Rossi
Indirizzo fornitura: Via Roma 14, Milano
Codice cliente: 7890123
Codice POD: IT001E12345678
Periodo di fatturazione: 01/03/2025 - 31/05/2025
Consumi totali: 1240 kWh
Importo totale: 487,32 €
Bolletta precedente (gen-feb 2025): 142,10 €
Scadenza pagamento: 15/07/2025
`.trim()

const BOLLETTA_JSON = {
  codice_pod: 'IT001E12345678',
  codice_cliente: '7890123',
  intestatario: 'Maria Rossi',
  indirizzo_fornitura: 'Via Roma 14, Milano',
  periodo_fatturazione: '01/03/2025 - 31/05/2025',
  importo_totale: 487.32,
  importo_periodo_precedente: 142.10,
  consumi_kwh: 1240,
  scadenza_pagamento: '15/07/2025',
}

const FORM_COMPILATO = {
  nome_cognome: 'Maria Rossi',
  codice_cliente: '7890123',
  codice_pod: 'IT001E12345678',
  periodo_contestato: '01/03/2025 - 31/05/2025',
  importo_contestato: '€ 487,32',
  motivo_reclamo: 'Importo molto più alto rispetto alle bollette precedenti',
  note_aggiuntive: 'Non ho cambiato le mie abitudini di consumo.',
}

// ── Helper: chiama claude -p ──────────────────────────────────────────────────

function callClaude(systemPrompt, userMessage) {
  const result = spawnSync(
    CLAUDE_BIN,
    ['-p', userMessage, '--system-prompt', systemPrompt, '--model', MODEL],
    { encoding: 'utf8', timeout: 60_000 }
  )
  if (result.error) throw new Error(`Spawn error: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`claude CLI uscito con status ${result.status}:\n${result.stderr}`)
  return result.stdout.trim()
}

function tryParseJSON(text) {
  // Rimuove eventuali backtick markdown che il modello potrebbe aggiungere
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return { ok: true, parsed: JSON.parse(clean) }
  } catch (e) {
    return { ok: false, error: `JSON non parsabile: ${e.message}\nRisposta:\n${text}` }
  }
}

function printResult(label, ok, detail) {
  const icon = ok ? '✅' : '❌'
  console.log(`\n${icon}  ${label}`)
  console.log(detail)
  console.log('─'.repeat(60))
}

// ── Test 1: estratto ──────────────────────────────────────────────────────────

async function testEstrato() {
  const { promptEstrato } = await import('../src/prompts/estratto.js')
  const raw = callClaude(promptEstrato, `Testo bolletta:\n${BOLLETTA_TESTO}`)
  const { ok, parsed, error } = tryParseJSON(raw)

  const campiAttesi = [
    'codice_pod','codice_cliente','intestatario','indirizzo_fornitura',
    'periodo_fatturazione','importo_totale','importo_periodo_precedente',
    'consumi_kwh','scadenza_pagamento',
  ]
  if (!ok) return { pass: false, detail: error }

  const mancanti = campiAttesi.filter(c => !(c in parsed))
  if (mancanti.length) return { pass: false, detail: `Campi mancanti: ${mancanti.join(', ')}\n${JSON.stringify(parsed, null, 2)}` }

  // Verifica tipi
  if (typeof parsed.importo_totale !== 'number') return { pass: false, detail: `importo_totale deve essere number, ricevuto: ${typeof parsed.importo_totale}` }
  if (typeof parsed.consumi_kwh !== 'number') return { pass: false, detail: `consumi_kwh deve essere number, ricevuto: ${typeof parsed.consumi_kwh}` }

  return { pass: true, detail: JSON.stringify(parsed, null, 2) }
}

// ── Test 2: riepilogo ─────────────────────────────────────────────────────────

async function testRiepilogo() {
  const { promptRiepilogo } = await import('../src/prompts/riepilogo.js')
  const raw = callClaude(promptRiepilogo, `Dati bolletta:\n${JSON.stringify(BOLLETTA_JSON, null, 2)}`)
  const { ok, parsed, error } = tryParseJSON(raw)

  const campiAttesi = ['intestatario','periodo','consumi','importo','scadenza']
  if (!ok) return { pass: false, detail: error }

  const mancanti = campiAttesi.filter(c => !(c in parsed))
  if (mancanti.length) return { pass: false, detail: `Campi mancanti: ${mancanti.join(', ')}\n${JSON.stringify(parsed, null, 2)}` }

  return { pass: true, detail: JSON.stringify(parsed, null, 2) }
}

// ── Test 3: autocompila ───────────────────────────────────────────────────────

async function testAutocompila() {
  const { promptAutocompila } = await import('../src/prompts/autocompila.js')
  const raw = callClaude(promptAutocompila, `Dati bolletta:\n${JSON.stringify(BOLLETTA_JSON, null, 2)}`)
  const { ok, parsed, error } = tryParseJSON(raw)

  const campiAttesi = ['nome_cognome','codice_cliente','codice_pod','periodo_contestato','importo_contestato']
  if (!ok) return { pass: false, detail: error }

  const mancanti = campiAttesi.filter(c => !(c in parsed))
  if (mancanti.length) return { pass: false, detail: `Campi mancanti: ${mancanti.join(', ')}\n${JSON.stringify(parsed, null, 2)}` }

  const extra = Object.keys(parsed).filter(c => !campiAttesi.includes(c))
  if (extra.length) return { pass: false, detail: `Campi extra non attesi: ${extra.join(', ')}\n${JSON.stringify(parsed, null, 2)}` }

  if (!parsed.importo_contestato?.includes('€')) return { pass: false, detail: `importo_contestato manca del simbolo €: "${parsed.importo_contestato}"` }

  return { pass: true, detail: JSON.stringify(parsed, null, 2) }
}

// ── Test 4: guida-form ────────────────────────────────────────────────────────

async function testGuidaForm() {
  const { promptGuidaForm } = await import('../src/prompts/guida-form.js')
  const userMsg = `Campo da compilare: motivo_reclamo\nDati bolletta:\n${JSON.stringify(BOLLETTA_JSON, null, 2)}`
  const raw = callClaude(promptGuidaForm, userMsg)
  const { ok, parsed, error } = tryParseJSON(raw)

  if (!ok) return { pass: false, detail: error }
  if (!Array.isArray(parsed.opzioni)) return { pass: false, detail: `"opzioni" non è un array\n${JSON.stringify(parsed, null, 2)}` }
  if (parsed.opzioni.length !== 3) return { pass: false, detail: `Attese 3 opzioni, ricevute ${parsed.opzioni.length}\n${JSON.stringify(parsed, null, 2)}` }

  return { pass: true, detail: JSON.stringify(parsed, null, 2) }
}

// ── Test 5: soccorso ──────────────────────────────────────────────────────────

async function testSoccorso() {
  const { promptSoccorso } = await import('../src/prompts/soccorso.js')
  const statoForm = {
    campi: { ...FORM_COMPILATO, motivo_reclamo: null, note_aggiuntive: null },
    campiAutomaticiCompilati: true,
    campoManualeAttivo: 'motivo_reclamo',
    completato: false,
  }
  const userMsg = [
    `Stato form: ${JSON.stringify(statoForm, null, 2)}`,
    `Dati bolletta: ${JSON.stringify(BOLLETTA_JSON, null, 2)}`,
    `Suggerimenti già dati: ["Guarda il modulo e scegli il motivo del reclamo."]`,
  ].join('\n\n')

  const raw = callClaude(promptSoccorso, userMsg)

  // Conta frasi (approssimativo: split su . ! ?)
  const frasi = raw.split(/(?<=[.!?])\s+/).filter(f => f.trim().length > 0)
  if (frasi.length > 3) {
    return { pass: false, detail: `Troppo lungo (~${frasi.length} frasi):\n"${raw}"` }
  }
  return { pass: true, detail: `"${raw}"` }
}

// ── Test 6: reclamo ───────────────────────────────────────────────────────────

async function testReclamo() {
  const { promptReclamo } = await import('../src/prompts/reclamo.js')
  const userMsg = [
    `Form compilato: ${JSON.stringify(FORM_COMPILATO, null, 2)}`,
    `Dati bolletta: ${JSON.stringify(BOLLETTA_JSON, null, 2)}`,
  ].join('\n\n')

  const raw = callClaude(promptReclamo, userMsg)
  const parole = raw.trim().split(/\s+/).length

  if (!raw.startsWith('Gentile Servizio Clienti,')) {
    return { pass: false, detail: `Non inizia con "Gentile Servizio Clienti,"\n"${raw}"` }
  }
  if (parole > 150) {
    return { pass: false, detail: `Troppo lungo: ${parole} parole (max 150)\n"${raw}"` }
  }
  return { pass: true, detail: `(${parole} parole)\n"${raw}"` }
}

// ── Runner ────────────────────────────────────────────────────────────────────

const tests = [
  ['estratto.js     ', testEstrato],
  ['riepilogo.js    ', testRiepilogo],
  ['autocompila.js  ', testAutocompila],
  ['guida-form.js   ', testGuidaForm],
  ['soccorso.js     ', testSoccorso],
  ['reclamo.js      ', testReclamo],
]

console.log(`🧪  Test prompt BollettaChiara — modello: ${MODEL}`)
console.log('═'.repeat(60))

let passed = 0
let failed = 0

for (const [name, fn] of tests) {
  process.stdout.write(`⏳  ${name} ... `)
  try {
    const { pass, detail } = await fn()
    if (pass) {
      console.log('✅')
      console.log(detail)
      passed++
    } else {
      console.log('❌')
      console.log(detail)
      failed++
    }
  } catch (e) {
    console.log('❌')
    console.log(`Eccezione: ${e.message}`)
    failed++
  }
  console.log('─'.repeat(60))
}

console.log(`\nRisultato: ${passed}/${tests.length} passati`)
if (failed > 0) process.exit(1)
