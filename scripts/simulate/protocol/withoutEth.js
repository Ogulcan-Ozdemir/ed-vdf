const {log} = require("../../misc/utils");
const EDVDF = require('../../ED_VDF');
const {TIME} = require('../../misc/constants');
const AES = require('../../encryption/AES');

(async () => {
    const tasks = [];
    for (let i = 0; i < 1; i++) {
        tasks.push(test(i));
    }
    await Promise.all(tasks);
})();

async function test(id){
    const X = 1337;
    const { PublicParameters, Totient } = await EDVDF.Setup(256, TIME["1m"]);
    log(`EDVDF:Setup:N:${PublicParameters.N}:Time:${PublicParameters.Time}:Totient:${Totient}`);

    const { PrivateParameter } = await EDVDF.GenPrivateParameter(PublicParameters, Totient, X);

    const key = AES.getAsKey(PrivateParameter);
    const {iv, encrypted} = AES.encrypt(key, "Hello World:" + id);

    const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: 5, threshold: 3 });
    log(`EDVDF:EarlyDecryptionSetup:${shares.length}`);

    console.time("EVAL" + id);
    const {y: eval_PrivateParameter, pi} = await EDVDF.Eval(PublicParameters, X);
    console.timeEnd("EVAL" + id);
    log(`EDVDF:Eval eval_y:${eval_PrivateParameter.toString()}`);

    await EDVDF.Verify(PublicParameters, X, eval_PrivateParameter, pi);
    log(`EDVDF:Verify`);

    const recoveredSecret = EDVDF.EarlyDecryption(shares.slice(1, 4));
    log(`EDVDF:reconstruct:${recoveredSecret}`);
    if(recoveredSecret.toString() === eval_PrivateParameter.toString()){
        const key = AES.getAsKey(recoveredSecret);
        const decrypted = AES.decrypt({iv, key}, encrypted);
        log(`Success recoveredSecret ${decrypted}`);
        return;
    }
    return process.exit(1);
}