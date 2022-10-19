"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectAccount = exports.getKeystorePathAndChainConf = exports.selectSomething = exports.inputSomething = exports.inputPassword = exports.showIntroduction = void 0;
/* tslint:disable no-var-requires */
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const _PATH_ = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const USER_HOME = process.env.HOME || process.env.USERPROFILE;
const BASE_PATH = `${USER_HOME}/.wallet-bunker`;
const showIntroduction = () => {
    console.log(chalk_1.default.green(figlet_1.default.textSync('WALLET BUNKER', {
        font: 'Ghost',
        horizontalLayout: 'default',
        verticalLayout: 'default',
    })));
};
exports.showIntroduction = showIntroduction;
const inputPassword = async (text) => {
    let pwd;
    const questions = [
        {
            name: 'Password',
            type: 'password',
            mask: '#',
            message: `${text} [Password length >= 6]: `,
        },
    ];
    while (true) {
        const { Password } = await inquirer_1.default.prompt(questions);
        if (Password && Password.length >= 6) {
            pwd = Password;
            break;
        }
        console.log('Invalid password');
    }
    return pwd;
};
exports.inputPassword = inputPassword;
const inputSomething = async (text) => {
    const questions = [
        {
            name: 'inputText',
            type: 'input',
            message: `${text}: `,
        },
    ];
    const { inputText } = await inquirer_1.default.prompt(questions);
    return inputText.toString();
};
exports.inputSomething = inputSomething;
const selectSomething = async (options) => {
    const questions = [
        {
            type: 'list',
            name: 'inputText',
            message: 'Choose an option',
            choices: options,
            filter: (val) => {
                return val.split('.')[0];
            },
        },
    ];
    const { inputText } = await inquirer_1.default.prompt(questions);
    return inputText.toString();
};
exports.selectSomething = selectSomething;
const selectAccount = async (lines) => {
    const questions = [
        {
            type: 'list',
            name: 'Something',
            message: 'Choose an account',
            choices: lines,
            filter: (val) => {
                let regRes = /0x[0-9a-zA-Z]{40}/g.exec(val);
                return regRes ? regRes[0] : (void 0);
            },
        },
    ];
    const { Something } = await inquirer_1.default.prompt(questions);
    return Something;
};
exports.selectAccount = selectAccount;
const getKeystorePathAndChainConf = async () => {
    let path = await inputSomething(`Keystore storage located in (default: ${BASE_PATH})`);
    if (!path) {
        path = BASE_PATH;
    }
    path = path.trim();
    path = path.replace('~', USER_HOME);
    let exist = fs_1.default.existsSync(path);
    if (!exist) {
        fs_1.default.mkdirSync(path);
    }
    const keystoreIds = fs_1.default.readdirSync(path);
    let appIds = ['1. New keystore id'];
    for (let i = 0; i < keystoreIds.length; i++) {
        appIds.push(`${i + 2}. ${keystoreIds[i]}`);
    }
    let selectedAppId = await selectSomething(appIds);
    let keystoreId;
    if (selectedAppId === '1') {
        keystoreId = await inputSomething('Enter keystore id');
    }
    else {
        keystoreId = keystoreIds[Number(selectedAppId) - 2];
    }
    let appPath = _PATH_.resolve(path, keystoreId);
    exist = fs_1.default.existsSync(appPath);
    if (!exist) {
        fs_1.default.mkdirSync(appPath);
    }
    let chainConfPath = `${appPath}/chain.conf`;
    exist = fs_1.default.existsSync(chainConfPath);
    if (!exist) {
        fs_1.default.writeFileSync(chainConfPath, JSON.stringify({
            chainId: null,
            rpcUrl: null,
            multicallAddress: null
        }));
    }
    let chainType = JSON.parse(fs_1.default.readFileSync(chainConfPath).toString());
    let result = {
        chainType: chainType,
        keystorePath: `${appPath}/wallet.json`
    };
    if (chainType.chainId && chainType.rpcUrl && chainType.multicallAddress) {
        console.log(`ChainId: ${chainType.chainId}, RpcUrl: ${chainType.rpcUrl}, MulticallAddress: ${chainType.multicallAddress}`);
        let toUpdate = await inputSomething('Change prev setting? (default is N)[N/Y]');
        if (toUpdate !== 'Y' || toUpdate !== 'y') {
            return result;
        }
    }
    chainType.chainId = await inputSomething('Input ChainId');
    chainType.rpcUrl = await inputSomething('Input RpcUrl');
    chainType.multicallAddress = await inputSomething('Input MulticallAddress');
    fs_1.default.writeFileSync(chainConfPath, JSON.stringify(chainType));
    result.chainType = chainType;
    return result;
};
exports.getKeystorePathAndChainConf = getKeystorePathAndChainConf;
//# sourceMappingURL=input.js.map