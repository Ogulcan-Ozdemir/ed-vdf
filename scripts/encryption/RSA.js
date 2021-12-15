const bigintCryptoUtils = require('bigint-crypto-utils');

module.exports = {
    async Setup(Lambda) {

        let p = await bigintCryptoUtils.prime(Lambda);
        let q = await bigintCryptoUtils.prime(Lambda);

        while (p === q) {
            q = await bigintCryptoUtils.prime(Lambda);
        }

        const N = p * q;
        const big1 = BigInt(1);
        const Totient = (p - big1) * (q - big1) // group order

        const e = BigInt(65537);
        const d = bigintCryptoUtils.modInv(e, Totient);

        const SecretKeys = {Totient, d};
        const PublicKeys = {N, e};
        return {SecretKeys, PublicKeys};
    },
}