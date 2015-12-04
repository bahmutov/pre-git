'use strict';

var child = require('child_process');
var path = require('path');
var fs = require('fs');
var log = require('debug')('pre-git');
/* jshint -W079 */
var Promise = require('bluebird');

var label = 'pre-commit:';

var gitPrefix = process.env.GIT_PREFIX || '';

function isAtRoot(dir) {
  return dir === '/';
}

function isPackageAmongFiles(dir) {
  var files = fs.readdirSync(dir);
  return files.indexOf('package.json') >= 0;
}

function verifyValidDirectory(dir) {
  var cwd = process.cwd();
  if (isAtRoot(dir)) {
    throw new Error('Could not find package.json starting from ' + cwd);
  } else if (!dir || dir === '.') {
    throw new Error('Cannot find package.json from unspecified directory via ' + cwd);
  }
}

function findPackage(dir) {
  var cwd = process.cwd();
  if (! dir) {
    dir = path.join(cwd, gitPrefix);
  }

  if (isPackageAmongFiles(dir)) {
    return path.join(dir, 'package.json');
  }

  verifyValidDirectory(dir);

  // go to the parent folder and look there
  var parentPath = path.dirname(dir);
  if (parentPath === dir) {
    throw new Error('Cannot got up the folder to find package.json from ' + cwd);
  }
  return findPackage(parentPath);
}

// returns a promise
// Can we use ggit for this?
function getProjRoot() {
  return new Promise(function (resolve, reject) {
    child.exec('git rev-parse --show-toplevel', function onRoot(err, output) {
      if (err) {
        console.error('');
        console.error(label, 'Failed to find git root. Cannot run the tests.');
        console.error(err);
        console.error('');
        return reject(new Error('Failed to find git in the project root'));
      }

      var gitRoot = output.trim();
      var projRoot = path.join(gitRoot, gitPrefix);
      var pkg;
      try {
        var file = findPackage();
        pkg = require(file);
        projRoot = path.dirname(file);
      }
      catch (e) {
        return resolve(gitRoot);
      }

      if (pkg['pre-git-cwd']) {
        projRoot = path.resolve(path.join(gitRoot, pkg['pre-git-cwd']));
      }
      return resolve(projRoot);
    });
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
    console.error(label, 'An Error was thrown');
    var stack = err.stack.split('\n');
    console.error(stack.shift());
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
  console.error(label, 'But this is not advised as your tests are obviously failing.');
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
    var file = findPackage();
    pkg = require(file);
  }
  catch (e) {
    return failure(e);
  }

  //
  // If there's a `pre-commit` or other properties in the package.json
  // we should use that array.
  //
  run = pkg[label] ||
    pkg.config &&
    pkg.config['pre-git'] &&
    pkg.config['pre-git'][label];
  if (typeof run === 'string') {
    run = [run];
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

      var options = {
        cwd: root,
        env: process.env
      };

      console.log('executing task "' + task + '"');

      var proc = child.exec(task, options);
      proc.stdout.on('data', process.stdout.write.bind(process.stdout));
      proc.stderr.on('data', process.stderr.write.bind(process.stderr));
      proc.on('close', function onTaskFinished(code) {
        if (code > 0) {
          return next(new Error(task + ' closed with code ' + code), task);
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
  if (typeof label !== 'string' || !label) {
    throw new Error('Expected string label (pre-commit, pre-push)');
  }
  if (typeof check !== 'function') {
    throw new Error('Expected check changes function');
  }
}

function runAtRoot(root, label, check) {
  return new Promise(function (resolve, reject) {
    if (!root) {
      console.error('');
      console.error(label, 'Failed to find git root. Cannot run the tests.');
      console.error('');
      return reject(new Error('Failed to find git root'));
    }

    checkInputs(label, check);

    var tasks = getTasks(root, label);
    if (!tasks || !tasks.length) {
      console.log('');
      console.log(label, 'Nothing the hook needs to do. Bailing out.');
      console.log('');
      return resolve('Nothing to do for ' + label);
    }

    check(function () {
      runner(root, tasks);
    }, root);
  });
}

function run(hookLabel, check) {
  log('running', hookLabel);

  checkInputs(hookLabel, check);
  label = hookLabel;

  return getProjRoot()
    .tap((root) => log('running', hookLabel, 'in', root))
    .then((root) => runAtRoot(root, hookLabel, check));
}

module.exports = run;

if (!module.parent) {
  run('demo', () => true)
    .done();
}
