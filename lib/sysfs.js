'use strict';

const path = require('path');
const fs = require('fs');

const SYSFS_PATH = '/sys/class/gpio';
const EXPORT_PATH = path.join(SYSFS_PATH, 'export');
const UNEXPORT_PATH = path.join(SYSFS_PATH, 'unexport');

function sysfs(pin) {
  this.pin = pin;

  this.watcher = null;
  this.watcher_fd = null;

  let root = path.join(SYSFS_PATH, 'gpio') + pin.toString();
  this.path = {
    root:      root,
    value:     path.join(root, 'value'),
    direction: path.join(root, 'direction'),
    edge:      path.join(root, 'edge'),
    activeLow: path.join(root, 'active_low')
  }
}

function read(file) {
  return fs.readFileSync(file).toString().trim();
}

function write(file, value) {
  fs.writeFileSync(file, value.toString());
}

sysfs.prototype = {

  get value() {
    if (this.watcher_fd !== null) {
      var value = Buffer(1);
      fs.readSync(this.watcher_fd, value, 0, 1, 0);
      return Number.parseInt(value.toString());
    }

    return Number.parseInt(read(this.path.value));
  },

  set value(val) {
    write(this.path.value, val.toString());
  },

  get direction() {
    return read(this.path.direction);
  },

  set direction(val) {
    write(this.path.direction, val);
  },

  get edge() {
    return read(this.path.edge);
  },

  set edge(val) {
    write(this.path.edge, val);
  },

  get activeLow() {
    return Number.parseInt(read(this.path.activeLow));
  },

  set activeLow(val) {
    write(this.path.activeLow, val.toString());
  },

  export: function() {
    fs.writeFileSync(EXPORT_PATH, this.pin.toString());
  },

  unexport: function() {
    fs.writeFileSync(UNEXPORT_PATH, this.pin.toString());
  },

  access: function(attribute, callback) {
    return fs.access(this.path[attribute], fs.W_OK | fs.R_OK, callback);
  },

  watch: function(callback) {
    this.watcher_fd = fs.openSync(this.path.value, 'r');
    this.watcher = fs.watch(this.path.value, (evt) => {
      callback(this.value);
    });
  }

}

module.exports = sysfs;
