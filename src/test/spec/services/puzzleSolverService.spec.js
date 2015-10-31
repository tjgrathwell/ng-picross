'use strict';

describe('Service: puzzleSolverService', function () {
  beforeEach(injectIntoThis('$timeout', 'puzzleSolverService', 'constantsService'));

  function stringify(puzzleBoard, onState) {
    onState = onState || CellStates.x;
    if (!puzzleBoard) {
      return null;
    }

    return puzzleBoard.map(function (row) {
      return row.map(cell => cell === onState ? 'x' : ' ').join('');
    });
  }

  var CellStates;
  beforeEach(function () {
    CellStates = this.constantsService.CellStates;
  });

  describe('#arrangementsForHint', function () {
    it('determines all possible arrangements for a given hint', function () {
      var arrangements = this.puzzleSolverService.arrangementsForHint([1, 1], 5);
      expect(stringify(arrangements, 1)).toEqual([
        'x x  ',
        'x  x ',
        'x   x',
        ' x x ',
        ' x  x',
        '  x x'
      ]);

      arrangements = this.puzzleSolverService.arrangementsForHint([2], 3);
      expect(stringify(arrangements, 1)).toEqual([
        'xx ',
        ' xx'
      ]);
    });

    it('returns only one arrangement for an empty line', function () {
      var arrangements = this.puzzleSolverService.arrangementsForHint([0], 5);
      expect(stringify(arrangements, 1)).toEqual([
        '     '
      ]);
    });
  });

  describe('#solutionsForPuzzle', function () {
    it("determines the solution for a puzzle from a list of hints", function (done) {
      var solutionsPromise = this.puzzleSolverService.solutionsForPuzzle({
        rows: [
          [1, 1],
          [2],
          [1]
        ],
        cols: [
          [1],
          [1],
          [3]
        ]
      });

      solutionsPromise.then(function (solutionData) {
        expect(stringify(solutionData.solutions[0])).toEqual([
          'x x',
          ' xx',
          '  x'
        ]);

        done();
      });

      this.$timeout.flush();
    });

    it("returns multiple solutions if the puzzle could be solved multiple ways", function (done) {
      var solutionsPromise = this.puzzleSolverService.solutionsForPuzzle({
        rows: [
          [1],
          [1]
        ],
        cols: [
          [1],
          [1]
        ]
      });

      solutionsPromise.then(function (solutionData) {
        expect(solutionData.solutions.length).toEqual(2);
        expect(stringify(solutionData.solutions[0])).toEqual([
          'x ',
          ' x'
        ]);
        expect(stringify(solutionData.solutions[1])).toEqual([
          ' x',
          'x '
        ]);

        done();
      });

      this.$timeout.flush();
    });

    it("can solve medium puzzles without taking a long time", function (done) {
      var solutionsPromise = this.puzzleSolverService.solutionsForPuzzle({
        rows: [
          [2],
          [2, 1],
          [4, 2],
          [6, 1],
          [2, 6],
          [6, 1],
          [4, 2],
          [2, 1],
          [2],
          [2]
        ],
        cols: [
          [1],
          [3],
          [2, 2],
          [7],
          [9],
          [1, 5, 2],
          [3, 1],
          [1],
          [5],
          [2, 2]
        ]
      });

      solutionsPromise.then(function (solutionData) {
        expect(stringify(solutionData.solutions[0])).toEqual([
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
        ]);

        done();
      });

      this.$timeout.flush();
    });

    it('can solve large puzzles without taking a long time', function (done) {
      var solutionsPromise = this.puzzleSolverService.solutionsForPuzzle({
        rows: [
          [0],
          [7],
          [9],
          [2, 2],
          [2, 2],
          [2, 3],
          [11, 1, 1],
          [11, 3],
          [4, 4, 1],
          [4, 4, 2],
          [5, 5, 1],
          [5, 5, 2],
          [11],
          [11],
          [0]
        ],
        cols: [
          [8],
          [12],
          [13],
          [2, 8],
          [2, 2, 4],
          [2, 2, 2],
          [2, 2, 4],
          [2, 8],
          [4, 8],
          [3, 8],
          [8],
          [0],
          [3, 1, 1],
          [1, 5],
          [3]
        ]
      });

      solutionsPromise.then(function (solutionData) {
        expect(stringify(solutionData.solutions[0])).toEqual([
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
        ]);

        done();
      });

      this.$timeout.flush();
    });
  });
});
