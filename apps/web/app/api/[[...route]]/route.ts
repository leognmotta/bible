import { loadTranslation } from '@bible/translations'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

export const runtime = 'edge'

const app = new Hono().basePath('/api')

app.get('/hello', async (c) => {
  const translation = await loadTranslation('nva')
  return c.json(translation)
})

export const GET = handle(app)
