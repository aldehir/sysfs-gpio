#include <uv.h>

#include "gpio.h"

namespace gpio_poll {

using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::HandleScope;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> GPIO::constructor;

GPIO::GPIO(int fd) : fd_(fd), poll_(NULL) {

}

GPIO::~GPIO() {
  if (poll_ != NULL)
    delete poll_;
}

void GPIO::Init(Local<Object> exports) {
  Isolate* isolate = exports->GetIsolate();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "GPIO"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "setCallback", SetCallback);
  NODE_SET_PROTOTYPE_METHOD(tpl, "poll", Poll);
  NODE_SET_PROTOTYPE_METHOD(tpl, "stop", Stop);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "GPIO"), tpl->GetFunction());
}

void GPIO::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    int fd = args[0]->IsUndefined() ? -1 : args[0]->NumberValue();
    GPIO* obj = new GPIO(fd);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    args.GetReturnValue().Set(cons->NewInstance(argc, argv));
  }
}

void GPIO::SetCallback(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  GPIO* gpio = ObjectWrap::Unwrap<GPIO>(args.Holder());
  gpio->callback_.Reset(isolate, Local<Function>::Cast(args[0]));
}

void GPIO::Poll(const FunctionCallbackInfo<Value>& args) {
  GPIO* gpio = ObjectWrap::Unwrap<GPIO>(args.Holder());

  uv_loop_t* loop = uv_default_loop();

  if (gpio->poll_ != NULL) {
    uv_poll_stop(gpio->poll_);
    delete gpio->poll_;
  }

  gpio->poll_ = new uv_poll_t;

  uv_poll_init(loop, gpio->poll_, gpio->fd_);

  uv_set_poll_flags(gpio->poll_, UV_NOAUTOCLOSE | UV_EDGETRIGGERED);
  gpio->poll_->data = reinterpret_cast<void*>(gpio);

  uv_poll_start(gpio->poll_, UV_URGENT, &GPIO::PollCallback);
}

void GPIO::Stop(const FunctionCallbackInfo<Value>& args) {
  GPIO* gpio = ObjectWrap::Unwrap<GPIO>(args.Holder());
  uv_poll_stop(gpio->poll_);
}

void GPIO::PollCallback(uv_poll_t* handle, int status, int events) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  GPIO* gpio = reinterpret_cast<GPIO*>(handle->data);
  Local<Function> cb = Local<Function>::New(isolate, gpio->callback_);

  const unsigned int argc = 0;
  Local<Value> argv[argc] = { };
  cb->Call(Null(isolate), argc, argv);
}

}
