const { ethers } = require("hardhat");
const { TIME } = require("../../misc/constants");
const ethereumGate = require("../../misc/ethereumGate");
const Setup = require('../../phases/setup');
const EarlyDecryptionSetup = require('../../phases/earlyDecryptionSetup');

module.exports = async (message) => {
    const recipient = (await ethers.getSigners())[8];
    const {PrivateParameter, address} = await Setup({message, recipient, TIME: TIME["10s"]});

    const SecretSharers = await ethereumGate.getSecretSharers();
    await EarlyDecryptionSetup({PrivateParameter, SecretSharers, address});
};