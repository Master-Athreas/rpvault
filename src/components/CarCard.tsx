import React from 'react';
import { Car as CarIcon, Zap, Shield, Gauge, Loader2 } from 'lucide-react';
import { Car } from '../types';
import { formatPrice, formatNumber } from '../utils/web3';

interface CarCardProps {
  car: Car;
  onBuy?: (car: Car) => void;
  onView?: (car: Car) => void;
  showBuyButton?: boolean;
  isListed?: boolean; // New prop
  showVehicleCode?: boolean; // New prop
  isBuying?: boolean; // New prop for loading state
}

const CarCard: React.FC<CarCardProps> = ({ car, onBuy, onView, showBuyButton = true, isListed, showVehicleCode = true, isBuying }) => {
  // const [isBought, setIsBought] = React.useState(false);
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'from-yellow-400 to-orange-500';
      case 'Epic': return 'from-purple-400 to-pink-500';
      case 'Rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getCategoryIcon = () => {
    switch (car.category) {
      case 'car': return <CarIcon className="h-4 w-4" />;
      case 'modification': return <Zap className="h-4 w-4" />;
      case 'property': return <Shield className="h-4 w-4" />;
      default: return <CarIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
      {/* Image */}
      <div className="relative">
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-3 left-3 bg-gradient-to-r ${getRarityColor(car.rarity)} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
          {car.rarity}
        </div>
        <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full">
          {getCategoryIcon()}
        </div>
        {isListed && (
          <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            LISTED
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2">{car.name}</h3>
        {showVehicleCode && car.vehicleCode && (
          <div className="mb-2">
            <p className="text-xs text-gray-400">VEHICLE CODE</p>
            <p className="text-sm font-mono text-cyan-400 bg-gray-900 px-2 py-1 rounded">{car.vehicleCode}</p>
          </div>
        )}
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{car.stats?.Description || car.description}</p>
        
        {/* Stats for cars */}
        {car.stats && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {car.stats.Power && (
              <div className="flex items-center space-x-1 text-sm">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span className="text-gray-400">Power:</span>
                <span className="text-white">{car.stats.Power} HP</span>
              </div>
            )}
            {car.stats['Top Speed'] && (
              <div className="flex items-center space-x-1 text-sm">
                <Gauge className="h-3 w-3 text-blue-400" />
                <span className="text-gray-400">Top Speed:</span>
                <span className="text-white">{car.stats['Top Speed'].toFixed(2)} km/h</span>
              </div>
            )}
            {car.stats['0-60 mph'] && (
              <div className="flex items-center space-x-1 text-sm">
                <Zap className="h-3 w-3 text-green-400" />
                <span className="text-gray-400">0-60 mph:</span>
                <span className="text-white">{car.stats['0-60 mph']}s</span>
              </div>
            )}
            {car.stats.Drivetrain && (
              <div className="flex items-center space-x-1 text-sm">
                <CarIcon className="h-3 w-3 text-purple-400" />
                <span className="text-gray-400">Drivetrain:</span>
                <span className="text-white">{car.stats.Drivetrain}</span>
              </div>
            )}
          </div>
        )}

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-blue-400">
            {formatPrice(formatNumber(car.price) as any, 'UNT')}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onView?.(car)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200"
            >
              View
            </button>
            {showBuyButton && car.forSale && (
              <button
                onClick={() => onBuy?.(car)}
                disabled={isBuying} // Disable when loading
                className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {isBuying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Buying...
                  </>
                ) : (
                  "Buy Now"
                )}
              </button>
            )}
            {showBuyButton && !car.forSale && (
              <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg">Bought</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;