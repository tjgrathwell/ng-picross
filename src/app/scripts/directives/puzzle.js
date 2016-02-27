'use strict';

angular.module('ngPicrossApp').directive('puzzle', function (constantsService, puzzleService, puzzleHistoryService, puzzleSolverService) {
  return {
    restrict: 'E',
    templateUrl: 'app/views/directives/puzzle.html',
    scope: {
      puzzle: '=',
      allowClues: '@',
      solved: '='
    },
    link: function ($scope, $element, $attrs) {
      var drag = {};
      var CellStates = constantsService.CellStates;
      var Button = constantsService.Button;
      $scope.showClues = false;

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

      function overlayBoardCell (rowIndex, colIndex, desiredValue) {
        $scope.puzzle.board[rowIndex][colIndex].displayValue = desiredValue;
      }

      function disableIfReadonly (handler) {
        if ($attrs.hasOwnProperty('readonly')) {
          return angular.noop;
        }

        return handler;
      }

      var solver;
      $scope.$watch('puzzle', function (newPuzzle) {
        solver = puzzleSolverService.createSolverFromPuzzle(newPuzzle);
      });

      $scope.mouseupBoard = disableIfReadonly(function () {
        if (drag) {
          drag = {};
          commitOverlayValues();
          $scope.solved = $scope.puzzle.solved();
          if ($scope.solved && $scope.puzzle.fingerprint) {
            puzzleHistoryService.markCompleted($scope.puzzle.fingerprint);
          }
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
            applyOverlay(cells);
          }
        }
      });

      $scope.shouldHighlightRow = function (rowIndex) {
        if (!$scope.showClues) {
          return false;
        }
        return solver.hasUnmarkedRequiredCells($scope.puzzle, rowIndex, false);
      };

      $scope.shouldHighlightCol = function (colIndex) {
        if (!$scope.showClues) {
          return false;
        }
        return solver.hasUnmarkedRequiredCells($scope.puzzle, colIndex, true);
      };

      $scope.cellClasses = function (rowIndex, colIndex) {
        var cellValue = $scope.puzzle.board[rowIndex][colIndex].displayValue;
        return {
          on: cellValue === CellStates.x,
          off: cellValue === CellStates.b
        };
      };

      $scope.toggleShowClues = function () {
        $scope.showClues = !$scope.showClues;
      }
    }
  };
});
