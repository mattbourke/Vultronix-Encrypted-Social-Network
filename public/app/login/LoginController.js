'use strict';
VultronixApp.controller('LoginController', ['$rootScope',
  '$scope',
  '$http',
  'hashAndKeyGeneratorService',
  '$location',
  'vaultService',
  'myDataService',
  'groupsService',
  'friendsService',
  'friendRequestService',
  'imageService',
  'profileService',
  'inboxService',
  'socketsService',
  ($rootScope, $scope, $http, hashAndKeyGeneratorService, $location, vaultService, myDataService, groupsService, friendsService, friendRequestService, imageService, profileService, inboxService, socketsService) => {

  $scope.credentials           = {};
  $scope.credentials.email     = "";
  $scope.credentials.password  = "";
  $scope.credentials.words     = "";
  $scope.loginError            = "";
  $scope.loginStatus           = "";
  $scope.vLogo                 = imageService.logo();
  $scope.socketReady           = false;

  let _getMyData = () => {
    // get and cache friends and groups lists
    friendsService.getFriendsList();
    profileService.getProfileImage(undefined).then((data) => {
      if ( data.requestCount === undefined ) {
        return profileService.decryptAndSetProfileImage(data);
      }
    });
    profileService.getHeaderImage().then((data) => {
      /* below requestcount crap needs to be fixed up, it only exists when nothing found
         if nothing is found it exists and has a value of 0 */
      if ( data.requestCount === undefined ) {
        return profileService.decryptAndSetHeaderImage(data);
      }
    });

    groupsService.getGroups();

    friendRequestService.getFriendRequestTokensCount().then(() => {
      friendRequestService.getAcceptedFriendRequests();
    });

    let _processFriendRequests = (data, prop) => {
      const currentFriendShipToken = data.friendRequests[prop].friendShipToken;
      friendRequestService.decryptAndProcessAcceptedFriendRequest(data, prop).then((request) => {
        if ( ! friendsService.isInFriendsList(request.friendshipUUID) ) {
          // lets create my new friend (who accepted my original friend request);
          friendsService.createFriend('', request.acceptersName, request.friendshipUUID, request.acceptersFriendshipUUID, request.sendersFriendshipUUID, request.acceptersPGP, request.thumbnail);
          friendRequestService.deleteAcceptedFriendRequest(currentFriendShipToken);
          profileService.saveProfileDataAndImagesToNewFriend(request.acceptersFriendshipUUID, request.acceptersPGP, request.friendshipUUID);
          const tokenDeleted = friendRequestService.deleteTokenFromUsersTokenList(currentFriendShipToken);
          if ( tokenDeleted ) {
            friendRequestService.saveTokensList();
          }
        }
      });
    };

    friendRequestService.getFriendRequestTokensCount().then(() => {
      return friendRequestService.getAcceptedFriendRequests();
    }).then((data) => {
      // The below checks if there is encrypted friend requests returned (accepted friend requests) and processes them
      if ( data.friendRequests !== undefined && data.friendRequests[0].encryptedFriendRequest !== undefined) {
        // TODO: code here duplcated in friendRequestController, fix up duplcation.
        for (let prop in data.friendRequests) {
          if (data.friendRequests[prop].encryptedFriendRequest.hasOwnProperty(prop)) {
            _processFriendRequests(data, prop);
          }
        }
      }
    });
  };

  let pageToLoad = () => {
    if (myDataService.getMyData("name") !== 'None') {
      $location.path('/feed');
    } else {
      $location.path('/myprofile');
    }
    $rootScope.showSidebar = true;
    inboxService.getConversationHeaders();
  };

  $scope.login = () => {
    myDataService.deleteCredentials();
    const credentialsToHash = $scope.credentials.email + $scope.credentials.password + $scope.credentials.words;
    const hashStruct        = hashAndKeyGeneratorService.getHashStruct(credentialsToHash);
    const passphrase        = hashStruct.hashOne;
    const encryptionKey     = hashStruct.hashTwo;
    const loginHash         = hashStruct.hashThree;
    vaultService.setEncryptionKeys(hashStruct);

    const loginCredentials  = {
      loginHash : loginHash
    };
    $scope.loginError       = "";
    $scope.loginStatus      = "Logging in, please wait...";
    $http.post('/login/login', JSON.stringify(loginCredentials)).success((response) => {
      if (response.loginStatus === "success") {
        $scope.loginStatus  = "Login succesful, decrypting...";

        let credentials     = {
          privateKeyString : vaultService.decrypt(response.privateKeyString),
          publicKeyString  : vaultService.decrypt(response.publicKeyString),
          UUID             : vaultService.decrypt(response.UUID),
          passphrase       : passphrase,
          encryptionKey    : encryptionKey
        };

        vaultService.setCredentials(credentials);
        _getMyData();
        profileService.getProfile(undefined).then(() => {
          pageToLoad();
        });
        credentials           = null;
        $scope.showMobileMenu = true;
        console.log('Warning!!!: Never copy and paste any code here, it will result in the author of the code hacking your account!');
      }else if (response.loginStatus === 'failure') {
        $scope.loginStatus  = "";
        $scope.loginError   = 'Invalid credentials provided';
      }

    }).error((data) => {
        $scope.loginStatus = data.loginStatus;
        console.log('error');
    });

  };
}]);