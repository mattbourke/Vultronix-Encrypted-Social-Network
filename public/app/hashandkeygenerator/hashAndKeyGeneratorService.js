'use strict';
VultronixApp.service('hashAndKeyGeneratorService', function () {

  this.getHashStruct = (credentialsToHash) => {
    let hash      = CryptoJS.SHA512(credentialsToHash);
    let loginHash = "";
    let hashOne   = "";
    let hashTwo   = "";
    // some basic key stretching
    for(let i = 0; i<5001; i++){
      // just a randomly chosen positions
      if (i === 2000){
        // here we set loginhash on a different path,
        // we simply do this so people can't hash forward the encryption hash to get the login hash
        loginHash = CryptoJS.SHA512(hash + hash);
      }else if (i === 3000){
        hashOne = CryptoJS.SHA512(hash);
      }else if (i === 4000){
        hashTwo = hash;
      }
      hash = CryptoJS.SHA512(hash);
    }
    loginHash = CryptoJS.SHA512(loginHash + hash);
    const hashStruct = {
      hashOne    : hashOne.toString(),
      hashTwo    : hashTwo.toString(),
      hashThree  : loginHash.toString()
    };
    return hashStruct;
  };

  this.getHash512 = (stringToHash) => {
    let hash = CryptoJS.SHA512(stringToHash);
    for(let i = 0; i<5001; i++){
      hash = CryptoJS.SHA512(hash);
    }
    return hash.toString();
  };

  this.getHash256 = (stringToHash) => {
    // first up lets sha-512 hash it, then hash that with SHA-256 as we want our end result to be that.
    // sha512 is too long for a user to pass around as a token.
    let hash = CryptoJS.SHA512(stringToHash);
    for(let i = 0; i<5001; i++){
      hash = CryptoJS.SHA256(hash);
    }
    return hash.toString();
  };

  this.getUUID = () => {
    let UUID;
    /* jshint ignore:start */
    UUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
    /* jshint ignore:end */
    return UUID;
  };

});