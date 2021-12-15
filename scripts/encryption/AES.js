const crypto = require('crypto');
const IV_LENGTH = 16;

function getAsKey(key){
    if(!Buffer.isBuffer(key)){
        return Buffer.from(key.toString()).slice(0, 32);
    }
    return key;
}

function encrypt(key, text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return {
        iv: iv,
        encrypted: encrypted
    }
}

function decrypt({iv, key}, encrypted) {
    if(!Buffer.isBuffer(iv)){
        iv = Buffer.from(iv, 'hex');
    }
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
}

module.exports = { decrypt, encrypt, getAsKey };