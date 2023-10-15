#!/bin/bash

method=$1
shift

# rewrite using switch:

case "$method" in
    "run")
        node runner.js $@
        ;;
    "run-docker")
        docker compose run --rm --build test $@
        ;;
    "update")
        docker compose run --rm --build build $@
        ./cli.sh install
        ;;
    "start")
        docker compose up -d verdaccio
        ;;
    "stop")
        docker compose down
        ;;
    "install")
        rm pnpm-lock.yaml
        rm -rf node_modules
        pnpm install
        ;;
    *)
        echo "Unknown command"
        ;;
esac