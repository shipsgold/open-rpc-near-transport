import React from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import GenericWallet from './pages/GenericWallet';
import Transport from './pages/Transport';
import WalletAuth from './pages/WalletAuth';

// import WalletAuth from './pages/WalletAuth';


// <Route path="/open-rpc-near-transport/walletAuth" element={<WalletAuth />}/>
//      <Route path="/open-rpc-near-transport/connect" element={<WalletAuth />}/>
const App: React.VFC = () => (
  <Router basename="/open-rpc-near-transport">    
    <Routes>
      <Route path="/walletAuth" element={<WalletAuth />}/>
      <Route path="/connect" element={<WalletAuth />}/>
      <Route path="/walletSigning" element={<GenericWallet/>}/>
      <Route path="/" element={<Transport/>}/>
    </Routes>
  </Router>
)


export default App;

