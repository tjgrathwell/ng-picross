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
  $scope.$watch('solverHints', function (newValue) {
    if (!newValue) {
      return;
    }

    var allHints = newValue.split(/\n\n\s*/);

    function toIntegerArray (rawValues) {
      var trimmed = rawValues.replace(/^\s+|\s+$/g, '');
      return _.map(trimmed.split(new RegExp(/[ ,]+/)), function (n) {
        return parseInt(n, 0);
      });
    }

    function ensureValid (integerArray) {
      for (var i = 0; i < integerArray.length; i++) {
        for (var j = 0; j < integerArray[i].length; j++) {
          if (_.isNaN(integerArray[i][j])) {
            return undefined;
          }
        }
      }
      return integerArray;
    }

    $scope.solverHintRows = undefined;
    $scope.solverHintCols = undefined;

    if (allHints.length >= 2) {
      $scope.solverHintRows = ensureValid(_.map(allHints[0].split("\n"), toIntegerArray));
      $scope.solverHintCols = ensureValid(_.map(allHints[1].split("\n"), toIntegerArray));
    }
  });

  $scope.solvePuzzle = function () {
    $scope.solving = true;
    $scope.puzzle = null;
    $scope.solutionTime = null;
    $scope.solutionIterationsCount = 0;
    var solverStartTime = new Date();

    $timeout(function () {
      var puzzleToSolve = {rows: $scope.solverHintRows, cols: $scope.solverHintCols};
      var options = {
        showProgress: $scope.solverProps.showProgress
      };
      puzzleSolverService.solutionsForPuzzle(puzzleToSolve, options).then(function (solutionData) {
        var solutions = solutionData.solutions;
        $scope.solutions = solutions;
        $scope.solving = false;

        if (solutions.length === 1) {
          var solution = solutions[0];
          $scope.puzzle = puzzleService.makePuzzle(solution);
          $scope.puzzle.markAsSolved();
          $scope.solutionTime = (new Date() - solverStartTime) / 1000;
          $scope.solutionIterationsCount += solutionData.iterations;
          printSolutionToConsole(solution);
        } else {
          $scope.puzzle = null;
        }
      }, null, function progress (partialPuzzleSolution) {
        $scope.solutionIterationsCount += 1;
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
    var rowHintString = _.map(puzzle.rowHints, function (rowHint) { return _.map(rowHint, 'value').join(' '); }).join("\n");
    var colHintString = _.map(puzzle.colHints, function (colHint) { return _.map(colHint, 'value').join(' '); }).join("\n");
    $scope.solverHints = rowHintString + "\n\n" + colHintString;

    $scope.solvePuzzle();
  }
});
