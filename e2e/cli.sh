#!/bin/bash

set -eauE
trap 'docker compose logs verdaccio' ERR

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
        docker compose up -d verdaccio
        docker compose run --rm --build build
        docker compose run --rm --build test
        ;;
    *)
        echo "Unknown command"
        ;;
esac