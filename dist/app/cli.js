"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const input_1 = require("./input");
const main_1 = require("../main");
const account_manager_1 = require("./account-manager");
const checkStorage = (keyStorePath) => {
    const exist = fs_1.default.existsSync(keyStorePath);
    if (!exist) {
        fs_1.default.writeFileSync(keyStorePath, JSON.stringify([]));
    }
    const data = fs_1.default.readFileSync(keyStorePath);
    return JSON.parse(data.toString()).length > 0;
};
const run = async (password, keyStorePath, chainType) => {
    const something = await (0, input_1.selectSomething)(['1. System status', '2. Unlock & Start', '3. Roots', '4. SendTx', '5. Reset Password', '6. Exit']);
    if (something === '1') {
        console.log('System status. Coming soon');
    }
    if (something === '2') {
        console.log('Unlock & start. Coming soon');
    }
    if (something === '3') {
        await (0, account_manager_1.accountManage)(password, keyStorePath, chainType);
    }
    if (something === '4') {
        const txParamsPath = await (0, input_1.inputSomething)('Input tx json file path');
        const txParams = JSON.parse(fs_1.default.readFileSync(txParamsPath).toString());
        const transactionHash = await (0, main_1.signAndSendTx)(txParams, chainType.rpcUrl, keyStorePath, password);
        console.log('transactionHash: ', transactionHash);
    }
    if (something === '5') {
        await (0, account_manager_1._resetPassword)(password, keyStorePath);
        console.log('Password changed, need to login again');
        return;
    }
    if (something === '6') {
        return;
    }
    await run(password, keyStorePath, chainType);
};
const main = async () => {
    let packageJson = require('../../package.json');
    console.log('Version:', packageJson.version);
    (0, input_1.showIntroduction)();
    let password = '';
    const keyStorePathAndChainConf = await (0, input_1.getKeystorePathAndChainConf)();
    if (checkStorage(keyStorePathAndChainConf.keystorePath)) {
        password = await (0, input_1.inputPassword)('Please enter password');
        const isOk = (0, main_1.checkPassword)(password, keyStorePathAndChainConf.keystorePath);
        if (!isOk) {
            console.log('The password input is inconsistent, please re-enter');
            return;
        }
    }
    else {
        console.log('There is no account in the system, please initialize the password');
        const password01 = await (0, input_1.inputPassword)('Please enter password');
        const password02 = await (0, input_1.inputPassword)('Please confirm your password');
        if (password01 !== password02) {
            console.log('Inconsistent password input, log out of the system');
            return;
        }
        password = password02;
    }
    await run(password, keyStorePathAndChainConf.keystorePath, keyStorePathAndChainConf.chainType);
};
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.log(error.message);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map