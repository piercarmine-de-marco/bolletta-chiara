import Anthropic from '@anthropic-ai/sdk'
import { promptRiepilogo } from '../prompts/riepilogo.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

function parseClaudeResponse(raw) {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
}

export async function riepilogoAgent(bollettaJson) {
  const userMsg = `Dati bolletta:\n${JSON.stringify(bollettaJson, null, 2)}`

  try {
    if (typeof window === 'undefined') {
      const { spawnSync } = await import('child_process')
      const result = spawnSync(
        CLAUDE_BIN,
        ['-p', userMsg, '--system-prompt', promptRiepilogo, '--model', MODEL],
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
      system: promptRiepilogo,
      messages: [{ role: 'user', content: userMsg }],
    })
    const raw = response.content.find(b => b.type === 'text')?.text?.trim() ?? ''
    return parseClaudeResponse(raw)
  } catch (err) {
    if (typeof window !== 'undefined') {
      throw new Error('Non riesco a preparare il riepilogo. Riprova.')
    }
    throw err
  }
}

// TEST
async function testRiepilogoAgent() {
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const bollettaJson = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))

  console.log('🧪  testRiepilogoAgent')
  console.log('⏳  Chiamata a Claude CLI...')

  let result
  try {
    result = await riepilogoAgent(bollettaJson)
  } catch (e) {
    console.error('❌  Errore:', e.message)
    process.exit(1)
  }

  console.log('\n✅  JSON riepilogo:')
  console.log(JSON.stringify(result, null, 2))

  const campiAttesi = ['intestatario', 'periodo', 'consumi', 'importo', 'scadenza']
  const mancanti = campiAttesi.filter(c => !(c in result))
  if (mancanti.length) {
    console.warn('⚠️   Campi mancanti:', mancanti.join(', '))
    process.exit(1)
  }
  console.log('✅  Schema completo')
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) {
    testRiepilogoAgent()
  }
}).catch(() => {})
