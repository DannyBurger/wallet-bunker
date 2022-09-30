"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBatchBalanceOf = void 0;
const ethers_multicall_1 = require("ethers-multicall");
const ethers_1 = require("ethers");
const makeMultiCallContract = (contractAbi, address) => {
    const contract = new ethers_multicall_1.Contract(address, contractAbi);
    return contract;
};
const batchEthCall = async (chainId, multicallAddress, rpcUrl, ethCallLst) => {
    const httpProvider = new ethers_1.ethers.providers.JsonRpcProvider(rpcUrl);
    const ethersMulticallProvider = new ethers_multicall_1.Provider(httpProvider);
    (0, ethers_multicall_1.setMulticallAddress)(Number(chainId), multicallAddress);
    await ethersMulticallProvider.init();
    let ethCallBack = [], sliceLst = [], sliceCallBack = [];
    for (let i = 0; i < ethCallLst.length; i += 20) {
        sliceLst.push(ethCallLst.slice(i, i + 20));
    }
    for (let j = 0; j < sliceLst.length; j++) {
        let _sliceCallBack = await ethersMulticallProvider.all(sliceLst[j]);
        sliceCallBack.push(_sliceCallBack);
    }
    for (let k = 0; k < sliceCallBack.length; k++) {
        for (let m = 0; m < sliceCallBack[k].length; m++) {
            ethCallBack.push(sliceCallBack[k][m]);
        }
    }
    return ethCallBack;
};
const getBatchBalanceOf = async (accounts, chainType) => {
    const ethCallList = [];
    const multiCallContract = makeMultiCallContract([
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
    ], chainType.multicallAddress);
    for (const account of accounts) {
        ethCallList.push(multiCallContract.getEthBalance(account));
    }
    const callBackList = await batchEthCall(chainType.chainId.toString(), chainType.multicallAddress, chainType.rpcUrl, ethCallList);
    return callBackList;
};
exports.getBatchBalanceOf = getBatchBalanceOf;
//# sourceMappingURL=Web3.js.map