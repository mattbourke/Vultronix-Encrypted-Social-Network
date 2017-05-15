'use strict';
VultronixApp.service('socketsService', ['$http',
 'myDataService',
 'vaultService',
 'loginService',
 'hashAndKeyGeneratorService',
 'mySocket',
 '$rootScope',
 '$location',
 'sidebarService',
 'friendsService',
 'friendRequestService',
 'feedService',
 function ($http, myDataService, vaultService, loginService, hashAndKeyGeneratorService, mySocket, $rootScope, $location, sidebarService, friendsService, friendRequestService, feedService) {

  mySocket.on('connection', () => {
    const currentPath = $location.path();
    if( currentPath !== "/home"){
      myDataService.setMyData('onlineFriends', null);
      friendsService.getFriendsList({}, true);
    }
  });

  mySocket.on('userTyping', (messageData) => {
    if( messageData && messageData.length ){
      const friendUUID  = friendsService.getFriendshipByMyFriendshipUUID(messageData).friendUUID;
      sidebarService.toggleUserTyping(friendUUID, true);
      setTimeout(() =>{ sidebarService.toggleUserTyping(friendUUID, false); }, 4000);
    }
  });


  mySocket.on('messageReceived', (messageData) => {
    if( messageData.myFriendshipUUID && messageData.myFriendshipUUID.length ){
      const friend  = friendsService.getFriendshipByMyFriendshipUUID(messageData.myFriendshipUUID);
      sidebarService.newMessage(messageData, friend);
    }
  });

  mySocket.on('updateOnlineFriends', (data) => {
    if( data.onlineFriends[0] !== undefined && data.onlineFriends[0].length ){
      myDataService.setMyData('onlineFriends', JSON.stringify(data.onlineFriends));
    }
    // empty object is just a hack for $scope not being passed in.
    friendsService.getFriendsList({});
  });

  mySocket.on('updateFriendToOnline', (friendsUUID) => {
    const friendUUID  = friendsService.getFriendshipByMyFriendshipUUID(friendsUUID).friendUUID;
    let onlineFriends = JSON.parse(myDataService.getMyData('onlineFriends'));
    if( onlineFriends === null ){
      onlineFriends = [];
    }
    if( document.hidden ){
      audioUserOnline.play();
    }
    if( friendUUID !== undefined && friendUUID.length && onlineFriends.indexOf(friendUUID) === -1){
      onlineFriends.push(friendUUID);
      myDataService.setMyData('onlineFriends', JSON.stringify(onlineFriends));
    }
    // empty object is just a hack for $scope not being passed in.
    friendsService.getFriendsList({});
  });

  mySocket.on('updateOnlineFriendToOffline', (friendsUUID) => {
    const friendUUID  = friendsService.getFriendshipByMyFriendshipUUID(friendsUUID).friendUUID;
    let onlineFriends = JSON.parse(myDataService.getMyData('onlineFriends'));
    if( onlineFriends !== null && friendUUID !== undefined && friendUUID.length ){
      let onlineFriendsUpdated = onlineFriends.filter((element) => {
        return element !== friendUUID;
      });
      myDataService.setMyData('onlineFriends', JSON.stringify(onlineFriendsUpdated));
      // empty object is just a hack for $scope not being passed in.
      friendsService.getFriendsList({}, true);
    }
  });

  mySocket.on('friendRequestAccepted', () => {
    friendRequestService.getFriendRequestTokensCount().then(() => {
      friendRequestService.getAcceptedFriendRequests();
    });
  });

  mySocket.on('friendProfileUpdated', () => {
    feedService.showHideNewFeedStatusIcon(true);
  });

  mySocket.on('friendProfileImageUpdated', () => {
    feedService.showHideNewFeedStatusIcon(true);
  });


  mySocket.on('friendHeaderImageUpdated', () => {
    feedService.showHideNewFeedStatusIcon(true);
  });


  mySocket.on('friendStatusReceived', () => {
    feedService.showHideNewFeedStatusIcon(true);
  });


  mySocket.on('friendBiographyReceived', () => {
    feedService.showHideNewFeedStatusIcon(true);
  });

  mySocket.on('friendPhotoAlbumUpdated', () => {
    feedService.showHideNewFeedStatusIcon(true);
  });


}]);