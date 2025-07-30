import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { connectWallet, getBalance, formatAddress } from '../utils/web3';

interface WalletConnectProps {
  user: any;
  setUser: (user: any) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ user, setUser }) => {
  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      const balance = await getBalance(address);
      setUser({
        address,
        username: `Player_${address.slice(-4)}`,
        balance,
        ownedAssets: []
      });
    }
  };

  const handleDisconnect = () => {
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm text-gray-300">{formatAddress(user.address)}</div>
          <div className="text-xs text-blue-400">{user.balance} ETH</div>
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </button>
  );
};

export default WalletConnect;