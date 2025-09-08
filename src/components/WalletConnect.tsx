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

  const fetchUserFromBackend = async (walletAddress: string) => {
    const apiUrl =
      import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
    try {
      const response = await fetch(`${apiUrl}/api/users/wallet/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.user; // This should contain _id, playerId, etc.
        }
      }
    } catch (error) {
      console.error("Error fetching user from backend:", error);
    }
    return null;
  };

  useEffect(() => {
    const autoConnect = async () => {
      const address = await checkConnection();
      if (address) {
        const backendUser = await fetchUserFromBackend(address);
        const balance = await getBalance(address); // Always fetch balance
        const token = await getTokenBalance(address);
        const symbol = await getTokenSymbol();
        if (backendUser) {
          setUser({ ...backendUser, balance, tokenBalance: token, tokenSymbol: symbol }); // Merge balance and token data with backend user data
        } else {
          // If user not found in backend, create a basic user object
          setUser({
            walletAddress: address,
            username: `Player_${address.slice(-4)}`,
            balance: formatNumber(balance),
            tokenBalance: formatNumber(token),
            tokenSymbol: symbol,
            ownedAssets: [],
            _id: null, // Indicate no backend ID yet
          });
        }
      }
    };
    autoConnect();
  }, [setUser]);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (user?.walletAddress) {
        const token = await getTokenBalance(user.walletAddress);
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
      const backendUser = await fetchUserFromBackend(address);
      const balance = await getBalance(address); // Always fetch balance
      const token = await getTokenBalance(address);
      const symbol = await getTokenSymbol();
      if (backendUser) {
        setUser({ ...backendUser, balance, tokenBalance: token, tokenSymbol: symbol }); // Merge balance and token data with backend user data
      } else {
        // If user not found in backend, create a basic user object
        setUser({
          walletAddress: address,
          username: `Player_${address.slice(-4)}`,
          balance: formatNumber(balance),
          tokenBalance: formatNumber(token),
          tokenSymbol: symbol,
          ownedAssets: [],
          _id: null, // Indicate no backend ID yet
        });
      }
    } else {
      setUser(null);
    }
  };

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      const backendUser = await fetchUserFromBackend(address);
      const balance = await getBalance(address); // Always fetch balance
      const token = await getTokenBalance(address);
      const symbol = await getTokenSymbol();
      if (backendUser) {
        setUser({ ...backendUser, balance, tokenBalance: token, tokenSymbol: symbol }); // Merge balance and token data with backend user data
      } else {
        // If user not found in backend, create a basic user object
        setUser({
          walletAddress: address,
          username: `Player_${address.slice(-4)}`,
          balance: formatNumber(balance),
          tokenBalance: formatNumber(token),
          tokenSymbol: symbol,
          ownedAssets: [],
          _id: null, // Indicate no backend ID yet
        });
      }
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
            {formatAddress(user.walletAddress)}
          </div>
          <div className="text-xs text-blue-400">{formatNumber(user.balance)} ETH</div>
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
      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </button>
  );
};

export default WalletConnect;
