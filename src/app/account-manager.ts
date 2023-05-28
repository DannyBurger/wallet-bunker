import { selectSomething, inputSomething, inputPassword, ChainType, confirmSomething, listWithLazyBalanceLoading, setChangedAccount } from './input'
import { updateAccountBalanceOf } from './Web3';
import { updateAccountTag, getAccountsTag } from './keystore';
import { removeAccounts, checkPassword, resetPassword, list, generateAccountByMnemonic, generateAccountByPrivateKey, expandAccounts, getSubAccounts, getPrivateKeyByAccount, } from '../main'
import { getAllNetWork, getDefaultNetWork } from './network';
import inquirer from 'inquirer'
import path from 'path';
import fs from 'fs';

var defaultAccount: any = null;

const showAccountDetailInfo = async (account: string, chainType: ChainType, keystorePath: string, password: string) => {
    const optionList = ['> Add Tag', '> Show Private Key', '> Refresh Balance', '> Back'];
    const something = await selectSomething(optionList);
    if (something === optionList[0]) {
        let tag: any = await inputSomething('Input account tag')
        updateAccountTag(keystorePath, account, tag);
        await setChangedAccount(account);
    }
    if (something === optionList[1]) {
        const pk = getPrivateKeyByAccount(account, keystorePath, password);
        console.log(`Account: ${account}, pk: 0x${pk.toString('hex')}`);
    }
    if (something === optionList[2]) {
        await updateAccountBalanceOf(account, chainType);
        await setChangedAccount(account);
        return
    }
    if (something === optionList[3]) {
        return
    }
    await showAccountDetailInfo(account, chainType, keystorePath, password);
}

const showChildrenAccounts = async (id: number, keystorePath: string, password: string, accounts: string[], chainType: ChainType) => {
    if (accounts.length === 0) {
        console.log('The Length of subAccounts is zero');
        return;
    }
    const childrenAccountlist: any = ['> Back', new inquirer.Separator(`----Sub accounts of root #${id}----`)];
    let accountTagList = getAccountsTag(keystorePath, accounts);
    for (let i = 0; i < accounts.length; i++) {
        if (accountTagList[i]) {
            childrenAccountlist.push(`${i}) Account: ${accounts[i]}, tag: ${accountTagList[i]}`);
        } else {
            childrenAccountlist.push(`${i}) Account: ${accounts[i]}`);
        }
        if (i === Number(defaultAccount)) {
            defaultAccount = childrenAccountlist[i + 2];
        }
    }
    const _defaultAccount = defaultAccount ? defaultAccount : childrenAccountlist[0];
    const something = await listWithLazyBalanceLoading(childrenAccountlist, keystorePath, 'Select a account', chainType, _defaultAccount);
    if (something === childrenAccountlist[0]) {
        return;
    }
    defaultAccount = something.split(')')[0];
    const childrenAccount = accounts[childrenAccountlist.indexOf(something) - 2];
    await showAccountDetailInfo(childrenAccount, chainType, keystorePath, password);
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

const _switchNetwork = async (keyStorePath: string) => {
    const keystoreBasePath = path.dirname(keyStorePath);
    const keystoreParseInfo = path.parse(keystoreBasePath);
    const keystoreDirPath = keystoreParseInfo.dir;
    const allNetWork = await getAllNetWork(keystoreDirPath);
    let networkList = ['Same as system', new inquirer.Separator(`--------------------------`)];
    let defaultOption = networkList[0];
    let keystoreConfPath = path.resolve(keystoreBasePath, 'configs.json');
    const isExistKeystoreConf = fs.existsSync(keystoreConfPath);
    let chainId = null;
    if (isExistKeystoreConf) {
        const keystoreConfRaw = fs.readFileSync(keystoreConfPath);
        chainId = (JSON.parse(keystoreConfRaw.toString())).currenChain;
    }

    for (let i = 0; i < allNetWork.length; i++) {
        if (chainId === allNetWork[i].id) {
            defaultOption = `${i + 1}. ${allNetWork[i].name}[id:${allNetWork[i].id}]`;
        }
        networkList.push(`${i + 1}. ${allNetWork[i].name}[id:${allNetWork[i].id}]`)
    }

    const something = await selectSomething(networkList, undefined, defaultOption);
    let defaultResult: any = {};
    let selectedIndex = networkList.indexOf(something);
    if (selectedIndex > 1) {
        defaultResult["currenChain"] = allNetWork[selectedIndex - 2].id;
    }

    fs.writeFileSync(keystoreConfPath, JSON.stringify(defaultResult, null, 4));
}

const accountManage = async (password: string, keyStorePath: string, chainType: ChainType) => {
    
    let options = ['1. List', '2. Add', '3. Expand', '4. Remove', '5. Reset Password', `6. Switch Network [${chainType.name} id:${chainType.chainId}]`, '7. Back'];
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
        try {
            await _switchNetwork(keyStorePath);
            const keystoreParseInfo = path.parse(path.dirname(keyStorePath));
            const defaultNetWork = await getDefaultNetWork(keystoreParseInfo.dir, keystoreParseInfo.name);
            chainType = {
                name: defaultNetWork.name,
                chainId: defaultNetWork.id,
                rpcUrl: defaultNetWork.rpcUrl,
                multicallAddress: defaultNetWork.multicallAddress
            }
        } catch (err: any) {
            console.log(err.message)
        }
    }

    if (manageType === options[6]) {
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