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
    1: [
      'x x',
      ' xx',
      '  x'
    ],
    2: [
      '  x  ',
      ' xxx ',
      'xxxxx',
      'xxxxx',
      'xxxxx'
    ],
    3: [
      '  x  ',
      ' xxx ',
      'xxxxx',
      ' xxx ',
      '  x  '
    ],
    4: [
      'xx  x',
      'xxx x',
      'xxxxx',
      'xx xx',
      'xx  x'
    ],
    5: [
      '   xxx    ',
      '  xxx x   ',
      '  xx  xx  ',
      ' xxxxxx   ',
      ' xx  xxx  ',
      ' xx  xxx  ',
      ' x   xxx  ',
      ' x    xx  ',
      '  x   x   ',
      ' xxxxxx   '
    ],
    6: [
      '      xxxx',
      '     xxx  ',
      '    xxx   ',
      '    xxxx  ',
      '   x xxx  ',
      '     xxx  ',
      '  xxxxxx  ',
      ' xxxxxx xx',
      'xx        ',
      ' x        '
    ],
    7: [
      '  xxxx   xxxx  ',
      ' x    x x    x  ',
      '   xxx   xxx   ',
      '  xx  x x  xx  ',
      '  x  xx xx  x  ',
      '  x xxx xxx x  ',
      '  x x x x x x  ',
      '  x xxxxxxx x  ',
      '   x       x   ',
      'x x         x x',
      'xxx         xxx',
      'xxx         xxx',
      'xxxx       xxxx',
      ' xxxxxxxxxxxxx ',
      '  xxx xxx xxx  '
    ]
  };

  this.getPuzzle = function (id) {
    var puzzleStrings = puzzles[id];
    var puzzleMatrix = _.map(puzzleStrings, function (line) {
      return _.map(line.split(''), function (c) {
        return c == 'x' ? CellStates.x : CellStates.o;
      });
    });
    return puzzleService.makePuzzle(puzzleMatrix);
  };

  this.getAvailablePuzzleIds = function () {
    return _.keys(puzzles);
  };
});
