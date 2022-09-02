/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react"
import {useLocation } from "react-router-dom";
import qs from "qs";
import styled from "styled-components"
import BN from "bn.js"
import { getEnvironment, getWallet, walletSignIn } from "../lib/near";


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
  contractId: string
  // Total out of sequence
  total: number
  count: number
}

// TODO fix typings
interface Method {
  method: (...x: any)=> any
  desc: string
}

const makeSignedIn = async (contractId: string): Promise<boolean>=> {
  let retries = 5;
  let signedIn = false;
  while(retries-- && !signedIn){
    const env = getEnvironment(contractId)
    // eslint-disable-next-line no-await-in-loop
    const wallet = await getWallet(env,contractId)
    // 
    // eslint-disable-next-line no-debugger
    signedIn = wallet.isSignedIn()
  }
  return signedIn || retries > 0 
}
const launchWallet = async (contractId: string) => {
   
  const env = getEnvironment(contractId)
  // eslint-disable-next-line no-await-in-loop
  const wallet = await getWallet(env,contractId)
  return walletSignIn(wallet,contractId, contractId)
}
const methods: {[k: string]: Method}= {
  "__walletAuth": {method: launchWallet, desc: "Authorize contract"}
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

const genericSigner= async (method:string, params: any, contractId: string) => {

  const env = getEnvironment(contractId)
  // eslint-disable-next-line no-await-in-loop
  const wallet = await getWallet(env)
  const copyParams = {...params}
  
  // eslint-disable-next-line no-param-reassign
  delete params.attachedDeposit;
  // eslint-disable-next-line no-param-reassign
  delete params.gas;
  // eslint-disable-next-line no-param-reassign

  const attachedDeposit = copyParams.attachedDeposit || "0" 
  const gas = copyParams.gas || "3000000" 
  await wallet.account().functionCall({args:params,
    contractId,
    methodName: method,
    attachedDeposit: new BN(attachedDeposit),
    gas: new BN(gas)
  })
}

const WalletRequest: React.FunctionComponent = () => {
  const location = useLocation();

  const [method, setMethod] = useState<Method>();
  const [methodName, setMethodName] = useState<string>("");
  const [contractId, setContractId] = useState<string>("");
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
              setParams(message.params)
              setMethod(mthd)
              setContractId(message.contractId)
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
          let res
          if((params as any).attachedDeposit || (params as any).gas){
            res = await genericSigner(methodName,params, contractId)
          } else{
            // TODO call walletAuth directly
            res = await method.method(contractId)
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
        const res = await makeSignedIn(contractId)
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
  }, [location.search, result, setTxHash, txHash, contractId])
  return (<MessageContainer>
    {method && <Message>Loading wallet 
      to sign transaction {count} of {total} for {method && method.desc}</Message>}
    {!method && <Message>Loading wallet </Message>}
  </MessageContainer>)
}


export default WalletRequest