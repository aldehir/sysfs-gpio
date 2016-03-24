'use strict';

const constants = require('./constants');
const Exporter = require('./exporter');
const Pin = require('./pin');

let gpio = module.exports = {}
Object.keys(constants).forEach((k) => (gpio[k] = constants[k]));

gpio.exported = {}

gpio.export = function(pin, callback) {
  let exporter = new Exporter(pin);
  exporter.export((obj) => {
    gpio.exported[pin] = obj;
    callback(obj);
  });
}

gpio.unexport = function(pin) {
  if (gpio.exported[pin] !== undefined) {
    gpio.exported[pin].cleanup();
    delete gpio.exported[pin];
  }
}

gpio.cleanup = function() {
  Object.keys(gpio.exported).forEach(gpio.unexport);
}

process.on('exit', gpio.cleanup);
process.on('SIGINT', () => { gpio.cleanup(); process.exit(); });
// process.on('uncaughtException', (err) => {
//   gpio.cleanup();
//   console.log(err);
// });
