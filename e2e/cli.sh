#!/bin/bash

set -eau

method=$1
shift

# rewrite using switch:

case "$method" in
    "run")
        node runner.js $@
        ;;
    "run-docker")
        source .env
        docker compose run --rm --build test $@
        ;;
    "update")
        docker compose run --build build $@
        ./cli.sh install
        ;;
    "start")
        docker compose up -d verdaccio
        ;;
    "stop")
        docker compose down
        ;;
    "install")
        rm -rf pnpm-lock.yaml node_modules
        pnpm install
        ;;
    "ci")
        set -eaux
        chmod -R 777 .verdaccio
        docker compose up -d verdaccio
        docker compose run --rm --build build
        docker compose run --build test
        ;;
    "ci-publish")
        export CURRENT_COMMIT=$(git rev-parse HEAD)
        docker compose up -d verdaccio
        node publish-canary.js
        ;;
    *)
        echo "Unknown command"
        ;;
esac