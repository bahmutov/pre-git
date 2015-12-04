#!/usr/bin/env node --harmony

'use strict';

var label = 'commit-msg';
var read = require('fs').readFileSync;
var exists = require('fs').existsSync;
var join = require('path').join;
var run = require(join(__dirname, 'pre-common'));
var includedCommitMessageValidator = 'validate-commit-msg';

function loadPackage(folder) {
  var filename = join(folder, 'package.json');
  return JSON.parse(read(filename));
}

function loadValidateCommitMessage(folder) {
  var packagePath = join(folder,
    'node_modules/pre-git/node_modules', includedCommitMessageValidator);
  if (!exists(packagePath)) {
    packagePath = join(folder, 'node_modules', includedCommitMessageValidator);
  }
  if (!exists(packagePath)) {
    throw new Error('Cannot find validation module ' + includedCommitMessageValidator);
  }
  var isValid = require(packagePath).validateMessage;
  if (typeof isValid !== 'function') {
    throw new Error('something changed in ' + includedCommitMessageValidator + ' API');
  }
}

function isBuiltInValidation(commands) {
  return commands === includedCommitMessageValidator ||
    (Array.isArray(commands) &&
      isBuiltInValidation(commands[0]));
}

function validateCommitMessage(cb, projectRoot) {
  console.log('commit-msg in %s', projectRoot);
  var pkg = loadPackage(projectRoot);
  var hookCommands = (pkg.config &&
    pkg.config['pre-git'] &&
    pkg.config['pre-git']['commit-msg']) || pkg['commit-msg'];
  if (!hookCommands) {
    return;
  }
  if (isBuiltInValidation(hookCommands)) {
    console.log('using built-in validator %s', includedCommitMessageValidator);
    loadValidateCommitMessage(projectRoot);
  } else {
    cb();
  }
}

run(label, validateCommitMessage);
