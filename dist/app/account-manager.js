'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports._resetPassword = exports.accountManage = void 0
const Web3_1 = require('./Web3')
const input_1 = require('./input')
const main_1 = require('../main')

const showChildrenAccounts = async (keystorePath, password, accounts, balanceOfList) => {
    const childrenAccountlist = ['> Back ']
    for (let i = 0; i < accounts.length; i++) {
        childrenAccountlist.push(`Account: ${accounts[i]} , Ether balance: ${balanceOfList[i]}`)
    }
    const childrenAccount = await (0, input_1.selectAccount)(childrenAccountlist)
    if (childrenAccount === 'Back') {
        return
    }
    const pk = (0, main_1.getPrivateKeyByAccount)(childrenAccount, keystorePath, password)
    console.log(`Account: ${childrenAccount}, privateKey: 0x${pk.toString('hex')}`)
    await showChildrenAccounts(keystorePath, password, accounts, balanceOfList)
}
const showAccounts = async (keyStorePath, password, chainType) => {
    const accountInfos = (0, main_1.list)(keyStorePath)
    if (accountInfos.length === 0) return
    const accountlist = []
    for (const accountInfo of accountInfos) {
        accountlist.push(`#${accountInfo.id} ${accountInfo.address} children:${accountInfo.children} ${accountInfo.type}`)
    }
    let backText = `#${accountInfos[accountInfos.length - 1].id + 1} Back`
    accountlist.push(backText)
    let accountRoot = await (0, input_1.selectAccount)(accountlist)
    if (accountRoot === 'Back') {
        return
    }
    const subAccounts = await (0, main_1.getSubAccounts)(keyStorePath, accountRoot)
    const batchBalanceOf = await (0, Web3_1.getBatchBalanceOf)(subAccounts, chainType)
    const childrenAccountList = []
    const balanceOfList = []
    for (let i = 0; i < subAccounts.length; i++) {
        childrenAccountList.push(subAccounts[i])
        balanceOfList.push((Number(batchBalanceOf[i].toString()) / 10 ** 18).toFixed(6))
    }
    await showChildrenAccounts(keyStorePath, password, childrenAccountList, balanceOfList)
    await showAccounts(keyStorePath, password, chainType)
}
const importAccount = async (password, keyStorePath) => {
    const manageType = await (0, input_1.selectSomething)(['1. Mnemonics', '2. PK', '3. Back'])
    if (manageType === '1') {
        const mnemonic = await (0, input_1.inputSomething)('Please enter a mnemonic [split by space]')
        ;(0, main_1.generateAccountByMnemonic)(mnemonic, password, keyStorePath)
    }
    if (manageType === '2') {
        const pk = await (0, input_1.inputSomething)('Please enter private key')
        ;(0, main_1.generateAccountByPrivateKey)(pk, password, keyStorePath)
    }
    if (manageType === '3') {
        return
    }
    await importAccount(password, keyStorePath)
}
const accountManage = async (password, keyStorePath, chainType) => {
    const manageType = await (0, input_1.selectSomething)(['1. List', '2. Add', '3. Expand', '4. Remove', '5. Back'])
    if (manageType === '1') {
        await showAccounts(keyStorePath, password, chainType)
    }
    if (manageType === '2') {
        await importAccount(password, keyStorePath)
    }
    if (manageType === '3') {
        const index = Number(await (0, input_1.inputSomething)('Input account #'))
        const count = Number(await (0, input_1.inputSomething)('Expand accounts count'))
        try {
            ;(0, main_1.expandAccounts)(index, count, password, keyStorePath)
        } catch (err) {
            console.log(err.message)
        }
    }
    if (manageType === '4') {
        const index = Number(await (0, input_1.inputSomething)('Remove account #'))
        try {
            ;(0, main_1.removeAccounts)(index, keyStorePath)
        } catch (err) {
            console.log(err.message)
        }
    }
    if (manageType === '5') {
        return
    }
    await accountManage(password, keyStorePath, chainType)
}
exports.accountManage = accountManage
const _resetPassword = async (password, keyStorePath) => {
    const isOk = (0, main_1.checkPassword)(password, keyStorePath)
    if (!isOk) return
    const password01 = await (0, input_1.inputPassword)('Please enter password')
    const password02 = await (0, input_1.inputPassword)('Please confirm your password')
    if (password01 !== password02) {
        console.log('Password confirm failed, please re-enter')
        await _resetPassword(password, keyStorePath)
    }
    const toChange = await (0, input_1.inputSomething)('Confirm [Y/N]')
    if (toChange === 'Y' || toChange === 'y') {
        await (0, main_1.resetPassword)(password, password01, keyStorePath)
    }
}
exports._resetPassword = _resetPassword
//# sourceMappingURL=account-manager.js.map
