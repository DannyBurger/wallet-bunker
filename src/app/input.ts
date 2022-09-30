/* tslint:disable no-var-requires */
import chalk from 'chalk'
import figlet from 'figlet'
import inquirer from 'inquirer'
import fs from 'fs'
import * as _PATH_ from 'path'
import * as dotenv from 'dotenv';
dotenv.config();

const USER_HOME: any = process.env.HOME || process.env.USERPROFILE
const BASE_PATH = `${USER_HOME}/.wallet-bunker`

type ChainType = {
    chainId: number;
    rpcUrl: string;
    multicallAddress: string;
}

const showIntroduction = () => {
    console.log(
        chalk.green(
            figlet.textSync('WALLET BUNKER', {
                font: 'Ghost',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            })
        )
    )
}

const inputPassword = async (text: string) => {
    let pwd: string
    const questions = [
        {
            name: 'Password',
            type: 'password',
            message: `${text} [Password length >= 6]: `,
        },
    ]
    while (true) {
        const { Password } = await inquirer.prompt(questions)
        if (Password && Password.length >= 6) {
            pwd = Password
            break
        }
        console.log('Invalid password')
    }
    return pwd
}

const inputSomething = async (text: string) => {
    const questions = [
        {
            name: 'inputText',
            type: 'input',
            message: `${text}: `,
        },
    ]
    const { inputText } = await inquirer.prompt(questions)
    return inputText.toString()
}

const selectSomething = async (options: string[]) => {
    const questions = [
        {
            type: 'list',
            name: 'inputText',
            message: 'Choose an option',
            choices: options,
            filter: (val: string) => {
                return val.split('.')[0]
            },
        },
    ]
    const { inputText } = await inquirer.prompt(questions)
    return inputText.toString()
}

const selectAccount = async (options: string[]) => {
    const questions = [
        {
            type: 'list',
            name: 'Something',
            message: 'Choose an account',
            choices: options,
            filter: (val: string) => {
                return val.split(' ')[1]
            },
        },
    ]
    const { Something } = await inquirer.prompt(questions)
    return Something
}

const getKeystorePathAndChainConf = async () => {
    let path: string = await inputSomething(`Keystore storage located in (default: ${BASE_PATH})`)
    if (!path) {
        path = BASE_PATH
    }
    path = path.trim()
    path = path.replace('~', USER_HOME)
    let exist = fs.existsSync(path)
    if (!exist) {
        fs.mkdirSync(path)
    }
    const keystoreIds = fs.readdirSync(path)
    let appIds = ['1. New keystore id']
    for (let i = 0; i < keystoreIds.length; i++) {
        appIds.push(`${i + 2}. ${keystoreIds[i]}`)
    }
    let selectedAppId = await selectSomething(appIds)
    let keystoreId
    if (selectedAppId === '1') {
        keystoreId = await inputSomething('Enter keystore id')
    } else {
        keystoreId = keystoreIds[Number(selectedAppId) - 2]
    }
    let appPath = _PATH_.resolve(path, keystoreId)
    exist = fs.existsSync(appPath)
    if (!exist) {
        fs.mkdirSync(appPath)
    }
    let chainConfPath = `${appPath}/chain.conf`;
    exist = fs.existsSync(chainConfPath)
    if (!exist) {
        fs.writeFileSync(chainConfPath, JSON.stringify({
            chainId: null,
            rpcUrl: null,
            multicallAddress: null
        }));
    }
    let chainType: ChainType = JSON.parse(fs.readFileSync(chainConfPath).toString());
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
    fs.writeFileSync(chainConfPath, JSON.stringify(chainType));
    result.chainType = chainType;
    return result;
}

export { showIntroduction, inputPassword, inputSomething, selectSomething, getKeystorePathAndChainConf, selectAccount, ChainType }