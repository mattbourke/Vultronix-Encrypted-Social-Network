import {
  isFriendOnline,
  notifyOnlineFriendsOfProfileUpdate,
  notifyOnlineFriendsOfProfileImageUpdate,
  notifyOnlineFriendsOfCoverImageUpdate,
  notifyOnlineFriendsOfBiographyUpdate,
  emitNotification} from '../../../routes/myprofile/myprofileSocket';
import sinon        from 'sinon';
import {assert}     from 'chai';
let clients           = {emit:function(){}};
clients.session123    = {emit:function(){}};
let clientEmitStub1   = {};
clientEmitStub1       = sinon.stub(clients.session123, 'emit');
global.memcached      = {};
memcached.get         = sinon.spy();
memcached.set         = sinon.spy();
memcached.del         = sinon.spy();
const callback        = function(err, data){};

describe('myprofileSocket', function(){

  beforeEach(function(){

  });

  afterEach(function(){

  });
  //TODO: implement deeper tests that test beyond simply the memcached call

  describe('isFriendOnline', function(){
      it('should check memcached for friendUUID', function(){
        isFriendOnline('abc123', callback);
        sinon.assert.calledWith(memcached.get, 'abc123');
      });
  });

  describe('notifyOnlineFriendsOfProfileUpdate', function(){
    it('should check memcached for friendUUID', function(){
      notifyOnlineFriendsOfProfileUpdate('abc123', 'new message', 'session123', clients);
      sinon.assert.calledWith(memcached.get, 'abc123');
    });
  });

  describe('notifyOnlineFriendsOfProfileImageUpdate', function(){
    it('should check memcached for friendUUID', function(){
      notifyOnlineFriendsOfProfileImageUpdate('abc123', 'session123', clients);
      sinon.assert.calledWith(memcached.get, 'abc123');
    });
  });

  describe('notifyOnlineFriendsOfCoverImageUpdate', function(){
    it('should check memcached for friendUUID', function(){
      notifyOnlineFriendsOfCoverImageUpdate('abc123', 'session123', clients);
      sinon.assert.calledWith(memcached.get, 'abc123');
    });
  });

  describe('notifyOnlineFriendsOfBiographyUpdate', function(){
    it('should check memcached for friendUUID', function(){
      notifyOnlineFriendsOfBiographyUpdate('abc123', 'session123', clients);
      sinon.assert.calledWith(memcached.get, 'abc123');
    });
  });

  describe('emitNotification', function(){
    it('should tell friends they have a notificationReceived', function(){
      const notificationData = {
                   friendUUID          : 'abc123',
                   notificationURL     : 'notificationURL',
                   notificationMessage : 'notificationMessage'
      };

      emitNotification('abc123', 'notificationMessage', 'notificationURL', 'session123', clients);
      assert.equal(clientEmitStub1.calledWithExactly('notificationReceived', notificationData), true);
    });
  });

});