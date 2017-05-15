describe('hashAndKeyGeneratorService', function () {

    var $routeScope;
    var $scope;
    var $service;
    var hashAndKeyGeneratorService;

    beforeEach(function(){
      module('VultronixApp','ngRoute');
      inject(function($injector, _hashAndKeyGeneratorService_){
        hashAndKeyGeneratorService = _hashAndKeyGeneratorService_;
      });


    });


    describe('hashPair function', function () {
        it('should return 3 seperate hashes of the passed in string', function () {
            expect(hashAndKeyGeneratorService.getHashStruct('test').hashOne).toBe('0c007aa1b1d238defaff8eb4de97ba6adf662bed46be370074350048460ead2278bb77cbd72e9e73f8498a857225de84d7d4a8d12b05b487a9e37f808f00ab49');
            expect(hashAndKeyGeneratorService.getHashStruct('test').hashTwo).toBe('e037fcf61211c4170ce191f4a75d8a8f2fe8e671982e4b7d4afad3a0bf69f6661ab4fb21dc06745c30f9fc9b1327282b357526c90e900f62566a2ef8c06b1d2d');
            expect(hashAndKeyGeneratorService.getHashStruct('test').hashThree).toBe('4a1fe1eec8ba743bcb0abe9198853e7a910a0ad5066ff93af3ccca25aad37e01a39e4e3dee0d839b11293cdb62fac7f594542bdb067deb147e19af1b45217b10');
        });
    });

    describe('getHash512 function', function () {
        it('should return a SHA-512 hash of a given string', function () {
            expect(hashAndKeyGeneratorService.getHash512('test')).toBe('0ffd3c27280c11efd04a7d8cd3ac7bdca7830acc1420905b872b7cdad12e8c8949d982faad10c695a632673073b6dae1d10985c797a67ed36cdaab6063d4d89a');
        });
    });

    describe('getHash256 function', function () {
        it('should return a SHA-256 hash of a given string', function () {
            expect(hashAndKeyGeneratorService.getHash256('test')).toBe('1eecd4e0f4a55bf0bc44a0cf81d60514fcfcb685b998a2ce077563cc31f6245b');
        });
    });

    describe('getUUID function', function () {
        it('should return a UUID with a length of 36', function () {
            expect(hashAndKeyGeneratorService.getUUID().length).toBe(36);
        });
    });
});