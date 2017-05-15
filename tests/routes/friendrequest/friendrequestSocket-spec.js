import {
  removeCachedMyFriendshipUUIDs,
  cacheMyFriendshipUUIDs,
  removeCachedFriendUUIDs,
  removeCachedTokens,
  cacheFriendUUIDs,
  getOnlineFriendsBySession,
  loggedOff,
  tellFriendsImOnline,
  getMyOnlineFriends,
  notifyFriendOfAcceptance,
  cacheFriendRequestTokens} from '../../../routes/friendrequest/friendrequestSocket';
import sinon                from 'sinon';
import {assert, expect}     from 'chai';
let clients                       = {emit:function(){}};
clients.session123                = {emit:function(){}};
clients.session456                = {emit:function(){}};
let tellFriendOneSomethingStub    = {};
let tellFriendSomethingOnlineStub = {};
tellFriendOneSomethingStub        = sinon.stub(clients.session123, 'emit');
tellFriendSomethingOnlineStub     = sinon.stub(clients.session456, 'emit');
global.memcached                  = {};
memcached.get                     = sinon.spy();
memcached.set                     = sinon.spy();
memcached.del                     = sinon.spy();

const friendUUIDsArray  = [ {
                          friendUUID : 'friendUUID123',
                          session    : 'session123'
                        },
                        {
                          friendUUID : 'friendUUID456',
                          session    : 'session456'
                        }
                      ];

describe('friendrequestSocket', function(){

  beforeEach(function(){
  });

  afterEach(function(){


  });

  describe('tellFriendsImOnline function', function(){
    it('should tell friends I am online', function(){
      tellFriendsImOnline(undefined, clients, friendUUIDsArray);
      assert.equal(tellFriendOneSomethingStub.calledWithExactly('updateFriendToOnline', 'friendUUID123'), true);
      assert.equal(tellFriendSomethingOnlineStub.calledWithExactly('updateFriendToOnline', 'friendUUID456'), true);
    });
  });


  describe('removeCachedMyFriendshipUUIDs', function(){
    it('should check memcached is called', function(){
      removeCachedMyFriendshipUUIDs('sessionID');
      sinon.assert.calledWith(memcached.get, 'sessionID');
    });
  });

  describe('cacheMyFriendshipUUIDs', function(){
    it('should add sessionID to memcached and friendUUIDs', function(){
      const myFriendshipUUIDs = ['123', '567', 'abc'];
      const sessionID         = 'abc123';
      cacheMyFriendshipUUIDs(myFriendshipUUIDs, sessionID);
      sinon.assert.calledWith(memcached.set, sessionID, JSON.stringify(myFriendshipUUIDs), 6000);
      sinon.assert.calledWith(memcached.set, '123', sessionID, 6000);
      sinon.assert.calledWith(memcached.set, '567', sessionID, 6000);
      sinon.assert.calledWith(memcached.set, 'abc', sessionID, 6000);
    });
  });

  describe('removeCachedFriendUUIDs', function(){
    it('should remove myFriendsKey from memcached', function(){
      const sessionID    = 'abc123';
      const myFriendsKey = "myFriends"+sessionID;
      removeCachedFriendUUIDs(sessionID);
      sinon.assert.calledWith(memcached.del, myFriendsKey);
    });
  });

  describe('removeCachedTokens', function(){
    it('should return myTokensKey from memcached', function(){
      const sessionID   = 'abc123';
      const myTokensKey = "myTokens"+sessionID;
      removeCachedTokens(sessionID);
      sinon.assert.calledWith(memcached.get, myTokensKey);
    });
  });

  describe('cacheFriendUUIDs', function(){
    it('should', function(){
      const sessionID       = 'abc123';
      const friendUUIDs     = ['123', '567', 'abc'];
      const friendUUIDsJSON = JSON.stringify(friendUUIDs);
      const myFriendsKey    = "myFriends"+sessionID;

      cacheFriendUUIDs(friendUUIDs, sessionID);
      sinon.assert.calledWith(memcached.set, myFriendsKey, friendUUIDsJSON);
    });
  });

  describe('getOnlineFriendsBySession', function(){
    //TODO: properly test this function fully
    it('should get myfriendsKey from memcached', function(){
      const sessionID    = 'abc123';
      const myFriendsKey = "myFriends"+sessionID;
      const callback     = () => {};
      getOnlineFriendsBySession(sessionID, clients, callback);
      sinon.assert.calledWith(memcached.get, myFriendsKey);
    });
  });

  describe('loggedOff', function(){
    it('should emit messages to my friends letting them know I have logged off', function(){
      const session          = 'abc123';
      loggedOff(session, clients, friendUUIDsArray);
      assert.equal(tellFriendOneSomethingStub.calledWithExactly('updateOnlineFriendToOffline', 'friendUUID123'), true);
      assert.equal(tellFriendSomethingOnlineStub.calledWithExactly('updateOnlineFriendToOffline', 'friendUUID456'), true);
    });
  });

  describe('getMyOnlineFriends', function(){
    it('should look through friendshipUUID array and return friends from Memcached', function(){
      const myFriendshipUUIDs = {'myFriendshipUUIDs':['friendUUID123','friendUUID456']};
      getMyOnlineFriends({}, myFriendshipUUIDs);
      sinon.assert.calledWith(memcached.get, 'friendUUID123');
      sinon.assert.calledWith(memcached.get, 'friendUUID456');
    });
  });

  describe('notifyFriendOfAcceptance', function(){
    it('should get friendsSession from memcached', function(){
      const token = 'abc123';
      notifyFriendOfAcceptance(token, clients);
      sinon.assert.calledWith(memcached.get, 'abc123');
    });
  });

  describe('cacheFriendRequestTokens', function(){
    it('should', function(){
      const tokensArray  = ['123', '567', 'abc'];
      const sessionID    = 'abc123';
      const myTokensJSON = JSON.stringify(tokensArray);
      const myTokensKey  = "myTokens"+sessionID;

      cacheFriendRequestTokens(tokensArray, sessionID);

      sinon.assert.calledWith(memcached.set, myTokensKey, myTokensJSON, 6000);
      sinon.assert.calledWith(memcached.set, '123', sessionID, 6000);
      sinon.assert.calledWith(memcached.set, '567', sessionID, 6000);
    });
  });



});