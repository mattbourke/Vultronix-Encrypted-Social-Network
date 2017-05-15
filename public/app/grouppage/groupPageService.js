'use strict';
VultronixApp.service('groupPageService', ['$http',
  'myDataService',
  'vaultService',
  'loginService',
  'hashAndKeyGeneratorService',
  '$q',
  '$window',
  function ($http, myDataService, vaultService, loginService, hashAndKeyGeneratorService, $q, $window) {
  let groupLookup  = {};
  let memberLookup = {};
  let self         = this;

  this.emojiRun = () => {
    // let's delay a few ms to ensure DOM is ready
    let updateEmojis = $window.setTimeout(() => {
      let elementsArray = document.getElementsByClassName("emoji-text");
      angular.forEach(elementsArray, (item) => {
        emojify.run(item);
      });
      clearTimeout(updateEmojis);
    }, 300);
  };

  this.getMembers = (groupUUID) => {
    const encryptionKey = this.getGroupByUUID(groupUUID).encryptionKey;
    memberLookup        = {};
    return $q((resolve, reject) => {
      $http({
        url: "/groups/getGroupMembers",
        method: "get",
        params:{"groupUUID": groupUUID}
      }).success((data) => {
        loginService.loginValidate(data);
        if (data.length){

          data.forEach((entry) => {
            entry.memberUUID      = vaultService.decrypt(entry.memberUUID      , encryptionKey);
            entry.memberName      = vaultService.decrypt(entry.memberName      , encryptionKey);
            entry.memberThumb     = vaultService.decrypt(entry.memberThumb     , encryptionKey);
            entry.memberPublicPGP = vaultService.decrypt(entry.memberPublicPGP , encryptionKey);
          });
        }

        myDataService.setMyData('memberList', JSON.stringify(data));
        resolve(data);

      }).error((data) => {
        reject(data);
      });
    });
  };

  this.getThreads = (groupUUID, currentLoadedThreadCount = 0) => {
    const encryptionKey = this.getGroupByUUID(groupUUID).encryptionKey;

    return $q((resolve, reject) => {
      $http({
        url: "/groups/getThreads",
        method: "get",
        params: {"groupUUID": groupUUID, "currentLoadedCount": currentLoadedThreadCount}
      }).success((data) => {
        loginService.loginValidate(data);
        if (data.length){
          data.forEach((entry) => {
            entry.threadUUID      = entry.threadUUID;
            entry.threadTitle     = vaultService.decrypt(entry.threadTitle, encryptionKey);
            entry.dateTime        = entry.createdDate;
            entry.createdDate     = moment(entry.createdDate).fromNow();
            entry.authorUUID      = vaultService.decrypt(entry.authorUUID , encryptionKey);
          });
        } else {
          data = [];
        }

      resolve(data);
      self.emojiRun();
      }).error((data, status) => {
        reject(status);
      });
    });
  };


  this.createNewThread = (threadTitle, groupUUID) => {
    const encryptionKey      = this.getGroupByUUID(groupUUID).encryptionKey;
    const newThreadUUID      = hashAndKeyGeneratorService.getUUID();
    const newEncryptedThread = {
      groupUUID   : groupUUID,
      threadUUID  : newThreadUUID,
      threadTitle : vaultService.encrypt(threadTitle , encryptionKey),
      authorUUID  : vaultService.encrypt('authorUUID', encryptionKey)
    };
    const newThread          = {
      groupUUID   : groupUUID,
      threadUUID  : newThreadUUID,
      threadTitle : threadTitle,
      createdDate : moment(new Date().getTime()).fromNow(),
      dateTime    : new Date().toISOString(),
      authorUUID  : 'authorUUID'
    };

    return $q((resolve, reject) => {
      $http.post('/groups/createThread', JSON.stringify(newEncryptedThread)).success((response) => {
        loginService.loginValidate(response);
        if (response !== "success"){
          reject(response);
        } else {
          resolve(newThread);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  };


  this.getGroupThreadComments = (groupUUID, threadUUID, currentLoadedThreadDiscussionsCount = 0) => {
    const encryptionKey = this.getGroupByUUID(groupUUID).encryptionKey;
    return $q((resolve, reject) => {
      $http({
        url: "/groups/groupThreadMessages",
        method: "get",
        params: {"threadUUID": threadUUID , "currentLoadedCount": currentLoadedThreadDiscussionsCount}
      }).success((data) => {
        loginService.loginValidate(data);
        if (data.length){
          data.forEach((entry) => {
            entry.threadUUID    = entry.threadUUID;
            entry.messageUUID   = vaultService.decrypt(entry.messageUUID  , encryptionKey);
            entry.threadMessage = vaultService.decrypt(entry.threadMessage, encryptionKey);
            entry.authorUUID    = vaultService.decrypt(entry.authorUUID   , encryptionKey);
            entry.authorName    = self.getMemberByUUID(entry.authorUUID).memberName;
            entry.authorThumb   = self.getMemberByUUID(entry.authorUUID).memberThumb;
            entry.Datetime      = entry.createdDate;
            entry.createdDate   = moment(entry.createdDate).fromNow();
          });
        } else {
          data = [];
        }

        resolve(data);
        self.emojiRun();
      }).error((data) => {
        reject(data);
      });
    });

  };

  this.createNewThreadComment = (comment, groupUUID, currentThread) => {
    const encryptionKey     = this.getGroupByUUID(groupUUID).encryptionKey;
    let newMessageUUID      = hashAndKeyGeneratorService.getUUID();
    let threadUUID          = currentThread;
    let myUUID              = vaultService.getMyData('userUUID');
    let myGroupUUID         = hashAndKeyGeneratorService.getHash256(encryptionKey + myUUID);
    let myThumb             = self.getMemberByUUID(myGroupUUID).memberThumb;
    let myName              = self.getMemberByUUID(myGroupUUID).memberName;
    let newEncryptedComment = {
      threadUUID    : threadUUID,
      messageUUID   : vaultService.encrypt(newMessageUUID, encryptionKey),
      threadMessage : vaultService.encrypt(comment,        encryptionKey),
      authorUUID    : vaultService.encrypt(myGroupUUID,    encryptionKey)
    };
    let newComment          = {
      threadUUID    : threadUUID,
      messageUUID   : newMessageUUID,
      threadMessage : comment,
      authorUUID    : myGroupUUID,
      authorName    : myName,
      authorThumb   : myThumb,
      createdDate   : 'just now'
    };
    return $q((resolve, reject) => {
      $http.post('/groups/createThreadMessage', JSON.stringify(newEncryptedComment)).success((response) => {
        loginService.loginValidate(response);
        if (response !== "success"){
          console.log(response);
          reject('error');
        } else {
          resolve(newComment);
        }
      }).catch((error) => {
        console.log(error);
        reject('error');
      });
    });
  };


  this.saveThumbnail = (thumbnail, groupUUID) => {
    const encryptionKey       = this.getGroupByUUID(groupUUID).encryptionKey;
    const myUUID              = vaultService.getMyData('userUUID');
    const adminUUID           = hashAndKeyGeneratorService.getHash256(myUUID);

    const thumbnailUpdateData = {
      groupThumb     : vaultService.encrypt(thumbnail, encryptionKey),
      groupUUID      : groupUUID,
      groupAdminUUID : adminUUID
    };
    return $q((resolve, reject) => {
      $http.post('/groups/updateThumbnail', JSON.stringify(thumbnailUpdateData)).success((response) => {
        loginService.loginValidate(response);
        // could add some better error handling..... some handling
        if (response !== "success"){
          reject(true);
        } else {
          resolve(true);
        }
      }).catch((error) => {
        console.log(error);
        reject();
      });
    });
  };

  this.getGroupImage = (groupUUID) => {
    let decryptionKey = this.getGroupByUUID(groupUUID).encryptionKey;

    return $q((resolve, reject) => {
      $http({
        url: "/groups/getGroupThumbnail",
        method: "get",
        params:{"groupUUID":groupUUID}
      }).success((data) => {
        loginService.loginValidate(data);
        if (data.length){
          resolve(vaultService.decrypt( data, decryptionKey));
        } else {
          resolve('images/profile.png');
        }
      }).error((data) => {
        reject(data);
      });
    });
  };

  this.isAdmin = (groupUUID) => {
    const myUUID         = vaultService.getMyData('userUUID');
    let   encryptionKey  = vaultService.getMyData('encryptionKey');
    const myUUIDHashOne  = hashAndKeyGeneratorService.getHash256(myUUID);
    const myUUIDHashTwo  = hashAndKeyGeneratorService.getHash256(myUUIDHashOne + encryptionKey);
    const adminHash      = self.getGroupByUUID(groupUUID).groupAdminHash;
    encryptionKey        = null;
    return myUUIDHashTwo === adminHash;
  };

  this.getGroupByUUID = (groupUUID) => {
    if ( ! Object.keys(groupLookup).length ){
      let groups = JSON.parse(myDataService.getMyData('groupsList'));
      for (let i = 0, len = groups.length; i < len; i++) {
        groupLookup[groups[i].groupUUID] = groups[i];
      }
    }
    const group = groupLookup[groupUUID];
    return group;
  };

  this.getMemberByUUID = (memberUUID) => {
    if ( ! Object.keys(memberLookup).length ){
      let members = JSON.parse(myDataService.getMyData('memberList'));
      for (let i = 0, len = members.length; i < len; i++) {
        memberLookup[members[i].memberUUID] = members[i];
      }
    }
    const member = memberLookup[memberUUID];
    return member;
  };

  this.showHideNewMessageIcon = (show) => {
    if ( show ){
      angular.element(document.getElementById('groupMessageIcon')).removeClass('newMessage');
      angular.element(document.getElementById('groupMessageIcon')).addClass('newMessage');
    } else {
      angular.element(document.getElementById('groupMessageIcon')).removeClass('newMessage');
    }
  };

  this.getPrivateGroupConversationHeaders = (groupUUID) => {
    const decryptionKey      = this.getGroupByUUID(groupUUID).encryptionKey;
    const myUUID             = vaultService.getMyData('userUUID');
    const myGroupMemberUUID  = hashAndKeyGeneratorService.getHash256(decryptionKey + myUUID);

    return $q((resolve, reject) => {
      $http({
        url: "/groups/getPrivateGroupConversationHeaders",
        method: "get",
        params:{"myGroupMemberUUID":myGroupMemberUUID}
      }).success((data) => {
        loginService.loginValidate(data);
        if ( data.length && typeof data.requestCount === "undefined"){
          let unreadMessages   = 0;
          angular.forEach(data, (item) => {
            let senderData = self.getMemberByUUID(item.senderUUID);
            if ( senderData !== undefined ){
              let membersThumb        = senderData.memberThumb;
              let membersName         = senderData.memberName;

              item.dateTime           = item.createdDate;
              item.lastSent           = moment(item.createdDate).fromNow();
              item.unread             = item.unread;
              item.authorName         = membersName;
              item.authorThumb        = membersThumb;
              item.authorUUID         = senderData.memberUUID;
              unreadMessages = ( item.unread )?unreadMessages+1:unreadMessages;
            }
          });
          self.showHideNewMessageIcon( unreadMessages );
        } else {
          data = [];
        }
        resolve(data);
      }).error((data) => {
        reject(data);
      });
    });
  };


  this.decryptPrivateMessages = (item, key, memberUUID, myGroupUUID, friendshipTokens, decryptionKey) => {
    const friendshipData   = self.getMemberByUUID(memberUUID);
    const friendsThumb     = friendshipData.memberThumb;
    const friendsName      = friendshipData.memberName;
    const myThumb          = self.getMemberByUUID(myGroupUUID).memberThumb;
    const myName           = self.getMemberByUUID(myGroupUUID).memberName;
    const decryptedMessage = vaultService.decrypt(item.message, decryptionKey);
    return $q((resolve, reject) => {
      vaultService.decryptPGPMessage(decryptedMessage).then((decryptedPGPMessage) => {
        item.dateTime        = item.createdDate;
        item.createdDate     = moment(item.createdDate).fromNow();
        item.authorName      = ( item.senderUUID === friendshipTokens.senderUUID )?friendsName :myName;
        item.thumbnail       = ( item.senderUUID === friendshipTokens.senderUUID )?friendsThumb:myThumb;
        item.authorUUID      = item.senderUUID;
        item.message         = decryptedPGPMessage;
        item.key             = key;
        resolve(item);
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  };

  this.getPrivateMessagesByGroupMemberUUID = (friendshipTokens) => {
    return $q((resolve, reject) => {
      $http({
        url: "/groups/getPrivateMessagesByMemberFriendship",
        method: "get",
        params: friendshipTokens
      }).success((data) => {
        loginService.loginValidate(data);
        resolve(data);
      }).error((data, status) => {
        console.log('error');
        reject(status);
      });
    });
  };

  this.encryptMessageToFriend = (friendsData, memberUUID, myGroupUUID, message, senderUUID, receiverUUID, encryptionKey) => {
    return $q((resolve, reject) => {
      vaultService.encrypToPGPKey(message, friendsData.memberPublicPGP).then((pgpMessage) => {
        const encryptedMessage    = pgpMessage.replace(/(?:\r\n|\r|\n)/g, 'linebreak');
        const newMessageForFriend = {
          messageUUID          : hashAndKeyGeneratorService.getUUID(),
          receiverUUID         : receiverUUID,
          senderUUID           : senderUUID,
          receiverUUIDUnhashed : memberUUID,
          senderUUIDUnhashed   : myGroupUUID,
          message              : vaultService.encrypt(encryptedMessage, encryptionKey)
        };
        resolve(newMessageForFriend);
      }).catch((error) => {
        return reject(error);
      });
    });
  };

  this.encryptMessageCopyToMe = (mygroupMembershipData, senderUUID, receiverUUID, memberUUID, myGroupUUID, myName, myThumb, message, encryptionKey) => {
    return $q((resolve, reject) => {
      vaultService.encrypToPGPKey(message, mygroupMembershipData.memberPublicPGP).then((pgpMessage) => {
        let datenow                  = new Date().getTime();
        let myCopyOfencryptedMessage = pgpMessage.replace(/(?:\r\n|\r|\n)/g, 'linebreak');
        let newMessageUUID           = hashAndKeyGeneratorService.getUUID();
        let messageMyCopy            = {
          messageUUID          : newMessageUUID,
          receiverUUID         : senderUUID,
          senderUUID           : senderUUID,
          receiverUUIDUnhashed : memberUUID,
          senderUUIDUnhashed   : myGroupUUID,
          message              : vaultService.encrypt(myCopyOfencryptedMessage, encryptionKey)
        };
        let newMessage               = {
          messageUUID  : newMessageUUID,
          receiverUUID : receiverUUID,
          senderUUID   : senderUUID,
          message      : message,
          authorName   : myName,
          thumbnail    : myThumb,
          createdDate  : moment(datenow).fromNow(),
          dateTime     : new Date().toISOString()
        };
        let messageData              = {
          newMessage    : newMessage,
          messageMyCopy : messageMyCopy
        };

        resolve(messageData);
      }).catch((error) => {
        reject(error);
      });
    });
  };

  this.submitConversationMessage = (messageData) => {
    return $q((resolve, reject) => {
      $http.post('/groups/createPrivateConversationMessage', JSON.stringify(messageData)).success((response) => {
        if (response === "success"){
          loginService.loginValidate(response);
          self.emojiRun();
          resolve('success');
        } else {
          console.log(response);
          reject('failure');
        }
      }).catch((error) => {
        console.log(error);
        reject('failure');
      });
    });
  };

}]);