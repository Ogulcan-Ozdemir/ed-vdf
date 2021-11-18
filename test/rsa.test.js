const {describe, it, before} = require("mocha");
require("chai").use(require('chai-as-promised'));
const {expect} = require("chai");

describe("RSA", function () {

    const RSA = require('../scripts/RSA');

    it("Setup should be successfully return {SecretKeys, PublicKeys} with bit length 256", async function () {
        const {SecretKeys, PublicKeys} = await RSA.Setup(256);
        return expect(typeof SecretKeys.Totient).to.be.eql('bigint')
            && expect(typeof SecretKeys.d).to.be.eql('bigint')
            && expect(typeof PublicKeys.N).to.be.eql('bigint')
            && expect(typeof PublicKeys.e).to.be.eql('bigint')
            && expect(PublicKeys.e).to.be.equal(65537n);
    });


});
