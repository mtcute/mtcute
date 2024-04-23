#!/bin/bash

set -eau

method=$1
shift

case "$method" in
    "start")
        docker compose up -d --wait jsr
        node ./init-server.js
        ;;
    "update")
        # unpublish all packages
        rm -rf .jsr-data/gcs/modules/@mtcute/*
        docker compose exec jsr-db psql registry -U user -c "delete from publishing_tasks;"
        docker compose exec jsr-db psql registry -U user -c "delete from package_files;"
        docker compose exec jsr-db psql registry -U user -c "delete from npm_tarballs;"
        docker compose exec jsr-db psql registry -U user -c "delete from package_version_dependencies;"
        docker compose exec jsr-db psql registry -U user -c "delete from package_versions;"
        docker compose exec jsr-db psql registry -U user -c "delete from packages;"

        # publish all packages
        docker compose run --rm --build build all
        
        # clear cache
        rm -rf $(deno info --json | jq .denoDir -r)/deps
        rm deno.lock
        ;;
    "clean")
        docker compose down
        rm -rf .jsr-data
        ;;
    "stop")
        docker compose down
        ;;
    "run")
        source .env

        if [ -n "$DOCKER" ]; then
            # running behind a socat proxy seems to fix some of the docker networking issues (thx kamillaova)
            socat TCP-LISTEN:4873,fork,reuseaddr TCP4:jsr:80 &
            socat_pid=$!

            trap "kill $socat_pid" EXIT
        fi

        export JSR_URL=http://localhost:4873
        if [ -z "$@" ]; then
            deno test -A tests/**/*.ts
        else
            deno test -A $@
        fi
        ;;
    "run-docker")
        source .env
        docker compose run --rm --build test $@
        ;;
    *)
        echo "Unknown command"
        ;;
esac