import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Marketplace from './components/Marketplace';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import { GameIntegrationProvider } from './context/GameIntegrationContext';

function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <GameIntegrationProvider connectedWalletAddress={user?.walletAddress}>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Header user={user} setUser={setUser} />
          <Routes>
            <Route path="/" element={<Marketplace user={user} setUser={setUser} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </Router>
    </GameIntegrationProvider>
  );
}

export default App;