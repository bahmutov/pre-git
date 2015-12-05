'use strict';

// copied from cz-conventional-changelog

var wrap = require('word-wrap');

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just
// fine.
module.exports = {

  // When a user runs `git cz`, prompter will
  // be executed. We pass you cz, which currently
  // is just an instance of inquirer.js. Using
  // this you can ask questions and get answers.
  //
  // The callback should be executed when
  // you're ready to send back a commit template
  // to git.
  //
  // By default, we'll de-indent your commit
  // template and will keep empty lines.
  prompter: function(cz, cb) {

    console.log('\nLine 1 will be cropped at 100 characters.\n' +
      'All other lines will be wrapped after 100 characters.\n');

    // Let's ask some questions of the user
    // so that we can populate our commit
    // template.
    //
    // See inquirer.js docs for specifics.
    // You can also opt to use another input
    // collection library if you prefer.
    cz.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Select the type of change that you\'re committing:',
        choices: [
        {
          name: 'feat:     A new feature',
          value: 'feat'
        }, {
          name: 'fix:      A bug fix',
          value: 'fix'
        }, {
          name: 'chore:    Changes to the build process or auxiliary tools\n' +
            '  and libraries such as documentation generation',
          value: 'chore'
        }, {
          name: 'release:  Force new release',
          value: 'release'
        }]
      }, {
        type: 'input',
        name: 'scope',
        message: 'Denote the scope of this change (db, api, cli, etc.):\n'
      }, {
        type: 'input',
        name: 'subject',
        message: 'Write a short, imperative tense description of the change:\n'
      }, {
        type: 'input',
        name: 'body',
        message: 'Provide a longer description of the change:\n'
      }, {
        type: 'input',
        name: 'issues',
        message: 'List issues this commit resolves (fixes #2, closes #14):\n'
      }, {
        type: 'confirm',
        name: 'breaking',
        message: 'Is this a major breaking change:\n',
        default: false
      }
    ], function(answers) {

      var maxLineWidth = 85;

      var wrapOptions = {
        trim: true,
        newline: '\n',
        indent:'',
        width: maxLineWidth
      };

      var breakingChange = answers.breaking ? 'BREAKING CHANGE ' : '';
      // Hard limit this line
      var head = (answers.type + '(' + answers.scope.trim() + '): ' +
        breakingChange + answers.subject.trim()).slice(0, maxLineWidth);

      // Wrap these lines at 100 characters
      var body = wrap(answers.body, wrapOptions);
      var issues = wrap(answers.issues, wrapOptions);

      cb(head + '\n\n' + body + '\n\n' + issues);
    });
  }
};
