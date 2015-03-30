'use strict';

angular.module('ngPicrossApp').service('puzzleCatalogService', function ( constantsService, puzzleService) {
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

  this.generateRandomPuzzle = function () {
    var puzzle;
    while ((puzzle = randomBoard())) {
      if (puzzleHasMerit(puzzle)) {
        return puzzleService.makePuzzle(puzzle);
      }
    }
  };

  var puzzles = {
    '1': [
      [CellStates.x, CellStates.o, CellStates.x],
      [CellStates.o, CellStates.x, CellStates.x],
      [CellStates.o, CellStates.o, CellStates.x]
    ],
    '2': [
      [CellStates.o, CellStates.o, CellStates.x, CellStates.o, CellStates.o],
      [CellStates.o, CellStates.x, CellStates.x, CellStates.x, CellStates.o],
      [CellStates.x, CellStates.x, CellStates.x, CellStates.x, CellStates.x],
      [CellStates.x, CellStates.x, CellStates.x, CellStates.x, CellStates.x],
      [CellStates.x, CellStates.x, CellStates.x, CellStates.x, CellStates.x]
    ],
    '3': [
      [CellStates.o, CellStates.o, CellStates.x, CellStates.o, CellStates.o],
      [CellStates.o, CellStates.x, CellStates.x, CellStates.x, CellStates.o],
      [CellStates.x, CellStates.x, CellStates.x, CellStates.x, CellStates.x],
      [CellStates.o, CellStates.x, CellStates.x, CellStates.x, CellStates.o],
      [CellStates.o, CellStates.o, CellStates.x, CellStates.o, CellStates.o]
    ]
  };

  this.getPuzzle = function (id) {
    return puzzleService.makePuzzle(puzzles[id]);
  };

  this.getAvailablePuzzleIds = function (id) {
    return _.keys(puzzles);
  };
});
