export async function callClaudeBrowser(systemPrompt, userMessage) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userMessage }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { response, error } = await res.json()
  if (error) throw new Error(error)
  return response
}
