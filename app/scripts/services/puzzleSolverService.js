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

      if (!_.isEqual(colHint, _.pluck(computedColHints, 'value'))) {
        return false;
      }
    }

    return true;
  }

  function partialMatch (column, realHints, spaces) {
    var firstUnchosenIndex = column.indexOf(null);
    var completedColumn = column.slice(0, firstUnchosenIndex === -1 ? undefined : firstUnchosenIndex);

    var computedHints = _.pluck(puzzleService.hintsForLine(completedColumn, CELL_ON), 'value');
    if (computedHints.length > realHints.length) {
      return false;
    }

    if (_.sum(column) > _.sum(realHints)) {
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
      if (_.last(completedColumn) === CELL_OFF && computedHints[lastComputedHintIndex] < realHints[lastComputedHintIndex]) {
        return false;
      }
    }

    var remainingSpaces = spaces - completedColumn.length;
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
      if (!row) {
        return '<nil>';
      }
      return row.map(function (cell) {
        return cell === CELL_ON ? 'x' : ' ';
      }).join('');
    }).join("\n");
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
        if (!partialMatch(matrixService.col(puzzleMatrix, colIx), this.cols[colIx], this.rows.length)) {
          return;
        }
      }
    }

    if (puzzleMatrix[rowIx]) {
      return [[puzzleMatrix, rowIx + 1]];
    }

    var nextArrangements = this.calculatedArrangements[rowIx];
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

  function calculateArrangements (current, remainingHints, totalSpaces, arrangements) {
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

      calculateArrangements(nextCurrent, _.clone(remainingHints), totalSpaces, arrangements);
    }
  }

  this.arrangementsForHint = function (hints, spaces) {
    var result = [];
    calculateArrangements([], _.clone(hints), spaces, result);
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

  this.solutionsForPuzzle = function (hints) {
    var start = Date.now();
    var meta = angular.extend(hints, {
      calculatedArrangements: [],
      solutions: []
    });

    var puzzleMatrix = [];

    for (var i = 0; i < meta.rows.length; i++) {
      var arrangements = [];
      calculateArrangements([], _.clone(meta.rows[i]), meta.cols.length, arrangements);
      meta.calculatedArrangements.push(arrangements);
      // If there's only one possible arrangement, add it to the matrix unconditionally
      // with hope that it will speed up some of the column checks
      if (arrangements.length === 1) {
        puzzleMatrix.push(arrangements[0]);
      } else {
        puzzleMatrix.push(null);
      }
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

    function solveIteratively (meta, bruteForceArgs) {
      var deferred = $q.defer();

      function go () {
        if (runRounds(meta, bruteForceArgs)) {
          $timeout(go, 0);
        } else {
          deferred.resolve();
        }
      }

      go();

      return deferred.promise;
    }

    solveIteratively(meta, [[puzzleMatrix, 0]]).then(function () {
      if (meta.solutions.length > 0 && puzzleSolverService.props.debugDepth) {
        var timeTaken = Date.now() - start;
        console.log("Solving took", timeTaken / 1000, "seconds");
      }

      deferred.resolve(_.map(meta.solutions, binaryToCellStates));
    });

    return deferred.promise;
  };
});
