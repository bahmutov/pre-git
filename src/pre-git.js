'use strict';

const la = require('lazy-ass');
const check = require('check-more-types');
const ggit = require('ggit');

var child = require('child_process');
var path = require('path');
var fs = require('fs');

const packageName = 'pre-git';
const log = require('debug')(packageName);
/* jshint -W079 */
var Promise = require('bluebird');

var label = 'pre-commit:';
// magic value, meaning we found package.json but it has no 'config' object
const MISSING_GIT_CONFIG = 'MISSING_GIT_CONFIG';

var gitPrefix = process.env.GIT_PREFIX || '';
log('git prefix env', process.env.GIT_PREFIX);

function isAtRoot(dir) {
  return dir === '/';
}

function isPackageAmongFiles(dir) {
  var files = fs.readdirSync(dir);
  return files.indexOf('package.json') >= 0;
}

function hasPreGitInFile(packageFilename) {
  var pkg = require(packageFilename);
  if (pkg.dependencies && pkg.dependencies[packageName]) {
    return true;
  }
  if (pkg.devDependencies && pkg.devDependencies[packageName]) {
    return true;
  }
  return false;
}

function verifyValidDirectory(dir) {
  la(check.unemptyString(dir), 'missing dir');

  var cwd = process.cwd();
  if (isAtRoot(dir)) {
    throw new Error('Could not find package.json starting from ' + cwd);
  } else if (!dir || dir === '.') {
    throw new Error(
      'Cannot find package.json from unspecified directory via ' + cwd
    );
  }
}

// finds package.json with config by going up the folder chain
function findPackage(dir) {
  var cwd = process.cwd();
  if (!dir) {
    dir = path.join(cwd, gitPrefix);
    log('set dir to %s for cwd %s and git prefix %s', dir, cwd, gitPrefix);
  }

  if (isPackageAmongFiles(dir)) {
    const filename = path.join(dir, 'package.json');
    log('found package file %s', filename);
    if (hasConfigInFile(filename)) {
      log('file %s has %s config', filename, packageName);
      return filename;
    }
    if (hasPreGitInFile(filename)) {
      log('found pre-git dependency in %s', filename);
      log('but no pre-git config');
      return MISSING_GIT_CONFIG;
    }
  }

  verifyValidDirectory(dir);

  // go to the parent folder and look there
  var parentPath = path.dirname(dir);
  if (parentPath === dir) {
    throw new Error(
      'Cannot got up the folder to find package.json from ' + cwd
    );
  }
  return findPackage(parentPath);
}

function getPackage() {
  var filename = findPackage();
  la(check.unemptyString(filename), 'could not find package');
  if (filename === MISSING_GIT_CONFIG) {
    return MISSING_GIT_CONFIG;
  }
  var pkg = require(filename);
  return pkg;
}

function noPackageJson() {
  try {
    findPackage();
    return false;
  } catch (e) {
    if ((e.message || '').indexOf('package.json') > 0) {
      return true;
    }
  }
}

// returns a promise
// Can we use ggit for this?
function getProjRoot() {
  return new Promise(function(resolve, reject) {
    child.exec('git rev-parse --show-toplevel', function onRoot(err, output) {
      if (err) {
        console.error('');
        console.error(label, 'Failed to find git root. Cannot run the tests.');
        console.error(err);
        console.error('');
        return reject(new Error('Failed to find git in the project root'));
      }

      var gitRoot = output.trim();
      log('git root folder %s', gitRoot);
      var projRoot = gitRoot;
      var pkg;
      try {
        var file = findPackage();
        pkg = require(file);
        projRoot = path.dirname(file);
      } catch (e) {
        log('could not find package in the git root folder');
        return resolve(gitRoot);
      }

      if (!hasConfig(pkg)) {
        log('package in %s does not have config', projRoot);
        const rootPackageFile = findPackage(gitRoot);
        if (rootPackageFile) {
          const rootPackage = require(rootPackageFile);
          if (hasConfig(rootPackage)) {
            projRoot = path.dirname(rootPackageFile);
            log('found %s config in git root folder %s', packageName, projRoot);
            return resolve(projRoot);
          }
        } else {
          log('missing config and root package file');
        }
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
  const skipOptionText = chalk.supportsColor
    ? chalk.bold(skipOption)
    : skipOption;
  console.error(label);
  console.error(
    label,
    'You can skip the git hook by running with',
    skipOptionText
  );
  console.error(label);
  console.error(
    label,
    'But this is not advised as your tests are obviously failing.'
  );
  console.error('');

  process.exit(1);
}

function getConfig() {
  const pkg = getPackage();
  if (pkg === MISSING_GIT_CONFIG) {
    return;
  }
  return pkg.config && pkg.config[packageName];
}

function hasConfig(pkg) {
  return Boolean(pkg && pkg.config && pkg.config[packageName]);
}

function hasConfigInFile(filename) {
  const pkg = require(filename);
  return hasConfig(pkg);
}

function getConfigProperty(propertyName) {
  const config = getConfig();
  if (!config) {
    return false;
  }
  const property = config[propertyName];

  if (!property) {
    return false;
  }

  return property;
}

function hasEnabledOption(config) {
  return 'enabled' in config;
}

function getTasks(label) {
  log('getting tasks with label \'%s\'', label);
  const config = getConfig();
  if (!config) {
    return;
  }

  var pkg = getPackage();
  la(check.object(pkg), 'missing package', pkg);

  if (hasEnabledOption(config) && !config.enabled) {
    return;
  }

  var run = pkg[label] || (config && config[label]);

  if (check.string(run)) {
    run = [run];
  }
  log('tasks for label \'%s\' are', label, run);
  return run;
}

function hasUntrackedFiles() {
  return new Promise(resolve => {
    try {
      const config = getConfig();
      if (!config) {
        return resolve(false);
      }
      if (config['allow-untracked-files']) {
        return resolve(false);
      }
    } catch (err) {
      return resolve(false);
    }
    var p = ggit.untrackedFiles().then(function(names) {
      return check.unempty(names);
    });
    resolve(p);
  });
}

function runTask(root, task) {
  console.log('executing task ' + task);

  const options = {
    cwd: root,
    env: process.env,
    stdio: 'inherit'
  };

  return new Promise(function(resolve, reject) {
    const proc = child.exec(task, options);
    proc.stdout.on('data', process.stdout.write.bind(process.stdout));
    proc.stderr.on('data', process.stderr.write.bind(process.stderr));
    proc.on('close', function onTaskFinished(code) {
      if (code > 0) {
        let err = new Error(task + ' closed with code ' + code);
        err.ran = task;
        return reject(err);
      }
      return resolve('task ' + task + ' passed');
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
    if (noPackageJson()) {
      console.warn(
        'No package.json found for repository. Bailing out of pre-git hooks.'
      );
      return Promise.resolve();
    }

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

  if (root !== process.cwd()) {
    log('switching current folder from %s to %s', process.cwd(), root);
  } else {
    log('cwd %s', process.cwd());
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
    .tap(root => log('running', hookLabel, 'in', root))
    .then(root => runAtRoot(root, hookLabel))
    .catch(err => failure(hookLabel, err));
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
  la(check.unemptyString(loadName), 'Unknown commit message wizard name', name);
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
    la(
      check.unemptyString(config.wizard),
      'expected wizard name',
      config.wizard
    );
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

  const wiz = isBuiltInWizardName(wizardName)
    ? loadWizard(wizardName)
    : require(wizardName);
  la(check.fn(wiz.prompter), 'missing wizard prompter', wizardName, wiz);
  return wiz;
}

function customCommitMsgPattern() {
  return getConfigProperty('msg-pattern');
}

function customCommitMsgPatternError() {
  return getConfigProperty('msg-pattern-error');
}

module.exports = {
  run: run,
  getTasks: getTasks,
  getProjRoot: getProjRoot,
  printError: printError,
  wizard: pickWizard,
  hasUntrackedFiles: hasUntrackedFiles,
  customMsgPattern: customCommitMsgPattern,
  customMsgPatternError: customCommitMsgPatternError,
  noPackageJson: noPackageJson
};

if (!module.parent) {
  run('demo-error', () => true)
    .then(() => log('finished all tasks'))
    .done();
}
