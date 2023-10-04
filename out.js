
const {print,spawn,scheduler,sleep} = require("./src/runtime");

function handle(id) {
  print(id, 1);
  return print(id, 2);
}


async function* _handle(id) {
  print(id, 1);
  yield;
  return print(id, 2);
}

handle("x");
handle("y");
spawn(_handle, "x");
spawn(_handle, "y");
        