## This test aim to correctly resolve the `.node` file when loading CJS and ESM using dynamic import
## Steps to Build `.node` File
1. install `node-gyp`
```
$ npm install node-gyp -g
```
2. install `.h` file of Node.js
```
$ node-gyp install
```
3. write description file `binding.gyp` and source code file `main.cpp`
4. generate configure files and run build
```
$ node-gyp configure
$ node-gyp build
```
...or
```
$ node-gyp rebuild
```
5. then you can get the `.node` file in the `./build/Release` dir
