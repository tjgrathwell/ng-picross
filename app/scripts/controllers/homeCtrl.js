'use strict';

angular.module('ngPicrossApp').controller('HomeCtrl', function ($scope, puzzleService) {
  $scope.puzzles = [
    {id: 1},
    {id: 2},
    {id: 3}
  ];
});
