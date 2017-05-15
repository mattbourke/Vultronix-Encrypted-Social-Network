'use strict';
const friendRequestSocket = require('../routes/friendrequest/friendrequestSocket');
let   clients             = {};

let ioModule = ( (http)=> {

  let io = require('socket.io')(http);

  io.on('connection', (socket)=> {
    clients[socket.id] = socket;
    // console.log('user has connected');
    clients[socket.id].emit('connection', 'connected');
    socket.on('disconnect', ()=> {
        // console.log('user has disconnected');
        friendRequestSocket.getOnlineFriendsBySession(socket.id, clients, friendRequestSocket.loggedOff);
    });

    socket.on('cacheMyFriendshipUUIDs', (myFriendshipUUIDs)=> {
      // the first insert is my list of myFriendShipUUIDs
      // this is used on disconnect to know what keys to remove.
      friendRequestSocket.cacheMyFriendshipUUIDs(myFriendshipUUIDs.myFriendshipUUIDs, socket.id);
      friendRequestSocket.cacheFriendUUIDs(myFriendshipUUIDs.friendUUIDs, socket.id);
      // this fires off the call back that will alert online friends that user has come online
      friendRequestSocket.getOnlineFriendsBySession(socket.id, clients, friendRequestSocket.tellFriendsImOnline);
    });

    socket.on('cacheMyRequestTokens', (tokensArray)=> {
      // cache tokens in memcached, when a friend request is accepted we'll check if user is online and if so notify
      // them by sockets that friend request has been accepted, what will happen is the client will fire off the
      // pre-existing ajax requests that will get their tokens list and check for new accepted friends etc.
      friendRequestSocket.cacheFriendRequestTokens(tokensArray.tokensArray, socket.id);
    });

    socket.on('loggedOff', ()=> {
      friendRequestSocket.getOnlineFriendsBySession(socket.id, clients, friendRequestSocket.loggedOff);
    });

    socket.on('getMyOnlineFriends', (myFriendshipUUIDs)=> {
      friendRequestSocket.getMyOnlineFriends(socket, myFriendshipUUIDs);
    });

  });

  let getClients = ()=> {
    return clients;
  };

  return{
    getClients
  };

});

module.exports = ioModule;