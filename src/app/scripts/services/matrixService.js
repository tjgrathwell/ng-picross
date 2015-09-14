'use strict';

angular.module('ngPicrossApp').service('matrixService', function () {
  this.col = function (matrix, colIndex) {
    var col = [];
    for (var i = 0; i < matrix.length; i++) {
      if (matrix[i]) {
        col.push(matrix[i][colIndex]);
      } else {
        col.push(null);
      }
    }
    return col;
  };

  this.row = function (matrix, rowIndex) {
    return matrix[rowIndex];
  };
});
