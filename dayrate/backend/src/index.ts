import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth'
import ratingsRoutes from './routes/ratings'
import groupsRoutes from './routes/groups'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: (origin, callback) => {
    // Permite localhost em dev e qualquer subdomínio vercel.app em prod
    const allowed = [
      /^http:\/\/localhost(:\d+)?$/,
      /^https?:\/\/.*\.vercel\.app$/,
    ]
    if (!origin || allowed.some(re => re.test(origin)) || process.env.FRONTEND_URL === origin) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/ratings', ratingsRoutes)
app.use('/api/groups', groupsRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
