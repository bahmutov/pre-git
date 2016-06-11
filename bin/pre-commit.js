#!/usr/bin/env node

'use strict';

const log = require('debug')('pre-git');

/* jshint -W079 */
const Promise = require('bluebird');

var child = require('child_process');
var label = 'pre-commit';

function isForced() {
  log(label, 'arguments', process.argv);
  return process.argv.some(function (arg) {
    return arg === '-f' || arg === '--force';
  });
}

function errorMessage(err) {
  return err instanceof Error ? err.message : err;
}

// should we exit if there are no changes to commit?

// resolved => there are changes to commit
// rejected => might be an Error or nothing.
//   if nothing => not changes to commit
function haveChangesToCommit() {
  return new Promise(function (resolve, reject) {
    if (isForced()) {
      console.log('forcing pre-commit execution');
      return resolve();
    }

    child.exec('git status --porcelain', function changes(err, status) {
      if (err) {
        console.error(label, 'Failed to check for changes. Cannot run the tests.');
        console.error(err);
        return process.exit(1);
      }

      return status.trim().length ? resolve() : reject();
    });
  });
}

function printNothingToDo() {
  console.log('');
  console.log(label, 'No changes detected, bailing out.');
  console.log('');
}

const hasUntrackedFiles = require('pre-git').hasUntrackedFiles;
const run = require('pre-git').run;
const runTask = run.bind(null, label);

console.log('running bin/pre-commit.js script');
haveChangesToCommit()
  .then(hasUntrackedFiles)
  .then((has) => {
    if (has) {
      const message = 'Has untracked files in folder.\n' +
        'Please delete or ignore them.';
      return Promise.reject(new Error(message));
    }
  })
  .then(runTask, (err) => {
    if (err) {
      console.error(errorMessage(err));
      process.exit(-1);
    }
    printNothingToDo();
  })
  .catch((err) => {
    console.error(label, 'A problem');
    console.error(errorMessage(err));
    process.exit(-1);
  })
  .done();

