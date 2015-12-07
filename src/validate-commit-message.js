const label = 'commit-msg';
const preGit = require('./pre-git');
const la = require('lazy-ass');
const check = require('check-more-types');
const validateMessage = require('./valid-message');

const included = 'validate-commit-msg';

/* jshint -W079 */
const Promise = require('bluebird');

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

// returns a promise
function validateCommitMessage(message) {
  la(check.fn(preGit.getTasks), 'missing preGit.getTasks',
    Object.keys(preGit));

  return new Promise(function (resolve, reject) {
    const validators = preGit.getTasks(label);
    if (!validators) {
      return resolve();
    }

    if (check.array(validators) && check.empty(validators)) {
      return resolve();
    }

    // TODO go through each?
    const validate = decideValidator(validators);
    la(check.fn(validate), 'missing validate function', validate);

    return validate(message) ? resolve() : reject();
  });
}

module.exports = validateCommitMessage;
