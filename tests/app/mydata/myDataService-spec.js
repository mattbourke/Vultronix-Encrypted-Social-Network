describe('myDataService', function () {

    var $routeScope;
    var $scope;
    var $service;
    var myDataService;

    beforeEach(function(){
      module('VultronixApp','ngRoute');
      inject(function($injector, _myDataService_){
        myDataService = _myDataService_;
      });
    });

    afterEach(function(){
        sessionStorage.clear();
    });


    describe('setMyData function', function () {
        it('should set a variable to the browsers sessionStorage', function () {
            myDataService.setMyData('test', 'yolo');
            expect(myDataService.getMyData('test')).toBe('yolo');
        });
    });

    describe('getMyData function', function () {
        it('should return a null value when value does not exist', function () {
            expect(myDataService.getMyData('test')).toBe(null);
        });
    });

    describe('deleteCredentials function', function () {
        it('should completely clear the sessionStorage', function () {
            myDataService.setMyData('test', 'yolo');
            myDataService.deleteCredentials();
            expect(myDataService.getMyData('test')).toBe(null);
        });
    });


});