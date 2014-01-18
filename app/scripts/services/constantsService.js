'use strict';

angular.module('ngPicrossApp').service('constantsService', function () {
  this.CellStates = {
    x: 'x',
    o: '',
    b: 'b'
  };

  this.Button = {
    LEFT: 0,
    RIGHT: 2
  };
});