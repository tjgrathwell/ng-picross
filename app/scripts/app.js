'use strict';

angular.module('ngPicrossApp', ['ngRoute']).config(function ($provide, $routeProvider, $locationProvider) {
  if (window.location.pathname.match(/\/ng-picross\//)) {
    // Emulate 'hashbang fallback mode' for gh-pages
    // http://stackoverflow.com/a/16678065
    $provide.decorator('$sniffer', ['$delegate', function($delegate) {
      $delegate.history = false;
      return $delegate;
    }]);
  }
  $locationProvider.html5Mode(true);

  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  }).when('/puzzles/:id', {
    templateUrl: 'views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: ['$route', 'puzzleCatalogService', function ($route, puzzleCatalogService) {
        return puzzleCatalogService.getPuzzle(parseInt($route.current.params.id, 10));
      }]
    }
  }).when('/random', {
    templateUrl: 'views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: ['puzzleCatalogService', function (puzzleCatalogService) {
        return puzzleCatalogService.generateRandomPuzzle();
      }]
    }
  }).when('/solver/:puzzleId?', {
    templateUrl: 'views/puzzleSolver.html',
    controller: 'PuzzleSolverCtrl'
  }).when('/solver_benchmark', {
    templateUrl: 'views/puzzleSolverBenchmark.html',
    controller: 'PuzzleSolverBenchmarkCtrl'
  }).otherwise({
    redirectTo: '/'
  });
}).run(function ($rootScope, $location) {
  $rootScope.goHome = function () {
    $location.path('/');
  };
});
