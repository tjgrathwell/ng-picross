'use strict';

angular.module('ngPicrossApp').controller('HomeCtrl', function ($scope, puzzleCatalogService) {
  $scope.puzzles = puzzleCatalogService.getAvailablePuzzles();
});
