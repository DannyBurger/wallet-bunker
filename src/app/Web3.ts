import { Contract, Provider, setMulticallAddress } from 'ethers-multicall'
import { ethers } from 'ethers'
import { Fragment, JsonFragment } from '@ethersproject/abi'
import { ChainType } from './input'

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
    for (const account of accounts) {
        ethCallList.push(multiCallContract.getEthBalance(account))
    }
    const callBackList = await batchEthCall(chainType.chainId.toString(), chainType.multicallAddress, chainType.rpcUrl, ethCallList)
    return callBackList
}

export { getBatchBalanceOf }
