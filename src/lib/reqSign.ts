/* eslint-disable @typescript-eslint/no-explicit-any */
import { getWallet, walletSignIn } from "./near";

export interface ShouldOpenWindow {
  (): Promise<boolean>;
}
export interface CallbackMessage {
  success?: any;
  failure?: any;
}
export interface CheckMessage {
  (message: any): void;
}
export interface Req {
  method: string;
  params: any | any[];
  total: number;
  count: number;
}

let prevWindow: Window | null;
export const closeSigningWindow = ():void => {
  prevWindow?.close();
  prevWindow = null;
}

export const walletAuth = async () => {
  const wallet = await getWallet("testnet")     
  const accountId = await walletSignIn(wallet,"mkt.landofswapps.testnet", "mkt.landofswapps.testnet")
}

export const createSigningWindowFunc = async (
  req: Req,
  // TODO something more rigorous for validity
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentPath: string,
  checkMessage: CheckMessage = (m: string) => "",
  shouldOpenWindow: ShouldOpenWindow = async () => true
): Promise<any> => {
  let w: Window | null;
  const prom: Promise<any> = new Promise((resolve, reject) => {
    const listener = (event: any) => {
      
      console.log(`the parent path  ${parentPath}, origin: ${origin} event:${JSON.stringify(event)}`)
      if (event.origin === parentPath) {
        try {
          const message = JSON.parse(event.data);
          checkMessage(message);
          if (message.success !== undefined) {
            window.removeEventListener('message',listener);
            resolve(message);
          }

          if (message.failure !== undefined) {
            prevWindow?.close();
            prevWindow = null;
            window.removeEventListener('message',listener);
            reject(message);
          }
        } catch (e) {
          console.warn(event.data)
          console.warn(e);
        }
      }
    }
    window.addEventListener(
      "message",
      listener,
      false
    );
  });
  const shouldOpen = await shouldOpenWindow();

  if (shouldOpen === true && req.count === 1) {
    w = window.open(
      `${parentPath}/open-rpc-near-transport/walletSigning`,
      undefined,
      "popup=yes,left=0,top=0,width=400px,height=800px"
    );
    prevWindow = w;
  }
  setTimeout(() => {
    prevWindow?.postMessage(JSON.stringify(req), `${parentPath}`);
  }, 3000);
  
  return prom;
};
