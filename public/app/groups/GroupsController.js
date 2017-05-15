'use strict';
VultronixApp.controller('GroupsController', ['$scope',
  'groupsService',
  'socketsService',
  ($scope, groupsService, socketsService)=> {
  $scope.loading       = true;
  $scope.warning       = false;
  $scope.statusMessage = 'Loading...';

  $scope.leaveGroup = (groupUUID)=> {
    $scope.groups = groupsService.leaveGroup(groupUUID);
  };

  let init = ()=> {
    $scope.warning = groupsService.isMyProfileEmpty();
    groupsService.getGroups().then((groups)=> {
      $scope.groups  = groups;
      $scope.loading = false;
    });
  };
  init();
}]);

VultronixApp.controller('groupInviteRequestController', ['$scope',
  'groupsService',
  '$http',
  '$routeParams',
  'loginService',
  'socketsService',
  'vaultService',
  'hashAndKeyGeneratorService',
  'groupService',
   ($scope, groupsService, $http, $routeParams, loginService, socketsService, vaultService, hashAndKeyGeneratorService, groupService)=> {
    let currentGroup           = 123;
    $scope.credentials         = {};
    $scope.generateLink        = true;
    $scope.generateMore        = false;
    $scope.groupInviteFormShow = true;
    $scope.groupInviteTokenDiv = false;

    $scope.createRequest = ()=> {
      const message              = $scope.credentials.message;
      const UUID                 = hashAndKeyGeneratorService.getUUID();
      const credentialsToHash    = message + UUID;
      const hashToken            = hashAndKeyGeneratorService.getHash512(credentialsToHash);
      const hashStruct           = hashAndKeyGeneratorService.getHashStruct(hashToken);
      const passphrase           = hashStruct.hashOne;
      const groupShipToken       = hashStruct.hashThree;
                                   groupService.upsertTokensJSON(groupShipToken);
      const currentGroupsDetails = groupsService.getGroupByUUID(currentGroup);
      if( currentGroupsDetails ){
        const groupJSON = {
          groupUUID        : currentGroupsDetails.groupUUID,
          groupName        : currentGroupsDetails.groupName,
          groupDescription : currentGroupsDetails.groupDescription,
          groupThumb       : currentGroupsDetails.groupThumb,
          groupCreatorName : currentGroupsDetails.groupCreatorName
        };

        const groupInviteRequest = {
          tokenUUID : groupShipToken,
          groupJSON : vaultService.encrypt(groupJSON, passphrase)
        };


        $http.post('/groups/createGroupInviteRequestToken', JSON.stringify(groupInviteRequest)).success((response)=>{
          if(response.createRequestStatus === "success"){
            $scope.groupInviteFormShow = false;
            $scope.generateLink        = false;
            $scope.groupInviteTokenDiv = true;
            $scope.generateMore        = true;
            $scope.groupShipToken      = hashToken;
          }else{
            //todo: error handling
            console.log('create group invite request error');
          }
        }).error((data)=> {
          console.log(data);
        });
      }else{
        console.log('no group in group list matching ID');
      }
    };

    $scope.anotherRequest = ()=> {
      $scope.friendshipFormShow = true;
      $scope.generateLink       = true;
      $scope.groupShipTokenDiv  = false;
      $scope.generateMore       = false;
    };

}]);


VultronixApp.controller('acceptGroupRequestController', ['$scope',
 'groupsService',
 '$http',
 '$routeParams',
 'loginService',
 'hashAndKeyGeneratorService',
 'vaultService',
 '$location',
 'socketsService',
  ($scope, groupsService, $http, $routeParams, loginService, hashAndKeyGeneratorService, vaultService, $location, socketsService)=> {

  $scope.credentials   = {};
  $scope.groupFormShow = true;
  $scope.groupTokenDiv = false;
  $scope.tokenFormShow = true;
  $scope.readRequest   = true;
  $scope.acceptRequest = false;
  $scope.cancelRequest = false;

  let groupRequest    = {
      groupShipToken    : "",
      groupUUID         : "",
      groupName         : "",
      groupThumbnail    : "",
      groupDescription  : "",
      invitersName      : "",
      invitersThumbnail : "",
      invitationMessage : "",
      createdDate       : ""
  };

  $scope.enterRequestToken = ()=> {
    const groupRequestToken = $scope.credentials.token;
    const hashStruct        = hashAndKeyGeneratorService.getHashStruct(groupRequestToken);
    const passphrase        = hashStruct.hashOne;
    const groupShipToken    = hashStruct.hashThree;
    $scope.tokenStatus      = "";
    $http({
      url: "/groups/enterRequestToken",
      method: "get",
      params:{"groupRequestToken":groupShipToken}
    }).success((data)=> {
      if( data.found === "success"){
        groupRequest.groupShipToken     = data.tokenUUID;
        groupRequest.groupName          = vaultService.decrypt(data.groupName,          passphrase);
        groupRequest.groupThumbnail     = vaultService.decrypt(data.groupThumbnail,     passphrase);
        groupRequest.groupDescription   = vaultService.decrypt(data.groupDescription,   passphrase);
        groupRequest.groupUUID          = vaultService.decrypt(data.groupUUID,          passphrase);
        groupRequest.invitersName       = vaultService.decrypt(data.invitersName,       passphrase);
        groupRequest.invitersThumbnail  = vaultService.decrypt(data.invitersThumbnail,  passphrase);
        groupRequest.invitationMessage  = vaultService.decrypt(data.invitationMessage,  passphrase);
        groupRequest.createdDate        = data.createdDate;
        groupRequest.groupEncryptionKey = vaultService.decrypt(data.groupEncryptionKey, passphrase);

        $scope.tokenFormShow            = false;
        $scope.GroupTokenDetailsDiv     = true;
        $scope.groupName                = groupRequest.groupName;
        $scope.inviteMessage            = groupRequest.invitationMessage;
        $scope.invitersName             = groupRequest.invitersName;
        $scope.invitersThumbnail        = groupRequest.invitersThumbnail;
        $scope.isDisabled               = false;
        $scope.acceptRequest            = true;
        $scope.cancelRequest            = true;
        $scope.readRequest              = false;
      }else{
        $scope.tokenFormShow            = true;
        $scope.isDisabled               = true;
        $scope.tokenStatus              = 'Token not found in database';
      }
    }).error((data)=> {
      console.log(data);
    });
  };

  $scope.requestCancel = ()=> {
    $scope.tokenFormShow         = true;
    $scope.GroupTokenDetailsDiv  = false;
    $scope.readRequest           = true;
    $scope.acceptRequest         = false;
    $scope.cancelRequest         = false;
    $scope.credentials.token     = '';
 };

  $scope.acceptGroupInviteRequest = ()=> {
    let myUUID                   = vaultService.getMyData('userUUID');
    let groupRequestToken        = $scope.credentials.token;
    let hashStruct               = hashAndKeyGeneratorService.getHashStruct(groupRequestToken);
    let groupShipToken           = hashStruct.hashThree;
    let myGroupUUID              = hashAndKeyGeneratorService.getHash256(groupRequest.groupEncryptionKey + myUUID);
    let myIDForUpdating          = myUUID + myGroupUUID;
    myIDForUpdating              = hashAndKeyGeneratorService.getHash256(myIDForUpdating);

    let groupJoined = groupsService.acceptGroupInviteRequest( groupRequest.groupName,
                                                              groupRequest.groupUUID,
                                                              groupRequest.groupDescription,
                                                              myGroupUUID,
                                                              groupRequest.groupThumbnail,
                                                              myIDForUpdating,
                                                              groupRequest.groupEncryptionKey,
                                                              groupShipToken
                                                            );
    if( groupJoined === "joined"){
      $routeParams.groupUUID = groupRequest.groupUUID;
      let groupPath          = '/grouppage/'+$routeParams.groupUUID;
      $location.path(groupPath);
    }else{
      alert(groupJoined);
    }
    groupRequest = null;
  };
}]);

VultronixApp.controller('createGroupController', ['$scope',
 'groupsService',
 '$http',
 '$routeParams',
 'loginService',
 'hashAndKeyGeneratorService',
 'myDataService',
 'vaultService',
 '$location',
 'socketsService',
 ($scope, groupsService, $http, $routeParams, loginService, hashAndKeyGeneratorService, myDataService, vaultService, $location, socketsService)=> {
    $scope.groupFormShow  = true;
    $scope.groupTokenDiv  = false;
    $scope.groupDetails   = {};

    $scope.createGroup = ()=> {
      let groupName         = $scope.groupDetails.groupName;
      let groupDescription  = $scope.groupDetails.groupDescription;

      if( ! groupDescription || ! groupName ){
        return false;
      }

      let UUID              = hashAndKeyGeneratorService.getUUID();
      let credentialsToHash = groupName + groupDescription + UUID;
      let hashToken         = hashAndKeyGeneratorService.getHash512(credentialsToHash);
      let hashStruct        = hashAndKeyGeneratorService.getHashStruct(hashToken);
      let encryptionKey     = hashStruct.hashTwo.toString();
      let groupUUID         = hashAndKeyGeneratorService.getUUID();
      let myUUID            = vaultService.getMyData('userUUID');
      let groupAdminUUID    = hashAndKeyGeneratorService.getHash256(myUUID);
      let dateNow           = new Date().getTime();
      let groupCredentials  = {
        groupUUID        : groupUUID,
        groupName        : groupName,
        groupDescription : groupDescription,
        groupThumb       : ' ',
        groupCreatorName : myDataService.getMyData('nickname'),
        groupAdminUUID   : groupAdminUUID,
        createdDate      : dateNow,
        encryptionKey    : encryptionKey
      };

      $scope.submitForm(groupCredentials);
      groupCredentials = null;
    };

    $scope.submitForm = (groupCredentials)=> {
      const myUUID                    = vaultService.getMyData('userUUID');
      let   encryptionKey             = vaultService.getMyData('encryptionKey');
      const groupAdminUUID            = groupCredentials.groupAdminUUID;
      // adding on encryption key as a salt so the admins privacy is further protected.
      const groupAdminHash            = hashAndKeyGeneratorService.getHash256(groupAdminUUID + encryptionKey);
      const encryptedGroupCredentials = {
        groupUUID        : groupCredentials.groupUUID,
        groupName        : vaultService.encrypt( groupCredentials.groupName                 , groupCredentials.encryptionKey),
        groupDescription : vaultService.encrypt( groupCredentials.groupDescription          , groupCredentials.encryptionKey),
        groupThumb       : vaultService.encrypt('images/profile.png'                        , groupCredentials.encryptionKey),
        groupCreatorName : vaultService.encrypt( myDataService.getMyData('nickname')        , groupCredentials.encryptionKey),
        groupAdminUUID   : groupAdminUUID,
        groupAdminHash   : groupAdminHash,
        createdDate      : groupCredentials.createdDate,
        encryptionKey    : groupCredentials.encryptionKey
      };
      encryptionKey = null;
      $http.post('/groups/createNewGroup', JSON.stringify(encryptedGroupCredentials)).success((response)=>{
        if(response === "success"){
          let myGroupUUID        = hashAndKeyGeneratorService.getHash256(groupCredentials.encryptionKey + myUUID);
          let myIDForUpdating    = myUUID+myGroupUUID;
          myIDForUpdating        = hashAndKeyGeneratorService.getHash256(myIDForUpdating);

          $routeParams.groupUUID = groupCredentials.groupUUID;
          let groupPath          = '/grouppage/'+$routeParams.groupUUID;
          groupsService.joinGroup( groupCredentials.groupName,
                                   groupCredentials.groupUUID,
                                   groupCredentials.groupDescription,
                                   myGroupUUID,
                                   groupAdminHash,
                                   groupCredentials.groupThumb,
                                   myIDForUpdating,
                                   groupCredentials.encryptionKey,
                                   groupPath );
        }else{
          console.log(response);
        }
      }).catch((error)=> {
        console.log(error);
      });
    };

    $scope.anotherNewGroup = ()=> {
      $scope.friendshipFormShow = true;
      $scope.generateLink       = true;
      $scope.groupshipTokenDiv  = false;
      $scope.generateMore       = false;
    };
}]);