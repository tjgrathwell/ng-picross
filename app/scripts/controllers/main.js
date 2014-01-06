'use strict';

angular.module('ngPicrossApp').controller('MainCtrl', function ($scope) {
  var x = 'x';
  var o = '';
  
  $scope.puzzle = [
    [x, o, x],
    [o, x, x],
    [o, o, x],
  ];

  var rows = $scope.puzzle.length;
  var cols = $scope.puzzle[0].length;

  $scope.board = [];
  for (var i = 0; i < rows; i++) {
    var row = [];
    for (var j = 0; j < cols; j++) {
      row.push(o);
    }
    $scope.board.push(row);
  }

  var checkSolved = function () {
    return angular.equals($scope.puzzle, $scope.board);
  };

  var hintsForLine = function (line) {
    var run = 0;
    var hints = [];
    for (var i = 0; i < line.length; i++) {
      if (line[i] === 'x') {
        run += 1;
      } else if (run) {
        hints.push(run);
        run = 0;
      }
    }
    if (run) {
      hints.push(run);
    }

    return hints.length === 0 ? [0] : hints;
  };

  $scope.hintsForRow = function (rowIndex) {
    return hintsForLine($scope.puzzle[rowIndex]);
  };

  $scope.hintsForColumn = function (colIndex) {
    var col = [];
    for (var i = 0; i < $scope.puzzle.length; i++) {
      col.push($scope.puzzle[i][colIndex]);
    }
    return hintsForLine(col);
  };

  $scope.clickedCell = function (rowIndex, colIndex) {
    if ($scope.board[rowIndex][colIndex]) {
      $scope.board[rowIndex][colIndex] = o;
    } else {
      $scope.board[rowIndex][colIndex] = x;
    }
    $scope.solved = checkSolved();
  };
});
