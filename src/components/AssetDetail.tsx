import React, { useEffect } from 'react';
import { ArrowLeft, Car, Zap, Shield, Gauge, Award, Clock, Loader2 } from 'lucide-react';
import { Car as CarType } from '../types';
import { formatPrice, formatNumber } from '../utils/web3';

interface AssetDetailProps {
  asset: CarType;
  user: any;
  onBack: () => void;
  onBuy: (car: CarType) => void;
  backButtonText?: string;
  showListButton?: boolean;
  onList?: (car: CarType) => void;
  isListed?: boolean; // New prop
  listingId?: string | null; // New prop
  onCancelList?: (listingId: string) => void; // New prop
  isListingLoading?: boolean; // New prop for loading state
  isBuying?: boolean; // New prop for buy loading state
}

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, user, onBack, onBuy, backButtonText, showListButton, onList, isListed, listingId, onCancelList, isListingLoading, isBuying }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'from-yellow-400 to-orange-500';
      case 'Epic': return 'from-purple-400 to-pink-500';
      case 'Rare': return 'from-blue-400 to-cyan-500';
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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{backButtonText || 'Back to Marketplace'}</span>
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
                {isListed && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full font-semibold">
                    LISTED
                  </div>
                )}
              </div>
          </div>

          {/* Details Section */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{asset.name}</h1>
              <p className="text-gray-400 text-lg">{asset.description}</p>
            </div>

            {/* Price */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Price</p>
                  <p className="text-3xl font-bold text-blue-400">{formatPrice(formatNumber(asset.price) as any, 'UNT')}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Category</p>
                  <p className="text-white font-semibold capitalize">{asset.category}</p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {(asset.category === 'car' || asset.category === 'modification') && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
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
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Details */}
            {asset.details && Object.keys(asset.details).length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(asset.details).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key}>
                        <p className="text-gray-400 text-sm capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-white font-semibold">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Listed for sale</span>
                  </div>
                  <span className="text-white">2 days ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-700">
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
              {asset.forSale && user && user._id !== asset.owner && (
                <button
                  onClick={() => onBuy(asset)}
                  disabled={user.tokenBalance < asset.price || isBuying} // Disable when insufficient balance or buying
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Buying...
                    </>
                  ) : user.tokenBalance < asset.price ? (
                    "Insufficient Token Balance"
                  ) : (
                    `Buy for ${formatPrice(formatNumber(asset.price) as any, 'UNT')}`
                  )}
                </button>
              )}
              {!asset.forSale && user && user._id !== asset.owner && (
                <span className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl text-center">Bought</span>
              )}

              {showListButton && (
                isListed && listingId && onCancelList ? (
                  <button
                    onClick={() => onCancelList(listingId)}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel Listing
                  </button>
                ) : (
                  onList && (
                    <button
                      onClick={() => onList(asset)}
                      disabled={isListingLoading} // Disable when loading
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                    >
                      {isListingLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Listing...
                        </>
                      ) : (
                        "List Car for Sale"
                      )}
                    </button>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;