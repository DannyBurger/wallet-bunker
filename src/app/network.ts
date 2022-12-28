import path from "path";
import fs from "fs";
import inquirer from 'inquirer'
import { selectSomething, confirmSomething, inputSomething } from './input'
import { getChainId } from './Web3'

const getDefaultNetWork = async (keystorePath: string) => {
    const networkSettingPath = path.resolve(keystorePath, 'network.json');
    const networkSettingPathIsExist = fs.existsSync(networkSettingPath);
    if (!networkSettingPathIsExist) {
        fs.writeFileSync(networkSettingPath, JSON.stringify({
            NAME: '',
            ID: '',
            RPC: '',
            MulticallAddress: '',
            Symbol: ''
        }));
    }
    let networkRawInfo = fs.readFileSync(networkSettingPath);
    const networkInfo = JSON.parse(networkRawInfo.toString());
    return networkInfo;
}

const getRpcUrlByChainId = async (text: string, chainId: string) => {
    for (let i = 0; i < 10; i++) {
        let rpc = await inputSomething(text);
        try {
            if (!rpc) return null;
            const _chainId = await getChainId(rpc);
            if (_chainId.toString() === chainId) {
                return rpc;
            }
        } catch (err: any) {
            console.log('err: ', err.message);
        }
    }
    return null
}

const addNetWork = async (keystorePath: string) => {
    const networkListSettingPath = path.resolve(keystorePath, 'networklist.json');
    const networkListSettingPathIsExist = fs.existsSync(networkListSettingPath);
    const defaultNetWork = await getDefaultNetWork(keystorePath);
    if (!networkListSettingPathIsExist) {
        fs.writeFileSync(networkListSettingPath, JSON.stringify([]));
    }
    let networkListRawInfo = fs.readFileSync(networkListSettingPath);
    const networkListInfo = JSON.parse(networkListRawInfo.toString());
    const existIds = [];
    for (let i = 0; i < networkListInfo.length; i++) {
        existIds.push(networkListInfo[i].ID);
    }
    console.log('Please Input someting about network');
    const chainName = await inputSomething('NAME');
    const chainId = await inputSomething('ID');
    if (existIds.includes(chainId)) {
        console.log('Chain Id is Exist');
        return;
    }
    const rpc = await getRpcUrlByChainId('RPC', chainId);
    if (!rpc) {
        console.log('rpcUrl is error');
        return;
    };
    const multicallAddress = await inputSomething('Multicall Address');
    const symbol = await inputSomething('Symbol');
    const netWorkInfo = {
        NAME: chainName,
        ID: chainId,
        RPC: rpc,
        MulticallAddress: multicallAddress,
        Symbol: symbol
    };
    networkListInfo.push(netWorkInfo);

    if (networkListInfo.length === 1 || chainId === defaultNetWork.ID) {
        const networkSettingPath = path.resolve(keystorePath, 'network.json');
        fs.writeFileSync(networkSettingPath, JSON.stringify(netWorkInfo));
    }

    fs.writeFileSync(networkListSettingPath, JSON.stringify(networkListInfo));
}

const removeNetWork = async (keystorePath: string, network: any) => {
    const networkListSettingPath = path.resolve(keystorePath, 'networklist.json');
    const allNetWork = await getAllNetWork(keystorePath);
    const defaultNetWork = await getDefaultNetWork(keystorePath);
    if (defaultNetWork.ID === network.ID) {
        console.log('Default network cannot be removed');
        return;
    }
    let confirmRes = await confirmSomething(`Remove NetWork. ChainId is ${network.ID}`);
    if (!confirmRes) return;
    let newNetworkListInfo = [];

    for (let j = 0; j < allNetWork.length; j++) {
        if (allNetWork[j].ID !== network.ID) {
            newNetworkListInfo.push(allNetWork[j]);
        }
    }
    fs.writeFileSync(networkListSettingPath, JSON.stringify(newNetworkListInfo));
}

const getAllNetWork = async (keystorePath: string) => {
    const networkListSettingPath = path.resolve(keystorePath, 'networklist.json');
    const networkListSettingPathIsExist = fs.existsSync(networkListSettingPath);
    if (!networkListSettingPathIsExist) {
        return [];
    }
    const networkListRawInfo = fs.readFileSync(networkListSettingPath);
    const networkListInfo = JSON.parse(networkListRawInfo.toString());
    return networkListInfo;
}

const editNetWork = async (keystorePath: string, networkListInfo: any, network: any) => {
    const defaultNetWork = await getDefaultNetWork(keystorePath);
    const chainName = await inputSomething(`NAME (default: ${network.NAME})`);
    const chainId = await inputSomething(`ID (default: ${network.ID})`);
    const rpc = await getRpcUrlByChainId(`RPC (default: ${network.RPC})`, chainId || network.ID);
    const multicallAddress = await inputSomething(`Multicall Address (default: ${network.MulticallAddress})`);
    const symbol = await inputSomething(`Symbol (default: ${network.Symbol})`);
    let netWorkInfo = {
        NAME: chainName || network.NAME,
        ID: chainId || network.ID,
        RPC: rpc || network.RPC,
        MulticallAddress: multicallAddress || network.MulticallAddress,
        Symbol: symbol || network.Symbol
    };
    for (let i = 0; i < networkListInfo.length; i++) {
        if (networkListInfo[i].ID === network.ID) {
            networkListInfo[i] = netWorkInfo;
        }
    }

    if (network.ID === defaultNetWork.ID) {
        const networkSettingPath = path.resolve(keystorePath, 'network.json');
        fs.writeFileSync(networkSettingPath, JSON.stringify(netWorkInfo));
    }

    const networkListSettingPath = path.resolve(keystorePath, 'networklist.json');
    fs.writeFileSync(networkListSettingPath, JSON.stringify(networkListInfo));
}


const selectOrEditNetwork = async (keystorePath: string, network: any) => {
    const networkListInfo = await getAllNetWork(keystorePath);
    const defaultNetWork = await getDefaultNetWork(keystorePath);

    let options;
    if (defaultNetWork.ID === network.ID) {
        options = ['1. Edit', '2. Remove', '3. Back'];
    } else {
        options = ['1. Set as default', '2. Edit', '3. Remove', '4. Back'];
    }

    const something = await selectSomething(options);
    const optionSize = options.length;

    if (optionSize === 4 && something === options[0]) {
        let defaultNetWorkInfo;
        for (let i = 0; i < networkListInfo.length; i++) {
            if (networkListInfo[i].ID === network.ID) {
                defaultNetWorkInfo = networkListInfo[i];
            }
        }

        const networkSettingPath = path.resolve(keystorePath, 'network.json');
        fs.writeFileSync(networkSettingPath, JSON.stringify(defaultNetWorkInfo));
    }

    if (something === options[optionSize - 3]) {
        await editNetWork(keystorePath, networkListInfo, network);
    }

    if (something === options[optionSize - 2]) {
        await removeNetWork(keystorePath, network);
    }
}

const getDefaultNetWorkList = async (keystorePath: string) => {
    const allNetWork = await getAllNetWork(keystorePath);
    const options: any = ['> Back', new inquirer.Separator(`----Network List----`)];
    for (let i = 0; i < allNetWork.length; i++) {
        let networkInfo = allNetWork[i];
        let key = `${networkInfo.NAME}\r\n\t-ID:${networkInfo.ID}\r\n\t-RPC: ${networkInfo.RPC}\r\n\t-Multicall Address: ${networkInfo.MulticallAddress}\r\n\t-Symbol: ${networkInfo.Symbol}\r\n`;
        options.push(key);
    }

    const something = await selectSomething(options);

    if (something === options[0]) {
        return;
    }
    const selectedNetworkIndex = options.indexOf(something) - 2;
    await selectOrEditNetwork(keystorePath, allNetWork[selectedNetworkIndex]);
    await getDefaultNetWorkList(keystorePath);
}

const getNetWorkInfo = async (keystorePath: string) => {
    const defaultNetWork = await getDefaultNetWork(keystorePath);
    const defaultNetWorkMessage = defaultNetWork.NAME ? `> Networks [${defaultNetWork.NAME} ID:${defaultNetWork.ID}]` : '> Networks';

    let allNetWork = await getAllNetWork(keystorePath);
    let networkInfolist;
    if (allNetWork.length === 0) {
        networkInfolist = ['> Add Network', '> Back'];
    } else {
        networkInfolist = [defaultNetWorkMessage, '> Add Network', '> Back'];
    }

    const something = await selectSomething(networkInfolist);
    const optionSize = networkInfolist.length;
    if (optionSize === 3 && something === networkInfolist[0]) {
        await getDefaultNetWorkList(keystorePath);
    }

    if (something === networkInfolist[optionSize - 2]) {
        await addNetWork(keystorePath);
    }

    if (something === networkInfolist[optionSize - 1]) {
        return;
    }
    await getNetWorkInfo(keystorePath);
}


export {
    getDefaultNetWork,
    getNetWorkInfo
}