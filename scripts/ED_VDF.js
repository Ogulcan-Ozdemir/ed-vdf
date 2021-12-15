const {Buffer} = require('buffer');
const bigintCryptoUtils = require('bigint-crypto-utils');
const keccak = require('keccak');
const BigInteger = require('big-integer');
const integerByte = require('./misc/math/IntegerByte');
const RSA = require('./encryption/RSA');
const SecretShare = require("./encryption/ShamirSecretShare");

const self = {
    async Setup(Size, Time) {
        const flooredSize = ~~(Size / 2); // floor div
        const {SecretKeys, PublicKeys} = await RSA.Setup(flooredSize);
        const {Totient, d} = SecretKeys;
        const {N, e} = PublicKeys;
        const PublicParameters = {N, Time};
        // Trap = Totient
        return {PublicParameters, Totient};
    },
    async GenPrivateParameter(PublicParameters, Totient, x) {
        const PrivateParameter = await self.ShortCircuitEval(PublicParameters, Totient, x);
        const {N, Time} = PublicParameters;
        const Challenge = BigInteger(await self.HPrime(N, Time, x, PrivateParameter));
        const bigIntTime = BigInteger(Time);
        const residue = BigInteger(2).modPow(bigIntTime, Challenge)
        const t1 = BigInteger(2).modPow(Time, Totient).subtract(residue);
        const t2 = t1.multiply(BigInteger(bigintCryptoUtils.modInv(Challenge.value, Totient)));
        const exponent = t2.mod(BigInteger(Totient));
        const pi = BigInteger(x).modPow(exponent, BigInteger(N))
        return {PrivateParameter, pi};
    },
    async ShortCircuitEval(PublicParameters, Totient, x) {
        const {N, Time} = PublicParameters;
        const exponent = BigInteger(2).modPow(Time, Totient);
        return BigInteger(x).modPow(exponent, N);
    },
    EarlyDecryptionSetup(secret, {shares, threshold}){
        return SecretShare.construct(Buffer.from(secret.toString()), { shares, threshold });
    },
    EarlyDecryption(shares){
        return SecretShare.reconstruct(shares);
    },
    Eval(PublicParameters, x) {
        return new Promise(async (resolve, reject) => {
            const y = await self._Eval(PublicParameters, x);
            let {N, Time} = PublicParameters;

            // long-division algorithm
            let pi = BigInteger(1);
            const Challenge = BigInteger(await self.HPrime(N, Time, x, y));

            function longDivision(Challenge, residue) {
                if (Time === 0) {
                    return resolve({y, pi});
                }
                Time -= 1;

                const bit = ~~(BigInteger(2).multiply(residue) / Challenge);  // floor div
                residue = BigInteger(2).multiply(residue).mod(Challenge);
                pi = pi.pow(2).multiply(BigInteger(x).pow(bit)).mod(BigInteger(N));
                process.nextTick(longDivision, Challenge, residue);
            }

            process.nextTick(longDivision, Challenge, BigInteger(1));
        })
    },
    async _Eval(PublicParameters, x) {
        return new Promise((resolve, reject) => {
            let {N, Time} = PublicParameters;

            function getExponent(y) {
                if (Time === 0) {
                    return resolve(y);
                }
                Time -= 1;
                y = BigInteger(y).modPow(2, N);
                process.nextTick(getExponent, y)
            }

            process.nextTick(getExponent, x);
        });
    },
    async Verify(PublicParameters, x, y, pi) {
        const {N, Time} = PublicParameters;
        const Challenge = await self.HPrime(N, Time, x, y);
        const residue = BigInteger(2).modPow(Time, Challenge);
        return BigInteger(pi).modPow(Challenge, N)
                             .multiply(BigInteger(x).modPow(residue, N))
                             .mod(BigInteger(N))
                             .equals(y);
    },
    async HPrime(_N, _Time, _x, _y) {
        // due to current version of solidity limitations and performance issues prime number length reduced to 253 bits
        const concatenated = packToEth(_N) + packToEth(_Time) + packToEth(_x) + packToEth(_y);
        const digestedHash = keccak('keccak256').update(concatenated).digest('hex');
        let p = BigInt(`0x${digestedHash}`) >> 3n;

        if (p % 2n === 0n) {
            p += 1n;
        }
        while (!(await bigintCryptoUtils.isProbablyPrime(p))) {
            p += 2n;
        }
        return p;
    }
}

module.exports = self;

function packToEth(int) {
    const byte = integerByte.toBigEndian(BigInteger(int));
    return Buffer.from(byte);
}