'use strict';

angular.module('ngPicrossApp').controller('PuzzleSolverCtrl', function ($scope, $route, $timeout, constantsService, puzzleCatalogService, puzzleSolverService, puzzleService) {
  function printSolutionToConsole (solution) {
    var solutionLines = _.map(solution, function (solutionRow) {
      return _.map(solutionRow, function (cell) {
        return cell === 'b' ? ' ' : cell;
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

    $scope.solving = true;
    $scope.puzzle = null;
    $scope.solutionTime = null;
    var solverStartTime = new Date();

    $timeout(function () {
      var puzzleToSolve = {
        rows: _.map(allHints[0].split("\n"), toIntegerArray),
        cols: _.map(allHints[1].split("\n"), toIntegerArray)
      };
      var options = {
        showProgress: $scope.solverProps.showProgress
      };
      puzzleSolverService.solutionsForPuzzle(puzzleToSolve, options).then(function (solutions) {
        $scope.solutions = solutions;
        $scope.solving = false;

        if (solutions.length === 1) {
          var solution = solutions[0];
          $scope.puzzle = puzzleService.makePuzzle(solution);
          $scope.puzzle.markAsSolved();
          $scope.solutionTime = (new Date() - solverStartTime) / 1000;
          printSolutionToConsole(solution);
        } else {
          $scope.puzzle = null;
        }
      }, null, function progress (partialPuzzleSolution) {
        $scope.puzzle = puzzleService.makePuzzle(partialPuzzleSolution);
        $scope.puzzle.rowHints = _.map(puzzleToSolve.rows, function (r) {
          return _.map(r, function (v) {
            return {value: v};
          });
        });
        $scope.puzzle.colHints = _.map(puzzleToSolve.cols, function (c) {
          return _.map(c, function (v) {
            return {value: v};
          });
        });
        $scope.puzzle.markAsSolved();
      });
    }, 10);
  };

  if ($route.current.params.puzzleId) {
    var puzzle = puzzleCatalogService.getPuzzle(parseInt($route.current.params.puzzleId, 10));
    var rowHintString = _.map(puzzle.rowHints, function (rowHint) { return _.pluck(rowHint, 'value').join(' '); }).join("\n");
    var colHintString = _.map(puzzle.colHints, function (colHint) { return _.pluck(colHint, 'value').join(' '); }).join("\n");
    $scope.solverHints = rowHintString + "\n\n" + colHintString;

    $scope.solvePuzzle();
  }
});
