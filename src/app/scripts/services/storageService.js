'use strict';

angular.module('ngPicrossApp').service('storageService', function () {
  this.supported = function () {
    try {
      localStorage.setItem('foo', 'bar');
      localStorage.removeItem('foo');
      return true;
    } catch (e) {
      return false;
    }
  }();

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
});
