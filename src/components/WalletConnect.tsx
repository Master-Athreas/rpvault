import React, { useState, useEffect } from "react";
import { Wallet, LogOut } from "lucide-react";
import {
  connectWallet,
  getBalance,
  formatAddress,
  getTokenBalance,
  getTokenSymbol,
  formatNumber,
  disconnectWallet,
  checkConnection,
} from "../utils/web3";

interface WalletConnectProps {
  user: any;
  setUser: (user: any) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ user, setUser }) => {
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");

  useEffect(() => {
    const autoConnect = async () => {
      const address = await checkConnection();
      if (address) {
        const balance = await getBalance(address);
        setUser({
          address,
          username: `Player_${address.slice(-4)}`,
          balance,
          ownedAssets: [],
        });
      }
    };
    autoConnect();
  }, [setUser]);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (user?.address) {
        const token = await getTokenBalance(user.address);
        const symbol = await getTokenSymbol();
        setTokenBalance(token);
        setTokenSymbol(symbol);
      }
    };

    fetchTokenBalance();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [user]);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length > 0) {
      const address = accounts[0];
      const balance = await getBalance(address);
      setUser({
        address,
        username: `Player_${address.slice(-4)}`,
        balance,
        ownedAssets: [],
      });
    } else {
      setUser(null);
    }
  };

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      const balance = await getBalance(address);
      setUser({
        address,
        username: `Player_${address.slice(-4)}`,
        balance,
        ownedAssets: [],
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm text-gray-300">
            {formatAddress(user.address)}
          </div>
          <div className="text-xs text-neon-400">{user.balance} ETH</div>
          <div className="text-gray-400 text-xs">
            {formatNumber(tokenBalance)} {tokenSymbol}
          </div>
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
      className="flex items-center space-x-2 bg-gradient-to-r from-neon-500 to-neon-400 hover:from-neon-600 hover:to-neon-500 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </button>
  );
};

export default WalletConnect;
