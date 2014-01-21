'use strict';

describe('Service: puzzleService', function () {
  beforeEach(module('ngPicrossApp'));

  var puzzleService, CellStates;
  beforeEach(inject(function (_puzzleService_, constantsService) {
    CellStates = constantsService.CellStates;
    puzzleService = _puzzleService_;
  }));

  describe("_annotateHints", function () {
    function makeHints () {
      return _.map(Array.prototype.slice.call(arguments), function (value) {
        return {value: value, solved: false};
      });      
    }
    
    function makeLine () {
      return _.map(Array.prototype.slice.call(arguments), function (mark) {
        return {displayValue: mark ? CellStates.x : CellStates.b};
      });
    }

    function solvedHints (hints) {
      return _.map(hints, function (hint) {
        return [hint.value, hint.solved];
      });
    }
    
    it("marks hints as 'solved' if they must be solved given the marked board spaces", function () {
      var hints;

      hints = makeHints(4, 2);
      puzzleService._annotateHints(hints, makeLine(0, 1, 1, 1, 1, 0, 0, 0));
      expect(solvedHints(hints)).toEqual([[4, true], [2, false]]);

      hints = makeHints(1, 1);
      puzzleService._annotateHints(hints, makeLine(1, 0, 0));
      expect(solvedHints(hints)).toEqual([[1, true]]);

      hints = makeHints(1, 1);
      puzzleService._annotateHints(hints, makeLine(0, 0, 1));
      expect(solvedHints(hints)).toEqual([[1, false], [1, true]]);
    });
  });
});
