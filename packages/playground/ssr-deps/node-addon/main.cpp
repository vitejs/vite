#include <node.h>
#include <v8.h>
using namespace v8;

void HelloWorld(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<String> hello = String::NewFromUtf8(isolate, "Hello World!", NewStringType::kNormal).ToLocalChecked();
  args.GetReturnValue().Set(hello);
}

void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "hello", HelloWorld);
}

NODE_MODULE(cpp_addon, Init)
