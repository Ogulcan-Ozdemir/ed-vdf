const {describe, it, before} = require("mocha");
const {expect} = require("chai");
require("chai").use(require('chai-as-promised'));
const { ethers } = require("hardhat");

const {waitEvent, WaitEvent, log} = require('../scripts/misc/utils');
const {TIME} = require('../scripts/misc/constants');
const EDVDF = require("../scripts/ED_VDF");
const AES = require("../scripts/encryption/AES");


describe("ED_VDF contract", function () {

    const log = () => void 0;
    const CONTRACT_NAME = "ED_VDF";
    const message = "Hello";
    let EDVdfContractABI, SECRET_SHARER_PARTICIPANTS = [];

    async function sendSecretSharesToParticipants(signer, participantAddresses, shares){
        const transactions = [];
        for(let participantAddress of participantAddresses){
            const share = shares.pop();
            transactions.push(signer.sendTransaction({
                to: participantAddress,
                data: ethers.utils.hexlify(share),
            }))
        }
        return Promise.all(transactions);
    }

    before(async () => {
        EDVdfContractABI = await ethers.getContractFactory(CONTRACT_NAME);
        const accounts = (await ethers.getSigners()).slice(0, 5);
        for(let account of accounts){
            SECRET_SHARER_PARTICIPANTS.push(await account.getAddress());
        }
    });

    describe('deployment', function () {

        it("should be successful", async function () {
            const EDVdfContract = await EDVdfContractABI.deploy();
            const actualStatus = await EDVdfContract.STATUS();
            return expect(actualStatus).to.be.eql('INIT');
        });

    });

    describe('Setup', function () {

        it("should be successful with random 256 bit prime number", async function () {
            const EdVdfContract = await EDVdfContractABI.deploy();

            const event_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "SETUP(uint256)");
            const {PublicParameters, Totient, PrivateParameter} = await EDVDF.Setup(256, TIME["10s"]);

            const recipient = (await ethers.getSigners())[8];
            await EdVdfContract.Setup(PublicParameters.N, PublicParameters.Time, recipient);

            const expected_x = BigInt((await event_SETUP()).data);
            const actual_x = BigInt(await EdVdfContract.x());

            const actual_Status = await EdVdfContract.STATUS();

            return expect(actual_x).to.be.eql(expected_x)
                && expect(actual_Status).to.be.eql('SETUP');
        });

    });

    describe('EarlyDecryptionSetup', function () {

        it("should be successful with random 256 bit prime number", async function () {
            const EdVdfContract = await EDVdfContractABI.deploy();

            const event_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "SETUP(uint256)");
            const event_EARLY_DECRYPTION_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "EARLY_DECRYPTION_SETUP(string[])");

            const {PublicParameters, Totient} = await EDVDF.Setup(256, TIME["10s"]);

            const recipient = (await ethers.getSigners())[8];
            await EdVdfContract.Setup(PublicParameters.N, PublicParameters.Time, recipient);

            const expected_x = BigInt((await event_SETUP()).data);
            const actual_x = BigInt(await EdVdfContract.x());
            const {PrivateParameter} = await EDVDF.GenPrivateParameter(PublicParameters, Totient, actual_x);

            const key = AES.getAsKey(PrivateParameter);
            const {iv, encrypted} = AES.encrypt(key, message);
            await EdVdfContract.setEncryptedMessage(encrypted);
            await EdVdfContract.setEncryptedMessageIV(iv.toString('hex'));

            const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: 5, threshold: 3 });
            const shareDistribution = await sendSecretSharesToParticipants(EDVdfContractABI.signer, SECRET_SHARER_PARTICIPANTS, shares);

            await EdVdfContract.EarlyDecryptionSetup(SECRET_SHARER_PARTICIPANTS);
            await event_EARLY_DECRYPTION_SETUP();

            const actual_SECRET_SHARER_PARTICIPANTS = await EdVdfContract.get_SECRET_SHARER_PARTICIPANTS();
            return expect(actual_x).to.be.eql(expected_x)
                && expect(actual_SECRET_SHARER_PARTICIPANTS).to.be.eql(SECRET_SHARER_PARTICIPANTS);
        });

    });

    describe('Eval', function () {

        it("should be successful with random 256 bit prime number", async function () {
            const EdVdfContract = await EDVdfContractABI.deploy();

            const event_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "SETUP(uint256)");
            const event_EARLY_DECRYPTION_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "EARLY_DECRYPTION_SETUP(string[])");
            const event_EVAL = WaitEvent(EDVdfContractABI.signer.provider, "EVAL(uint256,uint256,uint256)");

            const {PublicParameters, Totient} = await EDVDF.Setup(256, TIME["10s"]);

            const recipient = (await ethers.getSigners())[8];
            await EdVdfContract.Setup(PublicParameters.N, PublicParameters.Time, recipient);

            const expected_x = BigInt((await event_SETUP()).data);
            const actual_x = BigInt(await EdVdfContract.x());
            const {PrivateParameter} = await EDVDF.GenPrivateParameter(PublicParameters, Totient, actual_x);

            const key = AES.getAsKey(PrivateParameter);
            const {iv, encrypted} = AES.encrypt(key, message);
            await EdVdfContract.setEncryptedMessage(encrypted);
            await EdVdfContract.setEncryptedMessageIV(iv.toString('hex'));

            const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: 5, threshold: 3 });
            const shareDistributionEvents = await sendSecretSharesToParticipants(EDVdfContractABI.signer, SECRET_SHARER_PARTICIPANTS, shares);

            await EdVdfContract.EarlyDecryptionSetup(SECRET_SHARER_PARTICIPANTS);
            // await event_EARLY_DECRYPTION_SETUP();

            await event_EVAL();
            await EdVdfContract.setStateToEval();
            const {y: evalPrivateParameter, pi} = await EDVDF.Eval(PublicParameters, actual_x);

            const encryptedMessage = await EdVdfContract.encryptedMessage();
            const evalKey = AES.getAsKey(evalPrivateParameter.value);
            const decryptedMessage = AES.decrypt({iv, key: evalKey}, encryptedMessage);

            const actual_Status = await EdVdfContract.STATUS();
            return expect(actual_x).to.be.eql(expected_x)
                && expect(decryptedMessage).to.be.eql(message)
                && expect(actual_Status).to.be.eql('EVAL');
        });

    });

    describe('EarlyDecryption', function () {

        it("should be successful with random 256 bit prime number", async function () {
            const EdVdfContract = await EDVdfContractABI.deploy();

            const event_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "SETUP(uint256)");
            const event_EARLY_DECRYPTION_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "EARLY_DECRYPTION_SETUP(string[])");
            const event_EVAL = WaitEvent(EDVdfContractABI.signer.provider, "EVAL(uint256,uint256,uint256)");

            const {PublicParameters, Totient} = await EDVDF.Setup(256, TIME["10s"]);

            const recipient = (await ethers.getSigners())[8];
            await EdVdfContract.Setup(PublicParameters.N, PublicParameters.Time, recipient);

            const expected_x = BigInt((await event_SETUP()).data);
            const actual_x = BigInt(await EdVdfContract.x());
            const {PrivateParameter} = await EDVDF.GenPrivateParameter(PublicParameters, Totient, actual_x);

            const key = AES.getAsKey(PrivateParameter);
            const {iv, encrypted} = AES.encrypt(key, message);
            await EdVdfContract.setEncryptedMessage(encrypted);
            await EdVdfContract.setEncryptedMessageIV(iv.toString('hex'));

            const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: 5, threshold: 3 });
            const shareDistributionEvents = await sendSecretSharesToParticipants(EDVdfContractABI.signer, SECRET_SHARER_PARTICIPANTS, shares);

            await EdVdfContract.EarlyDecryptionSetup(SECRET_SHARER_PARTICIPANTS);
            // await event_EARLY_DECRYPTION_SETUP();

            await event_EVAL();
            await EdVdfContract.setStateToEval();
            const {y: evalPrivateParameter, pi} = await EDVDF.Eval(PublicParameters, actual_x);

            const encryptedMessage = await EdVdfContract.encryptedMessage();
            const evalKey = AES.getAsKey(evalPrivateParameter.value);
            const decryptedMessage = AES.decrypt({iv, key: evalKey}, encryptedMessage);

            const actual_Status = await EdVdfContract.STATUS();
            return expect(actual_x).to.be.eql(expected_x)
                && expect(decryptedMessage).to.be.eql(message)
                && expect(actual_Status).to.be.eql('EVAL');
        });

    });

    describe('Verify', function () {

        it("should be successful with random 256 bit prime number", async function () {
            const EdVdfContract = await EDVdfContractABI.deploy();

            const event_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "SETUP(uint256)");
            const event_EARLY_DECRYPTION_SETUP = WaitEvent(EDVdfContractABI.signer.provider, "EARLY_DECRYPTION_SETUP(string[])");
            const event_EVAL = WaitEvent(EDVdfContractABI.signer.provider, "EVAL(uint256,uint256,uint256)");
            const event_VERIFY = WaitEvent(EDVdfContractABI.signer.provider, "VERIFY(address,uint256,uint256)");

            const {PublicParameters, Totient} = await EDVDF.Setup(256, TIME["10s"]);

            const recipient = (await ethers.getSigners())[8];
            await EdVdfContract.Setup(PublicParameters.N, PublicParameters.Time, recipient);

            const expected_x = BigInt((await event_SETUP()).data);
            const actual_x = BigInt(await EdVdfContract.x());
            const {PrivateParameter} = await EDVDF.GenPrivateParameter(PublicParameters, Totient, actual_x);

            const key = AES.getAsKey(PrivateParameter);
            const {iv, encrypted} = AES.encrypt(key, message);
            await EdVdfContract.setEncryptedMessage(encrypted);
            await EdVdfContract.setEncryptedMessageIV(iv.toString('hex'));

            const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: 5, threshold: 3 });
            const shareDistribution = await sendSecretSharesToParticipants(EDVdfContractABI.signer, SECRET_SHARER_PARTICIPANTS, shares);

            await EdVdfContract.EarlyDecryptionSetup(SECRET_SHARER_PARTICIPANTS);
            // await event_EARLY_DECRYPTION_SETUP();

            await event_EVAL();
            await EdVdfContract.setStateToEval();
            const {y: evalPrivateParameter, pi} = await EDVDF.Eval(PublicParameters, actual_x);
            await EdVdfContract.Verify(evalPrivateParameter.value, pi.value);

            await event_VERIFY();
            await EdVdfContract.setStateToVerify();
            await EDVDF.Verify(PublicParameters, actual_x, evalPrivateParameter, pi);

            const encryptedMessage = await EdVdfContract.encryptedMessage();
            const evalKey = AES.getAsKey(evalPrivateParameter.value);
            const decryptedMessage = AES.decrypt({iv, key: evalKey}, encryptedMessage);

            const actual_SECRET_SHARER_PARTICIPANTS = await EdVdfContract.get_SECRET_SHARER_PARTICIPANTS();
            const actual_Status = await EdVdfContract.STATUS();
            return expect(actual_x).to.be.eql(expected_x)
                && expect(actual_SECRET_SHARER_PARTICIPANTS).to.be.eql(SECRET_SHARER_PARTICIPANTS)
                && expect(decryptedMessage).to.be.eql(message)
                && expect(actual_Status).to.be.eql('VERIFY');
        });

    });



});

/*
describe('time', function () {

    const {waitEvent} = require('../scripts/misc/utils');
    const Primes = require('../scripts/misc/math/Primes');
    let VdfContract;

    function getBlockTimeAsDate(timestamp) {
        return new Date(timestamp * 1000);
    }

    before(async () => {
        VdfContract = await ethers.getContractFactory(CONTRACT_NAME);
    });

    it("calculate avgBlockTime with previous 10 blocks", async function () {
        // const localProvider = await ethers.getDefaultProvider("http://localhost:8545");


        for(let i=0; i <10; i++){
            const expected_N = await Primes.get(256);
            await VdfContract.deploy(expected_N);
        }

        const localProvider = VdfContract.signer.provider;
        let latestBlockNum = await localProvider.getBlockNumber();
        let totalDiff = 0;
        let totalCountDiff = 0;
        while (latestBlockNum > 0) {
            const latestBlockTime = getBlockTimeAsDate((await localProvider.getBlock(latestBlockNum)).timestamp);
            const prevBlockTime = getBlockTimeAsDate((await localProvider.getBlock(latestBlockNum - 1)).timestamp);
            totalDiff += latestBlockTime - prevBlockTime;
            totalCountDiff++;
            latestBlockNum--;
        }
        const avgBlockTime = Math.round(totalDiff / totalCountDiff);
        console.log(`avgBlockTime:${avgBlockTime}`);

    });
})
 */