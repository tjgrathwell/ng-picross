'use strict';

var x = 'x';
var o = '';

angular.module('ngPicrossApp', ['ngRoute']).config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/main.html',
    controller: 'MainCtrl'
  }).otherwise({
    redirectTo: '/'
  });
});
