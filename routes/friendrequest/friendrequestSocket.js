'use strict';

let removeCachedMyFriendshipUUIDs = (sessionID) => {
  let myFriendshipUUIDsArray = [];
  memcached.get(sessionID, (err, data) => {

    if (data) {
      myFriendshipUUIDsArray = JSON.parse(data);

      if (myFriendshipUUIDsArray) {
         memcached.del(sessionID, (err) => { });
         myFriendshipUUIDsArray.forEach((myFriendshipUUID) => {
             memcached.del(myFriendshipUUID, (err) => {  });
         });
      }
    }
  });
};

let cacheMyFriendshipUUIDs = (myFriendshipUUIDs, sessionID) => {
  const friendsshipUUIDArray = myFriendshipUUIDs;
  const myFrindUUIDsJSON     = JSON.stringify(friendsshipUUIDArray);
  // for now we're placing it in there for 100 minutes
  // TODO: matt, readup on the below, shouldn't that be 6 seconds?
  memcached.set(sessionID, myFrindUUIDsJSON, 6000, (err) => {
    if (err) {
      console.log(err);
    }
  });

  friendsshipUUIDArray.forEach((friendUUID) => {
    memcached.set(friendUUID, sessionID, 6000, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
};

const removeCachedFriendUUIDs = (sessionID) => {
  const myFriendsKey = "myFriends"+sessionID;
  memcached.del(myFriendsKey, (err) => {  });
};

const removeCachedTokens = (sessionID) => {
  const myTokensKey = "myTokens"+sessionID;

  memcached.get(myTokensKey, (err, data) => {
    if (data) {
      const myTokenssArray = JSON.parse(data);

      if (myTokenssArray) {
         memcached.del(myTokensKey, (err) => { });

         myTokenssArray.forEach((myToken) => {
            memcached.del(myToken, (err) => {  });
         });
      }
    }
  });
};

const cacheFriendUUIDs = (friendUUIDs, sessionID) => {
  const friendUUIDsJSON  = JSON.stringify(friendUUIDs);
  const myFriendsKey     = "myFriends"+sessionID;
  // for now we're placing it in there for 100 minutes
  memcached.set(myFriendsKey, friendUUIDsJSON, 6000, (err) => {
    if (err) {
      console.log(err);
    }
  });
};


const getOnlineFriendsBySession = (sessionID, clients, callback) => {
  const myFriendsKey = "myFriends"+sessionID;
  //TODO: break this function up, implement tests
  memcached.get(myFriendsKey, (err, data) => {
    if (err) {
      console.log(err);
    }else if( data !== undefined ){
      let friendsshipUUIDArray       = JSON.parse(data);
      let myOnlineFriendsArray       = [];
      let memCacheLoopCount          = 0;
      let friendObject               = {};
      let friendsshipUUIDArrayLength = friendsshipUUIDArray.length;

      for (let i = 0; i <= friendsshipUUIDArrayLength; i++) {
        ((cntr) => {
          let friendUUID = friendsshipUUIDArray[cntr];

          memcached.get(friendUUID, (err, data)=> {
              memCacheLoopCount++;
              if( data !== undefined ){

                friendObject.session    = data;
                friendObject.friendUUID = friendUUID;
                myOnlineFriendsArray.push(friendObject);
              }

              if ( cntr === friendsshipUUIDArrayLength ) {
                if ( callback ) {
                  callback(sessionID, clients, myOnlineFriendsArray);
                }else{
                  return myOnlineFriendsArray;
                }
              }
          });
        })(i);
      }
    }
  });
};

const loggedOff = (session, clients, friendUUIDsArray) => {
  removeCachedMyFriendshipUUIDs(session);
  removeCachedFriendUUIDs(session);
  removeCachedTokens(session);
  let friendsSession;
  friendUUIDsArray.forEach((friendUUID) => {
    friendsSession = friendUUID.session;
    clients[friendsSession].emit('updateOnlineFriendToOffline', friendUUID.friendUUID);
  });
};

let tellFriendsImOnline = (session, clients, friendUUIDsArray)=> {
  let friendUUID;
  let friendsSession;
  for (let i = 0, len = friendUUIDsArray.length; i < len; i++){
    friendUUID     = friendUUIDsArray[i].friendUUID;
    friendsSession = friendUUIDsArray[i].session;
    clients[friendsSession].emit('updateFriendToOnline', friendUUID);
  }
};

let getMyOnlineFriends = (socket, myFriendshipUUIDs) => {
  const friendsshipUUIDArray       = myFriendshipUUIDs.myFriendshipUUIDs;
  const friendsshipUUIDArrayLength = friendsshipUUIDArray.length - 1;
  let   myOnlineFriendsArray       = [];

  friendsshipUUIDArray.forEach( (friendShipUUID, i) => {
      ( (friendUUID, cntr) => {

        memcached.get(friendUUID, (err, data) => {
          if ( data !== undefined ) {
            myOnlineFriendsArray.push(friendUUID);
          }
          if ( cntr === friendsshipUUIDArrayLength ) {
            socket.emit('updateOnlineFriends', { onlineFriends: myOnlineFriendsArray });
          }
        });

      })(friendShipUUID, i);
  });
};

const _sendNotificationOfNewAcceptedFriend = (friendsSession, clients) => {
  clients[friendsSession].emit('friendRequestAccepted', true);
};

const notifyFriendOfAcceptance = (token, clients) => {
    memcached.get(token, (err, friendsSession) => {
      if (friendsSession) {
        _sendNotificationOfNewAcceptedFriend(friendsSession, clients);
      }
    });
};


const cacheFriendRequestTokens = (tokensArray, sessionID) => {
  let myTokensJSON = JSON.stringify(tokensArray);
  let myTokensKey  = "myTokens"+sessionID;
  // for now we're placing it in there for 100 minutes
  memcached.set(myTokensKey, myTokensJSON, 6000, (err) => {
    if (err) {
      console.log(err);
    }
  });

  tokensArray.forEach( (token) => {
    memcached.set(token, sessionID, 6000, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
};

module.exports = {
  removeCachedMyFriendshipUUIDs,
  removeCachedTokens,
  cacheMyFriendshipUUIDs,
  removeCachedFriendUUIDs,
  cacheFriendUUIDs,
  getOnlineFriendsBySession,
  loggedOff,
  tellFriendsImOnline,
  getMyOnlineFriends,
  notifyFriendOfAcceptance,
  cacheFriendRequestTokens
};

