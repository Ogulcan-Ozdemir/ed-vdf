const {log} = require('../../misc/utils');
const client = require('./client');
const miner = require('./miner');
const cluster = require("cluster");
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        log(`worker ${worker.process.pid} died`);
    });
    return;
}

log(`Worker ${process.pid} started`);
(async () => {
    const id = process.pid;
    Promise.all([client(`Hello World:${id}`), miner()])
        .then(() => log(`tester:start:${id}`))
        .catch((error) => log(`tester:fail:${id} error ${error}`));

})();