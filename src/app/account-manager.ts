import { getBatchBalanceOf } from './Web3'
import { selectSomething, inputSomething, inputPassword, selectAccount, ChainType } from './input'
import { removeAccounts, checkPassword, resetPassword, list, generateAccountByMnemonic, generateAccountByPrivateKey, expandAccounts, getSubAccounts, getPrivateKeyByAccount } from '../main'

const showChildrenAccounts = async (keystorePath: string, password: string, accounts: string[], balanceOfList: string[]) => {
    const childrenAccountlist = ['> Back ']
    for (let i = 0; i < accounts.length; i++) {
        childrenAccountlist.push(`Account: ${accounts[i]} , balanceOf: ${balanceOfList[i]}`);
    }
    const childrenAccount = await selectAccount(childrenAccountlist);
    if (childrenAccount === 'Back') {
        return;
    }
    const pk = getPrivateKeyByAccount(childrenAccount, keystorePath, password);
    console.log(`Account: ${childrenAccount}, pk: 0x${pk.toString('hex')}`);
    await showChildrenAccounts(keystorePath, password, accounts, balanceOfList);
}

const showAccounts = async (keyStorePath: string, password: string, chainType: ChainType) => {
    const accountInfos = list(keyStorePath)
    if (accountInfos.length === 0) return
    const accountlist = []
    for (const accountInfo of accountInfos) {
        accountlist.push(`#${accountInfo.id} ${accountInfo.address} children:${accountInfo.children} ${accountInfo.type}`)
    }
    let backText = `#${accountInfos[accountInfos.length - 1].id + 1} Back`
    accountlist.push(backText)
    let accountRoot = await selectAccount(accountlist);
    if (accountRoot === 'Back') {
        return
    }
    const subAccounts = await getSubAccounts(keyStorePath, accountRoot)
    const batchBalanceOf = await getBatchBalanceOf(subAccounts, chainType)
    const childrenAccountList = [];
    const balanceOfList = [];
    for (let i = 0; i < subAccounts.length; i++) {
        childrenAccountList.push(subAccounts[i]);
        balanceOfList.push((Number(batchBalanceOf[i].toString()) / 10 ** 18).toFixed(6));
    }
    await showChildrenAccounts(keyStorePath, password, childrenAccountList, balanceOfList);
    await showAccounts(keyStorePath, password, chainType);
}

const importAccount = async (password: string, keyStorePath: string) => {
    const manageType = await selectSomething(['1. Mnemonics', '2. PK', '3. Back'])
    if (manageType === '1') {
        const mnemonic = await inputSomething('Please enter a mnemonic [split by space]')
        generateAccountByMnemonic(mnemonic, password, keyStorePath)
    }
    if (manageType === '2') {
        const pk = await inputSomething('Please enter private key')
        generateAccountByPrivateKey(pk, password, keyStorePath)
    }
    if (manageType === '3') {
        return
    }
    await importAccount(password, keyStorePath)
}

const accountManage = async (password: string, keyStorePath: string, chainType: ChainType) => {
    const manageType = await selectSomething(['1. List', '2. Add', '3. Expand', '4. Remove', '5. Back'])

    if (manageType === '1') {
        await showAccounts(keyStorePath, password, chainType)
    }

    if (manageType === '2') {
        await importAccount(password, keyStorePath)
    }

    if (manageType === '3') {
        const index = Number(await inputSomething('Input account #'))
        const count = Number(await inputSomething('Expand accounts count'))
        try {
            expandAccounts(index, count, password, keyStorePath)
        } catch (err: any) {
            console.log(err.message)
        }
    }

    if (manageType === '4') {
        const index = Number(await inputSomething('Remove account #'))
        try {
            removeAccounts(index, keyStorePath)
        } catch (err: any) {
            console.log(err.message)
        }
    }

    if (manageType === '5') {
        return
    }

    await accountManage(password, keyStorePath, chainType)
}

const _resetPassword = async (password: string, keyStorePath: string) => {
    const isOk = checkPassword(password, keyStorePath)
    if (!isOk) return
    const password01 = await inputPassword('Please enter password')
    const password02 = await inputPassword('Please confirm your password')
    if (password01 !== password02) {
        console.log('Password confirm failed, please re-enter')
        await _resetPassword(password, keyStorePath)
    }
    const toChange = await inputSomething('Confirm [Y/N]')
    if (toChange === 'Y' || toChange === 'y') {
        await resetPassword(password, password01, keyStorePath)
    }
}

export { accountManage, _resetPassword }