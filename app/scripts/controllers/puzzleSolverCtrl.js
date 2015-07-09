'use strict';

angular.module('ngPicrossApp').controller('PuzzleSolverCtrl', function ($scope, constantsService, puzzleSolverService, puzzleService) {
  var CellStates = constantsService.CellStates;

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

    if ($scope.solutions.length == 1) {
      var solution = $scope.solutions[0];
      $scope.puzzle = puzzleService.makePuzzle(solution);
      _.each(solution, function (solutionRow, rowIndex) {
        _.each(solutionRow, function (solutionCol, colIndex) {
          var displayValue = solutionCol == 'x' ? CellStates.x : CellStates.o;
          $scope.puzzle.board[rowIndex][colIndex].displayValue = displayValue;
        });
      });
    } else {
      $scope.puzzle = null;
    }
  };
});
