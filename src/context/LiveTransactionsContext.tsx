import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { LiveGameTransaction } from "../types";
import { useGameIntegration } from "./GameIntegrationContext";

interface LiveTransactionsState {
  transactions: LiveGameTransaction[];
  isConnected: boolean;
  newTransactionCount: number;
}

interface LiveTransactionsContextType extends LiveTransactionsState {
  acceptTransaction: (transactionId: string) => void;
  declineTransaction: (transaction: LiveGameTransaction) => Promise<void>;
  clearNewTransactionCount: () => void;
}

const LiveTransactionsContext = createContext<
  LiveTransactionsContextType | undefined
>(undefined);

export const LiveTransactionsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [transactions, setTransactions] = useState<LiveGameTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newTransactionCount, setNewTransactionCount] = useState(0);
  const { inGameId } = useGameIntegration();

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

        if (
          data.event === "car_spawn" &&
          inGameId &&
          data.vehicle.playerName !== inGameId
        ) {
          const newTransaction: LiveGameTransaction = {
            id: `live_${Date.now()}`,
            type: "buy_request",
            player: {
              id: data.vehicle.playerId || "unknown_player",
              username: data.vehicle.playerName || "Unknown Player",
              reputation: 0,
            },
            asset: {
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
            urgency: "medium",
            vehicleData: data.vehicle.configJson,
            vehicleCode: data.vehicle.vehicleCode,
          };
          setTransactions((prev) => [newTransaction, ...prev.slice(0, 19)]);
          setNewTransactionCount((prev) => prev + 1);
        } else if (
          data.event === "car_edit" &&
          inGameId &&
          data.playerName === inGameId
        ) {
          const newTransaction: LiveGameTransaction = {
            id: `edit_${Date.now()}`,
            type: "vehicle_edit_request",
            player: {
              id: data.playerName,
              username: data.playerName,
              reputation: 0,
            },
            asset: {
              id: data.vehicle.vehicleCode,
              name: `${data.vehicle.model} ${data.vehicle.niceName}`,
              price: data.modification.totalCost,
              image: "",
              rarity: "Common",
              specs: { speed: 0, acceleration: 0, handling: 0, durability: 0 },
              owner: "",
              owner_address: "",
              forSale: false,
              category: "modification",
              description: `Modification for ${data.vehicle.niceName}`,
            },
            requestedPrice: data.modification.totalCost || 0,
            message: `Vehicle modification request.`,
            timestamp: new Date(),
            status: "pending",
            urgency: "high",
            vehicleCode: data.vehicle.vehicleCode,
            modification: {
              modId: data.modification.modId,
            },
          };
          setTransactions((prev) => [newTransaction, ...prev.slice(0, 19)]);
          setNewTransactionCount((prev) => prev + 1);
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
  }, [inGameId]);

  const acceptTransaction = useCallback((transactionId: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId ? { ...tx, status: "accepted" as const } : tx
      )
    );
  }, []);

  const declineTransaction = useCallback(
    async (transaction: LiveGameTransaction) => {
      const apiUrl =
        import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
      try {
        if (
          transaction.type === "vehicle_edit_request" &&
          transaction.modification
        ) {
          const response = await fetch(`${apiUrl}/api/car-edit-decline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modId: transaction.modification.modId,
              vehicleCode: transaction.vehicleCode,
            }),
          });
          const result = await response.json();
          if (result.success) {
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === transaction.id
                  ? { ...tx, status: "declined" as const }
                  : tx
              )
            );
            alert(
              `Modification for ${transaction.asset.name} declined successfully.`
            );
          } else {
            alert(`Failed to decline modification: ${result.message}`);
          }
        } else {
          const response = await fetch(`${apiUrl}/api/reject-purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehicleCode: transaction.vehicleCode }),
          });
          const result = await response.json();
          if (result.success) {
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === transaction.id
                  ? { ...tx, status: "declined" as const }
                  : tx
              )
            );
            alert(`Vehicle ${transaction.asset.name} rejected successfully.`);
          } else {
            alert(`Failed to reject vehicle: ${result.message}`);
          }
        }
      } catch (error) {
        console.error("Error rejecting transaction:", error);
        alert("An error occurred while rejecting the transaction.");
      }
    },
    []
  );

  const clearNewTransactionCount = useCallback(() => {
    setNewTransactionCount(0);
  }, []);

  return (
    <LiveTransactionsContext.Provider
      value={{
        transactions,
        isConnected,
        newTransactionCount,
        acceptTransaction,
        declineTransaction,
        clearNewTransactionCount,
      }}
    >
      {children}
    </LiveTransactionsContext.Provider>
  );
};

export const useLiveTransactions = () => {
  const ctx = useContext(LiveTransactionsContext);
  if (!ctx)
    throw new Error(
      "useLiveTransactions must be used within LiveTransactionsProvider"
    );
  return ctx;
};
