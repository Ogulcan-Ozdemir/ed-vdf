'use strict';

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
    const encrypted = cipher.update(text) + cipher.final('hex');
    return {
        iv: iv,
        encrypted: encrypted
    }
}

function decrypt({iv, key}, encrypted) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    if(!Buffer.isBuffer(encrypted)){
        encrypted = Buffer.from(encrypted, 'hex');
    }
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { decrypt, encrypt, getAsKey };