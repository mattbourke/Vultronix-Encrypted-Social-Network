'use strict';
VultronixApp.service('friendRequestService', ['$http',
  'myDataService',
  'vaultService',
  'loginService',
  'hashAndKeyGeneratorService',
  'friendsService',
  'profileService',
  'mySocket',
  '$q',
  function ($http, myDataService, vaultService, loginService, hashAndKeyGeneratorService, friendsService, profileService, mySocket, $q) {

  this.createNewFriend = (friendShipToken, name, friendshipUUID, friendUUID, myFriendshipUUID, publicPGP, thumbnail, loginService, reverseFriendshipHash)=> {
    // myRecognisableUniqueHash = vaultService.getRecognisableUniqueHash();
    // the friendshipUUID is their getRecognisableUniqueHash + my getRecognisableUniqueHash
    // so here we check to make sure its not me being friends with my self
    const myRecognisableUniqueHash = hashAndKeyGeneratorService.getHash512(vaultService.getRecognisableUniqueHash() + vaultService.getRecognisableUniqueHash());
    if( friendshipUUID === myRecognisableUniqueHash){
      alert('you cannot be friends with yourself');
      return false;
    }else if( friendsService.isInFriendsList(friendshipUUID) || friendsService.isInFriendsList(reverseFriendshipHash)){
      alert('This person is already your friend');
      return false;
    }
    return friendsService.createFriend(friendShipToken, name, friendshipUUID, friendUUID, myFriendshipUUID, publicPGP, thumbnail, loginService);
  };


  this.saveTokensList = ()=> {
    const myUUID          = vaultService.getMyData('userUUID');
    const tokens          = myDataService.getMyData('tokensJSON');
    const encryptedTokens = vaultService.encrypt(tokens);
    let   tokensList      = {
      tokens : encryptedTokens,
      myUUID : myUUID
    };
    return $q((resolve)=> {
      $http.post('/friendrequest/upsertTokensList', JSON.stringify(tokensList)).success((response)=>{
        if(response === "success"){
          loginService.loginValidate(response);
          let tokenCount = JSON.parse(tokens).length;
          return resolve( (! isNaN(tokenCount) )?tokenCount:0 );
        }else{
          // consider rejecting this instead
          console.log('tokens list saved failed');
          return resolve(0);
        }
      }).catch((error)=> {
        console.log('tokens list saved failure');
        console.log(error);
      });
    });

  };

  this.upsertTokensJSON = (token)=>{
    const tokensJSON  = myDataService.getMyData('tokensJSON');
    let   tokensArray = JSON.parse(tokensJSON);

    const newToken    = {
      token       : token,
      dateCreated : new Date().getTime()
    };

    // below is because null (returned from sessionStorage) is type object also
    if( Object.prototype.toString.call( tokensArray ) === '[object Array]' ){
      tokensArray.push(newToken);
    }else{
      tokensArray = [];
      tokensArray.push(newToken);
    }

    myDataService.setMyData('tokensJSON', JSON.stringify(tokensArray));
    return tokensArray;
  };

  this.deleteTokenFromUsersTokenList = (friendShipToken) => {
    const tokens      = myDataService.getMyData('tokensJSON');
    let   tokensJSON  = JSON.parse(tokens);
    let   arrayEdited = false;
    if( friendShipToken !== undefined ){

      tokensJSON.forEach( (arrayItem, index, object) => {
        if( arrayItem.token === friendShipToken ){
          object.splice(index, 1);
          arrayEdited = true;
        }
      });
    }else{
      tokensJSON  = [];
      arrayEdited = true;
    }

    if(arrayEdited){
      myDataService.setMyData('tokensJSON', JSON.stringify(tokensJSON));
    }
    return arrayEdited;
  };

  this.deleteAcceptedFriendRequest = (friendShipToken)=>{
    const token = {
      friendShipTokenToDelete:friendShipToken
    };

    $http.post('/friendrequest/removeAcceptedFriendRequest', JSON.stringify(token)).success((response)=>{
      if(response !== "success"){
        console.log('AcceptedFriendRequest delete failed');
      }
    }).catch(function(error) {
      console.log('AcceptedFriendRequest delete failure');
      console.log(error);
    });
  };

  this.decryptAndProcessAcceptedFriendRequest = (data, prop)=>{
    return $q((resolve, reject)=> {
      vaultService.decryptPGPMessage(data.friendRequests[prop].encryptedFriendRequest).then((decryptedMessage)=> {
        var request = JSON.parse(decryptedMessage);
        return resolve(request);
      }).catch((error)=> {
        console.log(error);
        return reject('error');
      });
    });
  };

  this.getAcceptedFriendRequests = ()=>{
    const tokens          = myDataService.getMyData('tokensJSON');
    let   tokensJSON      = JSON.parse(tokens);
    // tokens will only exist for 2 weeks, then the users client code will need to delete them
    const dateTwoWeeksAgo = new Date().getTime() - (14 * 24 * 60 * 60 * 1000);

    if( Object.prototype.toString.call( tokensJSON ) === '[object Array]' ){
      var myTokensArray     = [];
      var tokensArrayEdited = false;

      tokensJSON.forEach( (arrayItem, index, object) => {
        if( arrayItem.dateCreated > dateTwoWeeksAgo ){
          myTokensArray.push(arrayItem.token);
        }else{
          object.splice(index, 1);
          tokensArrayEdited = true;
        }
      });

      if(tokensArrayEdited){
        myDataService.setMyData('tokensJSON', JSON.stringify(tokensJSON));
      }
      return $q( (resolve)=> {
        $http({
          url: "/friendrequest/getAcceptedFriendRequest",
          method: "get",
          params:{"tokens":myTokensArray}
        }).success((data)=> {
          loginService.loginValidate(data);
          return resolve(data);
        }).error( (error)=> {
          console.log(error);
        });
      });
    }else{
      return false;
    }
  };

  let _cacheFriendRequestTokens = (tokenList)=>{
    let tokensArray = [];
    for (let prop in tokenList) {
      if (tokenList[prop].token.hasOwnProperty(prop)) {
        tokensArray.push(tokenList[prop].token);
      }
    }

    if (typeof tokensArray[0] !== 'undefined') {
      mySocket.emit('cacheMyRequestTokens', {
        tokensArray  : tokensArray
      });
    }
  };

  this.getFriendRequestTokensCount = ()=>{
    const myUUID  = vaultService.getMyData('userUUID');

    return $q( (resolve)=> {
      $http({
        url: "/friendrequest/getFriendRequestTokenList",
        method: "get",
        params:{"myUUID":myUUID}
      }).success( (data)=> {
        loginService.loginValidate(data);

        if( data.tokensJSON !== undefined){
          const decryptedTokensString = vaultService.decrypt(data.tokensJSON);
          if( decryptedTokensString.length ){
            let decryptedTokenList  = JSON.parse(decryptedTokensString);
            myDataService.setMyData('tokensJSON', JSON.stringify(decryptedTokenList));
            const validTokensCount  = (! isNaN(decryptedTokenList.length))?decryptedTokenList.length:0;
            _cacheFriendRequestTokens(decryptedTokenList);
            return resolve(validTokensCount);
          }else{
            return resolve(0);
          }
        }else{
          return resolve(0);
        }
      }).error((error)=> {
        console.log(error);
      });
    });
  };


  this.isMyProfileEmpty = ()=>{
    const profileImage = myDataService.getMyData('profileImage');
    const headerImage  = myDataService.getMyData('headerImage');
    if( ! profileImage || ! headerImage ){
      return true;
    }
    return false;
  };

}]);