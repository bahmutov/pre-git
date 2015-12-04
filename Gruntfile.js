/*global module:false*/
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-summary')
      },
      all: {
        src: ['*.js', 'hooks/*.js', 'bin/*.js']
      }
    },
    complexity: grunt.file.readJSON('complexity.json')
  });

  var plugins = require('matchdep').filterDev('grunt-*');
  plugins.forEach(grunt.loadNpmTasks);

  grunt.registerTask('default', ['nice-package', 'jshint']);
};
