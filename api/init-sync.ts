import { Redis } from '@upstash/redis'

const RPC_URL = process.env.RPC_URL || 'https://cloudflare-eth.com'
const TOKEN_ADDRESS =
  process.env.TOKEN_ADDRESS || '0x9F40f8952023b7aa6d06E0d402a1005d89BB056A'
const NFT_CONTRACT =
  process.env.NFT_CONTRACT ||
  '0xDc2768F656d518F0CdfB27f06D7613C9772B847f'

async function ethCall(data: string, to: string) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest']
    })
  })

  const json = await res.json()
  return json.result as string
}

async function getERC20Balance(token: string, wallet: string) {
  const data = '0x70a08231' + wallet.replace(/^0x/, '').padStart(64, '0')
  const result = await ethCall(data, token)
  return result ? parseInt(result, 16) / 1e18 : 0
}

async function getNFTs(contract: string, wallet: string) {
  const balanceData = '0x70a08231' + wallet.replace(/^0x/, '').padStart(64, '0')
  const balanceHex = await ethCall(balanceData, contract)
  const balance = balanceHex ? parseInt(balanceHex, 16) : 0

  const tokens: string[] = []
  for (let i = 0; i < balance; i++) {
    const tokenData =
      '0x2f745c59' +
      wallet.replace(/^0x/, '').padStart(64, '0') +
      i.toString(16).padStart(64, '0')
    const tokenHex = await ethCall(tokenData, contract)
    if (tokenHex) tokens.push(String(parseInt(tokenHex, 16)))
  }

  return tokens
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  const { code, wallet } = req.body
  if (!code || !wallet) return res.status(400).json({ success: false })

  const [balance, vehicles] = await Promise.all([
    getERC20Balance(TOKEN_ADDRESS, wallet),
    getNFTs(NFT_CONTRACT, wallet)
  ])

  await redis.setex(
    code,
    300,
    JSON.stringify({
      wallet,
      balance,
      vehicles
    })
  )

  return res.json({ success: true })
}
