const bigintCryptoUtils = require('bigint-crypto-utils');

function primes(bitLength){
    return bigintCryptoUtils.prime(bitLength)
}

module.exports.get = primes