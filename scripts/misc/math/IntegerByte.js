const BigInteger = require('big-integer');
const zero = BigInteger(0);
const one = BigInteger(1);
const n256 = BigInteger(256);
const {Buffer} = require('buffer');

function fromLittleEndian(bytes) {
    let result = zero;
    let base = one;
    bytes.forEach(function (byte) {
        result = result.add(base.multiply(BigInteger(byte)));
        base = base.multiply(n256);
    });
    return result;
}

function fromBigEndian(bytes) {
    return fromLittleEndian(bytes.reverse());
}

function toLittleEndian(bigNumber) {
    let result = new Uint8Array(32);
    let i = 0;
    while (bigNumber.greater(zero)) {
        result[i] = bigNumber.mod(n256);
        bigNumber = bigNumber.divide(n256);
        i += 1;
    }
    return Buffer.from(result);
}

function toBigEndian(number) {
    return toLittleEndian(number).reverse();
}

module.exports = {
    toBigEndian,
    toLittleEndian,
    fromBigEndian,
    fromLittleEndian,
};