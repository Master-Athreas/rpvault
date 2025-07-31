import { Redis } from '@upstash/redis'
import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!)
const ERC20_ADDRESS = '0x9F40f8952023b7aa6d06E0d402a1005d89BB056A'
const NFT_ADDRESS = '0xDc2768F656d518F0CdfB27f06D7613C9772B847f'

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
]
const ERC721_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function tokenOfOwnerByIndex(address,uint256) view returns (uint256)'
]

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
  const wallet = data.wallet

  try {
    const erc20 = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, provider)
    const decimals: number = await erc20.decimals()
    const balBig = await erc20.balanceOf(wallet)
    const erc20Balance = Number(balBig) / 10 ** decimals

    const nft = new ethers.Contract(NFT_ADDRESS, ERC721_ABI, provider)
    const nftBalance: bigint = await nft.balanceOf(wallet)
    const nfts: string[] = []
    for (let i = 0n; i < nftBalance; i++) {
      try {
        const id: bigint = await nft.tokenOfOwnerByIndex(wallet, i)
        nfts.push(id.toString())
      } catch {
        break
      }
    }

    return res.json({ success: true, wallet, erc20Balance, nfts })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false })
  }
}
