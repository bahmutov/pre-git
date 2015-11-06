#!/usr/bin/env node

'use strict';

var run = require(__dirname + '/pre-common');
var label = 'commit-msg';
var read = require('fs').readFileSync;
var join = require('path').join;
var includedCommitMessageValidator = 'validate-commit-msg';

function loadPackage(folder) {
  var filename = join(folder, 'package.json');
  return JSON.parse(read(filename));
}

function loadValidateCommitMessage(folder) {
  var packagePath = join(folder,
    'node_modules/pre-git/node_modules', includedCommitMessageValidator);
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
  var hookCommands;
  if (pkg['commit-msg']) {
    hookCommands = pkg['commit-msg'];
  }
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
