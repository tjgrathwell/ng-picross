'use strict';

angular.module('ngPicrossApp').service('puzzleService', function (constantsService) {
  var CellStates = constantsService.CellStates;

  function randomBoard () {
    var rows = 1 + Math.ceil(Math.random() * 9);
    var cols = 1 + Math.ceil(Math.random() * 9);

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

  function generateBoard (puzzle) {
    var rows = puzzle.length;
    var cols = puzzle[0].length;

    return Array.apply(null, new Array(rows)).map(function () {
      return Array.apply(null, new Array(cols)).map(function () {
        return {displayValue: CellStates.o};
      });
    });
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
    return puzzle.map(function (row) {
      return hintsForLine(row);
    });
  }

  function colHints (puzzle) {
    return puzzle[0].map(function (col, ix) {
      return hintsForLine(matrixCol(puzzle, ix));
    });
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

  this._annotateHints = function (hints, line) {
    var linePosition = -1;
    for (var i = 0; i < hints.length; i++) {
      var hint = hints[i];
      var hintSolved = false;
      var runStarted = false;
      var cellsRemainingForHint = hint.value;
      if (linePosition > -1 && line[linePosition].displayValue === CellStates.x) {
        // If the last cell was marked, the next group must be at least one cell over
        linePosition += 1;
      }
      while (linePosition < (line.length - 1)) {
        linePosition += 1;
        if (line[linePosition].displayValue === CellStates.x) {
          runStarted = true;
          cellsRemainingForHint -= 1;
          if (cellsRemainingForHint === 0) {
            // If the next cell is marked, this run is too long
            if ((linePosition === (line.length - 1)) || (line[linePosition + 1].displayValue !== CellStates.x)) {
              hintSolved = true;
            }
            break;
          }
        } else if (runStarted) {
          break;
        }
      }
      hint.solved = hintSolved;
      if (runStarted && cellsRemainingForHint > 0) {
        return;
      }
    }
  };

  this.annotateHintsForCellChanges = function (puzzle, cells) {
    var puzzleService = this;
    _.uniq(_.pluck(cells, 'row')).forEach(function (rowIndex) {
      puzzleService._annotateHints(puzzle.rowHints[rowIndex], matrixRow(puzzle.board, rowIndex));
    });
    _.uniq(_.pluck(cells, 'col')).forEach(function (colIndex) {
      puzzleService._annotateHints(puzzle.colHints[colIndex], matrixCol(puzzle.board, colIndex));
    });
  };

  this.generateRandomPuzzle = function () {
    var puzzle;
    while ((puzzle = randomBoard())) {
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
