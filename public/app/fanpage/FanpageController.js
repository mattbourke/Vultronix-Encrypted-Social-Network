VultronixApp.controller('FanpageController', ['$scope',
  'loginService',
  '$routeParams',
  'fanpageService',
  'socketsService',
  ($scope, loginService, $routeParams, fanpageService, socketsService)=> {

  $scope.fanpageUUID   = $routeParams.fanpageUUID;
  $scope.statusMessage = 'Loading...';

  var init = ()=> {


  };

  init();
}]);