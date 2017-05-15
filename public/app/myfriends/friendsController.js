'use strict';
VultronixApp.controller('friendsController', ['$scope',
  'friendsService',
  'loginService',
  '$routeParams',
  '$window',
  'socketsService',
  ($scope, friendsService, loginService, $routeParams, $window, socketsService) => {

    $scope.loading       = true;
    $scope.statusMessage = 'Loading...';

    let init = () => {
      $scope.friends = friendsService.getFriendsList($scope, false);
      friendsService.removeNewFriendIcon();
    };

    init();

    $scope.deleteFriend = (friendUUID) => {
      if ($window.confirm('Are you sure you want to delete this friend?')) {
        friendsService.deleteFriend($scope, friendUUID);
      }
    };

}]);