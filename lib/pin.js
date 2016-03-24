'use strict';

const EventEmitter = require('events');
const util = require('util');
const delegate = require('delegates');

const constants = require('./constants');

let pin = Pin.prototype;

function Pin(sysfs) {
  EventEmitter.call(this);

  this.sysfs = sysfs;

  this._debouncing = {
    enabled: false,
    running: false,
    delay: 0,
    poll: 5,
    count: 0,
    last: null
  }
}

util.inherits(Pin, EventEmitter);

pin.setup = function(options) {
  this.sysfs.direction = options.direction || constants.IN;
  this.sysfs.edge = options.edge || constants.NONE;

  if (options.direction === constants.OUT) {
    this.sysfs.value = options.value || constants.LOW;
  }

  if (options.debounce) {
    this.debounce(options.debounce);
  }

  if (options.watch) {
    this.watch();
  }
}

pin.cleanup = function() {
  this.sysfs.unexport();
}

pin.watch = function() {
  // Default to both rising and falling if not set up for edge triggers
  if (this.sysfs.edge === constants.NONE) {
    this.sysfs.edge = constants.BOTH;
  }

  this.sysfs.watch(this.__watchCallback.bind(this));
  this.value;
  return this;
}

pin.__watchCallback = function(value) {
  if (this._debouncing.enabled) {
    this.__watchDebounce(value)
  } else {
    this.__watchNoDebounce(value);
  }
}

pin.__watchNoDebounce = function(value) {
  if (value == constants.HIGH) {
    this.emit('rising', value);
  } else {
    this.emit('falling', value);
  }

  this.emit('both', value);
}

pin.__watchDebounce = function(value) {
  if (!this._debouncing.running) {
    this._debouncing.running = true;
    this._debouncing.count = 0;
    this._debouncing.last = value;

    setTimeout(this.__debouncePoll.bind(this), this._debouncing.poll);
  }
}

pin.__debouncePoll = function() {
  let value = this.value;

  if (value === this._debouncing.last) {
    this._debouncing.count++;

    // If we stablize, emit rising/falling and return so we don't poll again
    if (this._debouncing.count === this._debouncing.delay) {
      this._debouncing.running = false;
      this.__watchNoDebounce(value);
      return;
    }
  } else {
    this._debouncing.count = 0;
    this._debouncing.last = value;
  }

  setTimeout(this.__debouncePoll.bind(this), this._debouncing.poll);
}

pin.debounce = function(delay) {
  this._debouncing.enabled = true;
  this._debouncing.delay = (delay || 20) / this._debouncing.poll;
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
