'use strict';

describe('Controller: PuzzleBoardCtrl', function () {
  beforeEach(module('ngPicrossApp'));

  var PuzzleBoardCtrl, scope;

  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PuzzleBoardCtrl = $controller('PuzzleBoardCtrl', {
      $scope: scope
    });
  }));
});
