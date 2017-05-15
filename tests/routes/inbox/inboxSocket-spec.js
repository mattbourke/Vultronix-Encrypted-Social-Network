import {
  isFriendOnline,
  emitMessage,
  emitUserIsTyping}     from '../../../routes/inbox/inboxSocket';
import sinon            from 'sinon';
import {assert, expect} from 'chai';
let clients           = {emit:function(){}};
clients.session123    = {emit:function(){}};
let clientEmitStub1   = {};
clientEmitStub1       = sinon.stub(clients.session123, 'emit');
global.memcached      = {};
memcached.get         = sinon.spy();
memcached.set         = sinon.spy();
memcached.del         = sinon.spy();
const callback        = function(err, data){};

describe('inboxSocket', function(){

  beforeEach(function(){

  });

  afterEach(function(){

  });

  describe('isFriendOnline', function(){
      it('should check memcached for friendUUID', function(){
        isFriendOnline('abc123', callback);
        sinon.assert.calledWith(memcached.get, 'abc123');
      });
  });

  describe('emitMessage', function(){
    it('should tell friends they have a new message', function(){
      const messageData = {
                      myFriendshipUUID : 'abc123',
                      message          : 'new message'
      };

      emitMessage('abc123', 'new message', 'session123', clients);
      assert.equal(clientEmitStub1.calledWithExactly('messageReceived', messageData), true);
    });
  });

  describe('emitUserIsTyping', function(){
    it('should tell friends I am typing them a new message', function(){
      emitUserIsTyping('abc123', 'session123', clients);
      assert.equal(clientEmitStub1.calledWithExactly('userTyping', 'abc123'), true);
    });
  });

});