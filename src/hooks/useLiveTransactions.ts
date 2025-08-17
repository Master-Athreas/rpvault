import { useState, useEffect, useCallback } from "react";
import { LiveGameTransaction } from "../types";
// import { mockCars } from "../data/mockData";

// Mock live transaction generator
// const generateMockTransaction = (): LiveGameTransaction => {
//   const types: LiveGameTransaction["type"][] = [
//     "buy_request",
//     "sell_offer",
//     "trade_request",
//   ];
//   const urgencies: LiveGameTransaction["urgency"][] = ["low", "medium", "high"];
//   const players = [
//     { id: "1", username: "SpeedDemon92", reputation: 4.8 },
//     { id: "2", username: "RaceKing", reputation: 4.5 },
//     { id: "3", username: "TurboMaster", reputation: 4.9 },
//     { id: "4", username: "NitroQueen", reputation: 4.7 },
//     { id: "5", username: "DriftLord", reputation: 4.6 },
//   ];

//   const randomCar = mockCars[Math.floor(Math.random() * mockCars.length)];
//   const randomPlayer = players[Math.floor(Math.random() * players.length)];
//   const type = types[Math.floor(Math.random() * types.length)];

//   const priceVariation = 0.8 + Math.random() * 0.4; // 80% to 120% of original price
//   const requestedPrice = Number((randomCar.price * priceVariation).toFixed(2));

//   return {
//     id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//     type,
//     player: randomPlayer,
//     asset: randomCar,
//     requestedPrice,
//     currentPrice: randomCar.price,
//     message:
//       type === "buy_request"
//         ? `Looking to buy this ${randomCar.name} for my collection!`
//         : type === "sell_offer"
//         ? `Selling my ${randomCar.name} - great condition!`
//         : `Want to trade my ${randomCar.name} for something similar`,
//     timestamp: new Date(),
//     status: "pending",
//     urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
//     gameSession: `session_${Math.random().toString(36).substr(2, 6)}`,
//   };
// };

export const useLiveTransactions = () => {
  const [transactions, setTransactions] = useState<LiveGameTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newTransactionCount, setNewTransactionCount] = useState(0);

  // Simulate WebSocket connection
  useEffect(() => {
    const apiUrl =
      import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
    const eventSource = new EventSource(`${apiUrl}/events`);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log("SSE connection opened for live transactions.");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Check local storage for gameIntegration and inGameId
        const gameIntegration = localStorage.getItem("gameIntegration");
        let inGameId = null;
        if (gameIntegration) {
          try {
            const parsedIntegration = JSON.parse(gameIntegration);
            inGameId = parsedIntegration.inGameId;
          } catch (parseError) {
            console.error(
              "Failed to parse gameIntegration from localStorage:",
              parseError
            );
          }
        }

        // Only process if inGameId exists and the player is not the one who spawned the car
        if (inGameId && data.playerName == inGameId) {
          // The server sends a full vehicle data object
          const newTransaction: LiveGameTransaction = {
            id: `live_${Date.now()}`,
            type: 'buy_request',
            player: {
              id: data.playerId || "unknown_player",
              username: data.playerName || "Unknown Player",
              reputation: 0, 
            },
            asset: {
              // For UI display
              id: data.vehicleId,
              name: `${data.model} ${data.niceName}`,
              price: data.price,
              image: "",
              rarity: "Common",
              specs: { speed: 0, acceleration: 0, handling: 0, durability: 0 },
              owner: "",
              forSale: true,
              category: "car",
              description: data.model || "",
            },
            requestedPrice: data.price || 0,
            currentPrice: 0,
            message: `Vehicle spawn detected for purchase.`,
            timestamp: new Date(),
            status: "pending",
            urgency: "medium", // Not provided, default to medium
            vehicleData: data, // Store original data for the API call
          };

          setTransactions((prev) => [newTransaction, ...prev.slice(0, 19)]); // Keep last 20
          setNewTransactionCount((prev) => prev + 1);
        } else {
          if (inGameId && inGameId === data.playerId) {
            console.log(
              "Ignoring SSE event: You cannot buy a vehicle you spawned."
            );
          } else {
            console.log(
              "Ignoring SSE event: inGameId not found in localStorage."
            );
          }
        }
      } catch (error) {
        console.error("Failed to parse SSE event data:", error);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
      console.log("SSE connection closed.");
    };
  }, []);

  const acceptTransaction = useCallback((transactionId: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId ? { ...tx, status: "accepted" as const } : tx
      )
    );
  }, []);

  const declineTransaction = useCallback((transactionId: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId ? { ...tx, status: "declined" as const } : tx
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
    clearNewTransactionCount,
  };
};
