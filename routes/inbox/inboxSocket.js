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

const emitMessage = (friendUUID, message, friendsSession, clients)=> {
  const messageData = {
    myFriendshipUUID : friendUUID,
    message          : message
  };
  clients[friendsSession].emit('messageReceived', messageData);
};


const emitUserIsTyping = (friendUUID, friendsSession, clients)=> {
  clients[friendsSession].emit('userTyping', friendUUID);
};



module.exports = {
  isFriendOnline,
  emitMessage,
  emitUserIsTyping
};