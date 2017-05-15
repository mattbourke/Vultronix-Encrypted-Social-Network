'use strict';

const isFriendOnline = (friendUUID, callback) => {
  memcached.get(friendUUID, (err, data) => {
    if( data ){
      callback(true, data);
    }else{
      callback(false);
    }
  });
};

const notifyOnlineFriendsOfNewStatus = (friendUUID, clients) => {
  memcached.get(friendUUID, (err, friendsSession) => {
    if( friendsSession ){
      clients[friendsSession].emit('friendStatusReceived', friendUUID);
    }
  });
};

const emitNotification = (friendUUID, notificationMessage, notificationURL, friendsSession, clients) => {
  const notificationData = {
    myFriendshipUUID     : friendUUID,
    notificationURL      : notificationURL,
    notificationMessage  : notificationMessage
  };
  clients[friendsSession].emit('notificationReceived', notificationData);
};


module.exports = {isFriendOnline, notifyOnlineFriendsOfNewStatus, emitNotification};