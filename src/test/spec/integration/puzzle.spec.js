'use strict';

describe('Directive: puzzle', function () {
  beforeEach(injectIntoThis('puzzleService', 'puzzleCatalogService', 'constantsService', '$controller', '$rootScope', '$compile'));

  it('renders a board representing a puzzle', function () {
    var $scope = this.$rootScope.$new();
    $scope.puzzle = this.puzzleCatalogService.getPuzzle('1');
    var view = this.$compile('<puzzle puzzle="puzzle" solved="solved">')($scope);
    $scope.$digest();

    expect(view[0].querySelectorAll('.row').length).toEqual(3);
    expect(view[0].querySelectorAll('.cell').length).toEqual(9);
  });
});
