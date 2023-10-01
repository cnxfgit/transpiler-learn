function print(...args) {
    console.log(...args)
}

function handle(id) {
    print(id, 1)
    print(id, 2)
}

// handle('x')
// handle('y')

function spawn(fn, ...args) {
    const gen = fn(...args);
    schedule(gen)
}

const runQueue = []

function schedule(gen) {
    runQueue.push(gen)
}

async function handleProcess(gen) {
    for await (let _ of gen) {
    }
}

function schedulerLoop() {
    Promise.all(runQueue.map(gen => handleProcess(gen)));

    runQueue.length = 0;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function* _handle(id, ms) {
    print(id, 1)
    yield await sleep(ms);
    print(id, 2)
    yield await sleep(ms);
    print(id, 3)
}

spawn(_handle, 'x', 300)
spawn(_handle, 'y', 1000)

schedulerLoop()