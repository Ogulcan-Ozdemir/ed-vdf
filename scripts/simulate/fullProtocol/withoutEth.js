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
    const x = 1337;
    const {PublicParameters, Totient, PrivateParameter} = await EDVDF.Setup(256, TIME["10s"]);
    console.log(new Date().toISOString(), `EDVDF:Setup:N:${PublicParameters.N}:Time:${PublicParameters.Time}:Totient:${Totient}:PrivateParameter:${PrivateParameter}`);

    const key = AES.getAsKey(PrivateParameter);
    const {iv, encrypted} = AES.encrypt(key, "Hello");

    const shares = EDVDF.EarlyDecryptionSetup(Buffer.from(PrivateParameter.toString()), { shares: 5, threshold: 3 });
    console.log(new Date().toISOString(), `EDVDF:EarlyDecryptionSetup:${shares.length}`);

    console.time("EVAL" + id);
    const {y: eval_PrivateParameter, pi} = await EDVDF.Eval(PublicParameters, x);
    console.timeEnd("EVAL" + id);
    console.log(new Date().toISOString(), `EDVDF:Eval eval_y:${eval_PrivateParameter.toString()}`);

    await EDVDF.Verify(PublicParameters, x, eval_PrivateParameter, pi);
    console.log(new Date().toISOString(), `EDVDF:Verify`);

    const recoveredSecret = EDVDF.EarlyDecryption(shares.slice(1, 4));
    console.log(new Date().toISOString(), `EDVDF:reconstruct:${recoveredSecret}`);
    if(recoveredSecret.toString() === eval_PrivateParameter.toString()){
        const key = AES.getAsKey(recoveredSecret);
        const decrypted = AES.decrypt({iv, key}, encrypted);
        console.log(new Date().toISOString(), `Success recoveredSecret ${decrypted}`);
        return;
    }
    return process.exit(1);
}