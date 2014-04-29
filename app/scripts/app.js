'use strict';

angular.module('ngPicrossApp', ['ngRoute']).config(function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  }).when('/puzzles/:id', {
    templateUrl: '/views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: ['$route', 'puzzleService', function ($route, puzzleService) {
        return puzzleService.getPuzzle($route.current.params.id);
      }]
    }
  }).when('/random', {
    templateUrl: '/views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: ['puzzleService', function (puzzleService) {
        return puzzleService.generateRandomPuzzle();
      }]
    }
  }).otherwise({
    redirectTo: '/'
  });
});
