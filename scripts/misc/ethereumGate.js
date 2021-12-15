const {CONTRACT_NAME} = require("./constants");
const {ethers} = require("hardhat");

function getEthers(){
    const {ethers} = require("hardhat");
    const url = 'http://localhost:8545/';
    ethers.provider = new ethers.providers.JsonRpcProvider(url);
    return ethers;
}

module.exports.getEDVdfContractABI = async () => {
    const EDVdfContractABI = await getEthers().getContractFactory(CONTRACT_NAME);
    EDVdfContractABI.signer.provider.pollingInterval = 1000;
    return EDVdfContractABI;
};

module.exports.getContractAt = async (contractAddress) => {
    const EDVdfContractABI = await getEthers().getContractAt(CONTRACT_NAME, contractAddress);
    EDVdfContractABI.signer.provider.pollingInterval = 1000;
    return EDVdfContractABI;
}

module.exports.initListener = (provider) => {
    return (eventName, cb) => {
        const filter = {
            topics: [
                ethers.utils.id(eventName),
            ]
        }
        function listener(...args) {
            cb(...args);
        }
        provider.on(filter, listener);
        return {
            off: () => provider.off(eventName, listener),
        }
    }
}

module.exports.getSecretSharers = async function(){
    const accounts = (await ethers.getSigners()).slice(0, 5);
    const participants = [];
    for(let account of accounts){
        participants.push(await account.getAddress());
    }
    return participants;
}

module.exports.sendSecretSharesToParticipants = async function(signer, participantAddresses, shares){
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