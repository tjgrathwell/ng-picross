#!/usr/bin/env bash

set -e

node_modules/.bin/webdriver-manager update

if [[ "$CI" == "true" ]]; then
  node_modules/.bin/webdriver-manager start &
fi
