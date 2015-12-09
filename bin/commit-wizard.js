#!/usr/bin/env node --harmony

console.log('running commit-wizard in folder %s', process.cwd());
const la = require('lazy-ass');
const check = require('check-more-types');
const join = require('path').join;
const pkgPath = join(process.cwd(), 'package.json');
const pkg = require(pkgPath);
const preGit = require('pre-git');
const git = require('ggit');
const log = require('debug')('pre-git');
la(check.fn(log), 'missing debug log', log);

/* jshint -W079 */
const Promise = require('bluebird');

const label = 'pre-commit';

const config = pkg.config &&
  pkg.config['pre-git'];

const wizard = preGit.wizard();
la(check.object(wizard), 'could not get commit message wizard', wizard);

function getPreCommitCommands(config) {
  if (!config) {
    return;
  }
  const preCommit = config[label];
  if (check.unemptyString(preCommit)) {
    return [preCommit];
  }
  return preCommit;
}

function hasPreCommitCommands(config) {
  return check.unemptyArray(getPreCommitCommands(config));
}

var start = Promise.resolve(git.hasChanges())
  .then(function (hasSomethingToCommit) {
    if (!hasSomethingToCommit) {
      console.log('Nothing to commit');
      process.exit(0);
    }
  });

if (hasPreCommitCommands(config)) {
  console.log('package %s has pre-commit commands', pkg.name);
  console.log(getPreCommitCommands(config).join(', '));
  const run = preGit.run;
  la(check.fn(run), 'missing pre git run');
  const runLabeled = run.bind(null, label);

  start = start
    .then(runLabeled)
    .then(() => console.log('finished pre-commit check'));
}

/* jshint -W098 */
function guideUserMock() {
  return Promise.resolve('fix(git): fixing commit wizard');
}

function guideUser() {
  const inquirer = require('inquirer');

  return new Promise(function (resolve, reject) {
    wizard.prompter(inquirer, (message) => {
      if (!message) {
        return reject(new Error('No commit message'));
      }
      return resolve(message);
    });
  });
}

function commitWithMessage(commitMessage) {
  la(check.unemptyString(commitMessage), 'missing commit message', commitMessage);
  const gitCommit = git.commit;
  return gitCommit(commitMessage)
    .then(console.log.bind(console));
}

function errorMessage(err) {
  return err instanceof Error ? err.message : err;
}

function firstLine(str) {
  la(check.string(str), 'expected a string, got', str);
  return str.split('\n').shift();
}

function isValidMessage(message) {
  la(check.unemptyString(message), 'missing message');

  const first = firstLine(message);

  if (!check.unemptyString(first)) {
    return Promise.reject(new Error('missing first line'));
  }
  if (check.fn(wizard.validate)) {
    if (!wizard.validate(message)) {
      return Promise.reject(new Error('Invalid commit message\n' + message));
    }
  }
  return message;
}

function success() {
  console.log('commit wizard has finished');
}

start
  .then(guideUser)
  .then((message) => message.trim())
  .tap((message) => console.log(message))
  .then(isValidMessage)
  .then(commitWithMessage)
  .then(success)
  .catch((err) => {
    console.error(errorMessage(err));
    process.exit(-1);
  })
  .done();

