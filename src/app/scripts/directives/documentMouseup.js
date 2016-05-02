'use strict';

angular.module('ngPicrossApp').directive('documentMouseup', function ($parse, $document) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var invoker = $parse(attrs.documentMouseup);
      var onMouseup = function (event) {
        scope.$apply(function(){
          invoker(scope, {$event: event});
        });
      };

      $document.on('mouseup', onMouseup);

      scope.$on('$destroy', function () {
        $document.off('mouseup', onMouseup);
      });
    }
  };
});
