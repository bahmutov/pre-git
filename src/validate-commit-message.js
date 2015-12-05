const log = require('debug')('pre-git');

const label = 'commit-msg';
const read = require('fs').readFileSync;
const exists = require('fs').existsSync;
const join = require('path').join;
const preGit = require('./pre-git');
const la = require('lazy-ass');
const check = require('check-more-types');
const validateMessage = require('./valid-message');

const included = 'validate-commit-msg';

la(check.object(preGit), 'missing pre git object');

function loadValidate(packageName) {
  const validator = require(packageName);
  return validator;
}

function pickFunction(validator) {
  const isValid = check.fn(validator) ? validator : validator.validateMessage;
  la(check.fn(isValid), 'validator is not a function', isValid);
  return isValid;
}

function decideValidator(validators) {
  if (validators === true || validators[0] === included) {
    console.log('using built-in commit message validation');
    return pickFunction(validateMessage);
  }

  console.log('loading message validator "%s"', validators[0]);
  return pickFunction(loadValidate(validators[0]));
}

function validateCommitMessage(message) {
  console.log('pre-git: validating git message\n' + message);

  la(check.fn(preGit.getTasks), 'missing preGit.getTasks',
    Object.keys(preGit));

  const validators = preGit.getTasks(label);
  console.log('validators', validators);

  if (!validators) {
    return true;
  }

  if (check.array(validators) && check.empty(validators)) {
    return true;
  }

  // TODO go through each?
  const validate = decideValidator(validators);
  la(check.fn(validate), 'missing validate function', validate);

  return validate(message);
}

module.exports = validateCommitMessage;
