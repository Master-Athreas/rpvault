import React, { useState } from 'react';
import { useGameIntegration } from '../context/GameIntegrationContext';
import CarCard from './CarCard';
import { 
  Gamepad2, 
  Wifi, 
  WifiOff, 
  Settings, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

interface GameIntegrationPanelProps {
  user: any;
  tokenBalance: number; // ✅ Add this
}

const GameIntegrationPanel: React.FC<GameIntegrationPanelProps> = ({ user, tokenBalance }) => {
  const {
    isGameConnected,
    gameStatus,
    syncCode,
    inGameId,
    connectGame,
    disconnectGame,
    requestPairing,
    syncAssets,
  } = useGameIntegration();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handlePairing = async () => {
    if (!user) return;
    await requestPairing(user.address, tokenBalance); // ✅ Use correct token balance
  };

  const handleGameConnection = async () => {
    if (isGameConnected) {
      disconnectGame();
      return;
    }
    await connectGame();
    setLastSync(new Date());
  };

  const handleSync = async () => {
    if (!user) return;
    await syncAssets(user.address);
    setLastSync(new Date());
  };

  const getStatusColor = () => {
    switch (gameStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting':
      case 'syncing': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
    }
  };

  const getStatusIcon = () => {
    switch (gameStatus) {
      case 'connected': return <CheckCircle className="h-5 w-5" />;
      case 'connecting':
      case 'syncing': return <RefreshCw className="h-5 w-5 animate-spin" />;
      case 'disconnected': return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (gameStatus) {
      case 'connected': return 'Game Connected';
      case 'connecting': return 'Connecting to Game...';
      case 'syncing': return 'Syncing Assets...';
      case 'disconnected': return 'Game Disconnected';
    }
  };

  return (
    <div className="bg-midnight-800 border border-midnight-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-neon-500 to-neon-400 p-2 rounded-lg">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Game Integration</h3>
            <p className="text-gray-400 text-sm">Connect your racing game account</p>
          </div>
        </div>
        <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white transition-colors" />
      </div>

      {/* Connection Status */}
      <div className="bg-midnight-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <div>
              <p className={`font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </p>
              {lastSync && (
                <p className="text-xs text-gray-400">
                  Last sync: {lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          {isGameConnected ? (
            <Wifi className="h-5 w-5 text-green-400" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-400" />
          )}
        </div>

        {/* Connection Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleGameConnection}
            disabled={gameStatus === 'connecting' || gameStatus === 'syncing'}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors duration-200 ${
              isGameConnected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neon-500 hover:bg-neon-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGameConnected ? 'Disconnect' : 'Connect Game'}
          </button>

          {isGameConnected && (
            <>
              <button
                onClick={handleSync}
                disabled={gameStatus === 'syncing'}
                className="bg-neon-500 hover:bg-neon-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${gameStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handlePairing}
                className="bg-neon-600 hover:bg-neon-500 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
              >
                Pair with Game
              </button>
            </>
          )}
        </div>
      </div>

      {isGameConnected && syncCode && (
        <div className="bg-midnight-700 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-300 mb-2">Type this command in BeamMP chat to pair:</p>
          <div className="font-mono text-white bg-midnight-800 px-3 py-2 rounded-lg inline-block select-all">
            /sync {syncCode}
          </div>
        </div>
      )}

      {/* Game Features */}
      {isGameConnected && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-midnight-700 rounded-lg p-3 text-center">
              <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Real-time Sync</p>
              <p className="text-xs text-gray-400">Assets sync automatically</p>
            </div>
            <div className="bg-midnight-700 rounded-lg p-3 text-center">
              <Clock className="h-6 w-6 text-neon-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Live Transactions</p>
              <p className="text-xs text-gray-400">Instant game notifications</p>
            </div>
          </div>

          {/* Game Account Info */}
          {inGameId && user && (
            <div className="bg-midnight-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Linked Account</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet:</span>
                  <span className="text-white">{user.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Player ID:</span>
                  <span className="text-white">{inGameId}</span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleSync}
                  disabled={gameStatus === 'syncing'}
                  className="bg-neon-500 hover:bg-neon-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sync Assets
                </button>
              </div>
              {user.ownedAssets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {user.ownedAssets.map((asset: any) => (
                    <CarCard key={asset.id} car={asset} showBuyButton={false} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Connection Instructions */}
      {!isGameConnected && (
        <div className="bg-midnight-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">How to Connect</h4>
          <ol className="text-sm text-gray-400 space-y-1">
            <li>1. Launch your racing game</li>
            <li>2. Go to Settings → Web3 Integration</li>
            <li>3. Click "Connect Game" above</li>
            <li>4. Confirm connection in-game</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default GameIntegrationPanel;
