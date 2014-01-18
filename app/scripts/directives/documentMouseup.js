'use strict';

angular.module('ngPicrossApp').directive('documentMouseup', function ($parse, $document) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var invoker = $parse(attrs.documentMouseup);
      $document.on('mouseup', function (event) {
        scope.$apply(function(){
          invoker(scope, {$event: event});
        });
      });
    }
  };
});
