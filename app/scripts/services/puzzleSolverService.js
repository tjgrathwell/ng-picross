'use strict';

angular.module('ngPicrossApp').service('puzzleSolverService', function (constantsService, matrixService, puzzleService) {
  var CellStates = constantsService.CellStates;

  function isSolved (hints, puzzleBoard) {
    for (var i = 0; i < hints.rows.length; i++) {
      var rowHint = hints.rows[i];
      var computedRowHints = puzzleService.hintsForLine(matrixService.row(puzzleBoard, i));
      if (!_.isEqual(rowHint, _.pluck(computedRowHints, 'value'))) {
        return false;
      }
    }

    for (var j = 0; j < hints.cols.length; j++) {
      var colHint = hints.cols[j];
      var computedColHints = puzzleService.hintsForLine(matrixService.col(puzzleBoard, j));

      if (!_.isEqual(colHint, _.pluck(computedColHints, 'value'))) {
        return false;
      }
    }

    return true;
  }

  function bruteForce (hints, puzzleMatrix, i, j) {
    if ((i === puzzleMatrix.length - 1) && (j === puzzleMatrix[0].length - 1)) {
      return isSolved(hints, puzzleMatrix) ? puzzleMatrix : null;
    }

    if (j === puzzleMatrix[0].length - 1) {
      j = 0;
      i += 1;
    } else {
      j += 1;
    }

    var results = [CellStates.x, CellStates.o].map(function (cellState) {
      var clone = JSON.parse(JSON.stringify(puzzleMatrix));
      clone[i][j] = cellState;
      return bruteForce(hints, clone, i, j);
    });

    return _.find(results, function (result) { return result; });
  }

  this.solvePuzzle = function (hints) {
    var board1 = Array.apply(null, new Array(hints.rows.length)).map(function () {
      return Array.apply(null, new Array(hints.cols.length)).map(function () {
        return null;
      });
    });
    board1[0][0] = CellStates.o;

    var board2 = JSON.parse(JSON.stringify(board1));
    board2[0][0] = CellStates.x;

    return bruteForce(hints, board1, 0, 0) || bruteForce(hints, board2, 0, 0);
  };
});
