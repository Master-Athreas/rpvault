import { Car, Transaction } from '../types';

export const mockCars: Car[] = [
  {
    id: '1',
    name: 'Velocity Phantom',
    image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 2.5,
    rarity: 'Legendary',
    specs: { speed: 95, acceleration: 90, handling: 88, durability: 85 },
    owner: '',
    forSale: true,
    category: 'car',
    description: 'Ultra-rare hypercar with supreme performance capabilities.'
  },
  {
    id: '2',
    name: 'Thunder Bolt',
    image: 'https://images.pexels.com/photos/544542/pexels-photo-544542.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 1.8,
    rarity: 'Epic',
    specs: { speed: 88, acceleration: 92, handling: 85, durability: 80 },
    owner: '',
    forSale: true,
    category: 'car',
    description: 'Lightning-fast sports car with exceptional acceleration.'
  },
  {
    id: '3',
    name: 'Street Racer',
    image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.9,
    rarity: 'Rare',
    specs: { speed: 78, acceleration: 80, handling: 82, durability: 85 },
    owner: '',
    forSale: true,
    category: 'car',
    description: 'Reliable street racer perfect for urban competitions.'
  },
  {
    id: '4',
    name: 'Turbo Kit Pro',
    image: 'https://images.pexels.com/photos/159293/car-engine-motor-clean-159293.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.3,
    rarity: 'Epic',
    specs: { speed: 15, acceleration: 25, handling: 5, durability: 10 },
    owner: '',
    forSale: true,
    category: 'modification',
    description: 'High-performance turbo kit for maximum power boost.'
  },
  {
    id: '5',
    name: 'Racing Garage',
    image: 'https://images.pexels.com/photos/279949/pexels-photo-279949.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 5.0,
    rarity: 'Legendary',
    specs: { speed: 0, acceleration: 0, handling: 0, durability: 0 },
    owner: '',
    forSale: true,
    category: 'property',
    description: 'Premium garage space in the city center for storing your collection.'
  },
  {
    id: '6',
    name: 'Neon Cruiser',
    image: 'https://images.pexels.com/photos/712618/pexels-photo-712618.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.6,
    rarity: 'Common',
    specs: { speed: 65, acceleration: 70, handling: 75, durability: 90 },
    owner: '',
    forSale: true,
    category: 'car',
    description: 'Stylish cruiser with a classic design and decent performance.'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'purchase',
    asset: mockCars[0],
    amount: 2.5,
    timestamp: new Date(Date.now() - 86400000),
    to: '0x123...abc'
  },
  {
    id: '2',
    type: 'sale',
    asset: mockCars[1],
    amount: 1.8,
    timestamp: new Date(Date.now() - 172800000),
    from: '0x123...abc'
  },
  {
    id: '3',
    type: 'reward',
    asset: mockCars[2],
    amount: 0.5,
    timestamp: new Date(Date.now() - 259200000),
    to: '0x123...abc'
  }
]