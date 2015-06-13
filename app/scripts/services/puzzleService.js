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

  this.makePuzzle = function (solution, fingerprint) {
    return {
      solution: solution,
      board: generateBoard(solution),
      rowHints: rowHints(solution),
      colHints: colHints(solution),
      fingerprint: fingerprint,
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
    // TODO: raises errors on 0
    var forwardResult = this._computeHintAnnotationValues(_.pluck(hints, 'value'), line);
    var backwardResult = this._computeHintAnnotationValues(_.pluck(hints.slice().reverse(), 'value'), line.slice().reverse());
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
    _.uniq(_.pluck(cells, 'row')).forEach(function (rowIndex) {
      puzzleService._annotateHints(puzzle.rowHints[rowIndex], matrixRow(puzzle.board, rowIndex));
    });
    _.uniq(_.pluck(cells, 'col')).forEach(function (colIndex) {
      puzzleService._annotateHints(puzzle.colHints[colIndex], matrixCol(puzzle.board, colIndex));
    });
  };
});
