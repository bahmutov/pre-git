#!/usr/bin/env node

'use strict';

var run = require(__dirname + '/pre-common');
var label = 'post-commit';

// exits if there are no changes to commit
function postCommit(cb) {
  console.log(label, 'hook');
  setTimeout(cb, 0);
}

run(label, postCommit);
