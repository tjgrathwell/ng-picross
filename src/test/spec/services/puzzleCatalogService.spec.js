'use strict';

describe('Service: puzzleCatalogService', function () {
  beforeEach(injectIntoThis('$timeout', 'puzzleCatalogService'));

  describe("generateRandomPuzzle", function () {
    it("creates a puzzle of some merit", function (done) {
      this.puzzleCatalogService.generateRandomPuzzle().then(function (puzzle) {
        expect(puzzle.solution.length).toBeGreaterThan(1);
        expect(puzzle.solution[0].length).toBeGreaterThan(1);

        done();
      });

      this.$timeout.flush();
    });
  });
});
