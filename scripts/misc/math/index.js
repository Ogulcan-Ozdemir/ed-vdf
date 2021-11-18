const BigInteger = require('big-integer');
const bigintCryptoUtils = require('bigint-crypto-utils');
const IntegerByte = require('./IntegerByte');

module.exports.BigInteger = BigInteger;

function toBigInt(num){
    return BigInteger(num);
}
module.exports.toBigInt = toBigInt;

function toNumber(num){
    if(typeof num === "bigint"){
        return BigInteger(num).toJSNumber();
    }
    const convertedNum = Number(num);
    if(convertedNum === Number.NaN){
        throw new Error(`toNumber error ${num} converted as Number.NaN`)
    }
    if(convertedNum === Number.POSITIVE_INFINITY){
        throw new Error(`toNumber error ${num} converted as Number.POSITIVE_INFINITY`)
    }
    if(convertedNum === Number.NEGATIVE_INFINITY){
        throw new Error(`toNumber error ${num} converted as Number.NEGATIVE_INFINITY`)
    }
    return convertedNum;
}
module.exports.toNumber = toNumber;

module.exports.lenBase10 = (num) => Math.ceil(Math.log10(toNumber(num) + 1));

module.exports.bitLenBase10 = (num) => IntegerByte.toBigEndian(toBigInt(Math.ceil(Math.log10(toNumber(num) + 1))));

function getRandomBigInt(min, max){
    return bigintCryptoUtils.randBetween(max, min);
}
module.exports.getRandomBigInt = getRandomBigInt;