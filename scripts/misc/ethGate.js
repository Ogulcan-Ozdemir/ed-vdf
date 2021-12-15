const {CONTRACT_NAME} = require("./constants");

module.exports.init = async (url) => {
    const ethers = getEthers(url);
    const injectHelpers = (EDVdfContractABI) => {
        EDVdfContractABI.getSecretSharers = async function (count = 1) {
            const accounts = (await ethers.getSigners()).slice(0, count);
            const participants = [];
            for (let account of accounts) {
                participants.push(await account.getAddress());
            }
            return participants;
        }
        EDVdfContractABI.initListener = async function () {
            return (eventName, cb) => {
                const filter = {
                    topics: [
                        ethers.utils.id(eventName),
                    ]
                }

                function listener(...args) {
                    cb(...args);
                }

                EDVdfContractABI.signer.provider.on(filter, listener);
                return {
                    off: () => EDVdfContractABI.signer.provider.off(eventName, listener),
                }
            }
        }
        EDVdfContractABI.sendSecretSharesToParticipants = async function (participantAddresses, shares) {
            const transactions = [];
            for (let participantAddress of participantAddresses) {
                const share = shares.pop();
                transactions.push(EDVdfContractABI.signer.sendTransaction({
                    to: participantAddress,
                    data: ethers.utils.hexlify(share),
                }))
            }
            return Promise.all(transactions);
        }
        EDVdfContractABI.getTransferLogsFor = async function(address){
            const signer = await ethers.getSigner(address);
            const provider = await signer.provider;
            const currentBlock = await provider.getBlockNumber();
            const blocks = [];
            for(let i = currentBlock; i >= 0; i--){
                const block = await provider.getBlock(i);
                const transactions = await Promise.all(block.transactions.map((transactionHash) => {
                    return provider.getTransaction(transactionHash) ;
                }));
                blocks[block.hash] = transactions;
                // blocks.unshift(block);
            }
            console.log(blocks);
            //Block number 2 hours, 24 hours and 48 hours ago
            // const blockTime = 15; // ETH block time is 15 seconds
            // const block2 = currentBlock - (2 * 60 * 60 / blockTime);
            // const block24 = currentBlock - (24 * 60 * 60 / blockTime);
            // const block48 = currentBlock - (48 * 60 * 60 / blockTime);

            // Get all txs for address since 2 hours ago
            // let history = await provider.getHistory(address, block2, currentBlock);

            // If you got nothing back (i.e no txns), try 24 hours and then 48 hours
            // (history.length === 0 ? history = await provider.getHistory(address, block24, currentBlock) : null);
            // (history.length === 0 ? history = await provider.getHistory(address, block48, currentBlock) : null);

            // const filterTo = EDVdfContractABI.filters.Transfer(null, accountAddress);
            // const t = await EDVdfContractABI.queryFilter(filterTo);
            // return t;
        };
        return EDVdfContractABI;
    }
    return {
        getEDVdfContractABI: async function(){
            const EDVdfContractABI = await ethers.getContractFactory(CONTRACT_NAME);
            EDVdfContractABI.signer.provider.pollingInterval = 1000;
            return injectHelpers(EDVdfContractABI);
        },
        getContractAt: async function getContractAt(contractAddress){
            const EDVdfContractABI = await ethers.getContractAt(CONTRACT_NAME, contractAddress);
            EDVdfContractABI.signer.provider.pollingInterval = 1000;
            return injectHelpers(EDVdfContractABI);
        },
    };
}
const defaultUrl = 'http://localhost:8545/';
function getEthers(url){
    const {ethers} = require("hardhat");
    ethers.provider = new ethers.providers.JsonRpcProvider(url || defaultUrl);
    return ethers;
}