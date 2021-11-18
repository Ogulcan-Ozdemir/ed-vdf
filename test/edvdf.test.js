const {describe, it, before} = require("mocha");
require("chai").use(require('chai-as-promised'));
const {expect} = require("chai");
const BigInteger = require('big-integer');

describe("ED-VDF", function () {

    const MathUtils = require('../scripts/misc/math');
    const constants = require('../scripts/constants');
    const EDVDF = require('../scripts/ED_VDF');

    const RSA_KEYS_BIT_LENGTH = 256;
    const X = 1337;

    it("Setup should be successfully return {PublicParameters[N, Time_10s], PrivateParameters}", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        return expect(typeof PublicParameters.N).to.be.eql('bigint')
            && expect(PublicParameters.Time).to.be.eql(constants.TIME["10s"])
            && expect(typeof Totient).to.be.eql('bigint');
    });

    it("GenPrivateParameter should be successfully return {y, pi}", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const {PrivateParameter, pi} = await EDVDF.GenPrivateParameter(PublicParameters, Totient, X);
        return expect(BigInteger.isInstance(PrivateParameter)).to.be.true
            && expect(BigInteger.isInstance(pi)).to.be.true;
    });

    it("ShortCircuitEval should be successfully return y", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const y = await EDVDF.ShortCircuitEval(PublicParameters, Totient, X);
        return expect(BigInteger.isInstance(y)).to.be.true;
    });

    it("EarlyDecryptionSetup should be successfully return SharedPrivateParameters", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const PrivateParameter = await EDVDF.ShortCircuitEval(PublicParameters, Totient, X);
        const SharedPrivateParameters = EDVDF.EarlyDecryptionSetup(PrivateParameter, { shares: 5, threshold: 3 });
        return expect(Array.isArray(SharedPrivateParameters)).to.be.true;
    });

    it("EarlyDecryption ReconstructedPrivateParameter should be equal PrivateParameter", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const PrivateParameter = await EDVDF.ShortCircuitEval(PublicParameters, Totient, X);
        const SharedPrivateParameters = EDVDF.EarlyDecryptionSetup(PrivateParameter, { shares: 5, threshold: 3 });
        const ReconstructedPrivateParameter = EDVDF.EarlyDecryption(SharedPrivateParameters.slice(1, 4));
        return expect(ReconstructedPrivateParameter).to.be.eql(PrivateParameter.value);
    });

    it("Eval should be successfully return {y, pi}", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const {y, pi} = await EDVDF.Eval(PublicParameters, X);
        return expect(BigInteger.isInstance(y)).to.be.true
            && expect(BigInteger.isInstance(pi)).to.be.true;
    });

    it("_Eval should be successfully return y", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const y = await EDVDF._Eval(PublicParameters, X);
        return expect(BigInteger.isInstance(y)).to.be.true;
    });

    it("Verify should be successfully return true", async function () {
        const {PublicParameters, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const {y, pi} = await EDVDF.Eval(PublicParameters, X);
        const t = await EDVDF.Verify(PublicParameters, X, y, pi);
        return expect(t).to.be.true;
    });

    it("HPrime should be successfully return Challenge", async function () {
        const {PublicParameters: {N, Time}, Totient} = await EDVDF.Setup(RSA_KEYS_BIT_LENGTH, constants.TIME["10s"]);
        const {y, pi} = await EDVDF.GenPrivateParameter({N, Time}, Totient, X);
        const Challenge = await EDVDF.HPrime(N, Time, X, y);
        return expect(typeof Challenge === "bigint").to.be.true;
    });

});
