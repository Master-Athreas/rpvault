import { useState, useEffect, useCallback } from "react";
import { LiveGameTransaction } from "../types";
import { useGameIntegration } from "../context/GameIntegrationContext";

export const useLiveTransactions = () => {
  const [transactions, setTransactions] = useState<LiveGameTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newTransactionCount, setNewTransactionCount] = useState(0);
  const { inGameId } = useGameIntegration();

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

        // Only process if inGameId exists and the player is not the one who spawned the car
        if (inGameId && data.vehicle.playerName == inGameId) {
          // The server sends a full vehicle data object
          const newTransaction: LiveGameTransaction = {
            id: `live_${Date.now()}`,
            type: 'buy_request',
            player: {
              id: data.vehicle.playerId || "unknown_player",
              username: data.vehicle.playerName || "Unknown Player",
              reputation: 0, 
            },
            asset: {
              // For UI display
              id: data.vehicle.vehicleId,
              name: `${data.vehicle.model} ${data.vehicle.niceName}`,
              price: data.vehicle.price,
              image: "",
              rarity: "Common",
              specs: { speed: 0, acceleration: 0, handling: 0, durability: 0 },
              owner: "",
              owner_address: "",
              forSale: true,
              category: "car",
              description: data.vehicle.model || "",
            },
            requestedPrice: data.vehicle.price || 0,
            currentPrice: 0,
            message: `Vehicle spawn detected for purchase.`,
            timestamp: new Date(),
            status: "pending",
            urgency: "medium", // Not provided, default to medium
            vehicleData: data.vehicle.configJson, // Store original data for the API call
            vehicleCode: data.vehicle.vehicleCode, // Added vehicleCode
          };

          setTransactions((prev) => [newTransaction, ...prev.slice(0, 19)]); // Keep last 20
          setNewTransactionCount((prev) => prev + 1);
        } else {
          if (inGameId && inGameId === data.vehicle.playerId) {
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

  const declineTransaction = useCallback(async (transaction: LiveGameTransaction) => {
    const apiUrl = import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
    try {
      const response = await fetch(`${apiUrl}/api/reject-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleCode: transaction.vehicleCode }),
      });
      const result = await response.json();
      if (result.success) {
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transaction.id ? { ...tx, status: "declined" as const } : tx
          )
        );
        alert(`Vehicle ${transaction.asset.name} rejected successfully.`);
      } else {
        alert(`Failed to reject vehicle: ${result.message}`);
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      alert("An error occurred while rejecting the transaction.");
    }
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
