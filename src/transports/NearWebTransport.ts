/* eslint-disable no-console */
import { Transport } from "@open-rpc/client-js/build/transports/Transport";
import { IJSONRPCData, JSONRPCRequestData } from "@open-rpc/client-js/build/Request";
import { Client, HTTPTransport, RequestManager } from "@open-rpc/client-js";
import {Near, keyStores} from "near-api-js";
import {getConnectionConfig } from "./connection";
import { createSigningWindowFunc } from "../lib/reqSign";
import { getEnvironment, getWallet, isValidContractId } from "../lib/near";

export const WALLET_AUTH_METHOD = "__walletAuth"




class NearWebTransport extends Transport {

  public uri: string;

  public near: Near;

  public contractId: string;

  constructor(uri: string) {
    super();
    this.uri = uri;
    this.contractId = this.getContractId(uri)
    const env = getEnvironment(uri)
    const cfg=getConnectionConfig(env)
    const keyStore = new keyStores.BrowserLocalStorageKeyStore()
    this.near = new Near({...cfg, headers: {}, deps: {keyStore}});
  }

  private getContractId(uri: string): string{
    return uri
  }
  


  public async connect(): Promise<any> {


    if(!isValidContractId(this.contractId)) return
    const url = new URL(window.location.origin)
    if (!url.origin) alert("No origin host")
    console.log(`creating window with this path ${url.origin}`)
    const env = getEnvironment(this.contractId)
    const wallet = await getWallet(env,this.contractId)
    const signedIn = await wallet.isSignedIn() 
    if(!signedIn){
      await createSigningWindowFunc(
        {count: 1, total: 1, method: WALLET_AUTH_METHOD, params: [], contractId: this.contractId}, 
        url.origin,
        ()=>true,
        async ()=> !wallet.isSignedIn() 
      )
    }
    
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async sendData(data: JSONRPCRequestData, timeout: number | undefined = 5000): Promise<any> {

    if(!isValidContractId(this.contractId)) return undefined
    const req = (data as IJSONRPCData).request
    console.log(data,timeout)
    const env = getEnvironment(this.contractId)
    const config = getConnectionConfig(env)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const base64Args = (params: object | any[]): string => Buffer.from(JSON.stringify(params)).toString('base64')
    // TODO note this will only allow you to do current time queries but not back in time queries aka
    // the state at block time 100 
    const blockQuery = { finality: 'optimistic' }
    const encodedReq = {
      request_type: 'call_function',
      ...blockQuery,
      account_id: this.contractId,
      method_name: req.method,
      args_base64: base64Args(req.params) 
    }

    const url = new URL(window.location.origin)
    if (!url.origin) alert("No origin host")
    if(req.method === "rpc.discover"){
      const httpTransport = new HTTPTransport(config.nodeUrl)
      const requestManager = new RequestManager( [ httpTransport ])
      const rpcClient = new Client(requestManager)
      const reqResult = await rpcClient.request({method: 'query', params:encodedReq})
      if(!reqResult.result) return reqResult
      return Object.assign(reqResult,{result: JSON.parse(Buffer.from(reqResult.result).toString())}) 
    }
    const {gas, attachedDeposit} = req.params as any;
    if(gas || attachedDeposit) {
      console.log(req.params)

      const rs = await createSigningWindowFunc({count:1, method:req.method, params: req.params, total: 1, contractId: this.contractId},url.origin,)
      return rs
    }
    
    const httpTransport = new HTTPTransport(config.nodeUrl)
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
