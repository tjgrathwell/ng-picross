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
        return puzzleCatalogService.getPuzzle($route.current.params.id);
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
  }).otherwise({
    redirectTo: '/'
  });
}).run(function ($rootScope, $location) {
  $rootScope.goHome = function () {
    $location.path('/');
  };
});
