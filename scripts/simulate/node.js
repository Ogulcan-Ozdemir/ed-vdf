const {log} = require('../misc/utils');
const client = require('./client');
const miner = require('./miner');
const cluster = require("cluster");
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
    return;
}

console.log(`Worker ${process.pid} started`);
(async () => {
    const id = process.pid;
    //todo Early Decryption Request test
    Promise.all([client(`Hello World:${id}`), miner()])
        .then(() => log(`tester:start:${id}`))
        .catch((error) => log(`tester:fail:${id} error ${error}`));

})();