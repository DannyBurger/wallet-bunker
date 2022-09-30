import { getAccounts, getKeystoreByPrivateKey, getPrivateKeyByKeystore, updateAccounts, encryptMnemonic, decryptMnemonic } from './Roots'

const resetPassword = async (oldPassword: string, newPassword: string, keyStorePath: string) => {
    const accounts = getAccounts(keyStorePath)
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < accounts.length; i++) {
        if (accounts[i].mnemonic) {
            let seed = decryptMnemonic(accounts[i].mnemonic, oldPassword);
            accounts[i].mnemonic = encryptMnemonic(seed, newPassword);
        }

        for (let j = 0; j < accounts[i].keystoreLst.length; j++) {
            const pv = getPrivateKeyByKeystore(accounts[i].keystoreLst[j], oldPassword)
            accounts[i].keystoreLst[j] = getKeystoreByPrivateKey(pv, newPassword)
        }
    }
    updateAccounts(accounts, keyStorePath)
}

export { resetPassword }
