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

  function bruteForce (hints, puzzleMatrix, rowIx) {
    if (rowIx === hints.rows.length) {
      return hasCorrectColumns(hints, puzzleMatrix) ? puzzleMatrix : null;
    }

    var nextArrangements = puzzleSolverService.arrangementsForHint(hints.rows[rowIx], hints.cols.length);
    for (var i = 0; i < nextArrangements.length; i++) {
      var clone = JSON.parse(JSON.stringify(puzzleMatrix));
      clone.push(nextArrangements[i]);
      var result = bruteForce(hints, clone, rowIx + 1);
      if (result) {
        return result;
      }
    }

    return false;
  }

  function pushN (arr, item, n) {
    for (var i = 0; i < n; i++) {
      arr.push(item);
    }
  }

  function calculateArrangements (current, remainingHints, totalSpaces, arrangements) {
    var remainingSpaces = totalSpaces - current.length;
    if (remainingHints.length == 0) {
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
    var result = [];
    calculateArrangements([], _.clone(hints), spaces, result);
    return result;
  };

  this.solvePuzzle = function (hints) {
    return bruteForce(hints, [], 0);
  };
});
