import { selectSomething, inputSomething, inputPassword, ChainType, confirmSomething, listWithLazyBalanceLoading } from './input'
import { removeAccounts, checkPassword, resetPassword, list, generateAccountByMnemonic, generateAccountByPrivateKey, expandAccounts, getSubAccounts, getPrivateKeyByAccount } from '../main'
import inquirer from 'inquirer'

const showChildrenAccounts = async (id: number, keystorePath: string, password: string, accounts: string[], chainType: ChainType) => {
    if (accounts.length === 0) {
        console.log('The Length of subAccounts is zero');
        return;
    }
    const childrenAccountlist: any = ['> Back', new inquirer.Separator(`----Sub accounts of root #${id}----`)];
    for (let i = 0; i < accounts.length; i++) {
        childrenAccountlist.push(`${i}) Account: ${accounts[i]}`);
        // childrenAccountlist.push(`${i}) Account: ${accounts[i]} , balanceOf: ${balanceOfList[i]}`);
    }
    const something = await listWithLazyBalanceLoading(childrenAccountlist, 'Select a account', chainType);
    if (something === childrenAccountlist[0]) {
        return;
    }
    const childrenAccount = accounts[childrenAccountlist.indexOf(something) - 2];
    const pk = getPrivateKeyByAccount(childrenAccount, keystorePath, password);
    console.log(`Account: ${childrenAccount}, pk: 0x${pk.toString('hex')}`);
    await showChildrenAccounts(id, keystorePath, password, accounts, chainType);
}

const showAccounts = async (keyStorePath: string, password: string, chainType: ChainType) => {
    const accountInfos = list(keyStorePath)
    if (accountInfos.length === 0) return
    const options: any = ['> Back', new inquirer.Separator(`----Network: ${chainType.name}----`)];
    const accountsRoot = [];
    for (const accountInfo of accountInfos) {
        accountsRoot.push(accountInfo.address);
        options.push(`#${accountInfo.id} ${accountInfo.address} children:${accountInfo.children} [${accountInfo.type}]`);
    }
    if (options.length === 2) {
        console.log('accounts is not exist');
        return;
    }
    const _accountRoot = await selectSomething(options);
    if (_accountRoot === options[0]) {
        return;
    }
    const _accountRootIndex = options.indexOf(_accountRoot) - 2;
    const accountRoot = accountsRoot[_accountRootIndex];
    const subAccounts = getSubAccounts(keyStorePath, accountRoot)
    const childrenAccountList = [];
    for (let i = 0; i < subAccounts.length; i++) {
        childrenAccountList.push(subAccounts[i]);
    }
    await showChildrenAccounts(_accountRootIndex, keyStorePath, password, childrenAccountList, chainType);
    await showAccounts(keyStorePath, password, chainType);
}

const importAccount = async (password: string, keyStorePath: string) => {
    let options = ['1. Mnemonics', '2. PK', '3. Back'];
    const manageType = await selectSomething(options)
    if (manageType === options[0]) {
        let mnemonic = await inputSomething('Please enter a mnemonic [split by space]')
        mnemonic = mnemonic.replace(/\s+/g, " ");
        generateAccountByMnemonic(mnemonic, password, keyStorePath)
    }
    if (manageType === options[1]) {
        const pk = await inputSomething('Please enter private key')
        generateAccountByPrivateKey(pk, password, keyStorePath)
    }
    if (manageType === options[2]) {
        return
    }
    await importAccount(password, keyStorePath)
}

const accountManage = async (password: string, keyStorePath: string, chainType: ChainType) => {
    let options = ['1. List', '2. Add', '3. Expand', '4. Remove', '5. Reset Password', '6. Back'];
    const manageType = await selectSomething(options)

    if (manageType === options[0]) {
        await showAccounts(keyStorePath, password, chainType)
    }

    if (manageType === options[1]) {
        await importAccount(password, keyStorePath)
    }

    if (manageType === options[2]) {
        const index = Number(await inputSomething('Input account #'))
        const count = Number(await inputSomething('Expand accounts count'))
        try {
            expandAccounts(index, count, password, keyStorePath)
        } catch (err: any) {
            console.log(err.message)
        }
    }

    if (manageType === options[3]) {
        const index = Number(await inputSomething('Remove account #'))
        try {
            removeAccounts(index, keyStorePath)
        } catch (err: any) {
            console.log(err.message)
        }
    }

    if (manageType === options[4]) {
        try {
            await _resetPassword(password, keyStorePath);
        } catch (err: any) {
            console.log(err.message)
        }
        return
    }

    if (manageType === options[5]) {
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

    const confirmRes = await confirmSomething('Confim');
    if (confirmRes) {
        await resetPassword(password, password01, keyStorePath)
    }
}

export { accountManage, _resetPassword }