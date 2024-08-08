#include <string>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>

std::string hello(const std::string& name) {
  return "hello, " + name + "!";
}

EMSCRIPTEN_BINDINGS(example_lib) {
  emscripten::function("hello", &hello);
}
