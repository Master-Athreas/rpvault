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

export const getERC20Balance = async (
  token: string,
  wallet: string
): Promise<number> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const data =
        '0x70a08231' + wallet.replace(/^0x/, '').padStart(64, '0');
      const balanceHex = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: token,
            data
          },
          'latest'
        ]
      });
      return parseInt(balanceHex, 16) / 1e18;
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
      return 0;
    }
  }
  return 0;
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

export const formatPrice = (price: number): string => {
  return `${price} ETH`;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}