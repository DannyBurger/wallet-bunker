"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
const Roots_1 = require("./Roots");
const resetPassword = async (oldPassword, newPassword, keyStorePath) => {
    const accounts = (0, Roots_1.getAccounts)(keyStorePath);
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < accounts.length; i++) {
        if (accounts[i].mnemonic) {
            let seed = (0, Roots_1.decryptMnemonic)(accounts[i].mnemonic, oldPassword);
            accounts[i].mnemonic = (0, Roots_1.encryptMnemonic)(seed, newPassword);
        }
        for (let j = 0; j < accounts[i].keystoreLst.length; j++) {
            const pv = (0, Roots_1.getPrivateKeyByKeystore)(accounts[i].keystoreLst[j], oldPassword);
            accounts[i].keystoreLst[j] = (0, Roots_1.getKeystoreByPrivateKey)(pv, newPassword);
        }
    }
    (0, Roots_1.updateAccounts)(accounts, keyStorePath);
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=ResetPassword.js.map