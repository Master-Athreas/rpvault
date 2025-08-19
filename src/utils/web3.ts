import { ethers } from 'ethers';
import erc20ABI from './erc20ABI.json';

const tokenAddress = "0x9F40f8952023b7aa6d06E0d402a1005d89BB056A";

const getTokenContract = () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(tokenAddress, erc20ABI, provider);
    }
    return null;
};

export const connectWallet = async (): Promise<string | null> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      return accounts[0];
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  } else {
    alert('Please install MetaMask to use this feature');
    return null;
  }
};

export const checkConnection = async (): Promise<string | null> => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                return accounts[0];
            }
            return null;
        } catch (error) {
            console.error('Failed to check connection:', error);
            return null;
        }
    }
    return null;
};

export const getBalance = async (address: string): Promise<number> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      return parseInt(balanceHex, 16) / 1e18;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return 0;
    }
  }
  return 0;
};

export const getTokenBalance = async (address: string): Promise<number> => {
    const contract = getTokenContract();
    if (contract) {
        try {
            const balance = await contract.balanceOf(address);
            return Number(ethers.formatUnits(balance, 18));
        } catch (error) {
            console.error('Failed to fetch token balance:', error);
            return 0;
        }
    }
    return 0;
};

export const getTokenSymbol = async (): Promise<string> => {
    const contract = getTokenContract();
    if (contract) {
        try {
            return await contract.symbol();
        } catch (error) {
            console.error('Failed to fetch token symbol:', error);
            return "";
        }
    }
    return "";
};

export const signMessage = async (
  address: string,
  message: string
): Promise<string | null> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      return null;
    }
  }
  return null;
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatPrice = (price: number, symbol: string): string => {
  return `${price} ${symbol}`;
};

export const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

export const sendToken = async (to: string, amount: number): Promise<string | null> => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
            const amountToSend = ethers.parseUnits(amount.toString(), 18);
            const tx = await tokenContract.transfer(to, amountToSend);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Failed to send token:', error);
            return null;
        }
    }
    return null;
};

export const disconnectWallet = async (): Promise<void> => {
  if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
    try {
      await window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }
};

declare global {
  interface Window {
    ethereum?: any;
  }
}