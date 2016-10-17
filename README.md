# ng-picross

[![Build Status](https://travis-ci.org/tjgrathwell/ng-picross.svg?branch=master)](https://travis-ci.org/tjgrathwell/ng-picross)

An AngularJS implementation of the puzzle game Picross, sometimes called [nonograms](http://en.wikipedia.org/wiki/Nonogram).

## Running the server

`gulp serve`

## Running the tests

`gulp jasmine` (browser) or `gulp jasmine-phantom` (headless)

`gulp jasmine-phantom --spec "some test name"` will run a focused subset of tests

`protractor protractor.conf.js`

## Deployment

`bin/deploy.sh`

Deploying builds the project and pushes to the `gh-pages` branch, after scrubbing all the commits so they're from "nobody@example.com". This is so nobody gets the magic github squares just for deploying.
 
