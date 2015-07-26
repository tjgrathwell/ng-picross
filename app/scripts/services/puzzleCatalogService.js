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

  var puzzles = [
    [
      'x x',
      ' xx',
      '  x'
    ],
    [
      '  x  ',
      ' xxx ',
      'xxxxx',
      'xxxxx',
      'xxxxx'
    ],
    [
      '  x  ',
      ' xxx ',
      'xxxxx',
      ' xxx ',
      '  x  '
    ],
    [
      'xx  x',
      'xxx x',
      'xxxxx',
      'xx xx',
      'xx  x'
    ],
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
      'xxx x x  x',
      'x x x x  x',
      'xx xxxxxxx',
      'x x    xxx',
      'xx     xxx',
      'xx   xxxxx',
      'xx   xxxxx',
      'xxx   xxxx',
      'xxx   xxxx',
      'xxx   xxxx'
    ],
    [
      '          ',
      '          ',
      '  xxx    x',
      ' xx  x xxx',
      'xx xxxxx  ',
      'xxxxxxxxxx',
      ' xxxxx xxx',
      '  xxx    x',
      '          ',
      '          '
    ],
    [
      'xx xxxx xx',
      'x xx x x x',
      'x x x xx x',
      'x xx   x x',
      'xx xx  x x',
      ' xxxxxxxxx',
      '  x  x    ',
      '  x x     ',
      ' xxxxxxx  ',
      'xx     xx '
    ],
    [
      '  xxxx    ',
      ' x x  xxxx',
      'x     x  x',
      'xx    x  x',
      'x     xxxx',
      'x    xx x ',
      ' xxxxx xx ',
      ' x  x x x ',
      ' x  xxxxx ',
      ' xxxx     '
    ],
    [
      " xxxxxxxx ",
      "xx      xx",
      "x  xxxx  x",
      "x x    x x",
      "x x xx x x",
      "x x x  x x",
      "x x xxx  x",
      "x x     xx",
      "x  xxxxxx ",
      " x        "
    ],
    [
      '     xxxx ',
      '  xx xxxx ',
      '  xxxxxxx ',
      ' x xxxxxx ',
      '  xxxxx   ',
      '     xx   ',
      '  xxxxx   ',
      'xx   x  x ',
      '     xxx x',
      '          '
    ],
    [
      'xxx    xxx',
      '   xxxx   ',
      '  x    x  ',
      '  x x xx  ',
      'xxx x xx  ',
      '       xx ',
      '        x ',
      '  x xxxxx ',
      '  x xxx   ',
      '   x xx   '
    ],
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
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
    [
      '      x    xxxx',
      'xxxx  x    x  x',
      'x  x  x   x  xx',
      'xxxx xxx  xxxx ',
      '     x x       ',
      '     xxx       ',
      '     x x       ',
      '     xxx       ',
      '   xxx xxx     ',
      '   xxxxxxx     ',
      '    xxxxx      ',
      '   xxxxxxx     ',
      '   xxxxxxx     ',
      '  xx     xx    ',
      ' xx  xxx  xxx  '
    ],
    [
      '     x         ',
      '   x x         ',
      '   xxxx        ',
      '    xxx        ',
      '    xxxx       ',
      '     xx        ',
      '    xxx      x ',
      '    xxxx      x',
      '    xxxxx     x',
      '    xxxxxx xx x',
      '    xxxxxxxxxx ',
      '   xx xxxxxxxx ',
      '   x  x    xx  ',
      '  xx xx     xx ',
      'xxx xx    xxxx '
    ],
    [
      '        x      ',
      '       xx      ',
      '       xxxx    ',
      '       xxx     ',
      '       xx      ',
      '        xx     ',
      '   xxx  xx     ',
      '    xxxx xx    ',
      '   xxxxxxxx    ',
      '    xxxxxxx    ',
      '     xxxxx     ',
      ' xxx  x    x   ',
      '  xxxxxxxxxxxx ',
      ' xxx  x    x   ',
      '      x        '
    ],
    [
      '  xx           ',
      ' x xx          ',
      'xx  xxx        ',
      'x  xx xxxx     ',
      'x xxx    xxxx  ',
      'x xxx       xx ',
      'x  xx   xxx  x ',
      'xx  x xxxxxx x ',
      ' x xxxxx   x x ',
      ' xxxxx xxxxx x ',
      '  x x  x   x x ',
      '    xx xxxx xx ',
      '     xx    xxx ',
      '      xxxxxx x ',
      '            xx '
    ],
    [
      '     x x       ',
      '     x xxxxx   ',
      '  xxxx xx xxxx ',
      ' x   x xxxx xxx',
      ' xxx x xxxx  xx',
      'xxxxxxxxx  x  x',
      'xx  xx xx   x x',
      'x   x  xxx  xxx',
      'x   x  xxx  xxx',
      'x  xx  xxx  xxx',
      'x  xx  xxx xxxx',
      'x  xx  xxx xxx ',
      'xx xxx  xxxxxx ',
      ' xxxxxxxxxxxx  ',
      '     xxxxx     '
    ],
    [
      'xx          xxx',
      ' xx       xxxx ',
      '  xx     xx    ',
      'xxx       xxx  ',
      'xxxxx    xxxxx ',
      ' xxx       xxxx',
      '               ',
      '               ',
      '               ',
      '               ',
      '           x   ',
      '    xx xx      ',
      '   xxxxxxx     ',
      '    xxxxx      ',
      '     xxx       '
    ],
    [
      'xx x       xx x',
      'xxx  x   x xxx ',
      '       x       ',
      ' x    xxx    x ',
      ' xxxxxxxxxxxxx ',
      '  xx xx xx xx  ',
      '   xxxx  xxx   ',
      '      x        ',
      '     xx xx     ',
      'x    xx  x    x',
      'x x   x x   x x',
      'x xx  xxx  xx x',
      'x xxxx   xxxx x',
      'xx x xxxxx x xx',
      'xx  xxxxxxx  xx'
    ],
    [
      '      xx       ',
      '      xx       ',
      ' xx    xx      ',
      'xxxx   xxx     ',
      'xxxxxxxxxx     ',
      '  xx  xxxx     ',
      '  xx xxxxxx    ',
      '  xxxxxxxxx    ',
      '   xxxxxxxxxxx ',
      '   xxxxxxxxx xx',
      '  xxxxxxxxxx   ',
      '  x x xxxx x   ',
      '  xxx    x xx  ',
      '    x   xx  x  ',
      '   xx   x  xx  '
    ],
    [
      ' xxxx          ',
      'xx  xxx        ',
      'x  x  x        ',
      'xxx   xx       ',
      'x x   xxx      ',
      'xxxxxxx xx     ',
      'x x  x   xx    ',
      '  x  x    x    ',
      '  x  xx   xxxxx',
      '  x   xxxxx   x',
      '  xx     xxxxxx',
      '   xx  xxx     ',
      '    xxxx       ',
      '    x  x       ',
      '  xxxxxxxx     '
    ],
    [
      '           xxxx',
      '  xxxxxxxxx   x',
      ' xxx       xxxx',
      ' xx            ',
      ' xxxxx         ',
      '  xxxxxxxxx    ',
      '     xxxxxxx   ',
      '         xxxx  ',
      '       x  xxxx ',
      '      xx   xxx ',
      ' xxxxx    xxxx ',
      'xxxxxxxxxxxxxx ',
      ' xxxxx  xxxxx  ',
      '      x        ',
      '      xx       '
    ],
    [
      '     xx xx     ',
      '    x  x  x    ',
      '       x  x    ',
      '    x  x       ',
      '      xxx x    ',
      '      x x      ',
      '  xxxxxxxxxxx  ',
      '  xx       xx  ',
      '   xxxxxxxxx   ',
      '    x    xx    ',
      '    x    xx    ',
      '    xx  xxx    ',
      '     x  xx     ',
      '   xxxxxxxxx   ',
      '   x      xx   '
    ],
    [
      'xx    x x      ',
      'xx    xxx      ',
      '     x xxx     ',
      'x xxxxxxx      ',
      '   xx xxxx     ',
      '      xxx      ',
      '     xxxxxx    ',
      '    xx  xx     ',
      '    x  xxxx    ',
      '    x   xx  x  ',
      '    xx xxx  x x',
      '     xxxxx  x x',
      '  xx   xxx xx x',
      '  xxx  xx     x',
      '    xxxxx    xx'
    ],
    [
      ' xxxxx xxxxx   ',
      'x  xxxxx  xxx  ',
      '  xxx xxxx xx  ',
      ' xx x x  x  x  ',
      ' xx x x   x xx ',
      ' xx x xx  x xx ',
      ' x  x  x     x ',
      ' x  xx x     x ',
      ' xx  x    xx   ',
      ' xx  x     x   ',
      ' xx  x  x xxx  ',
      ' xx     xxxxxxx',
      ' xxx      xxx x',
      '  xx       x   ',
      'xxxxx      xx  '
    ],
    [
      '     xxxxx     ',
      '    x     x    ',
      '   x xxxxx x   ',
      'xxxxx     xxxxx',
      'x x  xxxxx  x x',
      'x xxx     xxx x',
      'x xx  xxx  xx x',
      'x x xx x xx x x',
      'x x x xxx x x x',
      '  x x x x x x  ',
      ' xx xx   xx xx ',
      '     x   x     ',
      '     x   x     ',
      '    xx   xx    ',
      '               '
    ],
    [
      '               ',
      '   xxxxxxxx    ',
      '   xx x x xx   ',
      '  xxxxxxxx x   ',
      ' xx       xx xx',
      ' x  xx     xxxx',
      'x x  xxx    x x',
      'x    x x      x',
      'xx x x x     xx',
      'x    xxx    x x',
      'xx  xx     xxxx',
      ' xx       xxx x',
      '  xxxxxxxx x xx',
      '   x x x xxx   ',
      '    xxxxxxx    '
    ],
    [
      '    xxx   xx   ',
      '       xxxxxx  ',
      '     xxxxx x   ',
      '    xxx  x     ',
      'xx x  xx  xxx  ',
      ' xx    x       ',
      '      x        ',
      '     x         ',
      '     xxx       ',
      '    xx xx      ',
      '   xx xxxx     ',
      '   xx xxxx     ',
      '   xxxxxxx     ',
      '    xxxxx      ',
      '     xxx       '
    ],
    [
      '             x ',
      '            xx ',
      '   xx      x x ',
      ' xx x      x x ',
      'x   x      x x ',
      'xxxxx      x x ',
      '  x xxxx  x x  ',
      '  x xx xx x x  ',
      '  x x x  x  x  ',
      '  x xxxxx xxx  ',
      '  x x x    xx  ',
      '  xxx x    xx  ',
      '   x  xx   xx  ',
      '    xxxxxx x   ',
      '          xx   '
    ],
    [
      '  xxxx         ',
      ' xx  xx        ',
      'xx x  x        ',
      ' xx   xx       ',
      '  x    xxxx    ',
      ' xx    x  xx   ',
      'xx     xx  x   ',
      'x          xx  ',
      'x           xxx',
      'x           x x',
      'xx          x x',
      ' xx       xxx x',
      '  xxxxxxxxxxxxx',
      '     x  x      ',
      '   xxxxxxxx    '
    ],
    [
      '         xx    ',
      '        x  x   ',
      'xx xx  xxxxxx  ',
      '  x    x    x  ',
      '       xxxxxx  ',
      '        x  x   ',
      '  xx xx x  x   ',
      '  x x x x  x   ',
      '       xx  xx  ',
      'xxxxxxxx    xxx',
      '       x xx x  ',
      '   xxx x xx x  ',
      '   x x x xx x  ',
      'xxxxxxxxxxxxxx ',
      '             x '
    ],
    [
      '         x     ',
      'xxx     xxx    ',
      '  x     x x    ',
      ' x xxxx x x    ',
      ' x  xx  x      ',
      ' x   x  x      ',
      '  xxxxxx       ',
      '     xx        ',
      '     xx xxxxxxx',
      '     xxxxxxxxx ',
      '      xxxxxxx  ',
      '     xx  x  x  ',
      '    x x  x  x  ',
      '    x x  x  x  ',
      '  xx x    xx xx'
    ],
    [
      '     xxxxx     ',
      '   xx  x  xx   ',
      '  xx x x x xx  ',
      '  x x xxx x x  ',
      ' xxxxxxxxxxxxx ',
      ' x xx     x  x ',
      ' xxx xx xx xxx ',
      ' x x   x   x x ',
      ' xxxx     xxxx ',
      ' x   x   x   x ',
      ' xxxxxx xxxxxx ',
      ' x    x x    x ',
      ' xxxxxx xxxxxx ',
      ' x    x x    x ',
      ' xxxxxxxxxxxxx '
    ],
    [
      '               ',
      '               ',
      '               ',
      '   xxxxxxxx    ',
      '   x  x   x    ',
      '   xxxxxxxx    ',
      '   x      xx   ',
      '  xx    x  xx  ',
      '  x     x   x  ',
      ' xx     xx  xx ',
      ' x       x   x ',
      'xx   x   xx  xx',
      'x   xxx   x   x',
      'x   xxx   x   x',
      'xxxxxxxxxxxxxxx'
    ],
    [
      '       x       ',
      '     xx xx     ',
      '   xxxx  xxx   ',
      '  xxxxx   xxx  ',
      ' xxxxxx    xxx ',
      'xxxxxxx     xxx',
      'xxxxxxxxxxxxxxx',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x       ',
      '       x x     ',
      '        x      '
    ],
    [
      'xxxxxxxxxxxxxxx',
      'x   xxxxxxxxxxx',
      'x  xxx   xxxxxx',
      'xxxxx     xxxxx',
      'xxxxx     xxxxx',
      'xxxxx     x   x',
      'xxxxxx   xxxx x',
      'xxxxxxxxxxxxxxx',
      'x   xxxxxxxx  x',
      'x      xxx    x',
      'x       x     x',
      'x x   x  xx   x',
      'x         xx  x',
      'x   x  x   xx x',
      'xxxxxxxxxxxxxxx'
    ],
    [
      'xxxxxxxxx xxxxx',
      'xxx xxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxx x x xxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxx xxx',
      '  xx xxxxxxxxxx',
      'x xxxxxxxxxxxx ',
      '  xxxxx        ',
      'x       x x x  ',
      '   x x         '
    ],
    [
      '               ',
      '      xxx      ',
      '      x x      ',
      'xxx   xxx      ',
      'x x   xxxxxx   ',
      'xxx   x xx x   ',
      'xxx   xxxxxx   ',
      'x x   xxx      ',
      'xxx   x x      ',
      'xxx   xxx   xxx',
      'x x         x x',
      'xxx         xxx',
      'xxx   xxxxxxxxx',
      'x x   x xx xx x',
      'xxx   xxxxxxxxx'
    ],
    [
      '  xxx xxx      ',
      ' xx x x xx xxx ',
      '  xxx xxx  x xx',
      '  xxx xxx  xxx ',
      ' xxxxxxxxx xxx ',
      ' xxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'x             x',
      'xxxxxxxxxxxxxxx',
      'x             x',
      'xxxxxxxxxxxxxxx',
      ' x          xx ',
      ' xxxxxx   xxxx ',
      '  xxx    xxxx  ',
      '    xxxxxxx    '
    ],
    [
      '  xxx  xxx   xx',
      '  x xx xx  x xx',
      '  x  xxx  xx xx',
      '  x   xx xxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  x    xxxxx xx',
      '  xx   xxxx  xx',
      '   x   xxxx xxx',
      '   xx  xxx xxxx',
      '    xx xx xxxxx',
      '     xxx xxxxxx',
      '      xx xxxxxx'
    ],
    [
      '    xxxxx xx   ',
      'xxxxx   xxxxxxx',
      'x      xx xxx  ',
      'xxx xxx   xxxxx',
      ' x xxxxx  xxx x',
      '   xx  x  xxxxx',
      '  xxxxxxx x x x',
      ' xxxxxxxxxxx xx',
      'xxxxxxxxxxxxx x',
      'xx x   x  x xxx',
      '   xxxxx  x x x',
      '   xxxxx  x xxx',
      '   xx xx  x  xx',
      '  xxx xxx x   x',
      '  xxx xxx x    '
    ],
    [
      'xxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxx',
      'xx           xx',
      'xx   xxx     xx',
      'xx   xxx     xx',
      'xx   xxx     xx',
      'xx       xx  xx',
      'xxx  xxxxxxx xx',
      'xxxxxxxxx  xx x',
      'xx xx xxxx xx x',
      'xx     xxx   xx',
      'xx    xxxxx xxx',
      'xx   xxx xxxxxx',
      'xx  xxx   xx xx',
      'xx xxx       xx'
    ],
    [
      '    xx         ',
      '  xxxxxx       ',
      ' xxxxxxxxxx    ',
      ' xxxxxxxxxxx   ',
      'xxxxxxxxxxxx   ',
      'xxxxxxxxxxxxxx ',
      'xxxxxxxxxxxxx  ',
      ' xxx  xxxxxxx  ',
      '      xxxxxxx  ',
      '     xxxxxxx   ',
      '     xxxxxx  x ',
      '     xxxxxx  x ',
      '      xxxxx  x ',
      '      xxxx     ',
      '       xx      '
    ],
    [
      '     xxxxx     ',
      '   xxxxxxxxx   ',
      '  xxxxxxxxxxx  ',
      '  xx       xx  ',
      ' xx  x   x  xx ',
      ' xx x x xxx xx ',
      ' xx  x   x  xx ',
      ' xx x  x  x xx ',
      'xxx xxxxxxx xxx',
      'xxxx       xxxx',
      'xx xxxxxxxxx xx',
      'xx x x x x x xx',
      ' x x x x x x x ',
      ' xxx x x x xxx ',
      '  xxxxxxxxxxx  '
    ],
    [
      '               ',
      '               ',
      '               ',
      '               ',
      '    xxxxx      ',
      '    x   xx   xx',
      'xxxxxxxxxxxxxxx',
      'x x x x       x',
      'xx  xxx    xxxx',
      ' xxx     xxx xx',
      '   xxxxxxxx    ',
      '         xx    ',
      '               ',
      '               ',
      '               '
    ],
    [
      '               ',
      '            xxx',
      '  xxx     xxxx ',
      ' x   x    xxxxx',
      ' x x x    xxx  ',
      ' x   xx  xxxxx ',
      'xxxxxxxx xxx   ',
      'x  xxxxxxxxxxx ',
      'xx xxxxxxxxx   ',
      ' x xxxxx xxxxx ',
      ' xxx xx   xx   ',
      '     xxx  xxxx ',
      '      xx   xxxx',
      '               ',
      '               '
    ],
    [
      '  xx   xxxx    ',
      ' xxxxxxxxxxxx  ',
      ' xxxxxxxxxxxxx ',
      ' xxxxxxxx  xxx ',
      '  xxxx     xxx ',
      '     x xx xxxx ',
      '   xx    xx xx ',
      '   x  x  xx xx ',
      '   xxxx xx  xx ',
      '     x  xx  x  ',
      '    xxxxxxxxxx ',
      '    x xxxxxxxx ',
      '    x xxxxxxxx ',
      '    xxxxxxxxxxx',
      '   xxxxxxxxxxxx'
    ],
    [
      '     xxxxx     ',
      '    xxxxxxx    ',
      '   xxx   xxx   ',
      '  xxx     xxx  ',
      ' xxx       xxx ',
      'xxx xxx xxx xxx',
      ' x    x x x  x ',
      ' x  xxx xxx  x ',
      ' x           x ',
      ' x   xxxxx   x ',
      ' x  xxxxxxx  x ',
      ' x  xxxxxxx  x ',
      ' x  xxxxxxx  x ',
      ' x  xxxxxxx  x ',
      ' xxxxxxxxxxxxx '
    ],
    [
      '   xxxxxx      ',
      '  xxxxxxxx     ',
      ' xxxxxxxxxx    ',
      'xxxxxxx x xx  x',
      'x  x  xxxxxx xx',
      'xx xx xx x xxxx',
      'x  x  xxxxxxx x',
      'xxxxxxx  xxxxxx',
      'xx   xx  xxxx x',
      'xx x xxx x  xxx',
      'xx   xxxxx  x x',
      'xxxxxx     xxxx',
      'xx        xx xx',
      ' xx      xx   x',
      '  xxxxxxxx     '
    ],
    [
      '               ',
      '             x ',
      'xxx   xxx      ',
      'x  x x  x      ',
      'x   x   x    x ',
      ' x  x  x       ',
      ' x xxx x       ',
      ' xx x xx     x ',
      '               ',
      '               ',
      '    x        x ',
      '               ',
      '               ',
      '    x  x  x  x ',
      '               '
    ],
    [
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
    ],
  ];

  function generateFingerprint (lines) {
    return lines.map(function (line) {
      return parseInt(line.replace(/ /g, '0').replace(/x/g, '1'), 2);
    }).join(',');
  }

  this.getPuzzle = function (id) {
    var puzzleStrings = puzzles[id - 1];
    var puzzleMatrix = _.map(puzzleStrings, function (line) {
      return _.map(line.split(''), function (c) {
        return c === 'x' ? CellStates.x : CellStates.o;
      });
    });
    return puzzleService.makePuzzle(puzzleMatrix, generateFingerprint(puzzleStrings));
  };

  this.getAvailablePuzzles = function () {
    return puzzles.map(function (puzzle, puzzleIndex) {
      return {
        id: puzzleIndex + 1,
        completed: puzzleHistoryService.isCompleted(generateFingerprint(puzzle))
      };
    });
  };
});
