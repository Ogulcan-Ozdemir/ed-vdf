const ethGate = require('../misc/ethGate');
const EDVDF = require("../ED_VDF");
const {log} = require("../misc/utils");

(async () => {
    log(`earlyDecryption[start]:message`);
    const gate = await ethGate.init();
    const EDVdfContractABI = await gate.getEDVdfContractABI();
    const secretSharers = await EDVdfContractABI.getSecretSharers(5);
    const shares = JSON.parse(JSON.stringify(secretSharers));
    const shareDistribution = await EDVdfContractABI.sendSecretSharesToParticipants(secretSharers, shares);
    const transfers = await EDVdfContractABI.getTransferLogsFor(secretSharers[3]);
    debugger;
    log(`earlyDecryption[shareDistribution]`);
})();

// module.exports = async ({ PrivateParameter, SecretSharers, address}) => {
//     const threshold = validateSecretSharersAndGetThreshold(SecretSharers);
//     const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: SecretSharers.length, threshold });
//     const EDVdfContractABI = await ethereumGate.getContractAt(address);
//     const shareDistribution = await ethereumGate.sendSecretSharesToParticipants(EDVdfContractABI.signer, SecretSharers, shares);
//     await EDVdfContractABI.EarlyDecryptionSetup(SecretSharers);
// }
//
// function validateSecretSharersAndGetThreshold(SecretSharers){
//     if(!Array.isArray(SecretSharers) ){
//         throw new Error(`SecretSharers must be array`)
//     }
//     if(SecretSharers.length < 2){
//         throw new Error(`SecretSharers count must be greater than 2`)
//     }
//     const threshold = Math.ceil(SecretSharers.length / 2);
//     if(threshold > (SecretSharers.length - 1)){
//         throw new Error(`SecretSharers threshold count must be less than ${SecretSharers.length - 1}`)
//     }
//     return threshold;
// }