'use strict';

var pkg = require('./package');
console.log(pkg.name, pkg.version);

var path = require('path');

(function avoidSelfInstall() {
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

var fs = require('fs');

//
// Compatiblity with older node.js.
//
var existsSync = fs.existsSync || path.existsSync;

//
// The root of repository.
//
var root = path.resolve(__dirname, '../..');

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


(function copyFile(name) {
  var fullname = path.join('./hooks', name);
  if (!existsSync(fullname)) {
    throw new Error('cannot find ' + fullname);
  }
  var content = fs.readFileSync(fullname);
  var destination = path.resolve(hooks, name);
  fs.writeFileSync(destination, content);
}('pre-common.js'));


var hookScripts = ['pre-commit', 'pre-push'];
hookScripts.forEach(installHook);

function installHook(name) {
  console.log('installing hook', name);

  var precommit = path.resolve(hooks, name);
  //
  // Our own hook runner.
  //
  var hook = fs.readFileSync('./hooks/' + name + '.js');

  //
  // If there's an existing `pre-commit` hook we want to back it up instead of
  // overriding it and losing it completely
  //
  if (existsSync(precommit)) {
    console.log('');
    console.log(name + ': Detected an existing git hook');
    fs.writeFileSync(precommit + '.old', fs.readFileSync(precommit));
    console.log(name + ': Old hook backuped to .old');
    console.log('');
  }

  //
  // Everything is ready for the installation of the pre-commit hook. Write it and
  // make it executable.
  //
  fs.writeFileSync(precommit, hook);
  fs.chmodSync(precommit, '755');
}
