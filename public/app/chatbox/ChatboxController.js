'use strict';
VultronixApp.controller('ChatboxController', ['$scope',
  'inboxService',
  '$rootScope',
  'socketsService',
  'vaultService',
  'friendsService',
  ($scope, inboxService, $rootScope, socketsService, vaultService, friendsService) => {
  $scope.newMessageText = "";
  $scope.typingActive   = false;

  $scope.toggleChatbox = () => {
    $rootScope.conversationComments = [];
    $rootScope.currentChatFriend    = {};
    toggleChatbox();
  };

  $scope.newChatMessage = () => {
    let friendUUID = $scope.$root.currentChatFriend.friendUUID;
    let message    = $scope.newMessageText;
    if ( message !== undefined && friendUUID.length && message.length){
      let myName                    = vaultService.getMyData('name');
      let friendshipData            = friendsService.getFriendshipByFriendsUUID(friendUUID);
      let friendshipEncryptionKey   = friendshipData.friendshipUUID;
      let myFriendshipUUIDEncrypted = vaultService.encrypt(friendshipData.myFriendshipUUID, friendshipEncryptionKey);
      let messageForFriend;
      let newMessage;

      inboxService.encryptMessageToFriend(friendshipData, message, myFriendshipUUIDEncrypted, friendshipEncryptionKey).then((newMessageForFriend) =>{
        messageForFriend = newMessageForFriend;
        return inboxService.encryptMessageCopyToMe(friendshipData, myName, myFriendshipUUIDEncrypted, message, friendshipEncryptionKey);
      }).then((data) =>{
        newMessage            = data.newMessage;
        $scope.conversationComments.push(newMessage);
        $scope.newMessageText = "";
        let messageData       = {
          "newMessageForFriend" : messageForFriend,
          "messageMyCopy"       : data.messageMyCopy
        };
        let isFromChatBox = true;
        return inboxService.submitConversationMessage(messageData,isFromChatBox);
      }).then((status) =>{
        if ( status === "success" ){
          $scope.newMessageText = "";
        }else{
          $scope.conversationComments.pop();
          $scope.newMessageText = message;
          // create something a little more glorious
          alert('error sending message, try again');
        }
      });
    }else{
      alert('Please limit characters to letters and numbers');
      return false;
    }
  };

  $scope.userTyping = () => {
    const friendUUID = $scope.$root.currentChatFriend.friendUUID;
    if ( $scope.newMessageText !== undefined && friendUUID.length && $scope.newMessageText.length > 1 && ! $scope.typingActive ){
      $scope.typingActive = true;
      inboxService.sendUserTyping(friendUUID);
      setTimeout(() =>{ $scope.typingActive = false; }, 5000);
    }
  };

}]);
