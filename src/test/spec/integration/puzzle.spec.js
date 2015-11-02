'use strict';

describe('Directive: puzzle', function () {
  beforeEach(injectIntoThis('puzzleService', 'puzzleCatalogService', 'constantsService', '$controller', '$rootScope', '$compile'));
  var view, $scope;

  beforeEach(function () {
    $scope = this.$rootScope.$new();

    // 'x x',
    // ' xx',
    // '  x'
    $scope.puzzle = this.puzzleCatalogService.getPuzzle('1');
    view = this.$compile('<puzzle puzzle="puzzle" solved="solved">')($scope);
    $scope.$digest();
  });

  it('renders a board representing a puzzle', function () {
    expect(view[0].querySelectorAll('.row').length).toEqual(3);
    expect(view[0].querySelectorAll('.cell').length).toEqual(9);
  });

  it("marks the puzzle as 'solved' when all appropriate cells are marked", function () {
    function clickCell (rowIndex, colIndex) {
      var row = view[0].querySelectorAll('.row')[rowIndex];
      var $cell = angular.element(row.querySelectorAll('.cell')[colIndex]);
      $cell.triggerHandler('mousedown').triggerHandler('mouseup');

      // TODO: triggering 'mouseup' on the cell should suffice, but for now
      // this hack will ensure the associated 'mouseup' happens
      var mouseupFunction = view[0].querySelector('.board').getAttribute('document-mouseup');
      view.isolateScope().$eval(mouseupFunction);
      $scope.$eval(mouseupFunction);
    }

    expect($scope.puzzle.solved()).toEqual(false);

    clickCell(0, 0);
    clickCell(0, 2);
    clickCell(1, 1);
    clickCell(1, 2);
    clickCell(2, 2);

    expect($scope.puzzle.solved()).toEqual(true);
  });
});
