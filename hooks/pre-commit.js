#!/usr/bin/env node

'use strict';

var common = require(__dirname + '/pre-common');
var child = require('child_process');
var label = 'pre-commit:';

// exits if there are no changes
function haveChangesToCommit(cb) {
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

haveChangesToCommit(function () {
  common.getGitRoot(run);
});

function run(root) {
  if (!root) {
    console.error('');
    console.error(label, 'Failed to find git root. Cannot run the tests.');
    console.error('');
    return process.exit(1);
  }
  console.log('git root', root);

  var tasks = common.getTasks(root, 'pre-commit');
  if (!tasks || !tasks.length) {
    console.log('');
    console.log(label, 'Nothing to run. Bailing out.');
    console.log('');
    return;
  }

  common.runner(tasks);
}
