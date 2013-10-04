# pre-git

A simple `pre-commit` and `pre-push` hook installer for `git`.

[![NPM][pre-git-icon]][pre-git-url]

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
  "grunt build",
  "grunt test"
]
```

### License

MIT

[pre-git-icon]: https://nodei.co/npm/pre-git.png?downloads=true
[pre-git-url]: https://npmjs.org/package/pre-git
