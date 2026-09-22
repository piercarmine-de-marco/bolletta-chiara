import { promptAutocompila } from '../prompts/autocompila.js'
import { callClaudeBrowser } from './_claude-browser.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

function parseJson(raw) {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
}

export async function autocompilaAgent(bollettaJson) {
  const userMsg = `Dati bolletta:\n${JSON.stringify(bollettaJson, null, 2)}`
  try {
    if (typeof window === 'undefined') {
      const { spawnSync } = await import('child_process')
      const r = spawnSync(CLAUDE_BIN, ['-p', userMsg, '--system-prompt', promptAutocompila, '--model', MODEL], { encoding: 'utf8', timeout: 60_000 })
      if (r.error) throw new Error(r.error.message)
      if (r.status !== 0) throw new Error(r.stderr)
      return parseJson(r.stdout.trim())
    }
    return parseJson(await callClaudeBrowser(promptAutocompila, userMsg))
  } catch (err) {
    if (typeof window !== 'undefined') throw new Error('Non riesco a compilare il modulo. Riprova.')
    throw err
  }
}

async function testAutocompilaAgent() {
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const bollettaJson = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))
  console.log('🧪  testAutocompilaAgent\n⏳  Chiamata a Claude CLI...')
  let result
  try { result = await autocompilaAgent(bollettaJson) } catch (e) { console.error('❌', e.message); process.exit(1) }
  console.log('\n✅  JSON autocompila:')
  console.log(JSON.stringify(result, null, 2))
  const campiAttesi = ['nome_cognome','codice_cliente','codice_pod','periodo_contestato','importo_contestato']
  const mancanti = campiAttesi.filter(c => !(c in result))
  if (mancanti.length) { console.warn('⚠️   Mancanti:', mancanti.join(', ')); process.exit(1) }
  if (!result.importo_contestato?.includes('€')) { console.warn('⚠️   importo_contestato senza €'); process.exit(1) }
  console.log('✅  Schema completo e importo con €')
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) testAutocompilaAgent()
}).catch(() => {})
