'use strict';

angular.module('ngPicrossApp').controller('PuzzleSolverCtrl', function ($scope, constantsService, puzzleSolverService, puzzleService) {
  function printSolutionToConsole (solution) {
    var solutionLines = _.map(solution, function (solutionRow) {
      return _.map(solutionRow, function (cell) {
        return cell === '' ? ' ' : cell;
      }).join('');
    });

    console.log(solutionLines);
  }

  $scope.solvePuzzle = function () {
    function toIntegerArray (rawValues) {
      return _.map(rawValues.split(new RegExp(/[ ,]+/)), function (n) {
        return parseInt(n, 0);
      });
    }

    var rowHintsArray = _.map($scope.rowHints.split("\n"), toIntegerArray);
    var columnHintsArray = _.map($scope.columnHints.split("\n"), toIntegerArray);

    $scope.solutions = puzzleSolverService.solutionsForPuzzle({
      rows: rowHintsArray,
      cols: columnHintsArray
    });

    if ($scope.solutions.length === 1) {
      var solution = $scope.solutions[0];
      $scope.puzzle = puzzleService.makePuzzle(solution);
      $scope.puzzle.markAsSolved();
      printSolutionToConsole(solution);
    } else {
      $scope.puzzle = null;
    }
  };
});
