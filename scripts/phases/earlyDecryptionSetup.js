const ethereumGate = require('../misc/ethereumGate');
const EDVDF = require("../ED_VDF");

module.exports = async ({ PrivateParameter, SecretSharers, address}) => {
    const threshold = validateSecretSharersAndGetThreshold(SecretSharers);
    const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: SecretSharers.length, threshold });
    const EDVdfContractABI = await ethereumGate.getContractAt(address);
    await ethereumGate.sendSecretSharesToParticipants(EDVdfContractABI.signer, SecretSharers, shares);
    await EDVdfContractABI.EarlyDecryptionSetup(SecretSharers);
}

function validateSecretSharersAndGetThreshold(SecretSharers){
    if(!Array.isArray(SecretSharers) ){
        throw new Error(`SecretSharers must be array`)
    }
    if(SecretSharers.length < 2){
        throw new Error(`SecretSharers count must be greater than 2`)
    }
    const threshold = Math.ceil(SecretSharers.length / 2);
    if(threshold > (SecretSharers.length - 1)){
        throw new Error(`SecretSharers threshold count must be less than ${SecretSharers.length - 1}`)
    }
    return threshold;
}
