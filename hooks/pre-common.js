'use strict';

var child = require('child_process');
var path = require('path');
var fs = require('fs');
var label = 'pre-commit:';

function findPackage(dir) {
  if (! dir) {
    dir = path.join(process.cwd(), process.env.GIT_PREFIX);
  }
  
  var files = fs.readdirSync(dir);
  
  if (files.indexOf('package.json') >= 0) {
    return path.join(dir, 'package.json');
  }
  
  if (dir === '/') {
    throw new Error('Could not find package.json up from: ' + dir);
  }
  else if (!dir || dir === '.') {
    throw new Error('Cannot find package.json from unspecified directory');
  }
  
  return findPackage(path.dirname(dir));
}

function getProjRoot(cb) {
  child.exec('git rev-parse --show-toplevel', function onRoot(err, output) {
    if (err) {
      console.error('');
      console.error(label, 'Failed to find git root. Cannot run the tests.');
      console.error(err);
      console.error('');
      return process.exit(1);
    }
    var gitRoot = output.trim();
    var projRoot = path.join(gitRoot,process.env.GIT_PREFIX);
    var pkg;
    try {
      var file = findPackage();
      pkg = require(file);
    }
    catch (e) {
      return cb(gitRoot);
    }
    if (pkg['pre-git-cwd']) {
      projRoot = path.resolve(path.join(gitRoot, pkg['pre-git-cwd']));
    }
    cb(projRoot);
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
  console.error(label, 'You\'ve failed to pass all the hooks.');
  console.error(label);

  if (err.ran) {
    console.error(label, 'The "' + err.ran + '" script failed.');
  } else {
    var stack = err.stack.split('\n');
    console.error(label, 'An Error was thrown: ' + stack.shift());
    console.error(label);
    stack.forEach(function trace(line) {
      console.error(label, '   ' + line.trim());
    });
  }
  console.error(label);
  console.error(label, 'You can skip the git pre-commit hook by running:');
  console.error(label);
  console.error(label, '   git commit -n (--no-verify)');
  console.error(label);
  console.error(label, 'But this is not adviced as your tests are obviously failing.');
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
    pkg = require(root + '/package.json');
  }
  catch (e) {
    return failure(e);
  }

  //
  // If there's a `pre-commit` property in the package.json we should use that
  // array.
  //
  if (pkg[label]) {
    if (Array.isArray(pkg[label])) {
      run = pkg[label];
    } else if (typeof pkg[label] === 'string') {
      run = [pkg[label]];
    }
  }

  return run;
}

//
// Behold, a lazy man's async flow control library;
//
function runner(root, run) {
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
      if (!task) {
        return done();
      }

      console.log('executing task "' + task + '"');

      var options = {
        cwd: root,
        env: process.env,
        stdio: [0, 1, 2]
      };
      child.exec(task, options, function onTaskFinished(err, stdio) {
        console.log(stdio);

        if (err) {
          return next(new Error(task + ' closed with error ' + err), task);
        }
        next(undefined, task);
      });
    })();
  })(function ready(err) {
    if (err) {
      return failure(err);
    }

    //
    // Congratulation young padawan, all hooks passed.
    //
    process.exit(0);
  });
}

function checkInputs(label, check) {
  if (typeof label !== 'string') {
    throw new Error('Expected string label (pre-commit, pre-push)');
  }
  if (typeof check !== 'function') {
    throw new Error('Expected check changes function');
  }
}

function runAtRoot(root, label, check) {
  if (!root) {
    console.error('');
    console.error(label, 'Failed to find git root. Cannot run the tests.');
    console.error('');
    return process.exit(1);
  }
  checkInputs(label, check);

  var tasks = getTasks(root, label);
  if (!tasks || !tasks.length) {
    console.log('');
    console.log(label, 'Nothing to pre- test. Bailing out.');
    console.log('');
    return;
  }

  check(function () {
    runner(root, tasks);
  });
}

function run(label, check) {
  checkInputs(label, check);
  getProjRoot(function (root) {
    runAtRoot(root, label, check);
  });
}

module.exports = run;
