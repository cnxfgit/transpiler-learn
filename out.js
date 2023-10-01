
const {print,spawn,scheduler,sleep} = require("./src/runtime");

function handle(id) {
  print(id, 1);
  return print(id, 2);
}

handle("x");
handle("y");
spawn(handle, "x");
spawn(handle, "y");
        