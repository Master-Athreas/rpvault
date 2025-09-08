import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  TrendingUp,
  Award,
  Clock,
  Car,
  Zap,
  Home,
  Coins,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import CarCard from "./CarCard";
import LiveTransactionFeed from "./LiveTransactionFeed";
import { LiveGameTransaction, Car as CarType } from "../types";
import { formatPrice, getTokenBalance, sendToken } from "../utils/web3";
import GameIntegrationPanel from "./GameIntegrationPanel";
import AssetDetail from "./AssetDetail";
import { useGameIntegration } from "../context/GameIntegrationContext";


interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<"portfolio" | "transactions">(
    "portfolio"
  );
  const [showGamePanel, setShowGamePanel] = useState(false);
  const { inGameId, userData } = useGameIntegration();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<CarType | null>(null);
  const [isListingLoading, setIsListingLoading] = useState(false);

  const [tokenBalance, setTokenBalance] = useState(0);
  const [ownedVehicles, setOwnedVehicles] = useState<CarType[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]); // New state for transactions
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false); // New loading state
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null); // New error state

  const fetchPlayerVehicles = useCallback(async (playerId: string) => {
    setIsLoading(true);
    try {
      const apiUrl =
        import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";

      // Fetch owned vehicles
      const vehiclesResponse = await fetch(`${apiUrl}/api/player-vehicles/${playerId}`);
      const vehiclesData = await vehiclesResponse.json();

      // Fetch active listings
      const listingsResponse = await fetch(`${apiUrl}/api/listings`);
      const listingsData = await listingsResponse.json();

      if (vehiclesData.success && listingsData.success) {
        const activeListings = listingsData.listings.filter((l: any) => l.status === 'active');

        const formattedVehicles = vehiclesData.vehicles.map((v: any) => {
          let details = {};
          if (v.configJson) {
            try {
              const config = JSON.parse(v.configJson);
              const parts = config.parts || {};
              const vars = config.vars || {};
              const model = config.model || v.model;

              if (model) {
                details = {
                  engine: parts[`${model}_engine`],
                  transmission: parts[`${model}_transmission`],
                  suspension_F: parts[`${model}_suspension_F`],
                  suspension_R: parts[`${model}_suspension_R`],
                  revLimiterRPM: vars.$revLimiterRPM,
                };
              } else {
                const findPart = (suffix: string) => {
                  const key = Object.keys(parts).find(k => k.endsWith(suffix));
                  return key ? parts[key] : undefined;
                }
                details = {
                  engine: findPart('_engine'),
                  transmission: findPart('_transmission'),
                  suspension_F: findPart('_suspension_F'),
                  suspension_R: findPart('_suspension_R'),
                  revLimiterRPM: vars.$revLimiterRPM,
                };
              }
            } catch (e) {
              console.error("Error parsing configJson", e);
            }
          }

          const listing = activeListings.find((l: any) => l.vehicle._id === v._id);

          return {
            id: v._id,
            name: `${v.model || 'Unknown'} ${v.niceName || ''}`.trim(),
            description: `Configuration: ${v.config || 'Stock'}`,
            price: v.price || 0,
            vehicleCode: v.vehicleCode,
            category: 'car',
            rarity: 'Common',
            image: `https://placehold.co/400x300.png?text=${v.model || 'Car'}`,
            specs: { speed: 0, acceleration: 0, handling: 0, durability: 0 },
            owner: '',
            forSale: false,
            details: details,
            isListed: !!listing, // Add isListed property
            listingId: listing ? listing._id : null, // Add listingId property
          };
        });
        setOwnedVehicles(formattedVehicles);
      } else {
        console.error("Failed to fetch vehicles or listings:", vehiclesData.message || listingsData.message);
        setOwnedVehicles([]);
      }
    } catch (error) {
      console.error("Error fetching vehicles or listings:", error);
      setOwnedVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      const balance = await getTokenBalance(user.walletAddress);
      setTokenBalance(balance);
    };

    if (user?.walletAddress) {
      fetchTokenBalance();
    }
  }, [user?.walletAddress]);

  useEffect(() => {
    if (user && inGameId) {
      fetchPlayerVehicles(inGameId);
    } else {
      setIsLoading(false);
    }
  }, [user, inGameId, fetchPlayerVehicles]);


  const fetchTransactions = async () => {
      if (!userData?._id) return; // Only fetch if userId is available

      setIsLoadingTransactions(true);
      setErrorTransactions(null);
      try {
        const apiUrl =
          import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
        const response = await fetch(`${apiUrl}/api/transactions/user/${userData._id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          // Sort transactions by createdAt in descending order
          const sortedTransactions = data.transactions.sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setTransactions(sortedTransactions);
        } else {
          setErrorTransactions(data.message || "Failed to fetch transactions");
        }
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        setErrorTransactions(error.message || "An unknown error occurred");
      } finally {
        setIsLoadingTransactions(false);
      }
    };

  useEffect(() => {
    fetchTransactions();
  }, [userData?._id]);

  const handleLiveTransactionAccept = async (
    transaction: LiveGameTransaction
  ) => {
    if (!user) {
      alert("Please connect your wallet to accept transactions");
      return false;
    }

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
        if (!inGameId) {
          alert(
            "On-chain TX succeeded, but game account is not synced. Please sync your account."
          );
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
              `Purchase successful! Vehicle: ${transaction.asset.name}. TxHash: ${txHash}. Your assets will update shortly.`
            );
            fetchPlayerVehicles(inGameId);
          } else {
            alert(
              `On-chain TX succeeded, but backend update failed: ${result.message}`
            );
          }
        } catch (apiError) {
          console.error("Error calling purchase-vehicle API:", apiError);
          alert("On-chain TX succeeded, but the final API call failed.");
        }

        return true;
      } else {
        alert("Failed to send token. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error accepting live transaction:", error);
      alert("An error occurred while accepting the transaction.");
      return false;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  const portfolioValue = ownedVehicles.reduce(
    (total, asset) => total + asset.price,
    0
  );
  const categoryStats = ownedVehicles.reduce((stats: any, asset: any) => {
    stats[asset.category] = (stats[asset.category] || 0) + 1;
    return stats;
  }, {});

  const handleBuy = (car: CarType) => {
    // Since this is the dashboard, we don't need to implement buying functionality here
    // but the AssetDetail component expects an onBuy prop.
    console.log("Buy action triggered for:", car);
  };

  const handleListCar = async (car: CarType) => {
    if (!userData || !userData._id) {
      alert("User data not available. Please connect your wallet and sync your game.");
      return;
    }

    const priceInput = prompt("Enter the listing price for " + car.name + ":");
    const listingPrice = parseFloat(priceInput || "0");

    if (isNaN(listingPrice) || listingPrice <= 0) {
      alert("Please enter a valid positive number for the listing price.");
      return;
    }

    setIsListingLoading(true); // Start loading

    try {
      const apiUrl =
        import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
      const response = await fetch(`${apiUrl}/api/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: car.id,
          price: listingPrice,
          sellerId: userData._id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Successfully listed ${car.name} for sale at ${listingPrice}!`);
        // Update selectedAsset directly
        setSelectedAsset((prevAsset) => {
          if (!prevAsset) return null;
          return { ...prevAsset, isListed: true, listingId: result.listing._id };
        });
        // Re-fetch all vehicles to ensure the main list is updated
        if (inGameId) {
          fetchPlayerVehicles(inGameId);
        }
        fetchTransactions(); // Re-fetch transactions
      } else {
        alert(`Failed to list ${car.name} for sale: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error listing car for sale:", error);
      alert("An error occurred while trying to list the car for sale.");
    } finally {
      setIsListingLoading(false); // End loading
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!userData || !userData._id) {
      alert("User data not available. Please connect your wallet and sync your game.");
      return;
    }

    if (!confirm("Are you sure you want to cancel this listing?")) {
      return;
    }

    try {
      const apiUrl =
        import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
      const response = await fetch(`${apiUrl}/api/listings/${listingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData._id }), // Pass userId for authorization
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Listing cancelled successfully!");
        // Update selectedAsset directly
        setSelectedAsset((prevAsset) => {
          if (!prevAsset) return null;
          return { ...prevAsset, isListed: false, listingId: null };
        });
        // Re-fetch all vehicles to ensure the main list is updated
        if (inGameId) {
          fetchPlayerVehicles(inGameId);
        }
        fetchTransactions(); // Re-fetch transactions
      } else {
        alert(`Failed to cancel listing: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error cancelling listing:", error);
      alert("An error occurred while trying to cancel the listing.");
    }
  };

  if (selectedAsset) {
    return (
      <AssetDetail
        asset={selectedAsset}
        user={user}
        onBack={() => setSelectedAsset(null)}
        onBuy={handleBuy}
        backButtonText="Back to Dashboard"
        showListButton={true}
        onList={handleListCar}
        isListed={selectedAsset.isListed}
        listingId={selectedAsset.listingId}
        onCancelList={handleCancelListing}
        isListingLoading={isListingLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, {inGameId || user.username}
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowGamePanel(!showGamePanel)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            {showGamePanel ? "Hide" : "Show"} Game Integration
          </button>
        </div>

        {/* ✅ Pass tokenBalance into the panel */}
        {showGamePanel && (
          <div className="mb-8">
            <GameIntegrationPanel user={user} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Wallet Balance</p>
                <p className="text-2xl font-bold text-blue-400">
                  {Number(user.balance).toLocaleString(undefined, {
                    minimumFractionDigits: 5,
                    maximumFractionDigits: 5,
                  })}{" "}
                  ETH
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Token Balance</p>
                <p className="text-2xl font-bold text-purple-400">
                  {tokenBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <Coins className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Portfolio Value</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatPrice(portfolioValue, "UNT")}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Assets</p>
                <p className="text-2xl font-bold text-purple-400">
                  {ownedVehicles.length}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Portfolio / Transactions */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
              activeTab === "portfolio"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            My Portfolio
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Transaction History
          </button>
        </div>

        {activeTab === "portfolio" && (
          <div>
            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                <Car className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {categoryStats.car || 0}
                </p>
                <p className="text-gray-400">Cars</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {categoryStats.modification || 0}
                </p>
                <p className="text-gray-400">Modifications</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                <Home className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {categoryStats.property || 0}
                </p>
                <p className="text-gray-400">Properties</p>
              </div>
            </div>

            {/* Owned Assets */}
            {isLoading ? (
              <div className="text-center py-16">
                <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-400">
                  Loading Your Vehicles...
                </h3>
              </div>
            ) : ownedVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ownedVehicles.map((asset) => (
                  <CarCard
                    key={asset.id}
                    car={asset}
                    showBuyButton={false}
                    onView={setSelectedAsset}
                    isListed={asset.isListed}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  No vehicles found
                </h3>
                <p className="text-gray-500">
                  Sync your game account and purchase vehicles to see them here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                Recent Transactions
              </h3>
            </div>
            {isLoadingTransactions ? (
              <div className="text-center py-16">
                <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-400">
                  Loading Transactions...
                </h3>
              </div>
            ) : errorTransactions ? (
              <div className="text-center py-16 text-red-500">
                <p>Error: {errorTransactions}</p>
                <p>Failed to load transaction history. Please try again later.</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-gray-700">
                {transactions.map((transaction) => (
                  <div
                    key={transaction._id} // Assuming _id is available from MongoDB
                    className="p-6 hover:bg-gray-750 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "initial_purchase"
                              ? "bg-blue-500/20 text-blue-400"
                              : transaction.type === "sale"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {transaction.buyer?._id === userData._id ? (
                            <ArrowDownCircle className="h-4 w-4" />
                          ) : transaction.seller?._id === userData._id && transaction.type === "sale" ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <Award className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-semibold capitalize">
                            {transaction.buyer?._id === userData._id ? "Bought" :
                             transaction.seller?._id === userData._id && transaction.type === "sale" ? "Sold" :
                             transaction.type === "cancellation" ? "Cancel Listing" : transaction.type.replace(/_/g, ' ')} - {transaction.listing?.vehicle?.model || transaction.vehicle?.model || 'N/A'}
                          </p>
                          <p className="text-gray-400 text-sm flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(transaction.createdAt).toLocaleDateString()} {new Date(transaction.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {transaction.type === "initial_purchase" && transaction.buyer?._id === userData._id && (
                          <p className="font-semibold text-red-400">
                            -{formatPrice(transaction.amount, "UNT")}
                          </p>
                        )}
                        {transaction.type === "sale" && transaction.seller?._id === userData._id && (
                          <p className="font-semibold text-green-400">
                            +{formatPrice(transaction.amount, "UNT")}
                          </p>
                        )}
                        {transaction.type === "sale" && transaction.buyer?._id === userData._id && (
                          <p className="font-semibold text-green-400">
                            -{formatPrice(transaction.amount, "UNT")}
                          </p>
                        )}
                        {(transaction.type === "listing" || transaction.type === "cancellation") && (
                          <p className="font-semibold text-gray-400"></p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  No transactions found
                </h3>
                <p className="text-gray-500">
                  Your transaction history will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <LiveTransactionFeed
        user={user}
        onTransactionAccept={handleLiveTransactionAccept}
      />
    </div>
  );
};

export default Dashboard;
