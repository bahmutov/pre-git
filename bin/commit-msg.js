#!/usr/bin/env node --harmony

'use strict';

const label = 'commit-msg';
const read = require('fs').readFileSync;
const exists = require('fs').existsSync;
const join = require('path').join;
const log = require('debug')('pre-git');
const preGit = require('pre-git');
const la = require('lazy-ass');
const check = require('check-more-types');

const includedCommitMessageValidator = 'validate-commit-msg';

function loadValidate(packageName) {
  const validator = require(packageName);
  const isValid = check.fn(validator) ? validator : validator.validateMessage;
  la(check.fn(isValid), 'validator is not a function', isValid);
  return isValid;
}

function validateCommitMessage(projectRoot) {
  log('commit-msg in %s', projectRoot);

  const validators = preGit.getTasks(label);
  la(check.array(validators), 'expected list of validators', validators);

  if (check.empty(validators)) {
    return;
  }

  // TODO go through each?
  const first = validators[0];
  const validate = loadValidate(first);
  console.log('using message validator "%s"', first);
  return validate();
}

preGit.getProjRoot()
  .then(validateCommitMessage)
  .catch(preGit.printError)
  .done();
