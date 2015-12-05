'use strict';

const la = require('lazy-ass');
const check = require('check-more-types');
const util = require('util');

const MAX_LENGTH = 100;
const PATTERN = /^((?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*))(\n|$)/;
const IGNORED = /^WIP\:/;

// simplified types
const TYPES = {
  feat: true,
  fix: true,
  chore: true,
  release: true
};

function parseMessage(str) {
  la(check.string(str), 'expected string message', str);

  var match = PATTERN.exec(str);

  if (!match) {
    error('does not match "<type>(<scope>): <subject>" ! was: ' + str);
    return false;
  }

  return {
    firstLine: match[1],
    type: match[2],
    scope: match[4],
    subject: match[5]
  };
}

var error = function() {
  // gitx does not display it
  // http://gitx.lighthouseapp.com/projects/17830/tickets/294-feature-display-hook-error-message-when-hook-fails
  // https://groups.google.com/group/gitx/browse_thread/thread/a03bcab60844b812
  console.error('INVALID COMMIT MSG: ' + util.format.apply(null, arguments));
};

function validateMessage(message) {
  var isValid = true;

  if (IGNORED.test(message)) {
    console.log('Commit message validation ignored.');
    return true;
  }

  var parsed = parseMessage(message);
  if (!parsed) {
    error('does not match "<type>(<scope>): <subject>" ! was: ' + message);
    return false;
  }

  if (parsed.firstLine.length > MAX_LENGTH) {
    error('is longer than %d characters !', MAX_LENGTH);
    isValid = false;
  }

  if (!TYPES.hasOwnProperty(parsed.type)) {
    error('"%s" is not allowed type !', parsed.type);
    return false;
  }

  // Some more ideas, do want anything like this ?
  // - Validate the rest of the message (body, footer, BREAKING CHANGE annotations)
  // - allow only specific scopes (eg. fix(docs) should not be allowed ?
  // - auto correct the type to lower case ?
  // - auto correct first letter of the subject to lower case ?
  // - auto add empty line after subject ?
  // - auto remove empty () ?
  // - auto correct typos in type ?
  // - store incorrect messages, so that we can learn

  return isValid;
};

module.exports = {
  validateMessage: validateMessage,
  parseMessage: parseMessage
};
