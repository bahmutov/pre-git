#!/usr/bin/env node

'use strict';

var run = require(__dirname + '/pre-common');
var child = require('child_process');
var label = 'post-commit';

// exits if there are no changes to commit
function postCommit(cb) {
  console.log('post-commit hook');
  setTimeout(cb, 0);
}

run(label, postCommit);
