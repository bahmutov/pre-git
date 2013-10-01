#!/usr/bin/env node

'use strict';

var common = require(__dirname + '/pre-common');
var child = require('child_process');

console.log('pre-commit in', process.cwd());
console.log('common', common);

//
// Get the root of the repository.
//
child.exec('git status --porcelain', function chagnes(err, status) {
  if (err) {
    console.error('pre-commit: Failed to find git root. Cannot run the tests.');
    return process.exit(1);
  }

  if (!status.trim().length) {
    console.log('');
    console.log('pre-commit: No changes detected, bailing out.');
    console.log('');
    return;
  }

  common.getGitRoot(run);
});

/**
 * Run the set pre-commit hooks.
 *
 * @param {Error} err The error that happend while executing the command.
 * @param {Error} output The output of rev-parse.
 * @api private
 */
function run(err, output) {
  if (err) {
    console.error('');
    console.error('pre-commit: Failed to find git root. Cannot run the tests.');
    console.error('');
    return process.exit(1);
  }

  //
  // Check if there are scripts specified that we need to run.
  //
  var root = output.trim();
  var tasks = common.getTasks(root, 'pre-commit');
  //
  // Bailout if we don't have anything to run.
  //
  if (!tasks || !tasks.length) {
    console.log('');
    console.log('pre-commit: Nothing to run. Bailing out.');
    console.log('');
    return;
  }

  common.runner(tasks);
}
