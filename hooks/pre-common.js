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

//
// Behold, a lazy man's async flow control library;
//
function runner(run) {
  (function taskRunner(done) {
    (function next(err, task) {
      //
      // Bailout when we received an error. This will make sure that we don't
      // run the rest of the tasks.
      //
      if (err) {
        err = new Error(err.message);
        err.ran = task;
        return done(err);
      }

      // Check if we have tasks to be executed or if we are complete.
      task = run.shift();
      if (!task) return done();

      var npm = child.spawn('npm', ['run', task], {
        cwd: root,            // Make sure that we spawn it in the root of repo.
        env: process.env,     // Give them the same ENV variables.
        stdio: [0, 1, 2]      // Pipe all the things.
      });

      //
      // Check the close code to see if we passed or failed.
      //
      npm.on('close', function close(code) {
        if (code !== 0) return next(new Error(task +' closed with code '+ code), task);

        next(undefined, task);
      });
    })();
  })(function ready(err) {
    if (err) return failure(err);

    //
    // Congratulation young padawan, all hooks passed.
    //
    process.exit(0);
  });
}

module.exports = {
  getGitRoot: getGitRoot,
  failure: failure,
  runner: runner
};
