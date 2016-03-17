var fs = require('fs');
var _gpio_poll = require('./build/Release/gpio_poll');

var fd = fs.openSync('/sys/class/gpio/gpio21/value', 'rs');

var poller = new _gpio_poll.GPIO(fd);

poller.setCallback(function() {
  var buf = Buffer(1);
  fs.readSync(fd, buf, 0, 1, 0);

  console.log("Data: " + buf);
});

poller.poll();
