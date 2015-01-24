'use strict';

describe('Controller: PuzzleBoardCtrl', function () {
  beforeEach(module('ngPicrossApp'));

  var PuzzleBoardCtrl, scope;

  beforeEach(injectIntoThis('$controller', '$rootScope'));

  beforeEach(function () {
    scope = this.$rootScope.$new();
    PuzzleBoardCtrl = this.$controller('PuzzleBoardCtrl', {
      $scope: scope
    });
  });
});
