/* eslint-disable no-console */
import { Transport } from "@open-rpc/client-js/build/transports/Transport";
import { IJSONRPCData, JSONRPCRequestData } from "@open-rpc/client-js/build/Request";
import client, { Client, HTTPTransport, RequestManager } from "@open-rpc/client-js";
import {Near, keyStores, WalletConnection} from "near-api-js";
import { MULTISIG_GAS } from "near-api-js/lib/account_multisig";
import { Environments, getConnectionConfig } from "./connection";
import {PostWalletConnection} from "../wallet"
import { createSigningWindowFunc } from "../lib/reqSign";
import { getWallet } from "../lib/near";

export const WALLET_AUTH_METHOD = "__walletAuth"




class NearWebTransport extends Transport {

  public uri: string;

  public near: Near;

  constructor(uri: string) {
    super();
    this.uri = uri;
    this.contractId = this.getContractId(uri)
    const env = this.getEnvironment(uri)
    const cfg=getConnectionConfig(env)
    const keyStore = new keyStores.BrowserLocalStorageKeyStore()
    this.near = new Near({...cfg, headers: {}, deps: {keyStore}});
  }

  private getEnvironment(uri: string): Environments{
    if(uri.split('.testnet').length > 1){
      return "testnet"
    }
    return "mainnet"
  }

  public async connect(): Promise<any> {
    // const walletUrl = await wallet.requestSignInURL("mkt.landofswapps.testnet")
    const contractId = "mkt.landofswapps.testnet";
    const wallet = new PostWalletConnection(this.near, null);
    // eslint-disable-next-line no-debugger
    /* window.open(
      `${window.location}/walletAuth?contract=${contractId}`,
      undefined,
      "popup=yes,left=0,top=0,width=400px,height=800px"
    ); */
    const url = new URL(window.location.origin)
    if (!url.origin) alert("No origin host")
    console.log(`creating window with this path ${url.origin}`)
    const signedIn = await wallet.isSignedIn() 
    if(!signedIn){
      await createSigningWindowFunc(
        {count: 1, total: 1, method: WALLET_AUTH_METHOD, params: []}, 
        url.origin,
        ()=>true,
        async ()=> !wallet.isSignedIn() 
      )     // return window.open(walletUrl)
    // await wallet.requestSignIn(this.uri);
    }
    
    console.log("occured")
    
    /* const results = await (window as any).ethereum.send({
      method: "wallet_enable",
      params: [{
        [this.uri]: {},
      }],
    });
    return results;
    return {
      "jsonrpc": "2.0",
      "id": 0,
      "data": "someobject"
    }
    */
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async sendData(data: JSONRPCRequestData, timeout: number | undefined = 5000): Promise<any> {

    const req = (data as IJSONRPCData).request
    console.log(data,timeout)
    const wallet = await getWallet("testnet")
    const providerEndpoint = "https://rpc.testnet.near.org"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const base64Args = (params: object | any[]): string => Buffer.from(JSON.stringify(params)).toString('base64')
    const contractId = "mkt.landofswapps.testnet"
    // TODO note this will only allow you to do current time queries but not back in time queries aka
    // the state at block time 100 
    const blockQuery = { finality: 'optimistic' }
    const encodedReq = {
      request_type: 'call_function',
      ...blockQuery,
      account_id: contractId,
      method_name: req.method,
      args_base64: base64Args(req.params) 
    }

    const url = new URL(window.location.origin)
    if (!url.origin) alert("No origin host")
    if(req.method === "rpc.discover"){
      const httpTransport = new HTTPTransport(providerEndpoint)
      const requestManager = new RequestManager( [ httpTransport ])
      const rpcClient = new Client(requestManager)
      const reqResult = await rpcClient.request({method: 'query', params:encodedReq})
      if(!reqResult.result) return reqResult
      return Object.assign(reqResult,{result: JSON.parse(Buffer.from(reqResult.result).toString())}) 
    }
    const {gas, attachedDeposit} = req.params as any;
    if(gas || attachedDeposit) {
      const rs = await createSigningWindowFunc({count:1, method:req.method, params: req.params, total: 1},url.origin,)
      return rs
    }
    
    const httpTransport = new HTTPTransport(providerEndpoint)
    const requestManager = new RequestManager( [ httpTransport ])
    const rpcClient = new Client(requestManager)
    const reqResult = await rpcClient.request({method: 'query', params:encodedReq})
    if(!reqResult.result) return reqResult
    return Object.assign(reqResult,{result: JSON.parse(Buffer.from(reqResult.result).toString())}) 

  }

  public close(): void {
    // noop
  }
}

export default NearWebTransport;
