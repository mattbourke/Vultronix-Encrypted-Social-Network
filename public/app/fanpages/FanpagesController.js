VultronixApp.controller('FanpagesController', ['$scope',
 'loginService',
 '$routeParams',
 'fanpagesService',
  ($scope, loginService, $routeParams, fanpagesService)=> {

  $scope.fanpageUUID   = $routeParams.fanpageUUID;
  $scope.statusMessage = 'Loading...';

  let init = ()=> {



  };

  init();
}]);