import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, User, ShoppingCart, BarChart3 } from 'lucide-react';
import WalletConnect from './WalletConnect';

interface HeaderProps {
  user: any;
  setUser: (user: any) => void;
}

const Header: React.FC<HeaderProps> = ({ user, setUser }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">RaceVault</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                isActive('/') 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Marketplace</span>
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                isActive('/dashboard') 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/analytics"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                isActive('/analytics') 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
          </nav>

          {/* Wallet Connect */}
          <WalletConnect user={user} setUser={setUser} />
        </div>
      </div>
    </header>
  );
};

export default Header;