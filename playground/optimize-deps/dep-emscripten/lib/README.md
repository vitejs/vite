```sh
emcc --version # 3.1.59
emcc lib.cpp -o build-esm.js -sEXPORT_ES6 -sENVIRONMENT=web,worker --bind
emcc lib.cpp -o build-modularize.cjs -sMODULARIZE -sENVIRONMENT=web,worker --bind
```

## references

- https://emscripten.org/docs/tools_reference/emcc.html
- https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
