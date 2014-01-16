'use strict';

angular.module('ngPicrossApp').service('puzzleService', function () {
  function randomBoard () {
    var puzzle = [];
    var rows = 1 + Math.ceil(Math.random() * 9);
    var cols = 1 + Math.ceil(Math.random() * 9);

    var ticks = Math.ceil(Math.random() * 10);
    var distribution = Math.random();

    for (var i = 0; i < rows; i++) {
      var row = [];
      for (var j = 0; j < cols; j++) {
        if (Math.random() < distribution) {
          row.push(CellStates.x);
        } else {
          row.push(CellStates.o);
        }
        ticks -= 1;
        if (ticks <= 0) {
          distribution = Math.random();
          ticks = Math.ceil(Math.random() * 10);
        }
      }
      puzzle.push(row);
    }
    return puzzle;
  }

  function puzzleHasMerit (puzzle) {
    var rowHasCells = {};
    var colHasCells = {};
    for (var i = 0; i < puzzle.length; i++) {
      for (var j = 0; j < puzzle[i].length; j++) {
        if (puzzle[i][j] === CellStates.x) {
          rowHasCells[i] = true;
          colHasCells[j] = true;
        }
      }
    }
    return (_.values(rowHasCells).length === puzzle.length) && (_.values(colHasCells).length === puzzle[0].length);
  }

  function generateBoard (puzzle) {
    var rows = puzzle.length;
    var cols = puzzle[0].length;

    var board = [];
    for (var i = 0; i < rows; i++) {
      var row = [];
      for (var j = 0; j < cols; j++) {
        row.push({displayValue: CellStates.o});
      }
      board.push(row);
    }

    return board;
  }

  function hintsForLine (line) {
    var run = 0;
    var hints = [];
    _.forEach(line, function (cell) {
      if (cell === CellStates.x) {
        run += 1;
      } else if (run) {
        hints.push({value: run});
        run = 0;
      }
    });
    if (run) {
      hints.push({value: run});
    }

    return hints.length === 0 ? [0] : hints;
  }

  function matrixCol(matrix, colIndex) {
    var col = [];
    for (var i = 0; i < matrix.length; i++) {
      col.push(matrix[i][colIndex]);
    }
    return col;
  }

  function matrixRow(matrix, rowIndex) {
    return matrix[rowIndex];
  }

  function rowHints (puzzle) {
    var hints = [];
    for (var i = 0; i < puzzle.length; i++) {
      hints.push(hintsForLine(puzzle[i]));
    }
    return hints;
  }

  function colHints (puzzle) {
    var hints = [];
    for (var i = 0; i < puzzle[0].length; i++) {
      hints.push(hintsForLine(matrixCol(puzzle, i)));
    }
    return hints;
  }

  function makePuzzle (puzzle) {
    return {
      solution: puzzle,
      board: generateBoard(puzzle),
      rowHints: rowHints(puzzle),
      colHints: colHints(puzzle),
      solved: function () {
        var boardWithOnlyMarkedCells = this.board.map(function (row) {
          return row.map(function (cell) {
            return cell.value === CellStates.x ? cell.value : CellStates.o;
          });
        });
        return angular.equals(this.solution, boardWithOnlyMarkedCells);
      }
    };
  }

  function solvedFlag(line, boardLine) {
    var solved = true;
    for (var i = 0; i < line.length; i++) {
      if ((boardLine[i].displayValue == CellStates.x && line[i] != CellStates.x) || (line[i] == CellStates.x && boardLine[i].displayValue != CellStates.x)) {
        solved = false;
      }
    }

    return solved;
  }

  this.annotateHintsForCellChanges = function (puzzle, cells) {
    cells.forEach(function (cell) {
      var rowSolved = solvedFlag(matrixRow(puzzle.solution, cell.row), matrixRow(puzzle.board, cell.row));
      puzzle.rowHints[cell.row].forEach(function (hint) {
        hint.solved = rowSolved;
      });

      var colSolved = solvedFlag(matrixCol(puzzle.solution, cell.col), matrixCol(puzzle.board, cell.col));
      puzzle.colHints[cell.col].forEach(function (hint) {
        hint.solved = colSolved;
      });
    });
  };
  
  this.generateRandomPuzzle = function () {
    var puzzle;
    while (puzzle = randomBoard()) {
      if (puzzleHasMerit(puzzle)) {
        return makePuzzle(puzzle);
      }
    }
  };

  this.authoredPuzzle = function () {
    return makePuzzle([
      [CellStates.x, CellStates.o, CellStates.x],
      [CellStates.o, CellStates.x, CellStates.x],
      [CellStates.o, CellStates.o, CellStates.x]
    ]);
  };
});
