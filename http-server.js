const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { Worker } = require('worker_threads');

let runningProcs = []
const maxParallelProcs = 4

async function runProcessInQueue(fnPromise, data) {
    let result
    if (runningProcs.length >= maxParallelProcs) {
        console.log("Queue full, waiting some process to finish");
        await runningProcs[0];
        return runProcessInQueue(fnPromise, data)
    }
    console.log('Running proc ...');
    // const promise = runBigProcess()
    const promise = fnPromise(data)
    runningProcs.push(promise)

    function removePromise() {
        console.log('removing promise...');
        runningProcs = runningProcs.filter(p => p !== promise)
    }

    try {
        result = await promise
    } catch (error) {
        throw error
    } finally {
        removePromise()
    }
    return result
}

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
            console.log('Worker stopped');
            resolve(result)
            worker.terminate()
        })
    })

}

function batchRequest(arr, size) {
    const result = []
    while (arr.length) {
        result.push(arr.splice(0, size))
    }
    return result
}

http.createServer(async (req, res) => {
    const start = Date.now();
    const data = Array.from({ length: 200 }, (_, i) => i + 1) 
        
        const promises = newPromises(data)

    if (req.url === '/nuke') {
        const result = (await Promise.all(promises)).flat().sort((a, b) => a.id - b.id)
        console.log(`response server done in: ${Date.now() - start}ms`);
        // return res.end('nuked');
        const jsonContent = JSON.stringify(result)
        return res.end(jsonContent);
    }
    res.end('ok');
}).listen(3000, '127.0.0.1');
function newPromises(data) {
    return batchRequest(data, 100)
        .map((arr) => runProcessInQueue(runWorkerPromise, arr));
}

async function runBigProcess() {
    return new Promise((resolve, reject) => {
        const proc = spawn('node', [path.resolve(__dirname, 'sub-process.js')]);

        const stdout = []
        const stderr = []

        proc.stdout.on("data", (data) => {
            // console.log(data.toString());
        })
        proc.stderr.on("data", (data) => {
            console.log(data.toString());
        })

        proc.on('error', (err) => {
            reject(err);
        })

        proc.on('close', () => {
            if (stderr.length) {
                return reject(stderr.join('\n'));
            }
            console.log(stdout.join('\n'));
            resolve()
        })
    })
}
