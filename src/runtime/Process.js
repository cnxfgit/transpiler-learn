class Process {
    constructor(handlerFn, ...args) {
        this.handler = handlerFn.apply(this, args)
        this.pid = ++Process.pid;
        this.name = handlerFn.name || this.pid
        this.mailbox = [];
    }
    toString(){
        return `#${this.pid} (${this.name})`;
    }
}

Process.pid = 0;

module.exports = {
    Process,
}