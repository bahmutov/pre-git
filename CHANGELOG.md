
0.0.10 / 2013-10-05
==================

  * fixed complexity issues
  * added grunt, jshint, fixes #1

0.0.9 / 2013-10-05
==================

  * refactored a lot, most of the code is gone
  * printing actual errors
  * added npm badge

0.0.8 / 2013-10-04
==================

  * Renamed this fork from pre-commit to pre-git

0.0.7 / 2013-10-02
==================

  * any command allowed, not just `npm <something>`
  * pre-commit and pre-push hooks installed

## 0.0.4
- Added a better error message when you fucked up your `package.json`.
- Only run tests if there are changes.
- Improved output formatting.

## 0.0.3
- Added compatiblity for Node.js 0.6 by falling back to path.existsSync.

## 0.0.2
- Fixed a typo in the output, see #1.

## 0.0.1
- Use `spawn` instead of `exec` and give custom file descriptors. This way we
  can output color and have more control over the process.

## 0.0.0
- Initial release.
