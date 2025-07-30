import { useState, useEffect, useCallback } from 'react';
import { LiveGameTransaction } from '../types';
import { mockCars } from '../data/mockData';

// Mock live transaction generator
const generateMockTransaction = (): LiveGameTransaction => {
  const types: LiveGameTransaction['type'][] = ['buy_request', 'sell_offer', 'trade_request'];
  const urgencies: LiveGameTransaction['urgency'][] = ['low', 'medium', 'high'];
  const players = [
    { id: '1', username: 'SpeedDemon92', reputation: 4.8 },
    { id: '2', username: 'RaceKing', reputation: 4.5 },
    { id: '3', username: 'TurboMaster', reputation: 4.9 },
    { id: '4', username: 'NitroQueen', reputation: 4.7 },
    { id: '5', username: 'DriftLord', reputation: 4.6 }
  ];

  const randomCar = mockCars[Math.floor(Math.random() * mockCars.length)];
  const randomPlayer = players[Math.floor(Math.random() * players.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const priceVariation = 0.8 + Math.random() * 0.4; // 80% to 120% of original price
  const requestedPrice = Number((randomCar.price * priceVariation).toFixed(2));

  return {
    id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    player: randomPlayer,
    asset: randomCar,
    requestedPrice,
    currentPrice: randomCar.price,
    message: type === 'buy_request' 
      ? `Looking to buy this ${randomCar.name} for my collection!`
      : type === 'sell_offer'
      ? `Selling my ${randomCar.name} - great condition!`
      : `Want to trade my ${randomCar.name} for something similar`,
    timestamp: new Date(),
    status: 'pending',
    urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
    gameSession: `session_${Math.random().toString(36).substr(2, 6)}`
  };
};

export const useLiveTransactions = () => {
  const [transactions, setTransactions] = useState<LiveGameTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newTransactionCount, setNewTransactionCount] = useState(0);

  // Simulate WebSocket connection
  useEffect(() => {
    setIsConnected(true);
    
    // Generate initial transactions
    const initialTransactions = Array.from({ length: 3 }, generateMockTransaction);
    setTransactions(initialTransactions);

    // Simulate real-time transactions
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance of new transaction
        const newTransaction = generateMockTransaction();
        setTransactions(prev => [newTransaction, ...prev.slice(0, 19)]); // Keep last 20
        setNewTransactionCount(prev => prev + 1);
      }
    }, 8000 + Math.random() * 12000); // Random interval between 8-20 seconds

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);

  const acceptTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, status: 'accepted' as const }
          : tx
      )
    );
  }, []);

  const declineTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, status: 'declined' as const }
          : tx
      )
    );
  }, []);

  const clearNewTransactionCount = useCallback(() => {
    setNewTransactionCount(0);
  }, []);

  return {
    transactions,
    isConnected,
    newTransactionCount,
    acceptTransaction,
    declineTransaction,
    clearNewTransactionCount
  };
};