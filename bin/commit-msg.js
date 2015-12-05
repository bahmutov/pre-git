#!/usr/bin/env node --harmony

'use strict';

const label = 'commit-msg';
const read = require('fs').readFileSync;
const exists = require('fs').existsSync;
const join = require('path').join;
const log = require('debug')('pre-git');
const ggit = require('ggit');
const preGit = require('pre-git');
const la = require('lazy-ass');
const check = require('check-more-types');

const included = 'validate-commit-msg';

function loadValidate(packageName) {
  const validator = require(packageName);
  const isValid = check.fn(validator) ? validator : validator.validateMessage;
  la(check.fn(isValid), 'validator is not a function', isValid);
  return isValid;
}

function decideValidator(validators) {
  if (validators === true || validators[0] === included) {
    log('using built-in commit message validation');
    return preGit.validateMessage;
  }

  console.log('loading message validator "%s"', validators[0]);
  return loadValidate(validators[0]);
}

function validateCommitMessage(message) {
  log('validating git message\n' + message);

  const validators = preGit.getTasks(label);
  if (!validators) {
    return;
  }

  if (check.array(validators) && check.empty(validators)) {
    return;
  }

  // TODO go through each?
  const validate = decideValidator(validators);
  la(check.fn(validate), 'missing validate function', validate);

  return validate(message);
}

ggit.commitMessage()
  .then(validateCommitMessage)
  .catch(preGit.printError)
  .done();
