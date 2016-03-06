#!/usr/bin/env node

'use strict';

const label = 'post-merge';
const run = require('pre-git').run;
const runTask = run.bind(null, label);

runTask()
  .done();
