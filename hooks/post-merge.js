#!/usr/bin/env node

'use strict';

var run = require(__dirname + '/pre-common');
var label = 'post-merge';

function postMerge(cb) {
  console.log(label, 'hook');
  setTimeout(cb, 0);
}

run(label, postMerge);
