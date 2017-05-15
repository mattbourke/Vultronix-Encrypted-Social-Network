'use strict';

const isFriendOnline = (friendUUID, callback)=> {

  memcached.get(friendUUID, (err, data)=> {
    if( data ){
      callback(true, data);
    }else{
      callback(false);
    }
  });

};

// the below 3 could use the one function and a different param, but for now I'm having a different function for each type
// as going forward we may add extra functionality to the different kinds of changes
const notifyOnlineFriendsOfProfileUpdate = (friendUUID, clients)=> {
  memcached.get(friendUUID, (err, friendsSession)=> {
    if( friendsSession ){
      clients[friendsSession].emit('friendProfileUpdated', friendUUID);
    }
  });
};

const notifyOnlineFriendsOfProfileImageUpdate = (friendUUID, clients)=> {
  memcached.get(friendUUID, (err, friendsSession)=> {
    if( friendsSession ){
      clients[friendsSession].emit('friendProfileImageUpdated', friendUUID);
    }
  });
};

const notifyOnlineFriendsOfCoverImageUpdate = (friendUUID, clients)=> {
  memcached.get(friendUUID, (err, friendsSession)=> {
    if( friendsSession ){
      clients[friendsSession].emit('friendHeaderImageUpdated', friendUUID);
    }
  });
};


const notifyOnlineFriendsOfBiographyUpdate = (friendUUID, clients)=> {
  memcached.get(friendUUID, (err, friendsSession)=> {
    if( friendsSession ){
      clients[friendsSession].emit('friendBiographyReceived', friendUUID);
    }
  });
};

const emitNotification = (friendUUID, notificationMessage, notificationURL, friendsSession, clients)=> {
  const notificationData = {
    friendUUID,
    notificationURL,
    notificationMessage
  };
  clients[friendsSession].emit('notificationReceived', notificationData);
};


module.exports = {
  isFriendOnline,
  notifyOnlineFriendsOfProfileUpdate,
  notifyOnlineFriendsOfProfileImageUpdate,
  notifyOnlineFriendsOfCoverImageUpdate,
  notifyOnlineFriendsOfBiographyUpdate,
  emitNotification
};