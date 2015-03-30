'use strict';

angular.module('ngPicrossApp').controller('HomeCtrl', function ($scope, puzzleCatalogService) {
  $scope.puzzles = [];
  _.each(puzzleCatalogService.getAvailablePuzzleIds(), function (puzzleId) {
    $scope.puzzles.push({id: puzzleId});
  });
});
