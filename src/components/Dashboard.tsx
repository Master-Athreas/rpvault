
import React, { useState, useEffect } from 'react';
import { useGameIntegration } from '../context/GameIntegrationContext';
import { Wallet, TrendingUp, Award, Clock, Car, Zap, Home, Coins } from 'lucide-react';
import CarCard from './CarCard';
import LiveTransactionFeed from './LiveTransactionFeed';
import { mockTransactions } from '../data/mockData';
import { LiveGameTransaction } from '../types';
import { formatPrice, getERC20Balance } from '../utils/web3';
import GameIntegrationPanel from './GameIntegrationPanel';

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // ✅ ALL HOOKS MUST BE HERE (before any return)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions'>('portfolio');
  const [showGamePanel, setShowGamePanel] = useState(false);
  const { inGameId } = useGameIntegration();

  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      const balance = await getERC20Balance(
        '0x9F40f8952023b7aa6d06E0d402a1005d89BB056A',
        user.address
      );
      setTokenBalance(balance);
    };

    if (user?.address) {
      fetchTokenBalance();
    }
  }, [user?.address]);

  const handleLiveTransactionAccept = (transaction: LiveGameTransaction) => {
    if (!user) return;
    alert(`Live transaction accepted: ${transaction.asset.name}`);
  };

  // ✅ after all hooks
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view your dashboard</p>
        </div>
      </div>
    );
  }

  const portfolioValue = user.ownedAssets.reduce((total: number, asset: any) => total + asset.price, 0);
  const categoryStats = user.ownedAssets.reduce((stats: any, asset: any) => {
    stats[asset.category] = (stats[asset.category] || 0) + 1;
    return stats;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {inGameId || user.username}</p>
        </div>

        {/* Game Integration Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowGamePanel(!showGamePanel)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            {showGamePanel ? 'Hide' : 'Show'} Game Integration
          </button>
        </div>

        {/* Game Integration Panel */}
        {showGamePanel && (
          <div className="mb-8">
            <GameIntegrationPanel user={user} />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Wallet Balance</p>
                <p className="text-2xl font-bold text-blue-400">{formatPrice(user.balance)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Token Balance</p>
                <p className="text-2xl font-bold text-purple-400">
                  {tokenBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </p>

              </div>
              <Coins className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Portfolio Value</p>
                <p className="text-2xl font-bold text-green-400">{formatPrice(portfolioValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Assets</p>
                <p className="text-2xl font-bold text-purple-400">{user.ownedAssets.length}</p>
              </div>
              <Award className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
              activeTab === 'portfolio'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            My Portfolio
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Transaction History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'portfolio' && (
          <div>
            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                <Car className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{categoryStats.car || 0}</p>
                <p className="text-gray-400">Cars</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{categoryStats.modification || 0}</p>
                <p className="text-gray-400">Modifications</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                <Home className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{categoryStats.property || 0}</p>
                <p className="text-gray-400">Properties</p>
              </div>
            </div>

            {/* Owned Assets */}
            {user.ownedAssets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {user.ownedAssets.map((asset: any) => (
                  <CarCard key={asset.id} car={asset} showBuyButton={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No assets yet</h3>
                <p className="text-gray-500">Start building your collection by purchasing NFTs from the marketplace</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {mockTransactions.map(transaction => (
                <div key={transaction.id} className="p-6 hover:bg-gray-750 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'purchase' ? 'bg-blue-500/20 text-blue-400' :
                        transaction.type === 'sale' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {transaction.type === 'purchase' ? <Car className="h-4 w-4" /> :
                         transaction.type === 'sale' ? <TrendingUp className="h-4 w-4" /> :
                         <Award className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-white font-semibold capitalize">
                          {transaction.type} - {transaction.asset.name}
                        </p>
                        <p className="text-gray-400 text-sm flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {transaction.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'sale' || transaction.type === 'reward' 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {transaction.type === 'purchase' ? '-' : '+'}
                        {formatPrice(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Transaction Feed */}
      <LiveTransactionFeed 
        user={user} 
        onTransactionAccept={handleLiveTransactionAccept}
      />
    </div>
  );
};

export default Dashboard;
