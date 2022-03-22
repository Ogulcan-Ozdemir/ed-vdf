const ethereumGate = require('../misc/ethereumGate');
const EDVDF = require("../ED_VDF");
const AES = require("../encryption/AES");
const { log } = require('../misc/utils');

module.exports = async ({message, recipient, TIME}) => {
    const EDVdfContractABI = await ethereumGate.getEDVdfContractABI();
    const {PublicParameters, Totient} = await EDVDF.Setup(256, TIME);
    const EDVdfContract = await EDVdfContractABI.deploy();
    log(`setup:deploy:address:${EDVdfContract.address}`)
    await EDVdfContract.Setup(PublicParameters.N, PublicParameters.Time, recipient);
    const X = BigInt(await EDVdfContract.x());
    const {PrivateParameter} = await EDVDF.GenPrivateParameter(PublicParameters, Totient, X);
    const key = AES.getAsKey(PrivateParameter);
    const {iv, encrypted} = AES.encrypt(key, message);
    await EDVdfContract.setEncryptedMessage(encrypted);
    await EDVdfContract.setEncryptedMessageIV(iv.toString('hex'));
    return {
        PrivateParameter,
        address: EDVdfContract.address,
    };
}
