const API_KEY_STORAGE = 'energy-lab-openai-api-key'
const MODEL_STORAGE = 'energy-lab-openai-model'
const DEFAULT_MODEL = 'gpt-4o-mini'

export function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || import.meta.env.VITE_OPENAI_API_KEY || ''
}

export function setStoredApiKey(key) {
  const trimmed = key.trim()
  if (trimmed) localStorage.setItem(API_KEY_STORAGE, trimmed)
  else localStorage.removeItem(API_KEY_STORAGE)
}

export function getStoredModel() {
  return localStorage.getItem(MODEL_STORAGE) || import.meta.env.VITE_OPENAI_MODEL || DEFAULT_MODEL
}

export function setStoredModel(model) {
  localStorage.setItem(MODEL_STORAGE, model.trim() || DEFAULT_MODEL)
}

export async function sendChatCompletion({ apiKey, model, systemPrompt, messages }) {
  const key = apiKey || getStoredApiKey()
  if (!key) {
    throw new Error('OpenAI API key is missing. Add it in chat settings.')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || getStoredModel(),
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI API error (${response.status})`)
  }

  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI')
  return content.trim()
}
