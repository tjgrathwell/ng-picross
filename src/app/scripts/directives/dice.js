'use strict';

angular.module('ngPicrossApp').directive('dice', function ($document) {
  return {
    restrict: 'E',
    templateUrl: 'app/views/directives/dice.html',
    link: function (scope, element, attrs) {
    }
  };
});
