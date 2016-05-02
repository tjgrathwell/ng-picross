'use strict';

angular.module('ngPicrossApp').controller('SettingsCtrl', function ($scope, storageService) {
  $scope.properties = storageService.getObj('settings');

  $scope.clearPartialPuzzleSolutions = function () {
    storageService.clearKeysMatching('puzzleState.');
  };

  $scope.clearPartialPuzzleSolutionsText = function () {
    var count = $scope.numberOfPartialPuzzleSolutions();
    if (count === 1) {
      return 'Clear 1 partial puzzle solution.';
    } else {
      return 'Clear ' + count + ' partial puzzle solutions';
    }
  };

  $scope.numberOfPartialPuzzleSolutions = function () {
    return storageService.countKeysMatching('puzzleState.');
  };

  $scope.$watch('properties', function () {
    if ($scope.sizeForm && $scope.sizeForm.$valid) {
      storageService.setObj('settings', $scope.properties);
    } else {
      storageService.setObj('settings', {});
    }
  }, true);

  $scope.arrayOfSize = function (size) {
    return Array(size);
  };
});
