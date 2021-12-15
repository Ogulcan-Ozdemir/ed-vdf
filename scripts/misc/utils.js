const {ethers} = require("hardhat");

function waitEvent(provider, eventName, timeout = 10_000) {
    const filter = {
        topics: [
            ethers.utils.id(eventName),
        ]
    }
    return new Promise((resolve, reject) => {
        const timerId = setTimeout(() => {
            provider.off(filter, listener);
            reject(`Event:${eventName} not occurred in given time interval`);
        }, timeout);

        function listener(...args) {
            clearInterval(timerId);
            resolve(...args);
        }

        provider.once(filter, listener);
    });
}
module.exports.waitEvent = waitEvent;
module.exports.WaitEvent = (provider, eventName, timeout) => {
    return () => {
        return waitEvent(provider, eventName, timeout);
    }
};



module.exports.waitAsync = require('util').promisify((a, b) => setTimeout(b, a));

function log(...args){
    console.log(new Date().toISOString(), process.pid, ...args);
}
module.exports.log = log;