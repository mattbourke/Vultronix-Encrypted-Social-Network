'use strict';
VultronixApp.service('sidebarService', ['$http',
  'myDataService',
  'loginService',
  'hashAndKeyGeneratorService',
  'mySocket',
  '$rootScope',
  '$location',
  'vaultService',
  'friendsService',
  '$window',
  function ($http, myDataService, loginService, hashAndKeyGeneratorService, mySocket, $rootScope, $location, vaultService, friendsService, $window) {
  let self = this;

  this.autoScrollChatboxToBottom = () => {
    // added a timer to ensure the DOM has updated
    let updateScrollBar = $window.setTimeout(() => {
      let chatbox       = document.getElementById("chat-bill");
      chatbox.scrollTop = chatbox.scrollHeight;
      clearTimeout(updateScrollBar);
    }, 0);
  };


  this.showHideNewMessageIcon = (show) => {
    if( show ){
      angular.element( document.getElementsByClassName( 'messageIcon' ) ).removeClass('newMessage');
      angular.element( document.getElementsByClassName( 'messageIcon' ) ).addClass('newMessage');
    }else{
      angular.element( document.getElementsByClassName( 'messageIcon' ) ).removeClass('newMessage');
    }
  };


  this.toggleUserTyping = (friendUUID, show) => {
    if( show ){
      angular.element( document.getElementById( friendUUID ) ).addClass('user-typing');
      angular.element( document.getElementById( friendUUID ) ).removeClass('user-typing');
      // user is in another tab or window minimized etc
      if( document.hidden ){
        audioTyping.play();
      }
    }else{
      angular.element( document.getElementById( friendUUID ) ).addClass('user-typing');
    }
  };

  this.toggleUnreadMessage = (myFriendshipUUID, show) => {
    // thought simply adding removing class is a bit simplified than toggling
    if( show ){
      angular.element( document.getElementById( myFriendshipUUID ) ).addClass('user-unread');
      angular.element( document.getElementById( myFriendshipUUID ) ).removeClass('user-unread');
    }else{
      angular.element( document.getElementById( myFriendshipUUID ) ).addClass('user-unread');
    }
  };

  // below is the chatbox code
  this.updateChat = (message, friendUUID, thumbnail) => {
    let newMessage = {
      message      : message,
      profileURL   : friendUUID,
      dateTime     : new Date().toISOString(),
      thumbnail    : thumbnail
    };

    $rootScope.conversationComments.push(newMessage);
    $rootScope.$apply();
    self.autoScrollChatboxToBottom();
  };

  this.playMessageSound = () => {
    if( document.hidden ){
      audioMessage.play();
    }
  };

  this.newMessage = (messageData, friend) => {
    let   show              = false;
    const currentChatFriend = $rootScope.currentChatFriend;
    // if chat window open.
    if( currentChatFriend !== undefined && currentChatFriend.myFriendshipUUID === messageData.myFriendshipUUID ){
      let decryptedMessage = vaultService.decrypt(messageData.message, friend.friendshipUUID);
      vaultService.decryptPGPMessage(decryptedMessage).then((decryptedPGPMessage) => {
        const message = decryptedPGPMessage;
        self.updateChat(message, friend.friendUUID, friend.thumbnail);
        self.toggleUnreadMessage(messageData.myFriendshipUUID, false);
        self.toggleUserTyping(friend.friendUUID, false);
        self.playMessageSound();
      }).catch((error) => {
        console.log(error);
      });

    }else{
      show = true;
      self.showHideNewMessageIcon(show);
      self.toggleUnreadMessage(messageData.myFriendshipUUID, show);
      self.toggleUserTyping(friend.friendUUID, false);
      self.playMessageSound();
    }
  };

}]);
