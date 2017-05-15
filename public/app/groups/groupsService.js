'use strict';
VultronixApp.service('groupsService', ['$http',
  'myDataService',
  'vaultService',
  'loginService',
  'hashAndKeyGeneratorService',
  '$location',
  'groupPageService',
  '$q',
  function ($http, myDataService, vaultService, loginService, hashAndKeyGeneratorService, $location, groupPageService, $q) {

  this.getGroups = (overRideCache)=> {
    let   groups = JSON.parse(myDataService.getMyData('groupsList'));
    const myUUID = vaultService.getMyData('userUUID');

    return $q((resolve, reject)=> {
      if( Object.prototype.toString.call( groups ) === '[object Array]' && ! overRideCache){
        return resolve(groups);
      }else{
        $http({
          url: "/groups/myGroups",
          method: "get",
          params:{"myUUID":myUUID}
        }).success((data)=> {
          let groupsArray = [];
          loginService.loginValidate(data);
          if(data.requestCount){
            let groups  = vaultService.decrypt(data.groupsJSON);
            groupsArray = JSON.parse(groups);
            myDataService.setMyData('groupsList', JSON.stringify(groupsArray));
            return resolve(groupsArray);
          }else{
            sessionStorage.removeItem("groupsList");
          }
          return resolve(groupsArray);
        }).error((data)=> {
          console.log('error');
          return reject(data);
        });
      }
    });
  };

  let saveGroupsList = ()=> {
    const myUUID          = vaultService.getMyData('userUUID');
    const groups          = myDataService.getMyData('groupsList');
    const encryptedGroups = vaultService.encrypt(groups);

    const groupsList      = {
      groups:encryptedGroups,
      myUUID:myUUID
    };

    $http.post('/groups/upsertGroupList', JSON.stringify(groupsList)).success((response)=> {
      if(response === "success"){
        loginService.loginValidate(response);
      }else{
        console.log('groups list saved failed');
      }
    }).catch((error)=> {
      console.log(error);
    });
  };

  this.joinGroup = (groupName, groupUUID, groupDescription, myGroupUUID, groupAdminHash, thumbnail, myIDForUpdating, encryptionKey, groupPath)=> {
    let groups   = myDataService.getMyData('groupsList');
    groups       = JSON.parse(groups);

    let newGroup = {
      groupName        : groupName,
      groupUUID        : groupUUID,
      groupDescription : groupDescription,
      myGroupUUID      : myGroupUUID,
      groupAdminHash   : groupAdminHash,
      thumbnail        : thumbnail,
      encryptionKey    : encryptionKey
    };
    // below is because null (returned from sessionStorage) is type object also
    if( Object.prototype.toString.call( groups ) === '[object Array]' ){
      groups.push(newGroup);
    }else{
      groups = [];
      groups.push(newGroup);
    }

    groups = _stringifyJSON(groups);

    myDataService.setMyData('groupsList', groups);
    saveGroupsList();
    addMemberToGroupMemberList(groupUUID, myGroupUUID, myIDForUpdating, encryptionKey, groupPath);
    return true;
  };

  let _removeMyGroupMembershipFromDB = (memberIDForUpdating)=> {
    const myGroupMembership = {
      memberIDForUpdating : memberIDForUpdating
    };

    $http.post('/groups/removeMyGroupMembershipFromDB', JSON.stringify(myGroupMembership)).success((response)=> {
      if(response === "success"){
        loginService.loginValidate(response);
      }else{
        console.log('removeMyGroupMembershipFromDBsaved failed');
      }
    }).catch((error)=> {
      console.log('removeMyGroupMembershipFromDB saved failure');
      console.log(error);
    });
  };

  let _stringifyJSON = (JSONObject)=> {
    // below from stackoverflow
    //---------
    let cache      = [];
    let JSONString = JSON.stringify(JSONObject, (key, value)=> {
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

  this.leaveGroup = (groupUUID)=> {
    let groups           = JSON.parse(myDataService.getMyData('groupsList'));
    let groupCredentials = groupPageService.getGroupByUUID(groupUUID);
    const myUUID         = vaultService.getMyData('userUUID');
    let myGroupUUID      = hashAndKeyGeneratorService.getHash256(groupCredentials.encryptionKey + myUUID);
    let myIDForUpdating  = myUUID+myGroupUUID;
    myIDForUpdating      = hashAndKeyGeneratorService.getHash256(myIDForUpdating);
    let groupDeleted     = false;
    if(groups) {
      for (let i = 0, len = groups.length; i < len; i++) {
        if( groups[i] && typeof groups[i].groupUUID !== undefined && groups[i].groupUUID === groupUUID ){
          groupDeleted = true;
          groups.splice(i, 1);
        }
      }
      myDataService.setMyData('groupsList', _stringifyJSON(groups));
      saveGroupsList();
      if( groupDeleted ){
        _removeMyGroupMembershipFromDB(myIDForUpdating);
      }
      return groups;
    }else{
      return [];
    }
  };

  this.acceptGroupInviteRequest = (groupName, groupUUID, groupDescription, myGroupUUID, thumbnail, myIDForUpdating, encryptionKey, groupShipToken)=> {
    let alreadyMemberOfGroup = isInGroupsList(groupUUID);
    if( ! alreadyMemberOfGroup ){
        let groupJoined = this.joinGroup(groupName, groupUUID, groupDescription, myGroupUUID, '', thumbnail, myIDForUpdating, encryptionKey);
        if( groupJoined ){
          _deleteGroupInviteFromDB(groupShipToken);
          return "joined";
        }else{
          return "There has been an error";
        }
    }else{
      return "You're already a member of this group";
    }
  };

  let _deleteGroupInviteFromDB = (groupShipToken)=>{
    let inviteToken = {
      groupRequestToken : groupShipToken
    };

    $http.post('/groups/deleteRequestToken', JSON.stringify(inviteToken)).success((response)=>{
      loginService.loginValidate(response);
      if(response !== "success"){
        console.log(response);
      }
    }).catch((error)=> {
      console.log(error);
    });
  };

  let addMemberToGroupMemberList = (groupUUID, myGroupUUID, myIDForUpdating, encryptionKey, groupPath)=> {
    let myPublicPGP    = vaultService.getMyData('PGPPublic');
        myPublicPGP    = myPublicPGP.replace(/(?:\r\n|\r|\n)/g, 'linebreak');
    let myName         = myDataService.getMyData('nickname');
    let myProfileImage = myDataService.getMyData('profileImage');

    let myGroupDetails = {
      groupUUID       : groupUUID,
      myGroupUUID     : vaultService.encrypt( myGroupUUID    , encryptionKey),
      myGroupName     : vaultService.encrypt( myName         , encryptionKey),
      myIDForUpdating : myIDForUpdating,
      myGroupThumb    : vaultService.encrypt( myProfileImage , encryptionKey),
      myPublicPGP     : vaultService.encrypt( myPublicPGP    , encryptionKey)
    };

    $http.post('/groups/addMemberToGroupMemberList', JSON.stringify(myGroupDetails)).success((response)=>{
      if(response === "success"){
        loginService.loginValidate(response);
        $location.path(groupPath);
      }else{
        console.log(response);
      }
    }).catch((error)=> {
      console.log(error);
    });
  };


  let isInGroupsList = (groupUUID)=> {
    let groups = JSON.parse(myDataService.getMyData('groupsList'));

    for (let prop in groups) {
      if (groups.hasOwnProperty(prop)) {
        if( groups[prop].groupUUID === groupUUID ){
          return true;
        }
      }
    }
    return false;
  };

  this.isMyProfileEmpty = ()=> {
    const nickname     = myDataService.getMyData('nickname');
    const profileImage = myDataService.getMyData('profileImage');
    // null === object
    if( typeof nickname === "object" || nickname === 'None' || ! profileImage ){
      return true;
    }
    return false;
  };

}]);