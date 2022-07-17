export type Environments = "testnet" | "mainnet"

export interface ConnectionConfig {
  networkId: Environments 
  nodeUrl: string,
  walletUrl: string,
  helperUrl: string
}

export const testNetConfig: ConnectionConfig = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org"
}

export const mainNetConfig: ConnectionConfig = {
  networkId: "mainnet",
  nodeUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://wallet.mainnet.near.org",
  helperUrl: "https://helper.mainnet.near.org"
}

export interface DefaultConnectionConfig {
  mainnet: ConnectionConfig
  testnet: ConnectionConfig
}

const defaultConfigs = {
  mainnet: mainNetConfig,
  testnet: testNetConfig
}

export const getConnectionConfig = (entry: Environments): ConnectionConfig => defaultConfigs[entry]