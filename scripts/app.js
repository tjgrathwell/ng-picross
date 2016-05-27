'use strict';

angular.module('ngPicrossApp', ['ngRoute']).config(function ($provide, $routeProvider, $locationProvider) {
  if (window.location.pathname.match(new RegExp("/ng-picross/"))) {
    // Emulate 'hashbang fallback mode' for gh-pages
    // http://stackoverflow.com/a/16678065
    $provide.decorator('$sniffer', ['$delegate', function($delegate) {
      $delegate.history = false;
      return $delegate;
    }]);
  }
  $locationProvider.html5Mode(true);

  $routeProvider.when('/', {
    templateUrl: 'app/views/home.html',
    controller: 'HomeCtrl'
  }).when('/puzzles/:id', {
    templateUrl: 'app/views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: function ($route, puzzleCatalogService) {
        return puzzleCatalogService.getPuzzle(parseInt($route.current.params.id, 10));
      }
    }
  }).when('/random', {
    templateUrl: 'app/views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: function (puzzleCatalogService) {
        return puzzleCatalogService.generateRandomPuzzle();
      }
    }
  }).when('/settings', {
    templateUrl: 'app/views/settings.html',
    controller: 'SettingsCtrl',
  }).when('/solver/:puzzleId?', {
    templateUrl: 'app/views/puzzleSolver.html',
    controller: 'PuzzleSolverCtrl'
  }).when('/solver_benchmark', {
    templateUrl: 'app/views/puzzleSolverBenchmark.html',
    controller: 'PuzzleSolverBenchmarkCtrl'
  }).otherwise({
    redirectTo: '/'
  });
}).run(function ($rootScope, $location) {
  $rootScope.goHome = function () {
    $location.path('/');
  };
});

'use strict';

angular.module('ngPicrossApp').controller('SettingsCtrl', function ($scope, storageService) {
  $scope.properties = storageService.getObj('settings');

  $scope.clearPartialPuzzleSolutions = function () {
    storageService.clearKeysMatching('puzzleState.');
  };

  $scope.clearPartialPuzzleSolutionsText = function () {
    var count = $scope.numberOfPartialPuzzleSolutions();
    if (count === 1) {
      return 'Clear 1 partial puzzle solution.';
    } else {
      return 'Clear ' + count + ' partial puzzle solutions';
    }
  };

  $scope.numberOfPartialPuzzleSolutions = function () {
    return storageService.countKeysMatching('puzzleState.');
  };

  $scope.$watch('properties', function () {
    if ($scope.sizeForm && $scope.sizeForm.$valid) {
      storageService.setObj('settings', $scope.properties);
    } else {
      storageService.setObj('settings', {});
    }
  }, true);

  $scope.arrayOfSize = function (size) {
    return Array(size);
  };
});

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

'use strict';

angular.module('ngPicrossApp').controller('PuzzleSolverBenchmarkCtrl', function ($scope, $timeout, $route, puzzleSolverService, puzzleCatalogService) {
  var allPuzzles = puzzleCatalogService.getAvailablePuzzles();

  if ($route.current.params.limit) {
    allPuzzles = allPuzzles.splice(0, $route.current.params.limit);
  }

  $scope.solutionTimes = [];

  $scope.sortColumn = 'id';
  $scope.sortReverse = false;

  $scope.totalTime = 0;

  $scope.solving = true;

  $scope.orderBy = function (newColumn) {
    if (newColumn === $scope.sortColumn) {
      $scope.sortReverse = !$scope.sortReverse;
    } else {
      $scope.sortColumn = newColumn;
    }
  };

  function benchmarkPuzzle () {
    var start = Date.now();
    var listPuzzle = allPuzzles.shift();
    var puzzle = puzzleCatalogService.getPuzzle(listPuzzle.id);

    puzzleSolverService.solutionsForPuzzle({
      rows: puzzle.rowHints.map(function (h) { return _.map(h, 'value'); }),
      cols: puzzle.colHints.map(function (h) { return _.map(h, 'value'); })
    }).then(function (solutionData) {
      var solutions = solutionData.solutions;
      if (solutions.length !== 1) {
        console.log("Something wrong with", listPuzzle.id);
      }

      var timeTaken = (Date.now() - start) / 1000;

      $scope.solutionTimes.push({
        id: parseInt(listPuzzle.id, 10),
        time: timeTaken,
        iterations: solutionData.iterations
      });

      $scope.totalTime += timeTaken;

      if (allPuzzles.length > 0) {
        $timeout(benchmarkPuzzle, 0);
      } else {
        $scope.solving = false;
      }
    });
  }

  benchmarkPuzzle();
});

'use strict';

angular.module('ngPicrossApp').controller('PuzzleBoardCtrl', function ($scope, $location, puzzleService, puzzleCatalogService, puzzleHistoryService, constantsService, puzzle) {
  function nextPuzzleLink () {
    var match;
    if ((match = $location.path().match(/\/puzzles\/(\d+)/))) {
      var nextPuzzleNumber = parseInt(match[1], 10) + 1;
      if (puzzleCatalogService.getAvailablePuzzles()[nextPuzzleNumber]) {
        return 'puzzles/' + nextPuzzleNumber;
      }
    }
  }

  var startPuzzle = function (puzzle) {
    $scope.puzzle = puzzle;
    $scope.solved = false;
    $scope.nextPuzzleLink = nextPuzzleLink();
  };

  $scope.randomPuzzle = function () {
    if ($location.path() === '/random') {
      puzzleCatalogService.generateRandomPuzzle().then(function (puzzle) {
        startPuzzle(puzzle);
      });
    } else {
      $location.path('/random');
    }
  };

  $scope.showRandomLink = $location.url() === '/random';

  startPuzzle(puzzle);
});

'use strict';

angular.module('ngPicrossApp').controller('HomeCtrl', function ($scope, puzzleCatalogService) {
  $scope.puzzles = puzzleCatalogService.getAvailablePuzzles();
});

'use strict';

angular.module('ngPicrossApp').service('timerService', function ($timeout) {
  function pad(num, size) {
    var s = num + "";
    while (s.length < size) {
      s = "0" + s;
    }
    return s;
  }

  function PuzzleTimer () {
    var timerPromise, startTime;
    var self = this;

    this.start = function (cb) {
      startTime = new Date();
      this.run(cb);
    };

    this.run = function (cb) {
      timerPromise = $timeout(function () {
        cb();
        self.run(cb);
      }, 50);
    };

    this.stop = function () {
      $timeout.cancel(timerPromise);
    };

    this.reset = function () {
      startTime = new Date();
    };

    this.formattedValue = function () {
      var now = new Date();
      var diff = now - startTime;
      var totalSeconds = diff / 1000;
      var TIME_MULTIPLIER = 60;
      var totalMinutes = totalSeconds / TIME_MULTIPLIER;
      var totalHours = totalMinutes / TIME_MULTIPLIER;

      var justSeconds = pad(Math.floor(totalSeconds % TIME_MULTIPLIER), 2);
      var justMinutes = pad(Math.floor(totalMinutes % TIME_MULTIPLIER), 2);
      var justHours = pad(Math.floor(totalHours), 2);
      return justHours + ':' + justMinutes + ':' + justSeconds;
    };
  }

  function FakePuzzleTimer () {
    var timer = new PuzzleTimer();
    for (var p in timer) {
      if (timer.hasOwnProperty(p) && typeof(timer[p]) === 'function') {
        timer[p] = angular.noop;
      }
    }
    return timer;
  }

  return {
    createTimer: function (realTimer) {
      if (realTimer) {
        return new PuzzleTimer();
      } else {
        return new FakePuzzleTimer();
      }
    }
  };
});

'use strict';

angular.module('ngPicrossApp').service('storageService', function () {
  this.supported = (function () {
    try {
      localStorage.setItem('foo', 'bar');
      localStorage.removeItem('foo');
      return true;
    } catch (e) {
      return false;
    }
  })();

  this.get = function (key) {
    return localStorage[key];
  };

  this.getObj = function (key) {
    var value = this.get(key);
    if (value) {
      return JSON.parse(value);
    } else {
      return {};
    }
  };

  this.set = function (key, val) {
    localStorage[key] = val;
  };

  this.setObj = function (key, val) {
    this.set(key, JSON.stringify(val));
  };

  function keysMatching(prefix) {
    var keysMatching = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.match(new RegExp('^' + prefix))) {
        keysMatching.push(key);
      }
    }
    return keysMatching;
  }

  this.countKeysMatching = function (prefix) {
    if (!this.supported) {
      return 0;
    }

    return keysMatching(prefix).length;
  };

  this.clearKeysMatching = function (prefix) {
    if (!this.supported) {
      return;
    }

    var keysToRemove = keysMatching(prefix);
    keysToRemove.forEach(function (key) {
      localStorage.removeItem(key);
    });
  };
});

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
    for (var rowIx = 0; rowIx < hints.rows.length; rowIx++) {
      var rowHint = hints.rows[rowIx];
      var computedrowHints = puzzleService.hintsForLine(candidatePuzzle.rowMatrix[rowIx], CELL_ON);

      if (!_.isEqual(rowHint, computedrowHints)) {
        return false;
      }
    }

    for (var colIx = 0; colIx < hints.cols.length; colIx++) {
      var colHint = hints.cols[colIx];
      var computedColHints = puzzleService.hintsForLine(candidatePuzzle.colMatrix[colIx], CELL_ON);

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

    this.createInitialMatrix = function (candidatePuzzle) {
      candidatePuzzle.rowMatrix = [];
      candidatePuzzle.iterations = 0;

      for (var i = 0; i < candidatePuzzle.possibleRowArrangements.length; i++) {
        var arrangements = candidatePuzzle.possibleRowArrangements[i];

        // If there's only one possible arrangement, add it to the matrix unconditionally
        // with hope that it will speed up some of the column checks
        if (arrangements.length === 1) {
          candidatePuzzle.rowMatrix.push(arrangements[0]);
        } else {
          candidatePuzzle.rowMatrix.push(commonMarks(arrangements));
        }
      }

      this.syncColumnMatrix(candidatePuzzle);

      return this.markAllRequiredCells(candidatePuzzle);
    };

    this.syncColumnMatrix = function (candidatePuzzle) {
      candidatePuzzle.colMatrix = [];
      for (var colIndex = 0; colIndex < candidatePuzzle.rowMatrix[0].length; colIndex += 1) {
        candidatePuzzle.colMatrix.push(matrixService.col(candidatePuzzle.rowMatrix, colIndex));
      }
    };

    this.createInitialCandidatePuzzle = function () {
      var candidatePuzzle = {
        possibleRowArrangements: [],
        possibleColumnArrangements: [],
        rowCommonMarksCache: [],
        colCommonMarksCache: []
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
          this.solutions.push(candidatePuzzle.rowMatrix);
        }
        return;
      }

      // Skip branches of the tree where any column is already incorrect
      if (rowIx > 1) {
        for (var colIx = 0; colIx < this.cols.length; colIx++) {
          if (!partialMatch(candidatePuzzle.colMatrix[colIx], this.cols[colIx], this.colTotals[colIx], this.rows.length)) {
            return;
          }
        }
      }

      if (candidatePuzzle.rowMatrix[rowIx].indexOf(null) === -1) {
        return [[candidatePuzzle, rowIx + 1]];
      }

      var nextArrangements = candidatePuzzle.possibleRowArrangements[rowIx];
      var puzzleString = JSON.stringify(candidatePuzzle);

      var nextArgs = [];
      for (var i = 0; i < nextArrangements.length; i++) {
        var clone = JSON.parse(puzzleString);
        clone.rowMatrix[rowIx] = nextArrangements[i];
        this.syncColumnMatrix(clone);
        this.markAllRequiredCells(clone);
        if (clone.cannotMatch) {
          continue;
        }
        nextArgs.push([clone, rowIx + 1]);
      }
      return nextArgs;
    };

    function hasPartialMarks (line) {
      for (var i = 0; i < line.length; i++) {
        if (line[i] !== null) {
          return true;
        }
      }
      return false;
    }

    this.hasUnmarkedRequiredCells = function (puzzle, rowOrColumnIndex, isColumn) {
      var candidatePuzzle = this.createInitialCandidatePuzzle();

      var originalBoard = _.map(puzzle.board, function (row) {
        return _.map(row, function (cell) {
          if (cell.displayValue === 'x') {
            return 1;
          }
          if (cell.displayValue === 'b') {
            return 0;
          }
          return null;
        });
      });
      candidatePuzzle.rowMatrix = angular.copy(originalBoard);
      this.syncColumnMatrix(candidatePuzzle);

      var oldLine, newLine;
      if (isColumn) {
        _markRequiredCellsForLine(
          candidatePuzzle,
          candidatePuzzle.possibleColumnArrangements,
          candidatePuzzle.colMatrix,
          rowOrColumnIndex,
          isColumn
        );

        this.syncColumnMatrix(candidatePuzzle);
        oldLine = matrixService.col(originalBoard, rowOrColumnIndex);
        newLine = candidatePuzzle.colMatrix[rowOrColumnIndex];
      } else {
        _markRequiredCellsForLine(
          candidatePuzzle,
          candidatePuzzle.possibleRowArrangements,
          candidatePuzzle.rowMatrix,
          rowOrColumnIndex,
          isColumn
        );

        oldLine = matrixService.row(originalBoard, rowOrColumnIndex);
        newLine = candidatePuzzle.rowMatrix[rowOrColumnIndex];
      }

      return angular.toJson(oldLine) !== angular.toJson(newLine);
    };

    function _markRequiredCellsForLine (candidatePuzzle, arrangements, actual, rowOrColumnIndex, isColumn, commonMarksCache) {
      var recalculateCommonMarks = !commonMarksCache || commonMarksCache[rowOrColumnIndex];
      var line = actual[rowOrColumnIndex];
      if (hasPartialMarks(line)) {
        var arrangementCount = arrangements[rowOrColumnIndex].length;
        /* jshint -W083 */
        arrangements[rowOrColumnIndex] = arrangements[rowOrColumnIndex].filter(function (arrangement) {
          return !cannotMatch(arrangement, line);
        });
        /* jshint +W083 */
        if (arrangements[rowOrColumnIndex].length < arrangementCount) {
          recalculateCommonMarks = true;
        }

        if (arrangements[rowOrColumnIndex].length === 0) {
          candidatePuzzle.cannotMatch = true;
          candidatePuzzle.stillChecking = false;
          return;
        }
      }

      var theseCommonMarks;
      if (recalculateCommonMarks) {
        theseCommonMarks = commonMarks(arrangements[rowOrColumnIndex]);
        if (commonMarksCache) {
          commonMarksCache[rowOrColumnIndex] = theseCommonMarks;
        }
      } else {
        theseCommonMarks = commonMarksCache[rowOrColumnIndex];
      }

      return markLine(candidatePuzzle, theseCommonMarks, rowOrColumnIndex, isColumn);
    }

    function _markRequiredCells (candidatePuzzle, hints, arrangements, actual, isColumn) {
      var commonMarksCache = isColumn ? candidatePuzzle.colCommonMarksCache : candidatePuzzle.rowCommonMarksCache;

      var changed = false;
      for (var i = 0; i < hints.length; i++) {
        changed = changed || _markRequiredCellsForLine(candidatePuzzle, arrangements, actual, i, isColumn, commonMarksCache);

      }
      return changed;
    }

    this.markRequiredCells = function (candidatePuzzle) {
      candidatePuzzle.iterations += 1;

      var changed = false;

      changed = changed || _markRequiredCells(
        candidatePuzzle,
        this.cols,
        candidatePuzzle.possibleColumnArrangements,
        candidatePuzzle.colMatrix,
        true
      );

      if (candidatePuzzle.stillChecking) {
        changed = changed || _markRequiredCells(
          candidatePuzzle,
          this.rows,
          candidatePuzzle.possibleRowArrangements,
          candidatePuzzle.rowMatrix,
          false
        );
      }

      if (candidatePuzzle.stillChecking) {
        candidatePuzzle.stillChecking = changed;
      }
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
              var partialPuzzleSolution = binaryToCellStates(candidatePuzzle.rowMatrix);
              self.progressDeferred.notify(partialPuzzleSolution);
            }
          } else {
            deferred.resolve(candidatePuzzle);
          }
        }, 0);
      }

      candidatePuzzle.stillChecking = true;
      if (this.showProgress) {
        chainTimeout();
      } else {
        while (candidatePuzzle.stillChecking) {
          this.markRequiredCells(candidatePuzzle);
        }
        deferred.resolve(candidatePuzzle);
      }

      return deferred.promise;
    };
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

  function setMatrixCell (candidatePuzzle, rowIndex, columnIndex, value) {
    candidatePuzzle.rowMatrix[rowIndex][columnIndex] = value;
    candidatePuzzle.colMatrix[columnIndex][rowIndex]= value;
  }

  function markLine (candidatePuzzle, marks, rowOrColumnIndex, isColumn) {
    var matrix = candidatePuzzle.rowMatrix;
    if (!marks) {
      return;
    }

    var changed = false;
    for (var markIndex = 0; markIndex < marks.length; markIndex++) {
      var value = marks[markIndex];
      if (value === null) {
        continue;
      }

      var existingRowValue;
      if (isColumn) {
        existingRowValue = matrix[markIndex][rowOrColumnIndex];
      } else {
        existingRowValue = matrix[rowOrColumnIndex][markIndex];
      }
      if (existingRowValue !== value) {
        changed = true;
        if (isColumn) {
          setMatrixCell(candidatePuzzle, markIndex, rowOrColumnIndex, value);
        } else {
          setMatrixCell(candidatePuzzle, rowOrColumnIndex, markIndex, value);
        }
      }
    }
    return changed;
  }

  this.createSolverFromPuzzle = function (puzzle) {
    return new PuzzleSolver({
      rows: puzzle.rowHints.map(function (h) { return _.map(h, 'value'); }),
      cols: puzzle.colHints.map(function (h) { return _.map(h, 'value'); }),
    });
  };

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
            var partialPuzzleSolution = binaryToCellStates(bruteForceArgs[0][0].rowMatrix);
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
        deferred.resolve({
          solutions: _.map(solver.solutions, binaryToCellStates),
          iterations: initialPuzzle.iterations
        });
      }, null, deferred.notify);
    });

    return deferred.promise;
  };
});

'use strict';

angular.module('ngPicrossApp').service('puzzleService', function (constantsService, matrixService, storageService) {
  var CellStates = constantsService.CellStates;
  var puzzleService = this;

  function generateBoard (puzzle) {
    var rows = puzzle.length;
    var cols = puzzle[0].length;

    return Array.apply(null, new Array(rows)).map(function () {
      return Array.apply(null, new Array(cols)).map(function () {
        return {displayValue: CellStates.o};
      });
    });
  }

  this.hintsForLine = function (line, onState) {
    onState = onState || CellStates.x;
    var run = 0;
    var hints = [];
    for (var i = 0; i < line.length; i++) {
      if (line[i] === onState) {
        run += 1;
      } else if (run) {
        hints.push(run);
        run = 0;
      }
    }
    if (run) {
      hints.push(run);
    }

    return hints.length === 0 ? [0] : hints;
  };

  function rowHints (puzzle) {
    return puzzle.map(function (row) {
      return _.map(puzzleService.hintsForLine(row), function (hint) {
        return {value: hint};
      });
    });
  }

  function colHints (puzzle) {
    return puzzle[0].map(function (col, ix) {
      return _.map(puzzleService.hintsForLine(matrixService.col(puzzle, ix)), function (hint) {
        return {value: hint};
      });
    });
  }

  this.makePuzzle = function (solution, fingerprint) {
    return {
      solution: solution,
      board: generateBoard(solution),
      rowHints: rowHints(solution),
      colHints: colHints(solution),
      fingerprint: fingerprint,
      restoreState: function () {
        var savedState = storageService.get('puzzleState.' + this.fingerprint);
        if (!savedState) {
          return;
        }

        var board = this.board;
        savedState.split(',').forEach(function (savedRow, rowIndex) {
          return savedRow.split('').forEach(function (savedCell, colIndex) {
            var transformedCell = savedCell === ' ' ? '' : savedCell;
            var boardCell = board[rowIndex][colIndex];
            boardCell.value = boardCell.displayValue = transformedCell;
          });
        });
      },
      saveState: function () {
        var savedState = this.board.map(function (row) {
          return row.map(function (cell) {
            return cell.value || ' ';
          }).join('');
        }).join(',');
        storageService.set('puzzleState.' + this.fingerprint, savedState);
      },
      markAsSolved: function () {
        var puzzle = this;
        _.each(this.solution, function (solutionRow, rowIndex) {
          _.each(solutionRow, function (solutionCol, colIndex) {
            puzzle.board[rowIndex][colIndex].displayValue = solutionCol;
          });
        });
      },
      solved: function () {
        var boardWithOnlyMarkedCells = this.board.map(function (row) {
          return row.map(function (cell) {
            return cell.value === CellStates.x ? cell.value : CellStates.o;
          });
        });
        return angular.equals(this.solution, boardWithOnlyMarkedCells);
      }
    };
  };

  this._annotateHints = function (hints, line) {
    var forwardResult = this._computeHintAnnotationValues(_.map(hints, 'value'), line);
    var backwardResult = this._computeHintAnnotationValues(_.map(hints.slice().reverse(), 'value'), line.slice().reverse());
    backwardResult.reverse();

    for (var i = 0; i < hints.length; i++) {
      hints[i].solved = (forwardResult[i] || backwardResult[i]);
    }
  };

  this._computeHintAnnotationValues = function (hintValues, line) {
    var result = _.map(hintValues, function () { return false; });
    var linePosition = -1;
    var lastLineIndex = line.length - 1;
    var remainingHintValue = _.sum(hintValues);

    function positionMarked(position) {
      return line[position].displayValue === CellStates.x;
    }

    for (var i = 0; i < hintValues.length; i++) {
      var hintValue = hintValues[i];
      var hintSolved = false;
      var runStarted = false;
      var cellsRemainingForHint = hintValue;
      if (linePosition > -1 && positionMarked(linePosition)) {
        // If the last cell was marked, the next group must be at least one cell over
        linePosition += 1;
      }
      while (linePosition < lastLineIndex) {
        linePosition += 1;

        // If there are insufficient spaces remaining to fill any subsequent hints, give up
        var remainingSpaces = lastLineIndex - linePosition;
        if (remainingSpaces < (remainingHintValue - hintValue)) {
          return result;
        }

        if (positionMarked(linePosition)) {
          runStarted = true;
          cellsRemainingForHint -= 1;
          if (cellsRemainingForHint === 0) {
            // If there are no more cells in the line, mark as solved
            if (linePosition === lastLineIndex) {
              hintSolved = true;
              break;
            }
            // If the next cell is blank, mark as solved
            if (!positionMarked(linePosition + 1)) {
              hintSolved = true;
              break;
            }
            break;
          }
        } else if (runStarted) {
          break;
        }
      }
      result[i] = hintSolved;
      remainingHintValue -= hintValue;
      // If this segment had less cells than the hint, give up.
      if (runStarted && cellsRemainingForHint > 0) {
        return result;
      }
    }

    return result;
  };

  this.annotateHintsForCellChanges = function (puzzle, cells) {
    var puzzleService = this;
    _.uniq(_.map(cells, 'row')).forEach(function (rowIndex) {
      puzzleService._annotateHints(puzzle.rowHints[rowIndex], matrixService.row(puzzle.board, rowIndex));
    });
    _.uniq(_.map(cells, 'col')).forEach(function (colIndex) {
      puzzleService._annotateHints(puzzle.colHints[colIndex], matrixService.col(puzzle.board, colIndex));
    });
  };
});

'use strict';

angular.module('ngPicrossApp').service('puzzleHistoryService', function () {
  var supported = (function () {
    try {
      localStorage.setItem('foo', 'bar');
      localStorage.removeItem('foo');
      return true;
    } catch (e) {
      return false;
    }
  })();

  function getCompleted () {
    return JSON.parse(localStorage['ng-picross.puzzles-completed'] || '[]');
  }

  this.markCompleted = function (fingerprint) {
    if (!supported) {
      return;
    }

    var completed = getCompleted();
    if (completed.indexOf(fingerprint) === -1) {
      completed.push(fingerprint);
      localStorage['ng-picross.puzzles-completed'] = JSON.stringify(completed);
    }
  };

  this.isCompleted = function (fingerprint) {
    if (!supported) {
      return false;
    }

    var completed = getCompleted();
    return completed.indexOf(fingerprint) !== -1;
  };
});

'use strict';

angular.module('ngPicrossApp').service('puzzleCatalogService', function ($q, constantsService, puzzleService, puzzleHistoryService, puzzleSolverService, storageService) {
  var CellStates = constantsService.CellStates;

  function randomBoardDimensionCount (rowsOrCols) {
    var settings = storageService.getObj('settings');
    if (settings.specifySize && settings.size.rows && settings.size.cols) {
      return settings.size[rowsOrCols];
    } else {
      return 1 + Math.ceil(Math.random() * 9);
    }
  }

  function randomBoard () {
    var rows = randomBoardDimensionCount('rows');
    var cols = randomBoardDimensionCount('cols');

    var ticks = Math.ceil(Math.random() * 10);
    var distribution = Math.random();

    return Array.apply(null, new Array(rows)).map(function () {
      return Array.apply(null, new Array(cols)).map(function () {
        var cellValue = (Math.random() < distribution) ? CellStates.x : CellStates.o;
        ticks -= 1;
        if (ticks <= 0) {
          distribution = Math.random();
          ticks = Math.ceil(Math.random() * 10);
        }
        return cellValue;
      });
    });
  }

  function puzzleHasMerit (puzzle) {
    var rows = puzzle.length;
    var cols = puzzle[0].length;

    var rowHasCells = {};
    var colHasCells = {};
    puzzle.forEach(function (row, rowIx) {
      row.forEach(function (cell, colIx) {
        if (cell === CellStates.x) {
          rowHasCells[rowIx] = true;
          colHasCells[colIx] = true;
        }
      });
    });
    return (_.values(rowHasCells).length === rows) && (_.values(colHasCells).length === cols);
  }

  function computeSolutions(puzzle) {
    var deferred = $q.defer();
    var puzzleObj = puzzleService.makePuzzle(puzzle);
    var hints = {
      rows: puzzleObj.rowHints.map(function (hintObj) {
        return _.map(hintObj, 'value');
      }),
      cols: puzzleObj.colHints.map(function (hintObj) {
        return _.map(hintObj, 'value');
      })
    };

    puzzleSolverService.solutionsForPuzzle(hints).then(function (solutionData) {
      deferred.resolve(solutionData.solutions);
    });

    return deferred.promise;
  }

  this.generateRandomPuzzle = function () {
    // TODO: pass down user options for random puzzle (size, % filled, etc)
    var deferred = $q.defer();

    function tryPuzzle () {
      var puzzle = randomBoard();
      if (puzzleHasMerit(puzzle)) {
        computeSolutions(puzzle).then(function (solutions) {
          if (solutions && solutions.length === 1) {
            deferred.resolve(puzzleService.makePuzzle(puzzle));
          } else {
            tryPuzzle();
          }
        });
      } else {
        tryPuzzle();
      }
    }

    tryPuzzle();

    return deferred.promise;
  };

  var puzzles = [
    [
      'x x',
      ' xx',
      '  x'
    ],
    [
      '  x  ',
      ' xxx ',
      'xxxxx',
      'xxxxx',
      'xxxxx'
    ],
    [
      '  x  ',
      ' xxx ',
      'xxxxx',
      ' xxx ',
      '  x  '
    ],
    [
      'xx  x',
      'xxx x',
      'xxxxx',
      'xx xx',
      'xx  x'
    ],
    [
      'xxxxxxxxxx',
      'xxx xxxxxx',
      'x xxxxxxxx',
      'xxxxx xxxx',
      'xxxxxxxxxx',
      'xxx xxxxxx',
      'xxxxxxxxxx',
      'xxxx xxxxx',
      'xxxxxxxxxx',
      'xxxxxx x x'
    ],
    [
      '     x    ',
      '  xxxxxxx ',
      '   xxxxx  ',
      '   xxxxx  ',
      '   xxxxx  ',
      '  xxxxxxx ',
      '     x    ',
      'xxxxxxxxxx',
      ' xxxxxxxxx',
      '  xxxxxxx '
    ],
    [
      '   xxx    ',
      '  xxx x   ',
      '  xx  xx  ',
      ' xxxxxx   ',
      ' xx  xxx  ',
      ' xx  xxx  ',
      ' x   xxx  ',
      ' x    xx  ',
      '  x   x   ',
      ' xxxxxx   '
    ],
    [
      '      xxxx',
      '     xxx  ',
      '    xxx   ',
      '    xxxx  ',
      '   x xxx  ',
      '     xxx  ',
      '  xxxxxx  ',
      ' xxxxxx xx',
      'xx        ',
      ' x        '
    ],
    [
      '          ',
      ' xx    xx ',
      'x  x  x  x',
      'x        x',
      'x        x',
      'xxxx  xxxx',
      'x  x  x  x',
      'x  xxxx  x',
      'x  x  x  x',
      ' xxx  xxx '
    ],
    [
      '     xxx  ',
      '  xxxxxx  ',
      'xxxxxxxxx ',
      ' xxxxxxxx ',
      ' xxxxx xxx',
      ' xx  xx   ',
      ' x    x   ',
      ' x        ',
      'xxx       ',
      'x x       '
    ],
    [
      '    xx    ',
      '   xx    x',
      '  xxxx  xx',
      ' xxxxxx x ',
      'xx xxxxxx ',
      ' xxxxxx x ',
      '  xxxx  xx',
      '   xx    x',
      '    xx    ',
      '     xx   '
    ],
    [
      ' x        ',
      ' xx       ',
      ' xxx   xx ',
      ' x      xx',
      ' xx     xx',
      ' xxx    xx',
      'xxxxx  xxx',
      'x xxx xxx ',
      '  x xxx   ',
      '  x x     '
    ],
    [
      'xxx x x  x',
      'x x x x  x',
      'xx xxxxxxx',
      'x x    xxx',
      'xx     xxx',
      'xx   xxxxx',
      'xx   xxxxx',
      'xxx   xxxx',
      'xxx   xxxx',
      'xxx   xxxx'
    ],
    [
      '          ',
      '          ',
      '  xxx    x',
      ' xx  x xxx',
      'xx xxxxx  ',
      'xxxxxxxxxx',
      ' xxxxx xxx',
      '  xxx    x',
      '          ',
      '          '
    ],
    [
      'xx xxxx xx',
      'x xx x x x',
      'x x x xx x',
      'x xx   x x',
      'xx xx  x x',
      ' xxxxxxxxx',
      '  x  x    ',
      '  x x     ',
      ' xxxxxxx  ',
      'xx     xx '
    ],
    [
      '  xxxx    ',
      ' x x  xxxx',
      'x     x  x',
      'xx    x  x',
      'x     xxxx',
      'x    xx x ',
      ' xxxxx xx ',
      ' x  x x x ',
      ' x  xxxxx ',
      ' xxxx     '
    ],
    [
      " xxxxxxxx ",
      "xx      xx",
      "x  xxxx  x",
      "x x    x x",
      "x x xx x x",
      "x x x  x x",
      "x x xxx  x",
      "x x     xx",
      "x  xxxxxx ",
      " x        "
    ],
    [
      '     xxxx ',
      '  xx xxxx ',
      '  xxxxxxx ',
      ' x xxxxxx ',
      '  xxxxx   ',
      '     xx   ',
      '  xxxxx   ',
      'xx   x  x ',
      '     xxx x',
      '          '
    ],
    [
      'xxx    xxx',
      '   xxxx   ',
      '  x    x  ',
      '  x x xx  ',
      'xxx x xx  ',
      '       xx ',
      '        x ',
      '  x xxxxx ',
      '  x xxx   ',
      '   x xx   '
    ],
    [
      '  xxxxxxxxxxx  ',
      '  x    x    x  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxx     xxx  ',
      '  xxxxxxxxxxx  ',
      '  xxx     xxx  ',
      '  xxxxx xxxxx  ',
      '  xxxxx xxxxx  ',
      '  xxxxxxxxxxx  ',
      '      xxx      ',
      '      xxx      '
    ],
    [
      'xxxxxxxxxxxxxx ',
      'x  xxxxxxxxx  x',
      'x  xxxxx  xx  x',
      'x  xxxxx  xx  x',
      'x  xxxxx  xx  x',
      'x  xxxxxxxxx  x',
      'x             x',
      'x xxxxxxxxxxx x',
      'x x         x x',
      'x x xxxxxxx x x',
      'x x         x x',
      'x x xxxxxxx x x',
      'x x         x x',
      'x x         x x',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '   x       x   ',
      '   xxxxxxxxx   ',
      '    xxxxxxx    ',
      '   xxxxxxxxx   ',
      'x xxxxxxxxxxx x',
      'xxxxxxxxxxxxxxx',
      '   x x   x x   ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxxxxxxx ',
      'xxxxxxxxxxxxxxx',
      ' x           x ',
      'xx xx xxx xx xx',
      ' x    x x    x ',
      'xxxxxxx xxxxxxx',
      '               '
    ],
    [
      '               ',
      '  xxxxxxx      ',
      ' xxxxxxxxx     ',
      ' xx     xx     ',
      ' xx     xx     ',
      ' xx         xxx',
      'xxxxxxxxxxx x x',
      'xxxxxxxxxxx xxx',
      'xxxx   xxxx  x ',
      'xxxx   xxxx xx ',
      'xxxxx xxxxx  x ',
      'xxxxx xxxxx xx ',
      'xxxxxxxxxxx    ',
      'xxxxxxxxxxx    ',
      '               '
    ],
    [
      'x   xxxxxxxxxxx',
      'x     xxxxxxxxx',
      'xx xx  xxxxxxxx',
      ' xx  x    xxxxx',
      'x x  x   xxxxxx',
      'x  xx   xxxxxxx',
      'xx  x  x xxxxxx',
      'xxx x xxx xxxxx',
      'xxx  x xx xxxxx',
      'xxx xxx   xxx  ',
      'xxxxxxxxxxx  xx',
      'xxxxxxxxxx xxxx',
      'xxxxxxxxx xxxxx',
      'xxxxxxxxx xx x ',
      'xxxxxxxx  x   x'
    ],
    [
      '    xxxxxxx    ',
      '  xxxx   xxxx  ',
      '  xx   x   xx  ',
      ' xx    x    xx ',
      ' xx    xxx  xx ',
      ' xx         xx ',
      ' xxx       xxx ',
      ' xxxxx   xxxxx ',
      ' xxxxxxxxxxxxx ',
      ' xxx   x   xxx ',
      ' xx   x x   xx ',
      ' xx xx   xx xx ',
      ' xx xxx xxx xx ',
      ' xx         xx ',
      ' xxxxxxxxxxxxx '
    ],
    [
      'xxxxxxxxxxxxxxx',
      'xxxx      xxxxx',
      'xx         xxxx',
      'x           xxx',
      '             xx',
      '             xx',
      ' xx    xxxx xxx',
      '   xx xxxxxx xx',
      ' xx x xxxxxx xx',
      ' xx x x xxxx xx',
      '    x x        ',
      'x     xxx xx x ',
      'xx   xx x xx x ',
      'xxx xxx   xx x ',
      'xxxxxxxxx      '
    ],
    [
      ' xxx x x xxx xx',
      ' x         x xx',
      ' x xxxxxxx x x ',
      ' x xx    x x x ',
      'xx x   x x xxx ',
      'x  x   x x  xx ',
      'x  x   x x  xxx',
      'x  xxxxxxx  xxx',
      'x           xx ',
      'x   x x x   xx ',
      'x           x  ',
      'x xxxxxxxxx x  ',
      'x x       x x  ',
      'x x       x x  ',
      'xxxxxxxxxxxxx  '
    ],
    [
      ' x  x   x  x  x',
      '               ',
      'xxxxxxx xxxxxxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'xxxxxxx xxxxxxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'x   xxxxx   xxx',
      'x    xxx    xxx',
      'xx         xxxx',
      ' xx       xxxx ',
      '  xxxxxxxxxxx  '
    ],
    [
      '         x     ',
      '        xx     ',
      '  xx   xxx     ',
      '  xxxxxx x     ',
      '   x xx  x     ',
      '   xxx   x     ',
      '   xx    x     ',
      '  xx    xxx    ',
      ' xx    xx x    ',
      'xxxxxxxx  xx   ',
      '     xxxxxxx   ',
      '    xx     xx  ',
      '   xxxxxxxxxx  ',
      '  xx        xx ',
      '  xxxxxxxxxxxx '
    ],
    [
      '          xxxxx',
      'x         x   x',
      'xx        xx  x',
      'xxx       x   x',
      'x xx      xx  x',
      'x  xx     x   x',
      'xx  xx    xxx x',
      'x    xx   x   x',
      'xx    xx  xx  x',
      'x  xx  xx x   x',
      'xx xx   xxxx  x',
      'x        xx   x',
      'x x x x x xxx x',
      'xxxxxxxxxxx   x',
      '          xxxxx'
    ],
    [
      '      x        ',
      '      x        ',
      'xxxxx x        ',
      '    x x        ',
      'x x x x  x x   ',
      'x x x x  x x   ',
      '    x x  x x   ',
      'xxxxx x xxxxx  ',
      '      x xxx x  ',
      'xxxxx x xxx x  ',
      '    x x xxx x  ',
      'x x x x xx xx  ',
      'x x x x  xxx   ',
      '    x x   x    ',
      'xxxxx x   x    '
    ],
    [
      '     xxxxx     ',
      '    xx   xx    ',
      '    x     x    ',
      '   xx     xx   ',
      '   x       x   ',
      '  xx       xx  ',
      '  x         x  ',
      ' xx xxxxxxx xx ',
      ' x  xxxxxxx  x ',
      'xx  xxxxxxx  xx',
      'x   xxxxxxx   x',
      'x   xxxxxxx   x',
      'x   xxxxxxx   x',
      'xx  xxxxxxx  xx',
      ' xxxxxxxxxxxxx '
    ],
    [
      '  xxx          ',
      ' x   x         ',
      ' xx xx    xxx  ',
      ' x   x   xxxxx ',
      '  xxx   xxxxxxx',
      '   x    xx   xx',
      '  xxx   xxx xxx',
      ' xx xx  xx   xx',
      ' x xxx    x x  ',
      ' xxxxx   xx xx ',
      ' xxxxx  x  x  x',
      ' x   x  xxxxxxx',
      ' x   x  xxxxxxx',
      ' x   x  x     x',
      ' xxxxx  xxxxxxx'
    ],
    [
      '   xxxxxxxxx   ',
      '  xxxxxxxxxxx  ',
      '  xx       xx  ',
      '  xx       xx  ',
      '  xxx xxx xxx  ',
      '   xxxxxxxxx   ',
      '     xxxxx     ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      x x      ',
      '      xxx      '
    ],
    [
      '               ',
      '         x     ',
      '      x  xx    ',
      '     xxx xx    ',
      '    xxxxxxxx   ',
      '  xxxxxxxxxxx  ',
      ' xxxxxxxxxxxx  ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxxxxxxx ',
      '  xxx   xxxxx  ',
      '  xx     xxxx  ',
      '          xx   ',
      '               ',
      '           x   '
    ],
    [
      '               ',
      '  x            ',
      ' xxx     xxx  x',
      ' xxxxxxxxxxx xx',
      ' xxxx x x xxxxx',
      ' xxxxxxxxxxxxxx',
      ' xxx    xxxx xx',
      ' x       xxx  x',
      '  x  x    xx   ',
      '  xxx     xx   ',
      '  x      xxxx  ',
      '  xx    xxxxxx ',
      ' xxxxxxxxxxxxx ',
      'x             x',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '     xxxxx     ',
      '    x     x    ',
      '     xxxxx     ',
      '     xxx x     ',
      '     xxx x     ',
      '     xxx x     ',
      '     xxxxx     ',
      '     xxxxx     ',
      '    xxxxxxx    ',
      '   xxxxxx xx   ',
      '  xxxxxxxx xx  ',
      ' xxxxxxxxxxxxx ',
      'xxxxxxxxxxxx xx',
      'xxxxxxxxxxxxxxx',
      ' xxxxxxxxxxxxx '
    ],
    [
      '  xxxxxxxxxxx  ',
      '  x  xxxxx  x  ',
      '  x  xxxxx  x  ',
      '  x  xxxxx  x  ',
      '  x  xxxxx  x  ',
      '  xx xx xx xx  ',
      '   xxx   xxx   ',
      ' xxxx  x  xxxx ',
      ' x    xxx    x ',
      ' xx  xx xx  xx ',
      '  xx  xxx  xx  ',
      '   x   x   x   ',
      '  xx  xxx  xx  ',
      '  x  xx xx  x  ',
      '  xxxx   xxxx  '
    ],
    [
      '               ',
      '               ',
      ' xxxxx xx xxxx ',
      '       xx      ',
      '  xxxxxxxxxxx  ',
      '  x          x ',
      ' xxxx   xxxx xx',
      ' x  x         x',
      'x   x   x     x',
      'xxxxx  xxx    x',
      'x       x     x',
      'x  xxx    xxx x',
      'xxxx xxxxxx xxx',
      '   xxx    xxx  ',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '               ',
      '               ',
      '               ',
      '               ',
      '       xxx     ',
      '       xxx     ',
      '       x       ',
      '       x       ',
      '    xxxxxxxx   ',
      '  xxxxx xxxxxx ',
      ' xxxxxxxxxxxxx ',
      '   xxxxxxxxxx  ',
      '      xxxxxx   ',
      '               ',
      '               '
    ],
    [
      '   xxxxxxxxx   ',
      '  xxx  x   xx  ',
      ' xxx x xx xxxx ',
      ' xxxx xx x xxx ',
      ' xxx xxxxxxxxx ',
      ' xxxxx   xxxxx ',
      ' xxxxxxxxxxxxx ',
      '  xxx     xxx  ',
      '  xxxxx xxxxx  ',
      '   xx x x xx   ',
      '   xxxxxxxxx   ',
      '    xxxxxxx    ',
      '       x       ',
      '       x       ',
      '       x       '
    ],
    [
      '    xx         ',
      '   xxxx        ',
      '   xx x        ',
      '   x           ',
      '  xx           ',
      ' xxxx          ',
      ' xxxxxxxx      ',
      '  xx xxxxx     ',
      '  xxx xxxxx    ',
      '  xxx xxxxx    ',
      '   xxx  xxxx   ',
      '    xxxx   x   ',
      ' xx  xxxxxxx   ',
      ' x xxx  xxxxx  ',
      '      xxx  xx  '
    ],
    [
      '               ',
      ' x   x   x   x ',
      ' xxxxx   xxxxx ',
      ' x   xxxxx   x ',
      ' x   x   x   x ',
      ' xxxxx   xxxxx ',
      ' x   xxxxx   x ',
      ' x   x   x   x ',
      ' xxxxx   xxxxx ',
      ' x   xxxxx   x ',
      ' x   x   x   x ',
      '               ',
      ' x  xxx  x   x ',
      'xxx x x xxx xxx',
      ' x  xxx  x   x '
    ],
    [
      '               ',
      '       xxxxxxxx',
      '          x    ',
      '          xxx x',
      '            x  ',
      '    xxx     x x',
      '    x       x  ',
      '   xx       x x',
      '    x       x  ',
      '    x       x x',
      '            x  ',
      '           xxxx',
      '           x   ',
      '           x   ',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '   xxxxxxxxx   ',
      ' xxx x   x xxx ',
      ' x x  x x  x x ',
      'x  x   x   x  x',
      'x  x  xxx  x  x',
      'x  x xxxxx x  x',
      'x  xx  x  xx  x',
      'x  x  xxx  x  x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x      x      x'
    ],
    [
      'xx           xx',
      'xx           xx',
      'xxxxxxxxxxxxxxx',
      'xx x       x xx',
      'xx x  xxx  x xx',
      '   xx x x xx   ',
      '    xxx xxx    ',
      '    xxxxxxx    ',
      '     xxxxx     ',
      '     xxxxx     ',
      '      xxx      ',
      '     xxxxx     ',
      '     xx xx     ',
      '     x   x     ',
      '    xx   xx    '
    ],
    [
      '    xxxx xxxx  ',
      '    x  x x  x  ',
      '    x xxxxx x  ',
      '    xxx   xxx  ',
      '    x   x  x   ',
      '    xx     x   ',
      '     xxxxx x   ',
      'xxx    x   x   ',
      'x xxxxxx   xx  ',
      'xxx    x    x  ',
      ' x          xxx',
      ' x          x x',
      'xxx    x  xxxxx',
      'x     xx      x',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '               ',
      '               ',
      '      xxxx     ',
      '  xxxxxxxxxxx  ',
      ' xxx  xxxx  xx ',
      ' xx    xx    x ',
      ' xx    xx    x ',
      ' xxx  xxxx  xx ',
      ' x xxxx  xxxx  ',
      ' x             ',
      ' x             ',
      ' x             ',
      ' x             ',
      ' x             ',
      ' x             '
    ],
    [
      ' xx            ',
      ' x xxxxxxxxxx  ',
      'xx x       xxx ',
      'xx x       xxx ',
      '   x       xxx ',
      '   x       xxx ',
      '   xxxxxxxxxx  ',
      '  xx      xxx  ',
      ' xxxxxxxxxxx   ',
      ' x        xxxx ',
      ' x xxxxxx xx x ',
      ' x xxxxxx xx xx',
      ' x        xx   ',
      ' xxxxxxxxxxx   ',
      ' x        x    '
    ],
    [
      ' xxx       xxx ',
      ' xxxx     xxxx ',
      '   xx     xx   ',
      ' xxxxxxxxxxxxx ',
      '  xx x x x xx  ',
      '  xx x x x xx  ',
      ' xxx x x x xxx ',
      ' xxx x x x xxx ',
      'xx x x x x x xx',
      'xx x x x x x xx',
      'xx x x x x x xx',
      'xxxx x x x xxxx',
      ' xxx x x x xxx ',
      '  xxxxxxxxxxx  ',
      '   xxxxxxxxx   '
    ],
    [
      '         xx    ',
      '        xxxx   ',
      ' xxx    xxxxx  ',
      ' xxx x xxxxxxx ',
      ' xxx x  xxx xx ',
      '  xxx    xx xx ',
      'xxxxxx  xxxx x ',
      '  xxxx xxxxx x ',
      '  xxxxxxxxxx   ',
      '   xxxxxxxxx   ',
      '    xxxxxxxx   ',
      '     x  xxxx   ',
      '       xxxxx   ',
      '   xxxxxxxxx   ',
      '   xxxxxxxx    '
    ],
    [
      'xxxxxxxxxxxxxxx',
      'xxxxxxx      xx',
      'xxxxxx   xx   x',
      'xxxxxx  xxxx  x',
      'xxx     xxxx  x',
      'x       xxx   x',
      'x xx  x     x x',
      'x xx   xxx xx x',
      'x             x',
      'x       xx    x',
      'x x x xxxx    x',
      'x x xx x     xx',
      'x xx x x    xxx',
      'xx        xxxxx',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '    xxx        ',
      '     x         ',
      '    xxx        ',
      '    x xxxx     ',
      '    x xxxxx    ',
      '    x x   xx   ',
      '    xxx    x   ',
      '   x x x  xx   ',
      '        xxx    ',
      '   xxxxxxx     ',
      '        xx     ',
      '       xxxx    ',
      '    xxx x x    ',
      '        xxxx   ',
      '  xxxxxxxxxx   '
    ],
    [
      '  xxx          ',
      '  x x          ',
      'xxxxxxx        ',
      '  x x          ',
      'xxxxxxx        ',
      '  x x          ',
      '  x x          ',
      '  x x          ',
      '  xxx          ',
      '  xxx          ',
      '  xxx     x  xx',
      '  x x    xx   x',
      '  x x   xxxxxx ',
      '  x x     xxxx ',
      '  xxx    x x x '
    ],
    [
      '      xx       ',
      '     xxxx      ',
      '      xx       ',
      '    xxxxx      ',
      '   xxx  xx   x ',
      '   xxxxxxxxxxx ',
      '   xxxxxxx x   ',
      '   xxxxx xxx   ',
      '   xxxx  xxx   ',
      '   xx    x     ',
      '   xxx   x     ',
      '   xxx   x     ',
      '   xxxxxxx     ',
      '     x x       ',
      '    xx xx      '
    ],
    [
      '    xxxxxxx    ',
      '   xx     xx   ',
      '  xx xxxxx xx  ',
      ' xx xx   xx xx ',
      'xx xx  x  xx xx',
      'x xx       xx x',
      'xxx  x      xxx',
      ' x xxx       x ',
      ' x   x       x ',
      ' x   xxxxxxxxx ',
      ' x   xxxxxx  x ',
      ' x  xxxx xxx x ',
      ' x x       xxx ',
      ' x           x ',
      ' xxxxxxxxxxxxx '
    ],
    [
      '  xxxx   xxxx  ',
      ' xx  xxxxx  xx ',
      ' x    xxx    x ',
      ' x xx xxx xx x ',
      ' x  x xxx x  x ',
      ' x   xxxxx   x ',
      'x  xxx x xxx  x',
      'x  x xxxxx x  x',
      'x xx xxxxx xx x',
      'x  xxxxx xxx  x',
      'x  x x xxx x  x',
      'x  x xxxxx x  x',
      'x xx xxx x xx x',
      '     xxxxx     ',
      '      xxx      '
    ],
    [
      '    xxxxxxx    ',
      '  xxxxxxxxxxx  ',
      ' xx         xx ',
      'xx           xx',
      'x             x',
      'x             x',
      'x             x',
      'xxx         xxx',
      'xx x       x xx',
      'xx x       x xx',
      'xx x       x xx',
      'xx x       x xx',
      ' xx         xx ',
      '  x         x  ',
      '  x         x  '
    ],
    [
      '         xx    ',
      '   xxx xxxxx   ',
      '  xxx xx       ',
      '  x  xxxxxx    ',
      '    xxx xxxx   ',
      '   xx xxxxxxx  ',
      '   xxxxx x xx  ',
      '   x xxxxxxxx  ',
      '   xx xxxxxxx  ',
      '    xxx xx x   ',
      '    xxxxxxxx   ',
      '     xx x x    ',
      '     xxxxxx    ',
      '      xxxx     ',
      '       xx      '
    ],
    [
      'xxxxxxxxxxxxxx ',
      'x            x ',
      'x xx xx xx   x ',
      'x x  x  xx   x ',
      'x xx xx x    x ',
      'x        xxx x ',
      'x       xxxxxx ',
      'x       xx  xx ',
      'xxxxxxxxx   xx ',
      '         x x   ',
      '       xxxxxxx ',
      '       x xxx x ',
      '     xxxx x  x ',
      ' xxx xxxxxxxxxx',
      '     x        x'
    ],
    [
      '      xxx      ',
      '    xxxxxxx    ',
      '   x xxx xxx   ',
      '   x xxx xxx   ',
      '  x xxx   xxx  ',
      '  x xxx   xxx  ',
      '  x xxx   xxx  ',
      '   x xxx xxx   ',
      '   x xxx xxx   ',
      '    xxxxxxx    ',
      '    x xxx x    ',
      '     x   x     ',
      '     xxxxx     ',
      '     x   x     ',
      '     xxxxx     '
    ],
    [
      'xxxx        xx ',
      'x  x        xx ',
      'x  x        xx ',
      'x  x        xx ',
      '            xx ',
      '    xx      xx ',
      '   xx x     xx ',
      '   xxxx     xx ',
      '    xx      xx ',
      '            xx ',
      '         xx xx ',
      '  xxx   xxxxxx ',
      ' x xxx   xxxxx ',
      'x xxxxx   xxxxx',
      'xxxxxxx    xxxx'
    ],
    [
      '               ',
      '   x  x        ',
      '   x  x        ',
      '   xxxxx xxxx  ',
      '     xxxxx   xx',
      '     xxxx     x',
      '     xxx      x',
      '     xx      xx',
      '    xx    xxxxx',
      '  xxx    xxxxxx',
      'xx      xxxxxxx',
      'x      xxxxxxxx',
      'x     xxxxxxxxx',
      'xx  xxxxxxxxxxx',
      '  xxxxxxxxxxxxx'
    ],
    [
      '     xxxx      ',
      '   xx   xx     ',
      '   xxx   x     ',
      '  x xx   xx    ',
      ' xx   xx  xx   ',
      ' x  xx     xx  ',
      '  xxx      xx  ',
      '   xx       x  ',
      '  xx   xxxx x  ',
      '  x   xx    x  ',
      ' xx  xx     x  ',
      ' x   x      xx ',
      ' x  xx   x   x ',
      ' x xx   xx  xx ',
      ' xxxxxxxxxxxx  '
    ],
    [
      '               ',
      '               ',
      '               ',
      '     x      x  ',
      '     xx    x x ',
      '     x x  xxxxx',
      '     x  x   x  ',
      '     x  xx xxx ',
      '     x   xxxxx ',
      'x    x     xxx ',
      'xxxxxxxxxxxxxxx',
      ' xx          xx',
      '  xxxxxxxxxxxxx',
      '   xxxxxxxxxxx ',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '      xxxx     ',
      '      xxxx     ',
      '       xxxxxx  ',
      '       xxx xxx ',
      '  x   xxx   xx ',
      '  x  xxxxxx xx ',
      '   xxxxx  x  xx',
      '    xxxx  x   x',
      '    xxxxx      ',
      ' x   xxxx      ',
      ' x   xxxxx     ',
      ' x xxxxxx      ',
      ' xxx xxxxxxxx  ',
      '  x         x  ',
      '          xxx  '
    ],
    [
      '     xxx       ',
      '    xxxx       ',
      '     xxxx      ',
      '     xxxxx     ',
      '    xx xxxx    ',
      '    x  xxxxx   ',
      '    x  xxxxx   ',
      '    xxxx xxx   ',
      '   xxxxxxxxx   ',
      'x xxxxxxxxxx   ',
      ' xx xx xxxx    ',
      '    xx         ',
      '    x  xxxx    ',
      '    x  xxxx    ',
      '   xx          '
    ],
    [
      '      x    xxxx',
      'xxxx  x    x  x',
      'x  x  x   x  xx',
      'xxxx xxx  xxxx ',
      '     x x       ',
      '     xxx       ',
      '     x x       ',
      '     xxx       ',
      '   xxx xxx     ',
      '   xxxxxxx     ',
      '    xxxxx      ',
      '   xxxxxxx     ',
      '   xxxxxxx     ',
      '  xx     xx    ',
      ' xx  xxx  xxx  '
    ],
    [
      '     x         ',
      '   x x         ',
      '   xxxx        ',
      '    xxx        ',
      '    xxxx       ',
      '     xx        ',
      '    xxx      x ',
      '    xxxx      x',
      '    xxxxx     x',
      '    xxxxxx xx x',
      '    xxxxxxxxxx ',
      '   xx xxxxxxxx ',
      '   x  x    xx  ',
      '  xx xx     xx ',
      'xxx xx    xxxx '
    ],
    [
      '        x      ',
      '       xx      ',
      '       xxxx    ',
      '       xxx     ',
      '       xx      ',
      '        xx     ',
      '   xxx  xx     ',
      '    xxxx xx    ',
      '   xxxxxxxx    ',
      '    xxxxxxx    ',
      '     xxxxx     ',
      ' xxx  x    x   ',
      '  xxxxxxxxxxxx ',
      ' xxx  x    x   ',
      '      x        '
    ],
    [
      '  xx           ',
      ' x xx          ',
      'xx  xxx        ',
      'x  xx xxxx     ',
      'x xxx    xxxx  ',
      'x xxx       xx ',
      'x  xx   xxx  x ',
      'xx  x xxxxxx x ',
      ' x xxxxx   x x ',
      ' xxxxx xxxxx x ',
      '  x x  x   x x ',
      '    xx xxxx xx ',
      '     xx    xxx ',
      '      xxxxxx x ',
      '            xx '
    ],
    [
      '     x x       ',
      '     x xxxxx   ',
      '  xxxx xx xxxx ',
      ' x   x xxxx xxx',
      ' xxx x xxxx  xx',
      'xxxxxxxxx  x  x',
      'xx  xx xx   x x',
      'x   x  xxx  xxx',
      'x   x  xxx  xxx',
      'x  xx  xxx  xxx',
      'x  xx  xxx xxxx',
      'x  xx  xxx xxx ',
      'xx xxx  xxxxxx ',
      ' xxxxxxxxxxxx  ',
      '     xxxxx     '
    ],
    [
      'xx          xxx',
      ' xx       xxxx ',
      '  xx     xx    ',
      'xxx       xxx  ',
      'xxxxx    xxxxx ',
      ' xxx       xxxx',
      '               ',
      '               ',
      '               ',
      '               ',
      '           x   ',
      '    xx xx      ',
      '   xxxxxxx     ',
      '    xxxxx      ',
      '     xxx       '
    ],
    [
      'xx x       xx x',
      'xxx  x   x xxx ',
      '       x       ',
      ' x    xxx    x ',
      ' xxxxxxxxxxxxx ',
      '  xx xx xx xx  ',
      '   xxxx  xxx   ',
      '      x        ',
      '     xx xx     ',
      'x    xx  x    x',
      'x x   x x   x x',
      'x xx  xxx  xx x',
      'x xxxx   xxxx x',
      'xx x xxxxx x xx',
      'xx  xxxxxxx  xx'
    ],
    [
      '      xx       ',
      '      xx       ',
      ' xx    xx      ',
      'xxxx   xxx     ',
      'xxxxxxxxxx     ',
      '  xx  xxxx     ',
      '  xx xxxxxx    ',
      '  xxxxxxxxx    ',
      '   xxxxxxxxxxx ',
      '   xxxxxxxxx xx',
      '  xxxxxxxxxx   ',
      '  x x xxxx x   ',
      '  xxx    x xx  ',
      '    x   xx  x  ',
      '   xx   x  xx  '
    ],
    [
      ' xxxx          ',
      'xx  xxx        ',
      'x  x  x        ',
      'xxx   xx       ',
      'x x   xxx      ',
      'xxxxxxx xx     ',
      'x x  x   xx    ',
      '  x  x    x    ',
      '  x  xx   xxxxx',
      '  x   xxxxx   x',
      '  xx     xxxxxx',
      '   xx  xxx     ',
      '    xxxx       ',
      '    x  x       ',
      '  xxxxxxxx     '
    ],
    [
      '           xxxx',
      '  xxxxxxxxx   x',
      ' xxx       xxxx',
      ' xx            ',
      ' xxxxx         ',
      '  xxxxxxxxx    ',
      '     xxxxxxx   ',
      '         xxxx  ',
      '       x  xxxx ',
      '      xx   xxx ',
      ' xxxxx    xxxx ',
      'xxxxxxxxxxxxxx ',
      ' xxxxx  xxxxx  ',
      '      x        ',
      '      xx       '
    ],
    [
      '     xx xx     ',
      '    x  x  x    ',
      '       x  x    ',
      '    x  x       ',
      '      xxx x    ',
      '      x x      ',
      '  xxxxxxxxxxx  ',
      '  xx       xx  ',
      '   xxxxxxxxx   ',
      '    x    xx    ',
      '    x    xx    ',
      '    xx  xxx    ',
      '     x  xx     ',
      '   xxxxxxxxx   ',
      '   x      xx   '
    ],
    [
      'xx    x x      ',
      'xx    xxx      ',
      '     x xxx     ',
      'x xxxxxxx      ',
      '   xx xxxx     ',
      '      xxx      ',
      '     xxxxxx    ',
      '    xx  xx     ',
      '    x  xxxx    ',
      '    x   xx  x  ',
      '    xx xxx  x x',
      '     xxxxx  x x',
      '  xx   xxx xx x',
      '  xxx  xx     x',
      '    xxxxx    xx'
    ],
    [
      ' xxxxx xxxxx   ',
      'x  xxxxx  xxx  ',
      '  xxx xxxx xx  ',
      ' xx x x  x  x  ',
      ' xx x x   x xx ',
      ' xx x xx  x xx ',
      ' x  x  x     x ',
      ' x  xx x     x ',
      ' xx  x    xx   ',
      ' xx  x     x   ',
      ' xx  x  x xxx  ',
      ' xx     xxxxxxx',
      ' xxx      xxx x',
      '  xx       x   ',
      'xxxxx      xx  '
    ],
    [
      '     xxxxx     ',
      '    x     x    ',
      '   x xxxxx x   ',
      'xxxxx     xxxxx',
      'x x  xxxxx  x x',
      'x xxx     xxx x',
      'x xx  xxx  xx x',
      'x x xx x xx x x',
      'x x x xxx x x x',
      '  x x x x x x  ',
      ' xx xx   xx xx ',
      '     x   x     ',
      '     x   x     ',
      '    xx   xx    ',
      '               '
    ],
    [
      '               ',
      '   xxxxxxxx    ',
      '   xx x x xx   ',
      '  xxxxxxxx x   ',
      ' xx       xx xx',
      ' x  xx     xxxx',
      'x x  xxx    x x',
      'x    x x      x',
      'xx x x x     xx',
      'x    xxx    x x',
      'xx  xx     xxxx',
      ' xx       xxx x',
      '  xxxxxxxx x xx',
      '   x x x xxx   ',
      '    xxxxxxx    '
    ],
    [
      '    xxx   xx   ',
      '       xxxxxx  ',
      '     xxxxx x   ',
      '    xxx  x     ',
      'xx x  xx  xxx  ',
      ' xx    x       ',
      '      x        ',
      '     x         ',
      '     xxx       ',
      '    xx xx      ',
      '   xx xxxx     ',
      '   xx xxxx     ',
      '   xxxxxxx     ',
      '    xxxxx      ',
      '     xxx       '
    ],
    [
      '             x ',
      '            xx ',
      '   xx      x x ',
      ' xx x      x x ',
      'x   x      x x ',
      'xxxxx      x x ',
      '  x xxxx  x x  ',
      '  x xx xx x x  ',
      '  x x x  x  x  ',
      '  x xxxxx xxx  ',
      '  x x x    xx  ',
      '  xxx x    xx  ',
      '   x  xx   xx  ',
      '    xxxxxx x   ',
      '          xx   '
    ],
    [
      '  xxxx         ',
      ' xx  xx        ',
      'xx x  x        ',
      ' xx   xx       ',
      '  x    xxxx    ',
      ' xx    x  xx   ',
      'xx     xx  x   ',
      'x          xx  ',
      'x           xxx',
      'x           x x',
      'xx          x x',
      ' xx       xxx x',
      '  xxxxxxxxxxxxx',
      '     x  x      ',
      '   xxxxxxxx    '
    ],
    [
      '         xx    ',
      '        x  x   ',
      'xx xx  xxxxxx  ',
      '  x    x    x  ',
      '       xxxxxx  ',
      '        x  x   ',
      '  xx xx x  x   ',
      '  x x x x  x   ',
      '       xx  xx  ',
      'xxxxxxxx    xxx',
      '       x xx x  ',
      '   xxx x xx x  ',
      '   x x x xx x  ',
      'xxxxxxxxxxxxxx ',
      '             x '
    ],
    [
      '         x     ',
      'xxx     xxx    ',
      '  x     x x    ',
      ' x xxxx x x    ',
      ' x  xx  x      ',
      ' x   x  x      ',
      '  xxxxxx       ',
      '     xx        ',
      '     xx xxxxxxx',
      '     xxxxxxxxx ',
      '      xxxxxxx  ',
      '     xx  x  x  ',
      '    x x  x  x  ',
      '    x x  x  x  ',
      '  xx x    xx xx'
    ],
    [
      '     xxxxx     ',
      '   xx  x  xx   ',
      '  xx x x x xx  ',
      '  x x xxx x x  ',
      ' xxxxxxxxxxxxx ',
      ' x xx     x  x ',
      ' xxx xx xx xxx ',
      ' x x   x   x x ',
      ' xxxx     xxxx ',
      ' x   x   x   x ',
      ' xxxxxx xxxxxx ',
      ' x    x x    x ',
      ' xxxxxx xxxxxx ',
      ' x    x x    x ',
      ' xxxxxxxxxxxxx '
    ],
    [
      '               ',
      '               ',
      '               ',
      '   xxxxxxxx    ',
      '   x  x   x    ',
      '   xxxxxxxx    ',
      '   x      xx   ',
      '  xx    x  xx  ',
      '  x     x   x  ',
      ' xx     xx  xx ',
      ' x       x   x ',
      'xx   x   xx  xx',
      'x   xxx   x   x',
      'x   xxx   x   x',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '       x       ',
      '     xx xx     ',
      '   xxxx  xxx   ',
      '  xxxxx   xxx  ',
      ' xxxxxx    xxx ',
      'xxxxxxx     xxx',
      'xxxxxxxxxxxxxxx',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x x     ',
      '        x      '
    ],
    [
      'xxxxxxxxxxxxxxx',
      'x   xxxxxxxxxxx',
      'x  xxx   xxxxxx',
      'xxxxx     xxxxx',
      'xxxxx     xxxxx',
      'xxxxx     x   x',
      'xxxxxx   xxxx x',
      'xxxxxxxxxxxxxxx',
      'x   xxxxxxxx  x',
      'x      xxx    x',
      'x       x     x',
      'x x   x  xx   x',
      'x         xx  x',
      'x   x  x   xx x',
      'xxxxxxxxxxxxxxx'
    ],
    [
      'xxxxxxxxx xxxxx',
      'xxx xxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxx x x xxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxx xxx',
      '  xx xxxxxxxxxx',
      'x xxxxxxxxxxxx ',
      '  xxxxx        ',
      'x       x x x  ',
      '   x x         '
    ],
    [
      '               ',
      '      xxx      ',
      '      x x      ',
      'xxx   xxx      ',
      'x x   xxxxxx   ',
      'xxx   x xx x   ',
      'xxx   xxxxxx   ',
      'x x   xxx      ',
      'xxx   x x      ',
      'xxx   xxx   xxx',
      'x x         x x',
      'xxx         xxx',
      'xxx   xxxxxxxxx',
      'x x   x xx xx x',
      'xxx   xxxxxxxxx'
    ],
    [
      '  xxx xxx      ',
      ' xx x x xx xxx ',
      '  xxx xxx  x xx',
      '  xxx xxx  xxx ',
      ' xxxxxxxxx xxx ',
      ' xxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'x             x',
      'xxxxxxxxxxxxxxx',
      'x             x',
      'xxxxxxxxxxxxxxx',
      ' x          xx ',
      ' xxxxxx   xxxx ',
      '  xxx    xxxx  ',
      '    xxxxxxx    '
    ],
    [
      '  xxx  xxx   xx',
      '  x xx xx  x xx',
      '  x  xxx  xx xx',
      '  x   xx xxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  xx   xxxx  xx',
      '   x   xxxx xxx',
      '   xx  xxx xxxx',
      '    xx xx xxxxx',
      '     xxx xxxxxx',
      '      xx xxxxxx'
    ],
    [
      '    xxxxx xx   ',
      'xxxxx   xxxxxxx',
      'x      xx xxx  ',
      'xxx xxx   xxxxx',
      ' x xxxxx  xxx x',
      '   xx  x  xxxxx',
      '  xxxxxxx x x x',
      ' xxxxxxxxxxx xx',
      'xxxxxxxxxxxxx x',
      'xx x   x  x xxx',
      '   xxxxx  x x x',
      '   xxxxx  x xxx',
      '   xx xx  x  xx',
      '  xxx xxx x   x',
      '  xxx xxx x    '
    ],
    [
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xx           xx',
      'xx   xxx     xx',
      'xx   xxx     xx',
      'xx   xxx     xx',
      'xx       xx  xx',
      'xxx  xxxxxxx xx',
      'xxxxxxxxx  xx x',
      'xx xx xxxx xx x',
      'xx     xxx   xx',
      'xx    xxxxx xxx',
      'xx   xxx xxxxxx',
      'xx  xxx   xx xx',
      'xx xxx       xx'
    ],
    [
      '    xx         ',
      '  xxxxxx       ',
      ' xxxxxxxxxx    ',
      ' xxxxxxxxxxx   ',
      'xxxxxxxxxxxx   ',
      'xxxxxxxxxxxxxx ',
      'xxxxxxxxxxxxx  ',
      ' xxx  xxxxxxx  ',
      '      xxxxxxx  ',
      '     xxxxxxx   ',
      '     xxxxxx  x ',
      '     xxxxxx  x ',
      '      xxxxx  x ',
      '      xxxx     ',
      '       xx      '
    ],
    [
      '     xxxxx     ',
      '   xxxxxxxxx   ',
      '  xxxxxxxxxxx  ',
      '  xx       xx  ',
      ' xx  x   x  xx ',
      ' xx x x xxx xx ',
      ' xx  x   x  xx ',
      ' xx x  x  x xx ',
      'xxx xxxxxxx xxx',
      'xxxx       xxxx',
      'xx xxxxxxxxx xx',
      'xx x x x x x xx',
      ' x x x x x x x ',
      ' xxx x x x xxx ',
      '  xxxxxxxxxxx  '
    ],
    [
      '               ',
      '               ',
      '               ',
      '               ',
      '    xxxxx      ',
      '    x   xx   xx',
      'xxxxxxxxxxxxxxx',
      'x x x x       x',
      'xx  xxx    xxxx',
      ' xxx     xxx xx',
      '   xxxxxxxx    ',
      '         xx    ',
      '               ',
      '               ',
      '               '
    ],
    [
      '               ',
      '            xxx',
      '  xxx     xxxx ',
      ' x   x    xxxxx',
      ' x x x    xxx  ',
      ' x   xx  xxxxx ',
      'xxxxxxxx xxx   ',
      'x  xxxxxxxxxxx ',
      'xx xxxxxxxxx   ',
      ' x xxxxx xxxxx ',
      ' xxx xx   xx   ',
      '     xxx  xxxx ',
      '      xx   xxxx',
      '               ',
      '               '
    ],
    [
      '  xx   xxxx    ',
      ' xxxxxxxxxxxx  ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxx  xxx ',
      '  xxxx     xxx ',
      '     x xx xxxx ',
      '   xx    xx xx ',
      '   x  x  xx xx ',
      '   xxxx xx  xx ',
      '     x  xx  x  ',
      '    xxxxxxxxxx ',
      '    x xxxxxxxx ',
      '    x xxxxxxxx ',
      '    xxxxxxxxxxx',
      '   xxxxxxxxxxxx'
    ],
    [
      '     xxxxx     ',
      '    xxxxxxx    ',
      '   xxx   xxx   ',
      '  xxx     xxx  ',
      ' xxx       xxx ',
      'xxx xxx xxx xxx',
      ' x    x x x  x ',
      ' x  xxx xxx  x ',
      ' x           x ',
      ' x   xxxxx   x ',
      ' x  xxxxxxx  x ',
      ' x  xxxxxxx  x ',
      ' x  xxxxxxx  x ',
      ' x  xxxxxxx  x ',
      ' xxxxxxxxxxxxx '
    ],
    [
      '   xxxxxx      ',
      '  xxxxxxxx     ',
      ' xxxxxxxxxx    ',
      'xxxxxxx x xx  x',
      'x  x  xxxxxx xx',
      'xx xx xx x xxxx',
      'x  x  xxxxxxx x',
      'xxxxxxx  xxxxxx',
      'xx   xx  xxxx x',
      'xx x xxx x  xxx',
      'xx   xxxxx  x x',
      'xxxxxx     xxxx',
      'xx        xx xx',
      ' xx      xx   x',
      '  xxxxxxxx     '
    ],
    [
      '               ',
      '             x ',
      'xxx   xxx      ',
      'x  x x  x      ',
      'x   x   x    x ',
      ' x  x  x       ',
      ' x xxx x       ',
      ' xx x xx     x ',
      '               ',
      '               ',
      '    x        x ',
      '               ',
      '               ',
      '    x  x  x  x ',
      '               '
    ],
    [
      '        xxxxx  ',
      '       xx  xx  ',
      '      xx  xx   ',
      '     xx  xx    ',
      '  xxxx  xx   xx',
      ' xx  x xxxx xxx',
      'xx x xxx  xxx x',
      'x  x x    xxx x',
      'xx   x  xxx xxx',
      ' xxxxxxxxxx  xx',
      '         xx    ',
      '               ',
      '    x    x    x',
      '  xxx  xxx  xxx',
      'xxxxxxxxxxxxxxx'
    ],
    [
      'x  xx  x  xx  x',
      'xx  xx x xx  xx',
      ' xx xxxxxxx xx ',
      '  xxx     xxx  ',
      'x xx       xx x',
      'xxx  x   x  xxx',
      ' xx  x x x  xx ',
      '  x   x     x  ',
      ' xx   xx    xx ',
      'xxx  x   x  xxx',
      'x xx  xxx  xx x',
      '  xxx     xxx  ',
      ' xx xxxxxxx xx ',
      'xx  xx x xx  xx',
      'x  xx  x  xx  x'
    ],
    [
      'xxx xxx        ',
      '  x x          ',
      ' xxxxx         ',
      'xx x xx        ',
      'xxxxxxx        ',
      'xxxxxxx  xxx   ',
      '    xx  xxxxx  ',
      'xxx xxx x x xx ',
      'x xxxxxxx x xxx',
      'x x x  xxxx xx ',
      'xxxxx xxxxxxx  ',
      'x x   x xxxx   ',
      'xxx   x  x     ',
      '      x  xxxx  ',
      '     xx     x  '
    ],
    [
      '  xxxxxx xxxx  ',
      ' xx xx xxxx xx ',
      ' x   x x x   x ',
      ' xx  x x x xxx ',
      '  xxxxxxxxxx   ',
      '    xxxxxxx    ',
      '  xxx     xxx  ',
      ' xxxx    x  xx ',
      'xx  xx  xx   xx',
      'x    xxxx     x',
      'x   xxxxxx    x',
      'x     xx      x',
      'xx  xxxxxx   xx',
      ' xx   xx    xx ',
      '  xxxxxxxxxxx  '
    ],
    [
      '     xxxxxx    ',
      '   xxx   xxx   ',
      'xx x       x xx',
      ' xxxxxxxxxxxxx ',
      'xxxxxxxxxxxxxxx',
      'xx xxx xxx xxxx',
      ' x x     x   xx',
      ' x  x     x  x ',
      ' x           x ',
      ' x  xxxxxxx  x ',
      ' xxxx     xxxx ',
      'xx    x x    xx',
      ' xxx       xxx ',
      '   xxx   xxx   ',
      '     xxxxx     '
    ],
    [
      '               ',
      '      xxx      ',
      '       xxxx    ',
      '        xxxx   ',
      '         xxx   ',
      '        xxxxx  ',
      ' x     xx xxxx ',
      'x     xx  xxxx ',
      'x      xxxxxx x',
      'xx    xx  xxx  ',
      ' xxx      xxxx ',
      '   xxxxxxxxx x ',
      '    xxxxxxx  xx',
      '               ',
      '               '
    ],
    [
      '      xxx xxx  ',
      'x x x   x x    ',
      'x x x  xxxxx   ',
      'xxxxx xx x xx  ',
      '  x   xx x xx  ',
      '  x    xxxxx   ',
      '  x      x     ',
      '  xxxxxxxxxxxx ',
      '  x    xx xx x ',
      '  x    xxxxx x ',
      '  x    xx xxx  ',
      '  x    xxxxx   ',
      '  x    x   x   ',
      '  x  x x   x x ',
      '  x  xxx   xxx '
    ],
    [
      'xxxxx xxxxx    ',
      'x   xxx   x    ',
      'x         x    ',
      'xx x   x xx    ',
      ' x x   x x     ',
      ' x   x   x   x ',
      'xxxx x xxxx xx ',
      'x  xxxxx  x x  ',
      'xxxx   xxxx xx ',
      'x         x  xx',
      'x         x   x',
      'xx       xx   x',
      ' xx     xxxx xx',
      '  x xxx x  xxx ',
      'xxxxx xxxx     '
    ],
    [
      '  x  x x  x    ',
      ' xx  xxx  xxx  ',
      'xxxx xxx xxxxx ',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxx xxxx x x x',
      'xx   xxxx     x',
      'x   x xx x     ',
      'x           x  ',
      '           xxx ',
      '            x  ',
      '  x   xxx   x  ',
      ' xxx  xxx  xxx ',
      '  x   xxx xxxxx',
      '  x x xxxxxxxxx'
    ],
    [
      '   xxxxxxxxxx  ',
      '    xx     xxx ',
      '     xxxxxx  x ',
      '      xx  xx xx',
      '       xxx x  x',
      '         x x  x',
      '   x  xxxx x  x',
      ' xxxxxxxxxxx xx',
      'xx xxx     xxx ',
      'xxxxx xxxx xx  ',
      '  xxxx   x xx  ',
      '   xxxxxxxxxx  ',
      '   xxxxxx xx   ',
      '    x      x   ',
      '   xx     xx   '
    ],
    [
      '     xxxxx     ',
      '    x     x    ',
      '    x     x    ',
      '  xxxxxxxxxxx  ',
      '    x x x x    ',
      ' xxxx     x    ',
      'x x xxxxxxxxx  ',
      '  x xx   xx  x ',
      '  x xxxxxxx   x',
      ' xxxxxxxxx    x',
      ' x x   x      x',
      ' xxxxxxxxxxxxxx',
      '  x    x x    x',
      '  x    xxxxxxxx',
      '  x xxxxxxxxxxx'
    ],
    [
      '               ',
      '  xxxxxxxx     ',
      '  x      x     ',
      '  xxxxxxxx     ',
      '     xx        ',
      '    xxxx       ',
      '   xx  xx      ',
      '    xxxx       ',
      '   xx  xx      ',
      'xxxx    xxxxxx ',
      '             x ',
      'xxxx    xxxx x ',
      '   xx  xx  x x ',
      '    xxxx   x x ',
      '           xxx '
    ],
    [
      '     xxxx      ',
      '     x  x  xxxx',
      '     xxxx      ',
      '     x  x    xx',
      '     xxxxxxx   ',
      '    x xx x xx  ',
      '  xxx x  x  xx ',
      ' xxx x xxxx  xx',
      'xx xxxxx  x   x',
      'x    x x xx  xx',
      'xx   xxxxx  xxx',
      ' xx   xxxxxxx  ',
      '  xx xxx       ',
      '   xxx    xxxxx',
      '    xx         '
    ],
    [
      '      xxx      ',
      '     xxxxx     ',
      '     x x x     ',
      '  xxxxx xxxxx  ',
      '  x   xxx   x  ',
      ' x           x ',
      ' x x       x x ',
      ' x  x     x  x ',
      ' xx xxxxxxx xx ',
      '  xxxxxxxxxxx  ',
      '    xxxxxxx    ',
      '   xxxx xxxx   ',
      '   xxx   xxx   ',
      '  xxx     xxx  ',
      'xxxx       xxxx'
    ],
    [
      ' xxx    xx     ',
      ' x     xx      ',
      ' x x  x xxxxx  ',
      '      x  xx  x ',
      '       x  xx x ',
      '        x xx x ',
      '  xxxxxx xxx x ',
      ' xxxxxxxxxxxx  ',
      ' xxxxxxxxxx    ',
      ' xxxxxxxxxx    ',
      ' x xxxxxxxx    ',
      ' xxxxxxxxxx   x',
      '  xxx xxxx  x x',
      '   xxxxxx   x x',
      '          xxx  '
    ],
    [
      '     xxxxx     ',
      '    x xxx x    ',
      ' xxxx  x  xxxx ',
      ' xxxx  x  xxxx ',
      ' x  xxxxxxx  x ',
      '  xxx     xxx  ',
      '   xxx x xxx   ',
      '    x xxx x    ',
      '    x     x    ',
      '    x     x   x',
      '    xx   xx  xx',
      '   xxxxxxxxx x ',
      '   xxxxxxxxx x ',
      ' xxxx xx  xxxx ',
      ' x  x  xxxx  x '
    ],
    [
      '            xxx',
      '      xxxx  x x',
      '     xxxxxx x x',
      '   xxxxxxxx x x',
      ' x   xx  xx x x',
      'x x  x    x xxx',
      ' xxxxxxxxxxxx x',
      ' x x        xxx',
      ' xxx  xxxx  x x',
      '   xx      xxxx',
      '    xxxxxxxx   ',
      '    x      x   ',
      '     x xxx x   ',
      '     xxx xxx   ',
      '    xxxx xxxx  '
    ],
    [
      '     xxxxx     ',
      '    xx x xx    ',
      '    x     x    ',
      '   xx x x xx   ',
      '   x x   x x   ',
      ' xxxx xxx xxxx ',
      ' xxxx  x  xxxx ',
      ' xx x  x  x xx ',
      '   xxxxxxxxx   ',
      '    x     x   x',
      '    xx   xx  xx',
      '   xxxxxxxxx x ',
      '   xxxxxxxxx x ',
      ' xxxx xx  xxxx ',
      ' x  x  xxxx  x '
    ],
    [
      '  x  xxxxxxxx  ',
      ' x  x       xx ',
      ' x  x xxxxxx x ',
      ' xx xxxxxxxxxx ',
      'xxx x  xxxxx  x',
      'x x xx  xxxxx  ',
      '  x x x  xxx xx',
      '  x x xxxxxx x ',
      ' xx x xxxxxx x ',
      ' x  x xxxxx x  ',
      'xx  x xxxxx x  ',
      'x   x xxxx xx  ',
      ' x  x xxxx  xxx',
      '    xx   xxx   ',
      'x     xx  xxxxx'
    ],
    [
      ' xxx xxxxx xxx ',
      ' x  xx x xx  x ',
      ' x x  xxx  x x ',
      ' x     x     x ',
      'xx  x xxx x  xx',
      'x   x  x  x   x',
      ' xx x     x xx ',
      'x     xxx     x',
      ' xx x  x  x xx ',
      'x    xx xx    x',
      'xxxx x   x xxxx',
      '   x x   x x   ',
      ' xxx  xxx  xxx ',
      'xx xx     xx xx',
      'x   xxxxxxx   x'
    ],
    [
      '     xxxxx     ',
      '   xxx x xxx   ',
      '  x x     x x  ',
      '  x x x x x x  ',
      ' xx xx   xx xx ',
      ' xxxx     xxxx ',
      ' xx  x x x  xx ',
      ' xxxx xxx xxxx ',
      '   xx     xx   ',
      '    x     x   x',
      '    xx   xx  xx',
      '   xxxxxxxxx x ',
      '   xxxxxxxxx x ',
      ' xxxx xx  xxxx ',
      ' x  x  xxxx  x '
    ],
    [
      "         x     ",
      "     xxxxx     ",
      "    xx   xx    ",
      "   xx     xx   ",
      "   x  x x  x   ",
      "   x  x x  x   ",
      "   x       x   ",
      "   xx xxx xx   ",
      "    xx   xx    ",
      "    xxxxxx     ",
      "   xx    xx    ",
      "  xx      x    ",
      "  x     x  x   ",
      "  xx   xx xx   ",
      "   xxxxx xx    "
    ],
    [
      '  xxxx   xxxx  ',
      ' x    x x    x ',
      '   xxx   xxx   ',
      '  xx  x x  xx  ',
      '  x  xx xx  x  ',
      '  x xxx xxx x  ',
      '  x x x x x x  ',
      '  x xxxxxxx x  ',
      '   x       x   ',
      'x x         x x',
      'xxx         xxx',
      'xxx         xxx',
      'xxxx       xxxx',
      ' xxxxxxxxxxxxx ',
      '  xxx xxx xxx  '
    ],
    [
      '     x x x x x x x x',
      '     x x x x x x x x',
      '     x x x x x x x x',
      '     x x x x x x x x',
      '     x x x x x x x x',
      'xxxxxxxxxxxxxxxxxxxx',
      '     x x x x x x x x',
      'xxxxxxx x x x x x xx',
      '     x x x x x x x x',
      'xxxxxxx x x x x x xx',
      '     x x x x x x x x',
      'xxxxxxx x x x x x xx',
      '     x x x x x x x x',
      'xxxxxxx x x x x x xx',
      '     x x x x x x x x',
      'xxxxxxx x x x x x xx',
      '     x x x x x x x x',
      'xxxxxxx x x x x x xx',
      '     x x x x x x x x',
      'xxxxxxxxxxxxxxxxxxxx'
    ],
    [
      '              xxxxxx',
      '              x    x',
      '              x xx x',
      '              x    x',
      '        xxxxx  xxxx ',
      ' xxx   x     x xx x ',
      'xxxxxxxxxxxxxxxxxxxx',
      'xx  xxx x   x      x',
      'xxx xxxxx   xxxxxx x',
      'xxx xxxxxxxxxxxxxx x',
      'xxx xxxx     xxxxx x',
      'xxx xxx  xxx  x xx x',
      'xxx xxx xx  x xxxx x',
      'xxx xxx xx  x x xx x',
      'xxx xxx xxxxx xxxx x',
      'xxx xxx  xxx  xxxx x',
      'xxx xxxx     xxxxx x',
      'xxx xxxxxxxxxxxxxx x',
      'xxxxxxxxxxxxxxxxxxx ',
      '                    '
    ],
    [
      '        xxx         ',
      '       x   x        ',
      '   xxxxxxxxxxxxxx   ',
      '  xx x x x xxxxxxx  ',
      '  xxxxxxxxxxxxxxxx  ',
      '  x xxxxxxxxxxxx x  ',
      '   xx x x xxxxxxx   ',
      '   xx x x x xxxxx   ',
      '   xx x x x xxxxx   ',
      '   xx x x x xxxxx   ',
      '   xx x x x xxxxx   ',
      '   xx x x x xxxxx   ',
      '    x x x x xxxx    ',
      '    x x x x xxxx    ',
      '    x x x x xxxx    ',
      '    x x x x xxxx    ',
      '    x x x x xxxx    ',
      '    x x x xxxxxx    ',
      '    x x x xxxxxx    ',
      '    xxxxxxxxxxxx    '
    ],
    [
      '                    ',
      '  xxx               ',
      ' xxxxx              ',
      'xxxxxx              ',
      '   xxx              ',
      '  xxx               ',
      ' xxx                ',
      ' xxx                ',
      'xxx                 ',
      'xxxx               x',
      'xxxxxxx            x',
      'xxxxxxxxxx        xx',
      'xxxxxxxxxxxxx    xxx',
      'xxxxxxxxxxxxxxxxxxx ',
      ' xxxxxxxxxxxxxxxxx  ',
      '  xx xxxxxxxxx xx   ',
      '  xxx xxxxxxx xx    ',
      '   xxx       xx     ',
      '    xxx       xxx   ',
      '     xxx       xxx  '
    ],
    [
      '  x                 ',
      '  x             x   ',
      '   x            x   ',
      '   x           x    ',
      '  xxxxxxx      x    ',
      '  x x   x xxxxxxx   ',
      '  x  x  x x   x x   ',
      '  xxxxxxx x   x x   ',
      '  xxxx xx xxxxxxx   ',
      '  xxxx xx xxx xxx   ',
      '   xxxxx  xxx xxx   ',
      '   xxxxx   xx xx    ',
      '   xxxxx   x xxx    ',
      '   xxxxx   x xxx    ',
      '    xxx     xxx     ',
      '    xxx     xxx     ',
      '    xxx     xxx     ',
      '     x       x      ',
      '     x       x      ',
      '   xxxxx   xxxxx    '
    ],
    [
      '   x            x   ',
      '  xxx          xxx  ',
      ' xx  x        xx  x ',
      'xxxxxxx      xxxxxxx',
      ' x            x     ',
      ' xxxxx   xx   xxxxx ',
      ' xx x   xx x  xx x  ',
      ' xx xx xx   x xx xx ',
      ' xxxx xxxxxxxxxxxx  ',
      ' xxxxxx       xxxxx ',
      ' x    xxxxxxxxx     ',
      ' xxxxxx  xx   xxxxx ',
      ' x    xxxxxxxxx     ',
      ' xxxxxx xxxx  xxxxx ',
      ' x    xxxxxxxxx     ',
      ' xxxxxx xxxx  xxxxx ',
      'xx    xxxxxxxxx    x',
      'xxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxx',
      '                    '
    ],
    [
      '       x   x        ',
      '       xx xx        ',
      '       xxxxx        ',
      '      xxxxxx        ',
      '     xxx xxxx       ',
      '    xxxxxxxxx       ',
      '     xxxxxxxx       ',
      '         xxxxx      ',
      '         xxxxxx     ',
      '        xxxxxxxx    ',
      '        xxxxxxxxx   ',
      ' x      xxxxxxxxxx  ',
      'xxx    xxxxxxxxxxx  ',
      'xxxx   xxxxxxxxxxxx ',
      'xxxxxx xxxxxxxxx xxx',
      'xxxxxxx x xxxxx xxxx',
      ' xxxxxx x xxxxx xxxx',
      '  xxxx xx xxxxxx xxx',
      '      xx  xxxxx xxxx',
      '     xx xxxxxx xxxx '
    ],
    [
      '          x         ',
      '          x         ',
      '         xxx        ',
      '        xxxxx       ',
      '       xxxxxxx      ',
      '       xxxxxxx      ',
      '      xxxxxxxxx     ',
      '                    ',
      '      xxxxxxxxx     ',
      '      xxxxxxxxx     ',
      '     xxxxxxxxxxx    ',
      '     x x x x x x    ',
      '    xxxxxxxxxxxxx   ',
      'xxxxxxxxx   xxxxxxxx',
      'xxxxxxx   x   xxxxxx',
      '  x  x  x x x  x  x ',
      '  x  xx x x x xx  x ',
      '  x  xx x x x xx  x ',
      'xxxxxxx x x x xxxxxx',
      'xxxxxxx x x x xxxxxx'
    ],
    [
      '     xxx     xxx    ',
      '     xx       xx    ',
      '      xxxxxxxxx     ',
      '     x x x x x x    ',
      '    x x x x x   x   ',
      '   xxxxxxxxxxxxxxx  ',
      '     x x  x x  x    ',
      '     x x  x x  x    ',
      '     xxxxxxxxxxx    ',
      '    x x x x x x x   ',
      '   x x x x x x x x  ',
      '  x x x x x x     x ',
      ' xxxxxxxxxxxxxxxxxx ',
      '   x        x    x  ',
      '   x x x x  x xx x  ',
      '   x        x    x  ',
      '  xxxxxxxxxxxxxxxxx ',
      ' xx  x  x  xxx  xxxx',
      'xx  x  x  xxxxxx  xx',
      'xxxxxxxxxxxxxxxxxxxx'
    ],
    [
      '      x x  x x      ',
      '     x x xx x x     ',
      '      x xxxx x      ',
      '     x x xx x x     ',
      '      x x  x x      ',
      ' xxxxx   xx   xxxxx ',
      ' x   x   xx   x   x ',
      ' x xxxx  xx  xxxx x ',
      ' x x  x  xx  x  x x ',
      ' xxx xxx xx xxx xxx ',
      '   xxx x xx x xxx   ',
      '     xxxxxxxxxx     ',
      '       xxxxxx       ',
      '     xxxxxxxxxx     ',
      '   xxx x xx x xxx   ',
      ' xxx xxx    xxx xxx ',
      ' x x  x      x  x x ',
      ' x xxxx      xxxx x ',
      ' x   x        x   x ',
      ' xxxxx        xxxxx '
    ],
    [
      '                    ',
      '   xxx        xxx   ',
      '  xxxxx      xxxxx  ',
      '  xxx   xxxx   xxx  ',
      '  xx xxxxxxxxxx xx  ',
      '   x xx   x  xx x   ',
      '    xx   x    xx    ',
      '    x    x     x    ',
      '   xx    x     xx   ',
      '   xx    xx    xx   ',
      '   xxx   xxxx xxx   ',
      '   xx          xx   ',
      '    xx         x    ',
      '    xx        xx    ',
      '     xx  x   xx     ',
      '      xxxxxxxx      ',
      '   xxxxxxxxxxxxxx   ',
      '  xx  xx xx xx  xx  ',
      '  xxxxx      xxxxx  ',
      '                    '
    ],
    [
      ' x                  ',
      ' x                  ',
      'xxx       x         ',
      'x x      xxx        ',
      'x x     x   x    xx ',
      ' x      xxxxx   xxxx',
      'xxxx   xxxxxxx xx  x',
      ' xxxx  xxxxx x x   x',
      '  xxxx xxxxxx xx   x',
      '   xxxxxxxxxx x   xx',
      '   xxxxxxxxxx x  xx ',
      '    xxxxxxxxx x  x  ',
      '    xxxxxxxx xx xx  ',
      '     xxxxx xxxxxx   ',
      '       xxxxxxx      ',
      '        xxxxx       ',
      '         xxx        ',
      '         xxx        ',
      '        xxxxx       ',
      '     xxxxxxxxxxx    '
    ],
    [
      'xxxxxxxxxxxxxxxxxxxx',
      'x                  x',
      'x                  x',
      'x                  x',
      'x     xxxxxxxx     x',
      'x     x      x     x',
      'x     x      x     x',
      'x     x      x     x',
      'x     x      x     x',
      'x     x      x     x',
      'x     xxxxxxxx     x',
      'x        xx        x',
      'x       xxxx       x',
      'x      x    x      x',
      'xxxxxxx xxxx xxxxxxx',
      '    xx x x xx xx    ',
      '    xx  x x   xx    ',
      '   xxx   x x  xxx   ',
      '   xx   x x    xx   ',
      '   xx    x     xx   '
    ],
    [
      '                xxxx',
      '                  x ',
      '             xxx x  ',
      '            xxxxxx  ',
      '             xxxxx  ',
      '            xxxxxxx ',
      '           xxxxxx x ',
      '          xx xxxx   ',
      '        xxx xxxxx   ',
      '      xxxx xxxxx    ',
      '   xxxxx  xxxxxx    ',
      '  xxxx   xxxxxxx    ',
      ' xx  x  xxxxxxxx    ',
      ' xx  xxxxxxxxxxx    ',
      ' xxxxxxxxxxxxxx     ',
      ' xxxxxxxxxxxxxx     ',
      ' xxxxxxxxxxxxx      ',
      '  xxxxxxxxxxx       ',
      '    xxxxxxx         ',
      '                    '
    ],
    [
      '                    ',
      '    xxx   xxxx      ',
      '   xxxxx xxxxxx     ',
      '  xx  xxxxx xxxx    ',
      '  x  xxxxxxxx xx    ',
      '    xxxxxxxxxx xx   ',
      '   xxxxxx  xxx  x   ',
      '   xx  xxxx xxx     ',
      '   x  xx xx  xx     ',
      '   x  xx  xx  x     ',
      '      xx  xx        ',
      '     xx             ',
      '     xx             ',
      '     xx             ',
      '     xx             ',
      '     xx             ',
      '     xxxxxxx        ',
      '   xxxxxxxxxxxxxx   ',
      '  xxxxxxxxxxxxxxxx  ',
      '      xxxxxxxxx     '
    ],
    [
      '        xx          ',
      '       xxxx         ',
      '       xxxx         ',
      '        xx          ',
      '      xxxxxxxxxxxxxx',
      '    xxxxxxxxxxxxxxxx',
      'xxxxxx xxxxxx       ',
      'xxxx   xxxxxxx      ',
      '        xxxxxxx     ',
      '         xxxxxxx    ',
      '          xxxxxxx   ',
      '                    ',
      '           xxx  xxx ',
      '            xxx  xxx',
      '             xxx  xx',
      '              xxx x ',
      '         xx    xxx  ',
      '        xxxx    xxx ',
      '        xxxx     xxx',
      '         xx       xx'
    ],
    [
      ' xx  xxxxxxxxxx  xx ',
      ' x x  xxxxxxxx  x x ',
      'xx xxxxxxxxxxxxxx xx',
      'x      xxxxxx      x',
      'x    xx xxxx xx    x',
      'x    x        x    x',
      'x   xx        xx   x',
      'x   x    xx    x   x',
      'x   x    xx    x   x',
      'x   x   xxxx   x   x',
      'x   x   xxxx   x   x',
      'x   x  xx  xx  x   x',
      'x   x  x    x  x   x',
      'x   x  xx  xx  x   x',
      'xx  xx  x  x  xx  xx',
      ' xx  x   xx   x  xx ',
      '  xx xxx    xxx xx  ',
      '   xx  xxxxxx  xx   ',
      '    xxxxxxxxxxxx    ',
      '     xxxxxxxxxx     '
    ],
    [
      '                    ',
      '                    ',
      '       xxxxxxxxxx   ',
      '      xxxxxxxxxxxx  ',
      '      xx       xxxx ',
      '          xx    xxx ',
      '          xx     xx ',
      'xxx    xxxxxxxx  xx ',
      'x  x  xxxxxxxxxx xx ',
      'x  xxxxxxxxxxxxxxxx ',
      ' x   x          xxx ',
      ' xx x         xx xx ',
      '  xxx          x x  ',
      '   x           xx x ',
      '   x          xxx x ',
      '   x              x ',
      '   xxxxxxxxxxxxxxxx ',
      '   xxxxxxxxxxxxxxxx ',
      '                    ',
      '                    '
    ],
    [
      '                    ',
      '        x x         ',
      '     x x x x x      ',
      '    x x x x x x     ',
      '   x x x x x x x    ',
      '  x x x x x x x x   ',
      '   x x x x x x x    ',
      '  x x x x x x x x   ',
      '   x x x x x x x    ',
      '    x x xxx x x     ',
      '         x          ',
      '  xxxxx  x          ',
      ' xxxxxxx x  xxxxx   ',
      'xxxxxxxxxx xxxxxxx  ',
      ' xxxxxxx xxxxxxxxxx ',
      '  xxxxx  x xxxxxxx  ',
      '         x  xxxxx   ',
      '         x          ',
      '    xxxx xxxxxx     ',
      '   xxxxxxx xxxxxx   '
    ],
    [
      'xxxxxxxxxxxx        ',
      '  xx xxx  xxxx      ',
      '   xx xxx  xxxx     ',
      '    x  xxx  xxxx    ',
      '    xx xxx   xxxx   ',
      '     x xxx   xxxx   ',
      '     x xxx   xxxxx  ',
      '     x xxx xx x  x  ',
      '     x xxx x xx xx  ',
      'x    x xxx x  x  xx ',
      'xx  xx xxx x   xx xx',
      'xx xx  xx  x xxx  xx',
      'xxxx  xxx   xxxx xx ',
      'xxxx  xxx     xx x  ',
      'xx xxxxxx     xxxx  ',
      'x    xxxx    xxxx   ',
      '      xxxx  xxxxx   ',
      '      xxxxxxxxxx    ',
      '       xxxx  xxx    ',
      '     xxxx   xxx     '
    ],
    [
      ' xx  x  x  x  x  x  ',
      '  xxxxxxxxxxxxxxx x ',
      '  xxxxxxxxxxxxxxxxxx',
      '  xx           xxxxx',
      '  xx xxx   xxx  x x ',
      ' x xxxx x xxx x x x ',
      ' x xxxx x xxx x x x ',
      ' x x xxxx  xxx  x x ',
      ' xxx   xx       x x ',
      '  xx   x        x x ',
      '  xx   x        x x ',
      ' x x   xxx      x x ',
      ' x xx xxxxx  x   x x',
      'xx xxxx   xxxx   x x',
      'x  x             x x',
      'x x    xxx       x x',
      'xxx x x    x x x x x',
      'xx  x x xx x x  xx x',
      'xxxx x x xx x x x x ',
      'xxxxxxxx  xxxxxxx x '
    ],
    [
      '             xxxxx  ',
      '            x     x ',
      '            x     x ',
      '         xxxx xxxxx ',
      '      xxxx  x xxxxx ',
      '     xx     x     x ',
      '     xxxxxxx x    xx',
      '    xxx   xx  xxxxxx',
      '    xxxxxxxx       x',
      '    xxxxx   xxx  x x',
      '   xxxx x   xxx x  x',
      '  xxxx xx   xxx x  x',
      'xxxxx xxxxxxxx xx  x',
      'xxxx x xxx x x x   x',
      ' xx xxx x x  x xxxxx',
      ' xxxxxxx xx  xxxxx  ',
      '  xxxxx xxxxxxxxx   ',
      ' xxxxx xxxxxxxxxx   ',
      ' xxxxxxxxx  xxxxx   ',
      ' xxx xxx     xxxx   '
    ],
    [
      'x                  x',
      'xx                xx',
      'xxx              xxx',
      'xxxx            xxxx',
      'xxxxx          xxxxx',
      'xxxxx          xxxxx',
      ' xxxx xxx     xxxxx ',
      ' xxxxx  xx  xxxxxxx ',
      '  xxx x  x  xxxxxx  ',
      '  xx     xx  xxxxx  ',
      '   x xx   xxxxxxx   ',
      '   xxxx xxxxxxxxx   ',
      '    xxxxxxxxxxxx    ',
      '     xxxxxxxxxx     ',
      '      xxxxxxxx      ',
      '        xxxxxxx     ',
      '        xxx   xxxx  ',
      '       xxxxx     x  ',
      '     xxx x xxxx xx  ',
      '      x xx    xxx   '
    ],
    [
      'xxxxxx              ',
      'xxxx       xxxxx    ',
      'xxxx      xx xxxx   ',
      'xx        x x xxx   ',
      'x   xxxxxx  x  xx   ',
      'xx    xxxx      x   ',
      'xxxx    xxx  xxxx   ',
      'xxxx      x xx  xx  ',
      'xxxx     xx xx   xx ',
      'xxxx    xx  xx    x ',
      'xxxx    x   xxx xxx ',
      'xxxx    x    xxxx x ',
      'xxxx    x    xx   x ',
      'xxxx    x    xxxxxx ',
      'xxxxxx xx    xxx  x ',
      'xxxx xxxxx   x xxxx ',
      'xxxxxxxx xxx x  xxx ',
      'xxxxx x   xxxx xx x ',
      'xxxxxxx      xxx    ',
      'xxxxxxxx     xx     '
    ],
    [
      '      x             ',
      'xxxxxxxxxxxxx       ',
      '      x             ',
      '   xxxxxxx          ',
      '  xxxxxxxxx      xxx',
      ' xxx    xxxx    xx x',
      ' xx     x xxxxxxxx x',
      'xx     xx  xx    xxx',
      'xx     x   xxxxxxx  ',
      'xx    xxxxxxxxxx    ',
      'xxx   xx   xxxx     ',
      'xxxxxxx    xx       ',
      'xxx  xx   xx        ',
      ' xxxxx   xxx        ',
      '  xxxxxxxxx         ',
      '   xxxxxxx          ',
      'xx  xx  xx          ',
      'xxxxxxxxxxxxx       ',
      ' xxxxxxxxxxx        ',
      '                    '
    ],
    [
      '  xxx   xxxx   xxx  ',
      ' xxxxx xxxxxx xxxxx ',
      'xx  xxxxx  xxxxx  xx',
      'xxx  xxx    xxx  xxx',
      'x xx            xx x',
      '   xx          xx   ',
      '    x          x    ',
      '   xxx        xxx   ',
      '  xxxxxxxxxxxxxxxx  ',
      ' xxxxxxxxxxxxxxxxxx ',
      'xx xxxxxxxxxx   xxxx',
      'xx  xx           xxx',
      'xx xxx x      xxxxxx',
      'x   xxx     x    xxx',
      'xxx  xxx   xx    xxx',
      'xx x  xxxxxxx xxxxxx',
      ' xxxx x xxxxx    xx ',
      '  xx   xxxxxxx   x  ',
      '   xxx  xxxxxxxxx   ',
      '    xxxxxxxxxxxx    '
    ],
    [
      '          xx        ',
      '       xxxxxxxxxxx  ',
      '      x          x  ',
      '     xx        xx   ',
      '    xx   x     x    ',
      '    x  xxxxx  xx    ',
      '    x  x   x  x     ',
      '    x   xxx   x     ',
      '    x    x    x     ',
      '    x   xxx   x     ',
      ' xx xx   x x  xx    ',
      'xx  xx xxxxx  xx    ',
      'xx   x         x xx ',
      'xxx   xxxxxxxxx   xx',
      'xxxxxx   xx    xxxxx',
      ' xxxxxxxxxxxxxxxxxx ',
      '  xxxxxxxxxxxxxxxxx ',
      '    xxxxxxxxxxxxxx  ',
      '      xxxxxxxxxx    ',
      '                    '
    ],
    [
      '        xxxx        ',
      '       xxxxxx       ',
      '       xxxxxxx      ',
      '      xxxxxxxxxxx   ',
      '      xxxxxxxxxxxx  ',
      '     xxxxxxxxxxxxx  ',
      '     xxxxxxxxxxx    ',
      '   xxx       xx     ',
      '   x xx       xxxx  ',
      ' xxxx xx         xx ',
      ' xx xx xx    xxxxxx ',
      '  xx xx xxxxxxxxxx  ',
      '  xxx xxxxxxxx   x  ',
      '  x xx xxxxxx    x  ',
      '  x  xxxxxx      x  ',
      '  x   x          x  ',
      '  x   x             ',
      '      x             ',
      '      x             ',
      '      x             '
    ],
    [
      '                    ',
      '    xxxx            ',
      '   xx  x            ',
      '   x   x            ',
      '  xxx  x            ',
      '  xxx  xx           ',
      '  xxx   x           ',
      ' x x x  x   xxx     ',
      '   x    x  xx xxxx  ',
      '        x  x  xx    ',
      '        x  x  x x   ',
      '        x xx  x     ',
      '  xxx   x x         ',
      '    xx  x x         ',
      '     xx x x         ',
      '      xxx x xxx     ',
      '       xx xx        ',
      '  xxxxxxxxxxxxxxx   ',
      '     xxxxxxxxx      ',
      '       xxxxx        '
    ],
    [
      '       xxxxxx       ',
      '      xxx  xxx      ',
      '     xxx    xxx     ',
      '    xxxx    xxxx    ',
      '   xx xxx  xxxxxx   ',
      '  x   xxx  xxx   x  ',
      '  x   xxx  xxx   x  ',
      '  x    xx  xx x  x  ',
      '  x    xx  xxxx  x  ',
      '  x  x xx  xx x  x  ',
      '  x  x xx  xx x  x  ',
      '  x   xxx  xx x  x  ',
      '  xx   xx  xx x  x  ',
      '   xx  xx  xx x xx  ',
      '    xx xx  xx x xx  ',
      '     xx x  x xx  x  ',
      '     x  x  x  xxxx  ',
      '     x  x  x  x     ',
      '     x  xxxx  x     ',
      '     xxxx  xxxx     '
    ],
    [
      '        xxxx        ',
      '   xxx xx  xx xxx   ',
      '  xx xxx    xxx xx  ',
      '  xx  xx    xx  xx  ',
      '   x   xx  xx   x   ',
      '   xx   xxxx   xx   ',
      '    x    x     x    ',
      '    x    xx    x    ',
      '   xx     xx   xx   ',
      '  xx       x    xx  ',
      '  x       xx     x  ',
      '  x      xx      x  ',
      'x x      x       x x',
      'x xx     xx     xx x',
      'xx xx     xx   xx xx',
      'xxx xxx    x xxx xxx',
      'xxxx  xxx  xxx  xxxx',
      'xxxxxx  xxxx  xxxxxx',
      ' xxxxxx x  x xxxxxx ',
      '   xxxx x  x xxxx   '
    ],
    [
      '                    ',
      '      xx            ',
      '     xxxx           ',
      '    xx  xx          ',
      '    x   xxxxxxxxxxx ',
      'x  xx   x  x   x  x ',
      'xx x  x xx x   x xx ',
      ' xxx xx  xxxxxxxxx  ',
      '  x  x   xx     xx  ',
      'x x xx   x    x  x  ',
      'x   x   xx    xx xx ',
      'xx      x      xx x ',
      ' x   xxxxx     xx xx',
      ' xx xx x xx     xx x',
      '  x x  x  x        x',
      '    xxxxxxxxxxxxxxxx',
      '    x  x  x       x ',
      'xxxxxx x xx    xx x ',
      ' x x xxxxx     xx x ',
      'x x x x xxxxxxxxxxx '
    ],
    [
      '                    ',
      '                    ',
      '    xx xxxxxxxx x   ',
      '   xxxxxxxxxxx xxx  ',
      '   xxxxxxxxxx xxxxx ',
      '    xx xxxxx xxxxxx ',
      '       xxx  xxxxxxx ',
      '        xx xxx xxx  ',
      '      xxx xxx xxx   ',
      '     xxx xxx xxx    ',
      '   xxxx   xxxxxxx   ',
      '  xx  xx   xxx  xx  ',
      ' xx    xx xxxxx  xx ',
      'xx      xxxx xx   xx',
      'x        xx        x',
      'x        xx        x',
      'xx      xxxx      xx',
      ' xx    xx  xx    xx ',
      '  xx  xx    xx  xx  ',
      '   xxxx      xxxx   '
    ],
    [
      ' x        xxxx      ',
      ' x       xxxxx      ',
      ' x       xxxxx      ',
      ' xx       xxxxx     ',
      '  x    xxxxx   x    ',
      '  x     xxx  xxx    ',
      '  x    xx   xx x    ',
      '  xx  xx  xxx  x    ',
      '   x xx xxxxx x     ',
      '   xxx x  xxxxx     ',
      '   xxxx    xxxx     ',
      '   xx   xxxxxxx     ',
      '    x xxxx xxxx     ',
      '     xxxx xxxxxxx   ',
      '    xxxxx xxxxxxxxx ',
      '   xxxxxx  xxxxxxx x',
      '  xxxxxxxx xxxxxxx x',
      ' xxxxxxxxxx xxxxxx x',
      'x   xxxxxx   xxxxxx ',
      ' xxx          xxxx  '
    ],
    [
      '       xxxx  x      ',
      '      xxxxxxxx      ',
      '      x   xxx       ',
      '      x    xxxxxx   ',
      '     xx   xx    xxx ',
      '   xxx xxxx   x   xx',
      'xxxx        xxxx   x',
      'x    xxx   x     xxx',
      'xxxxxx x   xxxxxxx  ',
      '       xx     x     ',
      '        x     x     ',
      '      xxxxxxxxxxx   ',
      '    xxx xxxxxxx xxx ',
      '   xx  xxxxxxxx   xx',
      '   xx  xxxxxxxxxx xx',
      '    xx xxxxxxxx x x ',
      '     xxxxxxxxxx x x ',
      '      x xxxxxx  xx  ',
      '     xx x       xxxx',
      'xxxxxxxxxxxxxxxxxxxx'
    ],
    [
      'xxxxxxxxx           ',
      'x xxxxx x           ',
      'x   x   x           ',
      'x   x   x           ',
      'x  xxx  x           ',
      'x   x   x           ',
      'x xxxxx x           ',
      'xx     xx           ',
      ' xx   xx            ',
      '  xxxxx             ',
      '                    ',
      '   xxx       xxx    ',
      '  xx xx     xx xx   ',
      ' xx x xx   xx x xx  ',
      ' x  x  x   x  x  x  ',
      ' x  xx x   x  xx x  ',
      ' x x   x   x x   x  ',
      ' x xxx x   x xxx x  ',
      ' x     x   x     x  ',
      ' xxxxxxx   xxxxxxx  '
    ],
    [
      '                    ',
      '   xxxxxx  xxxxxxxx ',
      '   xx   xxxx    xxx ',
      '    xx          xx  ',
      '     xxx   xxx  x   ',
      '    x   x x   x x   ',
      '    x x x x x x x   ',
      '    x   x x   x xx  ',
      '    xxxxxxxxxx  xx  ',
      '    x  x  x    xxxx ',
      '   xxxxx xxxxxxxxxx ',
      '   xx xxxxxxx x xxx ',
      '   xxx x x x x x xx ',
      '   xx x x x x x xxx ',
      '   xxx x x x x x xx ',
      '   xx x x x x x xxx ',
      '   xxx x x x x xxxx ',
      '   xxxx x x x x xxx ',
      '    xxxxxxxxxxxxx x ',
      '     xxxxxxxxxxx  x '
    ],
    [
      '    xxxxxxx         ',
      '    x  x  x         ',
      '   xx xx xx         ',
      '  xxx xx xx       xx',
      ' xxxx  x  x      xxx',
      ' xxxxxxxxxxx    xxx ',
      'xxxxxxxxxxxxx   xx  ',
      'xxxxxxx   x     xxx ',
      'xxxxxxxx   x    xxxx',
      'xxxx  xxxxxx     xxx',
      'xxxx        xxxxx xx',
      'xxxxx     xxxx  xx x',
      'xxxxxx   xxxxxxx xx ',
      'xxxxxxx xxxxxxxxx xx',
      ' xxxxxxxxxxxxxxxxxxx',
      ' xxxxxx xxxxxxxxxxxx',
      '  xxxxxx xxxxxxxxxxx',
      '   xxxxx xxxxxxxxxxx',
      '   xxxxxxxxxxxxxxxxx',
      '    xxxxxxxxxxxxxxxx'
    ],
    [
      '                    ',
      '                    ',
      'xxxxxxxxxxxxxxxx    ',
      'x             x xx  ',
      'x xxxxxxxxxxx x   xx',
      'x x  xxxxxxxx x    x',
      'x x xxxxxxxxx xxxx x',
      'x xxxxxxxxxxx x xx x',
      'x x xxxxxxxxx x xx x',
      'x x xxxxxxxxx x xx x',
      'x x xxxxxxxxx x xx x',
      'x x   xxxxxxx x xx x',
      'x xxxxxxxxxxx xxxx x',
      'x             x    x',
      'xx      xxxx xx  xxx',
      'xxxxxxxxxxxxxxxxxx x',
      ' x           x     x',
      ' x           x   xx ',
      ' xxxxxxxxxxxxxxxx   ',
      '                    '
    ],
    [
      '    xxx             ',
      '   xxxxx            ',
      '  xxxxxx xx         ',
      '  xxxxxxxx          ',
      '  xxxxxxx           ',
      'xxxxxxxxx           ',
      '   xxxxxxx          ',
      '   xxxxxxx          ',
      '  xxxxxxx           ',
      ' xxxxxxxxxx         ',
      ' xxxxxxxx xx   xxx  ',
      ' xxxxxxx   xx xxxx  ',
      'xxxxxxxxx   xxxxx   ',
      'xxxxxxxxxx   xxxx   ',
      'xxxxxxxxxx    x x   ',
      'xxxxxxxxxxx   xxx   ',
      'xxxxxxxxxxx    xx   ',
      'xxxxxxxxxxxx  xxx   ',
      ' xxxxxxxxxxx xxxx   ',
      ' xxxxxxxxxxxxxxx    '
    ],
    [
      '     xxx            ',
      '    xxxxx           ',
      '    xx              ',
      '    x               ',
      '    x               ',
      '    x               ',
      '    xx   xxxx       ',
      '     x xxxxxxxx     ',
      '     xxxxxxxxxxxxx  ',
      '      xxxxxxxxxx    ',
      '       xxxxxxxx     ',
      '        xxxxxx      ',
      '           xx       ',
      '     xxxxxxxx       ',
      '      x     x       ',
      '            x       ',
      '            x       ',
      '           x        ',
      '           x        ',
      '         xxx        '
    ],
    [
      '    x               ',
      '   xx         xxxxxx',
      '   x           xx x ',
      '   x            xx x',
      ' xxx             xxx',
      ' x    xxxxxxx     xx',
      'xx  xxxxx    xx   xx',
      'x  xxxxxxxxxx  xx xx',
      'x xxxxxxxxxxxxxx xxx',
      'x xx   xxxx   xxxxxx',
      'xxxx x xxxx x xxxxxx',
      'xxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxx',
      ' xx             xxxx',
      ' x xxxxxxxxxxxxx xxx',
      ' xx             xxxx',
      ' xxxxxxxxxxxxxxxxxxx',
      '  xxxxxxxxxxxxxxxxx ',
      '    xxxxxxxxxxxx    ',
      '                    '
    ],
    [
      '        x  x  x     ',
      '       xx xx xx     ',
      '       x  x  x      ',
      '        x  x  x     ',
      '                    ',
      '        xxxxxxx     ',
      '      xxxxxxxxxx    ',
      '     xxxxxxxxxxxx   ',
      '    xxx     xxxxxx  ',
      '    xx xxxxx xxxxxx ',
      ' x  x xxxxxxx xxxxx ',
      'xxx  xxxxxxxx xxxxxx',
      'x  xxxxxxxxxxx xxxxx',
      'x  xxxxxxxxxxx xxxxx',
      'xxx  xxxxxxxxx xxxx ',
      ' x  x  xxxxx  xxxx  ',
      'xxxxxxxxxxxxxxxxxxxx',
      'xx                xx',
      ' xx              xx ',
      '  xxxxxxxxxxxxxxxx  '
    ],
    [
      '  xxxxxx     xxx    ',
      ' xxxxxxxxx     xx   ',
      ' x  xxxxxxxx    xx  ',
      'xxxx xx  xxxxx   xx ',
      'x x  x xx xxxxx   xx',
      'x   xx xx xxxxxx   x',
      'xxx x xxx xxxxxxx  x',
      ' xxxx xxx xxxxxxxx x',
      '      xxx  xxxxxxxxx',
      '     xxx  x xxxxxxxx',
      '  xxxxxx  xx xxxxxxx',
      ' xxxxxx   xxx xxxxx ',
      'xxx      xxxx xxxx  ',
      'xx   xx  xxxxxxxx   ',
      'xx x xx  xxx xxxxx  ',
      ' xxx xx  xxx  xxxxx ',
      '     xx   xx   xxxxx',
      '    xxx   xxx    xxx',
      '   xxxx  xxxx  xxxxx',
      '   xxx  xxxxx xxxxxx'
    ],
    [
      '      xxxxx         ',
      '     xx xxx         ',
      '    xxx xxxx        ',
      ' xxx xxxxxxx        ',
      'xx     xxxxx        ',
      'xx    xxxxxx        ',
      'xxx  xxxxxx         ',
      'xxxxxxxxxx          ',
      '    xxxxxxxxxxx     ',
      '   xxxxxxxxxxxxx    ',
      '   xxxxxxx   xxxxx  ',
      '   xxxxxxxxx xxxxx  ',
      '   xxxxxxxxx xxxxx  ',
      '   xxxxxxxx xxxxx   ',
      '    xxxxxxxxxxxx    ',
      '    xxxxxxxxxxxx    ',
      '     xxxxxxxxxx     ',
      '       xxxxxxx      ',
      '           x        ',
      '        xxxxx       '
    ],
    [
      '                    ',
      ' x xxxxx            ',
      ' xx     x           ',
      ' xxxxxxxxx          ',
      ' x       xxxxxx     ',
      ' x      xxxxxxxx    ',
      ' xx     x     xxx   ',
      ' xx    xx x x xxxx  ',
      '  x    x  x x  xxxx ',
      '  x    x       x xx ',
      '  x    x       x xxx',
      '  x    xx x x xx  xx',
      '  xxxx  x x x x    x',
      '  xxxxxxxxxxxxx     ',
      '  xx xxxxxxxxxxx    ',
      '   x   xxxxxxxxxx   ',
      '   x   xxxxxxxxxxx  ',
      '   x  xxxxxxxxxxxx  ',
      '   xx xxxxxxxxxxxxx ',
      '    x xxxxxxxxxxxxxx'
    ],
    [
      'x xxx x xxxxxx  x x ',
      'x xxxxxxx    xxxx x ',
      'xxxxxxx        xx xx',
      '   xxxx xx xxx xxxxx',
      'xxx  x xxx x x xxxxx',
      '  xxxx x x xxx  xxxx',
      '     x xxx  xx  x xx',
      '     xx xx   x xxx  ',
      '      x  x     x xxx',
      '      xxx  xx xx x  ',
      '      x xx xx x  x  ',
      '      x  x xx x xx  ',
      '      xx xx x x x   ',
      'x      x  x x x x   ',
      'xx     xx x x x x   ',
      'xx      x x   x x   ',
      'xx      x xx xx x   ',
      'xx      xxxxxxxxx   ',
      'xx      x xxxxx x   ',
      'xx      x xxxxx x   '
    ],
    [
      '                    ',
      '       x  x  x      ',
      '      x  x  x       ',
      '       x  x  x      ',
      '     xx  x  x xx    ',
      '    x  x  x  x  x   ',
      '    xx         xx   ',
      '    x xxxxxxxxx x   ',
      '    x   x   x   x   ',
      '    x  xxxxxxx  x   ',
      '    x   x x x   x   ',
      '    x   xx xx   x   ',
      '    x  xx x xx  x   ',
      '    x xx xxx xx x   ',
      '    xx    x    xx   ',
      '    xx xx x xx xx   ',
      '     x xx x xx x    ',
      '     x         x    ',
      '     x         x    ',
      '      xxxxxxxxx     '
    ],
    [
      '           xx       ',
      '         x xx x     ',
      '         xxxxxx     ',
      '        xx xx xx    ',
      '       xx xxxx xx   ',
      '       xx x  x xx   ',
      '       xx x  x xx   ',
      ' xx   x xx xx xx x  ',
      'xxxx  xxxxxxxxxxxx  ',
      'xxxx   xx xx x xx   ',
      ' xx    xx xx x xx   ',
      'xxxx   x   xx   x   ',
      ' xx    x xx  xx x   ',
      ' xx    x  x  x  x   ',
      ' xx   xx  x  x  xx  ',
      ' xx   xx        xx  ',
      ' xx   xxx      xxx  ',
      ' xx  xxxxx xx xxxxx ',
      ' xx  xxxxxx  xxxxxx ',
      ' xx xxxxxxxxxxxxxxxx'
    ],
    [
      'xxx x           xx  ',
      'xxxx            xxxx',
      'xxxxxx xxx       xx ',
      'xxxxxx xxxx       xx',
      'xxxx x x xxx       x',
      'xxxxxx xxxxx        ',
      'xxxxx   xxxx        ',
      'xxxx      xx        ',
      'xxxxx               ',
      'xxxx         xxx    ',
      'xxxxx      xxx      ',
      'xxxxxxxxxxxxxx      ',
      'xxxx  xxxxxxx       ',
      'xxxxx xxx  xx       ',
      'xx x xxxxxxx        ',
      'xx x                ',
      'xx x                ',
      'xxxxxxx           xx',
      'xxxxxxxx         xx ',
      'xxxxxxxxxxxxxxxxxx  '
    ],
    [
      '                    ',
      '                    ',
      '                    ',
      '   xxxx x x         ',
      '  x  xx x x x       ',
      ' x xx x x x x x    x',
      ' xx  xx x x x x x  x',
      'x xxxxx x x x x x xx',
      'x xxxxx x x x x xxxx',
      'x x  xxxxxxxxxxxxxx ',
      'x xxx xxxxxxxxxxxxx ',
      'xxxx  x x x x x xxxx',
      '   xx x x x x x x xx',
      'xxxx  x x x x x x  x',
      'xx    x x x x x x  x',
      ' xx   x x x x x     ',
      '  xx xx x x x       ',
      '   xxxx x x         ',
      '                    ',
      '                    '
    ],
    [
      '                    ',
      '         xxx        ',
      '       xxx xxx      ',
      '     xxxxx   xx     ',
      '   xxxxx       xx   ',
      ' xxxxxxxxxxxxxxxxxx ',
      '      xx     x      ',
      '     xxxx  xx x     ',
      '     xx  x    x     ',
      '     xx       x     ',
      '      xx xx  x      ',
      '       xx   x       ',
      '      xxxxxxxx      ',
      'xxxx xxxxxxxx x xxxx',
      '     xxxxxxxx x     ',
      '     xxxxx x  x     ',
      '     xxx x x  x     ',
      '     xxx x xx x     ',
      '     xx  x    x     ',
      '      xx x   x      '
    ],
    [
      '                    ',
      '                    ',
      '  xxx          xxx  ',
      ' xxxxxx      xxxxxx ',
      ' xxxxxxxxxxxxxxxxxx ',
      ' xxxxxx      xxxxxx ',
      ' xxxx          xxx  ',
      '  xx  xx    xx  xx  ',
      '  xx xxxx  xxxx xx  ',
      '  x xx xx  xx xx x  ',
      '  x xxxxx  xxxxx x  ',
      '  x  xxx    xxx  x  ',
      '  x      xx      x  ',
      '  xx   x    x   xx  ',
      '   x   xxxxxx   x   ',
      '   xx          xx   ',
      '    xxx      xxx    ',
      '      xxxxxxxx      ',
      '                    ',
      '                    '
    ],
    [
      'xx  x               ',
      'x   x               ',
      'x  xx               ',
      'xx x  xxxxxxxxxxxx  ',
      ' x   xx  x x     xx ',
      'xx  xx     x      x ',
      'x   x             xx',
      'x xxx              x',
      ' x     x           x',
      ' x xx  x   x x     x',
      ' x xx      x x     x',
      ' x xx    x x x x   x',
      ' x xx    x x x x   x',
      ' x xx    x   x x  xx',
      ' x                x ',
      '  xx   x     x   xx ',
      'xxxxxxxx xxxxx xxxxx',
      'xxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxx'
    ],
    [
      '                    ',
      '         xxxxxxx    ',
      '       xxxxxxxxxx   ',
      '     xxxx  x   xxx  ',
      '    xxx   xx x xxx  ',
      '   xx     xx x xxxx ',
      '  xx   xxxxx   xxxx ',
      ' xx  xxxxxxxxxxxxxxx',
      ' x xxxxxxxxxxxxxxxxx',
      ' xxxxxxxxxxxxxxxxxxx',
      ' x        xxxxxx xxx',
      '         xxxxxxx xxx',
      '        xxxxxx x  xx',
      '        xxxxxx xx xx',
      '       xxxxx x  x  x',
      '       xxxxx xx xx x',
      '       xxx x  x  x  ',
      '       xxx xx xx xx ',
      '       xxx  x  x  xx',
      '       xxxx xx xx xx'
    ],
    [
      '      xxxxx         ',
      '    xxxxxxxxx       ',
      '   xxxxxxxxxxx      ',
      '  xx     xxxxxx     ',
      '  x       xxxxx     ',
      '           xxxxx    ',
      '           xxxxx    ',
      '           x   xx   ',
      '           x x xx   ',
      '          xx   xx   ',
      '         xxxxxxxx   ',
      '        xxxxxxxxx   ',
      '           xxx xx   ',
      '              xxx   ',
      '  x        xxxxx    ',
      '  xx      xxxxxx    ',
      '   xx    xxxxxx     ',
      '   xxxxxxxxxxx      ',
      '    xxxxxxxxx       ',
      '      xxxxx         '
    ],
    [
      '                    ',
      '                    ',
      '      xxx xxx       ',
      '     x   x   x      ',
      '     x  xx  xxxxx   ',
      '     x   x   x  xx  ',
      ' xx  x   x   x   xx ',
      ' xxxxxxxx xxx  xx x ',
      '  x             x x ',
      '  x               xx',
      'xxxx        x     xx',
      'xxxxx       x     xx',
      'xxxxxxxxxxxx xxxxxxx',
      'xxxxxxx      x    xx',
      'x     xxxxxxxx     x',
      'x x x xx     x x x x',
      'x x x xx    xx x x x',
      'x x x xxxxxxxx x xxx',
      'xxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxx'
    ],
    [
      '   xxxxxxxx    xx   ',
      '   xxxxxxxxx  xxxx  ',
      '           xx xxxx  ',
      '         xxxxx xx   ',
      '       xxxxxxxx     ',
      '      xxxxxxxxx     ',
      '     xxxxxxxxxxx    ',
      '   xx xxxxxxx xxxxxx',
      '   xxx xxxx    xxxxx',
      '    xxx x           ',
      '     xxx            ',
      '      xxx xxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxx           ',
      '            xx      ',
      '            xx      ',
      '            xx      ',
      '            xx      ',
      '            xx      ',
      '        xxxxxx      '
    ],
    [
      '                    ',
      '    x   xxx         ',
      '    x  xxxxx        ',
      '    x  x  xxx       ',
      '    x  x   xx       ',
      '    x   xxxx        ',
      '   xx xx  xxx  xx   ',
      '   xxxxx xxxxxx x   ',
      '    xxx  x  xxxx    ',
      '      x xxxxx       ',
      '      xxxxxxx       ',
      '      x    xx       ',
      '      xxxx  xx      ',
      '      x x  xxx      ',
      '       x x x  x     ',
      '       x x  x       ',
      '       x  x x       ',
      '       xxxxxx       ',
      '     xxxx xxx       ',
      '    xxxxxxxxxxx     '
    ],
    [
      '   xxxxx     x      ',
      ' xxxxxxxx    xx     ',
      ' x   xxxx     xx    ',
      '  xxxxxxx      xx   ',
      '     xxx        xx  ',
      '    xxxx        xxx ',
      '   xxxx          xxx',
      '   xxxxxx        xxx',
      '   xxxxxx       xxxx',
      ' xxxx  xxxx   xxxxxx',
      ' x xx xxxxxxxxxxxxx ',
      ' xx x  xxxxxxxxxxx  ',
      '    xxxxxxxxxxxxxx  ',
      '     xxxxxxxxxxxx   ',
      '      xxxxxxxxxxx   ',
      '        xxx  xxx    ',
      '         xxx  xxx   ',
      '        xxx  xxx    ',
      '     xxxxx xxxxx    ',
      '     x xx  x xx     '
    ],
    [
      '                    ',
      '                    ',
      '                    ',
      '   xxx xxx          ',
      ' xxxxxxxxxx         ',
      ' xx   x   x         ',
      'xxx xxx xxxx    xxx ',
      'xxx x xxx xx   x x x',
      'x  xxx  xxxxxxxxxxxx',
      'x                  x',
      'x       xxxxxxxxxxx ',
      'x   xxxxx x x x x   ',
      'x    xxx x x x x xx ',
      'x xx   xxxxxxxxxxxx ',
      'x  xx             x ',
      'x   xxxxxxxxxxxxxx  ',
      'x x x x  xx         ',
      'x  xxxxxxxxx        ',
      'x x  x x  xx        ',
      'x  xxxxxxx x        '
    ],
    [
      '    xxx             ',
      '   xx xxx           ',
      '   xxxxx            ',
      '    xx              ',
      '    xx              ',
      '    xx              ',
      '   xx               ',
      '  xxx    xxxxxx     ',
      '  xx   xxxxxxxxxx   ',
      '  xx  xxxxxxxxxxxx  ',
      '   xxxxxxxxxxxxxxxx ',
      '   xxxxxxxxxxxxxxxxx',
      '     xxxxxxxxxxxxx  ',
      '       xxxxxxxx     ',
      '          xxx       ',
      '          x xx      ',
      '         xx xx      ',
      '         xx  x      ',
      '        xx   xx     ',
      '      xxxx  xxx     '
    ],
    [
      '                    ',
      '  xxx          xxx  ',
      ' xxx            xxx ',
      ' xx     xxxx     xx ',
      ' xxx  xxx  xxx  xxx ',
      ' xxxxxx      xxxxxx ',
      '  xxxx  xxxx  xxxx  ',
      '   xxxxx xx xxxxx   ',
      '    x  x xx x  x    ',
      '    xxxxxxxxxxxx    ',
      '   xxxxxxx xxxxxx   ',
      '   xx  x x  x  xx   ',
      '   xx  x x  x  xx   ',
      '    x    x     x    ',
      '    xx   xx   xx    ',
      '    xx x    x xx    ',
      '     xx xxxx xx     ',
      '   xxxxx    xxxxx   ',
      '  xx x xxxxxxxx xx  ',
      ' xxxxxx   xxxxxxxxx '
    ],
    [
      'xxxx     x          ',
      'xxxx    xx          ',
      'xxxx   xx           ',
      'xxxxxxxxxxxx        ',
      'xxx   xxxx          ',
      'xxx  xxxxxxxx       ',
      'xx    xxxx          ',
      'xx   xx xxxx        ',
      'x       xxxx        ',
      '       xxxxx        ',
      '    xxxxxxxx    xx  ',
      '  xxxxxxxxx  x xxxx ',
      'xxxxxxxxxxxxxxxxxxxx',
      '      xxxxxx x xxxx ',
      '       xxx xx   xx  ',
      '        xx  x       ',
      '                   x',
      '                 xxx',
      '              xxxxxx',
      '          xxxxxxxxxx'
    ],
    [
      '           xxxxxxxxx',
      '          xxxxxxxxx ',
      '   x      xxxxxxxxx ',
      '  xx      xxxxxxxx  ',
      ' xxxx    xxxxxxx    ',
      'xxxxxx   xxxxx      ',
      'xxxxxxx  xxxx       ',
      'xx xxxxx xxx    xx  ',
      '    xxxxxxx    xxxx ',
      '     xxxxxxxxxxx xxx',
      '     xxxxxxxxxxxx xx',
      '  xx xxxxxxxxxxxx  x',
      ' xxxxxxxxxxxxxxxx   ',
      ' xx  xxxxxxxxxxxx   ',
      '  xx xxxxxxxxxxx    ',
      '  xx xx    xx xxx   ',
      '     xx   xx   xx   ',
      '    xx    xxxx xxx  ',
      '    xx      xx  xxx ',
      '   xx            xx '
    ],
    [
      '    xx              ',
      '   xxxx   xx x xx   ',
      '   xxxxxxx     xx   ',
      '     xxxxxx xx  x   ',
      '     xxxx   x       ',
      '    xxxxxx x        ',
      '    xxxxxxxx        ',
      '     xxxxxx         ',
      '     xxx x          ',
      '     xx    x        ',
      '      xxxx          ',
      '        xxx         ',
      '        xxxxx       ',
      '        xxxxxx      ',
      '         xxxxx      ',
      '         xxxx       ',
      '         xxx        ',
      '         xx         ',
      '         x          ',
      '          x         '
    ],
    [
      'xxxxx  xxxxxx  xxxxx',
      'xxxx  x      x  xxxx',
      'xxx  xxx xxx  x xxxx',
      'xxx x   x   x x  xxx',
      'xxx x       x xx  xx',
      'xxx x  x x  x xxx xx',
      'xxx x  xxx  x xxx xx',
      'xxx  xxx xxxxxxxx  x',
      'xxx  xxxxxxxxxxxxx x',
      'xx  x   xxx   xxxx x',
      'xx xx   x x   xxxx x',
      'xx x xxx   xxx  xx x',
      'xx x            xx x',
      'x  x            xx  ',
      'x x               x ',
      'x x     x  x      x ',
      'x x     x  x      x ',
      'x x     x  x      x ',
      'x x               x ',
      'x x x           x x '
    ],
    [
      '            xxxx    ',
      '          xxxxxxxx  ',
      '    xxx  xxxxxxxxxx ',
      '   x x x xxxxxxxxxxx',
      '   xxx xxxxxxxxxxxxx',
      '   x    xxxxxxxxxxxx',
      '    xxxxxxxxxxxxxxx ',
      '         x x   x x  ',
      '         x xxxxx x  ',
      ' xxx    x  xxxx  xx ',
      'x x x  xxxxxxxxxxxxx',
      'xxx x  xxxxxxxxxxxxx',
      'x    xxxxxxxxxxxxxxx',
      ' xxx  xxxxxxxxxxxxxx',
      '    xxxxxxxxxxxxxxxx',
      '      xxxxxxxxxxxxxx',
      '       xxxxxxxxxx x ',
      '      x  x xxxx x x ',
      '     x  x      x  x ',
      '     xxxx      xxxx '
    ],
    [
      '                    ',
      '                    ',
      '          xxx       ',
      '        xxxxxxx     ',
      '   x   xxxxxxxxx    ',
      '  x xxx   xxxxxxx   ',
      '  x   x x xxxxxxxx  ',
      '  x x x   xxxxx     ',
      '   xxx xxxxxxxxx    ',
      '      x   xxxxxxx   ',
      '     xxxxxxxxxxxxx  ',
      '    xx    xxxxx     ',
      '    x     xxxxxx    ',
      '    x     xxxxxxx   ',
      '  xx x   xxxxxxxxx  ',
      '  xxxxxxxxxxxxx     ',
      '   xxxxxxxxxxxxx    ',
      '    xxxxxxxxxxxxx   ',
      '      xxxxx         ',
      '                    '
    ],
    [
      '       xx  xx       ',
      '      xx    xx      ',
      '    xxx      xxx    ',
      '   xxx        xxx   ',
      '   xx          xx   ',
      '  xxx          xxx  ',
      ' xxx    xxxx    xxx ',
      ' xxxxx xxxxxx xxxxx ',
      '  xxxxxxxxxxxxxxxx  ',
      '    xxx  xx  xxx    ',
      'xxxxxxx xxx xxxxxxxx',
      ' xxxxxx  xx  xxxxxx ',
      '    xxxxxxxxxxxx    ',
      '    xxxxxxxxxxxx    ',
      '     xxxxxxxxxx     ',
      '      xxxxxxxx      ',
      '       xxxxxx       ',
      '       x xx x       ',
      '       x xx x       ',
      '        xxxx        '
    ],
    [
      'xxxxxxxxxx          ',
      'xxxx   xxxx         ',
      ' xxx      xx        ',
      '  xxx  xx  x        ',
      '   xx xxxx          ',
      '      xxxx          ',
      '       xx     x x   ',
      '              x x   ',
      '     xxx xxxx xx    ',
      '   xxxxx xxxxxxxx   ',
      '  xxxxxxx xxxx  xx  ',
      ' xxxxxxxxxxxxx xxxx ',
      ' xxxxxxxxxxxxx  xxxx',
      ' xxxxxxxxxxxxxxxxxxx',
      ' xxxxxxxxxxxxxxxxxxx',
      '  xxxxxxxxxxxxxxxxx ',
      '   xxxxxxxxxxxxxx   ',
      '     xx      xx     ',
      '     xx      xx     ',
      '     xx      xx     '
    ],
    [
      '    xx   xxx        ',
      '    x x xxxxx       ',
      '   xx x xxxxx xxx   ',
      '   xx   xxxxxx  x   ',
      '          xxxx  x   ',
      '        xxxxxx x    ',
      '  xxx  xxxxxxxx     ',
      '  x x xxxxxx xx     ',
      ' x x  xx xx x x     ',
      '    xxxxx  xxxxx    ',
      '    x  xx x xxx     ',
      '    x     xx        ',
      '    x  xxxxx        ',
      '    xxxxx xx        ',
      '  x   xx  xx        ',
      '  x    xx  xx       ',
      ' xx    xx  xx       ',
      ' xx     x  xx       ',
      '       xx   x       ',
      '           xx       '
    ],
    [
      '                         ',
      '                         ',
      '        xxx xxxx         ',
      '     x  xxxxxxxxx        ',
      '    xx   xxxxxxxxx       ',
      '  xxxxxx   xxxxxxx       ',
      'xxxxxxxxxxxxxxxxx        ',
      'xxxx xxxxxxxxx           ',
      '      xxxxxxxxxxxxxx     ',
      '       xxxxxxxxxxxxxx xxx',
      '       xxxxxxxxxxxxxxx   ',
      '        xxxxxxxxxxxxxx   ',
      '         xxxxx  xxxxxx   ',
      '         xx    xxxxxx    ',
      '          x   xx         ',
      '          x   x    xxx   ',
      '          xxxxxx  x      ',
      '             xxxx x x xx ',
      '            xx     xx x  ',
      'xxxxxxxxxxxxxxxxxxxxxxxxx'
    ],
  ];

  function generateFingerprint (lines) {
    return lines.map(function (line) {
      return parseInt(line.replace(/ /g, '0').replace(/x/g, '1'), 2);
    }).join(',');
  }

  this.getPuzzle = function (id) {
    var puzzleStrings = puzzles[id - 1];
    var puzzleMatrix = _.map(puzzleStrings, function (line) {
      return _.map(line.split(''), function (c) {
        return c === 'x' ? CellStates.x : CellStates.o;
      });
    });
    return puzzleService.makePuzzle(puzzleMatrix, generateFingerprint(puzzleStrings));
  };

  this.getAvailablePuzzles = function () {
    return puzzles.map(function (puzzle, puzzleIndex) {
      return {
        id: puzzleIndex + 1,
        completed: puzzleHistoryService.isCompleted(generateFingerprint(puzzle))
      };
    });
  };
});

'use strict';

angular.module('ngPicrossApp').service('matrixService', function () {
  this.col = function (matrix, colIndex) {
    var col = [];
    for (var i = 0; i < matrix.length; i++) {
      if (matrix[i]) {
        col.push(matrix[i][colIndex]);
      } else {
        col.push(null);
      }
    }
    return col;
  };

  this.row = function (matrix, rowIndex) {
    return matrix[rowIndex];
  };
});

'use strict';

angular.module('ngPicrossApp').service('constantsService', function () {
  this.CellStates = {
    x: 'x',
    o: '',
    b: 'b'
  };

  this.Button = {
    LEFT: 0,
    RIGHT: 2
  };
});
'use strict';

angular.module('ngPicrossApp').directive('rightClick', function ($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var fn = $parse(attrs.rightClick || angular.noop);
      element.bind('contextmenu', function(event) {
        scope.$apply(function() {
          event.preventDefault();
          fn(scope, {$event:event});
        });
      });
    }
  };
});

'use strict';

angular.module('ngPicrossApp').directive('puzzle', function ($location, constantsService, puzzleService, puzzleHistoryService, puzzleSolverService, storageService, timerService) {
  return {
    restrict: 'E',
    templateUrl: 'app/views/directives/puzzle.html',
    scope: {
      puzzle: '=',
      showPuzzleActions: '@',
      solved: '='
    },
    link: function ($scope, $element, $attrs) {
      var CellStates = constantsService.CellStates;
      var Button = constantsService.Button;
      var highlighter;
      var hoveredRowIndex, hoveredColIndex;

      $scope.showClues = false;
      $scope.showTimer = !storageService.getObj('settings').hideTimers;
      $scope.formattedTime = null;

      var puzzleTimer = timerService.createTimer($scope.showTimer);
      var dragHandler = new DragHandler();

      function applyOverlay (cells) {
        discardOverlayValues();
        cells.forEach(function (pair) {
          overlayBoardCell(pair.row, pair.col, dragHandler.value);
        });

        var affectedCells = cells;
        if (dragHandler.prevDragCells) {
          affectedCells = affectedCells.concat(dragHandler.prevDragCells);
        }
        puzzleService.annotateHintsForCellChanges($scope.puzzle, affectedCells);
        dragHandler.prevDragCells = cells;
      }

      function onEveryCell (f) {
        var board = $scope.puzzle.board;
        for (var i = 0; i < board.length; i++) {
          for (var j = 0; j < board[i].length; j++) {
            f(board[i][j]);
          }
        }
      }

      function discardOverlayValues () {
        onEveryCell(function (cell) {
          cell.displayValue = cell.value;
        });
      }

      function commitOverlayValues () {
        onEveryCell(function (cell) {
          cell.value = cell.displayValue;
        });
      }

      function checkAndMarkSolved() {
        $scope.solved = $scope.puzzle.solved();
        if ($scope.solved && $scope.puzzle.fingerprint) {
          puzzleHistoryService.markCompleted($scope.puzzle.fingerprint);
          puzzleTimer.stop();
        }
      }

      function overlayBoardCell (rowIndex, colIndex, desiredValue) {
        $scope.puzzle.board[rowIndex][colIndex].displayValue = desiredValue;
      }

      function disableIfReadonly (handler) {
        if ($attrs.hasOwnProperty('readonly')) {
          return angular.noop;
        }

        return handler;
      }

      $scope.$watch('puzzle', function (newPuzzle) {
        newPuzzle.restoreState();
        checkAndMarkSolved();
        highlighter = new HintHighlighter(newPuzzle);
        puzzleTimer.stop();
        if (!$scope.solved) {
          puzzleTimer.start(function () {
            $scope.formattedTime = puzzleTimer.formattedValue();
          });
        }
      });

      $scope.$on('$destroy', function () {
        puzzleTimer.stop();
      });

      $scope.mouseupBoard = disableIfReadonly(function () {
        dragHandler.reset();
        commitOverlayValues();
        $scope.puzzle.saveState();
        checkAndMarkSolved();
      });

      $scope.mousedownCell = disableIfReadonly(function ($event, rowIndex, colIndex) {
        $event.preventDefault();
        var cellValue = $scope.puzzle.board[rowIndex][colIndex].value;
        var rightClicky = ($event.button === Button.RIGHT) || $event.ctrlKey;
        if (rightClicky) {
          dragHandler.value = (cellValue === CellStates.b) ? CellStates.o : CellStates.b;
        } else {
          dragHandler.value = (cellValue === CellStates.x) ? CellStates.o : CellStates.x;
        }
        dragHandler.setDragStart({rowIndex: rowIndex, colIndex: colIndex});
        $scope.mousemoveCell(rowIndex, colIndex);
      });

      $scope.mousemoveCell = disableIfReadonly(function (rowIndex, colIndex) {
        hoveredRowIndex = rowIndex;
        hoveredColIndex = colIndex;
        var cells = dragHandler.draggedCells(rowIndex, colIndex);
        if (cells && !angular.equals(dragHandler.prevDragCells, cells)) {
          highlighter.invalidateCell(rowIndex, colIndex);
          applyOverlay(cells);
        }
      });

      $scope.classesForHintRow = function (rowIndex) {
        return {
          highlighted: $scope.showClues && highlighter.rowHighlighted(rowIndex),
          'highlighted-line': rowIndex === hoveredRowIndex
        };
      };

      $scope.classesForHintCol = function (colIndex) {
        return {
          highlighted: $scope.showClues && highlighter.colHighlighted(colIndex),
          'highlighted-line': colIndex === hoveredColIndex
        };
      };

      $scope.cellClasses = function (rowIndex, colIndex) {
        var cellValue = $scope.puzzle.board[rowIndex][colIndex].displayValue;
        return {
          on: cellValue === CellStates.x,
          off: cellValue === CellStates.b,
          'highlighted-line': (hoveredRowIndex === rowIndex) || (hoveredColIndex === colIndex)
        };
      };

      $scope.confirmPuzzleReset = function () {
        var answer = window.confirm("Reset this puzzle?");
        if (answer) {
          puzzleTimer.reset();
          onEveryCell(function (cell) {
            cell.displayValue = cell.value = CellStates.o;
          });
        }
      };

      $scope.toggleShowClues = function () {
        $scope.showClues = !$scope.showClues;
      };
    }
  };

  function DragHandler() {
    var dragStart;

    function _draggedCells(startIndex, currentIndex, makeCell) {
      var cellCount = currentIndex - startIndex;
      var sign = Math.min(1, Math.max(-1, cellCount));
      cellCount += sign;
      var cells = [];
      do {
        cellCount -= sign;
        cells.push(makeCell(cellCount));
      } while (cellCount !== 0);
      return cells;
    }

    this.draggedCells = function (rowIndex, colIndex) {
      if (!dragStart) {
        return;
      }

      var startRowIx = dragStart.rowIndex;
      var startColIx = dragStart.colIndex;
      if (rowIndex === startRowIx) {
        return _draggedCells(startColIx, colIndex, function (cellCount) {
          return {row: startRowIx, col: startColIx + cellCount};
        });
      }
      if (colIndex === startColIx) {
        return _draggedCells(startRowIx, rowIndex, function (cellCount) {
          return {row: startRowIx + cellCount, col: startColIx};
        });
      }
    };

    this.setDragStart = function (ds) {
      dragStart = ds;
    };

    this.reset = function () {
      this.value = null;
      this.prevDragCells = null;
      dragStart = null;
    };

    this.reset();
  }

  function HintHighlighter (puzzle) {
    var rowCache = [];
    var colCache = [];
    var solver = puzzleSolverService.createSolverFromPuzzle(puzzle);

    this.invalidateCell = function (rowIndex, colIndex) {
      rowCache[rowIndex] = undefined;
      colCache[colIndex] = undefined;
    };

    this.rowHighlighted = function (rowIndex) {
      if (rowCache[rowIndex] === undefined) {
        rowCache[rowIndex] = solver.hasUnmarkedRequiredCells(puzzle, rowIndex, false);
      }
      return rowCache[rowIndex];
    };

    this.colHighlighted = function (colIndex) {
      if (colCache[colIndex] === undefined) {
        colCache[colIndex] = solver.hasUnmarkedRequiredCells(puzzle, colIndex, true);
      }
      return colCache[colIndex];
    };
  }
});

'use strict';

angular.module('ngPicrossApp').directive('fancyLink', function ($location, $sniffer) {
  return {
    restrict: 'A',
    priority: 101, // Run before href/ng-href
    link: function(scope, element, attr) {
      attr.$observe('fancyLink', function(value) {
        if (!value) {
          attr.$set('href', null);
          return;
        }

        var prefix = $sniffer.history ? '' : '#/';
        attr.$set('href', prefix + value);
      });

      element.on('click', function(event) {
        if (event.which === 1 && !(event.shiftKey || event.altKey || event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          scope.$apply(function () {
            var normalizedUrl = attr.href;
            if (!$sniffer.history) {
              normalizedUrl = normalizedUrl.replace('#/', '');
            }
            $location.path('/' + normalizedUrl);
          });
        }
      });
    }
  };
});

'use strict';

angular.module('ngPicrossApp').directive('documentMouseup', function ($parse, $document) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var invoker = $parse(attrs.documentMouseup);
      var onMouseup = function (event) {
        scope.$apply(function(){
          invoker(scope, {$event: event});
        });
      };

      $document.on('mouseup', onMouseup);

      scope.$on('$destroy', function () {
        $document.off('mouseup', onMouseup);
      });
    }
  };
});

angular.module("ngPicrossApp").run(["$templateCache", function($templateCache) {$templateCache.put("app/views/home.html","<div class=\"home-actions\"><h2 class=\"text-center\">Choose a Puzzle</h2><div class=\"puzzle-choices\"><a ng-repeat=\"puzzle in puzzles\" ng-class=\"{\'puzzle-choice\': true, \'puzzle-choice-solved\': puzzle.completed}\" fancy-link=\"{{\'puzzles/\' + puzzle.id}}\">{{puzzle.id}}</a> <a class=\"puzzle-choice\" href=\"random\">?</a> <a class=\"puzzle-choice\" href=\"settings\">&#9881;</a><div class=\"puzzle-spacer\" ng-repeat=\"spacer in [1, 2, 3, 4]\"></div></div></div>");
$templateCache.put("app/views/puzzleBoard.html","<div class=\"puzzle-container\"><puzzle puzzle=\"puzzle\" solved=\"solved\" show-puzzle-actions=\"true\"></puzzle></div><h1 ng-if=\"solved\" class=\"solved-message\">SOLVED</h1><div class=\"puzzle-page-actions\"><a class=\"btn\" ng-if=\"solved\" ng-click=\"goHome()\" href=\"\">Home</a> <a class=\"btn\" ng-if=\"solved || showRandomLink\" ng-click=\"randomPuzzle()\" href=\"\">Random</a> <a class=\"btn\" ng-if=\"solved && nextPuzzleLink\" fancy-link=\"{{nextPuzzleLink}}\">Next</a></div>");
$templateCache.put("app/views/puzzleSolver.html","<div class=\"container\"><div class=\"solver-input\"><div class=\"form-group\">Hints:<div class=\"solver-puzzle-definition\"><textarea ng-model=\"solverHints\"></textarea><div class=\"solver-puzzle-size\" ng-if=\"solverHintRows.length\">{{solverHintRows.length}} x {{solverHintCols.length}}</div></div><small>(rows first, then columns, separate using two consecutive newlines)</small></div><div class=\"form-group\"><div><label><input type=\"checkbox\" ng-model=\"solverProps.showProgress\">Show Progress</label></div></div><button class=\"btn\" ng-disabled=\"!(solverHintRows && solverHintCols)\" ng-click=\"solvePuzzle()\">Check It!</button></div><div ng-if=\"solutions.length == 0\" class=\"center-message\">No solutions found...</div><div ng-if=\"solutions.length > 1\" class=\"center-message\">More than one unique solution found...</div><div ng-if=\"puzzle\"><div class=\"center-message\" ng-if=\"!solutionTime\">Iteration {{solutionIterationsCount}}</div><div class=\"center-message\" ng-if=\"solutionTime\">Solver took {{solutionTime | number:2}} seconds in {{solutionIterationsCount}} iterations.</div><puzzle puzzle=\"puzzle\" readonly=\"\"></puzzle></div><div class=\"loading-spinner\" ng-if=\"solving\"><span class=\"loading-spinner-inner\">*</span></div></div>");
$templateCache.put("app/views/puzzleSolverBenchmark.html","<div class=\"container\"><div class=\"center-message mt30\">Total Time Taken: {{totalTime | number:4}}<div class=\"small-spinner\" ng-if=\"solving\">*</div></div><table class=\"benchmark-table\"><thead><th><a href=\"\" ng-click=\"orderBy(\'id\')\">Puzzle</a></th><th><a href=\"\" ng-click=\"orderBy(\'time\')\">Time</a></th><th><a href=\"\" ng-click=\"orderBy(\'iterations\')\">Iterations</a></th></thead><tbody><tr ng-repeat=\"solvedPuzzle in solutionTimes | orderBy : sortColumn : sortReverse\"><td><a fancy-link=\"solver/{{solvedPuzzle.id}}\">Puzzle {{solvedPuzzle.id}}</a></td><td>{{solvedPuzzle.time | number:4 }} seconds</td><td>{{solvedPuzzle.iterations}}</td></tr></tbody></table></div>");
$templateCache.put("app/views/settings.html","<h2 class=\"text-center\" style=\"margin: 30px 0;\">Settings</h2><div class=\"settings\"><h3>Local Storage</h3><button ng-click=\"clearPartialPuzzleSolutions()\" ng-disabled=\"numberOfPartialPuzzleSolutions() === 0\" ng-bind=\"clearPartialPuzzleSolutionsText()\"></button><h3>Timers</h3><label><input type=\"checkbox\" ng-model=\"properties.hideTimers\"> Hide Timers</label><h3>Random Puzzles</h3><form name=\"sizeForm\"><label><input type=\"checkbox\" ng-model=\"properties.specifySize\"> Specify Size</label><div ng-if=\"properties.specifySize\"><input type=\"number\" placeholder=\"?\" ng-model=\"properties.size.rows\"> x <input type=\"number\" placeholder=\"?\" ng-model=\"properties.size.cols\"></div></form></div><div ng-if=\"properties.specifySize && properties.size.rows && properties.size.cols\"><table class=\"board\"><tr><td></td><td class=\"col-hint\" ng-repeat=\"col in arrayOfSize(properties.size.cols) track by $index\"><div class=\"col-hint-number\">1</div></td></tr><tr class=\"row\" ng-init=\"rowIndex = $index\" ng-repeat=\"row in arrayOfSize(properties.size.rows) track by $index\"><td class=\"row-hint\"><span class=\"row-hint-number\">1</span></td><td class=\"cell\" ng-repeat=\"col in arrayOfSize(properties.size.cols) track by $index\"></td></tr></table></div>");
$templateCache.put("app/views/directives/puzzle.html","<table class=\"board\" document-mouseup=\"mouseupBoard()\"><tr><td></td><td class=\"col-hint\" ng-class=\"classesForHintCol($index)\" ng-repeat=\"hints in puzzle.colHints track by $index\"><div class=\"col-hint-number\" ng-repeat=\"hint in hints track by $index\" ng-class=\"{off: hint.solved}\">{{hint.value}}</div></td></tr><tr class=\"row\" ng-init=\"rowIndex = $index\" ng-repeat=\"row in puzzle.board track by $index\"><td class=\"row-hint\" ng-class=\"classesForHintRow($index)\"><span class=\"row-hint-number\" ng-repeat=\"hint in puzzle.rowHints[rowIndex] track by $index\" ng-class=\"{off: hint.solved}\">{{hint.value}}</span></td><td class=\"cell\" ng-init=\"colIndex = $index\" ng-repeat=\"cell in puzzle.board[rowIndex]\" ng-class=\"cellClasses(rowIndex, colIndex)\" ng-mousedown=\"mousedownCell($event, rowIndex, colIndex)\" ng-mousemove=\"mousemoveCell(rowIndex, colIndex)\" right-click=\"\"></td></tr></table><div class=\"puzzle-actions\" ng-if=\"showPuzzleActions\"><div class=\"timer\" ng-bind=\"formattedTime\" ng-if=\"showTimer && formattedTime\"></div><button ng-click=\"confirmPuzzleReset()\">X</button> <button ng-class=\"{active: showClues}\" ng-click=\"toggleShowClues()\">?</button></div>");}]);