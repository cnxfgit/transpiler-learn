const {Scheduler} = require("./Scheduler")

const scheduler = new Scheduler()
scheduler.start()

function print(...args) {
    console.log(...args)
}

function spawn(fn, ...args) {
    return scheduler.spawn(fn, ...args);
}

function send(receiver, message) {
    return scheduler.send(receiver, message);
}

async function receive(receiver){
    return await scheduler.receive(receiver);
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
    send,
    receive,
}