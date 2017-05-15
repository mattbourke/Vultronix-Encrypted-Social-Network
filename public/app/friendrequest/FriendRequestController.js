'use strict';
VultronixApp.controller('FriendRequestController', ['$scope',
  'loginService',
  '$routeParams',
  'friendRequestService',
  'socketsService',
  ($scope, loginService, $routeParams, friendRequestService, socketsService) => {
  $scope.warning = false;

  const init = () => {
    $scope.warning = friendRequestService.isMyProfileEmpty();
  };

  init();
}]);


VultronixApp.controller('createFriendRequestController', ['$scope',
  'loginService',
  'hashAndKeyGeneratorService',
  '$http',
  '$routeParams',
  'vaultService',
  'myDataService',
  'friendRequestService',
  'socketsService',
  'friendsService',
  'profileService',
  ($scope, loginService, hashAndKeyGeneratorService, $http, $routeParams, vaultService, myDataService, friendRequestService, socketsService, friendsService, profileService) => {
  let myUUID                 = vaultService.getMyData('userUUID');
  $scope.credentials         = {};
  $scope.friendshipFormShow  = true;
  $scope.generateLink        = true;
  $scope.friendshipTokenDiv  = false;
  $scope.generateMore        = false;
  $scope.validTokensCountDiv = true;

  let _processFriendRequests = (data, prop) => {
    const currentFriendShipToken = data.friendRequests[prop].friendShipToken;
    friendRequestService.decryptAndProcessAcceptedFriendRequest(data, prop).then((request) => {
      if ( ! friendsService.isInFriendsList(request.friendshipUUID) ){
        // lets create my new friend (who accepted my original friend request);
        friendsService.createFriend('', request.acceptersName, request.friendshipUUID, request.acceptersFriendshipUUID, request.sendersFriendshipUUID, request.acceptersPGP, request.thumbnail);
        friendRequestService.deleteAcceptedFriendRequest(currentFriendShipToken);
        profileService.saveProfileDataAndImagesToNewFriend(request.acceptersFriendshipUUID, request.acceptersPGP, request.friendshipUUID);
        const tokenDeleted = friendRequestService.deleteTokenFromUsersTokenList(currentFriendShipToken);
        if ( tokenDeleted ){
          friendRequestService.saveTokensList().then((tokenCount) => {
            $scope.validTokensCount = tokenCount;
          });
        }
      }
    });
  };


  let init = () => {
    friendRequestService.getFriendRequestTokensCount().then((tokensCount) => {
      $scope.validTokensCount = tokensCount;
      return friendRequestService.getAcceptedFriendRequests();
    }).then((data) => {
      // The below checks if there is encrypted friend requests returned (accepted friend requests) and processes them
      if ( data.friendRequests !== undefined && data.friendRequests[0].encryptedFriendRequest !== undefined){
        /* here loops over and decrypts the encrypted friend requests.
           it then adds that friend to the friends list, via a friendsService.createFriend() call
           then it deletes the accepted friend request from the Database via deleteAcceptedFriendRequest();*/
        for (let prop in data.friendRequests) {
          if (data.friendRequests[prop].encryptedFriendRequest.hasOwnProperty(prop)) {
            _processFriendRequests(data, prop);
          }
        }
      }
    });
  };
  init();

  $scope.createRequest = () => {
    const message               = $scope.credentials.message;
    const UUID                  = hashAndKeyGeneratorService.getUUID();
    const credentialsToHash     = message + UUID;
    const hashToken             = hashAndKeyGeneratorService.getHash256(credentialsToHash);
    const hashStruct            = hashAndKeyGeneratorService.getHashStruct(hashToken);
    const passphrase            = hashStruct.hashOne;
    const friendShipToken       = hashStruct.hashThree;
    const tokensJSON            = friendRequestService.upsertTokensJSON(friendShipToken);
    friendRequestService.saveTokensList().then((tokenCount) => {
      $scope.validTokensCount = tokenCount;
    });
    const friendRequest         = {
     friendShipToken         : friendShipToken,
     friendshipUUID          : vaultService.encrypt(vaultService.getRecognisableUniqueHash(), passphrase),
     sendersFriendshipUUID   : vaultService.encrypt(hashAndKeyGeneratorService.getUUID(),     passphrase),
     acceptersFriendshipUUID : vaultService.encrypt(hashAndKeyGeneratorService.getUUID(),     passphrase),
     requestersName          : vaultService.encrypt(vaultService.getMyData('name'),           passphrase),
     requestersPGP           : vaultService.encrypt(vaultService.getMyData('PGPPublic'),      passphrase),
     thumbnail               : vaultService.encrypt(myDataService.getMyData('profileImage'),  passphrase),
     requestMessage          : vaultService.encrypt(message,                                  passphrase),
     tokensJSON              : vaultService.encrypt(JSON.stringify(tokensJSON),               passphrase),
     myUUID                  : vaultService.encrypt(myUUID,                                   passphrase)
    };

    $http.post('/friendrequest/createFriendRequest', JSON.stringify(friendRequest)).success((response) => {
      if (response.createRequestStatus === "success"){
        $scope.friendshipFormShow = false;
        $scope.generateLink       = false;
        $scope.friendshipTokenDiv = true;
        $scope.generateMore       = true;
        $scope.friendshipToken    = hashToken;
        init();
      }else{
        console.log('create friend request error');
      }
    }).error((error) => {
      console.log(error);
    });

  };

  $scope.anotherRequest = () => {
    $scope.friendshipFormShow = true;
    $scope.generateLink       = true;
    $scope.friendshipTokenDiv = false;
    $scope.generateMore       = false;
  };

}]);

VultronixApp.controller('acceptFriendRequestController', ['$scope',
  'loginService',
  'hashAndKeyGeneratorService',
  '$http',
  '$routeParams',
  'vaultService',
  'myDataService',
  'friendRequestService',
  '$location',
  'profileService',
  'socketsService',
  ($scope, loginService, hashAndKeyGeneratorService, $http, $routeParams, vaultService, myDataService, friendRequestService, $location, profileService, socketsService) => {

  $scope.credentials   = {};
  $scope.tokenFormShow = true;
  $scope.readRequest   = true;
  $scope.acceptRequest = false;
  $scope.cancelRequest = false;

  let friendRequest    = {
    friendShipToken        : "",
    friendshipUUID         : "",
    requestersName         : "",
    requestersPGP          : "",
    sendersFriendshipUUID  : "",
    acceptersFriendshipUUID: "",
    requestMessage         : "",
    thumbnail              : ""
  };

  $scope.enterRequestToken = () => {
    const friendRequestToken = $scope.credentials.token;
    const hashStruct         = hashAndKeyGeneratorService.getHashStruct(friendRequestToken);
    const passphrase         = hashStruct.hashOne;
    const friendShipToken    = hashStruct.hashThree;
    $scope.tokenStatus       = "";

    $http({
      url: "/friendrequest/enterRequestToken",
      method: "get",
      params:{"friendRequestToken":friendShipToken}
    }).success((data) => {
      if ( data.found === "success"){
        friendRequest.friendShipToken         = data.friendShipToken;
        friendRequest.friendshipUUID          = vaultService.decrypt(data.friendshipUUID,          passphrase);
        friendRequest.sendersFriendshipUUID   = vaultService.decrypt(data.sendersFriendshipUUID,   passphrase);
        friendRequest.acceptersFriendshipUUID = vaultService.decrypt(data.acceptersFriendshipUUID, passphrase);
        friendRequest.requestersName          = vaultService.decrypt(data.requestersName,          passphrase);
        friendRequest.requestersPGP           = vaultService.decrypt(data.requestersPGP,           passphrase);
        friendRequest.thumbnail               = vaultService.decrypt(data.thumbnail,               passphrase);
        friendRequest.requestMessage          = vaultService.decrypt(data.requestMessage,          passphrase);

        $scope.tokenFormShow             = false;
        $scope.friendshipTokenDetailsDiv = true;
        $scope.friendshipTokenName       = friendRequest.requestersName;
        $scope.friendsThumbnail          = friendRequest.thumbnail;
        $scope.friendshipTokenMessage    = friendRequest.requestMessage;
        $scope.isDisabled                = false;
        $scope.acceptRequest             = true;
        $scope.cancelRequest             = true;
        $scope.readRequest               = false;
      }else{
        $scope.tokenFormShow = true;
        $scope.isDisabled    = true;
        $scope.tokenStatus   = 'Token not found in database';
      }
    }).error((error) => {
      console.log(error);
    });

  };

  $scope.acceptFriendRequest = () => {
    const myRecognisableUniqueHash = vaultService.getRecognisableUniqueHash();
    const uniqueFriendshipHash     = hashAndKeyGeneratorService.getHash512(friendRequest.friendshipUUID + myRecognisableUniqueHash);
    /*TODO: find a better name for the below, the above is used to check you're not accepting a 2nd friend request from
      a person who you previously accepted.
      The below is used to ensure they aren't now accepting a friend request from you after you previously accepted one from them
      eg, bob sends alice a friend request, alice accepts, then for some stupid reason crazy alice sends bob a friend request.
      without this below check if bob accepted it, he'd now have Alice twice in his friends list */
    const reverseFriendshipHash    = hashAndKeyGeneratorService.getHash512(myRecognisableUniqueHash     + friendRequest.friendshipUUID);

    const friendCreated = friendRequestService.createNewFriend( friendRequest.friendShipToken,
                                                                friendRequest.requestersName,
                                                                uniqueFriendshipHash,
                                                                friendRequest.sendersFriendshipUUID,
                                                                friendRequest.acceptersFriendshipUUID,
                                                                friendRequest.requestersPGP,
                                                                friendRequest.thumbnail,
                                                                loginService,
                                                                reverseFriendshipHash );

    if ( friendCreated ){
      profileService.saveProfileDataAndImagesToNewFriend(friendRequest.sendersFriendshipUUID, friendRequest.requestersPGP, uniqueFriendshipHash);
      friendRequest = null;
      $location.path('/myfriends');
    }
  };

  $scope.requestCancel = () => {
    $scope.tokenFormShow             = true;
    $scope.readRequest               = true;
    $scope.acceptRequest             = false;
    $scope.cancelRequest             = false;
    $scope.friendshipTokenDetailsDiv = false;
    $scope.credentials.token         = '';
 };

}]);
