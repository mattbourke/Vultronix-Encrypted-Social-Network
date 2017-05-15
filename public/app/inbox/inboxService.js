'use strict';
VultronixApp.service('inboxService',['loginService',
  '$http',
  'friendsService',
  'hashAndKeyGeneratorService',
  'vaultService',
  'myDataService',
  'sidebarService',
  '$q',
  '$window',
  function (loginService, $http, friendsService, hashAndKeyGeneratorService, vaultService, myDataService, sidebarService, $q, $window) {

  this.showHideNewMessageIcon = (show) => {
    if ( show ){
      angular.element( document.getElementsByClassName( 'messageIcon' ) ).removeClass('newMessage');
      angular.element( document.getElementsByClassName( 'messageIcon' ) ).addClass('newMessage');
    }else{
      angular.element( document.getElementsByClassName( 'messageIcon' ) ).removeClass('newMessage');
    }
  };

  this.getConversationHeaders = (decryptingMessage) => {
    // TODO: workout a much better way to do this, once we have a big bunch of friends it'll be a big bunch of data.
    // however we don't want to simply have one friendshipUUID that you share with all your friends.
    const myFriendshipUUIDTokensArray = friendsService.getMyFriendshipUUIDTokensArray();
    return $q((resolve, reject) => {
      $http({
        url: "/inbox/getConversationHeaders",
        method: "get",
        params:{"tokens":myFriendshipUUIDTokensArray}
      }).success((data) => {
        loginService.loginValidate(data);
        if ( data.length ){
          if ( decryptingMessage ){
            decryptingMessage();
          }
          let unreadMessages = 0;
          angular.forEach(data, (item) => {
            let friendshipData        = friendsService.getFriendshipByMyFriendshipUUID(item.receiverUUID);
            if ( friendshipData !== undefined ){
              const friendsThumb      = friendshipData.thumbnail;
              const friendsName       = friendshipData.name;

              item.dateTime           = item.createdDate;
              item.lastSent           = moment(item.createdDate).fromNow();
              item.unread             = item.unread;
              item.authorName         = friendsName;
              item.authorThumb        = friendsThumb;
              item.authorUUID         = friendshipData.friendUUID;
              unreadMessages = ( item.unread )?unreadMessages+1:unreadMessages;
            }
          });
          self.showHideNewMessageIcon( unreadMessages );
        }else{
          data = [];
        }
        return resolve(data);
      }).error((data) => {
        reject(data);
      });
    });

  };


  let _emojiRun = () => {
    // let's delay a few ms adding to eventloop to ensure DOM is ready
    let updateEmojis = $window.setTimeout(() => {
      let elementsArray = document.getElementsByClassName("emoji-text");
      angular.forEach(elementsArray, (item) => {
        emojify.run(item);
      });
      clearTimeout(updateEmojis);
    }, 300);
  };

  // the below function takes $scope as an argument, this should be considered an anti-pattern for a service.
  // plan is to move the loop out of here, split up to promises, call and loop from controller
  this.getMessagesByFriendship = ($scope, friendUUID, isFromChat, commentsMoreButtonTimestamp) => {
    const friendshipData          = friendsService.getFriendshipByFriendsUUID(friendUUID);
    const friendsThumb            = friendshipData.thumbnail;
    const friendsName             = friendshipData.name;
    const friendshipDecryptionKey = friendshipData.friendshipUUID;
    const myThumb                 = myDataService.getMyData('profileImage');
    const myName                  = myDataService.getMyData('name');
    let   currentTimestamp        = moment().toISOString();
    const oldestCommentsTime      = ( commentsMoreButtonTimestamp === undefined)?currentTimestamp:commentsMoreButtonTimestamp;
    $http({
      url: "/inbox/getMessagesByFriendship",
      method: "get",
      params:{"UUID":friendshipData.myFriendshipUUID, "oldestCommentsTime": oldestCommentsTime}
    }).success((data) => {
        loginService.loginValidate(data);
        if ( ! data.empty ){
          $scope.statusMessage = 'Decrypting '+ data.length  +' messages';
          $scope.loading       = true;
          let loopLength       = data.length - 1;
          angular.forEach(data, (item, key) => {
            const decryptedMessage    = vaultService.decrypt(item.message, friendshipDecryptionKey);
            const senderUUIDDecrypted = vaultService.decrypt(item.senderUUID, friendshipDecryptionKey);

            vaultService.decryptPGPMessage(decryptedMessage).then((decryptedPGPMessage) => {
              // the key may end up out of synch due to the promise, but for now it isn't an issue and hasn't been seen.
              let count            = key+1;
              $scope.statusMessage = 'Decrypting message '+ count +' of '+ data.length  +' messages';
              $scope.loading       = true;
              item.dateTime        = item.createdDate;
              item.createdDate     = moment(item.createdDate).fromNow();
              item.authorName      = ( senderUUIDDecrypted === friendUUID )?friendsName :myName;
              item.thumbnail       = ( senderUUIDDecrypted === friendUUID )?friendsThumb:myThumb;
              item.profileURL      = ( senderUUIDDecrypted === friendUUID )?'#/friendsprofile/'+senderUUIDDecrypted+'/feed/':'#/myprofile';
              item.authorUUID      = senderUUIDDecrypted;
              item.message         = decryptedPGPMessage;
              $scope.conversationComments.push(item);
              if (item.dateTime < currentTimestamp) {
                currentTimestamp                         = item.dateTime;
                $scope.$root.commentsMoreButtonTimestamp = currentTimestamp;
              }
              if (key >= loopLength){
                $scope.loading = false;
                if (!isFromChat) {
                  scrollCommentsToBottom();
                }
              }
              $scope.$apply();
              if (isFromChat){
                sidebarService.autoScrollChatboxToBottom();
              }
              _emojiRun();
            }).catch((error) => {
              $scope.statusMessage = 'Error';
              // failure
              console.log(error);
            });
          });
          self.getConversationHeaders();
        } else {
          $scope.loading                = false;
          $scope.showCommentsMoreButton = false;
        }
    }).error((data) => {
      console.log(data);
    });
  };

  let scrollCommentsToBottom = () => {
    window.scrollTo(0,document.body.scrollHeight);
  };

  this.encryptMessageToFriend = (friendshipData, message, myFriendshipUUIDEncrypted, friendshipEncryptionKey) => {
    return $q((resolve, reject) => {
      vaultService.encrypToPGPKey(message, friendshipData.publicPGP).then((pgpMessage) => {
        const encryptedMessage      = pgpMessage.replace(/(?:\r\n|\r|\n)/g, 'linebreak');
        const newMessageForFriend   = {
          messageUUID  : hashAndKeyGeneratorService.getUUID(),
          receiverUUID : friendshipData.friendUUID,
          senderUUID   : myFriendshipUUIDEncrypted,
          message      : vaultService.encrypt(encryptedMessage, friendshipEncryptionKey)
        };
        resolve(newMessageForFriend);
      }).catch((error) => {
        return reject(error);
      });
    });
  };

  this.encryptMessageCopyToMe = (friendshipData, myName, myFriendshipUUIDEncrypted, message, friendshipEncryptionKey) => {
    return $q((resolve, reject) => {
      vaultService.encrypToPGPKey(message).then((pgpMessage) => {
        const myCopyOfencryptedMessage = pgpMessage.replace(/(?:\r\n|\r|\n)/g, 'linebreak');
        const newMessageUUID           = hashAndKeyGeneratorService.getUUID();
        const messageMyCopy            = {
          messageUUID  : newMessageUUID,
          receiverUUID : friendshipData.myFriendshipUUID,
          senderUUID   : myFriendshipUUIDEncrypted,
          message      : vaultService.encrypt(myCopyOfencryptedMessage, friendshipEncryptionKey)
        };

        const datenow    = new Date().getTime();
        const newMessage = {
          messageUUID  : newMessageUUID,
          receiverUUID : friendshipData.friendUUID,
          senderUUID   : friendshipData.myFriendshipUUID,
          message      : message,
          authorName   : myName,
          thumbnail    : myDataService.getMyData('profileImage'),
          createdDate  : moment(datenow).fromNow(),
          dateTime     : new Date().toISOString()
        };
        const messagesData = {
          "newMessage"    : newMessage,
          "messageMyCopy" : messageMyCopy
        };

        return resolve(messagesData);
      }).catch((error) => {
        console.log(error);
        return reject(error);
      });
    });
  };


  this.submitConversationMessage = (messageData, isFromChat) => {
    return $q((resolve, reject) => {
      $http.post('/inbox/createConversationMessage', JSON.stringify(messageData)).success((response) => {
        if (response === "success"){
          loginService.loginValidate(response);
          if (isFromChat){
            sidebarService.autoScrollChatboxToBottom();
          }
          _emojiRun();
          resolve('success');
        }else{
          console.log(response);
          reject('failure');
        }
      }).catch((error) => {
        console.log(error);
        reject('failure');
      });
    });
  };

  this.sendUserTyping = (friendUUID) =>{
    const data = { friendUUID: friendUUID};
    $http.post('/inbox/sendUserTyping', JSON.stringify(data)).success(() => {

    }).catch((error) => {
      console.log('sendUserTyping error');
      console.log(error);
    });
  };

  let self = this;
}]);