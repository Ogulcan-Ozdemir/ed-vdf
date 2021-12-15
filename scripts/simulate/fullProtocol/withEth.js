const {log, WaitEvent} = require("../../misc/utils");
const ethereumGate = require("../../misc/ethereumGate");
const {ethers} = require("hardhat");
const EDVDF = require("../../ED_VDF");
const {TIME} = require("../../misc/constants");
const AES = require("../../encryption/AES");

(async (message) => {
    log(`EDVDF[start]:message:plain:${message}`);

    const SECRET_SHARER_PARTICIPANTS = await ethereumGate.getSecretSharers();
    const recipient = (await ethers.getSigners())[8];

    const EDVdfContractABI = await ethereumGate.getEDVdfContractABI();
    const EDVdfContract = await EDVdfContractABI.deploy();
    log(`EDVDF[STATUS]:${await EDVdfContract.STATUS()}`);

    const event_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "SETUP(uint256)");
    const event_EARLY_DECRYPTION_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "EARLY_DECRYPTION_SETUP(string[])");
    const event_EVAL = WaitEvent(EDVdfContractABI.signer.provider, "EVAL(uint256,uint256,uint256)");
    const event_VERIFY = WaitEvent(EDVdfContractABI.signer.provider, "VERIFY(address,uint256,uint256)");

    const { PublicParameters, Totient } = await EDVDF.Setup(256, TIME["1m"]);
    await EDVdfContract.Setup(PublicParameters.N, PublicParameters.Time, recipient);
    await event_SETUP();
    log(`EDVDF[STATUS]:${await EDVdfContract.STATUS()}`);

    const X = BigInt(await EDVdfContract.x());
    const { PrivateParameter } = await EDVDF.GenPrivateParameter(PublicParameters, Totient, X);

    const key = AES.getAsKey(PrivateParameter);
    const {iv, encrypted} = AES.encrypt(key, message);
    await EDVdfContract.setEncryptedMessage(encrypted);

    const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: 5, threshold: 3 });
    const shareDistribution = await ethereumGate.sendSecretSharesToParticipants(EDVdfContractABI.signer, SECRET_SHARER_PARTICIPANTS, shares);
    await EDVdfContract.EarlyDecryptionSetup(SECRET_SHARER_PARTICIPANTS);

    await Promise.allSettled([
        event_EARLY_DECRYPTION_SETUP(),
        event_EVAL(),
    ]);

    await EDVdfContract.setStateToEval();
    log(`EDVDF[STATUS]:${await EDVdfContract.STATUS()}`);
    const {y: evalPrivateParameter, pi} = await EDVDF.Eval(PublicParameters, X);
    await EDVdfContract.Verify(evalPrivateParameter.value, pi.value);

    await event_VERIFY();
    await EDVdfContract.setStateToVerify();
    log(`EDVDF[STATUS]:${await EDVdfContract.STATUS()}`);
    await EDVDF.Verify(PublicParameters, X, evalPrivateParameter, pi);

    const encryptedMessage = await EDVdfContract.encryptedMessage();
    const evalKey = AES.getAsKey(evalPrivateParameter.value);
    const decryptedMessage = AES.decrypt({iv, key: evalKey}, encryptedMessage);

    log(`EDVDF[finish]:message:decrypted:${decryptedMessage}`);
})("test");