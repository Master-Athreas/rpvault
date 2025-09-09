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
  owner_address: string;
  forSale: boolean;
  category: 'car' | 'modification' | 'property';
  description: string;
  vehicleCode?: string;
  stats?: {
    "0-100 km/h"?: number;
    "0-100 mph"?: number;
    "0-200 km/h"?: number;
    "0-60 mph"?: number;
    "100-0 km/h"?: number;
    "100-200 km/h"?: number;
    "60-0 mph"?: number;
    "60-100 mph"?: number;
    "Braking G"?: number;
    "Config Type"?: string;
    "Description"?: string;
    "Drag Times"?: {
        "brakingG"?: number;
        "time_0_60"?: number;
        "time_1000"?: number;
        "time_1_4"?: number;
        "time_1_8"?: number;
        "time_330"?: number;
        "time_60"?: number;
        "velAt_1_4"?: number;
        "velAt_1_8"?: number;
    };
    "Drivetrain"?: string;
    "Fuel Type"?: string;
    "Induction Type"?: string;
    "Off-Road Score"?: number;
    "Power"?: number;
    "PowerPeakRPM"?: string;
    "Propulsion"?: string;
    "Top Speed"?: number;
    "Torque"?: number;
    "TorquePeakRPM"?: string;
    "Transmission"?: string;
    "Weight"?: number;
    "Weight/Power"?: number;
  }
  details?: {
    engine?: string;
    transmission?: string;
    suspension_F?: string;
    suspension_R?: string;
    [key: string]: any;
  };
  isListed?: boolean; // Added for listing status
  listingId?: string | null; // Added for listing ID
}

export interface User {
  _id: string; // Added for MongoDB document ID
  walletAddress: string;
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
  vehicleCode?: string; // Added vehicleCode
}