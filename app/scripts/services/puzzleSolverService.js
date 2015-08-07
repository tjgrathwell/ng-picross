'use strict';

angular.module('ngPicrossApp').service('puzzleSolverService', function ($q, $timeout, constantsService, matrixService, puzzleService, storageService) {
  var CellStates = constantsService.CellStates;
  var CELL_ON = 1;
  var CELL_OFF = 0;

  this.props = storageService.getObj('solverProps');

  this.persistProps = function (newProps) {
    if (!newProps) {
      return;
    }
    storageService.setObj('solverProps', newProps);
  };

  function hasCorrectHints (hints, candidatePuzzle) {
    var puzzleBoard = candidatePuzzle.matrix;
    for (var rowIx = 0; rowIx < hints.rows.length; rowIx++) {
      var rowHint = hints.rows[rowIx];
      var computedrowHints = puzzleService.hintsForLine(puzzleBoard[rowIx], CELL_ON);

      if (!_.isEqual(rowHint, computedrowHints)) {
        return false;
      }
    }

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
      if (partialLine[i] !== null && partialLine[i] !== fullLine[i]) {
        return true;
      }
    }
    return false;
  }

  var PuzzleSolver = function (options) {
    angular.extend(this, options);

    this.colTotals = [];
    for (var j = 0; j < this.cols.length; j++) {
      this.colTotals.push(_.sum(this.cols[j]));
    }

    this.createInitialMatrix = function (candidatePuzzle, createOptions) {
      candidatePuzzle.matrix = [];

      for (var i = 0; i < candidatePuzzle.possibleRowArrangements.length; i++) {
        var arrangements = candidatePuzzle.possibleRowArrangements[i];

        // If there's only one possible arrangement, add it to the matrix unconditionally
        // with hope that it will speed up some of the column checks
        if (arrangements.length === 1) {
          candidatePuzzle.matrix.push(arrangements[0]);
        } else {
          candidatePuzzle.matrix.push(commonMarks(arrangements));
        }
      }

      return this.markAllRequiredCells(candidatePuzzle);
    };

    this.createInitialCandidatePuzzle = function () {
      var candidatePuzzle = {
        possibleRowArrangements: [],
        possibleColumnArrangements: [],
      };

      for (var rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
        var rowArrangements = [];
        calculateArrangements(_.clone(this.rows[rowIndex]), this.cols.length, rowArrangements);
        candidatePuzzle.possibleRowArrangements.push(rowArrangements);
      }

      for (var colIndex = 0; colIndex < this.cols.length; colIndex++) {
        var colArrangements = [];
        calculateArrangements(_.clone(this.cols[colIndex]), this.rows.length, colArrangements);
        candidatePuzzle.possibleColumnArrangements.push(colArrangements);
      }

      return candidatePuzzle;
    };

    this.bruteForce = function (candidatePuzzle, rowIx) {
      if (rowIx === this.rows.length) {
        if (hasCorrectHints(this, candidatePuzzle)) {
          this.solutions.push(candidatePuzzle.matrix);
        }
        return;
      }

      // Skip branches of the tree where any column is already incorrect
      if (rowIx > 1) {
        for (var colIx = 0; colIx < this.cols.length; colIx++) {
          if (!partialMatch(matrixService.col(candidatePuzzle.matrix, colIx), this.cols[colIx], this.colTotals[colIx], this.rows.length)) {
            return;
          }
        }
      }

      if (candidatePuzzle.matrix[rowIx].indexOf(null) === -1) {
        return [[candidatePuzzle, rowIx + 1]];
      }

      var nextArrangements = candidatePuzzle.possibleRowArrangements[rowIx];
      var puzzleString = JSON.stringify(candidatePuzzle);

      var nextArgs = [];
      for (var i = 0; i < nextArrangements.length; i++) {
        var clone = JSON.parse(puzzleString);
        clone.matrix[rowIx] = nextArrangements[i];
        this.markAllRequiredCells(clone);
        if (clone.cannotMatch) {
          continue;
        }
        nextArgs.push([clone, rowIx + 1]);
      }
      return nextArgs;
    };

    this.markRequiredCells = function (candidatePuzzle) {
      var changed = false;

      for (var columnIndex = 0; columnIndex < this.cols.length; columnIndex++) {
        var column = matrixService.col(candidatePuzzle.matrix, columnIndex);
        var hasPartialColumnMarks = _.contains(column, CELL_ON) || _.contains(column, CELL_OFF);
        if (hasPartialColumnMarks) {
          candidatePuzzle.possibleColumnArrangements[columnIndex] = candidatePuzzle.possibleColumnArrangements[columnIndex].filter(function (arrangement) {
            return !cannotMatch(arrangement, column);
          });

          if (candidatePuzzle.possibleColumnArrangements[columnIndex].length === 0) {
            candidatePuzzle.cannotMatch = true;
            candidatePuzzle.stillChecking = false;
            return;
          }
        }

        changed = changed || markLine(candidatePuzzle.matrix, commonMarks(candidatePuzzle.possibleColumnArrangements[columnIndex]), columnIndex, true);
      }

      for (var rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
        var row = candidatePuzzle.matrix[rowIndex];
        var hasPartialRowMarks = _.contains(row, CELL_ON) || _.contains(row, CELL_OFF);
        if (hasPartialRowMarks) {
          candidatePuzzle.possibleRowArrangements[rowIndex] = candidatePuzzle.possibleRowArrangements[rowIndex].filter(function (arrangement) {
            return !cannotMatch(arrangement, candidatePuzzle.matrix[rowIndex]);
          });

          if (candidatePuzzle.possibleRowArrangements[rowIndex].length === 0) {
            candidatePuzzle.cannotMatch = true;
            candidatePuzzle.stillChecking = false;
            return;
          }
        }

        changed = changed || markLine(candidatePuzzle.matrix, commonMarks(candidatePuzzle.possibleRowArrangements[rowIndex]), rowIndex);
      }

      candidatePuzzle.stillChecking = changed;
    };

    this.markAllRequiredCells = function (candidatePuzzle) {
      var deferred = $q.defer();

      var self = this;
      function chainTimeout () {
        $timeout(function () {
          self.markRequiredCells(candidatePuzzle);
          if (candidatePuzzle.stillChecking) {
            chainTimeout();
            if (self.showProgress) {
              var partialPuzzleSolution = binaryToCellStates(candidatePuzzle.matrix);
              self.progressDeferred.notify(partialPuzzleSolution);
            }
          } else {
            deferred.resolve(candidatePuzzle);
          }
        }, 0);
      }

      if (this.showProgress) {
        chainTimeout();
      } else {
        candidatePuzzle.stillChecking = true;
        while (candidatePuzzle.stillChecking) {
          this.markRequiredCells(candidatePuzzle);
        }
        deferred.resolve(candidatePuzzle);
      }

      return deferred.promise;
    }
  };

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
        } else if (solutionCol === CELL_OFF) {
          return CellStates.b;
        }
        return CellStates.o;
      });
    });
  }

  function commonMarks (arrangements) {
    if (!arrangements[0]) {
      return;
    }

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
    if (!marks) {
      return;
    }

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

  this.solutionsForPuzzle = function (hints, options) {
    function runRounds (solver, bruteForceArgs) {
      var startTime = new Date();

      while (bruteForceArgs.length > 0) {
        var elapsed = new Date() - startTime;
        if (elapsed > 1000) {
          return true;
        }

        var theseArgs = bruteForceArgs.shift();
        var newArgs = solver.bruteForce.apply(solver, theseArgs);
        if (newArgs) {
          Array.prototype.unshift.apply(bruteForceArgs, newArgs);
        }
      }

      return false;
    }

    function solveIteratively (solver, initialPuzzle) {
      var deferred = $q.defer();
      var bruteForceArgs = [[initialPuzzle, 0]];

      function go () {
        if (runRounds(solver, bruteForceArgs)) {
          $timeout(go, 0);
          if (options && options.showProgress) {
            var partialPuzzleSolution = binaryToCellStates(bruteForceArgs[0][0].matrix);
            deferred.notify(partialPuzzleSolution);
          }
        } else {
          deferred.resolve();
        }
      }

      go();

      return deferred.promise;
    }

    var deferred = $q.defer();
    var solver = new PuzzleSolver(angular.extend(hints, (options || {}), {
      solutions: [],
      progressDeferred: deferred
    }));
    var candidatePuzzle = solver.createInitialCandidatePuzzle();

    solver.createInitialMatrix(candidatePuzzle).then(function (initialPuzzle) {
      solveIteratively(solver, initialPuzzle).then(function () {
        deferred.resolve(_.map(solver.solutions, binaryToCellStates));
      }, null, deferred.notify);
    });

    return deferred.promise;
  };
});
