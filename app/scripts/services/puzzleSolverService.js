'use strict';

angular.module('ngPicrossApp').service('puzzleSolverService', function (constantsService, matrixService, puzzleService) {
  var CellStates = constantsService.CellStates;
  var puzzleSolverService = this;

  function hasCorrectColumns (hints, puzzleBoard) {
    for (var colIx = 0; colIx < hints.cols.length; colIx++) {
      var colHint = hints.cols[colIx];
      var computedColHints = puzzleService.hintsForLine(matrixService.col(puzzleBoard, colIx));

      if (!_.isEqual(colHint, _.pluck(computedColHints, 'value'))) {
        return false;
      }
    }

    return true;
  }

  function partialMatch (column, realHints, spaces) {
    var computedHints = _.pluck(puzzleService.hintsForLine(column), 'value');
    if (computedHints.length > realHints.length) {
      return false;
    }

    for (var i = 0; i < computedHints.length; i++) {
      if (computedHints[i] > realHints[i]) {
        return false;
      }
    }

    var noComputedHints = _.last(computedHints) === 0;

    // If the last hint is 'complete' (there's a space after it)
    // and it's value is smaller than the real hint, give up.
    if (!noComputedHints) {
      var lastComputedHintIndex = computedHints.length - 1;
      if (_.last(column) !== 'x' && computedHints[lastComputedHintIndex] < realHints[lastComputedHintIndex]) {
        return false;
      }
    }

    var remainingSpaces = spaces - column.length;
    var remainingRuns = computedHints.length - realHints.length;
    if (noComputedHints) {
      remainingRuns += 1;
    }
    var spacesForRuns = _.sum(realHints) - _.sum(computedHints);
    var spacesBetweenRuns = _.max([remainingRuns - 1, 0]);

    return (spacesForRuns + spacesBetweenRuns) <= remainingSpaces;
  }

  function bruteForce (hints, puzzleMatrix, rowIx, solutions, depth) {
    if (rowIx === hints.rows.length) {
      if (hasCorrectColumns(hints, puzzleMatrix)) {
        solutions.push(puzzleMatrix);
      }
      return;
    }

    // Skip branches of the tree where any column is already incorrect
    if (rowIx > 1) {
      for (var colIx = 0; colIx < hints.cols.length; colIx++) {
        if (!partialMatch(matrixService.col(puzzleMatrix, colIx), hints.cols[colIx], hints.rows.length)) {
          return;
        }
      }
    }

    var nextArrangements = puzzleSolverService.arrangementsForHint(hints.rows[rowIx], hints.cols.length);
    for (var i = 0; i < nextArrangements.length; i++) {
      var clone = JSON.parse(JSON.stringify(puzzleMatrix));
      clone.push(nextArrangements[i]);
      bruteForce(hints, clone, rowIx + 1, solutions, depth + 1);
    }
  }

  function pushN (arr, item, n) {
    for (var i = 0; i < n; i++) {
      arr.push(item);
    }
  }

  function calculateArrangements (current, remainingHints, totalSpaces, arrangements) {
    var remainingSpaces = totalSpaces - current.length;
    if (remainingHints.length === 0) {
      pushN(current, CellStates.o, totalSpaces - current.length);
      arrangements.push(current);
      return;
    }

    var spacesBetweenRemainingHints = remainingHints.length - 1;
    var wiggleRoom = remainingSpaces - _.sum(remainingHints) - spacesBetweenRemainingHints;
    var hint = remainingHints.shift();

    for (var i = 0; i < wiggleRoom + 1; i++) {
      var nextCurrent = _.clone(current);
      pushN(nextCurrent, CellStates.o, i);
      pushN(nextCurrent, CellStates.x, hint);

      // Ensure there is always a space between groups
      if ((remainingSpaces - hint - i) > 0) {
        pushN(nextCurrent, CellStates.o, 1);
      }

      calculateArrangements(nextCurrent, _.clone(remainingHints), totalSpaces, arrangements);
    }
  }

  this.arrangementsForHint = function (hints, spaces) {
    if (_.isEqual(hints, [0])) {
      var spacey = [];
      pushN(spacey, CellStates.o, spaces);
      return [spacey];
    }

    var result = [];
    calculateArrangements([], _.clone(hints), spaces, result);
    return result;
  };

  this.solutionsForPuzzle = function (hints) {
    var solutions = [];
    bruteForce(hints, [], 0, solutions, 0);
    return solutions;
  };
});
