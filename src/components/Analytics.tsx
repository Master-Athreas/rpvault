import React from 'react';
import { TrendingUp, DollarSign, Users, ShoppingCart, Car, Zap, Home } from 'lucide-react';

const Analytics: React.FC = () => {
  const marketStats = [
    { label: 'Total Volume', value: '2,847 ETH', change: '+12.5%', icon: DollarSign },
    { label: 'Active Users', value: '15,234', change: '+8.2%', icon: Users },
    { label: 'Items Sold', value: '9,876', change: '+15.7%', icon: ShoppingCart },
    { label: 'Floor Price', value: '0.15 ETH', change: '+5.3%', icon: TrendingUp }
  ];

  const categoryData = [
    { category: 'Cars', volume: '1,245 ETH', count: 3421, icon: Car, color: 'bg-neon-500' },
    { category: 'Modifications', volume: '892 ETH', count: 5643, icon: Zap, color: 'bg-purple-500' },
    { category: 'Property', volume: '710 ETH', count: 876, icon: Home, color: 'bg-green-500' }
  ];

  const topSales = [
    { name: 'Legendary Speedster', price: '25.5 ETH', image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { name: 'Epic Thunder Bolt', price: '18.7 ETH', image: 'https://images.pexels.com/photos/544542/pexels-photo-544542.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { name: 'Luxury Garage Space', price: '15.2 ETH', image: 'https://images.pexels.com/photos/279949/pexels-photo-279949.jpeg?auto=compress&cs=tinysrgb&w=100' }
  ];

  return (
    <div className="min-h-screen bg-midnight-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Market Analytics</h1>
          <p className="text-gray-400">Real-time insights into the Midnight+ marketplace</p>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {marketStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-midnight-800 border border-midnight-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 text-neon-400" />
                  <span className="text-green-400 text-sm font-semibold">{stat.change}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Performance */}
          <div className="bg-midnight-800 border border-midnight-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Category Performance</h3>
            <div className="space-y-4">
              {categoryData.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-midnight-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${category.color}/20`}>
                        <Icon className={`h-5 w-5 text-${category.color.split('-')[1]}-400`} />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{category.category}</p>
                        <p className="text-gray-400 text-sm">{category.count} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{category.volume}</p>
                      <div className="w-20 bg-midnight-600 rounded-full h-2 mt-1">
                        <div 
                          className={`${category.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${(index + 1) * 30}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Sales */}
          <div className="bg-midnight-800 border border-midnight-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Top Sales (24h)</h3>
            <div className="space-y-4">
              {topSales.map((sale, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-midnight-700 rounded-lg hover:bg-midnight-600 transition-colors duration-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-neon-500 to-neon-400 rounded-full text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <img
                    src={sale.image}
                    alt={sale.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold">{sale.name}</p>
                    <p className="text-neon-400 font-bold">{sale.price}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Trends Chart Placeholder */}
        <div className="mt-8 bg-midnight-800 border border-midnight-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Market Trends</h3>
          <div className="h-64 bg-midnight-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Market trends chart will be implemented with real data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;