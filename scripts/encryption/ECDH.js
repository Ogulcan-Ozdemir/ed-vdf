const ethGate = require("../misc/ethGate");

(async () =>{
    // eccrypto()
    const gate = await ethGate.init();
    const edVdfContractABI = await gate.getEDVdfContractABI();
})();



function eccrypto(){
    const eccrypto = require("eccrypto");

    const privateKeyA = eccrypto.generatePrivate();
    const publicKeyA = eccrypto.getPublic(privateKeyA);
    const privateKeyB = eccrypto.generatePrivate();
    const publicKeyB = eccrypto.getPublic(privateKeyB);

    // Encrypting the message for B.
    eccrypto.encrypt(publicKeyB, Buffer.from("msg to b")).then(function(encrypted) {
        // B decrypting the message.
        eccrypto.decrypt(privateKeyB, encrypted).then(function(plaintext) {
            console.log("Message to part B:", plaintext.toString());
        });
    });

    // Encrypting the message for A.
    eccrypto.encrypt(publicKeyA, Buffer.from("msg to a")).then(function(encrypted) {
        // A decrypting the message.
        eccrypto.decrypt(privateKeyA, encrypted).then(function(plaintext) {
            console.log("Message to part A:", plaintext.toString());
        });
    });
}


function defaultApi(){
    const crypto = require('crypto');
    const assert = require('assert');

    // Generate Alice's keys...
    const alice = crypto.createECDH('secp256k1');
    const aliceKey = alice.generateKeys();

    // Generate Bob's keys...
    const bob = crypto.createECDH('secp256k1');
    const bobKey = bob.generateKeys();

    // Exchange and generate the secret...
    const aliceSecret = alice.computeSecret(bobKey);
    const bobSecret = bob.computeSecret(aliceKey);

    assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
}