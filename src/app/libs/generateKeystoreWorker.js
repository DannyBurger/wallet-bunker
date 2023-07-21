const keythereum = require('keythereum');
const { parentPort, workerData } = require('worker_threads');
const { hdkey } = require('ethereumjs-wallet');

let keystores = [];
const hdPathString = `m/44'/60'/0'/0`

const getKeystoreByPrivateKey = (privateKey, password) => {
    const pwd = Buffer.from(password)
    const params = { keyBytes: 32, ivBytes: 16 }
    const dk = keythereum.create(params)
    const options = {
        cipher: 'aes-128-ctr',
    }
    const keystore = keythereum.dump(pwd, privateKey, dk.salt, dk.iv, options)
    return keystore
}

const getKeystoreByPrivateKeys = (seed, fromIndex, toIndex, password) => {
    const hdWallet = hdkey.fromMasterSeed(seed)
    const root = hdWallet.derivePath(hdPathString)
    for (let i = fromIndex; i < toIndex; i++) {
        const child = root.deriveChild(i);
        const wallet = child.getWallet();
        let keystore = getKeystoreByPrivateKey(wallet.getPrivateKey(), password);
        keystores.push({
            index: i,
            keystore: keystore
        });
    }
}

getKeystoreByPrivateKeys(workerData.seed, workerData.fromIndex, workerData.toIndex, workerData.password);
parentPort.postMessage(keystores);