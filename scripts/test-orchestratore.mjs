/**
 * Test del flusso completo dell'orchestratore senza React.
 * Simula stato e dispatch con un reducer locale.
 * Uso: node scripts/test-orchestratore.mjs
 */

import { orchestratore } from '../src/agents/orchestratore.js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// ── Stato iniziale (specchio di initialState in BollettaContext.jsx) ──────────

let stato = {
  bolletta: { raw: null, estratta: null, riepilogo: null },
  form: {
    campi: {
      nome_cognome: null, codice_cliente: null, codice_pod: null,
      periodo_contestato: null, importo_contestato: null,
      motivo_reclamo: null, note_aggiuntive: null,
    },
    campiAutomaticiCompilati: false,
    campoManualeAttivo: null,
    opzioniCampoAttivo: [],
    completato: false,
  },
  sessione: { storicoInterazioni: [], ultimoBloco: null },
  output: { bozzaReclamo: null },
}

// ── Reducer locale (stessa logica di BollettaContext.jsx) ─────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BOLLETTA_RAW':
      return { ...state, bolletta: { ...state.bolletta, raw: action.payload } }
    case 'SET_BOLLETTA_ESTRATTA':
      return { ...state, bolletta: { ...state.bolletta, estratta: action.payload } }
    case 'SET_RIEPILOGO':
      return { ...state, bolletta: { ...state.bolletta, riepilogo: action.payload } }
    case 'SET_CAMPI_AUTOMATICI':
      return { ...state, form: { ...state.form, campi: { ...state.form.campi, ...action.payload }, campiAutomaticiCompilati: true } }
    case 'SET_CAMPO_MANUALE':
      return { ...state, form: { ...state.form, campi: { ...state.form.campi, [action.payload.campo]: action.payload.valore } } }
    case 'SET_CAMPO_MANUALE_ATTIVO':
      return { ...state, form: { ...state.form, campoManualeAttivo: action.payload.campo, opzioniCampoAttivo: action.payload.opzioni ?? [] } }
    case 'ADD_INTERAZIONE':
      return { ...state, sessione: { ...state.sessione, storicoInterazioni: [...state.sessione.storicoInterazioni, action.payload], ultimoBloco: action.payload.testo } }
    case 'SET_RECLAMO':
      return { ...state, output: { bozzaReclamo: action.payload } }
    case 'SET_COMPLETATO':
      return { ...state, form: { ...state.form, completato: true } }
    default:
      throw new Error(`Action non gestita: ${action.type}`)
  }
}

function dispatch(action) {
  stato = reducer(stato, action)
  console.log(`  📦 dispatch ${action.type}`)
}

// ── Helper ────────────────────────────────────────────────────────────────────

function ok(label) { console.log(`✅  ${label}`) }
function fail(label, msg) { console.error(`❌  ${label}: ${msg}`); process.exit(1) }

// ── Carica PDF di test come base64 ─────────────────────────────────────────────

const publicDir = resolve(__dir, '../public')
const { readdirSync } = await import('fs')
const pdfFile = readdirSync(publicDir).find(f => f.endsWith('.pdf'))
const pdfBase64 = pdfFile
  ? readFileSync(resolve(publicDir, pdfFile)).toString('base64')
  : null

// In Node.js, estrattoAgent usa il JSON di esempio (ignora pdfBase64)
dispatch({ type: 'SET_BOLLETTA_RAW', payload: pdfBase64 })

// ── EVENTO 1: BOLLETTA_CARICATA ───────────────────────────────────────────────

console.log('\n═══ EVENTO: BOLLETTA_CARICATA ═══')
try {
  await orchestratore('BOLLETTA_CARICATA', stato, dispatch)
} catch (e) {
  fail('BOLLETTA_CARICATA', e.message)
}

if (!stato.bolletta.estratta) fail('bolletta.estratta', 'null dopo EstrattoAgent')
ok(`bolletta.estratta — codice_pod: ${stato.bolletta.estratta.codice_pod}`)

if (!stato.bolletta.riepilogo) fail('bolletta.riepilogo', 'null dopo RiepilogoAgent')
ok(`bolletta.riepilogo — importo: ${stato.bolletta.riepilogo.importo}`)

// ── EVENTO 2: RECLAMO_AVVIATO ─────────────────────────────────────────────────

console.log('\n═══ EVENTO: RECLAMO_AVVIATO ═══')
try {
  await orchestratore('RECLAMO_AVVIATO', stato, dispatch)
} catch (e) {
  fail('RECLAMO_AVVIATO', e.message)
}

if (!stato.form.campiAutomaticiCompilati) fail('campiAutomaticiCompilati', 'false')
ok(`form.campi.nome_cognome: ${stato.form.campi.nome_cognome}`)
ok(`form.campi.importo_contestato: ${stato.form.campi.importo_contestato}`)

if (stato.form.campoManualeAttivo !== 'motivo_reclamo') fail('campoManualeAttivo', `atteso motivo_reclamo, ricevuto ${stato.form.campoManualeAttivo}`)
ok(`campoManualeAttivo: motivo_reclamo`)

if (!Array.isArray(stato.form.opzioniCampoAttivo) || stato.form.opzioniCampoAttivo.length !== 3) {
  fail('opzioniCampoAttivo', `attese 3 opzioni, ricevute ${stato.form.opzioniCampoAttivo?.length}`)
}
ok(`opzioniCampoAttivo (${stato.form.opzioniCampoAttivo.length} opzioni):`)
stato.form.opzioniCampoAttivo.forEach((o, i) => console.log(`   ${i + 1}. ${o}`))

// ── Maria seleziona la prima opzione ─────────────────────────────────────────

dispatch({ type: 'SET_CAMPO_MANUALE', payload: { campo: 'motivo_reclamo', valore: stato.form.opzioniCampoAttivo[0] } })
ok(`motivo_reclamo impostato: "${stato.form.campi.motivo_reclamo}"`)

// ── EVENTO 3: UTENTE_BLOCCATO ─────────────────────────────────────────────────

console.log('\n═══ EVENTO: UTENTE_BLOCCATO ═══')
try {
  await orchestratore('UTENTE_BLOCCATO', stato, dispatch)
} catch (e) {
  fail('UTENTE_BLOCCATO', e.message)
}

if (!stato.sessione.ultimoBloco) fail('sessione.ultimoBloco', 'null dopo SoccorsoAgent')
ok(`SoccorsoAgent: "${stato.sessione.ultimoBloco}"`)

// ── EVENTO 4: FORM_COMPLETATO ─────────────────────────────────────────────────

console.log('\n═══ EVENTO: FORM_COMPLETATO ═══')
try {
  await orchestratore('FORM_COMPLETATO', stato, dispatch)
} catch (e) {
  fail('FORM_COMPLETATO', e.message)
}

if (!stato.form.completato) fail('form.completato', 'false')
ok('form.completato = true')

// ── Riepilogo finale ──────────────────────────────────────────────────────────

console.log('\n═══ STATO FINALE ═══')
console.log(JSON.stringify({
  'bolletta.estratta': stato.bolletta.estratta ? '✓' : '✗',
  'bolletta.riepilogo': stato.bolletta.riepilogo ? '✓' : '✗',
  'form.campiAutomaticiCompilati': stato.form.campiAutomaticiCompilati,
  'form.campi.nome_cognome': stato.form.campi.nome_cognome,
  'form.campi.motivo_reclamo': stato.form.campi.motivo_reclamo?.slice(0, 40),
  'form.completato': stato.form.completato,
  'sessione.storicoInterazioni': stato.sessione.storicoInterazioni.length,
}, null, 2))

console.log('\n✅  Flusso completo OK — tutti gli eventi producono i dispatch corretti')
