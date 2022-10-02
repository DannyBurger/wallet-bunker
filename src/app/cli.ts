import fs from 'fs'
import { showIntroduction, selectSomething, inputPassword, getKeystorePathAndChainConf, inputSomething, ChainType } from './input'
import { checkPassword, signAndSendTx } from '../main'
import { accountManage, _resetPassword } from './account-manager'

const checkStorage = (keyStorePath: string) => {
    const exist = fs.existsSync(keyStorePath)
    if (!exist) {
        fs.writeFileSync(keyStorePath, JSON.stringify([]))
    }
    const data = fs.readFileSync(keyStorePath)
    return JSON.parse(data.toString()).length > 0
}

const run = async (password: string, keyStorePath: string, chainType: ChainType) => {
    const something = await selectSomething(['1. System status', '2. Unlock & Start', '3. Roots', '4. SendTx', '5. Reset Password', '6. Exit'])

    if (something === '1') {
        console.log('System status. Coming soon')
    }

    if (something === '2') {
        console.log('Unlock & start. Coming soon')
    }

    if (something === '3') {
        await accountManage(password, keyStorePath, chainType)
    }

    if (something === '4') {
        const txParamsPath = await inputSomething('Input tx json file path')
        const txParams = JSON.parse(fs.readFileSync(txParamsPath).toString())
        const transactionHash = await signAndSendTx(txParams, chainType.rpcUrl, keyStorePath, password)
        console.log('transactionHash: ', transactionHash)
    }

    if (something === '5') {
        await _resetPassword(password, keyStorePath)
        console.log('Password changed, need to login again')
        return
    }

    if (something === '6') {
        return
    }

    await run(password, keyStorePath, chainType)
}

const main = async () => {
    let packageJson = require('../../package.json');
    console.log('version:', packageJson.version);
    showIntroduction();

    let password: string = ''
    const keyStorePathAndChainConf = await getKeystorePathAndChainConf()

    if (checkStorage(keyStorePathAndChainConf.keystorePath)) {
        password = await inputPassword('Please enter password')
        const isOk = checkPassword(password, keyStorePathAndChainConf.keystorePath)
        if (!isOk) {
            console.log('The password input is inconsistent, please re-enter')
            return
        }
    } else {
        console.log('There is no account in the system, please initialize the password')
        const password01 = await inputPassword('Please enter password')
        const password02 = await inputPassword('Please confirm your password')
        if (password01 !== password02) {
            console.log('Inconsistent password input, log out of the system')
            return
        }
        password = password02
    }
    await run(password, keyStorePathAndChainConf.keystorePath, keyStorePathAndChainConf.chainType)
}

main()
    .then(() => process.exit(0))
    .catch((error: any) => {
        console.log(error.message);
        process.exit(1)
    })
