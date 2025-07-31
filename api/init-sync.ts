import { Redis } from '@upstash/redis'
import tokenBalance from './Dashboard.tsx';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  const { code, wallet } = req.body
  if (!code || !wallet) return res.status(400).json({ success: false })

  await redis.setex(code, 300, JSON.stringify({
    wallet,
    balance: tokenBalance,
    vehicles: ['SupraNFT', 'RX7NFT']
  }))

  return res.json({ success: true })
}
