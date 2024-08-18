# mtcute e2e tests (Deno edition)

This directory contains end-to-end tests for mtcute under Deno.

They are made for 2 purposes:
 - Ensure published packages work as expected and can properly be imported
 - Ensure that the library works with the actual Telegram API

To achieve the first goal, we use a local JSR instance container where we publish the package,
and then install it from there in another container

## Setting up

Before running the tests, you need to copy `.env.example` to `.env` and fill in the values

## Running tests

```bash
# first start a local jsr instance
./cli.sh start

# push all packages to the local registry
./cli.sh update
# pushing a particular package is not supported due to jsr limitations

# run the tests
./cli.sh run
# or in docker
./cli.sh run-docker
```
