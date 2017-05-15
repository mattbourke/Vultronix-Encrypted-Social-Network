'use strict';
VultronixApp.service('signupService', ['$http',
 '$location',
 'profileService',
 'vaultService',
 'hashAndKeyGeneratorService',
 '$q',
 function ($http, $location, profileService, vaultService, hashAndKeyGeneratorService, $q) {

  let encryptMessage = (profileJSON, encryptionKey) => {
    const profileData = JSON.stringify(profileJSON);
    let promise       = vaultService.encrypToPGPKey(profileData, encryptionKey);
    return promise.then((encryptedPGPMessage) => {
      return encryptedPGPMessage;
    }).catch((error) => {
      console.log(error);
    });
  };

  let relocate = () => {
    $location.path('/myprofile/about/');
  };

  //TODO: let's do away with this, an empty profile should have no data.
  let _createProfile = (credentialsUUID, name, nickname) => {
    const myUUID               = credentialsUUID;
    let   enryptedProfileArray = [];

    const myProfile            = {
      name         : {
          title    : 'Name*',
          editType : 'editable-text',
          orderId  : 1,
          pData    : name
      },
      nickname     : {
          title    : 'Nickname*',
          editType : 'editable-text',
          orderId  : 1,
          pData    : nickname
      },
      relationship : {
          title    : 'Relationship',
          editType : 'editable-text',
          orderId  : 2,
          pData    : 'None'
      },
      dob          : {
          title    : 'Date of Birth',
          editType : 'editable-bsdate',
          orderId  : 3,
          pData    : ''
      },
      career       : {
          title    : 'Career',
          editType : 'editable-text',
          orderId  : 4,
          pData    : 'None'
      },
      gender       : {
          title    : 'Gender',
          editType : 'editable-text',
          orderId  : 5,
          pData    : 'None'
      },
      location     : {
          title    : 'Location',
          editType : 'editable-text',
          orderId  : 6,
          pData    : 'None'
      },
      orientation  : {
          title    : 'Orientation',
          editType : 'editable-text',
          orderId  : 7,
          pData    : 'None'
      },
      website      : {
          title    : 'Website',
          editType : 'editable-url',
          orderId  : 8,
          pData    : 'http://xvultx4llltx7w2d.onion'
      },
      openBazaarID : {
          title    : 'OpenBazaar ID',
          editType : 'editable-text',
          orderId  : 8,
          pData    : ''
      },
      bitcoinAddress : {
          title    : 'Bitcoin Address',
          editType : 'editable-text',
          orderId  : 9,
          pData    : 'empty'
      },
      twitter      : {
          title    : 'Twitter',
          editType : 'editable-text',
          orderId  : 10,
          pData    : 'None'
      },
      email        : {
          title    : 'Email',
          editType : 'editable-email',
          orderId  : 11,
          pData    : ''
      },
      phone        : {
          title    : 'Phone',
          editType : 'editable-text',
          orderId  : 12,
          pData    : 'None'
      },
      politics     : {
          title    : 'Politics',
          editType : 'editable-text',
          orderId  : 13,
          pData    : 'None'
      },
      molecule     : {
          title    : 'Molecule',
          editType : 'editable-text',
          orderId  : 14,
          pData    : 'None'
      }
    };

    encryptMessage(myProfile).then((encryptedMessage) => {
      const myProfileJSON = {
        UUID       : myUUID,
        myProfile  : vaultService.encrypt(encryptedMessage)
      };
      enryptedProfileArray.push(myProfileJSON);
      profileService.saveEncryptedProfile(enryptedProfileArray, relocate);
    });
  };


  this.getSignupCredentials = (passphrase, encryptionKey, loginHash) => {
    return $q((resolve) => {
      openpgp.generateKeyPair({numBits: 4096, userId: "anonymouse", passphrase: passphrase}).then((pgpKeys) => {
        const privateKeyString  = pgpKeys.privateKeyArmored;
        const publicKeyString   = pgpKeys.publicKeyArmored;
        const UUID              = hashAndKeyGeneratorService.getUUID();
        const signupCredentials = {
          privateKeyString : vaultService.encrypt(privateKeyString, encryptionKey),
          publicKeyString  : vaultService.encrypt(publicKeyString,  encryptionKey),
          UUID             : vaultService.encrypt(UUID,             encryptionKey),
          loginHash        : loginHash
        };

        const myCredentials     = {
          privateKeyString : privateKeyString,
          publicKeyString  : publicKeyString,
          UUID             : UUID
        };

        const credentials = {
          "signupCredentials" : signupCredentials,
          "myCredentials"     : myCredentials
        };

        return resolve(credentials);
      }).catch((error) => {
          console.log(error);
      });
    });
  };

  this.signup = (myUUID, credentials, name, nickname) => {
    return $q((resolve) => {
      $http.post('/signup/signup', JSON.stringify(credentials)).success((response) => {
        if(response.loginStatus === "success"){
            _createProfile(myUUID, name, nickname);
            resolve(response);
        }else{
            vaultService.deleteCredentials();
            resolve(response);
        }
      }).catch((error) => {
        vaultService.deleteCredentials();
        console.log(error);
      });
    });
  };

}]);