'use strict';

var CellStates = {
  x: 'x',
  o: '',
  b: 'b'
};

var Button = {
  LEFT: 0,
  RIGHT: 2
};

angular.module('ngPicrossApp', ['ngRoute']).config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/main.html',
    controller: 'MainCtrl'
  }).otherwise({
    redirectTo: '/'
  });
});
