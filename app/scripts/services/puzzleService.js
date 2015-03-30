'use strict';

angular.module('ngPicrossApp').service('puzzleService', function (constantsService) {
  var CellStates = constantsService.CellStates;

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

  this.makePuzzle = function (solution) {
    return {
      solution: solution,
      board: generateBoard(solution),
      rowHints: rowHints(solution),
      colHints: colHints(solution),
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
});
