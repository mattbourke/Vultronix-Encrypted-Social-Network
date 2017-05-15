'use strict';
VultronixApp.controller('HomeController', ['$rootScope',
 '$scope',
 'imageService',
 '$http',
 '$location',
  ($rootScope, $scope, imageService, $http, $location) => {
    $rootScope.showMobileMenu = false;
    $scope.homePage           = true;
    $scope.loginPage          = false;
    $scope.signupPage         = false;
    $scope.vLogo              = imageService.logo();

    let init = () => {
      $http({
        url: "/login/isLoggedOut",
        method: "get"
      }).success((data) => {
        const isSessionManagementEmpty = (sessionStorage.length <= 1) ? true : false;
        if(data.logoutStatus === false && ! isSessionManagementEmpty){
          $location.path('/feed/');
        } else {
          sessionStorage.clear();
        }
      }).error((error) => {
        console.log(error);
      });
    };

    init();
}]);