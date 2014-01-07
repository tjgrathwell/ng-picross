'use strict';

angular.module('ngPicrossApp').service('puzzleService', function () {
  function randomBoard () {
    var puzzle = [];
    var rows = Math.ceil(Math.random() * 10);
    var cols = Math.ceil(Math.random() * 10);

    var ticks = Math.ceil(Math.random() * 10);
    var distribution = Math.random();

    for (var i = 0; i < rows; i++) {
      var row = [];
      for (var j = 0; j < cols; j++) {
        if (Math.random() < distribution) {
          row.push(x);
        } else {
          row.push(o);
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
    for (var i = 0; i < puzzle.length; i++) {
      for (var j = 0; j < puzzle[i].length; j++) {
        if (puzzle[i][j] === x) {
          return true;
        }
      }
    }
    return false;
  }

  function generateBoard (puzzle) {
    var rows = puzzle.length;
    var cols = puzzle[0].length;

    var board = [];
    for (var i = 0; i < rows; i++) {
      var row = [];
      for (var j = 0; j < cols; j++) {
        row.push(o);
      }
      board.push(row);
    }

    return board;
  }

  function hintsForLine (line) {
    var run = 0;
    var hints = [];
    for (var i = 0; i < line.length; i++) {
      if (line[i] === x) {
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
  }

  function hintsForRow (puzzle, rowIndex) {
    return hintsForLine(puzzle[rowIndex]);
  }

  function hintsForColumn (puzzle, colIndex) {
    var col = [];
    for (var i = 0; i < puzzle.length; i++) {
      col.push(puzzle[i][colIndex]);
    }
    return hintsForLine(col);
  }

  function rowHints (puzzle) {
    var hints = [];
    for (var i = 0; i < puzzle.length; i++) {
      hints.push(hintsForRow(puzzle, i));
    }
    return hints;
  }

  function colHints (puzzle) {
    var hints = [];
    for (var i = 0; i < puzzle[0].length; i++) {
      hints.push(hintsForColumn(puzzle, i));
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
        return angular.equals(this.solution, this.board);
      }
    };
  }

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
      [x, o, x],
      [o, x, x],
      [o, o, x]
    ]);
  };
});
