'use strict';

var pkg = require('../package');
console.log('%s %s in %s', pkg.name, pkg.version, process.cwd());

var path = require('path');
var join = path.join;
var fs = require('fs');
var read = fs.readFileSync;
var write = fs.writeFileSync;

//
// Compatiblity with older node.js.
//
var existsSync = fs.existsSync || path.existsSync;

var isForced = process.argv.some(function (argument) {
  return argument === '-f' || argument === '--force';
});

function readJsonFile(filename) {
  return JSON.parse(read(filename));
}

function writeJsonToFile(filename, object) {
  console.log('saving updated files %s', filename);
  write(filename, JSON.stringify(object, null, 2));
}

(function avoidSelfInstall() {
  if (isForced) {
    return;
  }
  // only install hook if this is executed from folder
  // that is dependency of the current root path
  // package A
  //    node_modules/pre-git
  // installs pre-git hook for package A
  var pkgPath = 'node_modules' + path.sep + pkg.name;
  // we are constructing RegExp using paths, that can
  // use \ (Windows) as path separator. Need to escape \
  // before constructing the RegExp.
  pkgPath = pkgPath.replace('\\', '\\\\');
  var nameRegex = new RegExp(pkgPath + '$');
  if (!nameRegex.test(process.cwd())) {
    console.log('running install inside self, no need');
    console.log('cwd', process.cwd());
    console.log('pkgPath', pkgPath);
    process.exit(0);
  }
}());

//
// The root of repository.
//
var root = path.resolve(__dirname, '../..');
function getRootPackagePath() {
  return join(root, 'package.json');
}

var exec = require('shelljs').exec;
var result = exec('git rev-parse --show-toplevel');
if (result.code === 0) {
  root = path.resolve(result.output.trim());
}

//
// The location .git and it's hooks
//
var git = path.resolve(root, '.git');
var hooks = path.resolve(git, 'hooks');

//
// Check if we are in a git repository so we can bail out early when this is not
// the case.
//
if (!existsSync(git) || !fs.lstatSync(git).isDirectory()) {
  console.error('Could not find git repo in ' + git);
  process.exit(0);
}

(function () {
  if (!existsSync(hooks)) {
    fs.mkdirSync(hooks);
  }
}());
console.log('git hooks folder %s', hooks);

var hookScripts = ['commit-msg',
  'pre-commit', 'pre-push', 'post-commit', 'post-checkout', 'post-merge'];

var sourceHooksFolders = join(__dirname, '../hooks');

if (existsSync(sourceHooksFolders)) {
  hookScripts.forEach(installHook);
} else {
  console.log('cannot find hooks folder %s', sourceHooksFolders);
}

function missingCommitScript(pkg) {
  return !pkg.scripts ||
    !pkg.scripts.commit ||
    /node_modules\/commitizen/.test(pkg.scripts.commit);
}

function setupMessageValidation(pkg) {
  if (!pkg.scripts) {
    pkg.scripts = {};
  }
  pkg.scripts.commit = 'commit-wizard';
}

(function addToPackage(hookNames) {
  var pkgPath = getRootPackagePath(),
    targetPackage;
  if (existsSync(pkgPath)) {
    targetPackage = readJsonFile(pkgPath);
    console.log('read target package from %s', pkgPath);
  } else {
    console.log('could not find package under path %s', pkgPath);
    return;
  }

  if (!targetPackage.config) {
    targetPackage.config = {};
  }

  if (!targetPackage.config['pre-git']) {
    targetPackage.config['pre-git'] = {};
    var config = targetPackage.config['pre-git'];

    hookNames.forEach(function addProperty(hookName) {
      if (hookName === 'commit-msg') {
        config[hookName] = 'simple';
        console.log('set simple %s format', hookName);
      } else {
        config[hookName] = [];
        console.log('added empty command list for hook %s', hookName);
      }
    });

    if (missingCommitScript(targetPackage)) {
      setupMessageValidation(targetPackage);
    }

    writeJsonToFile(pkgPath, targetPackage);
  }

}(hookScripts));

function installHook(name) {
  console.log('installing hook %s', name);

  var targetHookFilename = path.resolve(hooks, name);
  //
  // Our own hook runner.
  //
  var fullname = join(sourceHooksFolders, name);
  if (!existsSync(fullname)) {
    throw new Error('Cannot find hook file to copy ' + fullname);
  }
  var hook = read(fullname);

  //
  // If there's an existing `pre-commit` hook we want to back it up instead of
  // overriding it and losing it completely
  //
  if (existsSync(targetHookFilename)) {
    console.log('');
    console.log(name + ': Detected an existing git hook');
    write(targetHookFilename + '.old', read(targetHookFilename));
    console.log(name + ': Old hook backuped to .old');
    console.log('');
  }

  //
  // Everything is ready for the installation of the pre-commit hook. Write it and
  // make it executable.
  //
  write(targetHookFilename, hook);
  fs.chmodSync(targetHookFilename, '755');
}
