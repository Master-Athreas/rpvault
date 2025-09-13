import React, { useEffect } from 'react';
import { ArrowLeft, Car, Zap, Shield, Gauge, Award, Clock, Loader2 } from 'lucide-react';
import { Car as CarType } from '../types';
import { formatPrice, formatNumber } from '../utils/web3';
import RadialProgress from './RadialProgress';

interface AssetDetailProps {
  asset: CarType;
  user: any;
  onBack: () => void;
  onBuy: (car: CarType) => void;
  backButtonText?: string;
  showListButton?: boolean;
  onList?: (car: CarType) => void;
  onCancelList?: (listingId: string) => void; // New prop
  isListingLoading?: boolean; // New prop for loading state
  isBuying?: boolean; // New prop for buy loading state
}

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, user, onBack, onBuy, backButtonText, showListButton, onList, onCancelList, isListingLoading, isBuying }) => {
  const { isListed, listingId } = asset;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getCalculatedSpecs = () => {
    if (!asset.stats) {
      return asset.specs;
    }

    const speed = asset.stats['Top Speed'] ? (asset.stats['Top Speed'] / 400) * 100 : 0;
    const acceleration = asset.stats['0-60 mph'] ? (1 - (asset.stats['0-60 mph'] / 15)) * 100 : 0;
    
    const brakingG = asset.stats['Braking G'] || 0;
    const weight = asset.stats['Weight'] || 0;

    const brakingScore = (brakingG / 1.5) * 50;
    const weightScore = (1 - (weight / 2500)) * 50;
    const handling = brakingScore + weightScore;

    const durability = (weight / 2500) * 100;

    return {
      speed: Math.min(100, Math.max(0, speed)),
      acceleration: Math.min(100, Math.max(0, acceleration)),
      handling: Math.min(100, Math.max(0, handling)),
      durability: Math.min(100, Math.max(0, durability)),
    };
  };

  const calculatedSpecs = getCalculatedSpecs();

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
              <p className="text-gray-400 text-lg">{asset.stats?.Description || asset.description}</p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <RadialProgress value={calculatedSpecs.speed} label="Speed" icon={<Gauge className="h-8 w-8" />} />
                  <RadialProgress value={calculatedSpecs.acceleration} label="Acceleration" icon={<Zap className="h-8 w-8" />} />
                  <RadialProgress value={calculatedSpecs.handling} label="Handling" icon={<Car className="h-8 w-8" />} />
                  <RadialProgress value={calculatedSpecs.durability} label="Durability" icon={<Shield className="h-8 w-8" />} />
                </div>
                <div className="mt-6 border-t border-gray-700 pt-6">
                  <h4 className="text-lg font-bold text-white mb-4">Additional Stats</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance */}
                    <div className="space-y-4">
                      <h5 className="text-md font-semibold text-blue-400">Performance</h5>
                      <div className="flex justify-between">
                        <span className="text-gray-400">0-100 km/h</span>
                        <span className="text-white">{asset.stats?.['0-100 km/h']?.toFixed(2) || 'N/A'} s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">0-60 mph</span>
                        <span className="text-white">{asset.stats?.['0-60 mph']?.toFixed(2) || 'N/A'} s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Top Speed</span>
                        <span className="text-white">{asset.stats?.['Top Speed']?.toFixed(2) || 'N/A'} km/h</span>
                      </div>
                    </div>

                    {/* Engine & Drivetrain */}
                    <div className="space-y-4">
                      <h5 className="text-md font-semibold text-blue-400">Engine & Drivetrain</h5>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Power</span>
                        <span className="text-white">{asset.stats?.Power || 'N/A'} HP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Torque</span>
                        <span className="text-white">{asset.stats?.Torque || 'N/A'} Nm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Drivetrain</span>
                        <span className="text-white">{asset.stats?.Drivetrain || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transmission</span>
                        <span className="text-white">{asset.stats?.Transmission || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Dimensions & Misc */}
                    <div className="space-y-4">
                        <h5 className="text-md font-semibold text-blue-400">Dimensions & Misc</h5>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Weight</span>
                            <span className="text-white">{asset.stats?.Weight || 'N/A'} kg</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Weight/Power</span>
                            <span className="text-white">{asset.stats?.['Weight/Power']?.toFixed(2) || 'N/A'} kg/HP</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Off-Road Score</span>
                            <span className="text-white">{asset.stats?.['Off-Road Score'] || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Fuel Type</span>
                            <span className="text-white">{asset.stats?.['Fuel Type'] || 'N/A'}</span>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drag Times */}
            {asset.stats && asset.stats['Drag Times'] && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Drag Times</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {Object.entries(asset.stats['Drag Times']).map(([key, value]) => {
                    if (typeof value !== 'string' && typeof value !== 'number') return null;
                    return (
                      <div key={key} className="flex flex-col items-center justify-center bg-gray-900 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-white font-semibold text-lg">{typeof value === 'number' ? value.toFixed(3) : value}</p>
                      </div>
                    );
                  })}
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
            {/* <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
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
            </div> */}

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