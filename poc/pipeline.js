const { Readable } = require('node:stream')
const { pipeline } = require('node:stream/promises')
const { createBufferObjectStream } = require('./utils/buffer-object-streams')
const { runWorkerPromise } = require('./utils/worker-promise')
let runningProcs = []
const maxParallelProcs = 2

async function runProcessInQueue(fnPromise) {
  let result
  if (runningProcs.length >= maxParallelProcs) {
      console.log("Queue full, waiting some process to finish");
      await runningProcs[0];
      return runProcessInQueue(fnPromise)
  }
  console.log('Running proc ...');
  const promise = fnPromise()
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

async function* createReadableStream(data) {
    // yield Buffer.from(`tick: ${new Date().toISOString()}`)
    for (const element of data) {
        yield element
    }
}

async function* createWritablePromiseStream(stream) {
  for await (const chunk of stream) {
    // yield runWorkerPromise(chunk)
    const response = await runProcessInQueue(() => runWorkerPromise(chunk))
    console.log('Writable >>>', chunk.toString())
    yield response
  }
}
async function* executePromiseStream(stream) {
  for await (const chunk of stream) {
    // runProcessInQueue(() => runWorkerPromise(chunk))
    // const response = await runProcessInQueue(chunk)
    console.log('PromiseStream >>>', JSON.stringify(chunk))
  }
}

const runPipeline = async (data, size) => {
const start = Date.now();
await pipeline(
    Readable.from(createReadableStream(data)),
    createBufferObjectStream(size),
    createWritablePromiseStream,
    executePromiseStream
  )
  console.log(`Pipeline done in: ${Date.now() - start}ms`);
}

module.exports = { runPipeline }