'use strict';

describe('Service: puzzleSolverService', function () {
  beforeEach(module('ngPicrossApp'));
  beforeEach(injectIntoThis('puzzleSolverService', 'constantsService'));

  function stringify(puzzleBoard) {
    if (!puzzleBoard) {
      return null;
    }

    return puzzleBoard.map(function (row) {
      return row.map(function (cell) {
        return cell === CellStates.x ? 'x' : ' ';
      }).join('');
    });
  }

  var CellStates;
  beforeEach(function () {
    CellStates = this.constantsService.CellStates;
  });

  it("determines the solution for a puzzle from a list of hints", function () {
    var solvedPuzzle = this.puzzleSolverService.solvePuzzle({
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

    expect(stringify(solvedPuzzle)).toEqual([
      'x x',
      ' xx',
      '  x'
    ]);
  });
});
