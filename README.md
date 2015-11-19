# pre-git

> A simple `pre-commit` and `pre-push` hook installer for `git`.

[![NPM][pre-git-icon]][pre-git-url]

[![Build status][pre-git-ci-image]][pre-git-ci-url]
[![Build Status][snapci-image]][snapci-url]
[![dependencies][pre-git-dependencies-image]][pre-git-dependencies-url]
[![devdependencies][pre-git-devdependencies-image]][pre-git-devdependencies-url]
[![endorse][endorse-image]][endorse-url]

Runs pre-commit and pre-push Git hooks to
[avoid breaking the local master branch](http://glebbahmutov.com/blog/never-break-master-by-accident/)
or the [remote master](http://glebbahmutov.com/blog/never-break-remote-master-again/).

### Installation

It's advised to install this module as `devDependency` in your `package.json`
file so it doesn't get installed on production servers. Run:

```
npm install pre-git --save-dev
```

### Configuration

Specify commands to run on *commit* and on *push* in your package.json under `config > pre-git`
object.

```json
"scripts": {
  "test": "node-qunit *.js"
},
"config": {
  "pre-git": {
    "commit-msg": "validate-commit-msg",
    "pre-commit": [
      "grunt jshint",
      "npm version"
    ],
    "post-commit": "git status",
    "pre-push": [
      "rm -rf node_modules",
      "npm install",
      "grunt build",
      "grunt test"
    ],
    "post-merge": "npm install"
  }
}
```

If there are older settings like `pre-commit`, etc, you will have to move
them to the `config > pre-git` object manually.

Related project: [post-merge-make](https://github.com/bahmutov/post-merge-make)
runs `make post-merge` after pull or merge.

## Details

You can always skip pre-commit hook (but not pre-push hook!) by using `-n` option

    git commit -m "done, don't check me" -n

You can skip the pre-push hook using `--no-verify` option

To run just the hook (for example to test what it does), execute

```bash
.git/hooks/pre-commit
.git/hooks/pre-push
```

Since there might be no changes to push, you can force the `pre-commit` hook to execute
using `-f` or `--force` argument

```bash
.git/hooks/pre-commit -f
```

## Validating commit message

By default, this package will install both the message validator
and the message format helper. You can disable the validation
by removing the below command.

```json
"config": {
  "pre-git": {
    "commit-msg": "validate-commit-msg"
  }
}
```

When you run `git commit -m "message ..."` the hook will enforce the default style
`type(scope): message ...`. To better form the message, there is a CLI wizard
installed based on [commitizen](https://www.npmjs.com/package/commitizen) project,
very well shown in the tutorial
[video](https://egghead.io/lessons/javascript-how-to-write-a-javascript-library-writing-conventional-commits-with-commitizen). To start, stage the files first and then execute

    npm run commit

You can specify your own CLI message wizard adapter module name, by default this is equivalent to

```json
"config": {
  "pre-git": {
    "wizard": "cz-conventional-changelog"
  }
}
```

The module `cz-conventional-changelog` is included as `pre-git` dependency.

## Development

In order to locally test this package, from another git repo execute the install script
using `-f` or `--force` argument. For example

```
$ node ../pre-git/install.js -f
pre-git 0.7.2 in /Users/kensho/git/test-git-hooks
/Users/kensho/git/test-git-hooks
read target package from /Users/kensho/git/test-git-hooks/package.json
added empty command list for hook commit-msg
added empty command list for hook pre-commit
added empty command list for hook pre-push
added empty command list for hook post-commit
added empty command list for hook post-merge
saving updated files /Users/kensho/git/test-git-hooks/package.json
```

I am using a small project [test-pre-git](https://github.com/bahmutov/test-pre-git)
as a test playground for these hooks.

### Small print

Author: Gleb Bahmutov &copy; 2014

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](http://glebbahmutov.com)
* [blog](http://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Spread the word: tweet, star on github, etc.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/pre-git/issues?state=open) on Github

[snapci-image]: https://snap-ci.com/bahmutov/pre-git/branch/master/build_image
[snapci-url]: https://snap-ci.com/bahmutov/pre-git/branch/master
[pre-git-icon]: https://nodei.co/npm/pre-git.svg?downloads=true
[pre-git-url]: https://npmjs.org/package/pre-git
[pre-git-ci-image]: https://travis-ci.org/bahmutov/pre-git.svg?branch=master
[pre-git-ci-url]: https://travis-ci.org/bahmutov/pre-git
[pre-git-dependencies-image]: https://david-dm.org/bahmutov/pre-git.svg
[pre-git-dependencies-url]: https://david-dm.org/bahmutov/pre-git
[pre-git-devdependencies-image]: https://david-dm.org/bahmutov/pre-git/dev-status.svg
[pre-git-devdependencies-url]: https://david-dm.org/bahmutov/pre-git#info=devDependencies
[endorse-image]: https://api.coderwall.com/bahmutov/endorsecount.png
[endorse-url]: https://coderwall.com/bahmutov
