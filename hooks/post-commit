#!/usr/bin/env node --harmony

'use strict';

var run = require(__dirname + '/pre-common');
var label = 'post-commit';

function postCommit(cb) {
  console.log(label, 'hook');
  setTimeout(cb, 0);
}

run(label, postCommit);
