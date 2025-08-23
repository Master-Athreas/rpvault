import React from 'react';
import { ArrowLeft, Car, Zap, Shield, Gauge, Award, Clock } from 'lucide-react';
import { Car as CarType } from '../types';
import { formatPrice } from '../utils/web3';

interface AssetDetailProps {
  asset: CarType;
  user: any;
  onBack: () => void;
  onBuy: (car: CarType) => void;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, user, onBack, onBuy }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'from-yellow-400 to-orange-500';
      case 'Epic': return 'from-purple-400 to-pink-500';
      case 'Rare': return 'from-neon-400 to-neon-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case 'speed': return <Gauge className="h-4 w-4" />;
      case 'acceleration': return <Zap className="h-4 w-4" />;
      case 'handling': return <Car className="h-4 w-4" />;
      case 'durability': return <Shield className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-midnight-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Marketplace</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-6">
            <div className="relative">
              <img
                src={asset.image}
                alt={asset.name}
                className="w-full h-96 object-cover rounded-xl"
              />
              <div className={`absolute top-4 left-4 bg-gradient-to-r ${getRarityColor(asset.rarity)} text-white px-3 py-1 rounded-full font-semibold`}>
                {asset.rarity}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{asset.name}</h1>
              <p className="text-gray-400 text-lg">{asset.description}</p>
            </div>

            {/* Price */}
            <div className="bg-midnight-800 border border-midnight-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Price</p>
                  <p className="text-3xl font-bold text-neon-400">{formatPrice(asset.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Category</p>
                  <p className="text-white font-semibold capitalize">{asset.category}</p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {(asset.category === 'car' || asset.category === 'modification') && (
              <div className="bg-midnight-800 border border-midnight-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(asset.specs).map(([stat, value]) => (
                    <div key={stat} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatIcon(stat)}
                          <span className="text-gray-400 capitalize">{stat}</span>
                        </div>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                      <div className="w-full bg-midnight-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-neon-500 to-neon-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-midnight-800 border border-midnight-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-midnight-700">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Listed for sale</span>
                  </div>
                  <span className="text-white">2 days ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-midnight-700">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-green-400" />
                    <span className="text-gray-400">Minted</span>
                  </div>
                  <span className="text-white">1 week ago</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {asset.forSale && (
                <button
                  onClick={() => onBuy(asset)}
                  disabled={!user || user.balance < asset.price}
                  className="w-full bg-gradient-to-r from-neon-500 to-neon-400 hover:from-neon-600 hover:to-neon-500 disabled:from-midnight-600 disabled:to-midnight-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  {!user ? 'Connect Wallet to Buy' : 
                   user.balance < asset.price ? 'Insufficient Balance' : 
                   `Buy for ${formatPrice(asset.price)}`}
                </button>
              )}
              
              <button className="w-full bg-midnight-700 hover:bg-midnight-600 text-white font-semibold py-3 rounded-xl transition-colors duration-200">
                Make Offer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;