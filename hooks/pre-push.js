#!/usr/bin/env node

'use strict';

var child = require('child_process');
var common = require(__dirname + '/pre-common');
console.log('pre-push in', process.cwd());

function haveCommitsToPush(cb) {
  // todo: find if there are commits to push
  child.exec('git log origin/master..HEAD', function (err, stdout) {
    if (err) {
      console.error('pre-push: Failed to check for commits. Cannot run the tests.');
      return process.exit(1);
    }

    if (!stdout.trim().length) {
      console.log('');
      console.log('pre-push: No local commits detected, bailing out.');
      console.log('');
      return process.exit(0);
    }

    cb();
  });
}


haveCommitsToPush(function () {
  common.getGitRoot(run);
});

function run(root) {
  if (!root) {
    console.error('');
    console.error('pre-push: Failed to find git root. Cannot run the tests.');
    console.error('');
    return process.exit(1);
  }
  console.log('git root', root);

  var tasks = common.getTasks(root, 'pre-push');
  if (!tasks || !tasks.length) {
    console.log('');
    console.log('pre-push: Nothing to run. Bailing out.');
    console.log('');
    return;
  }

  common.runner(tasks);
}
