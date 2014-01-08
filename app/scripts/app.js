'use strict';

var CellStates = {
  x: 'x',
  o: '',
  b: 'b'
};

angular.module('ngPicrossApp', ['ngRoute']).config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/main.html',
    controller: 'MainCtrl'
  }).otherwise({
    redirectTo: '/'
  });
});
