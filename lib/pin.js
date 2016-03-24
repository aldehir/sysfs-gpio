'use strict';

const EventEmitter = require('events');
const util = require('util');
const delegate = require('delegates');

const constants = require('./constants');

let pin = Pin.prototype;

function Pin(sysfs) {
  EventEmitter.call(this);
  this.sysfs = sysfs;
}

util.inherits(Pin, EventEmitter);

pin.setup = function(direction, edge) {
  this.sysfs.direction = direction || constants.IN;
  this.sysfs.edge = edge || constants.NONE;
}

pin.cleanup = function() {
  this.sysfs.unexport();
}

pin.watch = function() {
  // Default to both rising and falling if not set up for edge triggers
  if (this.sysfs.edge === constants.NONE) {
    this.sysfs.edge = constants.BOTH;
  }

  this.sysfs.watch((value) => {
    if (value == constants.HIGH) {
      this.emit('rising', value);
    } else {
      this.emit('falling', value);
    }

    this.emit('both', value);
  });

  return this;
}

pin.in = function() {
  this.sysfs.direction = constants.IN;
  return this;
}

pin.out = function() {
  this.sysfs.direction = constants.OUT;
  return this;
}

pin.high = function() {
  if (this.sysfs.direction !== constants.OUT)
    throw "Pin is not configured for output";
  this.sysfs.value = constants.HIGH;
  return this;
}

pin.low = function() {
  if (this.sysfs.direction !== constants.OUT)
    throw "Pin is not configured for output";
  this.sysfs.value = constants.LOW;
  return this;
}

/* At the moment the following methods aren't implemented because of a name
 * conflict with sysfs.activeLow getter/setter. Not sure what to call these.
 */
/*
pin.activeLow = function() {
  this.sysfs.activeLow = constants.ACTIVE_LOW;
  return this;
}

pin.activeHigh = function() {
  this.sysfs.activeHigh = constants.ACTIVE_HIGH;
  return this;
}
*/

pin.rising = function() {
  this.sysfs.edge = constants.RISING;
  return this;
}

pin.falling = function() {
  this.sysfs.edge = constants.FALLING;
  return this;
}

pin.both = function() {
  this.sysfs.edge = constants.BOTH;
  return this;
}

delegate(pin, 'sysfs')
  .getter('value')
  .getter('edge')
  .getter('direction')
  .getter('activeLow');

module.exports = Pin;
