import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signMessage } from '../utils/web3';

export type GameStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing';

interface GameIntegrationState {
  isGameConnected: boolean;
  gameStatus: GameStatus;
  syncCode: string | null;
  inGameId: string | null;
  wallet: string | null;
}

interface GameIntegrationContextType extends GameIntegrationState {
  connectGame: () => Promise<void>;
  disconnectGame: () => void;
  requestPairing: (wallet: string, balance: number) => Promise<void>; // ✅ updated
  syncAssets: (wallet: string) => Promise<void>;
  setGameStatus: (s: GameStatus) => void;
}

const defaultState: GameIntegrationState = {
  isGameConnected: false,
  gameStatus: 'disconnected',
  syncCode: null,
  inGameId: null,
  wallet: null
};

const GameIntegrationContext = createContext<GameIntegrationContextType | undefined>(undefined);

export const GameIntegrationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameIntegrationState>(() => {
    const stored = localStorage.getItem('gameIntegration');
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('gameIntegration', JSON.stringify(state));
  }, [state]);

  const connectGame = async () => {
    setState(prev => ({ ...prev, gameStatus: 'connecting' }));
    await new Promise(res => setTimeout(res, 2000));
    setState(prev => ({ ...prev, isGameConnected: true, gameStatus: 'connected' }));
  };

  const disconnectGame = () => {
    setState({ ...defaultState, gameStatus: 'disconnected' });
  };

  // ✅ updated: now takes balance too
  const requestPairing = async (wallet: string, balance: number) => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const message = `/sync ${code}`;
    const sig = await signMessage(wallet, message);
    if (!sig) return;

    setState(prev => ({ ...prev, syncCode: code, wallet, gameStatus: 'connecting' }));

    const apiUrl = import.meta.env.VITE_APP_API_URL || "https://racevault.onrender.com";

    try {
      await fetch(`${apiUrl}/api/init-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, wallet, balance }) // ✅ pass token balance to backend
      });
    } catch (err) {
      console.error(err);
    }

    const start = Date.now();

    const poll = async () => {
      if (Date.now() - start > 5 * 60 * 1000) {
        setState(prev => ({ ...prev, syncCode: null, gameStatus: 'disconnected' }));
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/sync-status/${code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed') {
            setState(prev => ({
              ...prev,
              syncCode: null,
              gameStatus: 'connected',
              inGameId: data.playerId
            }));
            return;
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      setTimeout(poll, 3000);
    };

    poll();
  };

  const syncAssets = async (wallet: string) => {
    setState(prev => ({ ...prev, gameStatus: 'syncing' }));
    try {
      setState(prev => ({ ...prev, gameStatus: 'connected', wallet }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, gameStatus: 'connected' }));
    }
  };

  const setGameStatus = (s: GameStatus) => {
    setState(prev => ({ ...prev, gameStatus: s }));
  };

  return (
    <GameIntegrationContext.Provider value={{
      ...state,
      connectGame,
      disconnectGame,
      requestPairing,
      syncAssets,
      setGameStatus
    }}>
      {children}
    </GameIntegrationContext.Provider>
  );
};

export const useGameIntegration = () => {
  const ctx = useContext(GameIntegrationContext);
  if (!ctx) throw new Error('useGameIntegration must be used within GameIntegrationProvider');
  return ctx;
};
