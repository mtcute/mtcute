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
        if [ -d .jsr-data/gcs/modules/@mtcute ]; then
            rm -rf .jsr-data/gcs/modules/@mtcute
            docker compose exec jsr-db psql registry -U user -c "delete from publishing_tasks;"
            docker compose exec jsr-db psql registry -U user -c "delete from package_files;"
            docker compose exec jsr-db psql registry -U user -c "delete from npm_tarballs;"
            docker compose exec jsr-db psql registry -U user -c "delete from package_version_dependencies;"
            docker compose exec jsr-db psql registry -U user -c "delete from package_versions;"
            docker compose exec jsr-db psql registry -U user -c "delete from packages;"
        fi

        # publish all packages
        docker compose run --rm --build build all
        
        # clear cache
        if command -v deno &> /dev/null; then
            rm -rf $(deno info --json | jq .denoDir -r)/deps
        fi
        if [ -f deno.lock ]; then
            rm deno.lock
        fi
        ;;
    "clean")
        docker compose down
        rm -rf .jsr-data
        ;;
    "stop")
        docker compose down
        ;;
    "run")
        if [ -f .env ]; then
            source .env
        fi

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
    "ci")
        set -eaux
        mkdir .jsr-data
        ./cli.sh start
        ./cli.sh update
        docker compose run --rm --build test
        ;;
    *)
        echo "Unknown command"
        ;;
esac