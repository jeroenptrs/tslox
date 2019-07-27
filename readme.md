# tslox

Typescript implementation of jlox from [Crafting Interpreters](https://craftinginterpreters.com).

## Usage

Run loxfiles with the `tslox` binary. You can download the binary from the [releases pane](https://github.com/jeroenptrs/tslox/releases) or build it locally.

## Building it locally

Assuming you have node 10 or higher installed (the binary uses node 12) as well as yarn (`npm i -g yarn`):

```bash
git clone https://github.com/jeroenptrs/tslox.git
cd tslox
yarn
yarn createExec
```
