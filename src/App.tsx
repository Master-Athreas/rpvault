import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Marketplace from './components/Marketplace';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import { GameIntegrationProvider } from './context/GameIntegrationContext';
import { LiveTransactionsProvider } from './context/LiveTransactionsContext';

function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <Router>
      <GameIntegrationProvider connectedWalletAddress={user?.walletAddress}>
        <LiveTransactionsProvider>
          <div className="min-h-screen bg-gray-900">
            <Header user={user} setUser={setUser} />
            <Routes>
              <Route path="/" element={<Marketplace user={user} setUser={setUser} />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </LiveTransactionsProvider>
      </GameIntegrationProvider>
    </Router>
  );
}

export default App;