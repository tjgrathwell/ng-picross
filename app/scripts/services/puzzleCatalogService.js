'use strict';

angular.module('ngPicrossApp').service('puzzleCatalogService', function (constantsService, puzzleService, puzzleHistoryService, puzzleSolverService) {
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

  function puzzleHasUniqueSolution(puzzle) {
    var puzzleObj = puzzleService.makePuzzle(puzzle);
    var hints = {
      rows: puzzleObj.rowHints.map(function (hintObj) {
        return _.pluck(hintObj, 'value');
      }),
      cols: puzzleObj.colHints.map(function (hintObj) {
        return _.pluck(hintObj, 'value');
      })
    };

    return puzzleSolverService.solutionsForPuzzle(hints).length > 1;
  }

  this.generateRandomPuzzle = function () {
    var puzzle;
    while ((puzzle = randomBoard())) {
      if (puzzleHasMerit(puzzle) && puzzleHasUniqueSolution(puzzle)) {
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
      '  xxxxxxxxxxx  ',
      '  x    x    x  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxxxxxxxxxx  ',
      '  xxx     xxx  ',
      '  xxxxxxxxxxx  ',
      '  xxx     xxx  ',
      '  xxxxx xxxxx  ',
      '  xxxxx xxxxx  ',
      '  xxxxxxxxxxx  ',
      '      xxx      ',
      '      xxx      '
    ],
    14: [
      'xxxxxxxxxxxxxx ',
      'x  xxxxxxxxx  x',
      'x  xxxxx  xx  x',
      'x  xxxxx  xx  x',
      'x  xxxxx  xx  x',
      'x  xxxxxxxxx  x',
      'x             x',
      'x xxxxxxxxxxx x',
      'x x         x x',
      'x x xxxxxxx x x',
      'x x         x x',
      'x x xxxxxxx x x',
      'x x         x x',
      'x x         x x',
      'xxxxxxxxxxxxxxx'
    ],
    15: [
      '   x       x   ',
      '   xxxxxxxxx   ',
      '    xxxxxxx    ',
      '   xxxxxxxxx   ',
      'x xxxxxxxxxxx x',
      'xxxxxxxxxxxxxxx',
      '   x x   x x   ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxxxxxxx ',
      'xxxxxxxxxxxxxxx',
      ' x           x ',
      'xx xx xxx xx xx',
      ' x    x x    x ',
      'xxxxxxx xxxxxxx',
      '               '
    ],
    16: [
      '               ',
      '  xxxxxxx      ',
      ' xxxxxxxxx     ',
      ' xx     xx     ',
      ' xx     xx     ',
      ' xx         xxx',
      'xxxxxxxxxxx x x',
      'xxxxxxxxxxx xxx',
      'xxxx   xxxx  x ',
      'xxxx   xxxx xx ',
      'xxxxx xxxxx  x ',
      'xxxxx xxxxx xx ',
      'xxxxxxxxxxx    ',
      'xxxxxxxxxxx    ',
      '               '
    ],
    17: [
      'x   xxxxxxxxxxx',
      'x     xxxxxxxxx',
      'xx xx  xxxxxxxx',
      ' xx  x    xxxxx',
      'x x  x   xxxxxx',
      'x  xx   xxxxxxx',
      'xx  x  x xxxxxx',
      'xxx x xxx xxxxx',
      'xxx  x xx xxxxx',
      'xxx xxx   xxx  ',
      'xxxxxxxxxxx  xx',
      'xxxxxxxxxx xxxx',
      'xxxxxxxxx xxxxx',
      'xxxxxxxxx xx x ',
      'xxxxxxxx  x   x'
    ],
    18: [
      '    xxxxxxx    ',
      '  xxxx   xxxx  ',
      '  xx   x   xx  ',
      ' xx    x    xx ',
      ' xx    xxx  xx ',
      ' xx         xx ',
      ' xxx       xxx ',
      ' xxxxx   xxxxx ',
      ' xxxxxxxxxxxxx ',
      ' xxx   x   xxx ',
      ' xx   x x   xx ',
      ' xx xx   xx xx ',
      ' xx xxx xxx xx ',
      ' xx         xx ',
      ' xxxxxxxxxxxxx '
    ],
    20: [
      'xxxxxxxxxxxxxxx',
      'xxxx      xxxxx',
      'xx         xxxx',
      'x           xxx',
      '             xx',
      '             xx',
      ' xx    xxxx xxx',
      '   xx xxxxxx xx',
      ' xx x xxxxxx xx',
      ' xx x x xxxx xx',
      '    x x        ',
      'x     xxx xx x ',
      'xx   xx x xx x ',
      'xxx xxx   xx x ',
      'xxxxxxxxx      '
    ],
    21: [
      ' xxx x x xxx xx',
      ' x         x xx',
      ' x xxxxxxx x x ',
      ' x xx    x x x ',
      'xx x   x x xxx ',
      'x  x   x x  xx ',
      'x  x   x x  xxx',
      'x  xxxxxxx  xxx',
      'x           xx ',
      'x   x x x   xx ',
      'x           x  ',
      'x xxxxxxxxx x  ',
      'x x       x x  ',
      'x x       x x  ',
      'xxxxxxxxxxxxx  '
    ],
    22: [
      ' x  x   x  x  x',
      '               ',
      'xxxxxxx xxxxxxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'xxxxxxx xxxxxxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'x   xxx x   xxx',
      'x   xxxxx   xxx',
      'x    xxx    xxx',
      'xx         xxxx',
      ' xx       xxxx ',
      '  xxxxxxxxxxx  '
    ],
    23: [
      '         x     ',
      '        xx     ',
      '  xx   xxx     ',
      '  xxxxxx x     ',
      '   x xx  x     ',
      '   xxx   x     ',
      '   xx    x     ',
      '  xx    xxx    ',
      ' xx    xx x    ',
      'xxxxxxxx  xx   ',
      '     xxxxxxx   ',
      '    xx     xx  ',
      '   xxxxxxxxxx  ',
      '  xx        xx ',
      '  xxxxxxxxxxxx '
    ],
    24: [
      '          xxxxx',
      'x         x   x',
      'xx        xx  x',
      'xxx       x   x',
      'x xx      xx  x',
      'x  xx     x   x',
      'xx  xx    xxx x',
      'x    xx   x   x',
      'xx    xx  xx  x',
      'x  xx  xx x   x',
      'xx xx   xxxx  x',
      'x        xx   x',
      'x x x x x xxx x',
      'xxxxxxxxxxx   x',
      '          xxxxx'
    ],
    25: [
      '      x        ',
      '      x        ',
      'xxxxx x        ',
      '    x x        ',
      'x x x x  x x   ',
      'x x x x  x x   ',
      '    x x  x x   ',
      'xxxxx x xxxxx  ',
      '      x xxx x  ',
      'xxxxx x xxx x  ',
      '    x x xxx x  ',
      'x x x x xx xx  ',
      'x x x x  xxx   ',
      '    x x   x    ',
      'xxxxx x   x    '
    ],
    26: [
      '     xxxxx     ',
      '    xx   xx    ',
      '    x     x    ',
      '   xx     xx   ',
      '   x       x   ',
      '  xx       xx  ',
      '  x         x  ',
      ' xx xxxxxxx xx ',
      ' x  xxxxxxx  x ',
      'xx  xxxxxxx  xx',
      'x   xxxxxxx   x',
      'x   xxxxxxx   x',
      'x   xxxxxxx   x',
      'xx  xxxxxxx  xx',
      ' xxxxxxxxxxxxx '
    ],
    27: [
      '  xxx          ',
      ' x   x         ',
      ' xx xx    xxx  ',
      ' x   x   xxxxx ',
      '  xxx   xxxxxxx',
      '   x    xx   xx',
      '  xxx   xxx xxx',
      ' xx xx  xx   xx',
      ' x xxx    x x  ',
      ' xxxxx   xx xx ',
      ' xxxxx  x  x  x',
      ' x   x  xxxxxxx',
      ' x   x  xxxxxxx',
      ' x   x  x     x',
      ' xxxxx  xxxxxxx'
    ],
    28: [
      '   xxxxxxxxx   ',
      '  xxxxxxxxxxx  ',
      '  xx       xx  ',
      '  xx       xx  ',
      '  xxx xxx xxx  ',
      '   xxxxxxxxx   ',
      '     xxxxx     ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      xxx      ',
      '      x x      ',
      '      xxx      '
    ],
    29: [
      '               ',
      '         x     ',
      '      x  xx    ',
      '     xxx xx    ',
      '    xxxxxxxx   ',
      '  xxxxxxxxxxx  ',
      ' xxxxxxxxxxxx  ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxxxxxxx ',
      '  xxx   xxxxx  ',
      '  xx     xxxx  ',
      '          xx   ',
      '               ',
      '           x   '
    ],
    30: [
      '               ',
      '  x            ',
      ' xxx     xxx  x',
      ' xxxxxxxxxxx xx',
      ' xxxx x x xxxxx',
      ' xxxxxxxxxxxxxx',
      ' xxx    xxxx xx',
      ' x       xxx  x',
      '  x  x    xx   ',
      '  xxx     xx   ',
      '  x      xxxx  ',
      '  xx    xxxxxx ',
      ' xxxxxxxxxxxxx ',
      'x             x',
      'xxxxxxxxxxxxxxx'
    ],
    31: [
      '     xxxxx     ',
      '    x     x    ',
      '     xxxxx     ',
      '     xxx x     ',
      '     xxx x     ',
      '     xxx x     ',
      '     xxxxx     ',
      '     xxxxx     ',
      '    xxxxxxx    ',
      '   xxxxxx xx   ',
      '  xxxxxxxx xx  ',
      ' xxxxxxxxxxxxx ',
      'xxxxxxxxxxxx xx',
      'xxxxxxxxxxxxxxx',
      ' xxxxxxxxxxxxx '
    ],
    32: [
      '  xxxxxxxxxxx  ',
      '  x  xxxxx  x  ',
      '  x  xxxxx  x  ',
      '  x  xxxxx  x  ',
      '  x  xxxxx  x  ',
      '  xx xx xx xx  ',
      '   xxx   xxx   ',
      ' xxxx  x  xxxx ',
      ' x    xxx    x ',
      ' xx  xx xx  xx ',
      '  xx  xxx  xx  ',
      '   x   x   x   ',
      '  xx  xxx  xx  ',
      '  x  xx xx  x  ',
      '  xxxx   xxxx  '
    ],
    33: [
      '               ',
      '               ',
      ' xxxxx xx xxxx ',
      '       xx      ',
      '  xxxxxxxxxxx  ',
      '  x          x ',
      ' xxxx   xxxx xx',
      ' x  x         x',
      'x   x   x     x',
      'xxxxx  xxx    x',
      'x       x     x',
      'x  xxx    xxx x',
      'xxxx xxxxxx xxx',
      '   xxx    xxx  ',
      'xxxxxxxxxxxxxxx'
    ],
    34: [
      '               ',
      '               ',
      '               ',
      '               ',
      '       xxx     ',
      '       xxx     ',
      '       x       ',
      '       x       ',
      '    xxxxxxxx   ',
      '  xxxxx xxxxxx ',
      ' xxxxxxxxxxxxx ',
      '   xxxxxxxxxx  ',
      '      xxxxxx   ',
      '               ',
      '               '
    ],
    35: [
      '   xxxxxxxxx   ',
      '  xxx  x   xx  ',
      ' xxx x xx xxxx ',
      ' xxxx xx x xxx ',
      ' xxx xxxxxxxxx ',
      ' xxxxx   xxxxx ',
      ' xxxxxxxxxxxxx ',
      '  xxx     xxx  ',
      '  xxxxx xxxxx  ',
      '   xx x x xx   ',
      '   xxxxxxxxx   ',
      '    xxxxxxx    ',
      '       x       ',
      '       x       ',
      '       x       '
    ],
    36: [
      '    xx         ',
      '   xxxx        ',
      '   xx x        ',
      '   x           ',
      '  xx           ',
      ' xxxx          ',
      ' xxxxxxxx      ',
      '  xx xxxxx     ',
      '  xxx xxxxx    ',
      '  xxx xxxxx    ',
      '   xxx  xxxx   ',
      '    xxxx   x   ',
      ' xx  xxxxxxx   ',
      ' x xxx  xxxxx  ',
      '      xxx  xx  '
    ],
    37: [
      '               ',
      ' x   x   x   x ',
      ' xxxxx   xxxxx ',
      ' x   xxxxx   x ',
      ' x   x   x   x ',
      ' xxxxx   xxxxx ',
      ' x   xxxxx   x ',
      ' x   x   x   x ',
      ' xxxxx   xxxxx ',
      ' x   xxxxx   x ',
      ' x   x   x   x ',
      '               ',
      ' x  xxx  x   x ',
      'xxx x x xxx xxx',
      ' x  xxx  x   x '
    ],
    38: [
      '               ',
      '       xxxxxxxx',
      '          x    ',
      '          xxx x',
      '            x  ',
      '    xxx     x x',
      '    x       x  ',
      '   xx       x x',
      '    x       x  ',
      '    x       x x',
      '            x  ',
      '           xxxx',
      '           x   ',
      '           x   ',
      'xxxxxxxxxxxxxxx'
    ],
    39: [
      '   xxxxxxxxx   ',
      ' xxx x   x xxx ',
      ' x x  x x  x x ',
      'x  x   x   x  x',
      'x  x  xxx  x  x',
      'x  x xxxxx x  x',
      'x  xx  x  xx  x',
      'x  x  xxx  x  x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x     xxx     x',
      'x      x      x'
    ],
    40: [
      'xx           xx',
      'xx           xx',
      'xxxxxxxxxxxxxxx',
      'xx x       x xx',
      'xx x  xxx  x xx',
      '   xx x x xx   ',
      '    xxx xxx    ',
      '    xxxxxxx    ',
      '     xxxxx     ',
      '     xxxxx     ',
      '      xxx      ',
      '     xxxxx     ',
      '     xx xx     ',
      '     x   x     ',
      '    xx   xx    '
    ],
    41: [
      '    xxxx xxxx  ',
      '    x  x x  x  ',
      '    x xxxxx x  ',
      '    xxx   xxx  ',
      '    x   x  x   ',
      '    xx     x   ',
      '     xxxxx x   ',
      'xxx    x   x   ',
      'x xxxxxx   xx  ',
      'xxx    x    x  ',
      ' x          xxx',
      ' x          x x',
      'xxx    x  xxxxx',
      'x     xx      x',
      'xxxxxxxxxxxxxxx'
    ],
    42: [
      '               ',
      '               ',
      '      xxxx     ',
      '  xxxxxxxxxxx  ',
      ' xxx  xxxx  xx ',
      ' xx    xx    x ',
      ' xx    xx    x ',
      ' xxx  xxxx  xx ',
      ' x xxxx  xxxx  ',
      ' x             ',
      ' x             ',
      ' x             ',
      ' x             ',
      ' x             ',
      ' x             '
    ],
    43: [
      ' xx            ',
      ' x xxxxxxxxxx  ',
      'xx x       xxx ',
      'xx x       xxx ',
      '   x       xxx ',
      '   x       xxx ',
      '   xxxxxxxxxx  ',
      '  xx      xxx  ',
      ' xxxxxxxxxxx   ',
      ' x        xxxx ',
      ' x xxxxxx xx x ',
      ' x xxxxxx xx xx',
      ' x        xx   ',
      ' xxxxxxxxxxx   ',
      ' x        x    '
    ],
    44: [
      ' xxx       xxx ',
      ' xxxx     xxxx ',
      '   xx     xx   ',
      ' xxxxxxxxxxxxx ',
      '  xx x x x xx  ',
      '  xx x x x xx  ',
      ' xxx x x x xxx ',
      ' xxx x x x xxx ',
      'xx x x x x x xx',
      'xx x x x x x xx',
      'xx x x x x x xx',
      'xxxx x x x xxxx',
      ' xxx x x x xxx ',
      '  xxxxxxxxxxx  ',
      '   xxxxxxxxx   '
    ],
    45: [
      '         xx    ',
      '        xxxx   ',
      ' xxx    xxxxx  ',
      ' xxx x xxxxxxx ',
      ' xxx x  xxx xx ',
      '  xxx    xx xx ',
      'xxxxxx  xxxx x ',
      '  xxxx xxxxx x ',
      '  xxxxxxxxxx   ',
      '   xxxxxxxxx   ',
      '    xxxxxxxx   ',
      '     x  xxxx   ',
      '       xxxxx   ',
      '   xxxxxxxxx   ',
      '   xxxxxxxx    '
    ],
    46: [
      'xxxxxxxxxxxxxxx',
      'xxxxxxx      xx',
      'xxxxxx   xx   x',
      'xxxxxx  xxxx  x',
      'xxx     xxxx  x',
      'x       xxx   x',
      'x xx  x     x x',
      'x xx   xxx xx x',
      'x             x',
      'x       xx    x',
      'x x x xxxx    x',
      'x x xx x     xx',
      'x xx x x    xxx',
      'xx        xxxxx',
      'xxxxxxxxxxxxxxx'
    ],
    47: [
      '    xxx        ',
      '     x         ',
      '    xxx        ',
      '    x xxxx     ',
      '    x xxxxx    ',
      '    x x   xx   ',
      '    xxx    x   ',
      '   x x x  xx   ',
      '        xxx    ',
      '   xxxxxxx     ',
      '        xx     ',
      '       xxxx    ',
      '    xxx x x    ',
      '        xxxx   ',
      '  xxxxxxxxxx   '
    ],
    48: [
      '  xxx          ',
      '  x x          ',
      'xxxxxxx        ',
      '  x x          ',
      'xxxxxxx        ',
      '  x x          ',
      '  x x          ',
      '  x x          ',
      '  xxx          ',
      '  xxx          ',
      '  xxx     x  xx',
      '  x x    xx   x',
      '  x x   xxxxxx ',
      '  x x     xxxx ',
      '  xxx    x x x '
    ],
    49: [
      '      xx       ',
      '     xxxx      ',
      '      xx       ',
      '    xxxxx      ',
      '   xxx  xx   x ',
      '   xxxxxxxxxxx ',
      '   xxxxxxx x   ',
      '   xxxxx xxx   ',
      '   xxxx  xxx   ',
      '   xx    x     ',
      '   xxx   x     ',
      '   xxx   x     ',
      '   xxxxxxx     ',
      '     x x       ',
      '    xx xx      '
    ],
    50: [
      '    xxxxxxx    ',
      '   xx     xx   ',
      '  xx xxxxx xx  ',
      ' xx xx   xx xx ',
      'xx xx  x  xx xx',
      'x xx       xx x',
      'xxx  x      xxx',
      ' x xxx       x ',
      ' x   x       x ',
      ' x   xxxxxxxxx ',
      ' x   xxxxxx  x ',
      ' x  xxxx xxx x ',
      ' x x       xxx ',
      ' x           x ',
      ' xxxxxxxxxxxxx '
    ],
    51: [
      '  xxxx   xxxx  ',
      ' xx  xxxxx  xx ',
      ' x    xxx    x ',
      ' x xx xxx xx x ',
      ' x  x xxx x  x ',
      ' x   xxxxx   x ',
      'x  xxx x xxx  x',
      'x  x xxxxx x  x',
      'x xx xxxxx xx x',
      'x  xxxxx xxx  x',
      'x  x x xxx x  x',
      'x  x xxxxx x  x',
      'x xx xxx x xx x',
      '     xxxxx     ',
      '      xxx      '
    ],
    52: [
      '    xxxxxxx    ',
      '  xxxxxxxxxxx  ',
      ' xx         xx ',
      'xx           xx',
      'x             x',
      'x             x',
      'x             x',
      'xxx         xxx',
      'xx x       x xx',
      'xx x       x xx',
      'xx x       x xx',
      'xx x       x xx',
      ' xx         xx ',
      '  x         x  ',
      '  x         x  '
    ],
    53: [
      '         xx    ',
      '   xxx xxxxx   ',
      '  xxx xx       ',
      '  x  xxxxxx    ',
      '    xxx xxxx   ',
      '   xx xxxxxxx  ',
      '   xxxxx x xx  ',
      '   x xxxxxxxx  ',
      '   xx xxxxxxx  ',
      '    xxx xx x   ',
      '    xxxxxxxx   ',
      '     xx x x    ',
      '     xxxxxx    ',
      '      xxxx     ',
      '       xx      '
    ],
    54: [
      'xxxxxxxxxxxxxx ',
      'x            x ',
      'x xx xx xx   x ',
      'x x  x  xx   x ',
      'x xx xx x    x ',
      'x        xxx x ',
      'x       xxxxxx ',
      'x       xx  xx ',
      'xxxxxxxxx   xx ',
      '         x x   ',
      '       xxxxxxx ',
      '       x xxx x ',
      '     xxxx x  x ',
      ' xxx xxxxxxxxxx',
      '     x        x'
    ],
    55: [
      '      xxx      ',
      '    xxxxxxx    ',
      '   x xxx xxx   ',
      '   x xxx xxx   ',
      '  x xxx   xxx  ',
      '  x xxx   xxx  ',
      '  x xxx   xxx  ',
      '   x xxx xxx   ',
      '   x xxx xxx   ',
      '    xxxxxxx    ',
      '    x xxx x    ',
      '     x   x     ',
      '     xxxxx     ',
      '     x   x     ',
      '     xxxxx     '
    ],
    56: [
      'xxxx        xx ',
      'x  x        xx ',
      'x  x        xx ',
      'x  x        xx ',
      '            xx ',
      '    xx      xx ',
      '   xx x     xx ',
      '   xxxx     xx ',
      '    xx      xx ',
      '            xx ',
      '         xx xx ',
      '  xxx   xxxxxx ',
      ' x xxx   xxxxx ',
      'x xxxxx   xxxxx',
      'xxxxxxx    xxxx'
    ],
    57: [
      '               ',
      '   x  x        ',
      '   x  x        ',
      '   xxxxx xxxx  ',
      '     xxxxx   xx',
      '     xxxx     x',
      '     xxx      x',
      '     xx      xx',
      '    xx    xxxxx',
      '  xxx    xxxxxx',
      'xx      xxxxxxx',
      'x      xxxxxxxx',
      'x     xxxxxxxxx',
      'xx  xxxxxxxxxxx',
      '  xxxxxxxxxxxxx'
    ],
    58: [
      '     xxxx      ',
      '   xx   xx     ',
      '   xxx   x     ',
      '  x xx   xx    ',
      ' xx   xx  xx   ',
      ' x  xx     xx  ',
      '  xxx      xx  ',
      '   xx       x  ',
      '  xx   xxxx x  ',
      '  x   xx    x  ',
      ' xx  xx     x  ',
      ' x   x      xx ',
      ' x  xx   x   x ',
      ' x xx   xx  xx ',
      ' xxxxxxxxxxxx  '
    ],
    59: [
      '               ',
      '               ',
      '               ',
      '     x      x  ',
      '     xx    x x ',
      '     x x  xxxxx',
      '     x  x   x  ',
      '     x  xx xxx ',
      '     x   xxxxx ',
      'x    x     xxx ',
      'xxxxxxxxxxxxxxx',
      ' xx          xx',
      '  xxxxxxxxxxxxx',
      '   xxxxxxxxxxx ',
      'xxxxxxxxxxxxxxx'
    ],
    60: [
      '      xxxx     ',
      '      xxxx     ',
      '       xxxxxx  ',
      '       xxx xxx ',
      '  x   xxx   xx ',
      '  x  xxxxxx xx ',
      '   xxxxx  x  xx',
      '    xxxx  x   x',
      '    xxxxx      ',
      ' x   xxxx      ',
      ' x   xxxxx     ',
      ' x xxxxxx      ',
      ' xxx xxxxxxxx  ',
      '  x         x  ',
      '          xxx  '
    ],
    61: [
      '     xxx       ',
      '    xxxx       ',
      '     xxxx      ',
      '     xxxxx     ',
      '    xx xxxx    ',
      '    x  xxxxx   ',
      '    x  xxxxx   ',
      '    xxxx xxx   ',
      '   xxxxxxxxx   ',
      'x xxxxxxxxxx   ',
      ' xx xx xxxx    ',
      '    xx         ',
      '    x  xxxx    ',
      '    x  xxxx    ',
      '   xx          '
    ],
    62: [
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
