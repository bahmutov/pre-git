#!/usr/bin/env node --harmony

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

function printNoChanges() {
  console.log('');
  console.log(label, 'No changes detected, bailing out.');
  console.log('');
}

const run = require('pre-git').run;
const runTask = run.bind(null, label);

haveChangesToCommit()
  .then(runTask, (err) => {
    if (err) {
      console.log(errorMessage(err));
      process.exit(-1);
    }
    printNoChanges();
  })
  .done();

