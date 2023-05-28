import path from "path";
import fs from "fs";
import { showIntroduction, selectSomething, getKeystorePath } from './input'
import { _resetPassword } from './account-manager'
import { keystoresManager } from './keystore';
import { sendTx } from './sendTx';
import { getNetWorkInfo } from './network';
const Event = require('events');
Event.EventEmitter.defaultMaxListeners = 0;

const getMenuSetting = async (keystorePath: string) => {
    const menulist = ['> System & Settings', '> KeyStores', '> Tools', '> Exit'];
    const something = await selectSomething(menulist);

    if (something === menulist[0]) {
        await getNetWorkInfo(keystorePath);
    }

    if (something === menulist[1]) {
        await keystoresManager(keystorePath);
    }

    if (something === menulist[2]) {
        await sendTx(keystorePath);
    }

    if (something === menulist[3]) {
        return;
    }

    await getMenuSetting(keystorePath);
}

const mergeNetwork = (keystorePath: string) => {
    const configsPath = path.resolve(keystorePath, 'configs.json');
    const networkPath = path.resolve(keystorePath, 'network.json');
    const networklistPath = path.resolve(keystorePath, 'networklist.json');
    if (!fs.existsSync(networkPath) || !fs.existsSync(networklistPath) || fs.existsSync(configsPath)) {
        return
    }
    let networkRawInfo = fs.readFileSync(networkPath);
    const networkInfo = JSON.parse(networkRawInfo.toString());
    let configsInfo: any = {};
    configsInfo.currenChain = networkInfo.ID;
    configsInfo.networks = [];
    let networklistRawInfo = fs.readFileSync(networklistPath);
    const networklistInfo = JSON.parse(networklistRawInfo.toString());
    for (let i = 0; i < networklistInfo.length; i++) {
        let _netWorkInfo = {
            name: networklistInfo[i].NAME,
            id: networklistInfo[i].ID,
            rpcUrl: networklistInfo[i].RPC,
            multicallAddress: networklistInfo[i].MulticallAddress,
            symbol: networklistInfo[i].Symbol
        }
        configsInfo.networks.push(_netWorkInfo);
    }
    fs.writeFileSync(configsPath, JSON.stringify(configsInfo, null, 4));
}

const main = async () => {
    let packageJson = require('../../package.json');
    console.log('version:', packageJson.version);

    showIntroduction();

    const keystorePath = await getKeystorePath();

    // network.json + networklist.json => configs.json
    mergeNetwork(keystorePath);

    await getMenuSetting(keystorePath);
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

main()
    .then(() => process.exit(0))
    .catch((error: any) => {
        console.log(error.message);
        process.exit(1)
    })
