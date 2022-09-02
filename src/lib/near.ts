import { connect, keyStores, Near, WalletConnection } from "near-api-js";
import { BrowserLocalStorageKeyStore } from "near-api-js/lib/key_stores";
import { Environments, getConnectionConfig } from "../transports/connection";

export async function getConnection(
  keyStore: keyStores.BrowserLocalStorageKeyStore,
  env: Environments,
): Promise<Near> {
  return connect({
    deps: {
      keyStore
    },
    ...getConnectionConfig(env),
    headers: {}
  });
}


const getNear = async (env: Environments):Promise<Near> => {
  const nearConnection = await connect({
    deps: {
      keyStore: new keyStores.BrowserLocalStorageKeyStore() 
    },
    headers: {},
    ...getConnectionConfig(env)
  })
  return nearConnection;
};

export function isValidContractId(contractId?: string): boolean {
  if(!contractId || contractId.length < 3  ||
    (!contractId.endsWith(".near") 
    && !contractId.endsWith(".testnet"))){
    return false 
  }
  return true
}

export function getEnvironment(uri: string): Environments {
  if(uri.split('.testnet').length > 1){
    return "testnet"
  }
  return "mainnet"
}

export async function getWalletConnection(near: Near, appKey: string | null = null): Promise<WalletConnection> {
  return new WalletConnection(near, appKey);
}

// TODO note this might be fragile in different context
export const walletSignIn = async (
  wallet: WalletConnection,
  contractId: string,
  contractName: string
): Promise<string> => {
  if (wallet.isSignedIn() === false) {
    // eslint-disable-next-line no-underscore-dangle
    await wallet.requestSignIn(
      contractId, // contract requesting access
      contractName, // optional
      `${window.location}`, // successs
      `${window.location}?failure=true` // failure
    );
  }
  return wallet.getAccountId();
};

export async function getWallet(env: Environments, appKey: string | null = null): Promise<WalletConnection> {
  const near = await getNear(env)
  return getWalletConnection(near, appKey);
}


export default getWalletConnection;
