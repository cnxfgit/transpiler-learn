const {Process} = require("./Process");
const {sleep} = require("./index");

class Scheduler {
    constructor() {
        this.processes = new Set();
        this.runQueue = [];
    }

    spawn(handlerFn, ...args) {
        const process = new Process(handlerFn, ...args);
        this.processes.add(process);
        console.log(`* Spawning new process ${process}`)
        this.schedule(process)
        return process;
    }

    schedule(process) {
        this.runQueue.push(process);
    }

    terminate(process) {
        console.log(`* Process ${process} is terminated`)
        this.processes.delete(process)
    }

    send(receiver, message) {
        if (!this.processes.has(receiver)) {
            return;
        }
        receiver.mailbox.push(message);
    }

    async receive(receiver) {
        while (true) {
            if (!this.processes.has(receiver)) {
                break;
            }

            if (receiver.mailbox.length >0) {
                return receiver.mailbox.shift()
            }

            await sleep(50);
        }
        console.log(`${receiver} stopped receiving messages.`)
    }

    async handleProcess(process) {
        try {
            for await (let _ of process.handler) {
            }
        } catch (e) {
            console.log(`* Process ${process} threw an exception "${e}", terminating.`)
        }
        this.terminate(process)
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async run() {
        while (true) {
            if (this.runQueue.length > 0) {
                Promise.all(this.runQueue.map(process => this.handleProcess(process)));
                this.runQueue.length = 0;
            }

            await this.sleep(10)
        }
    }

    start() {
        setTimeout(() => this.run(), 0)
    }
}

module.exports = {
    Scheduler,
}