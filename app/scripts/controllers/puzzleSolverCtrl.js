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

  $scope.solverProps = puzzleSolverService.props;
  $scope.$watch('solverProps', puzzleSolverService.persistProps, true);

  $scope.solvePuzzle = function () {
    function toIntegerArray (rawValues) {
      var trimmed = rawValues.replace(/^\s+|\s+$/g, '');
      return _.map(trimmed.split(new RegExp(/[ ,]+/)), function (n) {
        return parseInt(n, 0);
      });
    }

    var allHints = $scope.solverHints.split(/\n\n\s*/);

    puzzleSolverService.solutionsForPuzzle({
      rows: _.map(allHints[0].split("\n"), toIntegerArray),
      cols: _.map(allHints[1].split("\n"), toIntegerArray)
    }).then(function (solutions) {
      $scope.solutions = solutions;

      if ($scope.solutions.length === 1) {
        var solution = $scope.solutions[0];
        $scope.puzzle = puzzleService.makePuzzle(solution);
        $scope.puzzle.markAsSolved();
        printSolutionToConsole(solution);
      } else {
        $scope.puzzle = null;
      }
    });
  };
});
