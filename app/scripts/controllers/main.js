'use strict';

angular.module('ngPicrossApp').controller('MainCtrl', function ($scope, puzzleService) {
  var drag = {};

  var startPuzzle = function (puzzle) {
    $scope.puzzle = puzzle;
    $scope.solved = false;
  };

  $scope.randomPuzzle = function () {
    startPuzzle(puzzleService.generateRandomPuzzle());
  };

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

  $scope.mouseupBoard = function () {
    if (drag.startCell) {
      drag.startCell = undefined;
      commitOverlayValues();
      $scope.solved = $scope.puzzle.solved();
    }
  };

  $scope.mousedownCell = function ($event, rowIndex, colIndex) {
    $event.preventDefault();
    var cellValue = $scope.puzzle.board[rowIndex][colIndex].value;
    var rightClicky = ($event.button == Button.RIGHT) || $event.ctrlKey;
    if (rightClicky) {
      drag.value = (cellValue === CellStates.b) ? CellStates.o : CellStates.b;
    } else {
      drag.value = (cellValue === CellStates.x) ? CellStates.o : CellStates.x;
    }
    drag.startCell = {rowIndex: rowIndex, colIndex: colIndex};
    $scope.mousemoveCell(rowIndex, colIndex);
  };

  $scope.mousemoveCell = function (rowIndex, colIndex) {
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
        } while (cellCount != 0);
      }
      if (colIndex === startColIx) {
        cellCount = rowIndex - drag.startCell.rowIndex;
        sign = Math.min(1, Math.max(-1, cellCount));
        cellCount += sign;
        cells = [];
        do {
          cellCount -= sign;
          cells.push({row: startRowIx + cellCount, col: startColIx});
        } while (cellCount != 0);
      }      
      if (cells && !angular.equals(drag.prevDragCells, cells)) {
        applyOverlay(cells);
      }
    }
  };

  $scope.cellClasses = function (rowIndex, colIndex) {
    var cellValue = $scope.puzzle.board[rowIndex][colIndex].displayValue;
    return {
      on: cellValue === CellStates.x,
      off: cellValue === CellStates.b
    };
  };

  startPuzzle(puzzleService.authoredPuzzle());
});
