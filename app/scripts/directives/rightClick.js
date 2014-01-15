'use strict';

angular.module('ngPicrossApp').directive('rightClick', function ($parse) {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      var fn = $parse(attrs.rightClick || angular.noop);
      element.bind('contextmenu', function(event) {
        scope.$apply(function() {
          event.preventDefault();
          fn(scope, {$event:event});
        });
      });
    }
  };
});
