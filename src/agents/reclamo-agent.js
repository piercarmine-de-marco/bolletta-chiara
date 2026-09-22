import Anthropic from '@anthropic-ai/sdk'
import { promptReclamo } from '../prompts/reclamo.js'

const MODEL = 'claude-sonnet-4-6'
const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'

export async function reclamoAgent(formCompilato, bollettaJson) {
  const userMsg = [
    `Form compilato: ${JSON.stringify(formCompilato, null, 2)}`,
    `Dati bolletta: ${JSON.stringify(bollettaJson, null, 2)}`,
  ].join('\n\n')

  try {
    if (typeof window === 'undefined') {
      const { spawnSync } = await import('child_process')
      const result = spawnSync(
        CLAUDE_BIN,
        ['-p', userMsg, '--system-prompt', promptReclamo, '--model', MODEL],
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
      max_tokens: 512,
      system: promptReclamo,
      messages: [{ role: 'user', content: userMsg }],
    })
    return response.content.find(b => b.type === 'text')?.text?.trim() ?? ''
  } catch (err) {
    if (typeof window !== 'undefined') {
      throw new Error('Non riesco a generare il reclamo. Riprova.')
    }
    throw err
  }
}

// TEST
async function testReclamoAgent() {
  const { readFileSync } = await import('fs')
  const { resolve, dirname } = await import('path')
  const { fileURLToPath } = await import('url')
  const __dir = dirname(fileURLToPath(import.meta.url))
  const bollettaJson = JSON.parse(readFileSync(resolve(__dir, '../../src/data/bolletta-esempio.json'), 'utf8'))

  const formCompilato = {
    nome_cognome: 'Maria Rossi', codice_cliente: '7890123', codice_pod: 'IT001E12345678',
    periodo_contestato: '01/03/2025 - 31/05/2025', importo_contestato: '€ 487,32',
    motivo_reclamo: 'Importo molto più alto rispetto alle bollette precedenti',
    note_aggiuntive: 'Non ho cambiato le mie abitudini di consumo.',
  }

  console.log('🧪  testReclamoAgent')
  console.log('⏳  Chiamata a Claude CLI...')

  let result
  try {
    result = await reclamoAgent(formCompilato, bollettaJson)
  } catch (e) {
    console.error('❌  Errore:', e.message)
    process.exit(1)
  }

  console.log('\n✅  Testo reclamo:')
  console.log(result)

  const parole = result.trim().split(/\s+/).length
  if (!result.startsWith('Gentile Servizio Clienti,')) { console.warn('⚠️   Non inizia con "Gentile Servizio Clienti,"'); process.exit(1) }
  if (parole > 150) { console.warn(`⚠️   Troppo lungo: ${parole} parole`); process.exit(1) }
  console.log(`\n✅  Valido (${parole} parole)`)
}

import('url').then(({ fileURLToPath }) => {
  if (typeof process !== 'undefined' && process.argv?.[1] === fileURLToPath(import.meta.url)) {
    testReclamoAgent()
  }
}).catch(() => {})
