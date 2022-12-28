/* tslint:disable no-var-requires */
import chalk from 'chalk'
import figlet, { text } from 'figlet'
import inquirer from 'inquirer'
import fs from 'fs'
import * as _PATH_ from 'path'
import * as dotenv from 'dotenv';
dotenv.config();

const USER_HOME: any = process.env.HOME || process.env.USERPROFILE
const BASE_PATH = `${USER_HOME}/.wallet-bunker`

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
    return inputText.trim().toString()
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

const selectSomething = async (options: string[], message?: string) => {
    const questions = [
        {
            type: 'list',
            name: 'inputText',
            message: message || 'Choose an option',
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

export { showIntroduction, inputPassword, inputSomething, selectSomething, selectSomethingWithCheckBox, confirmSomething, getKeystorePath, ChainType, editorSomething }