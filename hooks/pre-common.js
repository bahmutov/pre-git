'use strict';

var child = require('child_process');

function getGitRoot(cb) {
  child.exec('git rev-parse --show-toplevel', cb);
}

/**
 * You've failed on some of the scripts, output how much you've sucked today.
 *
 * @param {Error} err The actual error.
 * @api private
 */
function failure(err) {
  console.error('');
  console.error('pre-commit: You\'ve failed to pass all the hooks.');
  console.error('pre-commit:');

  if (err.ran) {
    console.error('pre-commit: The "npm run '+ err.ran +'" script failed.');
  } else {
    var stack = err.stack.split('\n')
    console.error('pre-commit: An Error was thrown: '+ stack.shift());
    console.error('pre-commit:');
    stack.forEach(function trace(line) {
      console.error('pre-commit:   '+ line.trim());
    });
  }
  console.error('pre-commit:');
  console.error('pre-commit: You can skip the git pre-commit hook by running:');
  console.error('pre-commit:');
  console.error('pre-commit:   git commit -n (--no-verify)');
  console.error('pre-commit:');
  console.error('pre-commit: But this is not adviced as your tests are obviously failing.');
  console.error('');
  process.exit(1);
}

module.exports = {
  getGitRoot: getGitRoot,
  failure: failure
};
