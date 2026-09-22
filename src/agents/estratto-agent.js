import { promptEstrato } from '../prompts/estratto.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

function parseClaudeResponse(raw) {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
}

async function estrattoAgentNode() {
  const { spawnSync } = await import('child_process')
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')

  const __dir = dirname(fileURLToPath(import.meta.url))
  const b = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))

  const testo = `FATTURA N. 2025-03847 — LuceItalia S.p.A.
Intestatario: ${b.intestatario}
Indirizzo fornitura: ${b.indirizzo_fornitura}
Codice cliente: ${b.codice_cliente}
Codice POD: ${b.codice_pod}
Periodo di fatturazione: ${b.periodo_fatturazione}
Consumi totali: ${b.consumi_kwh} kWh
Importo totale: ${b.importo_totale} €
Bolletta precedente: ${b.importo_periodo_precedente} €
Scadenza pagamento: ${b.scadenza_pagamento}`

  const result = spawnSync(
    CLAUDE_BIN,
    ['-p', `Testo bolletta:\n${testo}`, '--system-prompt', promptEstrato, '--model', MODEL],
    { encoding: 'utf8', timeout: 60_000 }
  )
  if (result.error) throw new Error(`Spawn error: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`claude CLI exit ${result.status}:\n${result.stderr}`)
  return parseClaudeResponse(result.stdout.trim())
}

async function estrattoAgentBrowser(pdfBase64) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt: promptEstrato, pdfBase64 }),
  })
  if (!res.ok) throw new Error(await res.text())
  const { response, error } = await res.json()
  if (error) throw new Error(error)
  return parseClaudeResponse(response)
}

export async function estrattoAgent(pdfBase64) {
  try {
    if (typeof window === 'undefined') return await estrattoAgentNode()
    return await estrattoAgentBrowser(pdfBase64)
  } catch (err) {
    if (typeof window !== 'undefined') throw new Error('Non riesco a leggere la bolletta. Prova a ricaricarla.')
    throw err
  }
}

// TEST
async function testEstrattoAgent() {
  console.log('🧪  testEstrattoAgent — dati da bolletta-esempio.json')
  console.log('⏳  Chiamata a Claude CLI...')
  let result
  try { result = await estrattoAgent(null) } catch (e) { console.error('❌  Errore:', e.message); process.exit(1) }
  console.log('\n✅  JSON estratto:')
  console.log(JSON.stringify(result, null, 2))
  const campiAttesi = ['codice_pod','codice_cliente','intestatario','indirizzo_fornitura','periodo_fatturazione','importo_totale','importo_periodo_precedente','consumi_kwh','scadenza_pagamento']
  const mancanti = campiAttesi.filter(c => !(c in result))
  if (typeof result.importo_totale !== 'number') console.warn('⚠️   importo_totale non è number')
  if (mancanti.length) console.warn('⚠️   Campi mancanti:', mancanti.join(', '))
  else console.log('✅  Schema completo e tipi corretti')
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) testEstrattoAgent()
}).catch(() => {})
