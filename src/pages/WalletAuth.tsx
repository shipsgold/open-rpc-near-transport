import React, { useEffect } from "react"
import { useLocation } from "react-router-dom";
import qs from "qs";
import { getWallet, walletSignIn } from "../lib/near";
/* import config from "../config";
import { walletSignIn } from "../api/near";
*/


const WalletRequest: React.FunctionComponent = () => {
  const location = useLocation();
  useEffect(()=> {
    async function openWallet() {
      const wallet = await getWallet("testnet")     
      const accountId = await walletSignIn(wallet,"mkt.landofswapps.testnet", "mkt.landofswapps.testnet")
    }
    
    openWallet()
  });
  useEffect(() => {
    // eslint-disable-next-line camelcase
    const { account_id, failure } = qs.parse(location.search, { ignoreQueryPrefix: true })
    if(failure){
      const failureMsg = JSON.stringify({failure})
      // window.opener.postMessage(failureMsg, config.frontendURI)
    }
    // eslint-disable-next-line camelcase
    if(window.opener !== window && window.opener !== null && account_id !== "" && account_id){
      const accountMessage = JSON.stringify({account_id})
      // window.opener.postMessage(accountMessage, config.frontendURI)
    }
  }, [location])
  return (<div> Yess </div>)
}


export default WalletRequest