const sss = require('shamirs-secret-sharing');
const MathUtils = require('../scripts/misc/math/index');
const encodings = ["ascii", "utf8", "utf-8", "utf16le", "ucs2", "ucs-2", "base64", "latin1", "binary", "hex"];

const self = {
    construct(secret, {shares, threshold}) {
        return sss.split(secret, {shares, threshold})
    },
    _reconstruct(shares) {
        return sss.combine(shares);
    },
    reconstruct(shares, encoding = 'utf-8') {
        const reconstructed = self._reconstruct(shares).toString(encoding);
        try{
            return MathUtils.toBigInt(reconstructed).value;
        }catch (error){
            if(error.message.startsWith("Invalid integer")){
                throw new Error(`reconstruct:shares:${shares.length}: can not reconstructed`);
            }
            throw new Error(`reconstruct:shares:${shares.length}: unknown error:${error}`);

        }
    },
    _reconstructWithEveryEncoding(shares) {
        const encondedSecretMap = {};
        for (let encoding of encodings) {
            try {
                encondedSecretMap[encoding] = self._reconstruct(shares).toString(encoding);
            } catch (error) {
                console.error(new Date().toISOString(), `${encoding}:_reconstructWithEveryEncoding: ${error}`);
                encondedSecretMap[encoding] = undefined;
            }

        }
        return encondedSecretMap;
    },
    _encodings: encodings,
}


module.exports = self;