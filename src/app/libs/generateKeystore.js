const { Worker } = require('worker_threads');

let keystores = [];
const threadCount = 8;

const workerFilePath = `${__dirname}/generateKeystoreWorker.js`;

const generateKeystore = (seed, fromIndex, range, password) => {
    return new Promise((resolve, reject) => {
        const threads = new Set();

        if (range < threadCount) {
            threads.add(new Worker(workerFilePath, { workerData: { seed: seed, fromIndex: fromIndex, toIndex: fromIndex + range, password: password } }));
        } else {
            const batchSize = Math.floor(range / threadCount);
            let start = fromIndex;
            for (let i = 0; i < threadCount - 1; i++) {

                if (i < range % threadCount) {
                    threads.add(new Worker(workerFilePath, { workerData: { seed: seed, fromIndex: start, toIndex: start + batchSize + 1, password: password } }));
                    start += batchSize + 1;
                } else {
                    threads.add(new Worker(workerFilePath, { workerData: { seed: seed, fromIndex: start, toIndex: start + batchSize, password: password } }));
                    start += batchSize;
                }
            }
            threads.add(new Worker(workerFilePath, { workerData: { seed: seed, fromIndex: start, toIndex: fromIndex + range, password: password } }));
        }

        for (let worker of threads) {
            worker.on('error', (err) => {
                reject(err);
            });
            worker.on('exit', () => {
                threads.delete(worker);
                if (threads.size === 0) {
                    let result = new Array(range).fill(null);
                    for (let i = 0; i < keystores.length; i++) {
                        result[keystores[i].index - fromIndex] = keystores[i].keystore
                    }
                    if (result.includes(null)) {
                        reject('Err: 1');
                    } else {
                        resolve(result);
                    }
                }
            })
            worker.on('message', (msg) => {
                keystores = keystores.concat(msg);
            });
        }
    })
}

module.exports = {
    generateKeystore
}