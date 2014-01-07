'use strict';

describe('Service: puzzleService', function () {
  beforeEach(module('ngPicrossApp'));

  var puzzleService;
  beforeEach(inject(function (_puzzleService_) {
    puzzleService = _puzzleService_;
  }));

  it('should do something', function () {
    expect(!!puzzleService).toBeTruthy();
  });
});
