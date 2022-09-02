import React from 'react';

import {
  BrowserRouter,
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import GenericWallet from './pages/GenericWallet';
import Transport from './pages/Transport';

// import WalletAuth from './pages/WalletAuth';


// <Route path="/open-rpc-near-transport/walletAuth" element={<WalletAuth />}/>
//      <Route path="/open-rpc-near-transport/connect" element={<WalletAuth />}/>
const App: React.VFC = () => (
  <Router>
    <Routes>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Route path="/walletSigning" element={<GenericWallet/>}/>
        <Route path="/" element={<Transport/>}/>
      </BrowserRouter>
    </Routes>
  </Router>
)


export default App;

