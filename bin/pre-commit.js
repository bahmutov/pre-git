#!/usr/bin/env node --harmony

'use strict';

var run = require(__dirname + '/pre-common');
var child = require('child_process');
var label = 'pre-commit';

function isForced() {
  return process.argv.some(function (arg) {
    return arg === '-f' || arg === '--force';
  });
}

// exits if there are no changes to commit
function haveChangesToCommit(cb) {
  if (isForced()) {
    console.log('forcing callback execution');
    setTimeout(cb, 0);
    return;
  }

  child.exec('git status --porcelain', function changes(err, status) {
    if (err) {
      console.error(label, 'Failed to check for changes. Cannot run the tests.');
      console.error(err);
      return process.exit(1);
    }

    if (!status.trim().length) {
      console.log('');
      console.log(label, 'No changes detected, bailing out.');
      console.log('');
      return process.exit(0);
    }

    cb();
  });
}

run(label, haveChangesToCommit);
