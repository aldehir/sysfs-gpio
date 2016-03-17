#include <node.h>
#include "gpio.h"

namespace gpio_poll {

using v8::Local;
using v8::Object;

void InitAll(Local<Object> exports) {
  GPIO::Init(exports);
}

NODE_MODULE(gpio_interrupt, InitAll)

}
