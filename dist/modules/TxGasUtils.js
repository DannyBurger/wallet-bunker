"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasUtil = void 0;
const HttpProvider = require('ethjs-provider-http');
const EthQuery = require('ethjs-query');
const { BN } = require('bn.js');
const { stripHexPrefix } = require('ethereumjs-util');
function hexToBn(inputHex) {
    return new BN(stripHexPrefix(inputHex.toString('hex')), 16);
}
const addHexPrefix = (str) => {
    if (typeof str !== 'string' || str.match(/^-?0x/u)) {
        return str;
    }
    if (str.match(/^-?0X/u)) {
        return str.replace('0X', '0x');
    }
    if (str.startsWith('-')) {
        return str.replace('-', '-0x');
    }
    return `0x${str}`;
};
function BnMultiplyByFraction(targetBN, numerator, denominator) {
    const numBN = new BN(numerator);
    const denomBN = new BN(denominator);
    return targetBN.mul(numBN).div(denomBN);
}
function bnToHex(inputBn) {
    return addHexPrefix(inputBn.toString(16));
}
class GasUtil {
    query;
    constructor(rpcUrl) {
        this.query = new EthQuery(new HttpProvider(rpcUrl));
    }
    async analyzeGasUsage(txParams) {
        const block = await this.query.getBlockByNumber('latest', false);
        const blockGasLimitBN = hexToBn(block.gasLimit);
        const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20);
        let estimatedGasHex = bnToHex(saferGasLimitBN);
        let simulationFails;
        try {
            estimatedGasHex = await this.estimateTxGas(txParams);
        }
        catch (error) {
            simulationFails = {
                reason: error.message,
                errorKey: error.errorKey,
                debug: {
                    blockNumber: block.number,
                    blockGasLimit: block.gasLimit
                },
            };
        }
        return {
            blockGasLimit: block.gasLimit,
            estimatedGasHex,
            simulationFails
        };
    }
    async estimateTxGas(txParams) {
        delete txParams.gasPrice;
        return await this.query.estimateGas(txParams);
    }
    addGasBuffer(initialGasLimitHex, blockGasLimitHex, multiplier = 1.5) {
        const initialGasLimitBn = hexToBn(initialGasLimitHex);
        const blockGasLimitBn = hexToBn(blockGasLimitHex);
        const upperGasLimitBn = blockGasLimitBn.muln(0.9);
        const bufferedGasLimitBn = initialGasLimitBn.muln(multiplier);
        if (initialGasLimitBn.gt(upperGasLimitBn)) {
            return bnToHex(initialGasLimitBn);
        }
        if (bufferedGasLimitBn.lt(upperGasLimitBn)) {
            return bnToHex(bufferedGasLimitBn);
        }
        return bnToHex(upperGasLimitBn);
    }
    async getBufferedGasLimit(txParams, multiplier) {
        const { blockGasLimit, estimatedGasHex, simulationFails, } = await this.analyzeGasUsage(txParams);
        const gasLimit = this.addGasBuffer(addHexPrefix(estimatedGasHex), blockGasLimit, multiplier);
        return {
            gasLimit,
            simulationFails
        };
    }
    async getGasPrice() {
        const gasPrice = await this.query.gasPrice();
        return gasPrice;
    }
}
exports.GasUtil = GasUtil;
//# sourceMappingURL=TxGasUtils.js.map