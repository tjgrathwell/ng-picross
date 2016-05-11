'use strict';

angular.module('ngPicrossApp').directive('puzzle', function ($location, $timeout, constantsService, puzzleService, puzzleHistoryService, puzzleSolverService) {
  return {
    restrict: 'E',
    templateUrl: 'app/views/directives/puzzle.html',
    scope: {
      puzzle: '=',
      showPuzzleActions: '@',
      solved: '='
    },
    link: function ($scope, $element, $attrs) {
      var drag = {};
      var CellStates = constantsService.CellStates;
      var Button = constantsService.Button;
      var highlighter, puzzleTimer;
      var hoveredRowIndex, hoveredColIndex;

      $scope.showClues = false;
      $scope.formattedTime = null;

      function applyOverlay (cells) {
        discardOverlayValues();
        cells.forEach(function (pair) {
          overlayBoardCell(pair.row, pair.col, drag.value);
        });

        var affectedCells = cells;
        if (drag.prevDragCells) {
          affectedCells = affectedCells.concat(drag.prevDragCells);
        }
        puzzleService.annotateHintsForCellChanges($scope.puzzle, affectedCells);
        drag.prevDragCells = cells;
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
          if (puzzleTimer) {
            puzzleTimer.stop();
          }
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
        if (puzzleTimer) {
          puzzleTimer.stop();
        }
        if (!$scope.solved) {
          puzzleTimer = new PuzzleTimer();
          puzzleTimer.run(function () {
            $scope.formattedTime = puzzleTimer.formattedValue();
          });
        }
      });

      $scope.$on('$destroy', function () {
        if (puzzleTimer) {
          puzzleTimer.stop();
        }
      });

      $scope.mouseupBoard = disableIfReadonly(function () {
        if (drag) {
          drag = {};
          commitOverlayValues();
          $scope.puzzle.saveState();
          checkAndMarkSolved();
        }
      });

      $scope.mousedownCell = disableIfReadonly(function ($event, rowIndex, colIndex) {
        $event.preventDefault();
        var cellValue = $scope.puzzle.board[rowIndex][colIndex].value;
        var rightClicky = ($event.button === Button.RIGHT) || $event.ctrlKey;
        if (rightClicky) {
          drag.value = (cellValue === CellStates.b) ? CellStates.o : CellStates.b;
        } else {
          drag.value = (cellValue === CellStates.x) ? CellStates.o : CellStates.x;
        }
        drag.startCell = {rowIndex: rowIndex, colIndex: colIndex};
        $scope.mousemoveCell(rowIndex, colIndex);
      });

      $scope.mousemoveCell = disableIfReadonly(function (rowIndex, colIndex) {
        hoveredRowIndex = rowIndex;
        hoveredColIndex = colIndex;
        if (drag.startCell) {
          var startRowIx = drag.startCell.rowIndex;
          var startColIx = drag.startCell.colIndex;
          var sign, cellCount, cells;
          if (rowIndex === startRowIx) {
            cellCount = colIndex - drag.startCell.colIndex;
            sign = Math.min(1, Math.max(-1, cellCount));
            cellCount += sign;
            cells = [];
            do {
              cellCount -= sign;
              cells.push({row: startRowIx, col: startColIx + cellCount});
            } while (cellCount !== 0);
          }
          if (colIndex === startColIx) {
            cellCount = rowIndex - drag.startCell.rowIndex;
            sign = Math.min(1, Math.max(-1, cellCount));
            cellCount += sign;
            cells = [];
            do {
              cellCount -= sign;
              cells.push({row: startRowIx + cellCount, col: startColIx});
            } while (cellCount !== 0);
          }
          if (cells && !angular.equals(drag.prevDragCells, cells)) {
            highlighter.invalidateCell(rowIndex, colIndex);
            applyOverlay(cells);
          }
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

  function PuzzleTimer () {
    var timerPromise = null;
    var startTime = null;
    var self = this;

    this.run = function (cb) {
      if (!startTime) {
        startTime = new Date();
      }

      timerPromise = $timeout(function () {
        cb();
        self.run(cb);
      }, 50);
    };

    function pad(num, size) {
      var s = num + "";
      while (s.length < size) {
        s = "0" + s;
      }
      return s;
    }

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

    this.stop = function () {
      $timeout.cancel(timerPromise);
    };
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
