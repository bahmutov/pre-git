# pre-git

A simple `pre-commit` and `pre-push` hook installer for `git`.

[![NPM][pre-git-icon]][pre-git-url]

[![Build status][pre-git-ci-image]][pre-git-ci-url]
[![dependencies][pre-git-dependencies-image]][pre-git-dependencies-url]
[![devdependencies][pre-git-devdependencies-image]][pre-git-devdependencies-url]
[![endorse][endorse-image]][endorse-url]

### Installation

It's advised to install this module as `devDependency` in your `package.json`
file so it doesn't get installed on production servers. Run:

```
npm install pre-git --save-dev
```

### Configuration

Specify commands to run on *commit* and on *push* in your package.json

```
"scripts": {
  "test": "node-qunit *.js"
},
"pre-commit": [
  "grunt jshint"
],
"pre-push": [
  "rm -rf node_modules",
  "npm install",
  "grunt build",
  "grunt test"
]
```

Related project: [post-merge-make](https://github.com/bahmutov/post-merge-make)
runs `make post-merge` after pull or merge.

## Details

You can always skip pre-commit hook (but not pre-push hook!) by using `-n` option

    git commit -m "done, don't check me" -n

### Small print

Author: Gleb Bahmutov &copy; 2014

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](http://glebbahmutov.com)
* [blog](http://bahmutov.calepin.co/)

License: MIT - do anything with the code, but don't blame me if it does not work.

Spread the word: tweet, star on github, etc.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/pre-git/issues?state=open) on Github


[pre-git-icon]: https://nodei.co/npm/pre-git.png?downloads=true
[pre-git-url]: https://npmjs.org/package/pre-git
[pre-git-ci-image]: https://travis-ci.org/bahmutov/pre-git.png?branch=master
[pre-git-ci-url]: https://travis-ci.org/bahmutov/pre-git
[pre-git-dependencies-image]: https://david-dm.org/bahmutov/pre-git.png
[pre-git-dependencies-url]: https://david-dm.org/bahmutov/pre-git
[pre-git-devdependencies-image]: https://david-dm.org/bahmutov/pre-git/dev-status.png
[pre-git-devdependencies-url]: https://david-dm.org/bahmutov/pre-git#info=devDependencies
[endorse-image]: https://api.coderwall.com/bahmutov/endorsecount.png
[endorse-url]: https://coderwall.com/bahmutov
