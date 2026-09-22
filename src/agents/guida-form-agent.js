import { promptGuidaForm } from '../prompts/guida-form.js'
import { callClaudeBrowser } from './_claude-browser.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

function parseJson(raw) {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
}

export async function guidaFormAgent(nomeCampo, bollettaJson) {
  const userMsg = `Campo da compilare: ${nomeCampo}\nDati bolletta:\n${JSON.stringify(bollettaJson, null, 2)}`
  try {
    if (typeof window === 'undefined') {
      const { spawnSync } = await import('child_process')
      const r = spawnSync(CLAUDE_BIN, ['-p', userMsg, '--system-prompt', promptGuidaForm, '--model', MODEL], { encoding: 'utf8', timeout: 60_000 })
      if (r.error) throw new Error(r.error.message)
      if (r.status !== 0) throw new Error(r.stderr)
      return parseJson(r.stdout.trim())
    }
    return parseJson(await callClaudeBrowser(promptGuidaForm, userMsg))
  } catch (err) {
    if (typeof window !== 'undefined') throw new Error('Non riesco a suggerire le opzioni. Riprova.')
    throw err
  }
}

async function testGuidaFormAgent() {
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const bollettaJson = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))
  console.log('🧪  testGuidaFormAgent — campo: motivo_reclamo\n⏳  Chiamata a Claude CLI...')
  let result
  try { result = await guidaFormAgent('motivo_reclamo', bollettaJson) } catch (e) { console.error('❌', e.message); process.exit(1) }
  console.log('\n✅  JSON opzioni:')
  console.log(JSON.stringify(result, null, 2))
  if (!Array.isArray(result.opzioni) || result.opzioni.length !== 3) { console.warn('⚠️   Attese 3 opzioni'); process.exit(1) }
  console.log('✅  Esattamente 3 opzioni')
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) testGuidaFormAgent()
}).catch(() => {})
