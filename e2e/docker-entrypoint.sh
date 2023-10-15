#!/bin/sh

set -e

# we can't do this during build because we don't have network access
pnpm install

node runner.js $@