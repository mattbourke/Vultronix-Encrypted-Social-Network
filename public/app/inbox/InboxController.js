'use strict';
VultronixApp.controller('InboxController', ['$scope',
  '$timeout',
  'inboxService',
  'loginService',
  '$routeParams',
  '$rootScope',
  'friendsService',
  'myDataService',
  'mySocket',
  'socketsService',
  'vaultService',
  ($scope, $timeout, inboxService, loginService, $routeParams, $rootScope, friendsService, myDataService, mySocket, socketsService, vaultService) => {

  $scope.conversationDivShow    = false;
  $scope.tab                    = 'a';
  $scope.newMessageText         = "";
  $scope.showCommentsMoreButton = true;

  let decryptingMessage = () => {
    $scope.statusMessage = 'Decrypting';
  };

  let init = () => {
    $scope.friends                           = friendsService.getFriendsList($scope, false);
    $scope.myThumb                           = myDataService.getMyData('profileImage');
    $scope.loading                           = true;
    $scope.statusMessage                     = 'Loading';
    $scope.$root.commentsMoreButtonTimestamp = moment().toISOString();
    $scope.messageConversationHeaders = inboxService.getConversationHeaders(decryptingMessage).then((data) => {
      $scope.messageConversationHeaders = data;
      $scope.loading                    = false;
    });
  };

  init();

  $scope.showConversation = (friendUUID) => {
    const commentsMoreButtonTimestamp           = $scope.$root.commentsMoreButtonTimestamp;
    const isFromChat                            = false;
    $scope.statusMessage                        = 'Loading';
    $scope.loading                              = true;
    $scope.conversationComments                 = [];
    $scope.currentFriend                        = friendUUID;
    $scope.$root.currentInboxCommentsFriendUUID = friendUUID;
    inboxService.getMessagesByFriendship($scope, friendUUID, isFromChat, commentsMoreButtonTimestamp);
    $scope.tab                                  = 'c';
  };

  $scope.processCommentsMoreButton = (friendUUID) => {
    const commentsMoreButtonTimestamp = $scope.$root.commentsMoreButtonTimestamp;
    const isFromChat                  = false;
    $scope.statusMessage              = 'Loading';
    $scope.loading                    = true;
    $scope.currentFriend              = friendUUID;
    inboxService.getMessagesByFriendship($scope, friendUUID, isFromChat, commentsMoreButtonTimestamp);
    $scope.tab                        = 'c';
  };

  $scope.newConversationMessage = () => {
    if ( $scope.newMessageText !== undefined && ! $scope.newMessageText.length ) {
      return false;
    }else if ( $scope.newMessageText !== undefined ) {
      const message                   = $scope.newMessageText;
      const myName                    = vaultService.getMyData('name');
      const friendshipData            = friendsService.getFriendshipByFriendsUUID($scope.currentFriend);
      const friendshipEncryptionKey   = friendshipData.friendshipUUID;
      const myFriendshipUUIDEncrypted = vaultService.encrypt(friendshipData.myFriendshipUUID, friendshipEncryptionKey);
      let messageForFriend;
      let newMessage;

      inboxService.encryptMessageToFriend(friendshipData, message, myFriendshipUUIDEncrypted, friendshipEncryptionKey).then((newMessageForFriend) => {
        messageForFriend = newMessageForFriend;
        return inboxService.encryptMessageCopyToMe(friendshipData, myName, myFriendshipUUIDEncrypted, message, friendshipEncryptionKey);
      }).then((data) => {
        newMessage       = data.newMessage;
        $scope.conversationComments.push(newMessage);
        $scope.newMessageText = "";
        const messageData     = {
          "newMessageForFriend" : messageForFriend,
          "messageMyCopy"       : data.messageMyCopy
        };
        return inboxService.submitConversationMessage(messageData);
      }).then((status) => {
        if ( status === "success" ) {
          $scope.newMessageText = "";
        }else{
          $scope.conversationComments.pop();
          $scope.newMessageText = message;
          //TODO: create something a little more glorious
          alert('error sending message, try again');
        }
      });
    }else{
      alert('Please limit characters to letters and numbers');
    }
  };

  $scope.showWelcomeDiv = () => {
    $scope.showCommentsMoreButton            = true;
    $scope.statusMessage                     = 'Loading';
    $scope.loading                           = true;
    $scope.$root.commentsMoreButtonTimestamp = moment().toISOString();
    $scope.messageConversationHeaders = inboxService.getConversationHeaders(decryptingMessage).then((data) => {
      $scope.messageConversationHeaders = data;
      $scope.loading                    = false;
    });
    $scope.conversationComments = [];
  };

}]);
