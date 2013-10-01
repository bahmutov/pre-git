'use strict';

var child = require('child_process');

function getGitRoot(cb) {
  child.exec('git rev-parse --show-toplevel', function onRoot(err, output) {
    if (err) {
      console.error('');
      console.error('pre-commit: Failed to find git root. Cannot run the tests.');
      console.error('');
      return process.exit(1);
    }
    var root = output.trim();
    cb(root);
  });
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

function getTasks(root, label) {
  var pkg, run = [];

   //
  // Bail-out when we failed to parse the package.json, there is probably a some
  // funcky chars in there.
  //
  try {
    pkg = require(root +'/package.json'); }
  catch (e) {
    return failure(e);
  }

  if (!pkg.scripts) {
    console.log('');
    console.log(label + ': No scripts detected in the package.json, bailing out.');
    console.log('');
    return;
  }

  //
  // If there's a `pre-commit` property in the package.json we should use that
  // array.
  //
  if (pkg[label] && Array.isArray(pkg[label])) {
    run = pkg[label];
  }

  //
  // If we don't have any run processes to run try to see if there's a `test`
  // property which we should run instead. But we should check if it's not the
  // default value that `npm` adds when your run the `npm init` command.
  //
  if (!run.length
    && pkg.scripts.test
    && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1'
  ) {
    run.push('test');
  }

  return run;
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
  runner: runner,
  getTasks: getTasks
};
