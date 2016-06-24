#!/usr/bin/env node

'use strict';

const ggit = require('ggit');
const preGit = require('pre-git');
const la = require('lazy-ass');
const check = require('check-more-types');
const log = require('debug')('pre-git');

function checkMessageAgainstPattern(msg, pattern) {

  var regex = new RegExp(pattern);
  
  if (!regex.test(msg)) {
    log('invalid commit message, must match the following pattern: ' + pattern, msg);
    process.exit(-1);
  }

  return true;

}

function checkMessage(msg) {

  const msgPattern = preGit.customMsgPattern();
  
  if (msgPattern) {
    checkMessageAgainstPattern(msg, msgPattern);
  }

  const wizard = preGit.wizard();
  if (!wizard) {
    log('no commit message wizard defined');
    process.exit(0);
  }

  log('found commit message wizard with name', wizard.name);

  la(check.fn(wizard.validate),
      'missing wizard validate method,', Object.keys(wizard));
  la(check.fn(preGit.printError),
      'missing preGit.printError,', Object.keys(preGit));

  log('checking commit message:', msg);
  const isValid = wizard.validate(msg);
  if (!isValid) {
    log('invalid commit message', msg);
    process.exit(-1);
  }
  log('valid git commit message');
}

ggit.commitMessage()
  .then((msg) => {
    return process.env.TEST_GIT_MESSAGE || msg;
  })
  .then(checkMessage)
  .catch((err) => {
    // assuming each validator printed the errors?
    console.error(err);
    process.exit(-1);
  })
  .done();
