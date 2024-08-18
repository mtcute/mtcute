# mtcute e2e tests

This directory contains end-to-end tests for mtcute.

They are made for 2 purposes:
 - Ensure published packages work as expected and can properly be imported
 - Ensure that the library works with the actual Telegram API (WIP)

To achieve the first goal, we use a Verdaccio container to publish the package to,
and then install it from there in another container

## Setting up

Before running the tests, you need to copy `.env.example` to `.env` and fill in the values

## Running tests

To run tests, you need to have Docker installed.

```bash
# first start Verdaccio:
./cli.sh start

# build and publish the package
./cli.sh update
# or a particular package
./cli.sh update tl-runtime

# run the tests
./cli.sh run
# or in docker
./cli.sh run-docker
```

## Developing

Once you have Verdaccio running, you can run the following commands to setup
the environment for development:

```bash
npm config set -L project @mtcute:registry http://verdaccio.e2e.orb.local/
./cli.sh install
```

> Replace the URL above with the one generated with your Docker GUI of choice
> (e2e > verdaccio > RMB > Open in browser). Example above assumes OrbStack

Then use `./cli.sh run` to run the tests
