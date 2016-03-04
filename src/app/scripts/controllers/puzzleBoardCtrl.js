'use strict';

angular.module('ngPicrossApp').controller('PuzzleBoardCtrl', function ($scope, $location, puzzleService, puzzleCatalogService, puzzleHistoryService, constantsService, puzzle) {
  function nextPuzzleLink () {
    var match;
    if ((match = $location.path().match(/\/puzzles\/(\d+)/))) {
      var nextPuzzleNumber = parseInt(match[1], 10) + 1;
      if (puzzleCatalogService.getAvailablePuzzles()[nextPuzzleNumber]) {
        return 'puzzles/' + nextPuzzleNumber;
      }
    }
  }

  var startPuzzle = function (puzzle) {
    $scope.puzzle = puzzle;
    $scope.solved = false;
    $scope.nextPuzzleLink = nextPuzzleLink();
  };

  $scope.randomPuzzle = function () {
    if ($location.path() === '/random') {
      puzzleCatalogService.generateRandomPuzzle().then(function (puzzle) {
        startPuzzle(puzzle);
      });
    } else {
      $location.path('/random');
    }
  };

  $scope.showRandomLink = $location.url() === '/random';

  startPuzzle(puzzle);
});
