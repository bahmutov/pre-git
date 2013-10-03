# pre-commit

A simple `pre-commit` and `pre-push` hook installer for `git`.

### Installation

It's adviced to install this module as `devDependency` in your `package.json`
file so it doesn't get installed on production servers. Run:

```
npm install pre-commit --save-dev
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
