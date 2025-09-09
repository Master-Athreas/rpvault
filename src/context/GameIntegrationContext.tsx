import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { signMessage } from "../utils/web3";

export type GameStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "syncing";

interface GameIntegrationState {
  isGameConnected: boolean;
  gameStatus: GameStatus;
  syncCode: string | null;
  inGameId: string | null;
  wallet: string | null;
  userData: any | null;
}

interface GameIntegrationContextType extends GameIntegrationState {
  connectGame: (walletAddress: string) => Promise<void>;
  disconnectGame: () => void;
  requestPairing: (wallet: string, balance: number) => Promise<void>;
  syncAssets: (wallet: string) => Promise<void>;
  setGameStatus: (s: GameStatus) => void;
  fetchUserData: (walletAddress: string) => Promise<void>;
}

const defaultState: GameIntegrationState = {
  isGameConnected: false,
  gameStatus: "disconnected",
  syncCode: null,
  inGameId: null,
  wallet: null,
  userData: null,
};

const GameIntegrationContext = createContext<
  GameIntegrationContextType | undefined
>(undefined);

export const GameIntegrationProvider = ({
  children,
  connectedWalletAddress,
}: {
  children: ReactNode;
  connectedWalletAddress?: string;
}) => {
  const [state, setState] = useState<GameIntegrationState>(defaultState);

  useEffect(() => {
    if (connectedWalletAddress) {
      fetchUserData(connectedWalletAddress);
    }
  }, [connectedWalletAddress]);

  const connectGame = async (walletAddress: string) => {
    setState((prev) => ({ ...prev, gameStatus: "connecting", wallet: walletAddress }));
    await new Promise((res) => setTimeout(res, 2000));
    await fetchUserData(walletAddress);
    setState((prev) => ({
      ...prev,
      isGameConnected: true,
      gameStatus: "connected",
    }));
  };

  const disconnectGame = () => {
    setState({ ...defaultState, gameStatus: "disconnected" });
  };

  // ✅ updated: now takes balance too
  const requestPairing = async (wallet: string, balance: number) => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const message = `/sync ${code}`;
    const sig = await signMessage(wallet, message);
    if (!sig) return;

    setState((prev) => ({
      ...prev,
      syncCode: code,
      wallet,
      gameStatus: "connecting",
    }));

    const apiUrl =
      import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";

    try {
      // Fetch the user's actual token balance

      const response = await fetch(`${apiUrl}/api/init-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, wallet, balance }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle failed init-sync
        console.error("Failed to initialize sync:", result.message);
        alert(`Error: ${result.message || "Could not start sync process."}`);
        setState((prev) => ({
          ...prev,
          syncCode: null,
          gameStatus: "disconnected",
        }));
        return;
      }
    } catch (err) {
      console.error("Error during init-sync fetch:", err);
      alert("An error occurred during the sync process. Please try again.");
      setState((prev) => ({
        ...prev,
        syncCode: null,
        gameStatus: "disconnected",
      }));
      return;
    }

    const eventSource = new EventSource(`${apiUrl}/api/sync-events/${code}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "completed") {
        setState((prev) => ({
          ...prev,
          syncCode: null,
          gameStatus: "connected",
          inGameId: data.playerId,
        }));
        fetchUserData(wallet);
        eventSource.close(); // Stop listening
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      setState((prev) => ({
        ...prev,
        syncCode: null,
        gameStatus: "disconnected",
      }));
      eventSource.close();
    };
  };

  const syncAssets = async (wallet: string) => {
    setState((prev) => ({ ...prev, gameStatus: "syncing" }));
    try {
      await fetchUserData(wallet);
      setState((prev) => ({ ...prev, gameStatus: "connected", wallet }));
    } catch (err) {
      console.error(err);
      setState((prev) => ({ ...prev, gameStatus: "connected" }));
    }
  };

  const setGameStatus = (s: GameStatus) => {
    setState((prev) => ({ ...prev, gameStatus: s }));
  };

  const fetchUserData = async (walletAddress: string) => {
    const apiUrl =
      import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";
    try {
      const response = await fetch(`${apiUrl}/api/users/wallet/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setState((prev) => ({
            ...prev,
            userData: data.user,
            inGameId: data.user?.playerId || null,
            isGameConnected: !!data.user?.playerId, // Set isGameConnected based on playerId presence
          }));
        } else {
          setState((prev) => ({ ...prev, userData: null, inGameId: null, isGameConnected: false }));
        }
      } else {
        setState((prev) => ({ ...prev, userData: null, inGameId: null, isGameConnected: false }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setState((prev) => ({ ...prev, userData: null, inGameId: null, isGameConnected: false }));
    }
  };

  return (
    <GameIntegrationContext.Provider
      value={{
        ...state,
        connectGame,
        disconnectGame,
        requestPairing,
        syncAssets,
        setGameStatus,
        fetchUserData,
      }}
    >
      {children}
    </GameIntegrationContext.Provider>
  );
};

export const useGameIntegration = () => {
  const ctx = useContext(GameIntegrationContext);
  if (!ctx)
    throw new Error(
      "useGameIntegration must be used within GameIntegrationProvider"
    );
  return ctx;
};
