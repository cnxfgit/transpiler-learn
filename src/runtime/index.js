const {Scheduler} = require("./Scheduler")

const scheduler = new Scheduler()
scheduler.start()

function print(...args) {
    console.log(...args)
}

function spawn(fn, ...args) {
    return scheduler.spawn(fn, ...args);
}

async function sleep(ms) {
    return scheduler.sleep(ms)
}

const NextMatch = {}

module.exports = {
    print,
    spawn,
    scheduler,
    sleep,
    NextMatch,
}