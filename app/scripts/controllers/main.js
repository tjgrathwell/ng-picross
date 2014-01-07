'use strict';

angular.module('ngPicrossApp').controller('MainCtrl', function ($scope, puzzleService) {
  var startPuzzle = function (puzzle) {
    $scope.puzzle = puzzle;
    $scope.solved = false;
  };

  $scope.randomPuzzle = function () {
    startPuzzle(puzzleService.generateRandomPuzzle());
  };

  $scope.clickedCell = function (rowIndex, colIndex) {
    if ($scope.puzzle.board[rowIndex][colIndex]) {
      $scope.puzzle.board[rowIndex][colIndex] = o;
    } else {
      $scope.puzzle.board[rowIndex][colIndex] = x;
    }
    $scope.solved = $scope.puzzle.solved();
  };


  startPuzzle(puzzleService.authoredPuzzle());
});
