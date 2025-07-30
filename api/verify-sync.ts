import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  const { code } = req.body
  if (!code) return res.status(400).json({ success: false })

  const raw = await redis.get(code)
  if (!raw) return res.status(404).json({ success: false })

  await redis.del(code) // one-time use

  const data = typeof raw === 'string' ? JSON.parse(raw) : raw

  return res.json({
    success: true,
    wallet: data.wallet,
    balance: data.balance,
    vehicles: data.vehicles
  })
}
