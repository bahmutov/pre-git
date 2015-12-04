#!/usr/bin/env node --harmony

console.log('running commit-wizard in folder %s', process.cwd());
const join = require('path').join;
const pkgPath = join(process.cwd(), 'package.json');
const pkg = require(pkgPath);
const check = require('check-more-types');
const Promise = require('bluebird');

const label = 'pre-commit';

const config = pkg.config &&
  pkg.config['pre-git'];

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

function ok() {
  return true;
}

var start = Promise.resolve(true);

if (hasPreCommitCommands(config)) {
  console.log('package %s has pre-commit commands', pkg.name);
  console.log(getPreCommitCommands(config).join(', '));
  const run = require('..');

  start = start
    .then(() => run(label, ok))
    .then(() => console.log('finished pre-commit check'));
}

function guideUser() {
  const wizardName = config && config.wizard || 'cz-conventional-changelog';
  console.log('using commit message wizard %s', wizardName);

  const wizard = require(wizardName);
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
  const gitCommit = require('ggit').commit;
  return gitCommit(commitMessage)
    .then(console.log.bind(console));
}

function errorMessage(err) {
  return err instanceof Error ? err.message : err;
}

start
  .then(guideUser)
  .then((message) => message.trim())
  .tap((message) => console.log(message))
  .then(commitWithMessage)
  .catch((err) => {
    console.error(errorMessage(err));
    process.exit(-1);
  })
  .done();

