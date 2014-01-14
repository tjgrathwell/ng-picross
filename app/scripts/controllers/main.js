'use strict';

angular.module('ngPicrossApp').controller('MainCtrl', function ($scope, puzzleService) {
  var drag = {};
  var prevDragCells;

  var startPuzzle = function (puzzle) {
    $scope.puzzle = puzzle;
    $scope.solved = false;
  };

  $scope.randomPuzzle = function () {
    startPuzzle(puzzleService.generateRandomPuzzle());
  };

  function applyOverlay (cells) {
    if (prevDragCells && angular.equals(prevDragCells, cells)) {
      return;
    }

    discardOverlayValues();
    cells.forEach(function (pair) {
      overlayBoardCell(pair.row, pair.col, drag.value);
    });

    var affectedCells = cells;
    if (prevDragCells) {
      affectedCells = affectedCells.concat(prevDragCells);
    }
    puzzleService.annotateHintsForCellChanges($scope.puzzle, affectedCells);
    prevDragCells = cells;
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
  
  function setBoardCell (rowIndex, colIndex, desiredValue) {
    overlayBoardCell(rowIndex, colIndex, desiredValue);
    $scope.puzzle.board[rowIndex][colIndex].value = desiredValue;
  }

  function overlayBoardCell (rowIndex, colIndex, desiredValue) {
    $scope.puzzle.board[rowIndex][colIndex].displayValue = desiredValue;
  }

  function toggleBoardCell (rowIndex, colIndex, desiredValue) {
    var board = $scope.puzzle.board;
    if (board[rowIndex][colIndex].displayValue === desiredValue) {
      setBoardCell(rowIndex, colIndex, CellStates.o);
    } else {
      setBoardCell(rowIndex, colIndex, desiredValue);
    }
  }

  function computeBoardStateAfterCellChange (rowIndex, colIndex) {
    $scope.solved = $scope.puzzle.solved();
    var cell = {row: rowIndex, col: colIndex};
    puzzleService.annotateHintsForCellChanges($scope.puzzle, [cell]);
  }

  $scope.clickedCell = function (rowIndex, colIndex) {
    toggleBoardCell(rowIndex, colIndex, CellStates.x);
    computeBoardStateAfterCellChange(rowIndex, colIndex);
  };

  $scope.rightClickedCell = function (rowIndex, colIndex) {
    toggleBoardCell(rowIndex, colIndex, CellStates.b);
    computeBoardStateAfterCellChange(rowIndex, colIndex);
  };

  $scope.mouseupBoard = function () {
    if (drag.startCell) {
      drag.startCell = undefined;
      commitOverlayValues();
    }
  };

  $scope.mousedownCell = function ($event, rowIndex, colIndex) {
    $event.preventDefault();
    var rightClicky = ($event.button == Button.RIGHT) || $event.ctrlKey;
    drag.value = rightClicky ? CellStates.b : CellStates.x;
    drag.startCell = {rowIndex: rowIndex, colIndex: colIndex};
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
      if (cells) {
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
