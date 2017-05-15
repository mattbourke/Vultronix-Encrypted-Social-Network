describe('FeedController', function () {

    var $routeScope;
    var $scope;
    var $controller;

    beforeEach(function(){
      module('VultronixApp','ngRoute');
      inject(function($injector){

        $rootScope = $injector.get('$rootScope');
        $scope     = $rootScope.$new();
        $rootScope = $injector.get('$controller')('FeedController',{$scope:$scope});
      });

    });


    describe('Initialization', function () {
        it('Init function should be called', function () {
            expect($scope.loadingFeed).toBe(true);
        });
    });


    describe('set articleId', function () {
        it('modifies the current articleID', function () {
            expect($scope.currentArticleId).toBe('');
            $scope.setArticleId('abc123');
            expect($scope.currentArticleId).toBe('abc123');
        });
    });

});