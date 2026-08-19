import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Custom Vite plugin to proxy Groq API calls securely
const groqProxyPlugin = (groqApiKey: string) => ({
  name: 'groq-proxy-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      console.log(`[Proxy Middleware] Intercepted URL: ${req.url}`)
      if (req.url && req.url.startsWith('/api/groq')) {
        const urlObj = new URL(req.url, 'http://localhost')
        const pathname = urlObj.pathname
        const isModels = pathname === '/api/groq/models' || pathname === '/api/groq/models/'
        const isChat = pathname === '/api/groq/chat/completions' || pathname === '/api/groq/chat/completions/'

        if (!isModels && !isChat) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { message: `Proxy endpoint not found: ${pathname}` } }))
          return
        }

        // Get API key from client request header or fall back to server process env
        let apiKey = req.headers['authorization']
        if (apiKey && apiKey.startsWith('Bearer ')) {
          apiKey = apiKey.substring(7).trim()
        }
        if (!apiKey || apiKey === 'null' || apiKey === 'undefined') {
          apiKey = groqApiKey
        }

        if (!apiKey) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { message: 'Groq API key is missing. Please configure it in settings or server environment variables.' } }))
          return
        }

        let body = ''
        req.on('data', (chunk: string) => {
          body += chunk
        })

        req.on('end', async () => {
          try {
            const targetUrl = isModels
              ? 'https://api.groq.com/openai/v1/models'
              : 'https://api.groq.com/openai/v1/chat/completions'

            const headers: Record<string, string> = {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }

            const options: RequestInit = {
              method: req.method,
              headers
            }

            if (req.method === 'POST' && body) {
              options.body = body
            }

            const apiResponse = await fetch(targetUrl, options)
            const resText = await apiResponse.text()

            res.writeHead(apiResponse.status, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            })
            res.end(resText)
          } catch (error: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: { message: error.message || 'Internal proxy error' } }))
          }
        })
      } else {
        next()
      }
    })
  }
})

export default defineConfig(({ mode }) => {
  // Load env variables regardless of the prefix
  const env = loadEnv(mode, process.cwd(), '')
  const groqApiKey = (process.env.GROQ_API_KEY || env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || env.VITE_GROQ_API_KEY || '').trim()

  return {
    plugins: [
      react(),
      groqProxyPlugin(groqApiKey)
    ],
    define: {
      'import.meta.env.VITE_GROQ_KEY_CONFIGURED': JSON.stringify(!!groqApiKey)
    },
    server: {
      port: 5173
    }
  }
})


