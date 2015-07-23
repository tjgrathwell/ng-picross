'use strict';

angular.module('ngPicrossApp').service('puzzleSolverService', function ($q, $timeout, constantsService, matrixService, puzzleService, storageService) {
  var CellStates = constantsService.CellStates;
  var CELL_ON = 1;
  var CELL_OFF = 0;
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
      var computedColHints = puzzleService.hintsForLine(matrixService.col(puzzleBoard, colIx), CELL_ON);

      if (!_.isEqual(colHint, computedColHints)) {
        return false;
      }
    }

    return true;
  }

  function partialMatch (column, realHints, realHintTotal, spaces) {
    var firstUnchosenIndex = column.indexOf(null);
    var completedColumn = column.slice(0, firstUnchosenIndex === -1 ? undefined : firstUnchosenIndex);

    var computedHints = puzzleService.hintsForLine(completedColumn, CELL_ON);
    if (computedHints.length > realHints.length) {
      return false;
    }

    var partialHints = puzzleService.hintsForLine(column, CELL_ON);
    if (_.max(partialHints) > _.max(realHints)) {
      return false;
    }

    if (_.sum(column) > realHintTotal) {
      return false;
    }

    for (var i = 0; i < computedHints.length; i++) {
      if (computedHints[i] > realHints[i]) {
        return false;
      }
    }

    var noComputedHints = _.last(computedHints) === CELL_OFF;

    // If the last hint is 'complete' (there's a space after it)
    // and it's value is smaller than the real hint, give up.
    if (!noComputedHints) {
      var lastComputedHintIndex = computedHints.length - 1;
      if (_.last(completedColumn) === CELL_OFF && computedHints[lastComputedHintIndex] < realHints[lastComputedHintIndex]) {
        return false;
      }
    }

    var remainingSpaces = spaces - completedColumn.length;
    var remainingRuns = realHints.length - computedHints.length;
    if (noComputedHints) {
      remainingRuns += 1;
    }
    var spacesForRuns = realHintTotal - _.sum(computedHints);
    var spacesBetweenRuns = _.max([remainingRuns - 1, 0]);

    return (spacesForRuns + spacesBetweenRuns) <= remainingSpaces;
  }

  function stringify(puzzleBoard) {
    if (!puzzleBoard) {
      return null;
    }

    return "\n" + puzzleBoard.map(function (row) {
      if (!row) {
        return '<nil>';
      }
      return row.map(function (cell) {
        if (cell === CELL_ON) {
          return 'x';
        }
        if (cell === CELL_OFF) {
          return '_';
        }
        return '?';
      }).join('');
    }).join("\n");
  }

  function cannotMatch (fullLine, partialLine) {
    for (var i = 0; i < partialLine.length; i++) {
      if (partialLine[i] != null && partialLine[i] !== fullLine[i]) {
        return true;
      }
    }
    return false;
  }

  function bruteForce (puzzleMatrix, rowIx) {
    if (puzzleSolverService.props.debugDepth && rowIx > puzzleSolverService.props.debugDepth) {
      console.log(rowIx, stringify(puzzleMatrix));
    }

    if (rowIx === this.rows.length) {
      if (hasCorrectColumns(this, puzzleMatrix)) {
        this.solutions.push(puzzleMatrix);
      }
      return;
    }

    // Skip branches of the tree where any column is already incorrect
    if (rowIx > 1) {
      for (var colIx = 0; colIx < this.cols.length; colIx++) {
        if (!partialMatch(matrixService.col(puzzleMatrix, colIx), this.cols[colIx], this.colTotals[colIx], this.rows.length)) {
          return;
        }
      }
    }

    if (puzzleMatrix[rowIx].indexOf(null) === -1) {
      return [[puzzleMatrix, rowIx + 1]];
    }

    var nextArrangements = this.possibleRowArrangements[rowIx];
    var matrixString = JSON.stringify(puzzleMatrix);

    var nextArgs = [];
    for (var i = 0; i < nextArrangements.length; i++) {
      var clone = JSON.parse(matrixString);
      clone[rowIx] = nextArrangements[i];
      nextArgs.push([clone, rowIx + 1]);
    }
    return nextArgs;
  }

  function pushN (arr, item, n) {
    for (var i = 0; i < n; i++) {
      arr.push(item);
    }
  }

  function calculateArrangements (remainingHints, totalSpaces, arrangements, current) {
    if (!current) {
      current = [];
    }

    if (_.isEqual(remainingHints, [0])) {
      var spacey = [];
      pushN(spacey, CELL_OFF, totalSpaces);
      arrangements.push(spacey);
      return;
    }

    var remainingSpaces = totalSpaces - current.length;
    if (remainingHints.length === 0) {
      pushN(current, CELL_OFF, totalSpaces - current.length);
      arrangements.push(current);
      return;
    }

    var spacesBetweenRemainingHints = remainingHints.length - 1;
    var wiggleRoom = remainingSpaces - _.sum(remainingHints) - spacesBetweenRemainingHints;
    var hint = remainingHints.shift();

    for (var i = 0; i < wiggleRoom + 1; i++) {
      var nextCurrent = _.clone(current);
      pushN(nextCurrent, CELL_OFF, i);
      pushN(nextCurrent, CELL_ON, hint);

      // Ensure there is always a space between groups
      if ((remainingSpaces - hint - i) > 0) {
        pushN(nextCurrent, CELL_OFF, 1);
      }

      calculateArrangements(_.clone(remainingHints), totalSpaces, arrangements, nextCurrent);
    }
  }

  this.arrangementsForHint = function (hints, spaces) {
    var result = [];
    calculateArrangements(_.clone(hints), spaces, result);
    return result;
  };

  function binaryToCellStates (solution) {
    return _.map(solution, function (solutionRows) {
      return _.map(solutionRows, function (solutionCol) {
        if (solutionCol === CELL_ON) {
          return CellStates.x;
        } else {
          return CellStates.o;
        }
      });
    });
  }

  function commonMarks (arrangements) {
    var result = [];
    for (var cellIndex = 0; cellIndex < arrangements[0].length; cellIndex++) {
      var mark = arrangements[0][cellIndex];
      for (var arrangementIndex = 1; arrangementIndex < arrangements.length; arrangementIndex++) {
        if (arrangements[arrangementIndex][cellIndex] !== mark) {
          mark = null;
          break;
        }
      }
      result.push(mark);
    }
    return result;
  }

  function markLine (matrix, marks, rowOrColumnIndex, isColumn) {
    var changed = false;
    for (var markIndex = 0; markIndex < marks.length; markIndex++) {
      var value = marks[markIndex];
      if (value !== null) {
        var existingRowValue;
        if (isColumn) {
          existingRowValue = matrix[markIndex][rowOrColumnIndex];
        } else {
          existingRowValue = matrix[rowOrColumnIndex][markIndex];
        }
        if (existingRowValue !== value) {
          changed = true;
          if (isColumn) {
            matrix[markIndex][rowOrColumnIndex] = value;
          } else {
            matrix[rowOrColumnIndex][markIndex] = value;
          }
        }
      }
    }
    return changed;
  }

  function markRequiredCells (meta, matrix) {
    var changed = false;

    for (var columnIndex = 0; columnIndex < meta.cols.length; columnIndex++) {
      var column = matrixService.col(matrix, columnIndex);
      var hasPartialColumnMarks = column.indexOf(CELL_ON) !== -1;
      if (hasPartialColumnMarks) {
        meta.possibleColumnArrangements[columnIndex] = meta.possibleColumnArrangements[columnIndex].filter(function (arrangement) {
          return !cannotMatch(arrangement, column);
        });
      }

      changed = changed || markLine(matrix, commonMarks(meta.possibleColumnArrangements[columnIndex]), columnIndex, true);
    }

    for (var rowIndex = 0; rowIndex < meta.rows.length; rowIndex++) {
      var hasPartialRowMarks = matrix[rowIndex].indexOf(CELL_ON) !== -1;
      if (hasPartialRowMarks) {
        meta.possibleRowArrangements[rowIndex] = meta.possibleRowArrangements[rowIndex].filter(function (arrangement) {
          return !cannotMatch(arrangement, matrix[rowIndex]);
        });
      }

      changed = changed || markLine(matrix, commonMarks(meta.possibleRowArrangements[rowIndex]), rowIndex);
    }

    return changed;
  }

  function createInitialMatrices (meta) {
    var result = [];

    for (var i = 0; i < meta.possibleRowArrangements.length; i++) {
      var arrangements = meta.possibleRowArrangements[i];

      // If there's only one possible arrangement, add it to the matrix unconditionally
      // with hope that it will speed up some of the column checks
      if (arrangements.length === 1) {
        result.push(arrangements[0]);
      } else {
        result.push(commonMarks(arrangements));
      }
    }

    var changed = true;
    while (changed) {
      changed = markRequiredCells(meta, result);
    }

    return [result];
  }

  this.solutionsForPuzzle = function (hints, options) {
    var meta = angular.extend(hints, {
      possibleRowArrangements: [],
      possibleColumnArrangements: [],
      solutions: []
    });

    for (var rowIndex = 0; rowIndex < meta.rows.length; rowIndex++) {
      var rowArrangements = [];
      calculateArrangements(_.clone(meta.rows[rowIndex]), meta.cols.length, rowArrangements);
      meta.possibleRowArrangements.push(rowArrangements);
    }

    for (var colIndex = 0; colIndex < meta.cols.length; colIndex++) {
      var colArrangements = [];
      calculateArrangements(_.clone(meta.cols[colIndex]), meta.rows.length, colArrangements);
      meta.possibleColumnArrangements.push(colArrangements);
    }

    meta.colTotals = [];
    for (var j = 0; j < meta.cols.length; j++) {
      meta.colTotals.push(_.sum(meta.cols[j]));
    }

    var deferred = $q.defer();

    function runRounds (meta, bruteForceArgs) {
      var startTime = new Date();

      while (bruteForceArgs.length > 0) {
        var elapsed = new Date() - startTime;
        if (elapsed > 1000) {
          return true;
        }

        var theseArgs = bruteForceArgs.shift();
        var newArgs = bruteForce.apply(meta, theseArgs);
        if (newArgs) {
          Array.prototype.unshift.apply(bruteForceArgs, newArgs);
        }
      }

      return false;
    }

    function solveIteratively (meta, initialPuzzleMatrices) {
      var deferred = $q.defer();
      var bruteForceArgs = _.map(initialPuzzleMatrices, function (matrix) {
        return [matrix, 0];
      });

      function go () {
        if (runRounds(meta, bruteForceArgs)) {
          $timeout(go, 0);
          if (options && options.showProgress) {
            var partialPuzzleSolution = binaryToCellStates(bruteForceArgs[0][0]);
            deferred.notify(partialPuzzleSolution);
          }
        } else {
          deferred.resolve();
        }
      }

      go();

      return deferred.promise;
    }

    var initialPuzzleMatrices = createInitialMatrices(meta);

    solveIteratively(meta, initialPuzzleMatrices).then(function () {
      deferred.resolve(_.map(meta.solutions, binaryToCellStates));
    }, null, deferred.notify);

    return deferred.promise;
  };
});
