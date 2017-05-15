'use strict';
VultronixApp.controller('GroupPageController', ['$scope',
  'groupPageService',
  '$http',
  '$routeParams',
  'loginService',
  'hashAndKeyGeneratorService',
  'myDataService',
  'vaultService',
  '$location',
  'groupsService',
  '$timeout',
  'imageService',
  'socketsService',
  ($scope, groupPageService, $http, $routeParams, loginService, hashAndKeyGeneratorService, myDataService, vaultService, $location, groupsService, $timeout, imageService, socketsService)=> {
  $scope.currentLoadedThreadCount               = 0;
  $scope.currentLoadedThreadDiscussionsCount    = 0;
  $scope.currentThread                          = "";
  $scope.groupDescription                       = '';
  $scope.groupThreadsShow                       = true;
  $scope.groupUUID                              = $routeParams.groupID;
  $scope.isAdmin                                = false;
  $scope.loading                                = true;
  $scope.newGroupThreadText                     = '';
  $scope.newMessageText                         = "";
  $scope.showPrivateInboxConversationMoreButton = true;
  $scope.showThreadDiscussionsMoreButton        = true;
  $scope.showThreadsMoreButton                  = true;
  $scope.statusMessage                          = 'Loading';
  $scope.tab                                    = 'discussionsTab';
  $scope.threadComments                         = [];
  $scope.threadDivShow                          = false;
  // below is just a list of characters to keep thread topic names simple
  // we don't want too many stupid looking characters, so user will be politely informed
  $scope.validText = /^[\w\.\-\_\!\$\£\฿\,\s\'\"\?\%\:\;\)\(\/\=]{3,100}$/;

  let _updateMessageConversationHeaders = () => {
    $scope.statusMessage = 'Decrypting';
    groupPageService.getPrivateGroupConversationHeaders($routeParams.groupID).then((data)=> {
      $scope.messageConversationHeaders = data;
      $scope.loading                    = false;
    });
  };


  let initCallBack = ()=> {
    $scope.groupDescription = groupPageService.getGroupByUUID($routeParams.groupID).groupDescription;
    $scope.groupName        = groupPageService.getGroupByUUID($routeParams.groupID).groupName;
    $scope.statusMessage    = 'Downloading and decrypting';
    groupPageService.getGroupImage($routeParams.groupID).then((image)=> {
      $scope.groupImage = image;
    });

    groupPageService.getMembers($routeParams.groupID).then((members)=> {
      $scope.members       = members;
      $scope.statusMessage = '';
      $scope.loading       = false;
    });

    groupPageService.getThreads($routeParams.groupID).then((threads)=> {
      $scope.currentLoadedThreadCount = threads.length;
      $scope.threads                  = threads;
    });

    $scope.isAdmin = groupPageService.isAdmin($routeParams.groupID);
    _updateMessageConversationHeaders();
  };

  let init = ()=> {
    groupsService.getGroups(true).then((groups)=> {
      $scope.groups = groups;
      initCallBack();
    });
  };

  init();


  $scope.newGroupThread = ()=> {
    if( $scope.newGroupThreadText === undefined || ! $scope.newGroupThreadText.length ){
      return false;
    }else if( $scope.newGroupThreadText !== undefined ){
      groupPageService.createNewThread($scope.newGroupThreadText, $routeParams.groupID).then((newThread)=> {
        $scope.threads.push(newThread);
      });
      $scope.newGroupThreadText = "";
    }else{
      //TODO: have a better UX/UI way of showing alerts
      alert('Please limit characters to letters and numbers');
    }
  };

  $scope.processThreadDiscussionsMoreButton = () => {
    const groupUUID                           = $routeParams.groupID;
    const currentLoadedThreadDiscussionsCount = $scope.currentLoadedThreadDiscussionsCount;
    const threadUUID                          = $scope.currentThread;
    $scope.statusMessage                      = 'Downloading and decrypting...';
    $scope.loading                            = true;

    groupPageService.getGroupThreadComments(groupUUID, threadUUID, currentLoadedThreadDiscussionsCount).then((threadComments)=> {
      $scope.threadComments                      = $scope.threadComments.concat(threadComments);
      $scope.currentLoadedThreadDiscussionsCount = $scope.threadComments.length;
      $scope.loading                             = false;
      if (! threadComments.length) {
        $scope.showThreadDiscussionsMoreButton = false;
      }
      $timeout( () => {
        window.scrollTo(0, document.body.scrollHeight);
      }, 10);
    });
  };

  $scope.showThread = (threadUUID)=> {
    $scope.tab                             = 'threadDiscussionsTab';
    $scope.loading                         = true;
    $scope.currentThread                   = threadUUID;
    $scope.statusMessage                   = 'Downloading and decrypting...';
    $scope.showThreadDiscussionsMoreButton = true;

    groupPageService.getGroupThreadComments($routeParams.groupID, threadUUID).then((threadComments)=> {
      $scope.threadComments                      = threadComments;
      $scope.currentLoadedThreadDiscussionsCount = $scope.threadComments.length;
      $scope.statusMessage                       = '';
      $scope.loading                             = false;
    });

    $scope.groupThreadsShow = false;
    $scope.threadDivShow    = true;
    _updateMessageConversationHeaders();
  };

  $scope.processThreadsMoreButton = () => {
    const currentLoadedThreadCount    = $scope.currentLoadedThreadCount;
    const groupUUID                   = $routeParams.groupID;
    $scope.statusMessage              = 'Loading';
    $scope.loading                    = true;

    groupPageService.getThreads(groupUUID, currentLoadedThreadCount).then((threads)=> {
      $scope.threads = $scope.threads.concat(threads);
      $scope.currentLoadedThreadCount = $scope.threads.length;
      $scope.loading                  = false;

      $timeout( () => {
        window.scrollTo(0, document.body.scrollHeight);
      }, 10);
    });
  };

  $scope.showGroupThreads = ()=> {
    //everytime a user comes back to the discussions tab we'll just show them the 15 newest discussions.
    $scope.currentLoadedThreadCount = 0;
    $scope.statusMessage            = 'Loading';
    $scope.loading                  = true;
    groupPageService.getThreads($routeParams.groupID).then((threads)=> {
      $scope.currentLoadedThreadCount = threads.length;
      $scope.threads                  = threads;
    });

    groupPageService.getMembers($routeParams.groupID).then((members)=> {
      $scope.members       = members;
      $scope.statusMessage = '';
      $scope.loading       = false;
    });

    $scope.threadComments    = [];
    $scope.groupThreadsShow  = true;
    $scope.threadDivShow     = false;
    _updateMessageConversationHeaders();
  };

  $scope.showPrivateMessages = ()=> {
    $scope.statusMessage = 'Loading';
    $scope.loading       = true;
    _updateMessageConversationHeaders();
  };

  $scope.processPrivateInboxConversationMoreButton = () => {
    const memberUUID                 = $scope.currentFriend;
    const currentLoadedMessagesCount = $scope.currentLoadedMessagesCount;
    $scope.showPrivateConversation(memberUUID, currentLoadedMessagesCount, true)
  };

  $scope.showPrivateConversation = (memberUUID, currentLoadedMessagesCount = 0, LoadMoreButtonClick = false)=> {
    $scope.showPrivateInboxConversationMoreButton = true;
    if ($scope.currentFriend !== memberUUID || ! LoadMoreButtonClick) {
      $scope.conversationComments = [];
    }

    $scope.currentFriend   = memberUUID;
    $scope.loading         = true;
    $scope.statusMessage   = "Downloading messages...";
    const myUUID           = vaultService.getMyData('userUUID');
    const decryptionKey    = groupPageService.getGroupByUUID($routeParams.groupID).encryptionKey;
    const myGroupUUID      = hashAndKeyGeneratorService.getHash256(decryptionKey + myUUID);
    // not proud of the below, but the unhashed is for the conversation headers, the hashed is so it's unique to these 2 people having conversation
    const friendshipTokens = {
      receiverUUID         : hashAndKeyGeneratorService.getHash256(myGroupUUID + memberUUID),
      senderUUID           : hashAndKeyGeneratorService.getHash256(memberUUID + myGroupUUID),
      receiverUUIDUnhashed : myGroupUUID,
      senderUUIDUnhashed   : memberUUID,
      currentLoadedCount   : currentLoadedMessagesCount
    };

    groupPageService.getPrivateMessagesByGroupMemberUUID(friendshipTokens).then((data)=> {
      if( data && Object.prototype.toString.call( data ) === '[object Array]' && data.length){
        $scope.statusMessage = 'Decrypting '+ data.length  +' messages';
        $scope.loading       = true;
        let loopLength       = data.length - 1;
        angular.forEach(data, (item, key)=> {
          groupPageService.decryptPrivateMessages(item, key, memberUUID, myGroupUUID, friendshipTokens, decryptionKey).then((item)=> {
            let count            = item.key+1;
            $scope.statusMessage = 'Decrypting message '+ count +' of '+ data.length  +' messages';
            $scope.loading       = true;
            $scope.conversationComments.push(item);
            if( item.key >= loopLength ){
              $scope.loading = false;
              groupPageService.emojiRun();
              // only if the user selects the load more button do we want them to scroll to the bottom.
              if (currentLoadedMessagesCount){
                $timeout( () => {
                  window.scrollTo(0, document.body.scrollHeight);
                }, 10);
              }
              $scope.currentLoadedMessagesCount             = $scope.conversationComments.length;
              $scope.showPrivateInboxConversationMoreButton = true;
              _updateMessageConversationHeaders();
            }
          });
        });
      }else{
        _updateMessageConversationHeaders();
        $scope.showPrivateInboxConversationMoreButton = false;
      }
    });
    $scope.tab = 'privateInboxConversationTab';
  };

  $scope.newPrivateConversationMessage = ()=> {
      if( $scope.newMessageText && ! $scope.newMessageText.length ){
        return false;
      }else if( $scope.newMessageText ){
        var memberUUID            = $scope.currentFriend;
        var message               = $scope.newMessageText;
        var groupUUID             = $routeParams.groupID;
        var myUUID                = vaultService.getMyData('userUUID');
        var friendsData           = groupPageService.getMemberByUUID(memberUUID);
        var encryptionKey         = groupPageService.getGroupByUUID(groupUUID).encryptionKey;
        var myGroupUUID           = hashAndKeyGeneratorService.getHash256(encryptionKey + myUUID);
        var mygroupMembershipData = groupPageService.getMemberByUUID(myGroupUUID);
        var myThumb               = mygroupMembershipData.memberThumb;
        var myName                = mygroupMembershipData.memberName;
        var senderUUID            = hashAndKeyGeneratorService.getHash256(myGroupUUID + memberUUID);
        var receiverUUID          = hashAndKeyGeneratorService.getHash256(memberUUID + myGroupUUID);
        var messageForFriend;
        var newMessage;

        groupPageService.encryptMessageToFriend(friendsData, memberUUID, myGroupUUID, message, senderUUID, receiverUUID, encryptionKey).then((newMessageForFriend)=> {
          messageForFriend = newMessageForFriend;
          return groupPageService.encryptMessageCopyToMe(mygroupMembershipData, senderUUID, receiverUUID, memberUUID, myGroupUUID, myName, myThumb, message, encryptionKey);
        }).then((data)=> {
          newMessage      = data.newMessage;
          var messageData = {
            "newMessageForFriend" : messageForFriend,
            "messageMyCopy"       : data.messageMyCopy
          };
          return groupPageService.submitConversationMessage(messageData);
        }).then((status)=> {
          if( status === "success" ){
            $scope.conversationComments.push(newMessage);
          }else{
            // create something a little more glorious
            alert('error sending message, try again');
          }
        });

        $scope.newMessageText = "";
      }else{
        alert('Please limit characters to letters and numbers');
        return false;
      }
  };

  $scope.newThreadComment = ()=> {
    if( ! $scope.newThreadCommentText || ! $scope.newThreadCommentText.length ){
      return false;
    }else if( $scope.newThreadCommentText ){
      groupPageService.createNewThreadComment($scope.newThreadCommentText, $routeParams.groupID, $scope.currentThread).then((newComment)=> {
        $scope.threadComments.unshift(newComment);
        groupPageService.emojiRun();
      });
      $scope.newThreadCommentText = "";
    }else{
      //TODO: have a better UX/UI way of showing alerts
      alert('Please limit characters to letters and numbers');
    }
  };

  $scope.imageSelect = (imageType)=> {
    $timeout(()=> {
      document.getElementById(imageType).click();
    }, 100);
  };
  //TODO: make this more generic (same code exists elsewhere), place it in a service
  $scope.processImage = (imageType)=> {
    var aryFiles   = imageService.getFiles(imageType);
    var aryReqSize = imageService.getReqSizes(imageType);
    var img        = document.createElement('img');
    if(aryFiles.length && aryFiles[0].type.match(/image.*/)) {
      img.src = window.URL.createObjectURL(aryFiles[0]);
      img.id  = 'tempImage';
      img.onload = ()=> {
        var canvas                             = document.createElement('canvas');
        var dataUrl                            = '';
        var arySize                            = imageService.calculateSize(img.height, img.width);
        canvas.width                           = aryReqSize[0];
        canvas.height                          = aryReqSize[1];
        canvas.getContext('2d').drawImage(img, 0, 0, arySize[0], arySize[1], 0, 0, aryReqSize[0], aryReqSize[1]);
        dataUrl                                = canvas.toDataURL('image/jpeg',0.7);
        document.getElementById(imageType).src = dataUrl;
        var groupImage                         = document.getElementById('groupImage').src;
        $scope.statusMessage                   = "Uploading new group logo....";
        groupPageService.saveThumbnail(groupImage, $scope.groupUUID).then(()=> {
          $scope.statusMessage = "";
        });
      };
    }
  };

}]);


VultronixApp.controller('createInviteController', ['$scope',
  'loginService',
  'hashAndKeyGeneratorService',
  '$http',
  '$routeParams',
  'vaultService',
  'myDataService',
  'groupPageService',
  'socketsService',
  ($scope, loginService, hashAndKeyGeneratorService, $http, $routeParams, vaultService, myDataService, groupPageService, socketsService)=> {
  $scope.credentials    = {};
  $scope.inviteFormShow = true;
  $scope.generateLink   = true;
  $scope.inviteTokenDiv = false;
  $scope.generateMore   = false;
  let groupInfo         = {};

  let init = ()=> {
    groupInfo = groupPageService.getGroupByUUID($routeParams.groupID);
  };
  init();

  $scope.createInvite = () => {
    const message           = $scope.credentials.message;
    const UUID              = hashAndKeyGeneratorService.getUUID();
    const credentialsToHash = message + UUID;
    const hashToken         = hashAndKeyGeneratorService.getHash256(credentialsToHash);
    const hashStruct        = hashAndKeyGeneratorService.getHashStruct(hashToken);
    const passphrase        = hashStruct.hashOne;
    const inviteToken       = hashStruct.hashThree;
    const myProfileImage    = myDataService.getMyData('profileImage');
    const groupName         = groupInfo.groupName;
    const groupDescription  = groupInfo.groupDescription;
    const groupThumbnail    = groupInfo.groupThumbnail;
    const encryptionKey     = groupInfo.encryptionKey;
    const groupInvite       = {
      tokenUUID         : inviteToken,
      groupName         : vaultService.encrypt(groupName,                            passphrase),
      groupDescription  : vaultService.encrypt(groupDescription,                     passphrase),
      groupThumbnail    : vaultService.encrypt(groupThumbnail,                       passphrase),
      groupUUID         : vaultService.encrypt($routeParams.groupID,                 passphrase),
      groupPublicPGP    : vaultService.encrypt(vaultService.getMyData('PGPPublic'),  passphrase),
      groupPrivatePGP   : vaultService.encrypt(vaultService.getMyData('PGPPublic'),  passphrase),
      invitersName      : vaultService.encrypt(vaultService.getMyData('nickname'),   passphrase),
      invitersThumbnail : vaultService.encrypt(myProfileImage,                       passphrase),
      invitationMessage : vaultService.encrypt(message,                              passphrase),
      groupEncryptionKey: vaultService.encrypt(encryptionKey,                        passphrase)
    };

    $http.post('/groups/createGroupInvite', JSON.stringify(groupInvite)).success((response)=> {
      if(response.createInviteStatus === "success"){
        $scope.inviteFormShow   = false;
        $scope.generateLink     = false;
        $scope.inviteTokenDiv   = true;
        $scope.generateMore     = true;
        $scope.inviteToken      = hashToken;
      }else{
        console.log(response);
      }
    }).error((data)=> {
      console.log(data);
    });

  };

  $scope.anotherInvite = ()=> {
    $scope.inviteFormShow  = true;
    $scope.generateLink    = true;
    $scope.inviteTokenDiv  = false;
    $scope.generateMore    = false;
  };

}]);
