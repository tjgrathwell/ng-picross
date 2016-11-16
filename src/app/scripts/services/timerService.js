'use strict';

angular.module('ngPicrossApp').service('timerService', function ($timeout) {
  function pad(num, size) {
    var s = num + "";
    while (s.length < size) {
      s = "0" + s;
    }
    return s;
  }

  function PuzzleTimer () {
    var timerPromise, startTime;
    var self = this;

    this.start = function (cb) {
      startTime = new Date();
      this.run(cb);
    };

    this.run = function (cb) {
      timerPromise = $timeout(function () {
        cb();
        self.run(cb);
      }, 50);
    };

    this.stop = function () {
      $timeout.cancel(timerPromise);
    };

    this.reset = function () {
      startTime = new Date();
    };

    this.formattedValue = function () {
      var now = new Date();
      var diff = now - startTime;
      var totalSeconds = diff / 1000;
      var TIME_MULTIPLIER = 60;
      var totalMinutes = totalSeconds / TIME_MULTIPLIER;
      var totalHours = totalMinutes / TIME_MULTIPLIER;

      var justSeconds = pad(Math.floor(totalSeconds % TIME_MULTIPLIER), 2);
      var justMinutes = pad(Math.floor(totalMinutes % TIME_MULTIPLIER), 2);
      var justHours = pad(Math.floor(totalHours), 2);
      return justHours + ':' + justMinutes + ':' + justSeconds;
    };
  }

  function replaceBehaviorWithNoop (obj) {
    for (var p in obj) {
      if (obj.hasOwnProperty(p) && typeof(obj[p]) === 'function') {
        obj[p] = angular.noop;
      }
    }
    return obj;
  }

  return {
    createTimer: function (realTimer) {
      var timer = new PuzzleTimer();
      if (realTimer) {
        return timer;
      } else {
        return replaceBehaviorWithNoop(timer);
      }
    }
  };
});
