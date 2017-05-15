describe('vaultService', function () {

    var $routeScope;
    var $scope;
    var $service;
    var vaultService;
    var myCredentials   = {};
/* jshint ignore:start */
    var publicKeyString = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v1.3.0
Comment: http://openpgpjs.org

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
dQd3aYq7gCEPsYsNKssuD+XrZQ==
=XiCX
-----END PGP PUBLIC KEY BLOCK-----

`;
    var privateKeyString = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v1.3.0
Comment: http://openpgpjs.org

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
=Cdcd
-----END PGP PRIVATE KEY BLOCK-----
`;

/* jshint ignore:end */

      myCredentials = {
          privateKeyString : privateKeyString,
          publicKeyString  : publicKeyString,
          UUID             : '642c5ad2-76cd-4243-903d-0722b490e3d9'
      };



    beforeEach(function(){

      module('VultronixApp','ngRoute');
      inject(function($injector, _vaultService_){
        vaultService = _vaultService_;
      });
    });

    afterEach(function(){
        sessionStorage.clear();
    });


    describe('setCredentials function', function () {
        it('should set user Credentials sessionStorage', function () {
            vaultService.setCredentials(myCredentials);
            expect(vaultService.getMyData('userUUID')).toBe('642c5ad2-76cd-4243-903d-0722b490e3d9');
        });
    });

    describe('getMyData function', function () {
        it('should return a null value when value does not exist', function () {
            expect(vaultService.getMyData('test')).toBe(null);
        });
        it('should return a UserUUID value', function () {
            vaultService.setCredentials(myCredentials);
            expect(vaultService.getMyData('userUUID')).toBe('642c5ad2-76cd-4243-903d-0722b490e3d9');
        });
    });

    describe('deleteCredentials function', function () {
        it('should completely clear the sessionStorage', function () {
            vaultService.setCredentials(myCredentials);
            vaultService.deleteCredentials();
            expect(vaultService.getMyData('test')).toBe(null);
        });
    });

    describe('setEncryptionKeys function', function () {
        it('should set Encryption Keys', function () {
            var credentials = {hashOne : 'abc123',
                               hashTwo : 'abc123'
                            };

            vaultService.setEncryptionKeys(credentials);
            expect(vaultService.getMyData('passPhrase')).toBe('abc123');
        });
    });

    describe('getRecognisableUniqueHash function', function () {
        it('should return a SHA-512 hash', function () {
            vaultService.setCredentials(myCredentials);
            expect(vaultService.getRecognisableUniqueHash().length).toBe(128);
        });
    });

    describe('encrypt function', function () {
        it('should encrypt a string using AES', function () {
            var credentials    = {hashOne : 'abc123',
                                  hashTwo : 'abc123'
                               };
            vaultService.setEncryptionKeys(credentials);
            var encryptedValue = vaultService.encrypt('hello');
            var decryptedValue = vaultService.decrypt(encryptedValue);

            expect(decryptedValue).toBe('hello');
        });
    });

    describe('decrypt function', function () {
        it('should decrypt a string using AES', function () {
            var credentials = {hashOne : 'abc123',
                               hashTwo : 'abc123'
                            };
            vaultService.setEncryptionKeys(credentials);
            expect(vaultService.decrypt('U2FsdGVkX1/5v7IynaSWkAvFQMMSpPTNqhXZCAyZz5E=')).toBe('hello');
        });
    });

    describe('encrypToPGPKey then decryptPGPMessage functions', function () {
        it('should encrypt a string using PGP then decrypt it', function (done) {
            var credentials = {hashOne : '293bd0d0c3ee73c6a1c08df91c68ffa3d71a9f6c0f81ffd0e92101d35b3df95736ba0a68525da159d364b64ac5c20e5cded4e18520479bf3dbcfc2ac49708526',
                               hashTwo : '293bd0d0c3ee73c6a1c08df91c68ffa3d71a9f6c0f81ffd0e92101d35b3df95736ba0a68525da159d364b64ac5c20e5cded4e18520479bf3dbcfc2ac49708526'
                            };
            vaultService.setEncryptionKeys(credentials);
            vaultService.setCredentials(myCredentials);
            var encrypToPGPKey = vaultService.encrypToPGPKey('hello');
            var self           = this;
            encrypToPGPKey.then(function(pgpMessage) {
                vaultService.setEncryptionKeys(credentials);
                vaultService.setCredentials(myCredentials);
                var decryptPGPMessage = vaultService.decryptPGPMessage(pgpMessage);
                decryptPGPMessage.then(function(decryptedPGPMessage) {
                    expect(decryptedPGPMessage).toBe('hello');
                    done();
                });

            });
        });
    });

});