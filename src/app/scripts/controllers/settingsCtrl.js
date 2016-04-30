'use strict';

angular.module('ngPicrossApp').controller('SettingsCtrl', function ($scope, storageService) {
  $scope.properties = storageService.getObj('settings');

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
