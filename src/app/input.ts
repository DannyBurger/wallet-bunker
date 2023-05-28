/* tslint:disable no-var-requires */
import chalk from 'chalk'
import figlet, { text } from 'figlet'
import inquirer from 'inquirer'
import fs from 'fs'
import * as _PATH_ from 'path'
import * as dotenv from 'dotenv';
import { getBatchBalanceOf } from './Web3'
import { getAccountsTag } from './keystore';
dotenv.config();

const USER_HOME: any = process.env.HOME || process.env.USERPROFILE
const BASE_PATH = `${USER_HOME}/.wallet-bunker`
const changedAccounts: any = {};

type ChainType = {
    name: string,
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
            mask: '#',
            message: `${text}: `,
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
    return inputText.trim().toString()
}

const getDataPath = async (message: string) => {
    for (let i = 0; i < 5; i++) {
        let dataPath = await inputSomething(message);
        dataPath = dataPath.trim();
        if (fs.existsSync(dataPath)) {
            return dataPath;
        };

        console.log(`${message}: ${dataPath} is Invalid`)
    }
    console.log('Too many attempts, exit');
    return null;
}

const editorSomething = async (text: string) => {
    const questions = [
        {
            name: 'inputText',
            type: 'editor',
            message: `${text}: `,
        },
    ]
    const { inputText } = await inquirer.prompt(questions)
    return inputText.trim().toString()
}

const confirmSomething = async (text: string) => {
    const questions = [
        {
            name: 'confirmText',
            type: 'confirm',
            message: `${text}`,
        },
    ]
    const { confirmText } = await inquirer.prompt(questions)
    return confirmText
}

const selectSomething = async (options: any[], message?: string, _default?:any) => {
    const questions = [
        {
            type: 'list',
            name: 'inputText',
            message: message || 'Choose an option',
            default: _default,
            choices: options,
            pageSize: 30,
            filter: (val: string) => {
                return val;
            },
        },
    ]
    const { inputText } = await inquirer.prompt(questions)
    return inputText.toString()
}

function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, time)
    })
}

async function getBalanceOf(accounts: string[], accountBalanceOfMap: any, chainType: any) {
    let _accounts = []
    for (let i = 0; i < accounts.length; i++) {
        if (!accounts[i] || accounts[i] in accountBalanceOfMap) {
            continue;
        }
        _accounts.push(accounts[i]);
    }

    const batchBalanceOf = [];
    const batchBaseBalanceOf = await getBatchBalanceOf(_accounts, chainType);
    for (let i = 0; i < _accounts.length; i++) {
        batchBalanceOf.push((Number(batchBaseBalanceOf[i].toString()) / 10 ** 18).toFixed(6));
    }

    let result = [];
    for (let i = 0; i < accounts.length; i++) {
        if (_accounts.indexOf(accounts[i]) > -1) {
            result.push(batchBalanceOf[_accounts.indexOf(accounts[i])]);
        } else {
            result.push(null);
        }
    }
    return result;
}

const listWithLazyBalanceLoading = async (options: string[], keystorePath: string, message?: string, chainType?: any, defaultAccount?: any) => {
    const questions = [
        {
            type: 'list',
            name: 'inputText',
            message: message || 'Choose an option',
            choices: options,
            pageSize: 30,
            default: defaultAccount,
            filter: (val: string) => {
                return val;
            },
        },
    ]

    const promise: any = inquirer.prompt(questions);

    let selected;
    let accountBalanceOfMap: any = {};
    while (!promise.ui.activePrompt.answers[promise.ui.activePrompt.opt.name]) {
        await sleep(3000);

        if (selected === promise.ui.activePrompt.selected) {
            continue;
        }
        selected = promise.ui.activePrompt.selected;

        const pageSize = promise.ui.activePrompt.opt.pageSize;

        let accounts = [];
        for (let i = 0; i < promise.ui.activePrompt.opt.choices.choices.length; i++) {
            if (!promise.ui.activePrompt.opt.choices.choices[i].name) {
                accounts.push(null);
                continue;
            }
            let account = /0x[0-9a-fA-f]{40}/.exec(promise.ui.activePrompt.opt.choices.choices[i].name);
            if (account) {
                accounts.push(account[0])
            } else {
                accounts.push(null);
            }
        }
        accounts = accounts.concat(accounts);
        let fromIndex, toIndex;
        if (selected < pageSize / 2) {
            if (accounts.length / 2 <= pageSize) {
                fromIndex = 0;
                toIndex = accounts.length / 2;
            } else {
                fromIndex = 0;
                toIndex = pageSize;
            }
        } else {
            if (accounts.length / 2 <= pageSize) {
                fromIndex = 0;
                toIndex = accounts.length / 2;
            } else {
                fromIndex = selected - pageSize / 2 + 1;
                toIndex = selected + pageSize / 2 + 1;
            }
        }

        let activeAccount: any = accounts.slice(fromIndex, toIndex);
        let batchBalanceOf = await getBalanceOf(activeAccount, accountBalanceOfMap, chainType);

        for (let i = fromIndex; i < toIndex; i++) {
            let _index = i >= accounts.length / 2 ? i - accounts.length / 2 : i;
            let _choice = promise.ui.activePrompt.opt.choices.choices[_index];
            if (!_choice.name) {
                continue;
            }
            let name = _choice.name;
            if ((name.indexOf('balanceOf') === -1 && batchBalanceOf[i - fromIndex]) || ((activeAccount[i - fromIndex] in changedAccounts) && changedAccounts[activeAccount[i - fromIndex]])) {
                accountBalanceOfMap[activeAccount[i - fromIndex]] = batchBalanceOf[i - fromIndex];
                let gasName = chainType.chainId === "97" || chainType.chainId === "56" ? 'BNB' : 'ETH';
                if (name.indexOf('tag') > -1) {
                    let nameList = name.split(', tag');
                    promise.ui.activePrompt.opt.choices.choices[_index].name = nameList[0] + `, ${gasName}: ${batchBalanceOf[i - fromIndex]}` + `, tag${nameList[1]}`;

                } else {
                    promise.ui.activePrompt.opt.choices.choices[_index].name = name + `, ${gasName}: ${batchBalanceOf[i - fromIndex]}`;
                }
                changedAccounts[activeAccount[i - fromIndex]] = false;
            }
        }
        promise.ui.activePrompt.screen.render('');
        promise.ui.activePrompt.render();
    }
    return promise.ui.activePrompt.answers[promise.ui.activePrompt.opt.name];
}

const selectSomethingWithCheckBox = async (options: any[]) => {
    const questions = [
        {
            type: 'checkbox',
            name: 'checklist',
            message: 'Choose an option',
            choices: options,
            pageSize: 30
        },
    ]
    const { checklist } = await inquirer.prompt(questions);
    return checklist;
}

const getKeystorePath = async () => {
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
    return path;
}

const setChangedAccount = async (account: string) => {
    changedAccounts[account] = true;
}

export { showIntroduction, inputPassword, inputSomething, selectSomething, selectSomethingWithCheckBox, confirmSomething, getKeystorePath, ChainType, editorSomething, listWithLazyBalanceLoading, setChangedAccount, getDataPath }