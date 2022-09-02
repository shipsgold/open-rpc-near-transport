/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-constructor */
/* eslint-disable max-classes-per-file */
import { KeyPair, WalletConnection, Near, Connection, ConnectedWalletAccount, } from "near-api-js";
import { createTransaction, SCHEMA, Transaction } from "near-api-js/lib/transaction";
import { baseDecode, serialize } from 'borsh';
import { PublicKey } from "near-api-js/lib/utils";
import { FinalExecutionOutcome } from "near-api-js/lib/providers";
import { SignAndSendTransactionOptions } from "near-api-js/lib/account";

const LOGIN_WALLET_URL_SUFFIX = '/login/';
const PENDING_ACCESS_KEY_PREFIX = 'pending_key'; // browser storage key for a pending access key (i.e. key has been generated but we are not sure it was added yet)

interface RequestSignTransactionsOptions {
	/** list of transactions to sign */
	transactions: Transaction[];
	/** url NEAR Wallet will redirect to after transaction signing is complete */
	callbackUrl?: string;
	/** meta information NEAR Wallet will send back to the application. `meta` will be attached to the `callbackUrl` as a url search param */
	meta?: string;
}

interface SignInOptions {
	contractId?: string;
	methodNames?: string[];
	// TODO: Replace following with single callbackUrl
	successUrl?: string;
	failureUrl?: string;
    } 
    
export class PostWalletConnection extends WalletConnection {
  // eslint-disable-next-line no-useless-constructor
  constructor(near: Near, appKeyPrefix: string | null) {
    super(near, appKeyPrefix)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async requestSignIn( contractIdOrOptions: string | SignInOptions = {},
    title?: string,
    successUrl?: string,
    failureUrl?: string):Promise<any>{
    const newUrl = await this.requestSignInURL(contractIdOrOptions, title, successUrl, failureUrl)
    window.location.assign(newUrl.toString());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async requestSignInURL( contractIdOrOptions: string | SignInOptions = {},
    title?: string,
    successUrl?: string,
    failureUrl?: string):Promise<string>{
    let options: SignInOptions;
    if (typeof contractIdOrOptions === 'string') {
      options = { contractId: contractIdOrOptions, successUrl, failureUrl };
    } else {
      options = contractIdOrOptions as SignInOptions;
    }

    /* Throws exception if account does not exist */
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const contractAccount = await this._near.account(options.contractId!);
    await contractAccount.state();

    const currentUrl = new URL(window.location.href);
    const newUrl = new URL(this._walletBaseUrl + LOGIN_WALLET_URL_SUFFIX);
    newUrl.searchParams.set('success_url', options.successUrl || currentUrl.href);
    newUrl.searchParams.set('failure_url', options.failureUrl || currentUrl.href);
    if (options.contractId) {
      newUrl.searchParams.set('contract_id', options.contractId);
      const accessKey = KeyPair.fromRandom('ed25519');
      newUrl.searchParams.set('public_key', accessKey.getPublicKey().toString());
      await this._keyStore.setKey(this._networkId, PENDING_ACCESS_KEY_PREFIX + accessKey.getPublicKey(), accessKey);
    }

    if (options.methodNames) {
      options.methodNames.forEach(methodName => {
        newUrl.searchParams.append('methodNames', methodName);
      });
    }	
    return newUrl.toString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async requestSignTransactions(...args: any[]):Promise<any> {
    if(Array.isArray(args[0])) {
      return this.__requestSignTransactions({
        transactions: args[0],
        callbackUrl: args[1],
        meta: args[2]
      });
    }

    return this.__requestSignTransactions(args[0]);
  }

  async __requestSignTransactions({ transactions, meta, callbackUrl }: RequestSignTransactionsOptions): Promise<void> {
    const currentUrl = new URL(window.location.href);
    const newUrl = new URL('sign', this._walletBaseUrl);

    newUrl.searchParams.set('transactions', transactions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((transaction: any) => serialize(SCHEMA, transaction))
      .map((serialized: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>) => Buffer.from(serialized).toString('base64'))
      .join(','));
    newUrl.searchParams.set('callbackUrl', callbackUrl || currentUrl.href);
    if(meta) newUrl.searchParams.set('meta', meta);

    window.location.assign(newUrl.toString());
  }

  
}

export class PostConnectedWalletAccount extends ConnectedWalletAccount {
  constructor(walletConnection: PostWalletConnection, connection: Connection, accountId: string) {
    super(walletConnection, connection, accountId)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected signAndSendTransaction(...args: any[]): Promise<FinalExecutionOutcome> {
    if(typeof args[0] === 'string') {
      return this.__signAndSendTransaction({ receiverId: args[0], actions: args[1] });
    }

    return this.__signAndSendTransaction(args[0]);
  }

  async __signAndSendTransaction({ receiverId, actions, walletMeta, walletCallbackUrl = window.location.href }: SignAndSendTransactionOptions): Promise<FinalExecutionOutcome> {
    const localKey = await this.connection.signer.getPublicKey(this.accountId, this.connection.networkId);
    let accessKey = await this.accessKeyForTransaction(receiverId, actions, localKey);
    if (!accessKey) {
      throw new Error(`Cannot find matching key for transaction sent to ${receiverId}`);
    }

    if (localKey && localKey.toString() === accessKey.public_key) {
      try {
        return await super.signAndSendTransaction({ receiverId, actions });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e.type === 'NotEnoughBalance') {
          accessKey = await this.accessKeyForTransaction(receiverId, actions);
        } else {
          throw e;
        }
      }
    }

    const block = await this.connection.provider.block({ finality: 'final' });
    const blockHash = baseDecode(block.header.hash);

    const publicKey = PublicKey.from(accessKey.public_key);
    // TODO: Cache & listen for nonce updates for given access key
    const nonce = accessKey.access_key.nonce + 1;
    const transaction = createTransaction(this.accountId, publicKey, receiverId, nonce, actions, blockHash);
    await this.walletConnection.requestSignTransactions({
      transactions: [transaction],
      meta: walletMeta,
      callbackUrl: walletCallbackUrl
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Failed to redirect to sign transaction'));
      }, 1000);
    });

    // TODO: Aggregate multiple transaction request with "debounce".
    // TODO: Introduce TrasactionQueue which also can be used to watch for status?
  }
}
