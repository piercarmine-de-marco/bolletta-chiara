import Anthropic from '@anthropic-ai/sdk'
import { promptGuidaForm } from '../prompts/guida-form.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

function parseClaudeResponse(raw) {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
}

export async function guidaFormAgent(nomeCampo, bollettaJson) {
  const userMsg = `Campo da compilare: ${nomeCampo}\nDati bolletta:\n${JSON.stringify(bollettaJson, null, 2)}`

  try {
    if (typeof window === 'undefined') {
      const { spawnSync } = await import('child_process')
      const result = spawnSync(
        CLAUDE_BIN,
        ['-p', userMsg, '--system-prompt', promptGuidaForm, '--model', MODEL],
        { encoding: 'utf8', timeout: 60_000 }
      )
      if (result.error) throw new Error(`Spawn error: ${result.error.message}`)
      if (result.status !== 0) throw new Error(`claude CLI exit ${result.status}:\n${result.stderr}`)
      return parseClaudeResponse(result.stdout.trim())
    }

    const client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: promptGuidaForm,
      messages: [{ role: 'user', content: userMsg }],
    })
    const raw = response.content.find(b => b.type === 'text')?.text?.trim() ?? ''
    return parseClaudeResponse(raw)
  } catch (err) {
    if (typeof window !== 'undefined') {
      throw new Error('Non riesco a suggerire le opzioni. Riprova.')
    }
    throw err
  }
}

// TEST
async function testGuidaFormAgent() {
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const bollettaJson = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))

  console.log('🧪  testGuidaFormAgent — campo: motivo_reclamo')
  console.log('⏳  Chiamata a Claude CLI...')

  let result
  try {
    result = await guidaFormAgent('motivo_reclamo', bollettaJson)
  } catch (e) {
    console.error('❌  Errore:', e.message)
    process.exit(1)
  }

  console.log('\n✅  JSON opzioni:')
  console.log(JSON.stringify(result, null, 2))

  if (!Array.isArray(result.opzioni)) { console.warn('⚠️   opzioni non è un array'); process.exit(1) }
  if (result.opzioni.length !== 3) { console.warn(`⚠️   Attese 3 opzioni, ricevute ${result.opzioni.length}`); process.exit(1) }
  console.log('✅  Esattamente 3 opzioni')
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) {
    testGuidaFormAgent()
  }
}).catch(() => {})
