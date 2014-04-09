describe('ng-picross', function() {
  beforeEach(function() {
    browser.get('/');
  });

  it('has a 3x3 puzzle to start with', function () {
    expect(element.all(by.css('.board .row')).count()).toEqual(3);
    expect(element.all(by.css('.board .cell')).count()).toEqual(9);
  });
});
