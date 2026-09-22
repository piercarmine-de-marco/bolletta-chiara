import { promptRiepilogo } from '../prompts/riepilogo.js'
import { callClaudeBrowser } from './_claude-browser.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

function parseJson(raw) {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
}

export async function riepilogoAgent(bollettaJson) {
  const userMsg = `Dati bolletta:\n${JSON.stringify(bollettaJson, null, 2)}`
  try {
    if (typeof window === 'undefined') {
      const { spawnSync } = await import('child_process')
      const r = spawnSync(CLAUDE_BIN, ['-p', userMsg, '--system-prompt', promptRiepilogo, '--model', MODEL], { encoding: 'utf8', timeout: 60_000 })
      if (r.error) throw new Error(r.error.message)
      if (r.status !== 0) throw new Error(r.stderr)
      return parseJson(r.stdout.trim())
    }
    return parseJson(await callClaudeBrowser(promptRiepilogo, userMsg))
  } catch (err) {
    if (typeof window !== 'undefined') throw new Error('Non riesco a preparare il riepilogo. Riprova.')
    throw err
  }
}

async function testRiepilogoAgent() {
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const bollettaJson = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))
  console.log('🧪  testRiepilogoAgent\n⏳  Chiamata a Claude CLI...')
  let result
  try { result = await riepilogoAgent(bollettaJson) } catch (e) { console.error('❌', e.message); process.exit(1) }
  console.log('\n✅  JSON riepilogo:')
  console.log(JSON.stringify(result, null, 2))
  const mancanti = ['intestatario','periodo','consumi','importo','scadenza'].filter(c => !(c in result))
  if (mancanti.length) { console.warn('⚠️   Mancanti:', mancanti.join(', ')); process.exit(1) }
  console.log('✅  Schema completo')
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) testRiepilogoAgent()
}).catch(() => {})
