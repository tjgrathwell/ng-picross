'use strict';

angular.module('ngPicrossApp').controller('MainCtrl', function ($scope, puzzleService) {
  var startPuzzle = function (puzzle) {
    $scope.puzzle = puzzle;
    $scope.solved = false;
  };

  $scope.randomPuzzle = function () {
    startPuzzle(puzzleService.generateRandomPuzzle());
  };

  function toggleBoardCell (rowIndex, colIndex, desiredValue) {
    var board = $scope.puzzle.board;
    if (board[rowIndex][colIndex] === desiredValue) {
      board[rowIndex][colIndex] = CellStates.o;
    } else {
      board[rowIndex][colIndex] = desiredValue;
    }
  }

  $scope.clickedCell = function (rowIndex, colIndex) {
    toggleBoardCell(rowIndex, colIndex, CellStates.x);
    $scope.solved = $scope.puzzle.solved();
  };

  $scope.rightClickedCell = function (rowIndex, colIndex) {
    toggleBoardCell(rowIndex, colIndex, CellStates.b);
    $scope.solved = $scope.puzzle.solved();
  };

  $scope.cellClasses = function (rowIndex, colIndex) {
    var cellValue = $scope.puzzle.board[rowIndex][colIndex];
    return {
      on: cellValue === CellStates.x,
      off: cellValue === CellStates.b
    };
  }

  startPuzzle(puzzleService.authoredPuzzle());
});
