'use strict';

describe('Service: puzzleService', function () {
  beforeEach(injectIntoThis('puzzleService', 'constantsService'));

  var CellStates;
  beforeEach(function () {
    CellStates = this.constantsService.CellStates;
  });

  describe("makePuzzle", function () {
    it("calculates the appropriate row and column hints", function () {
      var puzzleMatrix = [
        [CellStates.x, CellStates.o, CellStates.x],
        [CellStates.x, CellStates.x, CellStates.x],
        [CellStates.o, CellStates.o, CellStates.o]
      ];
      var puzzle = this.puzzleService.makePuzzle(puzzleMatrix);
      expect(puzzle.rowHints).toEqual([
        [{value: 1}, {value: 1}],
        [{value: 3}],
        [{value: 0}]
      ]);
      expect(puzzle.colHints).toEqual([
        [{value: 2}],
        [{value: 1}],
        [{value: 2}]
      ]);
    });
  });

  describe("_annotateHints", function () {
    function makeHints (...values) {
      return values.map(value => ({value, solved: false}));
    }

    function makeLine (...values) {
      return values.map(mark => ({displayValue: mark ? CellStates.x : CellStates.b}));
    }

    function solvedHints (hints) {
      return hints.map(hint => [hint.value, hint.solved]);
    }

    it("marks hints as 'solved' if the hint is 0 and the row is empty", function () {
      var hints;

      hints = makeHints(0);
      this.puzzleService._annotateHints(hints, makeLine(0, 0, 0, 0, 0));
      expect(solvedHints(hints)).toEqual([[0, true]]);
    });

    it("marks hints as 'solved' if they must be solved given the marked board spaces", function () {
      var hints;

      hints = makeHints(4, 2);
      this.puzzleService._annotateHints(hints, makeLine(0, 1, 1, 1, 1, 0, 0, 0));
      expect(solvedHints(hints)).toEqual([[4, true], [2, false]]);

      hints = makeHints(1, 1);
      this.puzzleService._annotateHints(hints, makeLine(1, 0, 0));
      expect(solvedHints(hints)).toEqual([[1, true], [1, false]]);
    });

    it("crosses off solved hints from the end of the list when appropriate", function () {
      var hints = makeHints(1, 1);
      this.puzzleService._annotateHints(hints, makeLine(0, 0, 1));
      expect(solvedHints(hints)).toEqual([[1, false], [1, true]]);
    });

    xit("does not cross off the same hint multiple times for the same solution", function () {
      var hints = makeHints(1, 1);
      this.puzzleService._annotateHints(hints, makeLine(0, 1, 0, 0, 0));
      expect(solvedHints(hints)).toEqual([[1, true], [1, false]]);
    });
  });
});
