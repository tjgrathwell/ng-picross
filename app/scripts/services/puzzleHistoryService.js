'use strict';

angular.module('ngPicrossApp').service('puzzleHistoryService', function () {
  var supported = (function () {
    try {
      localStorage.setItem('foo', 'bar');
      localStorage.removeItem('foo');
      return true;
    } catch (e) {
      return false;
    }
  })();

  function getCompleted () {
    return JSON.parse(localStorage['ng-picross.puzzles-completed'] || '[]');
  }

  this.markCompleted = function (fingerprint) {
    if (!supported) {
      return;
    }

    var completed = getCompleted();
    if (completed.indexOf(fingerprint) === -1) {
      completed.push(fingerprint);
      localStorage['ng-picross.puzzles-completed'] = JSON.stringify(completed);
    }
  };

  this.isCompleted = function (fingerprint) {
    if (!supported) {
      return false;
    }

    var completed = getCompleted();
    return completed.indexOf(fingerprint) !== -1;
  };
});
