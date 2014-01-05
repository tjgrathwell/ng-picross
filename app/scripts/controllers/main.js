'use strict';

angular.module('ngPicrossApp').controller('MainCtrl', function ($scope) {
  var rows = 15;
  var cols = 15;
  $scope.board = [];
  for (var i = 0; i < rows; i++) {
    var row = [];
    for (var j = 0; j < cols; j++) {
      row.push('');
    }
    $scope.board.push(row);
  }

  $scope.clickedCell = function (rowIndex, colIndex) {
    if ($scope.board[rowIndex][colIndex]) {
      $scope.board[rowIndex][colIndex] = '';
    } else {
      $scope.board[rowIndex][colIndex] = 'x';
    }
  };
});
