"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptMnemonic = exports.encryptMnemonic = exports.getPrivateKeyByAccount = exports.getSubAccounts = exports.getPrivateKeyByKeystore = exports.getKeystoreByPrivateKey = exports.checkPassword = exports.updateAccounts = exports.getAccounts = exports.removeAccounts = exports.expandAccounts = exports.generateAccountByPrivateKey = exports.generateAccountByMnemonic = exports.list = void 0;
/* tslint:disable no-var-requires */
const keythereum = require('keythereum');
const CryptoJS = require('crypto-js');
const fs_1 = __importDefault(require("fs"));
const bip39 = __importStar(require("@metamask/bip39"));
const ethereumjs_wallet_1 = require("ethereumjs-wallet");
const web3_1 = __importDefault(require("web3"));
const hdPathString = `m/44'/60'/0'/0`;
const web3 = new web3_1.default(web3_1.default.givenProvider);
const checkFileExistence = (filePath) => {
    filePath = filePath.trim();
    let isExists = fs_1.default.existsSync(filePath);
    if (!isExists) {
        throw new Error('File not exists');
    }
};
const getAccounts = (keyStorePath) => {
    checkFileExistence(keyStorePath);
    const data = fs_1.default.readFileSync(keyStorePath).toString();
    return JSON.parse(data);
};
exports.getAccounts = getAccounts;
const getKeystoreByPrivateKey = (privateKey, password) => {
    const pwd = Buffer.from(password);
    const params = { keyBytes: 32, ivBytes: 16 };
    const dk = keythereum.create(params);
    const options = {
        cipher: 'aes-128-ctr',
    };
    const keystore = keythereum.dump(pwd, privateKey, dk.salt, dk.iv, options);
    return keystore;
};
exports.getKeystoreByPrivateKey = getKeystoreByPrivateKey;
const getPrivateKeyByKeystore = (keystore, password) => {
    const pwd = Buffer.from(password);
    const privateKey = keythereum.recover(pwd, keystore);
    return privateKey;
};
exports.getPrivateKeyByKeystore = getPrivateKeyByKeystore;
const encryptMnemonic = (mnemonic, password) => {
    const ciphertext = CryptoJS.AES.encrypt(mnemonic, password).toString();
    return ciphertext;
};
exports.encryptMnemonic = encryptMnemonic;
const decryptMnemonic = (ciphertext, password) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
};
exports.decryptMnemonic = decryptMnemonic;
const addAccount = (keyStorePath, accountObj) => {
    checkFileExistence(keyStorePath);
    const keystoreJsonString = fs_1.default.readFileSync(keyStorePath).toString();
    const data = JSON.parse(keystoreJsonString);
    data.push(accountObj);
    fs_1.default.writeFileSync(keyStorePath, JSON.stringify(data));
};
const addAccounts = (accountIndex, keystoreLst, keyStorePath) => {
    checkFileExistence(keyStorePath);
    const keystoreJsonString = fs_1.default.readFileSync(keyStorePath).toString();
    const data = JSON.parse(keystoreJsonString);
    for (const keystore of keystoreLst) {
        data[accountIndex].keystoreLst.push(keystore);
    }
    fs_1.default.writeFileSync(keyStorePath, JSON.stringify(data));
};
const updateAccounts = (accountsObj, keyStorePath) => {
    checkFileExistence(keyStorePath);
    fs_1.default.writeFileSync(keyStorePath, JSON.stringify(accountsObj));
};
exports.updateAccounts = updateAccounts;
const checkPassword = (password, keyStorePath) => {
    checkFileExistence(keyStorePath);
    try {
        const data = fs_1.default.readFileSync(keyStorePath);
        const firstAccount = JSON.parse(data.toString())[0];
        const keystore = firstAccount.keystoreLst[0];
        const pwd = Buffer.from(password);
        const privateKey = keythereum.recover(pwd, keystore);
        const address = keythereum.privateKeyToAddress(privateKey);
        return keystore.address === address.slice(2);
    }
    catch (err) {
        console.log(err.message);
        return false;
    }
};
exports.checkPassword = checkPassword;
const list = (keyStorePath) => {
    checkFileExistence(keyStorePath);
    const accounts = getAccounts(keyStorePath);
    const result = [];
    for (let i = 0; i < accounts.length; i++) {
        const types = accounts[i].mnemonic ? 'M' : 'PK';
        result.push({
            id: i,
            address: web3.utils.toChecksumAddress('0x' + accounts[i].keystoreLst[0].address),
            children: accounts[i].keystoreLst.length,
            type: types,
        });
    }
    return result;
};
exports.list = list;
const getSubAccounts = async (keyStorePath, account) => {
    checkFileExistence(keyStorePath);
    const accounts = getAccounts(keyStorePath);
    for (let i = 0; i < accounts.length; i++) {
        if ('0x' + accounts[i].keystoreLst[0].address === account.toLocaleLowerCase()) {
            const childrenList = [];
            for (const childrenAccount of accounts[i].keystoreLst) {
                childrenList.push(web3.utils.toChecksumAddress('0x' + childrenAccount.address));
            }
            return childrenList;
        }
    }
    return [];
};
exports.getSubAccounts = getSubAccounts;
const generateAccountByMnemonic = (mnemonic, password, keyStorePath) => {
    checkFileExistence(keyStorePath);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdWallet = ethereumjs_wallet_1.hdkey.fromMasterSeed(seed);
    const root = hdWallet.derivePath(hdPathString);
    const child = root.deriveChild(0);
    const wallet = child.getWallet();
    const keystore = getKeystoreByPrivateKey(wallet.getPrivateKey(), password);
    const eMnemonic = encryptMnemonic(mnemonic, password);
    const accountStorage = {
        mnemonic: eMnemonic,
        keystoreLst: [keystore],
    };
    addAccount(keyStorePath, accountStorage);
};
exports.generateAccountByMnemonic = generateAccountByMnemonic;
const generateAccountByPrivateKey = (privateKey, password, keyStorePath) => {
    checkFileExistence(keyStorePath);
    const keystore = getKeystoreByPrivateKey(Buffer.from(privateKey, 'hex'), password);
    const accountStorage = {
        mnemonic: false,
        keystoreLst: [keystore],
    };
    addAccount(keyStorePath, accountStorage);
};
exports.generateAccountByPrivateKey = generateAccountByPrivateKey;
const expandAccounts = (accountIndex, expandCount, password, keyStorePath) => {
    checkFileExistence(keyStorePath);
    const accounts = getAccounts(keyStorePath);
    if (!accounts[accountIndex].mnemonic) {
        throw new Error('Account type is not mnemonic');
    }
    const oldLen = accounts[accountIndex].keystoreLst.length;
    const mnemonic = decryptMnemonic(accounts[accountIndex].mnemonic, password);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdWallet = ethereumjs_wallet_1.hdkey.fromMasterSeed(seed);
    const root = hdWallet.derivePath(hdPathString);
    const keystoreLst = [];
    for (let i = oldLen; i < oldLen + expandCount; i++) {
        const child = root.deriveChild(i);
        const wallet = child.getWallet();
        const keystore = getKeystoreByPrivateKey(wallet.getPrivateKey(), password);
        keystoreLst.push(keystore);
    }
    addAccounts(accountIndex, keystoreLst, keyStorePath);
};
exports.expandAccounts = expandAccounts;
const removeAccounts = (accountIndex, keyStorePath) => {
    checkFileExistence(keyStorePath);
    const data = JSON.parse(fs_1.default.readFileSync(keyStorePath).toString());
    if (data.length <= accountIndex) {
        throw new Error('Invaild accountIndex');
    }
    data.splice(accountIndex, 1);
    fs_1.default.writeFileSync(keyStorePath, JSON.stringify(data));
};
exports.removeAccounts = removeAccounts;
const getPrivateKeyByAccount = (account, keyStorePath, password) => {
    checkFileExistence(keyStorePath);
    const accounts = getAccounts(keyStorePath);
    for (let i = 0; i < accounts.length; i++) {
        for (let j = 0; j < accounts[i].keystoreLst.length; j++) {
            if ('0x' + accounts[i].keystoreLst[j].address.toString() === account.toLocaleLowerCase()) {
                return getPrivateKeyByKeystore(accounts[i].keystoreLst[j], password);
            }
        }
    }
    return null;
};
exports.getPrivateKeyByAccount = getPrivateKeyByAccount;
//# sourceMappingURL=Roots.js.map