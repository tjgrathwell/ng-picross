'use strict';

describe('Directive: puzzle', function () {
  beforeEach(injectIntoThis('puzzleService', 'puzzleCatalogService', 'constantsService', '$controller', '$rootScope', '$compile'));
  var view, $scope;

  function clickCell (rowIndex, colIndex) {
    var row = view[0].querySelectorAll('.row')[rowIndex];
    var $cell = angular.element(row.querySelectorAll('.cell')[colIndex]);
    $cell.triggerHandler('mousedown');
    // TODO: 'mouseup' on the cell should bubble to the document but doesn't :'(
    angular.element(document).triggerHandler('mouseup');
  }

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

  it('renders hints based on the puzzle solution', function () {
    var rowHints = _.map(view[0].querySelectorAll('.row-hint'), function (rowHint) {
      return _.map(rowHint.querySelectorAll('.row-hint-number'), function (number) {
        return number.textContent;
      });
    });

    var colHints = _.map(view[0].querySelectorAll('.col-hint'), function (colHint) {
      return _.map(colHint.querySelectorAll('.col-hint-number'), function (number) {
        return number.textContent;
      });
    });

    expect(rowHints).toEqual([ [ '1', '1' ], [ '2' ], [ '1' ] ]);
    expect(colHints).toEqual([ [ '1' ], [ '1' ], [ '3' ] ]);
  });

  it("marks a cell as 'on' when it is clicked", function () {
    function firstCellChecked () {
      return view[0].querySelector('.row').querySelector('.cell').classList.contains('on');
    }

    expect(firstCellChecked()).toBeFalsy();

    clickCell(0, 0);

    expect(firstCellChecked()).toBeTruthy();
  });

  it("marks the puzzle as 'solved' when all appropriate cells are marked", function () {
    expect($scope.puzzle.solved()).toEqual(false);

    clickCell(0, 0);
    clickCell(0, 2);
    clickCell(1, 1);
    clickCell(1, 2);
    clickCell(2, 2);

    expect($scope.puzzle.solved()).toEqual(true);
  });
});
