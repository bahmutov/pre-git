'use strict';

const la = require('lazy-ass');
const check = require('check-more-types');
const ggit = require('ggit');

var child = require('child_process');
var path = require('path');
var fs = require('fs');

const log = require('debug')('pre-git');
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
  la(check.unemptyString(dir), 'missing dir');

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
    log('found package in folder', dir);
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

function getPackage() {
  var filename = findPackage();
  la(check.unemptyString(filename), 'could not find package');
  var pkg = require(filename);
  return pkg;
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
function failure(label, err) {
  console.error('');
  console.error(label, 'You\'ve failed to pass all the hooks.');
  console.error(label);

  const chalk = require('chalk');
  if (err instanceof Error) {
    console.error(label, 'An Error was thrown from command');
    if (err.ran) {
      console.error(chalk.supportsColor ? chalk.bold.yellow(err.ran) : err.ran);
    }

    const stack = err.stack.split('\n');
    const firstLine = stack.shift();
    console.error(chalk.supportsColor ? chalk.red(firstLine) : firstLine);
    console.error(label);
    stack.forEach(function trace(line) {
      console.error(label, '   ' + line.trim());
    });
  } else {
    console.error(label, chalk.supportsColor ? chalk.red(err) : err);
  }

  const skipOption = label === 'pre-push' ? '--no-verify' : '-n (--no-verify)';
  const skipOptionText = chalk.supportsColor ? chalk.bold(skipOption) : skipOption;
  console.error(label);
  console.error(label, 'You can skip the git hook by running with', skipOptionText);
  console.error(label);
  console.error(label, 'But this is not advised as your tests are obviously failing.');
  console.error('');

  process.exit(1);
}

function getConfig() {
  const packageName = 'pre-git';
  const pkg = getPackage();
  return pkg.config && pkg.config[packageName];
}

function getTasks(label) {
  var pkg = getPackage();
  la(check.object(pkg), 'missing package', pkg);

  const config = getConfig();
  var run = pkg[label] ||
    config &&
    config[label];

  if (check.string(run)) {
    run = [run];
  }
  log('tasks for label "%s" are', label, run);
  return run;
}

function hasUntrackedFiles() {
  return ggit.untrackedFiles()
    .then(function (names) {
      return check.unempty(names);
    });
}

function runTask(root, task) {
  console.log('executing task "' + task + '"');

  const options = {
    cwd: root,
    env: process.env
  };

  return new Promise(function (resolve, reject) {
    const proc = child.exec(task, options);
    proc.stdout.on('data', process.stdout.write.bind(process.stdout));
    proc.stderr.on('data', process.stderr.write.bind(process.stderr));
    proc.on('close', function onTaskFinished(code) {
      if (code > 0) {
        let err = new Error(task + ' closed with code ' + code);
        err.ran = task;
        return reject(err);
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

function skipPrecommit() {
  return process.argv[2] !== 'origin';
}

function getSkipTest(label) {
  const skipConditions = {
    'pre-push': skipPrecommit
  };
  function dontSkip() {
    return false;
  }
  const skip = skipConditions[label] || dontSkip;
  return skip;
}

// returns a promise
function runAtRoot(root, label) {
  log('running %s at root %s', label, root);
  log('cli arguments', process.argv);
  la(check.unemptyString(label), 'missing label', label);
  const skip = getSkipTest(label);
  if (skip()) {
    log('skipping tasks for', label);
    return Promise.resolve();
  }

  function showError(message) {
    console.error('');
    console.error(label, message);
    console.error('');
    return Promise.reject(new Error(message));
  }

  function noUntrackedFiles(foundUntrackedFiles) {
    if (foundUntrackedFiles) {
      return showError('Cannot commit with untracked files present.');
    }
  }

  if (!root) {
    return showError('Failed to find git root. Cannot run the tests.');
  }

  function runTasksForLabel() {
    var tasks = getTasks(label);
    log('tasks for %s', label, tasks);

    if (!tasks || !tasks.length) {
      console.log('');
      console.log(label, 'Nothing the hook needs to do. Bailing out.');
      console.log('');
      return Promise.resolve('Nothing to do for ' + label);
    }

    const runTaskAt = runTask.bind(null, root);
    return Promise.each(tasks, runTaskAt);
  }

  if (label === 'pre-commit') {
    return hasUntrackedFiles()
      .then(noUntrackedFiles)
      .then(runTasksForLabel);
  }
  return runTasksForLabel();
}

function run(hookLabel) {
  log('running', hookLabel);
  checkInputs(hookLabel);

  label = hookLabel;

  // TODO should the failure action be outside?
  return getProjRoot()
    .tap((root) => log('running', hookLabel, 'in', root))
    .then((root) => runAtRoot(root, hookLabel))
    .catch((err) => failure(hookLabel, err));
}

function errorMessage(err) {
  return err instanceof Error ? err.message : err;
}

function printError(x) {
  console.error(errorMessage(x) || 'Unknown error');
}

function isBuiltInWizardName(name) {
  la(check.unemptyString(name), 'invalid name', name);
  const builtIn = {
    simple: true,
    conventional: true,
    'cz-conventional-changelog': true
  };
  return builtIn[name];
}

function loadWizard(name) {
  la(check.unemptyString(name), 'missing commit wizard name', name);
  const moduleNames = {
    simple: 'simple-commit-message',
    conventional: 'conventional-commit-message',
    'cz-conventional-changelog': 'conventional-commit-message'
  };
  const loadName = moduleNames[name];
  la(check.unemptyString(loadName),
    'Unknown commit message wizard name', name);
  log('loading wizard', loadName, 'for name', name);
  return require(loadName);
}

function getWizardName() {
  const config = getConfig();
  const defaultName = 'simple';
  log('commit message wizard name from', config);
  if (!config) {
    log('no config, using default name', defaultName);
    return defaultName;
  }
  if (config.wizard) {
    la(check.unemptyString(config.wizard), 'expected wizard name', config.wizard);
    log('using wizard name', config.wizard);
    return config.wizard;
  }

  const value = config['commit-msg'];
  if (check.unemptyString(value)) {
    log('using config commit-msg property', value);
    return value;
  }
  if (check.array(value) && value.length === 1) {
    log('using config commit-msg single value', value);
    return value[0];
  }
}

function pickWizard() {
  const wizardName = getWizardName();
  if (!wizardName) {
    log('no wizard name set');
    return;
  }
  log('using commit message wizard %s', wizardName);

  const wiz = isBuiltInWizardName(wizardName) ?
    loadWizard(wizardName) : require(wizardName);
  la(check.fn(wiz.prompter), 'missing wizard prompter', wizardName, wiz);
  return wiz;
}

function customCommitMsgPattern() {
  const config = getConfig();
  const msgPattern = config['msg-pattern'];

  if (!msgPattern) {
    return false;
  }

  return msgPattern;
}

module.exports = {
  run: run,
  getTasks: getTasks,
  getProjRoot: getProjRoot,
  printError: printError,
  wizard: pickWizard,
  hasUntrackedFiles: hasUntrackedFiles,
  customMsgPattern: customCommitMsgPattern
};

if (!module.parent) {
  run('demo-error', () => true)
    .then(() => log('finished all tasks'))
    .done();
}
