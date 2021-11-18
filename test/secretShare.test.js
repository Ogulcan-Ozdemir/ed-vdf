const {describe, it, before} = require("mocha");
require("chai").use(require('chai-as-promised'));
const {expect} = require("chai");

describe("SecretShare", function () {

    const Math = require('../scripts/misc/math/index');
    const SecretShare = require('../scripts/SecretShare');

    it("construct for 5 shares should be successfully return {Array(5){Buffer(18)}}", async function () {
        const secret_key = Math.getRandomBigInt(99n, 256n);
        const shares = SecretShare.construct(Buffer.from(secret_key.toString()), { shares: 5, threshold: 3 });
        return expect(shares).to.have.lengthOf(5);
    });

    describe("reconstruct", function () {

        it("with 3 shares for threshold 3 should be equal {secret_key}", async function () {
            const secret_key = Math.getRandomBigInt(99n, 256n);
            const shares = SecretShare.construct(Buffer.from(secret_key.toString()), { shares: 5, threshold: 3 });
            const reconstruct_secret_key = SecretShare.reconstruct(shares.slice(0, 3));
            return expect(reconstruct_secret_key).to.be.eql(secret_key);
        });

        it("with 4 shares for threshold 3 should be equal {secret_key}", async function () {
            const secret_key = Math.getRandomBigInt(99n, 256n);
            const shares = SecretShare.construct(Buffer.from(secret_key.toString()), { shares: 5, threshold: 3 });
            const reconstruct_secret_key = SecretShare.reconstruct(shares.slice(0, 4));
            return expect(reconstruct_secret_key).to.be.eql(secret_key);
        });

        it("_reconstructWithEveryEncoding with 3 shares for threshold 3 should be return {secret_key} for each SecretShare._encodings", async function () {
            const secret_key = Math.getRandomBigInt(99n, 256n);
            const shares = SecretShare.construct(Buffer.from(secret_key.toString()), { shares: 5, threshold: 3 });
            const reconstruct_secret_keys = SecretShare._reconstructWithEveryEncoding(shares.slice(0, 4));
            return expect(Object.keys(reconstruct_secret_keys)).to.have.lengthOf(10)
        });

        it("with 2 shares for threshold 3 should throw {`reconstruct:shares:2: can not reconstructed`}", async function () {
            const secret_key = Math.getRandomBigInt(99n, 256n);
            const shares = SecretShare.construct(Buffer.from(secret_key.toString()), { shares: 5, threshold: 3 });
            return expect(() => SecretShare.reconstruct(shares.slice(0, 2))).to.be.throw(`reconstruct:shares:2: can not reconstructed`)
        });

    });



});
