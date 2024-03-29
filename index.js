const fs = require('fs');
const {
    list,
    getSubAccounts,
    getPrivateKeyByAccount,
    generateAccountByMnemonic,
    generateAccountByPrivateKey,
    expandAccounts,
    removeAccounts,
    checkPassword,
    getSignedTx,
    sendSignedTx,
    signAndSendTx
} = require('./dist/main');

class WalletBunker {
    constructor(rpcUrl) {
        this.rpcUrl = rpcUrl
    }

    unlock(appId, keystorePath, password) {
        appId = appId.trim();
        const appPath = `${keystorePath}/${appId}`
        let exist = fs.existsSync(appPath)
        if (!exist) {
            fs.mkdirSync(appPath)
        }
        this.walletPath = `${keystorePath}/${appId}/wallet.json`
        exist = fs.existsSync(this.walletPath)
        if (!exist) {
            fs.writeFileSync(this.walletPath, JSON.stringify([]))
        }
        this.password = password
    }

    list() {
        return list(this.walletPath)
    }

    getSubAccounts(account, startIndex, endIndex) {
        let subAccounts = getSubAccounts(this.walletPath, account, startIndex, endIndex)
        return subAccounts
    }

    getPrivateKeyByAccount(account) {
        let privateKey = getPrivateKeyByAccount(account, this.walletPath, this.password)
        return privateKey
    }

    generateAccountByMnemonic(mnemonic) {
        generateAccountByMnemonic(mnemonic, this.password, this.walletPath)
    }

    generateAccountByPrivateKey(privateKey) {
        generateAccountByPrivateKey(privateKey, this.password, this.walletPath)
    }

    expandAccounts(accountIndex, expandCount) {
        expandAccounts(accountIndex, expandCount, this.password, this.walletPath)
    }

    removeAccounts(accountIndex) {
        removeAccounts(accountIndex, this.walletPath)
    }

    checkPassword() {
        checkPassword(this.password, this.walletPath)
    }

    async getSignedTx(txParams, account) {
        const signedTx = await getSignedTx(txParams, account, this.rpcUrl, this.walletPath, this.password)
        return signedTx
    }

    async sendSignedTx(signedTxRaw) {
        await sendSignedTx(signedTxRaw, this.rpcUrl)
    }

    async signAndSendTx(txParams) {
        const transactionHash = await signAndSendTx(txParams, this.rpcUrl, this.walletPath, this.password)
        return transactionHash
    }
}

module.exports = WalletBunker
