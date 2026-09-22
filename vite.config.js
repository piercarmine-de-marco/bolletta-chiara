import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawnSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const CLAUDE_BIN = '/Users/piercarmine.de.marco/.local/bin/claude'
const MODEL = 'claude-sonnet-4-6'

function callClaude(systemPrompt, userMessage) {
  const result = spawnSync(
    CLAUDE_BIN,
    ['-p', userMessage, '--system-prompt', systemPrompt, '--model', MODEL],
    { encoding: 'utf8', timeout: 90_000 }
  )
  if (result.error) throw new Error(result.error.message)
  if (result.status !== 0) throw new Error(`claude CLI exit ${result.status}: ${result.stderr.slice(0, 200)}`)
  return result.stdout.trim()
}

async function extractTextFromPDF(pdfBase64) {
  const pdfBuffer = Buffer.from(pdfBase64, 'base64')
  const pdfParse = require('pdf-parse')
  const data = await pdfParse(pdfBuffer)
  return data.text
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'claude-bridge',
      configureServer(server) {
        server.middlewares.use('/api/claude', async (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (req.method === 'OPTIONS') { res.end('{}'); return }
          if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return }

          try {
            const { systemPrompt, userMessage, pdfBase64 } = await parseBody(req)

            let message = userMessage ?? ''
            if (pdfBase64) {
              const testo = await extractTextFromPDF(pdfBase64)
              message = `Testo estratto dalla bolletta PDF:\n${testo}`
            }

            const response = callClaude(systemPrompt, message)
            res.end(JSON.stringify({ response }))
          } catch (err) {
            res.statusCode = 500
            console.error('[claude-bridge]', err.message)
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      external: ['child_process', 'fs', 'path', 'url', 'os', 'module'],
    },
  },
  optimizeDeps: {
    exclude: ['child_process', 'fs', 'path', 'url', 'os', 'module'],
  },
})
