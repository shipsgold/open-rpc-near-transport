import React, { useEffect } from "react"
import openrpcDocument from "../openrpc.json";
import methodMapping from "../methods/methodMapping";



async function messageHandler(ev: MessageEvent){
  // eslint-disable-next-line no-console
  console.log("origin", ev.origin);
  // eslint-disable-next-line no-console
  console.log("data", ev.data.error); 
  if (ev.data.method === "rpc.discover") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ev.source as any).postMessage({
      jsonrpc: "2.0",
      result: openrpcDocument,
      id: ev.data.id,
    }, ev.origin);
    return;
  }

  if (!methodMapping[ev.data.method]) {
    // eslint-disable-next-line no-debugger
    (ev.source as WindowProxy).postMessage({
      jsonrpc: "2.0",
      error: {
        code: 32009,
        message: "Method not found",
      },
      id: ev.data.id,
    }, ev.origin);
    
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methodMapping[ev.data.method](...ev.data.params).then((results: any) => {
    (ev.source as WindowProxy).postMessage({
      jsonrpc: "2.0",
      result: results,
      id: ev.data.id,
    }, ev.origin);
  }).catch((e: Error) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ev.source as any).postMessage({
      jsonrpc: "2.0",
      error: {
        code: 32329,
        message: e.message,
      },
      id: ev.data.id,
    }, ev.origin);
  });
}


const Transport: React.FunctionComponent = () => {
  
  useEffect(()=> {
    async function initTransport() {
      window.addEventListener("message", messageHandler)
    }
    
    initTransport()
    return ()=> {window.removeEventListener("message", messageHandler)}
  });
  return (<div> </div>)
}


export default Transport 