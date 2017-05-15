'use strict';
VultronixApp.service('profileService', ['myDataService',
  'loginService',
  'vaultService',
  '$http',
  'friendsService',
  'hashAndKeyGeneratorService',
  '$timeout',
  'feedService',
  '$q',
  '$window',
  function (myDataService, loginService, vaultService, $http, friendsService, hashAndKeyGeneratorService, $timeout, feedService, $q, $window) {

  let _updateMyDataService = (myData) => {
    for (let key in myData) {
      if ( myData.hasOwnProperty(key) && myData[key].pData !== 'undefined') {
          myDataService.setMyData(key, myData[key].pData);
      }
    }
  };

  // the below is a quick hack to add new data types to friends profile "about info" page.
  // the types were initially created on signup, in signupService, but now we want to add newer ones.
  // this will do for now...
  let _addNewDataToMyProfile = (myProfile) => {
    if( ! myProfile.bitcoinAddress ) {
      let bitcoinAddress = {
        title    : 'Bitcoin Address',
        editType : 'editable-text',
        orderId  : 9,
        pData    : 'empty'
      };

      myProfile.bitcoinAddress = bitcoinAddress;
    }
    return myProfile;
  };

  this.getProfile = (profileUUID) => {
    const myUUID     = vaultService.getMyData('userUUID');
    let   UUID       = null;
    let   decryptionKey;
    let   decryptionPGPKey;

    return $q((resolve, reject) => {
      if(profileUUID === myUUID || !profileUUID) {
        UUID = myUUID;
        // let's grab it locally eg from cache
        let myProfile = myDataService.getMyData('myProfile');
        if( myProfile !== null ) {
          let profile = JSON.parse(myProfile);
          return resolve(profile);
        }
      }else{
        UUID             = friendsService.getFriendshipByFriendsUUID(profileUUID).myFriendshipUUID;
        decryptionKey    = friendsService.getFriendshipByFriendsUUID(profileUUID).friendshipUUID;
        decryptionPGPKey = friendsService.getFriendshipByFriendsUUID(profileUUID).publicPGP;
      }

      $http({
          url: "/myProfile/myProfile",
          method: "get",
          params:{"UUID":UUID}
      }).success((data) => {
        loginService.loginValidate(data);
        // HACK: clean up so all return a request count or a diff message when empty
        if( data.requestCount === undefined ) {
            const decryptedMessage  = vaultService.decrypt(data[0].profileJSON, decryptionKey);
            vaultService.decryptPGPMessage(decryptedMessage, decryptionPGPKey).then((decryptedPGPMessage) => {
              let profile           = JSON.parse(decryptedPGPMessage);
              profile               = _addNewDataToMyProfile(profile);
              if( UUID === myUUID ) {
                myDataService.setMyData('myProfile', JSON.stringify(profile));
                _updateMyDataService( profile );
              }else{
                // let's check if the user has changed their name. if they have we'll update our friends list.
                let friendshipData = friendsService.getFriendshipByFriendsUUID(profileUUID);
                if(profile.name.pData !== friendshipData.name) {
                  friendsService.updateFriendNameByFriendsUUID(profileUUID, profile.name.pData);
                }
              }
              return resolve(profile);
            }).catch((error) => {
              console.log(error);
              return reject('error');
            });
        }else{
          return resolve(false);
        }

      }).error((data) => {
          console.log(data);
      });
    });

  };

  this.getHeaderImage = (profileUUID) => {
    const myUUID = vaultService.getMyData('userUUID');
    let   UUID   = null;
    let   image  = {};
    return $q((resolve, reject) => {
        if(profileUUID && profileUUID !== myUUID) {
          let friendsHeaderImageData = JSON.parse(myDataService.getMyData('friendsHeaderImageData'));
          if( friendsHeaderImageData !== null && friendsHeaderImageData.friendsUUID === profileUUID ) {
            image.imageData = friendsHeaderImageData.headerImage;
            return resolve(image);
          }
          UUID = friendsService.getFriendshipByFriendsUUID(profileUUID).myFriendshipUUID;
        }else{
          UUID = myUUID;
          // let's grab it locally eg from cache
          let myHeaderImage = myDataService.getMyData('headerImage');
          if( myHeaderImage !== null ) {
            image.imageData = myHeaderImage;
            return resolve(image);
          }
        }

        $http({
          url: "/myProfile/getHeaderImage",
          method: "get",
          params:{"UUID":UUID}
        }).success((data) => {
          loginService.loginValidate(data);
          resolve(data);
        }).error((data) => {
          reject(data);
        });
    });
  };

  this.decryptAndSetHeaderImage = (data, profileUUID) => {
    let decryptionKey;
    let decryptionPGPKey;
    const myUUID = vaultService.getMyData('userUUID');
    const UUID   = ( profileUUID && profileUUID !== myUUID )?profileUUID:myUUID;
    if(profileUUID && profileUUID !== myUUID) {
      decryptionKey    = friendsService.getFriendshipByFriendsUUID(profileUUID).friendshipUUID;
      decryptionPGPKey = friendsService.getFriendshipByFriendsUUID(profileUUID).publicPGP;
    }

    return $q((resolve, reject) => {
      // hacky, clean up so all return a request count or a diff message when empty
      if( data.requestCount === undefined ) {
        let decryptedMessage = vaultService.decrypt(data[0].headerImageData, decryptionKey);

        vaultService.decryptPGPMessage(decryptedMessage, decryptionPGPKey).then((decryptedPGPMessage) => {
          let headerImage    = JSON.parse(decryptedPGPMessage);
          if( UUID === myUUID ) {
            myDataService.setMyData('headerImage', headerImage);
          }else{
            // lets cache the friends header image so it doesn't need to be downloaded and decrypted everytime a user
            // clicks on a profile tab
            let friendsHeaderImageData = {
              friendsUUID : profileUUID,
              headerImage : headerImage
            };
            myDataService.setMyData('friendsHeaderImageData', JSON.stringify(friendsHeaderImageData));
          }
          resolve(headerImage);
        }).catch((error) => {
          reject(error);
        });
      }else{
          resolve("images/cover.png");
      }
    });
  };

  this.decryptAndSetProfileImage = (data, profileUUID) => {
    let   decryptionKey;
    let   decryptionPGPKey;
    const myUUID = vaultService.getMyData('userUUID');
    let   UUID   = ( profileUUID && profileUUID !== myUUID )?profileUUID:myUUID;
    if(profileUUID && profileUUID !== myUUID) {
      decryptionKey    = friendsService.getFriendshipByFriendsUUID(profileUUID).friendshipUUID;
      decryptionPGPKey = friendsService.getFriendshipByFriendsUUID(profileUUID).publicPGP;
    }
    let decryptedMessage = vaultService.decrypt(data[0].profileImageData, decryptionKey);

    return $q((resolve, reject) => {
      vaultService.decryptPGPMessage(decryptedMessage, decryptionPGPKey).then((decryptedPGPMessage) => {
        let profileImage = JSON.parse(decryptedPGPMessage);
        if( UUID === myUUID ) {
          myDataService.setMyData('profileImage', profileImage);
        }else{
          // lets cache the friends profile image so it doesn't need to be downloaded and decrypted everytime a user
          // clicks on a profile tab
          let friendsProfileImageData = {
            friendsUUID  : profileUUID,
            profileImage : profileImage
          };
          myDataService.setMyData('friendsProfileImageData', JSON.stringify(friendsProfileImageData));
        }
        resolve(profileImage);
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  };


  this.getProfileImage = (profileUUID) => {
    const myUUID = vaultService.getMyData('userUUID');
    let   UUID   = null;
    let   image  = {};
    return $q((resolve, reject) => {
      if(profileUUID && profileUUID !== myUUID) {
        let friendsProfileImageData = JSON.parse(myDataService.getMyData('friendsProfileImageData'));
        if( friendsProfileImageData !== null && friendsProfileImageData.friendsUUID === profileUUID ) {
          image.imageData = friendsProfileImageData.profileImage;
          return resolve(image);
        }
        UUID = friendsService.getFriendshipByFriendsUUID(profileUUID).myFriendshipUUID;
      }else{
        UUID = myUUID;
        // let's grab it locally eg from cache
        let profileImage = myDataService.getMyData('profileImage');
        if( profileImage !== null ) {
          image.imageData = profileImage;
          return resolve(image);
        }
      }

      $http({
      url: "/myProfile/getProfileImage",
      method: "get",
      params:{"UUID":UUID}
      }).success((data) => {
        loginService.loginValidate(data);
        return resolve(data);

      }).error((data) => {
        return reject(data);
      });
    });
  };


  // TODO: remove this function and it's calls to it, just simply call vaultService.encrypt... in it's place
  let encryptMessage = (profileJSON, encryptionKey) => {
    const profileData = JSON.stringify(profileJSON);
    let   promise     = vaultService.encrypToPGPKey(profileData, encryptionKey);
    return promise.then((encryptedPGPMessage) => {
      return encryptedPGPMessage;
    }).catch((error) => {
      console.log(error);
    });
  };


  let _saveEncryptedProfile = (enryptedProfileArray, callback) => {

    $http.post('/myprofile/upsertMyProfile', JSON.stringify(enryptedProfileArray)).success((response) => {
      loginService.loginValidate(response);
      if(response === "success") {
        if( callback ) {
          callback();
        }
      }else{
        if( callback ) {
          callback();
        }
        console.log('myProfile saved failed');
      }
    }).catch((error) => {
      console.log('myProfile saved failure');
      console.log(error);
    });

  };


  this.saveMyProfile = (myProfile, callback) => {
    myDataService.setMyData('myProfile', JSON.stringify(myProfile));
    _updateMyDataService( myProfile );
    let myUUID                = vaultService.getMyData('userUUID');
    let enryptedProfileArray  = [];
    let friends               = JSON.parse(myDataService.getMyData('friendsList'));
    if( friends === null ) {
      friends = [];
    }
    // quick hack to get me into the friends array so I'm emcrypted to as well
    let myProfileJSON = {
      friendUUID      : myUUID,
      publicPGP       : '',
      friendshipUUID  : ''
    };
    friends.push(myProfileJSON);

    let loopLength       = friends.length - 1;
    angular.forEach(friends, (item, key) => {
      /*jshint loopfunc: true */
      ((cnt) => {
          encryptMessage(myProfile, friends[cnt].publicPGP).then((encryptedMessage) => {

            myProfileJSON = {
              UUID        : friends[cnt].friendUUID,
              myProfile   : vaultService.encrypt(encryptedMessage, friends[cnt].friendshipUUID)
            };

            enryptedProfileArray.push(myProfileJSON);

            if( cnt >= loopLength ) {
              _saveEncryptedProfile(enryptedProfileArray, callback);
              feedService.addNewStatus('friendProfileUpdated', 'Has an updated profile ');
            }
          });
      })(key);
    });
  };

  let _saveEncryptedProfileImage = (enryptedProfileArray, callback) => {
    $http.post('/myprofile/upsertProfileImage', JSON.stringify(enryptedProfileArray)).success((response) => {
      loginService.loginValidate(response);
      if(response === "success") {
          if( callback ) {
            callback();
          }
      }else{
          if( callback ) {
            callback();
          }
        console.log('myProfile saved failed');
      }
    }).catch((error) => {
      console.log('myProfile saved failure');
      console.log(error);
    });
  };

  let _saveEncryptedHeaderImage = (enryptedProfileArray, callback) => {
    $http.post('/myprofile/upsertHeaderImage', JSON.stringify(enryptedProfileArray)).success((response) => {
        loginService.loginValidate(response);
        if(response === "success") {
          if( callback ) {
            callback();
          }
        }else{
          if( callback ) {
            callback();
          }
          console.log('myProfile saved failed');
        }
    }).catch((error) => {
       console.log('myProfile saved failure');
      console.log(error);
    });

  };


  this.saveProfileImage = ($scope, callback) => {
    const profileImage              = document.getElementById('profileImage').src;
    myDataService.setMyData('profileImage', profileImage);
    const myUUID                    = vaultService.getMyData('userUUID');
    let   enryptedProfileImageArray = [];
    let   friends                   = JSON.parse(myDataService.getMyData('friendsList'));
    let   myProfileImageJSON        = null;
    if( friends === null ) {
      friends = [];
    }
    // quick hack to get me into the friends array so I'm emcrypted to as well
    let myProfileJSON = {
      friendUUID      : myUUID,
      publicPGP       : '',
      friendshipUUID  : ''
    };
    friends.push(myProfileJSON);
    let loopLength       = friends.length - 1;
    angular.forEach(friends, (item, key) => {
        /*jshint loopfunc: true */
      ((cnt) => {
          encryptMessage(profileImage, friends[cnt].publicPGP).then((encryptedMessage) => {

            myProfileImageJSON = {
              UUID            : friends[cnt].friendUUID,
              profileImageData: vaultService.encrypt(encryptedMessage, friends[cnt].friendshipUUID)
            };

            enryptedProfileImageArray.push(myProfileImageJSON);

            if( cnt >= loopLength ) {
              _saveEncryptedProfileImage(enryptedProfileImageArray, callback);
              feedService.addNewStatus('friendProfileImageUpdated', 'Has a new profile image ');
            }
          });
      })(key);

    });
  };

 this.saveHeaderImage = ($scope, callback) => {
    let headerImage               = document.getElementById('coverImage').src;
    myDataService.setMyData('headerImage', headerImage);
    let myUUID                    = vaultService.getMyData('userUUID');
    let enryptedHeaderImageArray  = [];
    let friends                   = JSON.parse(myDataService.getMyData('friendsList'));
    let myHeaderImageJSON         = null;
    if( friends === null ) {
      friends = [];
    }
    // quick hack to get me into the friends array so I'm emcrypted to as well
    let myProfileJSON = {
      friendUUID      : myUUID,
      publicPGP       : '',
      friendshipUUID  : ''
    };
    friends.push(myProfileJSON);

    let loopLength       = friends.length - 1;
    angular.forEach(friends, (item, key) => {
        /*jshint loopfunc: true */
      ((cnt) => {
          encryptMessage(headerImage, friends[cnt].publicPGP).then((encryptedMessage) => {

            myHeaderImageJSON = {
              UUID            : friends[cnt].friendUUID,
              headerImageData : vaultService.encrypt(encryptedMessage, friends[cnt].friendshipUUID)
            };

            enryptedHeaderImageArray.push(myHeaderImageJSON);

            if( cnt >= loopLength ) {
              _saveEncryptedHeaderImage(enryptedHeaderImageArray, callback);
              feedService.addNewStatus('friendHeaderImageUpdated', 'Has a new profile cover image ');
            }
          });
      })(key);

    });
  };


  this.saveEncryptedProfile = (enryptedProfileArray, callback) => {
    _saveEncryptedProfile(enryptedProfileArray, callback);
  };


  this.saveProfileDataAndImagesToNewFriend = (friendUUID, friendPublicPGP, friendshipUUID) => {
    _saveProfileToNewFriend(friendUUID,      friendPublicPGP, friendshipUUID);
    _saveProfileImageToNewFriend(friendUUID, friendPublicPGP, friendshipUUID);
    _saveHeaderImageToNewFriend(friendUUID,  friendPublicPGP, friendshipUUID);
  };

  let _saveProfileToNewFriend = (friendUUID, friendPublicPGP, friendshipUUID) => {
    let myProfile            = JSON.parse(myDataService.getMyData('myProfile'));
    let enryptedProfileArray = [];
    let myProfileJSON        = {};

    encryptMessage(myProfile, friendPublicPGP).then((encryptedMessage) => {

      myProfileJSON = {
          UUID        : friendUUID,
          myProfile   : vaultService.encrypt(encryptedMessage, friendshipUUID)
      };

      enryptedProfileArray.push(myProfileJSON);
      _saveEncryptedProfile(enryptedProfileArray);
    });
  };

  let _saveProfileImageToNewFriend = (friendUUID, friendPublicPGP, friendshipUUID) => {
    const profileImage              = myDataService.getMyData('profileImage');
    let   enryptedProfileImageArray = [];
    let   myProfileImageJSON        = null;

    encryptMessage(profileImage, friendPublicPGP).then((encryptedMessage) => {

      myProfileImageJSON = {
        UUID            : friendUUID,
        profileImageData: vaultService.encrypt(encryptedMessage, friendshipUUID)
      };

      enryptedProfileImageArray.push(myProfileImageJSON);
      _saveEncryptedProfileImage(enryptedProfileImageArray);
    });
  };


 let _saveHeaderImageToNewFriend = (friendUUID, friendPublicPGP, friendshipUUID) => {
    const headerImage               = myDataService.getMyData('headerImage');
    let   enryptedHeaderImageArray  = [];
    let   myHeaderImageJSON         = null;

    encryptMessage(headerImage, friendPublicPGP).then((encryptedMessage) => {

      myHeaderImageJSON = {
          UUID            : friendUUID,
          headerImageData : vaultService.encrypt(encryptedMessage, friendshipUUID)
      };

      enryptedHeaderImageArray.push(myHeaderImageJSON);
      _saveEncryptedHeaderImage(enryptedHeaderImageArray);
    });
  };


  this.decryptBiography = (data, UUID) => {
    const myUUID = vaultService.getMyData('userUUID');
    let   decryptionKey;
    if(UUID !== myUUID) {
      decryptionKey = friendsService.getFriendshipByFriendsUUID(UUID).friendshipUUID;
    }
    const decryptedMessage = vaultService.decrypt(data[0].biography, decryptionKey);
    return $q((resolve, reject) => {
      vaultService.decryptPGPMessage(decryptedMessage).then((decryptedPGPMessage) => {
        let biography = decryptedPGPMessage;
        if( UUID === myUUID && biography.length) {
            myDataService.setMyData('biography', biography);
        }
        resolve(biography);
      }).catch((error) => {
        reject(error);
      });
    });
  };


  this.getBiography = (UUID) => {
    let myUUID = vaultService.getMyData('userUUID');
    let myFriendshipUUID;

    return $q((resolve, reject) => {
      if(UUID !== myUUID) {
        myFriendshipUUID = friendsService.getFriendshipByFriendsUUID(UUID).myFriendshipUUID;
      }else{
        // let's grab it locally eg from cache
        myFriendshipUUID = UUID;
        let biography = myDataService.getMyData('biography');
        if( biography !== null && biography !== 'undefined' ) {
          let biographyData = {
            "biography":biography
          };
          return resolve(biographyData);
        }
      }

      $http({
        url: "/myProfile/getBiography",
        method: "get",
        params:{"UUID":myFriendshipUUID}
      }).success((data) => {
        loginService.loginValidate(data);
        resolve(data);
      }).error((data) => {
        reject(data);
      });
    });
  };

  let _saveEncryptedBiography = (enryptedBiographyArray, callback) => {
    $http.post('/myprofile/upsertMyBiography', JSON.stringify(enryptedBiographyArray)).success((response) => {
      loginService.loginValidate(response);
      if(response === "success") {
        if( callback ) {
          callback();
        }
      }else{
        if( callback ) {
          callback();
        }
        console.log('Biographyy saved failed');
      }
    }).catch((error) => {
      console.log('Biographyy saved failure');
      console.log(error);
    });
  };


  this.saveMyBiography = (biography, callback) => {
    myDataService.setMyData('biography', biography);
    const myUUID                 = vaultService.getMyData('userUUID');
    let   enryptedBiographyArray = [];
    let   friends                = JSON.parse(myDataService.getMyData('friendsList'));
    if( friends === null ) {
        friends = [];
    }
    // quick hack to get me into the friends array so I'm encrypted to as well
    let biographyJSON = {
      friendUUID      : myUUID,
      publicPGP       : '',
      friendshipUUID  : ''
    };
    friends.push(biographyJSON);

    let loopLength    = friends.length - 1;
    angular.forEach(friends, (item, key) => {
      /*jshint loopfunc: true */
      ((cnt) => {
        vaultService.encrypToPGPKey(biography, friends[cnt].publicPGP).then((encryptedMessage) => {
          biographyJSON = {
            UUID        : friends[cnt].friendUUID,
            biography   : vaultService.encrypt(encryptedMessage, friends[cnt].friendshipUUID)
          };

          enryptedBiographyArray.push(biographyJSON);

          if( cnt >= loopLength ) {
            _saveEncryptedBiography(enryptedBiographyArray, callback);
            feedService.addNewStatus('friendBiographyReceived', 'Has an updated biography ');
          }
        });
      })(key);

    });
  };


  this.getAlbums = (UUID) => {
    const myUUID = vaultService.getMyData('userUUID');
    let   decryptionKey;

    if(UUID !== myUUID) {
      decryptionKey = friendsService.getFriendshipByFriendsUUID(UUID).friendshipUUID;
      UUID          = friendsService.getFriendshipByFriendsUUID(UUID).myFriendshipUUID;
    }
    return $q((resolve, reject) => {
      $http({
        url: "/myProfile/getAlbums",
        method: "get",
        params:{"UUID":UUID}
      }).success((data) => {
        loginService.loginValidate(data);
        if( !data.empty ) {
          angular.forEach(data, (item, key) => {
            data[key].albumImage  = vaultService.decrypt(data[key].albumImage, decryptionKey);
            data[key].albumTitle  = vaultService.decrypt(data[key].albumTitle, decryptionKey);
            data[key].decryptKey  = vaultService.decrypt(data[key].decryptKey, decryptionKey);
          });
        }
        resolve(data);
      }).error((data) => {
        reject(data);
      });
    });
  };

  this.getAlbumDecryptKey = (albumUUID, friendUUID) => {
    let myUUID = vaultService.getMyData('userUUID');
    let decryptionKey;
    if( friendUUID ) {
      myUUID        = friendsService.getFriendshipByFriendsUUID(friendUUID).myFriendshipUUID;
      decryptionKey = friendsService.getFriendshipByFriendsUUID(friendUUID).friendshipUUID;
    }

    return $q((resolve, reject) => {
      $http({
        url: "/myProfile/getAlbum",
        method: "get",
        params:{"albumUUID":albumUUID, "myUUID":myUUID}
      }).success((data) => {
        loginService.loginValidate(data);
        if( !data.empty ) {
          let decryptKey    = vaultService.decrypt(data[0].decryptKey, decryptionKey);
          resolve(decryptKey);
        }
        resolve('not found');
      }).error((data) => {
        reject(data);
      });
    });
  };

  this.getPhotos = (albumUUID, decryptionKey) => {
    return $q((resolve, reject) => {
      $http({
        url: "/myProfile/getPhotos",
        method: "get",
        params:{"UUID":albumUUID}
      }).success((data) => {
        loginService.loginValidate(data);
        if( !data.empty ) {
          angular.forEach(data, (item, key) => {
            data[key].thumbUrl    = vaultService.decrypt(data[key].photoImage, decryptionKey);
            data[key].url         = vaultService.decrypt(data[key].photoImage, decryptionKey);
            data[key].caption     = vaultService.decrypt(data[key].photoTitle, decryptionKey);
          });
          resolve(data);
        }
      }).error((data) => {
        reject(data);
      });
    });
  };

  let _saveEncryptedAlbum = (enryptedAlbumArray, callback) => {
    $http.post('/myprofile/upsertMyAlbum', JSON.stringify(enryptedAlbumArray)).success((response) => {
      loginService.loginValidate(response);
      if(response === "success") {
        if( callback ) {
          callback();
        }
      }else{
        console.log('Album saved failed');
      }
    }).catch((error) => {
      console.log('Album saved failure');
      console.log(error);
    });
  };


  this.saveAlbum = (albumTitle, albumImage, callback, albumUUID) => {
    const myUUID           = vaultService.getMyData('userUUID');
    let enryptedAlbumArray = [];
    let friends            = JSON.parse(myDataService.getMyData('friendsList'));
    // we simply concatenate 2 UUIDs to increase the possible number of combinations.
    // it's kind of pointless having a 512 bit hash but limited to the possible number of UUIDs
    let decryptKey         = hashAndKeyGeneratorService.getUUID() + hashAndKeyGeneratorService.getUUID();
        decryptKey         = hashAndKeyGeneratorService.getHash512(decryptKey);
    let albumJSON          = {};

    if( !albumUUID ) {
        albumUUID          = hashAndKeyGeneratorService.getUUID();
    }
    let myIDForUpdating    = myUUID + albumUUID;
    myIDForUpdating        = hashAndKeyGeneratorService.getHash256(myIDForUpdating);

    if( friends === null ) {
        friends = [];
    }
    // quick hack to get me into the friends array so I'm encrypted to as well
    let myFriendshipJSON = {
      friendUUID      : myUUID,
      publicPGP       : '',
      friendshipUUID  : ''
    };
    friends.push(myFriendshipJSON);

    let loopLength = friends.length - 1;
    angular.forEach(friends, (item, key) => {
      albumJSON = {
        albumUUID           : albumUUID,
        friendUUID          : friends[key].friendUUID,
        albumTitle          : vaultService.encrypt(albumTitle, friends[key].friendshipUUID),
        albumImage          : vaultService.encrypt(albumImage, friends[key].friendshipUUID),
        decryptKey          : vaultService.encrypt(decryptKey, friends[key].friendshipUUID),
        authorHashForUpdate : myIDForUpdating
      };
      enryptedAlbumArray.push(albumJSON);

      if( key >= loopLength ) {
        _saveEncryptedAlbum(enryptedAlbumArray, callback);
      }
    });
  };


  let _saveEncryptedPhoto = (photoJSON, callback, albumUUID) => {
    $http.post('/myprofile/saveMyPhoto', JSON.stringify(photoJSON)).success((response) => {
      loginService.loginValidate(response);
      if(response === "success") {
        if( callback ) {
          callback(albumUUID);
        }
      }else{
        console.log('photo saved failed');
      }
    }).catch((error) => {
      console.log('photo saved failure');
      console.log(error);
    });
  };

  this.savePhoto = (photoTitle, photoImage, albumUUID, encryptionKey, callback) => {
    let myUUID            = vaultService.getMyData('userUUID');
    let photoJSON         = {};
    let photoUUID         = hashAndKeyGeneratorService.getUUID();
    let myIDForUpdating   = myUUID + albumUUID;
    // this hashed inputs could be worked out quite easily by someone who has access to the DB
    // but they can't decrypt it.
    myIDForUpdating       = hashAndKeyGeneratorService.getHash256(myIDForUpdating);
    photoJSON             = {
      albumUUID           : albumUUID,
      photoUUID           : photoUUID,
      photoTitle          : vaultService.encrypt(photoTitle, encryptionKey),
      photoImage          : vaultService.encrypt(photoImage, encryptionKey),
      authorHashForUpdate : myIDForUpdating
    };
    _saveEncryptedPhoto(photoJSON, callback, albumUUID);
    feedService.addNewStatus('friendPhotoAlbumUpdated', 'added a new photo to an album ');
  };
}]);