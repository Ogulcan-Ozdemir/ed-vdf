const { log } = require('../misc/utils');
const EDVDF = require("../ED_VDF");

module.exports = async ({PublicParameters, X, PrivateParameter, pi}) => {
    await EDVDF.Verify(PublicParameters, X, PrivateParameter, pi);
}