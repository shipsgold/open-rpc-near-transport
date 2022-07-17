/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react"
import {useLocation } from "react-router-dom";
import qs from "qs";
import styled from "styled-components"
import BN from "bn.js"
import { getWallet, walletSignIn } from "../lib/near";
// import {depositStorage, nftApprove, nftList, nftOffer, removeSale} from "../api/swap";


export const WALLET_AUTH_METHOD = "__walletAuth"

// TODO this might need clean up
const getBaseLocation = ():string => "http://localhost:3000"

const config = {
  frontendURI: getBaseLocation()
}

interface CallbackStatus {
  errorCode?: any
  errorMessage?: any
  transactionHashes? : any
  // eslint-disable-next-line camelcase
  public_key?: string
}
// Requeset parameters takes the methodName and arguments, and the component maps 
// from methodName to method to call and passes in the serialized parameters.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RequestData {
  method: string
  params: any[] 
  // Total out of sequence
  total: number
  count: number
}

/*
useEffect(() => {
  // eslint-disable-next-line camelcase
  const { account_id, failure } = qs.parse(location.search, { ignoreQueryPrefix: true })
  if(failure){
    const failureMsg = JSON.stringify({failure})
    window.opener.postMessage(failureMsg, config.frontendURI)
  }
  // eslint-disable-next-line camelcase
  if(window.opener !== window && window.opener !== null && account_id !== "" && account_id){
    const accountMessage = JSON.stringify({account_id})
    window.opener.postMessage(accountMessage, config.frontendURI)
  }
}, [location, history])
*/

// TODO fix typings
interface Method {
  method: (...x: any)=> any
  desc: string
}

const makeSignedIn = async (): Promise<boolean>=> {
  let retries = 5;
  let signedIn = false;
  while(retries-- && !signedIn){
    // eslint-disable-next-line no-await-in-loop
    const wallet = await getWallet("testnet")
    // 
    // eslint-disable-next-line no-debugger
    signedIn = wallet.isSignedIn()
  }
  return signedIn || retries > 0 
}
const launchWallet = async () => {
  console.log("wecalled it ")
  const initWallet = await getWallet("testnet")     
  const accountId = await walletSignIn(initWallet,"mkt.landofswapps.testnet", "mkt.landofswapps.testnet")
}
const methods: {[k: string]: Method}= {
  "__walletAuth": {method: launchWallet, desc: "Authorize contract"}
/*  "depositStorage": { method: depositStorage, desc: "marketplace storage deposit"},
  "nftApprove": {method: nftApprove, desc: "nft token approval"},
  "nftList": {method: nftList, desc:"listing the token for sale"},
  "nftOffer": {method: nftOffer, desc: "accepting the swap offer"},
  "removeSale": {method: removeSale, desc: "removing the listing"}
  */
}


const Message = styled.div`
  text-align: center;
  font-size: 1.95rem;
  margin-left: 20px;
  margin-right: 20px;
  color: black;
`
const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: center;
`

const genericSigner= async (method:string, params: any) => {

  const wallet = await getWallet("testnet")
  const copyParams = {...params}
  
  // eslint-disable-next-line no-param-reassign
  delete params.attachedDeposit;
  // eslint-disable-next-line no-param-reassign
  delete params.gas;

  const attachedDeposit = copyParams.attachedDeposit || "0" 
  const gas = copyParams.gas || "3000000" 
  await wallet.account().functionCall({args:params,
    contractId: "mkt.landofswapps.testnet",
    methodName: method,
    attachedDeposit: new BN(attachedDeposit),
    gas: new BN(gas)
  })
}

const WalletRequest: React.FunctionComponent = () => {
  const location = useLocation();

  const [method, setMethod] = useState<Method>();
  const [methodName, setMethodName] = useState<string>("");
  const [params, setParams] = useState<any[]>();
  const [count, setCount] = useState<number>();
  const [total, setTotal] = useState<number>();
  const [result, setResult] = useState<any>()
  const [txHash, setTxHash] = useState<string>();


  const getParams = () =>
    window.addEventListener(
      "message",
      (event) => {
        if(event.origin === config.frontendURI){
          try { 
            const message: RequestData = JSON.parse(event.data)
            if(message.method){
              const mthd = methods[message.method] ? methods[message.method] : {method: ()=>true, desc:""};
              console.log(`listening from wallet window ${JSON.stringify(message)}`)
              setParams(message.params)
              setMethod(mthd)
              setMethodName(message.method);
              setCount(message.count)
              setTotal(message.total)
            }
          }catch(e){
            // console.warn(e)
          }
        }
      },
      false
    );

   
  useEffect(()=> {
    getParams()
  },[]);

  useEffect(() => {
    async function callMethod(){
      if(count && total && method && params) {
        setTimeout(async ()=>{
          alert('launched')
          let res
          if((params as any).attachedDeposit || (params as any).gas){
            res = await genericSigner(methodName,params)
          } else{
            res = await method.method(...params as any)
          }

          setResult(res);
        }, 2500)
      }
    }
    callMethod()
  })

  useEffect(()=>{

    async function verifyTxOrAuthorization() {
      const parseUrl = ():CallbackStatus => qs.parse(location.search, { ignoreQueryPrefix: true })
      const parsedUrl = parseUrl();

      if(window.opener !== window && window.opener !== null && parsedUrl.transactionHashes){
      // If this is a sequence let's prevent sending the same hash over and over

        if(txHash) return
        setTxHash(parsedUrl.transactionHashes);
        const successMessage = JSON.stringify({success: parsedUrl.transactionHashes, value: result})
        window.opener.postMessage(successMessage, config.frontendURI)
        return
      }

      if(window.opener !== window && window.opener !== null && parsedUrl.public_key){
        const res = await makeSignedIn()
        if(res){
          const successMessage = JSON.stringify({success: parsedUrl.public_key, value: res})
          window.opener.postMessage(successMessage, config.frontendURI)
        }else {
          const failMessage = JSON.stringify({failure: { errorCode: 3272, errorMessage: "could not sign in"}})
          window.opener.postMessage(failMessage, config.frontendURI)
        }
        return
      }
      if(window.opener !== window && window.opener !== null && parsedUrl.errorCode){
        const failMessage = JSON.stringify({failure: { errorCode: parsedUrl.errorCode, errorMessage: parsedUrl.errorMessage}})
        window.opener.postMessage(failMessage, config.frontendURI)
      }
    }
    verifyTxOrAuthorization()
  }, [location.search, result, setTxHash, txHash])
  return (<MessageContainer>
    {method && <Message>Loading wallet 
      to sign transaction {count} of {total} for {method && method.desc}</Message>}
    {!method && <Message>Loading wallet </Message>}
  </MessageContainer>)
}


export default WalletRequest