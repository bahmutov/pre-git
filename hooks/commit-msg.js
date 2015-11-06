#!/usr/bin/env node

'use strict';

var run = require(__dirname + '/pre-common');
var label = 'commit-msg';
var read = require('fs').readFileSync;
var join = require('path').join;

function loadPackage(folder) {
  var filename = join(folder, 'package.json');
  return JSON.parse(read(filename));
}

function loadValidateCommitMessage(folder) {
  var packagePath = join(folder,
    'node_modules/pre-git/node_modules/validate-commit-msg');
  var isValid = require(packagePath).validateMessage;
  if (typeof isValid !== 'function') {
    throw new Error('something changed in validate-commit-msg API');
  }
}

function isBuiltInValidation(commands) {
  return commands === 'validate-commit-msg' ||
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
    loadValidateCommitMessage(projectRoot);
  } else {
    cb();
  }
}

run(label, validateCommitMessage);
