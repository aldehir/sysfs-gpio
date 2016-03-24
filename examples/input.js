'use strict';

const GPIO = require('sysfs-gpio');

GPIO.export(27, (pin) => {
  pin.in();

  setInterval(() => {
    console.log(`Value ${pin.value}`);
  }, 100);
});

process.stdin.resume();
