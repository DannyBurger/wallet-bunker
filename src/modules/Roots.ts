/* tslint:disable no-var-requires */
const keythereum = require('keythereum')
const CryptoJS = require('crypto-js')
const {
    generateKeystore
} = require('../app/libs/generateKeystore');
import fs from 'fs'
import * as bip39 from '@metamask/bip39'
import { hdkey } from 'ethereumjs-wallet'
import Web3 from 'web3'

const hdPathString = `m/44'/60'/0'/0`
const web3 = new Web3(Web3.givenProvider)

const checkFileExistence = (filePath: string) => {
    filePath = filePath.trim()
    let isExists = fs.existsSync(filePath)
    if (!isExists) {
        throw new Error('File not exists')
    }
}

const getAccounts = (keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    const data = fs.readFileSync(keyStorePath).toString()
    return JSON.parse(data)
}

const getKeystoreByPrivateKey = (privateKey: Buffer, password: string) => {
    const pwd = Buffer.from(password)
    const params = { keyBytes: 32, ivBytes: 16 }
    const dk = keythereum.create(params)
    const options = {
        cipher: 'aes-128-ctr',
    }
    const keystore = keythereum.dump(pwd, privateKey, dk.salt, dk.iv, options)
    return keystore
}

const getPrivateKeyByKeystore = (keystore: any, password: string) => {
    const pwd = Buffer.from(password)
    const privateKey = keythereum.recover(pwd, keystore)
    return privateKey
}

const encryptMnemonic = (mnemonic: string, password: string) => {
    const ciphertext = CryptoJS.AES.encrypt(mnemonic, password).toString()
    return ciphertext
}

const decryptMnemonic = (ciphertext: string, password: string) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password)
    const originalText = bytes.toString(CryptoJS.enc.Utf8)
    return originalText
}

const addAccount = (keyStorePath: string, accountObj: any) => {
    checkFileExistence(keyStorePath)
    const keystoreJsonString = fs.readFileSync(keyStorePath).toString();
    const data = JSON.parse(keystoreJsonString);

    let account1 = accountObj.keystoreLst[0].address;
    for (let i = 0; i < data.length; i++) {
        let account0 = data[i].keystoreLst[0].address;
        if (account0 === account1) {
            console.log(`Account: ${account0}, is exist`);
            return
        }
    }

    data.push(accountObj)
    fs.writeFileSync(keyStorePath, JSON.stringify(data))
}

const addAccounts = (accountIndex: number, keystoreLst: any, keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    const keystoreJsonString = fs.readFileSync(keyStorePath).toString();
    const data = JSON.parse(keystoreJsonString);
    for (const keystore of keystoreLst) {
        data[accountIndex].keystoreLst.push(keystore)
    }
    fs.writeFileSync(keyStorePath, JSON.stringify(data))
}

const updateAccounts = (accountsObj: any, keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    fs.writeFileSync(keyStorePath, JSON.stringify(accountsObj))
}

const checkPassword = (password: string, keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    try {
        const data = fs.readFileSync(keyStorePath)
        const accounts = JSON.parse(data.toString());
        if (accounts.length === 0) {
            return true;
        }
        const firstAccount = accounts[0]
        const keystore = firstAccount.keystoreLst[0]
        const pwd = Buffer.from(password)
        const privateKey = keythereum.recover(pwd, keystore)
        const address = keythereum.privateKeyToAddress(privateKey)
        return keystore.address === address.slice(2)
    } catch (err: any) {
        console.log(err.message)
        return false
    }
}

const list = (keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    const accounts = getAccounts(keyStorePath)
    const result = []
    for (let i = 0; i < accounts.length; i++) {
        const types = accounts[i].mnemonic ? 'M' : 'PK'
        result.push({
            id: i,
            address: web3.utils.toChecksumAddress('0x' + accounts[i].keystoreLst[0].address),
            children: accounts[i].keystoreLst.length,
            type: types,
        })
    }
    return result
}

const getSubAccounts = (keyStorePath: string, account: string, startIndex?: number, endIndex?: number) => {
    checkFileExistence(keyStorePath)
    const accounts = getAccounts(keyStorePath)
    for (let i = 0; i < accounts.length; i++) {
        if ('0x' + accounts[i].keystoreLst[0].address === account.toLocaleLowerCase()) {
            const childrenList = []
            const totalSize = accounts[i].keystoreLst.length;
            endIndex = endIndex && endIndex <= totalSize - 1 ? endIndex : totalSize - 1;
            startIndex = startIndex && startIndex < endIndex ? startIndex : 0;
            for (let j = startIndex; j <= endIndex; j++) {
                childrenList.push(web3.utils.toChecksumAddress('0x' + accounts[i].keystoreLst[j].address))
            }
            return childrenList
        }
    }
    return []
}

const generateAccountByMnemonic = (mnemonic: string, password: string, keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const hdWallet = hdkey.fromMasterSeed(seed)
    const root = hdWallet.derivePath(hdPathString)
    const child = root.deriveChild(0)
    const wallet = child.getWallet()
    const keystore = getKeystoreByPrivateKey(wallet.getPrivateKey(), password)
    const eMnemonic = encryptMnemonic(mnemonic, password)
    const accountStorage = {
        mnemonic: eMnemonic,
        keystoreLst: [keystore],
    }
    addAccount(keyStorePath, accountStorage)
}

const generateAccountByPrivateKey = (privateKey: string, password: string, keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    const keystore = getKeystoreByPrivateKey(Buffer.from(privateKey, 'hex'), password)
    const accountStorage = {
        mnemonic: false,
        keystoreLst: [keystore],
    }
    addAccount(keyStorePath, accountStorage)
}

const expandAccounts = async (accountIndex: number, expandCount: number, password: string, keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    const accounts = getAccounts(keyStorePath)
    if (!accounts[accountIndex].mnemonic) {
        throw new Error('Account type is not mnemonic')
    }
    const oldLen = accounts[accountIndex].keystoreLst.length
    const mnemonic = decryptMnemonic(accounts[accountIndex].mnemonic, password)
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const keystoreLst = await generateKeystore(seed, oldLen, expandCount, password);
    addAccounts(accountIndex, keystoreLst, keyStorePath)
}

const removeAccounts = (accountIndex: number, keyStorePath: string) => {
    checkFileExistence(keyStorePath)
    const data = JSON.parse(fs.readFileSync(keyStorePath).toString())
    if (data.length <= accountIndex) {
        throw new Error('Invaild accountIndex')
    }
    data.splice(accountIndex, 1);
    fs.writeFileSync(keyStorePath, JSON.stringify(data))
}

const getPrivateKeyByAccount = (account: string, keyStorePath: string, password: string) => {
    checkFileExistence(keyStorePath)
    const accounts = getAccounts(keyStorePath)
    for (let i = 0; i < accounts.length; i++) {
        for (let j = 0; j < accounts[i].keystoreLst.length; j++) {
            if ('0x' + accounts[i].keystoreLst[j].address.toString() === account.toLocaleLowerCase()) {
                return getPrivateKeyByKeystore(accounts[i].keystoreLst[j], password)
            }
        }
    }
    return null
}

export {
    list,
    generateAccountByMnemonic,
    generateAccountByPrivateKey,
    expandAccounts,
    removeAccounts,
    getAccounts,
    updateAccounts,
    checkPassword,
    getKeystoreByPrivateKey,
    getPrivateKeyByKeystore,
    getSubAccounts,
    getPrivateKeyByAccount,
    encryptMnemonic,
    decryptMnemonic
}
