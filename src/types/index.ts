export interface Car {
  id: string;
  name: string;
  image: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  specs: {
    speed: number;
    acceleration: number;
    handling: number;
    durability: number;
  };
  owner: string;
  forSale: boolean;
  category: 'car' | 'modification' | 'property';
  description: string;
  vehicleCode?: string;
}

export interface User {
  address: string;
  username: string;
  balance: number;
  ownedAssets: Car[];
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'reward';
  asset: Car;
  amount: number;
  timestamp: Date;
  from?: string;
  to?: string;
}

export interface LiveGameTransaction {
  id: string;
  type: 'buy_request' | 'sell_offer' | 'trade_request';
  player: {
    id: string;
    username: string;
    avatar?: string;
    reputation: number;
  };
  asset: Car;
  requestedPrice: number;
  currentPrice?: number;
  message?: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  urgency: 'low' | 'medium' | 'high';
  gameSession?: string;
  vehicleData?: any; // Optional field to hold the original vehicle data from the server
}