import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Car, Zap, Home } from "lucide-react";

import { useGameIntegration } from "../context/GameIntegrationContext";
// import { mockCars } from "../data/mockData";
import { Car as CarType } from "../types";
import { LiveGameTransaction } from "../types";
import { getTokenBalance, sendToken } from "../utils/web3";
import CarCard from "./CarCard";
import AssetDetail from "./AssetDetail";
import LiveTransactionFeed from "./LiveTransactionFeed";

interface MarketplaceProps {
  user: any;
  setUser: (user: any) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<CarType | null>(null);
  const [listings, setListings] = useState<CarType[]>([]); // Changed from cars to listings
  const [isLoadingListings, setIsLoadingListings] = useState(true); // New loading state
  const [errorListings, setErrorListings] = useState<string | null>(null); // New error state
  const [isBuying, setIsBuying] = useState(false); // New state for purchase loading
  const [, setIsLoading] = useState(false);
  const { inGameId } = useGameIntegration();

  const fetchListings = useCallback(async () => {
    setIsLoadingListings(true);
    setErrorListings(null);
    try {
      const apiUrl =
        import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
      const response = await fetch(`${apiUrl}/api/listings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Map the fetched listings to the CarType structure
        const formattedListings: CarType[] = data.listings.map((listing: any) => ({
          id: listing._id,
          name: `${listing.vehicle.model} ${listing.vehicle.niceName || ''}`.trim(),
          description: `Listed by ${listing.seller.playerId || 'Unknown'}`,
          price: listing.price,
          vehicleCode: listing.vehicle.vehicleCode,
          category: 'car', // Assuming all listings are cars for now
          rarity: 'Common', // Assuming common rarity for now
          image: `https://placehold.co/400x300.png?text=${listing.vehicle.model || 'Car'}`,
          specs: { speed: 0, acceleration: 0, handling: 0, durability: 0 },
          owner: listing.seller._id, // Or listing.seller.playerId if available
          owner_address: listing.seller.walletAddress,
          forSale: listing.status === 'active',
          isListed: true, // Listings are always listed
          listingId: listing._id,
        }));

        setListings(formattedListings);
      } else {
        setErrorListings(data.message || "Failed to fetch listings");
      }
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      setErrorListings(error.message || "An unknown error occurred");
    } finally {
      setIsLoadingListings(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredCars = listings.filter((car) => {
    const matchesSearch = car.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || car.category === selectedCategory;
    const matchesRarity =
      selectedRarity === "all" || car.rarity === selectedRarity;
    return matchesSearch && matchesCategory && matchesRarity && car.forSale;
  });

  const handleBuy = async (car: CarType) => {
    if (!user || !user._id) {
      alert("you need to sync your account first");
      return;
    }

    if (!car.listingId) {
      alert("This item is not properly listed for sale.");
      return;
    }

    setIsBuying(true); // Start buying process

    // Check token balance
    try {
      const tokenBalance = await getTokenBalance(user.walletAddress); // Assuming user.address is the wallet address
      if (tokenBalance < car.price) {
        alert("Insufficient token balance to purchase this item.");
        return;
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
      alert("Could not verify token balance. Please try again.");
      return;
    }

    // Proceed with purchase via API
    try {
      // Deduct tokens from user's wallet
      console.log("Deduct tokens from user's wallet", car.owner_address, car.price);
      const txHash = await sendToken(car.owner_address, car.price);

      if (!txHash) {
        alert("Failed to send token. Please try again.");
        return;
      }

      const apiUrl =
        import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
      const response = await fetch(`${apiUrl}/api/listings/${car.listingId}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: user._id
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Successfully purchased ${car.name} for ${car.price} UNT! Transaction Hash: ${txHash}`);
        // Refresh listings after successful purchase
        await fetchListings(); // Ensure listings are updated before updating selectedAsset

        // Find the updated asset in the new listings and update selectedAsset
        setListings(prevListings => {
          const updatedListings = prevListings.map(item =>
            item.id === car.id ? { ...item, forSale: false } : item
          );
          // Update selectedAsset if it's the one that was just bought
          setSelectedAsset(prevSelectedAsset => {
            if (prevSelectedAsset && prevSelectedAsset.id === car.id) {
              return { ...prevSelectedAsset, forSale: false };
            }
            return prevSelectedAsset;
          });
          return updatedListings;
        });

      } else {
        alert(`Failed to purchase ${car.name}: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      alert("An error occurred during the purchase process. Please try again.");
    } finally {
      setIsBuying(false); // End buying process
    }
  };

  const handleLiveTransactionAccept = async (
    transaction: LiveGameTransaction
  ) => {
    if (!user) {
      alert("Please connect your wallet to accept transactions");
      return false;
    }

    setIsLoading(true);

    try {
      const tokenBalance = await getTokenBalance(user.walletAddress);

      if (tokenBalance < transaction.requestedPrice) {
        alert("Insufficient token balance");
        return false;
      }

      const recipientAddress = "0xE641bd3A6aeE5287E2a3E192cd954479911f7Cc4";
      const txHash = await sendToken(
        recipientAddress,
        transaction.requestedPrice
      );

      if (txHash) {
        // On-chain transaction was successful. Now, call the backend API.
        if (!inGameId) {
          alert(
            "On-chain TX succeeded, but game account is not synced. Please sync your account."
          );
          // Still return true because the on-chain part worked.
          return true;
        }

        try {
          const apiUrl =
            import.meta.env.VITE_APP_API_URL ||
            "https://racevault.onrender.com";
          const response = await fetch(`${apiUrl}/api/purchase-vehicle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleCode: transaction.vehicleCode,
              playerId: inGameId,
            }),
          });
          const result = await response.json();
          if (result.success) {
            alert(
              `Purchase successful! Vehicle: ${transaction.asset.name}. TxHash: ${txHash}`
            );
          } else {
            alert(
              `On-chain TX succeeded, but backend update failed: ${result.message}`
            );
          }
        } catch (apiError) {
          console.error("Error calling purchase-vehicle API:", apiError);
          alert("On-chain TX succeeded, but the final API call failed.");
        }

        // Original state update can be removed if we rely on a data refresh
        // setUser({
        //   ...user,
        //   ownedAssets: [
        //     ...user.ownedAssets,
        //     { ...transaction.asset, owner: user.address },
        //   ],
        // });

        return true;
      } else {
        alert("Failed to send token. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error accepting live transaction:", error);
      alert("An error occurred while accepting the transaction.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "all", name: "All Items", icon: Filter },
    { id: "car", name: "Cars", icon: Car },
    { id: "modification", name: "Modifications", icon: Zap },
    { id: "property", name: "Property", icon: Home },
  ];

  const rarities = ["all", "Common", "Rare", "Epic", "Legendary"];

  if (selectedAsset) {
    return (
      <AssetDetail
        asset={selectedAsset}
        user={user}
        onBack={() => setSelectedAsset(null)}
        onBuy={handleBuy}
        backButtonText="Back to Marketplace"
        isBuying={isBuying} // Pass the isBuying state to AssetDetail
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Midnight+ <span className="text-blue-400">Marketplace</span>
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
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity === "all" ? "All Rarities" : rarity}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-400">
            Showing {filteredCars.length} of{" "}
            {listings.filter((c) => c.forSale).length} items
          </p>
        </div>

        {/* Grid */}
        {isLoadingListings ? (
          <div className="text-center py-16">
            <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 13a8.001 8.001 0 0015.356-2m-1.818-2.97a8.001 8.001 0 00-10.356 3.818M4 13h.582m15.356 2A8.001 8.001 0 004 13a8.001 8.001 0 0015.356-2m-1.818-2.97a8.001 8.001 0 00-10.356 3.818"></path>
            </svg>
            <p className="text-white mt-4">Loading listings...</p>
          </div>
        ) : errorListings ? (
          <div className="text-center py-16 text-red-500">
            <p>Error: {errorListings}</p>
            <p>Failed to load marketplace listings. Please try again later.</p>
          </div>
        ) : filteredCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onBuy={handleBuy}
                onView={setSelectedAsset}
                isListed={car.isListed}
                showVehicleCode={false} // Added prop
                showBuyButton={user && user._id !== car.owner} // Only show buy button if not the owner
                isBuying={isBuying} // Pass the isBuying state
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No items found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
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
