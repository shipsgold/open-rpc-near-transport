import React from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import GenericWallet from './pages/GenericWallet';
import Transport from './pages/Transport';

import WalletAuth from './pages/WalletAuth';


const App: React.VFC = () => (
  <Router>
    <Routes>
      <Route path="/open-rpc-near-transport/walletAuth" element={<WalletAuth />}/>
      <Route path="/open-rpc-near-transport/connect" element={<WalletAuth />}/>
      <Route path="/open-rpc-near-transport/walletSigning" element={<GenericWallet/>}/>
      <Route path="/open-rpc-near-transport" element={<Transport/>}/>
      <Route path="/" element={<Transport/>}/>
    </Routes>
  </Router>
)


export default App;

