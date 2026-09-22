import Anthropic from '@anthropic-ai/sdk'
import { promptSoccorso } from '../prompts/soccorso.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

export async function soccorsoAgent(statoForm, bollettaJson, suggerimentiPrecedenti = []) {
  const userMsg = [
    `Stato form: ${JSON.stringify(statoForm, null, 2)}`,
    `Dati bolletta: ${JSON.stringify(bollettaJson, null, 2)}`,
    `Suggerimenti già dati: ${JSON.stringify(suggerimentiPrecedenti)}`,
  ].join('\n\n')

  try {
    if (typeof window === 'undefined') {
      const { spawnSync } = await import('child_process')
      const result = spawnSync(
        CLAUDE_BIN,
        ['-p', userMsg, '--system-prompt', promptSoccorso, '--model', MODEL],
        { encoding: 'utf8', timeout: 60_000 }
      )
      if (result.error) throw new Error(`Spawn error: ${result.error.message}`)
      if (result.status !== 0) throw new Error(`claude CLI exit ${result.status}:\n${result.stderr}`)
      return result.stdout.trim()
    }

    const client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: promptSoccorso,
      messages: [{ role: 'user', content: userMsg }],
    })
    return response.content.find(b => b.type === 'text')?.text?.trim() ?? ''
  } catch (err) {
    if (typeof window !== 'undefined') {
      throw new Error('Non riesco ad aiutarti in questo momento. Riprova.')
    }
    throw err
  }
}

// TEST
async function testSoccorsoAgent() {
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const bollettaJson = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))

  const statoForm = {
    campi: {
      nome_cognome: 'Maria Rossi', codice_cliente: '7890123', codice_pod: 'IT001E12345678',
      periodo_contestato: '01/03/2025 - 31/05/2025', importo_contestato: '€ 487,32',
      motivo_reclamo: null, note_aggiuntive: null,
    },
    campiAutomaticiCompilati: true,
    campoManualeAttivo: 'motivo_reclamo',
    completato: false,
  }

  console.log('🧪  testSoccorsoAgent')
  console.log('⏳  Chiamata a Claude CLI...')

  let result
  try {
    result = await soccorsoAgent(statoForm, bollettaJson, ['Compila il campo motivo reclamo.'])
  } catch (e) {
    console.error('❌  Errore:', e.message)
    process.exit(1)
  }

  console.log('\n✅  Risposta soccorso:')
  console.log(`"${result}"`)
  const frasi = result.split(/(?<=[.!?])\s+/).filter(f => f.trim().length > 0)
  if (frasi.length > 3) { console.warn(`⚠️   Troppo lungo (~${frasi.length} frasi)`); process.exit(1) }
  console.log('✅  Lunghezza ok')
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) {
    testSoccorsoAgent()
  }
}).catch(() => {})
