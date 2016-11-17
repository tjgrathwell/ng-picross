'use strict';

angular.module('ngPicrossApp').directive('puzzleTimer', function () {
  return {
    restrict: 'E',
    templateUrl: 'app/views/directives/puzzleTimer.html',
    scope: {
      puzzleTimer: '=timer'
    },
    link: function ($scope, $element, $attrs) {
      $scope.formattedTime = null;
      $scope.puzzleTimer.onTick(function () {
        $scope.formattedTime = $scope.puzzleTimer.formattedValue();
      });
    }
  }
});
