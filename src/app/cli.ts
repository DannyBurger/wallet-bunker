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

const main = async () => {
    let packageJson = require('../../package.json');
    console.log('version:', packageJson.version);

    showIntroduction();

    const keystorePath = await getKeystorePath();

    await getMenuSetting(keystorePath);
}

main()
    .then(() => process.exit(0))
    .catch((error: any) => {
        console.log(error.message);
        process.exit(1)
    })
