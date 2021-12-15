const EDVDF = require("../ED_VDF");
const {log} = require("../misc/utils");

module.exports = async ({PublicParameters, X}) => {
    log(`EVAL:[start]`);
    const {y: evalPrivateParameter, pi} = await EDVDF.Eval(PublicParameters, X);
    log(`EVAL:[finish]`);
    return {
        evalPrivateParameter,
        pi
    };
}