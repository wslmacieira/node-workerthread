const path = require('path');
const { Worker } = require('worker_threads');

async function runWorkerPromise(data) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        let result
        const worker = new Worker(path.resolve(__dirname, 'worker.js'), {
            workerData: {
                data
            },
        })

        worker.on('message', (data) => {
            console.log(
                `Worker [${worker.threadId}] done in: ${Date.now() - start}ms`
            );
            result = data
        })
        
        worker.on('error', reject)

        worker.once('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`))
            }
            console.log('Worker stopped', 'result');
            resolve(result)
            worker.terminate()
        })
    })

}

module.exports = { runWorkerPromise }