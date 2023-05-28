import path from "path";
import fs from "fs";
import inquirer from 'inquirer'
import { selectSomething, confirmSomething, inputSomething } from './input'
import { getChainId } from './Web3'

const getDefaultNetWork = async (keystorePath: string, keystoreId: string | null) => {
    const defaultNetWorkInfo = {
        name: '',
        id: '',
        rpcUrl: '',
        multicallAddress: '',
        symbol: ''
    };
    let keystoreDefaultNetwork = null;

    if (keystoreId) {
        const keystorePathConf = path.resolve(keystorePath, `${keystoreId}/configs.json`);
        const keystoreNetworkConfIsExist = fs.existsSync(keystorePathConf);

        if (keystoreNetworkConfIsExist) {
            let keystoreConfigsRawInfo = fs.readFileSync(keystorePathConf);
            let configsInfo = JSON.parse(keystoreConfigsRawInfo.toString());
            keystoreDefaultNetwork = configsInfo.currenChain;
        }
    }

    const configsPath = path.resolve(keystorePath, 'configs.json');
    const configsPathIsExist = fs.existsSync(configsPath);
    if (!configsPathIsExist) {
        return defaultNetWorkInfo;
    }

    let configsRawInfo = fs.readFileSync(configsPath);
    const configsInfo = JSON.parse(configsRawInfo.toString());

    let systemDefaultNetworkInfo = null;
    for (let i = 0; i < configsInfo.networks.length; i++) {
        if (configsInfo.networks[i].id === keystoreDefaultNetwork) {
            return configsInfo.networks[i];
        }

        if (configsInfo.networks[i].id === configsInfo.currenChain) {
            systemDefaultNetworkInfo = configsInfo.networks[i];
        }
    }
    return systemDefaultNetworkInfo ? systemDefaultNetworkInfo : defaultNetWorkInfo;
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
    const configsPath = path.resolve(keystorePath, 'configs.json');
    const configsPathIsExist = fs.existsSync(configsPath);
    let configsInfo: any = {};
    if (configsPathIsExist) {
        let configsRawInfo = fs.readFileSync(configsPath);
        configsInfo = JSON.parse(configsRawInfo.toString());
    }
    const existIds = [];
    for (let i = 0; i < configsInfo.networks.length; i++) {
        existIds.push(configsInfo.networks[i].id);
    }

    console.log('Please Input someting about network');
    const chainName = await inputSomething('name');
    const chainId = await inputSomething('id');
    if (existIds.includes(chainId)) {
        console.log('Chain Id is Exist');
        return;
    }
    const rpc = await getRpcUrlByChainId('rpcUrl', chainId);
    if (!rpc) {
        console.log('rpcUrl is error');
        return;
    };
    const multicallAddress = await inputSomething('Multicall Address');
    const symbol = await inputSomething('symbol');
    const netWorkInfo = {
        name: chainName,
        id: chainId,
        rpcUrl: rpc,
        multicallAddress: multicallAddress,
        symbol: symbol
    };
    configsInfo.networks.push(netWorkInfo);
    if (configsInfo.networks.length === 1) {
        configsInfo.currenChain = chainId;
    }

    fs.writeFileSync(configsPath, JSON.stringify(configsInfo, null, 4));
}

const removeNetWork = async (keystorePath: string, network: any) => {
    const configsPath = path.resolve(keystorePath, 'configs.json');
    const configsPathIsExist = fs.existsSync(configsPath);
    if (!configsPathIsExist) {
        console.log('No network');
        return;
    }
    let configsRawInfo = fs.readFileSync(configsPath);
    let configsInfo = JSON.parse(configsRawInfo.toString());
    if (configsInfo.currenChain === network.id) {
        console.log('Default network cannot be removed');
        return;
    }
    let confirmRes = await confirmSomething(`Remove NetWork. ChainId is ${network.id}`);
    if (!confirmRes) return;
    let newNetworkListInfo = [];
    for (let i = 0; i < configsInfo.networks.length; i++) {
        if (configsInfo.networks[i].id !== network.id) {
            newNetworkListInfo.push(configsInfo.networks[i]);
        }
    }
    configsInfo.networks = newNetworkListInfo;
    fs.writeFileSync(configsPath, JSON.stringify(configsInfo, null, 4));
}

const getAllNetWork = async (keystorePath: string) => {
    const configsPath = path.resolve(keystorePath, 'configs.json');
    const configsPathIsExist = fs.existsSync(configsPath);
    if (!configsPathIsExist) {
        return [];
    }
    let configsRawInfo = fs.readFileSync(configsPath);
    let configsInfo = JSON.parse(configsRawInfo.toString());
    return configsInfo.networks
}

const editNetWork = async (keystorePath: string, networkListInfo: any, network: any) => {
    const configsPath = path.resolve(keystorePath, 'configs.json');
    const configsPathIsExist = fs.existsSync(configsPath);
    if (!configsPathIsExist) {
        console.log('No network');
        return;
    }
    let configsRawInfo = fs.readFileSync(configsPath);
    let configsInfo = JSON.parse(configsRawInfo.toString());

    const chainName = await inputSomething(`name (default: ${network.name})`);
    const chainId = await inputSomething(`id (default: ${network.id})`);
    const rpc = await getRpcUrlByChainId(`rpcUrl (default: ${network.rpcUrl})`, chainId || network.id);
    const multicallAddress = await inputSomething(`Multicall Address (default: ${network.multicallAddress})`);
    const symbol = await inputSomething(`symbol (default: ${network.symbol})`);
    let netWorkInfo = {
        name: chainName || network.name,
        id: chainId || network.id,
        rpcUrl: rpc || network.rpcUrl,
        multicallAddress: multicallAddress || network.multicallAddress,
        symbol: symbol || network.symbol
    };
    for (let i = 0; i < networkListInfo.length; i++) {
        if (networkListInfo[i].id === network.id) {
            networkListInfo[i] = netWorkInfo;
        }
    }

    configsInfo.networks = networkListInfo;
    fs.writeFileSync(configsPath, JSON.stringify(configsInfo, null, 4));
}

const selectOrEditNetwork = async (keystorePath: string, network: any) => {
    const networkListInfo = await getAllNetWork(keystorePath);
    const defaultNetWork = await getDefaultNetWork(keystorePath, null);

    let options;
    if (defaultNetWork.id === network.id) {
        options = ['1. Edit', '2. Remove', '3. Back'];
    } else {
        options = ['1. Set as default', '2. Edit', '3. Remove', '4. Back'];
    }

    const something = await selectSomething(options);
    const optionSize = options.length;

    if (optionSize === 4 && something === options[0]) {
        const configsPath = path.resolve(keystorePath, 'configs.json');
        let configsRawInfo = fs.readFileSync(configsPath);
        let configsInfo = JSON.parse(configsRawInfo.toString());
        configsInfo.currenChain = network.id;
        fs.writeFileSync(configsPath, JSON.stringify(configsInfo, null, 4));
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
        let key = `${networkInfo.name}\r\n\t-id:${networkInfo.id}\r\n\t-rpcUrl: ${networkInfo.rpcUrl}\r\n\t-Multicall Address: ${networkInfo.multicallAddress}\r\n\t-symbol: ${networkInfo.symbol}\r\n`;
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
    const defaultNetWork = await getDefaultNetWork(keystorePath, null);
    const defaultNetWorkMessage = defaultNetWork.name ? `> Networks [${defaultNetWork.name} id:${defaultNetWork.id}]` : '> Networks';

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
    getNetWorkInfo,
    getAllNetWork
}