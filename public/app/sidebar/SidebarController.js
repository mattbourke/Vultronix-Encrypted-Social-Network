'use strict';
VultronixApp.controller('SidebarController',
  ['$scope',
  'inboxService',
  'friendsService',
  'loginService',
  '$routeParams',
  '$http',
  'myDataService',
  '$rootScope',
  'sidebarService',
  '$window',
  ($scope, inboxService, friendsService, loginService, $routeParams, $http, myDataService, $rootScope, sidebarService, $window) => {

  $scope.toggleChatbox = (friendUUID) => {
    $scope.$root.currentChatFriend    = friendsService.getFriendshipByFriendsUUID(friendUUID);
    const myFriendshipUUID            = $scope.$root.currentChatFriend.myFriendshipUUID;
    $scope.$root.conversationComments = [];
    inboxService.getMessagesByFriendship($scope.$root, friendUUID, true);
    sidebarService.toggleUnreadMessage(myFriendshipUUID, false);
    toggleChatbox();
    const element = $window.document.getElementById('chat-textbox');
    if( element ){
      element.focus();
    }
  };

  let init = () => {
    $scope.friends = friendsService.getFriendsList($scope, false);
  };


  // this is a quick fix..... to prevent the init firing on the home page
  $rootScope.$on("$routeChangeSuccess", (e, data) => {
    const template       = data.templateUrl;
    const homeTemplate   = 'app/home/home.html';
    const loginTemplate  = 'app/login/login.html';
    const signupTemplate = 'app/signup/signup.html';
    if( template !== homeTemplate && template !== loginTemplate && template !== signupTemplate){
      init();
      $scope.logoShow  = true;
    }else{
      $scope.logoShow  = true;
    }
  });

}]);
