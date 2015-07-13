'use strict';

angular.module('ngPicrossApp').service('puzzleSolverService', function (constantsService, matrixService, puzzleService, storageService) {
  var CellStates = constantsService.CellStates;
  var puzzleSolverService = this;

  this.props = storageService.getObj('solverProps');

  this.persistProps = function (newProps) {
    if (!newProps) {
      return;
    }
    storageService.setObj('solverProps', newProps);
  };

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
    var remainingRuns = realHints.length - computedHints.length;
    if (noComputedHints) {
      remainingRuns += 1;
    }
    var spacesForRuns = _.sum(realHints) - _.sum(computedHints);
    var spacesBetweenRuns = _.max([remainingRuns - 1, 0]);

    return (spacesForRuns + spacesBetweenRuns) <= remainingSpaces;
  }

  function stringify(puzzleBoard) {
    if (!puzzleBoard) {
      return null;
    }

    return "\n" + puzzleBoard.map(function (row) {
      return row.map(function (cell) {
        return cell === CellStates.x ? 'x' : ' ';
      }).join('');
    }).join("\n");
  }

  function bruteForce (meta, puzzleMatrix, rowIx, solutions, depth) {
    if (puzzleSolverService.props.debugDepth && depth > puzzleSolverService.props.debugDepth) {
      console.log(depth, stringify(puzzleMatrix));
    }

    if (rowIx === meta.rows.length) {
      if (hasCorrectColumns(meta, puzzleMatrix)) {
        solutions.push(puzzleMatrix);
      }
      return;
    }

    // Skip branches of the tree where any column is already incorrect
    if (rowIx > 1) {
      for (var colIx = 0; colIx < meta.cols.length; colIx++) {
        if (!partialMatch(matrixService.col(puzzleMatrix, colIx), meta.cols[colIx], meta.rows.length)) {
          return;
        }
      }
    }

    var nextArrangements = meta.arrangementsForRow(rowIx);
    for (var i = 0; i < nextArrangements.length; i++) {
      var clone = JSON.parse(JSON.stringify(puzzleMatrix));
      clone.push(nextArrangements[i]);
      bruteForce(meta, clone, rowIx + 1, solutions, depth + 1);
    }
  }

  function pushN (arr, item, n) {
    for (var i = 0; i < n; i++) {
      arr.push(item);
    }
  }

  function calculateArrangements (current, remainingHints, totalSpaces, arrangements) {
    if (_.isEqual(remainingHints, [0])) {
      var spacey = [];
      pushN(spacey, CellStates.o, totalSpaces);
      arrangements.push(spacey);
      return;
    }

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
    var result = [];
    calculateArrangements([], _.clone(hints), spaces, result);
    return result;
  };

  this.solutionsForPuzzle = function (hints) {
    var solutions = [];
    var start = Date.now();
    var meta = angular.extend(hints, {
      calculatedArrangements: {},
      arrangementsForRow: function (rowIndex) {
        if (this.calculatedArrangements[rowIndex]) {
          return this.calculatedArrangements[rowIndex];
        }

        var result = [];
        calculateArrangements([], _.clone(this.rows[rowIndex]), this.cols.length, result);

        this.calculatedArrangements[rowIndex] = result;
        return result;
      }
    });

    bruteForce(meta, [], 0, solutions, 0);

    if (solutions.length > 0 && this.props.debugDepth) {
      var timeTaken = Date.now() - start;
      console.log("Solving took", timeTaken / 1000, "seconds");
    }

    return solutions;
  };
});
