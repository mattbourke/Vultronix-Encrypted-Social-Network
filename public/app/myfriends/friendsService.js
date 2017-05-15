'use strict';
VultronixApp.service('friendsService', ['$http',
  'myDataService',
  'vaultService',
  'loginService',
  'hashAndKeyGeneratorService',
  'mySocket',
  '$rootScope',
  '$location',
  function ($http, myDataService, vaultService, loginService, hashAndKeyGeneratorService, mySocket, $rootScope, $location) {
  let friendsLookup                   = {};
  let friendsLookupByMyFriendshipUUID = {};

  let _cacheMyFriendshipUUIDs = (friendsListArray) => {
    if (typeof friendsListArray[0] !== 'undefined') {
      let friendsshipUUIDArray = [];
      let friendUUIDsArray     = [];

      angular.forEach(friendsListArray, (item) => {
        friendsshipUUIDArray.push(item.myFriendshipUUID);
        friendUUIDsArray.push(item.friendUUID);
      });

      mySocket.emit('cacheMyFriendshipUUIDs', {
        myFriendshipUUIDs:friendsshipUUIDArray,
        friendUUIDs:friendUUIDsArray
      });
    }
  };


  let _getMyOnlineFriends = () => {
    let friends         = JSON.parse(myDataService.getMyData('friendsList'));
    let friendUUIDArray = [];
    angular.forEach(friends, (item) => {
      friendUUIDArray.push(item.friendUUID);
    });
    mySocket.emit('getMyOnlineFriends', {
      myFriendshipUUIDs:friendUUIDArray
    });
  };

  let _isFriendOnline = (friendUUID) => {
    let onlineFriendsLookup = {};
    let onlineFriends       = JSON.parse(myDataService.getMyData('onlineFriends'));
    let returnValue         = false;
    if (onlineFriends) {
      for (let i = 0, len = onlineFriends.length; i < len; i++) {
        onlineFriendsLookup[onlineFriends[i]] = onlineFriends[i];
      }
    }
    returnValue = (onlineFriendsLookup[friendUUID] !== undefined)?true:false;
    return returnValue;
  };


  let self = this;

  //TODO: remove scope from the service....
  this.getFriendsList = ($scope, overRideCache) => {
    let friends = JSON.parse(myDataService.getMyData('friendsList'));
    let myUUID  = vaultService.getMyData('userUUID');

    if ( Object.prototype.toString.call( friends ) === '[object Array]' && ! overRideCache){
      angular.forEach(friends, (item) => {
        item.onlineStatus = ( _isFriendOnline(item.friendUUID) )?'online':'offline';
      });
      // we simply update it so the online/offline is up to date
      myDataService.setMyData('friendsList', JSON.stringify(friends));
      $scope.loading     = false;
      $rootScope.friends = friends;
      return friends;
    }else{
      $http({
        url: "/friends/myFriends",
        method: "get",
        params:{"myUUID":myUUID}
      }).success((data) => {
        let friendsArray = [];
        loginService.loginValidate(data);
        if (data.requestCount){
          const friends       = vaultService.decrypt(data.friendsJSON);
          friendsArray        = JSON.parse(friends);
          angular.forEach(friendsArray, (item) => {
            item.onlineStatus = ( _isFriendOnline(item.friendUUID) )?'online':'offline';
          });
          myDataService.setMyData('friendsList', JSON.stringify(friendsArray));
          //save to server side memcache
          _cacheMyFriendshipUUIDs(friendsArray);
          _getMyOnlineFriends();
          _getDeletedFriendshipsFromDB();
        }else{
          sessionStorage.removeItem("friendsList");
        }
        if ( $scope ){
          $scope.friends = friendsArray;
          $scope.loading = false;
        }
        $rootScope.friends = friendsArray;
      }).error((data, status) => {
        console.log('error');
        if ( $scope ){
          $scope.statusMessage = 'Error...';
        }
        return status;
      });
    }
  };

  let _saveFriendsList = () => {
    const friends          = myDataService.getMyData('friendsList');
    const encryptedFriends = vaultService.encrypt(friends);
    const myUUID           = vaultService.getMyData('userUUID');
    const friendsList      = {
       friends:encryptedFriends,
       myUUID :myUUID
    };

    $http.post('/friends/upsertFriendList', JSON.stringify(friendsList)).success((response) =>{
      if (response === "success"){
          loginService.loginValidate(response);
          self.getFriendsList({}, true);
      }else{
          console.log('friends list saved failed');
      }
    }).catch((error) => {
      console.log('friends list saved failure');
      console.log(error);
    });

  };

  this.removeNewFriendIcon = () =>{
      angular.element( document.getElementsByClassName( 'fa-user' ) ).removeClass('unread-message');
  };

  let _toggleNewFriendIcon = () =>{
    let currentPath = $location.path();
    if ( currentPath !== "/friendrequest"){
        angular.element( document.getElementsByClassName( 'fa-user' ) ).toggleClass('unread-message');
    }
  };

  this.createFriend = (friendShipToken, name, friendshipUUID, friendUUID, myFriendshipUUID, publicPGP, thumbnail) => {
    let friends     = myDataService.getMyData('friendsList');
    friends         = JSON.parse(friends);
    const newFriend = {name:name,
                       friendshipUUID   : friendshipUUID,
                       friendUUID       : friendUUID,
                       myFriendshipUUID : myFriendshipUUID,
                       publicPGP        : publicPGP.replace(/(?:\r\n|\r|\n)/g, 'linebreak'),
                       thumbnail        : thumbnail
                    };

    // below is because null (returned from sessionStorage) is type object also
    if ( Object.prototype.toString.call( friends ) === '[object Array]' ){
      friends.push(newFriend);
    }else{
      friends = [];
      friends.push(newFriend);
    }

    friends = _stringifyJSON(friends);
    myDataService.setMyData('friendsList', friends);
    _saveFriendsList();

    if ( friendShipToken.length ){
      addAcceptedFriendRequest(friendShipToken, friendshipUUID, friendUUID, myFriendshipUUID, publicPGP);
    }
    _toggleNewFriendIcon();
    return true;
  };

  let addAcceptedFriendRequest = (friendShipToken, friendshipUUID, sendersFriendshipUUID, acceptersFriendshipUUID, sendersPublicPGP) => {
    let acceptersPGP  = vaultService.getMyData('PGPPublic');
    let acceptersName = myDataService.getMyData('name');
    let thumbnail     = myDataService.getMyData('profileImage');

    let acceptedFriendRequest = {
      acceptersName           : acceptersName,
      friendshipUUID          : friendshipUUID,
      sendersFriendshipUUID   : sendersFriendshipUUID,
      acceptersFriendshipUUID : acceptersFriendshipUUID,
      acceptersPGP            : acceptersPGP.replace(/(?:\r\n|\r|\n)/g, 'linebreak'),
      thumbnail               : thumbnail
    };
    //TODO: fix up these variable names
    let jsonAcceptedFriendRequest = JSON.stringify(acceptedFriendRequest);
    vaultService.encrypToPGPKey(jsonAcceptedFriendRequest, sendersPublicPGP).then((pgpMessage) => {
      // success
      let acceptedRequest = pgpMessage.replace(/(?:\r\n|\r|\n)/g, 'linebreak');
      let friendRequest   = {
        friendShipToken        : friendShipToken,
        encryptedFriendRequest : acceptedRequest
      };

      saveAcceptedFriendRequest(friendRequest);
    }).catch((error) => {
      // failure
      console.log(error);
      return false;
    });

  };

  let saveAcceptedFriendRequest = (friendRequest) => {
    $http.post('/friendrequest/addAcceptedFriendRequest', JSON.stringify(friendRequest)).success((response) => {
      if (response === "success"){
          loginService.loginValidate(response);
      }else{
          console.log('friends list saved failed');
      }
    }).catch((error) => {
      console.log('friends list saved failure');
      console.log(error);
    });
  };


  this.isInFriendsList = (friendshipUUID) => {
    let friends = JSON.parse(myDataService.getMyData('friendsList'));

    for (let prop in friends) {
      if (friends.hasOwnProperty(prop)) {
        if ( friends[prop].friendshipUUID === friendshipUUID ){
          return true;
        }
      }
    }
    return false;
  };


  let _sendDeletedFriendToDB = (friend) => {
    const deletedFriendShips = {
      friendUUID   : friend.friendUUID,
      confirmation : vaultService.encrypt('true', friend.friendshipUUID)
    };

    $http.post('/friends/deletedFriendShip', JSON.stringify(deletedFriendShips)).success((response) =>{
      if (response === "success"){
        loginService.loginValidate(response);
      }else{
        console.log('deleted FriendShips saved failed');
      }
    }).catch((error) => {
      console.log('deleted FriendShips saved failure');
      console.log(error);
    });
  };

  let _stringifyJSON = (JSONObject) => {
    // below from stackoverflow
    //---------
    let cache  = [];
    let JSONString = JSON.stringify(JSONObject, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            // console.log("Circular reference found, discard key");
            return;
        }
        // console.log("value = '" + value + "'");
        // Store value in our collection
        cache.push(value);
      }
      return value;
    });
    cache = null; // Enable garbage collection
    //----------
    return JSONString;
  };

  this.deleteFriend = ($scope, friendUUID) =>{
    let friends        = JSON.parse(myDataService.getMyData('friendsList'));
    let friendToDelete = {};
    if (friends) {
      for (let i = 0, len = friends.length; i < len; i++) {
        if ( friends[i] && typeof friends[i].friendUUID !== undefined && friends[i].friendUUID === friendUUID ){
          friendToDelete = friends[i];
          friends.splice(i, 1);
        }
      }
      $scope.friends = friends;
      myDataService.setMyData('friendsList', _stringifyJSON(friends));
      _saveFriendsList();
      if ( Object.keys(friendToDelete).length ){
        _sendDeletedFriendToDB(friendToDelete);
      }
    }
  };


  this.getMyFriendshipUUIDTokensArray = () => {
    let myFriendshipUUIDTokensArray = [];
    let friends                     = JSON.parse(myDataService.getMyData('friendsList'));
    if ( friends ){
      for (let i = 0, len = friends.length; i < len; i++) {
        myFriendshipUUIDTokensArray.push(friends[i].myFriendshipUUID);
      }
    }
    return myFriendshipUUIDTokensArray;
  };

  this.updateFriendNameByFriendsUUID = (friendUUID, newName) => {
    let friends = JSON.parse(myDataService.getMyData('friendsList'));
    if (friends) {
      for (let i = 0, len = friends.length; i < len; i++) {
        if ( friends[i].friendUUID === friendUUID ){
          friends[i].name = newName;
        }
      }
    }
    myDataService.setMyData('friendsList', JSON.stringify(friends));
    _saveFriendsList();
  };

  this.getFriendshipByFriendsUUID = (friendUUID) => {
    let friends = JSON.parse(myDataService.getMyData('friendsList'));
    if (friends) {
      for (let i = 0, len = friends.length; i < len; i++) {
        friendsLookup[friends[i].friendUUID] = friends[i];
      }
    }
    let friend = friendsLookup[friendUUID];
    return friend;
  };


  this.getFriendshipByMyFriendshipUUID = (myFriendshipUUID) => {
    let friends = JSON.parse(myDataService.getMyData('friendsList'));
    if (friends) {
      for (let i = 0, len = friends.length; i < len; i++) {
        friendsLookupByMyFriendshipUUID[friends[i].myFriendshipUUID] = friends[i];
      }
    }

    let friend = friendsLookupByMyFriendshipUUID[myFriendshipUUID];
    return friend;
  };


  let _getDeletedFriendshipsFromDB = () => {
    let myFriendshipUUIDTokensArray = self.getMyFriendshipUUIDTokensArray();
    $http({
      url: "/friends/getDeletedFriendShips",
      method: "get",
      params:{"tokens":myFriendshipUUIDTokensArray}
    }).success((data) => {
      loginService.loginValidate(data);
      if ( data.length ){
        angular.forEach(data, (item) => {
          let friendshipData = self.getFriendshipByMyFriendshipUUID(item.friendUUID);
          if ( friendshipData !== undefined  && vaultService.decrypt(item.confirmation, friendshipData.friendshipUUID) === "true" ){
            self.deleteFriend( {}, friendshipData.friendUUID );
          }
        });
      }

    }).error(() => {
        console.log('getDeletedFriendShips error');
    });
  };

}]);