import Web3 from 'web3'
import { getPrivateKeyByAccount } from './Roots'
import { GasUtil } from "./TxGasUtils";
import { TxJson } from './types';

const getGasPrice = async (rpcUrl: string) => {
    const gasUtil = new GasUtil(rpcUrl);
    const gasPrice = await gasUtil.getGasPrice();
    return gasPrice;
}

const getGasLimit = async (txParams: TxJson, rpcUrl: string) => {
    const gasUtil = new GasUtil(rpcUrl);
    const bufferedGasLimit = await gasUtil.getBufferedGasLimit(txParams, 1.5);
    return Number(bufferedGasLimit.gasLimit.toString());
}

const getSignedTx = async (txParams: TxJson, account: string, rpcUrl: string, keyStorePath: string, password: string) => {
    txParams.gasLimit = txParams.gasLimit ? txParams.gasLimit : (await getGasLimit(txParams, rpcUrl));
    txParams.gasPrice = txParams.gasPrice ? txParams.gasPrice : (await getGasPrice(rpcUrl));
    const privateKey = getPrivateKeyByAccount(account, keyStorePath, password)
    const web3 = new Web3(Web3.givenProvider || rpcUrl)
    const signedTx: any = await web3.eth.accounts.signTransaction(txParams, '0x' + privateKey.toString('hex'))
    return JSON.stringify(signedTx)
}

const sendSignedTx = async (rawTransaction: string, rpcUrl: string) => {
    const web3 = new Web3(Web3.givenProvider || rpcUrl)
    await web3.eth.sendSignedTransaction(rawTransaction)
}

const signAndSendTx = async (txParams: TxJson, rpcUrl: string, keyStorePath: string, password: string) => {
    if (!('from' in txParams)) {
        throw new Error('Need from address')
    }
    txParams.gasLimit = txParams.gasLimit ? txParams.gasLimit : (await getGasLimit(txParams, rpcUrl));
    txParams.gasPrice = txParams.gasPrice ? txParams.gasPrice : (await getGasPrice(rpcUrl));
    const privateKey = getPrivateKeyByAccount(txParams.from, keyStorePath, password)
    const web3 = new Web3(Web3.givenProvider || rpcUrl)
    const signedTx: any = await web3.eth.accounts.signTransaction(txParams, '0x' + privateKey.toString('hex'))
    await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    return signedTx.transactionHash
}

export { getSignedTx, sendSignedTx, signAndSendTx }
