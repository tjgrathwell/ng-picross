'use strict';

angular.module('ngPicrossApp').controller('PuzzleSolverBenchmarkCtrl', function ($scope, $timeout, puzzleSolverService, puzzleCatalogService) {
  var allPuzzles = puzzleCatalogService.getAvailablePuzzles();
  $scope.solutionTimes = [];

  $scope.totalTime = 0;

  function benchmarkPuzzle () {
    var start = Date.now();
    var listPuzzle = allPuzzles.shift();
    var puzzle = puzzleCatalogService.getPuzzle(listPuzzle.id);

    puzzleSolverService.solutionsForPuzzle({
      rows: puzzle.rowHints.map(function (h) { return _.pluck(h, 'value'); }),
      cols: puzzle.colHints.map(function (h) { return _.pluck(h, 'value'); })
    }).then(function (solutions) {
      if (solutions.length !== 1) {
        console.log("Something wrong with", listPuzzle.id);
      }

      var timeTaken = (Date.now() - start) / 1000;

      $scope.solutionTimes.push({id: listPuzzle.id, time: timeTaken});

      $scope.totalTime += timeTaken;

      if (allPuzzles.length > 0) {
        $timeout(benchmarkPuzzle, 0);
      }
    });
  }

  benchmarkPuzzle();
});
