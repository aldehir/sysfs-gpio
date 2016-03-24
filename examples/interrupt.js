'use strict';

const GPIO = require('sysfs-gpio');

GPIO.export(27, (pin) => {
  pin.in()
     .both()
     .watch()

  pin.on('both', (value) => {
    console.log(`Value ${value}`);
  });
});

process.stdin.resume();
