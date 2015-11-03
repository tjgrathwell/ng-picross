'use strict';

angular.module('ngPicrossApp', ['ngRoute']).config(function ($provide, $routeProvider, $locationProvider) {
  if (window.location.pathname.match(new RegExp("/ng-picross/"))) {
    // Emulate 'hashbang fallback mode' for gh-pages
    // http://stackoverflow.com/a/16678065
    $provide.decorator('$sniffer', ['$delegate', function($delegate) {
      $delegate.history = false;
      return $delegate;
    }]);
  }
  $locationProvider.html5Mode(true);

  $routeProvider.when('/', {
    templateUrl: 'app/views/home.html',
    controller: 'HomeCtrl'
  }).when('/puzzles/:id', {
    templateUrl: 'app/views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: function ($route, puzzleCatalogService) {
        return puzzleCatalogService.getPuzzle(parseInt($route.current.params.id, 10));
      }
    }
  }).when('/random', {
    templateUrl: 'app/views/puzzleBoard.html',
    controller: 'PuzzleBoardCtrl',
    resolve: {
      puzzle: function (puzzleCatalogService) {
        return puzzleCatalogService.generateRandomPuzzle();
      }
    }
  }).when('/settings', {
    templateUrl: 'app/views/settings.html',
    controller: 'SettingsCtrl',
  }).when('/solver/:puzzleId?', {
    templateUrl: 'app/views/puzzleSolver.html',
    controller: 'PuzzleSolverCtrl'
  }).when('/solver_benchmark', {
    templateUrl: 'app/views/puzzleSolverBenchmark.html',
    controller: 'PuzzleSolverBenchmarkCtrl'
  }).otherwise({
    redirectTo: '/'
  });
}).run(function ($rootScope, $location) {
  $rootScope.goHome = function () {
    $location.path('/');
  };
});
