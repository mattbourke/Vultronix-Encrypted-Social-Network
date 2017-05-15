'use strict';
VultronixApp.service('vaultService',['loginService', 'hashAndKeyGeneratorService', function (loginService, hashAndKeyGeneratorService) {

  // note for now all of this is unencrypted in sessionStorage
  let UserCredentials = {
    passPhrase    : "",
    encryptionKey : "",
    PGPPrivate    : "",
    PGPPublic     : "",
    userUUID      : ""
  };

  // this is basically used to keep myUUID private but still able to see if I'm trying to add my self as a friend
  // this is obviously only recognisable to me (my account)
  this.getRecognisableUniqueHash = () => {
    const recognisableUniqueString = sessionStorage.getItem("tempUUID");
    return hashAndKeyGeneratorService.getHash512(recognisableUniqueString);
  };

  let _initEncryptionKeys = (credentials) => {
    UserCredentials.passPhrase    = credentials.hashOne;
    UserCredentials.encryptionKey = credentials.hashTwo;
  };

  let _initCredentials = (credentials) => {
    UserCredentials.PGPPrivate    = credentials.PGPPrivate;
    UserCredentials.PGPPublic     = credentials.PGPPublic ;
    UserCredentials.userUUID      = credentials.userUUID  ;
  };

  this.encrypt = (value, password) => {
    let key = "";
    if( password ){
        key = password;
    }else{
        key = sessionStorage.getItem('encryptionKey');
    }

    const encryptedValue = CryptoJS.AES.encrypt(value, key);
    return encryptedValue.toString();
  };

  this.decrypt = (value, password) => {
    let key;
    if( password ){
        key = password;
    }else{
        key = sessionStorage.getItem('encryptionKey');
    }
    const decryptedValue = CryptoJS.AES.decrypt(value, key);
    return decryptedValue.toString(CryptoJS.enc.Utf8);
  };

  this.encrypToPGPKey = (message, pubKey) => {
    let pubPGPKey = '';
    // pubKey should only ever be missing if you're encrypting to yourself.
    if( pubKey ){
        pubPGPKey = pubKey;
    }else{
        pubPGPKey = sessionStorage.getItem('PGPPublic');
    }
    const formattedPubkey = pubPGPKey.replace(/linebreak/g, '\n');
    const publicKey       = openpgp.key.readArmored(formattedPubkey);
    const messagePromise  = openpgp.encryptMessage(publicKey.keys, message);
    return messagePromise;
  };

  this.decryptPGPMessage = (Message) => {
    // matt: replacing of  '\n' with 'linebreak' was a hack for a single line string for some encryption issue
    // be simpler to simply move to ES6 multi line strings
    const encryptedMessage = Message.replace(/linebreak/g, '\n');
    let PGPPrivatekey      = sessionStorage.getItem("PGPPrivate");
    PGPPrivatekey          = PGPPrivatekey.replace(/linebreak/g, '\n');
    const decryptionKey    = sessionStorage.getItem("passPhrase");
    let privateKey         = openpgp.key.readArmored(PGPPrivatekey).keys[0];
    privateKey.decrypt(decryptionKey);
    const pgpMessage       = openpgp.message.readArmored(encryptedMessage);
    const messagePromise   = openpgp.decryptMessage(privateKey, pgpMessage);
    return messagePromise;
  };

  this.getMyData = (value) => {
    const valueFromStorage = sessionStorage.getItem(value);
    return valueFromStorage;
  };

  this.setEncryptionKeys = (credentials) => {
    _initEncryptionKeys(credentials);
    sessionStorage.setItem("passPhrase"   , credentials.hashOne);
    sessionStorage.setItem("encryptionKey", credentials.hashTwo);
  };

  this.setCredentials = (credentials) => {
    _initCredentials(credentials);
    sessionStorage.setItem("PGPPrivate"   , credentials.privateKeyString);
    sessionStorage.setItem("PGPPublic"    , credentials.publicKeyString);
    sessionStorage.setItem("userUUID"     , credentials.UUID);
    const tempUUID = hashAndKeyGeneratorService.getUUID();
    sessionStorage.setItem("tempUUID"     , tempUUID);
  };

  this.deleteCredentials = () => {
    UserCredentials = {
      passPhrase    : "",
      encryptionKey : "",
      PGPPrivate    : "",
      PGPPublic     : "",
      userUUID      : ""
    };
    sessionStorage.clear();
  };

}]);