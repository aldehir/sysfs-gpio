#ifndef GPIO_H
#define GPIO_H

#include <node.h>
#include <node_object_wrap.h>
#include <uv.h>

namespace gpio_poll {

class GPIO : public node::ObjectWrap {
public:
  static void Init(v8::Local<v8::Object> exports);

private:
  explicit GPIO(int fd);
  ~GPIO();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void SetCallback(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void Poll(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void Stop(const v8::FunctionCallbackInfo<v8::Value>& args);

  static void PollCallback(uv_poll_t* handle, int status, int events);

  static v8::Persistent<v8::Function> constructor;

  int fd_;

  uv_poll_t* poll_;

  v8::Persistent<v8::Function> callback_;
};

}

#endif
