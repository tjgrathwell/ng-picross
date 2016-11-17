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
      var puzzleTimer = timerService.createTimer($scope.showTimer);
      $scope.puzzleTimer = puzzleTimer;

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
          puzzleTimer.start();
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
          puzzleService.clearHintAnnotations($scope.puzzle);
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
