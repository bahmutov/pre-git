#!/usr/bin/env node

'use strict';

var run = require(__dirname + '/pre-common');
var label = 'commit-msg';

function always(cb) {
  cb();
}

run(label, haveChangesToCommit);
