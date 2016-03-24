'use strict';

const sysfs = require('./sysfs');
const Pin = require('./pin');

function Exporter(pin) {
  this.sysfs = new sysfs(pin);
}

Exporter.prototype = {
  
  export: function(callback) {
    this.callback = callback;

    this.sysfs.export();
    this.remaining = new Set(['value', 'direction', 'edge', 'activeLow']);
    this.remaining.forEach(this.check, this);
  },

  exported: function() {
    this.callback(new Pin(this.sysfs));
  },

  check: function(attribute) {
    let start = process.hrtime();

    let func = (err) => {
      if (err) {
        let delta = process.hrtime(start);
        let deltans = delta[0] * 1e9 + delta[1];

        if (deltans >= 2e9) {
          console.log('Error: unable to verify file within 2 seconds');
          // TODO: probably throw an exception?
        } else {
          setTimeout(() => this.sysfs.access(attribute, func), 0.5);
        }
      } else {
        this.remaining.delete(attribute);

        if (this.remaining.size == 0) {
          this.exported();
        }
      }
    }

    this.sysfs.access(attribute, func);
  }

}

module.exports = Exporter;
