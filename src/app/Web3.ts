import { Contract, Provider, setMulticallAddress } from 'ethers-multicall'
import { ethers } from 'ethers'
import Web3 from 'web3'
import { Fragment, JsonFragment } from '@ethersproject/abi'
import { ChainType } from './input'

const web3 = new Web3(Web3.givenProvider);
const accountsBalanceOfMap: any = {};

const makeMultiCallContract = (contractAbi: JsonFragment[] | string[] | Fragment[], address: string) => {
    const contract = new Contract(address, contractAbi)
    return contract
}

const batchEthCall = async (chainId: string, multicallAddress: string, rpcUrl: string, ethCallLst: any[]) => {
    const httpProvider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const ethersMulticallProvider = new Provider(httpProvider)
    setMulticallAddress(Number(chainId), multicallAddress)
    await ethersMulticallProvider.init()
    let ethCallBack = [],
        sliceLst = [],
        sliceCallBack = []
    for (let i = 0; i < ethCallLst.length; i += 20) {
        sliceLst.push(ethCallLst.slice(i, i + 20))
    }
    for (let j = 0; j < sliceLst.length; j++) {
        let _sliceCallBack = await ethersMulticallProvider.all(sliceLst[j])
        sliceCallBack.push(_sliceCallBack)
    }
    for (let k = 0; k < sliceCallBack.length; k++) {
        for (let m = 0; m < sliceCallBack[k].length; m++) {
            ethCallBack.push(sliceCallBack[k][m])
        }
    }
    return ethCallBack
}

const getBatchBalanceOf = async (accounts: string[], chainType: ChainType) => {
    if (!(chainType.chainId in accountsBalanceOfMap)) {
        accountsBalanceOfMap[chainType.chainId] = {};
    }
    const ethCallList = []
    const multiCallContract = makeMultiCallContract(
        [
            {
                constant: true,
                inputs: [
                    {
                        name: 'addr',
                        type: 'address',
                    },
                ],
                name: 'getEthBalance',
                outputs: [
                    {
                        name: 'balance',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
        ],
        chainType.multicallAddress
    )
    let updateAccounts = [];
    for (const account of accounts) {
        if (!(account in accountsBalanceOfMap[chainType.chainId])) {
            updateAccounts.push(account);
            ethCallList.push(multiCallContract.getEthBalance(account))
        }
    }
    if (updateAccounts.length > 0) {
        const callBackList = await batchEthCall(chainType.chainId.toString(), chainType.multicallAddress, chainType.rpcUrl, ethCallList)
        for (let i = 0; i < updateAccounts.length; i++) {
            accountsBalanceOfMap[chainType.chainId][updateAccounts[i]] = callBackList[i];
        }
    }
    let result = [];
    for (const account of accounts) {
        result.push(accountsBalanceOfMap[chainType.chainId][account]);
    }
    return result
}

const getAddressByChecksum = async (address: string) => {
    const addr = web3.utils.toChecksumAddress(address);
    return addr;
}

const getChainId = async (rpcUrl: string) => {
    const _web3 = new Web3(Web3.givenProvider || rpcUrl);
    const chainId = await _web3.eth.getChainId();
    return chainId;
}

const signMessage = (data: string, privateKey: string) => {
    const signedData = web3.eth.accounts.sign(data, privateKey);
    return signedData.signature;
}

const updateAccountBalanceOf = async (account: string, chainType: ChainType) => {
    let _web3 = new Web3(Web3.givenProvider || chainType.rpcUrl);
    const _balance = await _web3.eth.getBalance(account);
    accountsBalanceOfMap[chainType.chainId][account] = _balance;
}

export { getBatchBalanceOf, getAddressByChecksum, getChainId, signMessage, updateAccountBalanceOf }