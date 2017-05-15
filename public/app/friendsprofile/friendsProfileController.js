'use strict';
VultronixApp.controller('friendsProfileController', ['$scope',
  'loginService',
  '$routeParams',
  'profileService',
  'feedService',
  '$http',
  'friendsService',
  'Lightbox',
  'myDataService',
  'socketsService',
  '$location',
  ($scope, loginService, $routeParams, profileService, feedService, $http, friendsService, Lightbox, myDataService, socketsService, $location) => {

  $scope.friendUUID         = $routeParams.friendUUID;
  $scope.feedLoadingMessage = 'Downloading...';
  $scope.statusMessage      = 'Loading...';
  $scope.biography          = '';
  $scope.albumUUID          = "";
  $scope.decryptKey         = "";
  $scope.albumsShow         = true;
  $scope.photosShow         = false;
  $scope.photos             = [];
  $scope.loading            = true;
  $scope.loadingImages      = false;
  $scope.Lightbox           = Lightbox;
  $scope.tabs               = [
    {
      title  : 'Albums',
      url    : 'app/friendsprofile/templateAlbums.html',
      faIcon : 'fa fa-fw fa-folder'
    },
    {
      title  : 'Photos',
      url    : 'app/friendsprofile/templatePhotos.html',
      faIcon : 'fa fa-fw fa-picture-o'
    }
  ];
  $scope.currentTab = 'app/friendsprofile/templateAlbums.html';

  $scope.showPhotosTab = (albumUUID, decryptKey) => {
    if ( albumUUID ) {
      $scope.decryptKey = decryptKey;
      $scope.albumUUID  = albumUUID;
      $location.url('/friendsprofile/'+$scope.friendUUID+'/about/' + albumUUID);
      $scope.currentTab = 'app/friendsprofile/templatePhotos.html';
    }
  };

  $scope.showTab = (tab, albumUUID) => {
    if (tab.title === "Photos"){
      if (albumUUID){
        $scope.photosShow = true;
        const decryptKey  = $scope.decryptKey;
        if ( ! decryptKey || ! decryptKey.length){
          profileService.getAlbumDecryptKey(albumUUID, $scope.friendUUID).then((decryptionKey) => {
            return profileService.getPhotos(albumUUID, decryptionKey);
          }).then((data) => {
            $scope.photos = data;
          });
        }else{
          profileService.getPhotos(albumUUID, decryptKey).then((data) => {
            $scope.photos = data;
          });
        }
      }else{
        $scope.photosShow = false;
      }
      tab.url = 'app/friendsprofile/templatePhotos.html';
    }else{
      $scope.photoFormShow = false;
    }
    $scope.currentTab = tab.url;
  };

  $scope.isActiveTab = (tabUrl) => {
      return tabUrl === $scope.currentTab;
  };

  // TODO: split up this narley piece of work.
  let init = () => {
    const feedType         = 'friendsProfile';
    const friendUUID       = $routeParams.friendUUID;
    let   myFriendshipUUID = '';
    try{
      myFriendshipUUID = friendsService.getFriendshipByFriendsUUID(friendUUID).myFriendshipUUID;
    } catch(error){
      $location.path('/myfriends');
    }
    $scope.profileUUID     = friendUUID;
    $scope.profileMode     = $routeParams.profileMode;
    $scope.userUUID        = friendUUID;
    $scope.loadingImages   = true;
    $scope.statusMessage   = "Getting header image...";

    profileService.getHeaderImage(friendUUID).then((data) => {
      // below if, is when it's been cached, eg switching tabs on the persons profile
      if (data.imageData){
        $scope.headerImage = data.imageData;
        /* below requestcount crap needs to be fixed up, it only exists when nothing found
           if nothing is found it exists and has a value of 0 */
        $scope.loadingImages = false;
      }else if ( data.requestCount === undefined ){
        return profileService.decryptAndSetHeaderImage(data, friendUUID);
      }
    }).then((data) => {
      if ( data ){
        $scope.headerImage = data;
      }
      $scope.loadingImages = false;
    });

    profileService.getProfileImage(friendUUID).then((data) => {
      // below if is when it's been cached, eg switching tabs on the persons profile
      if (data.imageData){
        $scope.profileImage = data.imageData;
      }else if ( data.requestCount === undefined ){
        return profileService.decryptAndSetProfileImage(data, friendUUID);
      }
    }).then((data) => {
      if ( data ){
        $scope.profileImage = data;
      }
    });

    $scope.loadingProfile = true;
    $scope.profileMessage = 'Load About Info...';
    profileService.getProfile(friendUUID).then((profile) => {
      if (profile){
        $scope.myProfile      = profile;
        $scope.bitcoinAddress = profile.bitcoinAddress.pData;
        $scope.loadingProfile = false;
        $scope.profileMessage = '';
      }else{
        $scope.statusMessage = 'Your friends profile will be viewable after he/she/it next logs in';
        alert("After you accept a friend's request, your friend must first receive confirmation, then they will encrypt a copy of their profile to you");
        $scope.loadingProfile = false;
        $scope.profileMessage = '';
      }
    });

    if ($scope.profileMode === 'feed') {
      $scope.loadingFeed = true;
      feedService.getStatusNotifications(myFriendshipUUID, feedType).then((statusNotificationsData) => {
        let rootDecryptionKeys  = $scope.$root.feedArticlesDecryptionKeys || [];
        let statusNotifications = statusNotificationsData.statusNotifications;
        $scope.$root.feedArticlesDecryptionKeys = feedService.concatStatusArraysAndRemoveDupes(rootDecryptionKeys, statusNotifications);
        $scope.feedLoadingMessage               = "Downloading and decrypting statuses...";
        return feedService.getStatuses(statusNotificationsData);
      }).then((data) => {
        const feedStatus = data.decryptedStatuses;
        if ( feedStatus ){
          $scope.myStatus = feedStatus;
        }
        $scope.loadingFeed  = false;
      });

    }else if ($scope.profileMode === 'about'){
      if ( $routeParams.albumUUID ) {
        $scope.showTab($scope.tabs[1], $routeParams.albumUUID);
      }

      profileService.getBiography(friendUUID).then((data) => {
        if ( data.empty ){
          $scope.biography = [];
        }else{
          return profileService.decryptBiography(data, friendUUID);
        }
      }).then((biography) => {
        $scope.biography = biography;
      });
      profileService.getAlbums(friendUUID).then((data) => {
        $scope.albums = ( !data.empty )?data:[];
      });
    }

  };

  init();

 $scope.saveComment = (articleId, commentText, decryptKey) => {
    $scope.myComments             = {};
    $scope.myComments.statusUUID  = articleId;
    const commentData             = feedService.buildCommentFeedData(articleId, commentText, decryptKey);
    for (let i=0; i < $scope.myStatus.length; i++) {
      if ($scope.myStatus[i].statusUUID === articleId) {
        $scope.myStatus[i].comments.push(commentData);
      }
    }
    feedService.saveMyComment(commentData);
  };

  $scope.setArticleId = (articleId) => {
    $scope.currentArticleId = articleId;
  };

  $scope.toggleVideoForm = () => {
    const videoForm  = document.querySelector('#videoForm');
    toggleClass(videoForm,'hide-this');
    toggleClass(whatsNewShareButtons,'share-buttons-bottom-border');
  };

  $scope.openLightboxModal = (index) => {
    Lightbox.openModal($scope.myStatus.media, index);
  };

}]);