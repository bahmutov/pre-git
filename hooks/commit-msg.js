#!/usr/bin/env node

'use strict';

var run = require(__dirname + '/pre-common');
var label = 'commit-msg';
var isValid = require('validate-commit-message');

function validateCommitMessage(cb) {
  console.log('commit-msg');
  if (isValid()) {
    console.log('commit message is valid');
    cb();
  } else {
    console.log('commit message is invalid');
  }
}

run(label, validateCommitMessage);
