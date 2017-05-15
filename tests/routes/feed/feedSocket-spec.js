import {isFriendOnline, notifyOnlineFriendsOfNewStatus, emitNotification}  from '../../../routes/feed/feedSocket';
import sinon            from 'sinon';
import {assert, expect} from 'chai';
let clients         = {emit:function(){}};
global.memcached    = {};
clients.session123  = {emit:function(){}};
let clientEmitStub1 = {};
let callback        = function(err, data){};
clientEmitStub1     = sinon.stub(clients.session123, 'emit');
memcached.get       = sinon.spy();

describe('feedSocket', function(){

  beforeEach(function(){

  });

  afterEach(function(){

  });

  describe('emitNotification', function(){
      it('should tell my online friends that I have updated my feed', function(){
        const notificationData = {
                        myFriendshipUUID     : 'abc123',
                        notificationURL      : 'notificationURL',
                        notificationMessage  : 'notificationMessage'
        };
        emitNotification('abc123', 'notificationMessage', 'notificationURL', 'session123', clients);
        assert.equal(clientEmitStub1.calledWithExactly('notificationReceived', notificationData), true);
      });
  });

  describe('isFriendOnline', function(){
      it('should check memcached for friendUUID', function(){
        isFriendOnline('abc123', callback);
        sinon.assert.calledWith(memcached.get, 'abc123');
      });
  });

  describe('notifyOnlineFriendsOfNewStatus', function(){
      it('should check memcached for friendUUID', function(){
        notifyOnlineFriendsOfNewStatus('abc123', callback);
        sinon.assert.calledWith(memcached.get, 'abc123');
      });

  });

});