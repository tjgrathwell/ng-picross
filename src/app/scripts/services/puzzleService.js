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
        if (!this.fingerprint) {
          return;
        }

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
