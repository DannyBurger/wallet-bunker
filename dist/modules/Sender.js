"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAndSendTx = exports.sendSignedTx = exports.getSignedTx = void 0;
const web3_1 = __importDefault(require("web3"));
const Roots_1 = require("./Roots");
const TxGasUtils_1 = require("./TxGasUtils");
const getGasPrice = async (rpcUrl) => {
    const gasUtil = new TxGasUtils_1.GasUtil(rpcUrl);
    const gasPrice = await gasUtil.getGasPrice();
    return gasPrice;
};
const getGasLimit = async (txParams, rpcUrl) => {
    const gasUtil = new TxGasUtils_1.GasUtil(rpcUrl);
    const bufferedGasLimit = await gasUtil.getBufferedGasLimit(txParams, 1.3);
    return Number(bufferedGasLimit.gasLimit.toString());
};
const getSignedTx = async (txParams, account, rpcUrl, keyStorePath, password) => {
    txParams.gasLimit = txParams.gasLimit ? txParams.gasLimit : (await getGasLimit(txParams, rpcUrl));
    txParams.gasPrice = txParams.gasPrice ? txParams.gasPrice : (await getGasPrice(rpcUrl));
    const privateKey = (0, Roots_1.getPrivateKeyByAccount)(account, keyStorePath, password);
    const web3 = new web3_1.default(web3_1.default.givenProvider || rpcUrl);
    const signedTx = await web3.eth.accounts.signTransaction(txParams, '0x' + privateKey.toString('hex'));
    return JSON.stringify(signedTx);
};
exports.getSignedTx = getSignedTx;
const sendSignedTx = async (rawTransaction, rpcUrl) => {
    const web3 = new web3_1.default(web3_1.default.givenProvider || rpcUrl);
    await web3.eth.sendSignedTransaction(rawTransaction);
};
exports.sendSignedTx = sendSignedTx;
const signAndSendTx = async (txParams, rpcUrl, keyStorePath, password) => {
    txParams.gasLimit = txParams.gasLimit ? txParams.gasLimit : (await getGasLimit(txParams, rpcUrl));
    txParams.gasPrice = txParams.gasPrice ? txParams.gasPrice : (await getGasPrice(rpcUrl));
    const privateKey = (0, Roots_1.getPrivateKeyByAccount)(txParams.from, keyStorePath, password);
    const web3 = new web3_1.default(web3_1.default.givenProvider || rpcUrl);
    const signedTx = await web3.eth.accounts.signTransaction(txParams, '0x' + privateKey.toString('hex'));
    await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return signedTx.transactionHash;
};
exports.signAndSendTx = signAndSendTx;
//# sourceMappingURL=Sender.js.map