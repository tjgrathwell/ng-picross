'use strict';

angular.module('ngPicrossApp').service('storageService', function () {
  this.supported = (function () {
    try {
      localStorage.setItem('foo', 'bar');
      localStorage.removeItem('foo');
      return true;
    } catch (e) {
      return false;
    }
  })();

  this.get = function (key) {
    return localStorage[key];
  };

  this.getObj = function (key) {
    var value = this.get(key);
    if (value) {
      return JSON.parse(value);
    } else {
      return {};
    }
  };

  this.set = function (key, val) {
    localStorage[key] = val;
  };

  this.setObj = function (key, val) {
    this.set(key, JSON.stringify(val));
  };

  function keysMatching(prefix) {
    var keysMatching = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.match(new RegExp('^' + prefix))) {
        keysMatching.push(key);
      }
    }
    return keysMatching;
  }

  this.countKeysMatching = function (prefix) {
    if (!this.supported) {
      return 0;
    }

    return keysMatching(prefix).length;
  };

  this.clearKeysMatching = function (prefix) {
    if (!this.supported) {
      return;
    }

    var keysToRemove = keysMatching(prefix);
    keysToRemove.forEach(function (key) {
      localStorage.removeItem(key);
    });
  };
});
