describe('ng-picross', function() {
  beforeEach(function() {
    browser.get('/');
    browser.executeScript('localStorage.setItem(\'settings\', \'{"hideTimers": true}\')');
  });

  describe("visiting the first puzzle", function () {
    beforeEach(function () {
      element.all(by.css(".puzzle-choices a")).first().click();
    });

    afterEach(printConsoleErrors);

    it('has a 3x3 puzzle to start with', function () {
      expect(element.all(by.css('.board .row')).count()).toEqual(3);
      expect(element.all(by.css('.board .cell')).count()).toEqual(9);
    });
  });
});

function printConsoleErrors () {
  browser.manage().logs().get('browser').then(function(browserLog) {
    var severeLogMessages = [];
    for (var i = 0; i < browserLog.length; i++) {
      var logEntry = browserLog[i];
      if (logEntry.level.value >= 1000) {
        severeLogMessages.push(logEntry);
      }
    }
    if (severeLogMessages.length > 0) {
      for (var j = 0; j < severeLogMessages.length; j++) {
        var severeLogMessage = severeLogMessages[j];
        console.log('log: ' + require('util').inspect(severeLogMessage));
        console.log("Log Message:");
        console.log(severeLogMessage.message);
      }

      throw new Error('There was a severe browser error, failing test!');
    }
  });
}
