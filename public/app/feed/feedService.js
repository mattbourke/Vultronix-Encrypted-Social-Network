'use strict';
VultronixApp.service('feedService', ['loginService',
  'myDataService',
  'friendsService',
  'vaultService',
  'hashAndKeyGeneratorService',
  '$http',
  '$q',
  function(loginService, myDataService, friendsService, vaultService, hashAndKeyGeneratorService, $http, $q) {

  let _getCommentsForstatus = (item, decryptKey) => {
    $http({
      url: "/feed/myComments",
      method: "get",
      params:{"statusUUID" : item.statusUUID}
    }).success((commentData) => {
      loginService.loginValidate(commentData);
      angular.forEach(commentData, (commentItem) => {
        try {
          commentItem.commentData     = JSON.parse(vaultService.decrypt(commentItem.commentData, decryptKey));
          commentItem.commentDate     = commentItem.commentData.commentDate;
          commentItem.commentMoment   = moment(commentItem.commentDate).fromNow();
          commentItem.commentText     = commentItem.commentData.commentText;
          commentItem.authorName      = commentItem.commentData.authorName;
          commentItem.authorThumbnail = commentItem.commentData.authorThumbnail;
          delete commentItem.commentData;
        }
        catch(err) {
          console.log(err);
        }
      });
      item.comments = commentData;

    }).error((data) => {
      console.log(data);
    });
  };

  let _buildStatusViewURL = (statusType, statusUUID, friendUUID) => {
    let viewURL;

    switch ( statusType ) {
      case 'newArticle':
        viewURL = '#/feedArticle/'+statusUUID;
        break;
      case 'friendProfileUpdated':
        viewURL = '#/friendsprofile/'+friendUUID+'/about';
        break;
      case 'friendProfileImageUpdated':
        viewURL = '#/friendsprofile/'+friendUUID+'/feed';
        break;
      case 'friendHeaderImageUpdated':
        viewURL = '#/friendsprofile/'+friendUUID+'/feed';
        break;
      case 'friendPhotoAlbumUpdated':
        viewURL = '#/friendsprofile/'+friendUUID+'/about';
        break;
      case 'friendBiographyReceived':
        viewURL = '#/friendsprofile/'+friendUUID+'/about';
        break;
    }

    return viewURL;
  };

  let _getFriendUUIDFromStatusNotifications = (statusNotificationsData, statusUUID) => {
    let friendUUID;
    for (let i = 0, len = statusNotificationsData.length; i < len; i++) {
      if ( statusNotificationsData[i].statusUUID === statusUUID ){
        friendUUID = statusNotificationsData[i].myFriendshipUUID;
      }
    }
    return friendUUID;
  };

  this.concatStatusArraysAndRemoveDupes = (statusArrayOne, statusArrayTwo) => {
    return statusArrayOne.concat(statusArrayTwo.filter( (item) => {
        let statusUUID = item.statusUUID;
        return !( (freshStatusUUID) => {
          let returnValue = false;
          angular.forEach(statusArrayOne, (status) => {
            if ( status.statusUUID === freshStatusUUID ){
              returnValue = true;
            }
          });
          return returnValue;
        })(statusUUID);
      }));
  };

  this.preventDuplicateStatuses = (decryptedStatuses, rootFeedStatus) => {
    if (decryptedStatuses.length && rootFeedStatus.length ){
      decryptedStatuses = decryptedStatuses.filter((val) => {
        let statusUUID = val.statusUUID;
        // is status in feed
        return !( (freshStatusUUID) => {
          let returnValue = false;
          angular.forEach(rootFeedStatus, (status) => {
            if ( status.statusUUID === freshStatusUUID ){
              returnValue = true;
            }
          });
          return returnValue;
        })(statusUUID);
      });
    }
    if (decryptedStatuses.length) {
      const feedStatus = rootFeedStatus.concat(decryptedStatuses);
      return {
        'updated'   : true,
        'feedStatus': feedStatus
      };
    }else{
      return {
        'updated'   : false,
        'feedStatus': ''
      };
    }

  };

  this.getStatuses = (dataIn) => {
    return $q((resolve, reject) => {
      $http({
        url: "/feed/myStatus",
        method: "get",
        params:{"statusUUID" : dataIn.statusUUIDArray}
      }).success((data) => {
        loginService.loginValidate(data);

        const myProfileName     = myDataService.getMyData('name');
        const myProfileImage    = myDataService.getMyData('profileImage');
        const decryptedStatuses = _decryptStatusData(data, dataIn.decryptedStatusNotificationsData, dataIn.myUUID);
        let dataIterator        = 0;

        angular.forEach(decryptedStatuses, (item) => {
          let friendUUID                  = _getFriendUUIDFromStatusNotifications(dataIn.decryptedStatusNotificationsData, item.statusUUID);
          let friendshipData              = friendsService.getFriendshipByFriendsUUID(friendUUID);
          let thumbnail                   = ( friendUUID === dataIn.myUUID )?myProfileImage:friendshipData.thumbnail;
          let userName                    = ( friendUUID === dataIn.myUUID )?myProfileName:friendshipData.name;
          let profileURLPrefix            = ( friendUUID === dataIn.myUUID )?'#/myprofile':'#/friendsprofile/'+friendUUID;
          item.media                      = [];
          item.comments                   = [];
          item.statusData.authorThumbnail = thumbnail;
          item.statusData.userName        = userName;
          item.statusData.moment          = moment(item.statusData.postDate).fromNow();
          item.viewURL                    = _buildStatusViewURL(item.statusData.statusType, item.statusUUID, friendUUID);
          item.friendProfileURL           = profileURLPrefix;

          if (item.statusData.type){
            for(let i=0; i < item.statusData.type.length; i++) {
              item.media[i] = {
                type     : item.statusData.type[i],
                url      : item.statusData.url[i],
                thumbUrl : item.statusData.thumbUrl[i],
                faIcon   : item.statusData.faIcon[i]
              };
            }
          }

          if ( typeof decryptedStatuses !== 'undefined' && decryptedStatuses.length > 0 ){
            let decryptKey = decryptedStatuses[dataIterator].decryptKey;
            dataIterator++;
            ((decryptKey, item) => {
              _getCommentsForstatus(item, decryptKey);
            })(decryptKey, item);
          }
        });

        const results = {
          decryptedStatuses : decryptedStatuses,
          feedType          : dataIn.feedType
        };

        resolve(results);
      }).error((data) => {
        console.log(data);
      });
    });
  };

  this.getNewestStatusTime = (feedStatuses) => {
    let newest = undefined;
    if (feedStatuses.length) {
      newest = feedStatuses[0].statusData.postDate;
    }
    return newest;
  };

  //TODO: reduce number of arguments
  this.getStatusNotifications = (myUUID,
                                 feedType,
                                 feedStatus = [],
                                 newestStatusTimeIn,
                                 statusNotifications = [],
                                 rootStatusUUIDArray,
                                 currentLoadedCount = 0,
                                 loadMoreButtonClicked = false) => {
    const friendUUIDArray  = _buildFriendshipUUIDArray(myUUID, feedType);
    const newestStatusTime = (feedType === 'feed' && feedStatus.length) ? newestStatusTimeIn : undefined;

    const searchParams = {
      "friendUUID"            : friendUUIDArray,
      "newestStatusTime"      : newestStatusTime,
      "currentLoadedCount"    : currentLoadedCount,
      "loadMoreButtonClicked" : loadMoreButtonClicked
    };

    return $q((resolve, reject) => {
      $http({
        url: "/feed/statusNotifications",
        method: "get",
        params: searchParams
      }).success((statusNotificationsData) => {
        loginService.loginValidate(statusNotificationsData);
        const decryptedStatusNotificationsData = _decryptStatusNotificationsData(statusNotificationsData.reverse(), myUUID, feedType).reverse();
        let   statusUUIDArray                  = _buildStatusUUIDArray(decryptedStatusNotificationsData);

        if ( feedType === 'feed' && decryptedStatusNotificationsData.length ){
          statusNotifications = statusNotifications.concat(decryptedStatusNotificationsData);
          statusUUIDArray     = statusUUIDArray.filter((val) => {
            return rootStatusUUIDArray.indexOf(val) === -1;
          });
        }else if ( decryptedStatusNotificationsData.length ){
          statusNotifications = statusNotifications.concat(decryptedStatusNotificationsData);
        }

        const results = {
          'statusUUIDArray'                  : statusUUIDArray,
          'decryptedStatusNotificationsData' : decryptedStatusNotificationsData,
          'myUUID'                           : myUUID,
          'feedType'                         : feedType,
          'statusNotifications'              : statusNotifications
        };

        resolve(results);
      }).error((data) => {
        console.log('statusNotifications Error');
        console.log(data);
        reject(data);
      });
    });
  };

  this.addNewStatus = (statusType, statusMessage) => {
    let mediaJSON    = {};
    let statusData   = this.buildStatusFeedData(mediaJSON, statusMessage, 0, statusType);
    let newStatus    = this.buildNewStatusFeedData(mediaJSON, statusData);
    const statusJSON = this.buildStatusJSON(statusData, newStatus);
                      _sendNonArticleStatus(statusJSON.feedJSON);
                      this.sendStatusNotifications(statusJSON.feedJSON);
  };

  this.saveMyComment = (commentData) => {
    let commentJSON = _buildCommentJSON(commentData);
    $http.post('/feed/myComments', JSON.stringify(commentJSON)).success((response) => {
      loginService.loginValidate(response);
      if (! response.statusUUID){
        console.log('myComments save failed');
      }
    }).catch((error) => {
      console.log('myComments complete failure');
      console.log(error);
    });
    return commentJSON;
  };

  let _getDecryptKeyFromStatusesArray = (statusesArray, statusUUID) => {
    let decryptKey = "";
    for(let prop in statusesArray) {
      if (statusesArray.hasOwnProperty(prop)) {
        if ( statusesArray[prop].statusUUID === statusUUID ){
          decryptKey = statusesArray[prop].decryptKey;
        }
      }
    }
    return decryptKey;
  };


  let _buildCommentJSON = (commentData) => {
    let decryptKey      = commentData.decryptKey;
    let statusUUID      = commentData.statusUUID;
    let commentObject   = {
      statusUUID  : statusUUID,
      commentData : vaultService.encrypt(JSON.stringify(commentData), decryptKey)
    };
    return commentObject;
  };

  this.buildStatusJSON = (statusData, newStatus) => {
    let decryptKey        = hashAndKeyGeneratorService.getUUID() + hashAndKeyGeneratorService.getUUID();
    decryptKey            = hashAndKeyGeneratorService.getHash512(decryptKey);
    const statusUUID      = statusData.statusUUID;
    let feedJSON          = {};
    let friendArray       = [];
    let friendRecord      = {};
    const myUUID          = vaultService.getMyData('userUUID');
    const friendUUIDArray = _buildFriendUUIDArray(myUUID);
    const feedData        = {
      statusUUID : statusUUID,
      statusData : vaultService.encrypt(JSON.stringify(statusData), decryptKey)
    };
    let friendshipData;
    newStatus.decryptKey = decryptKey;
    newStatus.viewURL    = '#/feedArticle/'+statusUUID;

    for(let prop in friendUUIDArray) {
      if (friendUUIDArray.hasOwnProperty(prop)) {
        friendshipData = friendsService.getFriendshipByFriendsUUID(friendUUIDArray[prop]);
        if ( friendshipData ){
          friendRecord   = {
            statusUUID       : vaultService.encrypt(statusUUID, friendshipData.friendshipUUID),
            friendUUID       : friendshipData.friendUUID,
            myFriendshipUUID : vaultService.encrypt(friendshipData.myFriendshipUUID, friendshipData.friendshipUUID),
            decryptKey       : vaultService.encrypt(decryptKey, friendshipData.friendshipUUID)
          };
        }else if ( friendUUIDArray[prop] === myUUID){
          // be sure to save a copy for myself
          // IF WE HAVE A PROFILE UPDATE STATUS OR SOMETHING IGNORE THIS SECTION
          if (statusData.statusType === 'newArticle') {
            friendRecord   = {
              statusUUID       : vaultService.encrypt(statusUUID),
              friendUUID       : friendUUIDArray[prop],
              myFriendshipUUID : vaultService.encrypt(friendUUIDArray[prop]),
              decryptKey       : vaultService.encrypt(decryptKey)
            };
          }
        }
        friendArray.push(friendRecord);
      }
    }

    feedJSON = {
      statusData : feedData,
      friendData : friendArray
    };

    return {
      "feedJSON" :feedJSON,
      "newStatus":newStatus
    };
  };

  this.sendStatus = (statusJSON) => {
    return $q((resolve, reject) => {
      $http.post('/feed/myStatus', JSON.stringify(statusJSON)).success((response) => {
        loginService.loginValidate(response);
        if (! response.statusUUID){
          console.log('myStatus save failed');
          reject();
        }else{
          resolve();
        }
      }).catch((error) => {
        console.log('myStatus complete failure');
        console.log(error);
      });
    });
  };

  let _sendNonArticleStatus = (statusJSON) => {
    $http.post('/feed/myStatus', JSON.stringify(statusJSON)).success((response) => {
      loginService.loginValidate(response);
      if (! response.statusUUID){
        console.log('NonArticleStatus save failed');
      }
    }).catch((error) => {
      console.log('myStatus complete failure');
      console.log(error);
    });
  };

  this.sendStatusNotifications = (statusJSON) => {
    return $q((resolve, reject) => {
      $http.post('/feed/statusNotifications', JSON.stringify(statusJSON)).success((response) => {
        loginService.loginValidate(response);
        if ( response !== 'success'){
          console.log('sendStatusNotifications save failed');
          reject(false);
        }else{
          resolve(true);
        }

      }).catch((error) => {
        console.log('sendStatusNotifications complete failure');
        reject(error);
      });
    });
  };

  let _getFriendsProfileImage = (friendUUID) => {
    const friendshipJSON = friendsService.getFriendshipByMyFriendshipUUID(friendUUID);
    const friendJSON     = friendsService.getFriendshipByFriendsUUID(friendUUID);
    let img              = "";
    if ( friendJSON === undefined ) {
      img = myDataService.getMyData('profileImage');
    }else {
      img = friendshipJSON.thumbnail;
    }
    return img;
  };

  let _buildFriendsArray = (userUUID, feedType) => {
    let friendUUIDArray = [];
    const friends       = JSON.parse(myDataService.getMyData('friendsList'));
    if (feedType) {
      friendUUIDArray.push(feedType);
    }else{
      for(let key in friends) {
        if (friends.hasOwnProperty(key)) {
          friendUUIDArray.push(friends[key].friendUUID);
        }
      }
      friendUUIDArray.push(userUUID);
    }
    return friendUUIDArray;
  };

  let _buildFriendUUIDArray = (userUUID) => {
    let friendUUIDArray = [];
    let friends         = JSON.parse(myDataService.getMyData('friendsList'));
    for(let key in friends) {
      if (friends.hasOwnProperty(key)) {
        friendUUIDArray.push(friends[key].friendUUID);
      }
    }
    if (userUUID) {
      friendUUIDArray.push(userUUID);
    }
    return friendUUIDArray;
  };

  let _buildFriendshipUUIDArray = (userUUID, feedType) => {
    let friendshipUUIDArray = [];
    if ( feedType === "feed" || feedType === "singleArticle" ){
      let friends = JSON.parse(myDataService.getMyData('friendsList'));
      for(let key in friends) {
        if (friends.hasOwnProperty(key)) {
          friendshipUUIDArray.push(friends[key].myFriendshipUUID);
        }
      }
    }
    if (userUUID) {
      friendshipUUIDArray.push(userUUID);
    }
    return friendshipUUIDArray;
  };

  let _buildStatusUUIDArray = (data) => {
    let statusUUIDArray = [];
    for(let key in data) {
      if (data.hasOwnProperty(key)) {
        statusUUIDArray.push(data[key].statusUUID);
      }
    }
    return statusUUIDArray;
  };

  let _decryptStatusNotificationsData = (statusNotificationsData, myUUID, feedType) => {
    let friendshipData;
    for(let key in statusNotificationsData) {
      if (statusNotificationsData.hasOwnProperty(key)) {
        if ( statusNotificationsData[key].friendUUID === myUUID && feedType !== "friendsProfile"){
          statusNotificationsData[key].statusUUID       = vaultService.decrypt(statusNotificationsData[key].statusUUID);
          statusNotificationsData[key].decryptKey       = vaultService.decrypt(statusNotificationsData[key].decryptKey);
          statusNotificationsData[key].myFriendshipUUID = vaultService.decrypt(statusNotificationsData[key].myFriendshipUUID);
          statusNotificationsData[key].profileURL       = '#/myprofile';
        }else{
          friendshipData                                = friendsService.getFriendshipByMyFriendshipUUID(statusNotificationsData[key].friendUUID);
          statusNotificationsData[key].statusUUID       = vaultService.decrypt(statusNotificationsData[key].statusUUID,       friendshipData.friendshipUUID);
          statusNotificationsData[key].decryptKey       = vaultService.decrypt(statusNotificationsData[key].decryptKey,       friendshipData.friendshipUUID);
          statusNotificationsData[key].myFriendshipUUID = vaultService.decrypt(statusNotificationsData[key].myFriendshipUUID, friendshipData.friendshipUUID);
          statusNotificationsData[key].profileURL       = '#/friendsprofile/'+statusNotificationsData[key].myFriendshipUUID;
        }
      }
    }
    return statusNotificationsData;
  };

  let _decryptStatusData = (data, decryptedStatusNotificationsData) => {
    for(let key in data) {
      if (data.hasOwnProperty(key)) {
        let decryptionKey       = _getDecryptionKeyFromDecryptedStatusNotificationsData(data[key].statusUUID, decryptedStatusNotificationsData);
        data[key].statusData    = JSON.parse(vaultService.decrypt(data[key].statusData, decryptionKey));
        data[key].decryptKey    = decryptionKey;
      }
    }
    return data;
  };

  let _getDecryptionKeyFromDecryptedStatusNotificationsData = (statusUUID, decryptedStatusNotificationsData) => {
    for(let key in decryptedStatusNotificationsData) {
      if (decryptedStatusNotificationsData.hasOwnProperty(key)) {
        if ( statusUUID === decryptedStatusNotificationsData[key].statusUUID ){
          return decryptedStatusNotificationsData[key].decryptKey;
        }
      }
    }
  };

  this.buildMediaFeedJSON = (newFeedMediaQty) => {
    let mediaJSON         = {};
    let media             = [];
    let mediaIconArray    = [];
    let mediaUrlArray     = [];
    let thumbUrlArray     = [];
    let mediaTypeArray    = [];

    if (newFeedMediaQty !== 0) {
      for (let i = 0; i < newFeedMediaQty; i++) {
        let mediaId       = i + 1;
        let element       = document.getElementById('newStatusImage_' + mediaId);
        mediaTypeArray[i] = element.getAttribute("data-mediatype");
        mediaUrlArray[i]  = element.getAttribute("data-mediaurl");
        thumbUrlArray[i]  = element.src;
        mediaIconArray[i] = element.getAttribute("data-mediaicon");
        media[i]          = {
          type     : mediaTypeArray[i],
          url      : mediaUrlArray[i],
          thumbUrl : thumbUrlArray[i],
          faIcon   : mediaIconArray[i]
        };
      }
      mediaJSON = {
        media          : media,
        mediaTypeArray : mediaTypeArray,
        mediaUrlArray  : mediaUrlArray,
        thumbUrlArray  : thumbUrlArray,
        mediaIconArray : mediaIconArray
      };
    }
    return mediaJSON;
  };

  this.buildStatusFeedData = (mediaJSON, articleText, newFeedMediaQty, statusType) => {
    let statusData  = {};
    const now       = new Date();
    let authorUUID  = '';

    if (statusType === 'newArticle') {
      authorUUID      = vaultService.getMyData('userUUID');
    }
    statusData          = {
      statusUUID      : hashAndKeyGeneratorService.getUUID(),
      authorUUID      : hashAndKeyGeneratorService.getHash512(authorUUID),
      statusType      : statusType,
      article         : articleText,
      postDate        : now.toISOString(),
      moment          : moment(now.toISOString()).fromNow(),
      mediaCount      : newFeedMediaQty,
      type            : mediaJSON.mediaTypeArray,
      url             : mediaJSON.mediaUrlArray,
      thumbUrl        : mediaJSON.thumbUrlArray,
      faIcon          : mediaJSON.mediaIconArray
    };
    return statusData;
  };

  this.buildNewStatusFeedData = (mediaJSON, statusData) => {
    let comments    = [];
    const media     = (mediaJSON.media)?mediaJSON.media:'';
    const newStatus = {
      statusUUID : statusData.statusUUID,
      media      : media,
      statusData : statusData,
      comments   : comments
    };
    return newStatus;
  };

  this.buildCommentFeedData = (statusUUID, commentText, decryptKey) => {
    let now         = new Date();
    let commentData = {
      statusUUID      : statusUUID,
      authorName      : myDataService.getMyData('name'),
      authorThumbnail : myDataService.getMyData('profileImage'),
      commentDate     : now.toISOString(),
      commentMoment   : moment(now.toISOString()).fromNow(),
      commentText     : commentText,
      decryptKey      : decryptKey
    };
    return commentData;
  };

  // simply the menu icon for the feed going red
  this.showHideNewFeedStatusIcon = (show) => {
    if ( show ){
      angular.element( document.getElementsByClassName( 'feedIcon' ) ).removeClass('newMessage');
      angular.element( document.getElementsByClassName( 'feedIcon' ) ).addClass('newMessage');
    }else{
      angular.element( document.getElementsByClassName( 'feedIcon' ) ).removeClass('newMessage');
    }
  };

}]);