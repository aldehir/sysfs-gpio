"use strict";

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const util = require('util');

const SYSFS_PATH = '/sys/class/gpio';
const EXPORT_PATH = path.join(SYSFS_PATH, 'export');
const UNEXPORT_PATH = path.join(SYSFS_PATH, 'unexport');

function sysfs(pin) {
  var toplevel = path.join(SYSFS_PATH, 'gpio') + pin.toString();
  return {
    dir:       toplevel,
    value:     path.join(toplevel, 'value'),
    direction: path.join(toplevel, 'direction'),
    edge:      path.join(toplevel, 'edge'),
    activeLow: path.join(toplevel, 'active_low')
  }
}

function get(file) {
  return fs.readFileSync(file).toString();
}

function set(file, value) {
  fs.writeFileSync(file, value.toString());
}

function Pin(pin, options) {
  EventEmitter.call(this);

  this.pin = pin;
  this.sysfs = sysfs(pin);
  this.watcher = null;
  this.watcher_fd = null;
}

util.inherits(Pin, EventEmitter);

Pin.prototype.setDirection = function(direction) {
  set(this.sysfs.direction, direction);
}

Pin.prototype.getDirection = function() {
  return get(this.sysfs.direction);
}

Pin.prototype.setEdge = function(edge) {
  set(this.sysfs.edge, edge);
}

Pin.prototype.getEdge = function() {
  return get(this.sysfs.edge);
}

Pin.prototype.getValue = function() {
  if (this.watcher_fd) {
    var value = Buffer(1);
    fs.readSync(this.watcher_fd, value, 0, 1, 0);
    return Number.parseInt(value.toString());
  }

  return Number.parseInt(get(this.sysfs.value).trim());
}

Pin.prototype.watch = function(edge) {
  // We need to set the edge for us to get notifications
  this.setEdge(edge || 'both');

  // Open up the value file and start listening for notifications
  this.watcher_fd = fs.openSync(this.sysfs.value, 'r');
  this.watcher = fs.watch(this.sysfs.value, (evt) => {
    var value = this.getValue();

    if (value == 1) {
      this.emit('rising', value);
    } else {
      this.emit('falling', value);
    }

    this.emit('both', value);
  });
}

function Exporter(pin) {
  this.pin = pin;
  this.sysfs = sysfs(pin);
}

Exporter.prototype.export = function(cb) {
  // Create a set containing all of the files we wish to verify are accessible
  this.remaining = new Set();
  this.callback = cb;

  var keys = Object.keys(this.sysfs);
  for (var i = 0; i < keys.length; i++) {
    this.remaining.add(this.sysfs[keys[i]]);
  }

  // Write to GPIO export file
  fs.writeFileSync(EXPORT_PATH, this.pin.toString());
  this.remaining.forEach((p) => this.check(p));
}

Exporter.prototype.check = function(filepath) {
  var first = Symbol('first');
  var start = process.hrtime();

  var func = (err) => {
    if (err || err == first) {
      var delta = process.hrtime(start);
      var deltans = delta[0] * 1e9 + delta[1];

      if (deltans >= 2e9) {
        console.log('Error: Unable to verify file with 2 seconds');
        /* TODO: Do some error recovery or something */
      } else {
        fs.access(filepath, fs.R_OK | fs.W_OK, func);
      }
    } else {
      this.remaining.delete(filepath);

      if (this.remaining.size == 0) {
        this.exported();
      }
    }
  }

  func(first);
}

Exporter.prototype.exported = function() {
  this.callback();
}

let GPIO = {};

GPIO.setup = function(pin, callback) {
  // Export the pin
  var exporter = new Exporter(pin);
  exporter.export(function() {
    callback(new Pin(pin));
  });
}

GPIO.cleanup = function(pin) {
  fs.writeFileSync(UNEXPORT_PATH, pin.toString());
}

GPIO.setup(27, function(pin) {
  console.log('Value: ' + pin.getValue());

  pin.watch();
  pin.on('rising', function(value) {
    console.log('Value: ' + value);
  });
});

setTimeout(() => {
  GPIO.cleanup(27);
  process.exit();
}, 10000);

// process.on('uncaughtException', () => {
//   GPIO.cleanup(27);
// });
