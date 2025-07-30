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
  requestPairing: (wallet: string) => Promise<void>;
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

  const requestPairing = async (wallet: string) => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const message = `/sync ${code}`;
    const sig = await signMessage(wallet, message);
    if (!sig) return;

    setState(prev => ({ ...prev, syncCode: code, wallet, gameStatus: 'connecting' }));

    try {
      await fetch('/api/init-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, wallet })
      });
    } catch (err) {
      console.error(err);
    }

    const playerId = `RaceVault_${wallet.slice(-8).toUpperCase()}`;
    const start = Date.now();

    const poll = async () => {
      try {
        const res = await fetch('/api/verify-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, playerId })
        });

        if (res.status === 410) {
          setState(prev => ({ ...prev, syncCode: null, gameStatus: 'connected' }));
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setState(prev => ({
              ...prev,
              syncCode: null,
              gameStatus: 'connected',
              inGameId: playerId
            }));
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }

      if (Date.now() - start < 5 * 60 * 1000) {
        setTimeout(poll, 3000);
      } else {
        setState(prev => ({ ...prev, syncCode: null, gameStatus: 'connected' }));
      }
    };

    poll();
  };

  const syncAssets = async (wallet: string) => {
    setState(prev => ({ ...prev, gameStatus: 'syncing' }));
    try {
      await fetch('/api/sync-assets');
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
    <GameIntegrationContext.Provider value={{ ...state, connectGame, disconnectGame, requestPairing, syncAssets, setGameStatus }}>
      {children}
    </GameIntegrationContext.Provider>
  );
};

export const useGameIntegration = () => {
  const ctx = useContext(GameIntegrationContext);
  if (!ctx) throw new Error('useGameIntegration must be used within GameIntegrationProvider');
  return ctx;
};
