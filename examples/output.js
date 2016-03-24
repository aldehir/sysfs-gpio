'use strict';

const GPIO = require('sysfs-gpio');

GPIO.export(18, (pin) => {
  pin.out();
  pin.high();
});

process.stdin.resume();
