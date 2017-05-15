'use strict';
VultronixApp.controller('LogoutController', ['$scope',
  '$http',
  '$location',
  'vaultService',
  'mySocket',
  '$rootScope',
  ($scope, $http, $location, vaultService, mySocket, $rootScope)=> {

  let init = () => {
    const logoutData = {
        logMe:"the fuck out"
    };

    $http.post('/logout/logout', JSON.stringify(logoutData)).success((response) => {
      if (response.logoutStatus === "success") {
        sessionStorage.clear();
        $rootScope.conversationComments = [];
        $rootScope.currentChatFriend    = {};
        mySocket.emit('loggedOff');
        $location.path('/home');
      }
    }).error(() => {
      alert('Issue logging out, please try again');
    });
  };

  init();
}]);
