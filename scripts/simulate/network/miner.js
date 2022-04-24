const {ethers} = require('hardhat');
const { log } = require('../../misc/utils');
const {EVENTS, PHASES} = require('../../misc/constants');
const ethereumGate = require("../../misc/ethereumGate");
const Math = require("../../misc/math");
const Eval = require("../../phases/eval");
const EarlyDecryption = require("../../phases/earlyDecryption");
const Verify = require("../../phases/verify");
const AES = require("../../encryption/AES");

async function listenEval(){
        const EDVdfContractABI = await ethereumGate.getEDVdfContractABI();
        const listen = ethereumGate.initListener(EDVdfContractABI.signer.provider);
        listen(EVENTS.EVAL, async (event) => {
                const EDVDFContract = await ethereumGate.getContractAt(event.address);

                try{
                        await EDVDFContract.setStateToEval();
                }catch (error){
                        const status = await EDVDFContract.STATUS();
                        log(`listenEval:pass:${event.address} status is :${status}`);
                        return;
                }

                const N = Math.toBigInt((await EDVDFContract.N()).toBigInt());
                const Time = Math.toBigInt((await EDVDFContract.Time()).toBigInt());
                const X = Math.toBigInt((await EDVDFContract.x()).toBigInt());
                const {evalPrivateParameter, pi} = await Eval({ PublicParameters: { N, Time }, X });

                await EDVDFContract.Verify(evalPrivateParameter.value, pi.value);
        });
}

async function listenEarlyDecryption(){
        const EDVdfContractABI = await ethereumGate.getEDVdfContractABI();
        const listen = ethereumGate.initListener(EDVdfContractABI.signer.provider);
        listen(EVENTS.EARLY_DECRYPTION, async (event) => {
                const EDVDFContract = await ethereumGate.getContractAt(event.address);

                const N = Math.toBigInt((await EDVDFContract.N()).toBigInt());
                const Time = Math.toBigInt((await EDVDFContract.Time()).toBigInt());
                const X = Math.toBigInt((await EDVDFContract.x()).toBigInt());

                const {evalPrivateParameter, pi} = await EarlyDecryption({ PublicParameters: { N, Time }, X });

                await EDVDFContract.Verify(evalPrivateParameter.value, pi.value);
        });
}

async function listenVerify(){
        const EDVdfContractABI = await ethereumGate.getEDVdfContractABI();
        const listen = ethereumGate.initListener(EDVdfContractABI.signer.provider);
        const iface = new ethers.utils.Interface([
                'event VERIFY(address from, uint256 _EvalPrivateParameter, uint256 _EvalProof)'
        ])
        listen(EVENTS.VERIFY, async (event) => {
                const EDVDFContract = await ethereumGate.getContractAt(event.address);

                try{
                        await EDVDFContract.setStateToVerify();
                }catch (error){
                        const status = await EDVDFContract.STATUS();
                        log(`listenVerify:pass:${event.address} status is :${status}`);
                        return;
                }

                const args = iface.parseLog(event).args;
                const evalPrivateParameter = Math.toBigInt(args[1].toBigInt());
                const pi = Math.toBigInt(args[2].toBigInt());

                const N = Math.toBigInt((await EDVDFContract.N()).toBigInt());
                const Time = Math.toBigInt((await EDVDFContract.Time()).toBigInt());
                const X = Math.toBigInt((await EDVDFContract.x()).toBigInt());
                const iv = (await EDVDFContract.iv()).toString();

                await Verify({
                        PublicParameters: { N, Time },
                        PrivateParameter: evalPrivateParameter,
                        X,
                        pi,
                });

                const encryptedMessage = await EDVDFContract.encryptedMessage();
                const evalKey = AES.getAsKey(evalPrivateParameter.value);
                const decryptedMessage = AES.decrypt({iv, key: evalKey}, encryptedMessage);

                log(`listenVerify:decryptedMessage:${decryptedMessage}`);
        });
}

module.exports = async () => {
        await listenEval();
        await listenEarlyDecryption();
        await listenVerify();
}