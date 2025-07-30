import React from 'react';
import { Car as CarIcon, Zap, Shield, Gauge } from 'lucide-react';
import { Car } from '../types';
import { formatPrice } from '../utils/web3';

interface CarCardProps {
  car: Car;
  onBuy?: (car: Car) => void;
  onView?: (car: Car) => void;
  showBuyButton?: boolean;
}

const CarCard: React.FC<CarCardProps> = ({ car, onBuy, onView, showBuyButton = true }) => {
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
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2">{car.name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{car.description}</p>
        
        {/* Specs for cars and modifications */}
        {(car.category === 'car' || car.category === 'modification') && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center space-x-1 text-sm">
              <Gauge className="h-3 w-3 text-blue-400" />
              <span className="text-gray-400">Speed:</span>
              <span className="text-white">{car.specs.speed}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-gray-400">Accel:</span>
              <span className="text-white">{car.specs.acceleration}</span>
            </div>
          </div>
        )}

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-blue-400">
            {formatPrice(car.price)}
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
                className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg transition-all duration-200"
              >
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;