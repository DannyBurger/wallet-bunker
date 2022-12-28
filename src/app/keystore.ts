import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer'
import { checkPassword } from '../main'
import { selectSomething, inputPassword, inputSomething, ChainType } from './input'
import { accountManage, _resetPassword } from './account-manager'
import { getDefaultNetWork } from './network';

const getPasswordWithKeystoreId = async (keystoreId: string, keyStorePathWithId: string) => {
    for (let i = 0; i < 10; i++) {
        const keystorePassword = await inputPassword(`Please enter password [KeystoreId: ${keystoreId}]`)
        const isOk = checkPassword(keystorePassword, keyStorePathWithId);
        if (isOk) {
            return keystorePassword;
        }
        console.log("Wrong password, Try Again");
    }
    throw new Error("Too many attempts");
}

const checkKeystoreDir = (keystorePath: string, keystoreId: string) => {
    const keystoreDir = path.resolve(keystorePath, keystoreId);
    const isKeystoreDir = fs.statSync(keystoreDir).isDirectory();
    if (!isKeystoreDir) {
        return false;
    }

    const walletPath = path.resolve(keystoreDir, 'wallet.json');
    return fs.existsSync(walletPath);
}

const selectKeyStore = async (keystorePath: string) => {
    const keystoreIds = fs.readdirSync(keystorePath);

    const keystoreMessageList: any = ['> Back', new inquirer.Separator(`----Keystore List----`)];
    let keystoreSize = 0;
    const selectKeyStoreIdList = [];
    for (let i = 0; i < keystoreIds.length; i++) {
        if (checkKeystoreDir(keystorePath, keystoreIds[i])) {
            selectKeyStoreIdList.push(keystoreIds[i]);
            keystoreMessageList.push(`${++keystoreSize}) ${keystoreIds[i]}`);
        }
    }

    if (keystoreMessageList.length === 2) {
        return;
    }

    let selectedKeystoreMessage = await selectSomething(keystoreMessageList);

    if (selectedKeystoreMessage === keystoreMessageList[0]) {
        return;
    }

    let selectedKeystoreId: any;
    for (let i = 0; i < keystoreMessageList.length; i++) {
        if (keystoreMessageList[i] === selectedKeystoreMessage) {
            selectedKeystoreId = selectKeyStoreIdList[i - 2];
        }
    }

    const keyStorePathWithId = path.resolve(keystorePath, `${selectedKeystoreId}/wallet.json`);
    const selectedKeystorePassword = await getPasswordWithKeystoreId(selectedKeystoreId, keyStorePathWithId);

    const defaultNetWork = await getDefaultNetWork(keystorePath);
    const chainType: ChainType = {
        name: defaultNetWork.NAME,
        chainId: defaultNetWork.ID,
        rpcUrl: defaultNetWork.RPC,
        multicallAddress: defaultNetWork.MulticallAddress
    }
    await accountManage(selectedKeystorePassword, keyStorePathWithId, chainType);

    await selectKeyStore(keystorePath);
}

const createKeystorePath = async (keystorePath: string) => {
    const newKeystoreId = await inputSomething('Enter new keystore id')
    const appPath = path.resolve(keystorePath, newKeystoreId);
    const exist = fs.existsSync(appPath);
    if (exist) {
        console.log(`KeystoreId: ${newKeystoreId}, is exist`);
        return;
    }
    fs.mkdirSync(appPath);
    const walletPath = `${appPath}/wallet.json`;
    fs.writeFileSync(walletPath, JSON.stringify([]));
}


const keystoresManager = async (keystorePath: string) => {
    const keystortOplist = ['> Select a KeyStore ', '> Create a new Keystore', '> Back'];
    const something = await selectSomething(keystortOplist);

    if (something === keystortOplist[0]) {
        await selectKeyStore(keystorePath);
    }

    if (something === keystortOplist[1]) {
        await createKeystorePath(keystorePath);
    }

    if (something === keystortOplist[2]) {
        return;
    }

    await keystoresManager(keystorePath);
}

export {
    keystoresManager,
    getPasswordWithKeystoreId,
    checkKeystoreDir
}