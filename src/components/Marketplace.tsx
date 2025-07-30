import React, { useState } from 'react';
import { Search, Filter, Car, Zap, Home } from 'lucide-react';
import CarCard from './CarCard';
import AssetDetail from './AssetDetail';
import LiveTransactionFeed from './LiveTransactionFeed';

import { mockCars } from '../data/mockData';
import { Car as CarType } from '../types';
import { LiveGameTransaction } from '../types';

interface MarketplaceProps {
  user: any;
  setUser: (user: any) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user, setUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<CarType | null>(null);
  const [cars] = useState(mockCars);
  

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || car.category === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || car.rarity === selectedRarity;
    return matchesSearch && matchesCategory && matchesRarity && car.forSale;
  });

  const handleBuy = (car: CarType) => {
    if (!user) {
      alert('Please connect your wallet to make purchases');
      return;
    }
    
    if (user.balance < car.price) {
      alert('Insufficient balance');
      return;
    }

    // Simulate purchase
    setUser({
      ...user,
      balance: user.balance - car.price,
      ownedAssets: [...user.ownedAssets, { ...car, owner: user.address }]
    });

    alert(`Successfully purchased ${car.name} for ${car.price} ETH!`);
  };

  const handleLiveTransactionAccept = (transaction: LiveGameTransaction) => {
    if (!user) {
      alert('Please connect your wallet to accept transactions');
      return;
    }
    
    if (user.balance < transaction.requestedPrice) {
      alert('Insufficient balance');
      return;
    }

    // Simulate accepting live transaction
    setUser({
      ...user,
      balance: user.balance - transaction.requestedPrice,
      ownedAssets: [...user.ownedAssets, { ...transaction.asset, owner: user.address }]
    });

    alert(`Successfully accepted ${transaction.player.username}'s ${transaction.type.replace('_', ' ')} for ${transaction.asset.name}!`);
  };

  const categories = [
    { id: 'all', name: 'All Items', icon: Filter },
    { id: 'car', name: 'Cars', icon: Car },
    { id: 'modification', name: 'Modifications', icon: Zap },
    { id: 'property', name: 'Property', icon: Home }
  ];

  const rarities = ['all', 'Common', 'Rare', 'Epic', 'Legendary'];

  if (selectedAsset) {
    return (
      <AssetDetail
        asset={selectedAsset}
        user={user}
        onBack={() => setSelectedAsset(null)}
        onBuy={handleBuy}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            RaceVault <span className="text-blue-400">Marketplace</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover, collect, and trade the most exclusive racing NFTs
          </p>
          
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search cars, modifications, and properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex space-x-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Rarity Filter */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          >
            {rarities.map(rarity => (
              <option key={rarity} value={rarity}>
                {rarity === 'all' ? 'All Rarities' : rarity}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-400">
            Showing {filteredCars.length} of {cars.filter(c => c.forSale).length} items
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCars.map(car => (
            <CarCard
              key={car.id}
              car={car}
              onBuy={handleBuy}
              onView={setSelectedAsset}
            />
          ))}
        </div>

        {filteredCars.length === 0 && (
          <div className="text-center py-16">
            <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No items found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
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

export default Marketplace;