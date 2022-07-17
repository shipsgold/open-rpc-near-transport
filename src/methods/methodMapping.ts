/* eslint-disable no-console */
import { Connect, SendData, SendResponse } from "../__GENERATED_TYPES__";
import NearWebTransport from "../transports/NearWebTransport";

export interface IMethodMapping {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [methodName: string]: (...params: any) => Promise<any>;
}

let transport: NearWebTransport | undefined;
let internalID = 0;
let transportWindow: Window;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connect: Connect = async (uri: any) => {
  console.log("transport");
  transport = new NearWebTransport(uri);
  console.log("connecting")
  transportWindow = await transport.connect();
  console.log("connected")
  return true;
};

const sendData: SendData = (data: any) => {
  if (!transport) {
    throw new Error("Not Connected");
  }
  return transport.sendData({
    internalID: internalID++,
    request: data,
  });
};

const sendResponse: SendResponse =async  () => {
  console.log(`sendResponse`)
  if(transportWindow){
    transportWindow.close()
  }
  return true
}

const methodMapping: IMethodMapping = {
  connect,
  sendData,
  sendResponse
};

export default methodMapping;
