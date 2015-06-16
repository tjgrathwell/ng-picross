'use strict';

angular.module('ngPicrossApp').service('puzzleCatalogService', function (constantsService, puzzleService, puzzleHistoryService) {
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
      'xxxxxxxxxx',
      'xxx xxxxxx',
      'x xxxxxxxx',
      'xxxxx xxxx',
      'xxxxxxxxxx',
      'xxx xxxxxx',
      'xxxxxxxxxx',
      'xxxx xxxxx',
      'xxxxxxxxxx',
      'xxxxxx x x'
    ],
    6: [
      '     x    ',
      '  xxxxxxx ',
      '   xxxxx  ',
      '   xxxxx  ',
      '   xxxxx  ',
      '  xxxxxxx ',
      '     x    ',
      'xxxxxxxxxx',
      ' xxxxxxxxx',
      '  xxxxxxx '
    ],
    7: [
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
    8: [
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
    9: [
      '          ',
      ' xx    xx ',
      'x  x  x  x',
      'x        x',
      'x        x',
      'xxxx  xxxx',
      'x  x  x  x',
      'x  xxxx  x',
      'x  x  x  x',
      ' xxx  xxx '
    ],
    10: [
      '     xxx  ',
      '  xxxxxx  ',
      'xxxxxxxxx ',
      ' xxxxxxxx ',
      ' xxxxx xxx',
      ' xx  xx   ',
      ' x    x   ',
      ' x        ',
      'xxx       ',
      'x x       '
    ],
    11: [
      '    xx    ',
      '   xx    x',
      '  xxxx  xx',
      ' xxxxxx x ',
      'xx xxxxxx ',
      ' xxxxxx x ',
      '  xxxx  xx',
      '   xx    x',
      '    xx    ',
      '     xx   '
    ],
    12: [
      ' x        ',
      ' xx       ',
      ' xxx   xx ',
      ' x      xx',
      ' xx     xx',
      ' xxx    xx',
      'xxxxx  xxx',
      'x xxx xxx ',
      '  x xxx   ',
      '  x x     '
    ],
    13: [
      '  xxxx   xxxx  ',
      ' x    x x    x ',
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

  function generateFingerprint (lines) {
    return lines.map(function (line) {
      return parseInt(line.replace(/ /g, '0').replace(/x/g, '1'), 2);
    }).join(',');
  }

  this.getPuzzle = function (id) {
    var puzzleStrings = puzzles[id];
    var puzzleMatrix = _.map(puzzleStrings, function (line) {
      return _.map(line.split(''), function (c) {
        return c === 'x' ? CellStates.x : CellStates.o;
      });
    });
    return puzzleService.makePuzzle(puzzleMatrix, generateFingerprint(puzzles[id]));
  };

  this.getAvailablePuzzles = function () {
    return _.keys(puzzles).map(function (puzzleId) {
      return {
        id: puzzleId,
        completed: puzzleHistoryService.isCompleted(generateFingerprint(puzzles[puzzleId]))
      };
    });
  };
});
