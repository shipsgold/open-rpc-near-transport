import qs from "qs"
import React from 'react';
import ReactDOM from 'react-dom';


import openrpcDocument from "./openrpc.json";
import methodMapping from "./methods/methodMapping";
import App from "./App";
/*
if(window.opener) {
  // if the origin is the callback url of the wallet

  const parsedQs = qs.parse(window.location.search, { ignoreQueryPrefix: true })
  if (parsedQs.account_id) {
    const event = new CustomEvent('connected-response', { detail: "freeza" });
    window.dispatchEvent(event)
    window.opener.postMessage(JSON.stringify({ method: "sendResponse", params: [{ response: parsedQs }] }), "*")
    window.close()
  }
} */


ReactDOM.render(
  //  <React.StrictMode>
  <App />,
  // </React.StrictMode>,
  document.getElementById('root')
);


export default {};
