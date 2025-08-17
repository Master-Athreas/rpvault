import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  Clock, 
  User, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Wifi,
  WifiOff,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from 'lucide-react';
import { useLiveTransactions } from '../hooks/useLiveTransactions';
import { LiveGameTransaction } from '../types';
import { formatPrice, getTokenBalance, getTokenSymbol } from '../utils/web3';

interface LiveTransactionFeedProps {
  user: any;
  onTransactionAccept: (transaction: LiveGameTransaction) => Promise<boolean>;
}

const LiveTransactionFeed: React.FC<LiveTransactionFeedProps> = ({ user, onTransactionAccept }) => {
  const { 
    transactions, 
    isConnected, 
    newTransactionCount, 
    acceptTransaction, 
    declineTransaction,
    clearNewTransactionCount 
  } = useLiveTransactions();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("ETH");
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);


  useEffect(() => {
      const fetchTokenBalance = async () => {
        if (user?.address) {
          const token = await getTokenBalance(user.address);
          const symbol = await getTokenSymbol();
          setTokenBalance(token);
          setTokenSymbol(symbol);
        }
      };
  
      fetchTokenBalance();
    }, [user]);

  useEffect(() => {
    if (newTransactionCount > 0) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [newTransactionCount]);

  const getTransactionIcon = (type: LiveGameTransaction['type']) => {
    switch (type) {
      case 'buy_request': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'sell_offer': return <TrendingDown className="h-4 w-4 text-blue-400" />;
      case 'trade_request': return <ArrowRightLeft className="h-4 w-4 text-purple-400" />;
    }
  };

  const getUrgencyColor = (urgency: LiveGameTransaction['urgency']) => {
    switch (urgency) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
    }
  };

  const getTypeLabel = (type: LiveGameTransaction['type']) => {
    switch (type) {
      case 'buy_request': return 'Buy Request';
      case 'sell_offer': return 'Sell Offer';
      case 'trade_request': return 'Trade Request';
    }
  };

  const handleAccept = async (transaction: LiveGameTransaction) => {
    setIsProcessingTransaction(true);
    try {
      const success = await onTransactionAccept(transaction);
      if (success) {
        acceptTransaction(transaction.id);
      }
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      clearNewTransactionCount();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Toast */}
      {showNotification && (
        <div className="absolute bottom-full right-0 mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-semibold">New game transaction!</span>
          </div>
        </div>
      )}

      {/* Feed Container */}
      <div className={`bg-gray-800 border border-gray-700 rounded-xl shadow-2xl transition-all duration-300 ${
        isExpanded ? 'w-96 h-96' : 'w-80 h-16'
      }`}>
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 rounded-t-xl"
          onClick={handleExpand}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-400" />
              )}
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Live Game Feed</h3>
              <p className="text-xs text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'} • {transactions.length} active
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {newTransactionCount > 0 && (
              <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {newTransactionCount > 9 ? '9+' : newTransactionCount}
              </div>
            )}
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Feed Content */}
        {isExpanded && (
          <div className="h-80 overflow-y-auto p-4 pt-0 space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Waiting for game transactions...</p>
              </div>
            ) : (
              transactions.map(transaction => (
                <div 
                  key={transaction.id}
                  className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-lg ${
                    getUrgencyColor(transaction.urgency)
                  } ${transaction.status !== 'pending' ? 'opacity-60' : ''}`}
                >
                  {/* Transaction Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(transaction.type)}
                      <span className="text-white text-sm font-semibold">
                        {getTypeLabel(transaction.type)}
                      </span>
                      {transaction.urgency === 'high' && (
                        <span className="bg-red-500 text-white text-xs px-1 rounded">URGENT</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Player Info */}
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-white text-sm">{transaction.player.username}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs text-gray-400">{transaction.player.reputation}</span>
                    </div>
                  </div>

                  {/* Asset Info */}
                  <div className="mb-2">
                    <p className="text-white text-sm font-medium">{transaction.asset.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 font-semibold">
                        {formatPrice(transaction.requestedPrice, tokenSymbol)}
                      </span>
                      {transaction.currentPrice && transaction.currentPrice !== transaction.requestedPrice && (
                        <span className="text-xs text-gray-400">
                          Market: {formatPrice(transaction.currentPrice, tokenSymbol)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  {transaction.message && (
                    <p className="text-gray-300 text-xs mb-3 italic">"{transaction.message}"</p>
                  )}

                  {/* Action Buttons */}
                  {transaction.status === 'pending' && user && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAccept(transaction)}
                        disabled={tokenBalance < transaction.requestedPrice || isProcessingTransaction}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>{isProcessingTransaction ? 'Processing...' : 'Buy'}</span>
                      </button>
                      <button
                        onClick={() => declineTransaction(transaction.id)}
                        disabled={isProcessingTransaction}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {/* Status Indicator */}
                  {transaction.status !== 'pending' && (
                    <div className={`text-center py-1 rounded text-xs font-semibold ${
                      transaction.status === 'accepted' ? 'text-green-400' :
                      transaction.status === 'declined' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {transaction.status.toUpperCase()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTransactionFeed;