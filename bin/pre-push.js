#!/usr/bin/env node --harmony

'use strict';

const log = require('debug')('pre-git');

/* jshint -W079 */
const Promise = require('bluebird');

const child = require('child_process');
const label = 'pre-push';

function failed(err) {
  console.error(label, 'Check went wrong.');
  console.error(label, err);
  return process.exit(1);
}

// todo: find if there are commits to push for any remote name / any branch
// detect current branch
function haveCommitsToPush() {
  return new Promise(function (resolve, reject) {
    child.exec('git rev-parse --abbrev-ref HEAD', function (err, stdout) {
      log('rev-parse results', err, stdout);
      if (err) {
        return failed(err);
      }

      var branch = 'master';
      if (stdout.trim().length) {
        branch = stdout.trim();
      }
      child.exec('git ls-remote --heads origin ' + branch, function (err, stdout) {
        log('ls-remote results', err, stdout);
        if (err) {
          return failed(err);
        }

        if (!stdout.trim().length) {
          console.log('New branch "' + branch + '", pushing...');
          return resolve();
        }

        child.exec('git diff --name-only origin/' + branch + '..HEAD', function (err, stdout) {
          log('diff --names-only results', err, stdout);
          if (err) {
            return failed(err);
          }

          if (!stdout.trim().length) {
            return reject();
          }
          console.log(label, 'Detected files in diff:',  stdout.trim().split('\n').length);
          resolve();
        });
      });
    });
  });
}

function printNothingToDo() {
  console.log('');
  console.log(label, 'No local commits detected, bailing out.');
  console.log('');
}

const run = require('pre-git').run;
const runTask = run.bind(null, label);

haveCommitsToPush()
  .then(runTask, (err) => {
    if (err) {
      failed(err);
    }
    printNothingToDo();
    process.exit(0);
  })
  .finally(() => process.exit(-1))
  .done();
