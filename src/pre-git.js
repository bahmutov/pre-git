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
  const packageName = 'pre-git';

  var pkg, run = [];

  //
  // Bail-out when we failed to parse the package.json, there is probably a some
  // funcky chars in there.
  //
  var file;
  try {
    file = findPackage();
    pkg = require(file);
  }
  catch (e) {
    return failure(e);
  }

  log('inspecting package %s for tasks %s', file, label);
  //
  // If there's a `pre-commit` or other properties in the package.json
  // we should use that array.
  //
  run = pkg[label] ||
    pkg.config &&
    pkg.config[packageName] &&
    pkg.config[packageName][label];
  if (typeof run === 'string') {
    run = [run];
  }
  return run;
}

function runTask(root, task) {
  console.log('executing task "' + task + '"');

  var options = {
    cwd: root,
    env: process.env
  };

  return new Promise(function (resolve, reject) {
    var proc = child.exec(task, options);
    proc.stdout.on('data', process.stdout.write.bind(process.stdout));
    proc.stderr.on('data', process.stderr.write.bind(process.stderr));
    proc.on('close', function onTaskFinished(code) {
      if (code > 0) {
        return reject(new Error(task + ' closed with code ' + code));
      }
      return resolve('task "' + task + '" passed');
    });
  });
}

function checkInputs(label) {
  if (typeof label !== 'string' || !label) {
    throw new Error('Expected string label (pre-commit, pre-push)');
  }
}

function runAtRoot(root, label) {
  log('running %s at root %s', label, root);

  return new Promise(function (resolve, reject) {
    if (!root) {
      console.error('');
      console.error(label, 'Failed to find git root. Cannot run the tests.');
      console.error('');
      return reject(new Error('Failed to find git root'));
    }

    var tasks = getTasks(root, label);
    log('tasks for %s', label, tasks);

    if (!tasks || !tasks.length) {
      console.log('');
      console.log(label, 'Nothing the hook needs to do. Bailing out.');
      console.log('');
      return resolve('Nothing to do for ' + label);
    }

    const runTaskAt = runTask.bind(null, root);

    return resolve(
      Promise.each(tasks, runTaskAt)
    );
  });
}

function run(hookLabel) {
  log('running', hookLabel);
  checkInputs(hookLabel);

  label = hookLabel;

  // TODO should the failure action be outside?
  return getProjRoot()
    .tap((root) => log('running', hookLabel, 'in', root))
    .then((root) => runAtRoot(root, hookLabel))
    .catch(failure);
}

module.exports = run;

if (!module.parent) {
  run('demo-error', () => true)
    .then(() => log('finished all tasks'))
    .done();
}
