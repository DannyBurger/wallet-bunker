import fs from 'fs';
import path from 'path';
import { BigNumber } from 'bignumber.js';
import { list, getSubAccounts, signAndSendTx, getSignedTx, sendSignedTx, getPrivateKeyByAccount } from '../main'
import { getDefaultNetWork } from './network';
import { selectSomething, inputSomething, ChainType, confirmSomething, editorSomething, getDataPath } from './input'
import { getBatchBalanceOf, getAddressByChecksum, signMessage } from './Web3';
import { getPasswordWithKeystoreId, checkKeystoreDir } from './keystore';
import { GasUtil } from '../modules/TxGasUtils';

const getAllKeystoreInfo = async (keystorePath: string) => {
    const keystoreIds = fs.readdirSync(keystorePath);
    const keyStoreIdList = [];
    for (let i = 0; i < keystoreIds.length; i++) {
        if (checkKeystoreDir(keystorePath, keystoreIds[i])) {
            keyStoreIdList.push(keystoreIds[i]);
        }
    }

    let keyStoreIdAccountsMap: any = {};
    for (let i = 0; i < keyStoreIdList.length; i++) {
        const keyStorePathWithId = path.resolve(keystorePath, `${keyStoreIdList[i]}/wallet.json`);
        const accounts = list(keyStorePathWithId);
        let subAccounts = [];
        for (let j = 0; j < accounts.length; j++) {
            if (accounts[j].type === 'PK') {
                subAccounts.push([accounts[j].address]);
            }
            if (accounts[j].type === 'M') {
                let _subAccounts = getSubAccounts(keyStorePathWithId, accounts[j].address);
                subAccounts.push(_subAccounts);
            }
        }
        keyStoreIdAccountsMap[keyStoreIdList[i]] = {
            accounts: accounts,
            subAccounts: subAccounts
        };
    }
    return keyStoreIdAccountsMap;
}

const getAddressByInputText = async (message: string) => {
    for (let i = 0; i < 5; i++) {
        message = message.trim()
        const address = await inputSomething(message);
        if (address && address.length === 42) {
            return address;
        }
        console.log(`address [${address}] is Invalid`)
    }
    console.log('Too many attempts, exit');
    return null;
}

const getValueParams = async (message: string) => {
    var numReg = /\d*/;
    for (let i = 0; i < 5; i++) {
        let val = await inputSomething(message);
        val = val.trim();
        const valRes: any = numReg.exec(val);
        if (valRes[0] === val) {
            if (!val) {
                return '0';
            }
            return val;
        }

        console.log(`${message}: ${val} is Invalid`)
    }
    console.log('Too many attempts, exit');
    return null;
}

const getInputDataText = async (message: string) => {
    const dataReg = /(0x)?[a-f0-9A-F]*/;
    for (let i = 0; i < 5; i++) {
        let data = await inputSomething(message);
        let dataRes: any = dataReg.exec(data);
        if (dataRes[0] === data) {
            if (!data) {
                return '0x';
            }
            return data.startsWith('0x') ? data : '0x' + data;
        }

        console.log(`${message}: ${data} is Invalid`)
    }
    console.log('Too many attempts, exit');
    return null;
}

const sendTxByPassword = async (account: string, keystorePath: string, password: string, chainType: ChainType) => {
    const options = ['> Send Raw Tx', '> Call Contract', '> Back'];
    const something = await selectSomething(options);

    if (something === options[0]) {
        let to = await getAddressByInputText('to');
        if (!to) return;
        to = await getAddressByChecksum(to);
        const value = await getValueParams('value');

        const dataInputType = await selectSomething(['> Raw data', '> Data path'], 'Select data input type');
        let data;
        if (dataInputType === '> Raw data') {
            data = await getInputDataText('data');
        } else {
            let dataPath = await getDataPath('dataPath');
            data = fs.readFileSync(dataPath).toString().trim();
        }

        const gasUtil = new GasUtil(chainType.rpcUrl);
        const estimateGasPrice = await gasUtil.getGasPrice();
        const estimateGasPriceEthers = (new BigNumber(estimateGasPrice.toString())).dividedBy(1e9);
        const _estimateGasPrice = estimateGasPriceEthers.toFixed(4, BigNumber.ROUND_FLOOR);
        const inputGasPrice = await inputSomething(`Gas price (${_estimateGasPrice}), agree or enter`);
        let gasPrice = inputGasPrice ? inputGasPrice : _estimateGasPrice;
        gasPrice = (new BigNumber(gasPrice)).multipliedBy(1e9).toFixed(0);
        const estimateNonce = await gasUtil.getTransactionCount(account);
        const _nonce = await inputSomething(`Nonce (${estimateNonce}), agree or enter`);
        const nonce = _nonce ? _nonce : estimateNonce.toString();

        let txParams: any = {
            from: account,
            to: to,
            nonce: nonce,
            gasPrice: gasPrice,
            data: data,
            value: value
        }

        if (data === '0x') {
            txParams['gas'] = 21000;
        } else {
            let sendGasPrice = txParams.gasPrice;
            delete txParams.gasPrice;
            txParams['gas'] = (await gasUtil.estimateTxGas(txParams)).toString();
            txParams.gasPrice = sendGasPrice;
        }

        console.log('About to send tx:');
        console.log(txParams);
        const confirmRes = await confirmSomething('Is this Ok?');
        if (confirmRes) {
            const signedTxJson = await getSignedTx(txParams, txParams.from, chainType.rpcUrl, keystorePath, password);
            const signedTx = JSON.parse(signedTxJson);
            console.log('txHash: ', signedTx.transactionHash);
            sendSignedTx(signedTx.rawTransaction, chainType.rpcUrl)
        }
    }
    if (something === options[1]) {
        console.log('Coming Soon');
    }
    if (something === options[2]) {
        return;
    }
    await sendTxByPassword(account, keystorePath, password, chainType);
}

const selectedOptionsByPassword = async (account: string, keystorePathWithId: string, keystorePassword: string, chainType: ChainType) => {
    const options = ['> SendTx', '> SignMessage', '> Back'];
    const something = await selectSomething(options);

    if (something === options[0]) {
        await sendTxByPassword(account, keystorePathWithId, keystorePassword, chainType);
    }
    if (something === options[1]) {
        let message = await editorSomething('Input sign message');
        let privateKey = getPrivateKeyByAccount(account, keystorePathWithId, keystorePassword);
        let signature = signMessage(message, '0x' + privateKey.toString('hex'));
        console.log('signature: ', signature);
    }
    if (something === options[2]) {
        return;
    }
    await selectedOptionsByPassword(account, keystorePathWithId, keystorePassword, chainType);
}


const sendTx = async (keystorePath: string) => {
    let account = await inputSomething('Input the account to be used');
    account = await getAddressByChecksum(account);
    const keyStoreIdAccountsMap = await getAllKeystoreInfo(keystorePath);
    const keystoreIds = [];
    for (let keystoreId in keyStoreIdAccountsMap) {
        for (let i = 0; i < keyStoreIdAccountsMap[keystoreId].accounts.length; i++) {
            if (keyStoreIdAccountsMap[keystoreId].subAccounts[i].includes(account)) {
                let subAccountIndex = keyStoreIdAccountsMap[keystoreId].subAccounts[i].indexOf(account);
                let accountIndex = keyStoreIdAccountsMap[keystoreId].accounts[i].id;
                let baseAccount = keyStoreIdAccountsMap[keystoreId].accounts[i].address;
                keystoreIds.push(`${keystoreId}: #${accountIndex} ${baseAccount}: ${subAccountIndex}`);
            }
        }
    }

    if (keystoreIds.length === 0) {
        console.log("Not found in any keystores");
        await sendTx(keystorePath);
        return ;
    }

    let selectedKeystoreId = await selectSomething(keystoreIds, 'Found in these keystores, choose one to unlock: ');
    selectedKeystoreId = selectedKeystoreId.split(':', 1)[0];
    const keystorePathWithId = path.resolve(keystorePath, `${selectedKeystoreId}/wallet.json`);
    const keystorePassword = await getPasswordWithKeystoreId(selectedKeystoreId, keystorePathWithId);

    const defaultNetWork = await getDefaultNetWork(keystorePath, selectedKeystoreId);
    const chainType: ChainType = {
        name: defaultNetWork.name,
        chainId: defaultNetWork.id,
        rpcUrl: defaultNetWork.rpcUrl,
        multicallAddress: defaultNetWork.multicallAddress
    }

    const balances = await getBatchBalanceOf([account], chainType);
    const _balance = new BigNumber(balances.toString());
    if (defaultNetWork.id === '97' || defaultNetWork.id === '56') {
        console.log('BNB balance:');
        console.log(`\t${_balance.dividedBy(1e18).toFixed(4, BigNumber.ROUND_FLOOR)}BNB [${balances.toString()}Wei]`)
    } else {
        console.log('ETH balance:');
        console.log(`\t${_balance.dividedBy(1e18).toFixed(4, BigNumber.ROUND_FLOOR)}Ether [${balances.toString()}Wei]`)
    }

    await selectedOptionsByPassword(account, keystorePathWithId, keystorePassword, chainType);
}

export {
    sendTx
}