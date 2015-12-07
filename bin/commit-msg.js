#!/usr/bin/env node --harmony

'use strict';

const ggit = require('ggit');
const preGit = require('pre-git');
const la = require('lazy-ass');
const check = require('check-more-types');

la(check.fn(preGit.validateCommitMessage),
  'missing preGit.validateCommitMessage', Object.keys(preGit));
la(check.fn(preGit.printError),
  'missing preGit.printError', Object.keys(preGit));

ggit.commitMessage()
  .then(preGit.validateCommitMessage)
  .catch((err) => {
    // assuming each validator printed the errors
    process.exit(-1);
  })
  .done();
