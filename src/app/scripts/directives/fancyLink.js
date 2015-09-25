'use strict';

angular.module('ngPicrossApp').directive('fancyLink', function ($location, $sniffer) {
  return {
    restrict: 'A',
    priority: 101, // Run before href/ng-href
    link: function(scope, element, attr) {
      attr.$observe('fancyLink', function(value) {
        if (!value) {
          attr.$set('href', null);
          return;
        }

        var prefix = $sniffer.history ? '' : '#/';
        attr.$set('href', prefix + value);
      });

      element.on('click', function(event) {
        if (event.which === 1 && !(event.shiftKey || event.altKey || event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          scope.$apply(function () {
            var normalizedUrl = attr.href;
            if (!$sniffer.history) {
              normalizedUrl = normalizedUrl.replace('#/', '');
            }
            $location.path('/' + normalizedUrl);
          });
        }
      });
    }
  };
});
