'use strict';
VultronixApp.controller('ProfileController', ['$scope',
  '$modal',
  '$timeout',
  'profileService',
  'feedService',
  'imageService',
  'myDataService',
  '$routeParams',
  'loginService',
  'vaultService',
  'Lightbox',
  'hashAndKeyGeneratorService',
  '$q',
  'socketsService',
  '$location',
  '$window',
  'imageFactory',
  ($scope, $modal, $timeout, profileService, feedService, imageService, myDataService, $routeParams, loginService, vaultService, Lightbox, hashAndKeyGeneratorService, $q, socketsService, $location, $window, imageFactory) => {
  const myUUID              = vaultService.getMyData('userUUID');
  $scope.loading            = false;
  $scope.albumsShow         = true;
  // blank image saying click to upload
  $scope.newAlbumImage      = "images/profile.png";
  $scope.newPhotoImage      = "images/profile.png";
  $scope.albumText          = "";
  $scope.albumUUID          = "";
  $scope.decryptKey         = "";
  $scope.photos             = [];
  $scope.albumFormShow      = false;
  $scope.aboutForm          = false;
  $scope.biographyForm      = false;
  $scope.biography          = '';
  $scope.feedLoadingMessage = 'Downloading...';
  $scope.Lightbox           = Lightbox;
  $scope.tabs               = [
    {
        title  : 'Albums',
        url    : 'app/myprofile/templateAlbums.html',
        faIcon : 'fa fa-fw fa-folder'
    },
    {
        title  : 'Photos',
        url    : 'app/myprofile/templatePhotos.html',
        faIcon : 'fa fa-fw fa-picture-o'
    }
  ];
  $scope.currentTab    = 'app/myprofile/templateAlbums.html';
  $scope.userUUID      =  myDataService.getMyData('userUUID');

  $scope.showPhotosTab = (albumUUID, decryptKey) => {
    if ( albumUUID ) {
      $scope.decryptKey = decryptKey;
      $scope.albumUUID  = albumUUID;
      $location.url('/myprofile/about/' + albumUUID);
      $scope.currentTab = 'app/myprofile/templatePhotos.html';
    }
  };

  $scope.showTab = (tab, albumUUID) => {
    if (tab.title === "Photos"){
      if (albumUUID){
        $scope.photosShow     = true;
        $scope.loadingProfile = true;
        $scope.profileMessage = 'Loading photos...';
        const decryptKey      = $scope.decryptKey;
        if ( ! decryptKey || ! decryptKey.length){
          profileService.getAlbumDecryptKey(albumUUID).then((decryptionKey) => {
            $scope.decryptKey = decryptionKey;
            return profileService.getPhotos(albumUUID, $scope.decryptKey);
          }).then((data) => {
            $scope.loadingProfile = false;
            $scope.photos = data;
          });
        }else{
          profileService.getPhotos(albumUUID, decryptKey).then((data) => {
            $scope.loadingProfile = false;
            $scope.photos = data;
          });
        }
      }else{
        $scope.photos = [];
      }
      tab.url = 'app/myprofile/templatePhotos.html';
    }else{
      $scope.photoFormShow = false;
    }
    $scope.currentTab = tab.url;
  };

  $scope.isActiveTab = (tabUrl) => {
    return tabUrl === $scope.currentTab;
  };


  let init = () => {
    const feedType          = 'myProfile';
    $scope.showStatusInput  = true;
    $scope.aboutForm        = false;
    $scope.aboutData        = true;
    $scope.biographyData    = true;

    //IF PROFILE NAV BUTTON IS CLICKED
    if ( !$routeParams.profileMode ) {
      $routeParams.profileMode = 'feed';
    }
    if ( $routeParams.albumUUID ) {
      $scope.showTab($scope.tabs[1], $routeParams.albumUUID);
    }

    $scope.profileUUID      = myUUID;
    $scope.profileMode      = $routeParams.profileMode;
    $scope.userUUID         = myUUID;
    $scope.myProfile        = profileService.getProfile(myUUID);
    $scope.loadingProfile   = true;
    $scope.profileMessage   = 'Load About Info...';

    profileService.getProfile(myUUID).then((profile) => {
      if (profile){
        $scope.myProfile      = profile;
        $scope.bitcoinAddress = profile.bitcoinAddress.pData;
      }
    });

    profileService.getProfileImage(myUUID).then((data) => {
      if (data.imageData){
        $scope.profileImage = data.imageData;
      }else{
        $scope.profileImage = "images/profile.png";
      }
    }).then(() => {
      $scope.loadingProfile = false;
      $scope.profileMessage = '';
    });

    profileService.getHeaderImage(myUUID).then((data) => {
      if (data.imageData){
        $scope.headerImage = data.imageData;
      }else{
        $scope.headerImage = "images/cover.png";
      }
    }).then(() => {
      $scope.loadingImages = false;
    });

    if ($scope.profileMode === 'feed') {
      $scope.loadingFeed        = true;
      $scope.feedLoadingMessage = 'Downloading statuses notifications...';
      feedService.getStatusNotifications(myUUID, feedType).then((statusNotificationsData) => {
        let rootDecryptionKeys  = $scope.$root.feedArticlesDecryptionKeys || [];
        let statusNotifications = statusNotificationsData.statusNotifications;
        $scope.$root.feedArticlesDecryptionKeys = feedService.concatStatusArraysAndRemoveDupes(rootDecryptionKeys, statusNotifications);
        $scope.feedLoadingMessage               = "Downloading and decrypting statuses...";
        return feedService.getStatuses(statusNotificationsData);
      }).then((data) => {
        let feedStatus = data.decryptedStatuses;
        if ( feedStatus ){
          $scope.myStatus = feedStatus;
        }
        $scope.loadingFeed  = false;
      });
    }else{
      profileService.getBiography(myUUID).then((data) => {
        if ( data.empty ){
          $scope.biography = [];
        }else if ( data.biography ){
          return data.biography;
        }else{
          return profileService.decryptBiography(data, myUUID);
        }
      }).then((biography) => {
        $scope.biography = biography;
      });

      $scope.loadingProfile = true;
      $scope.profileMessage = 'loading albums...';
      profileService.getAlbums(myUUID).then((data) => {
        $scope.albums = ( !data.empty )?data:[];
      });
    }
  };

  init();

  let reloadAlbums = () => {
    profileService.getAlbums(myUUID).then((data) => {
      $scope.albums         = ( !data.empty )?data:[];
      $scope.loadingProfile = false;
    });
    document.getElementById('newAlbumImageInput').value = '';
    document.getElementById('newAlbumImage').src        = 'images/profile.png';
    $scope.newAlbumImage                                = 'images/profile.png';
  };

  $scope.saveProfile = () => {
    $scope.myProfile  = profileService.saveMyProfile($scope.myProfile, init);
  };

  $scope.saveBiography = (biography) => {
    profileService.saveMyBiography(biography);
  };

  $scope.cancelCreateAlbum = () => {
    $scope.albumFormShow                                = !$scope.albumFormShow;
    $scope.albumsShow                                   = !$scope.albumsShow;
    document.getElementById('newAlbumImageInput').value = '';
    document.getElementById('newAlbumImage').src        = 'images/profile.png';
    $scope.newAlbumImage                                = 'images/profile.png';
  };

  $scope.saveAlbum = (albumText) => {
    $scope.albumFormShow  = !$scope.albumFormShow;
    $scope.albumsShow     = !$scope.albumsShow;
    const albumImage      = document.getElementById('newAlbumImage').src;
    const albumTitle      = albumText;
    $scope.loadingProfile = true;
    $scope.profileMessage = 'Saving album...';
    profileService.saveAlbum(albumTitle, albumImage, reloadAlbums);
    $scope.albumText      = "";
  };


  $scope.createAlbum = () => {
    $scope.albumFormShow = !$scope.albumFormShow;
    $scope.albumsShow    = !$scope.albumsShow;
  };

  $scope.cancelCreatePhoto = () => {
    $scope.photoFormShow = !$scope.photoFormShow;
    $scope.photosShow    = !$scope.photosShow;
    document.getElementById('photoText').value   = '';
    document.getElementById('newPhotoImage').src = 'images/profile.png';
    $scope.newPhotoImage                         = 'images/profile.png';
  };

  $scope.createPhoto = () => {
    $scope.photoFormShow = !$scope.photoFormShow;
    $scope.photosShow    = !$scope.photosShow;
  };

  let reloadPhotos = (albumUUID) => {
    const decryptKey = $scope.decryptKey;
    profileService.getPhotos(albumUUID, decryptKey).then((data) => {
      $scope.photos         = data;
      $scope.loadingProfile = false;
    });
    document.getElementById('photoText').value   = '';
    document.getElementById('newPhotoImage').src = 'images/profile.png';
    $scope.newPhotoImage                         = 'images/profile.png';
  };

  $scope.savePhoto = (photoText) => {
    const albumUUID         = $routeParams.albumUUID;
    const decryptKey        = $scope.decryptKey;
    $scope.photoFormShow    = !$scope.photoFormShow;
    $scope.photosShow       = !$scope.photosShow;
    const photoImage        = document.getElementById('newPhotoImage').src;
    const photoTitle        = photoText;
    $scope.loadingProfile   = true;
    $scope.profileMessage   = 'Saving photo...';
    profileService.savePhoto(photoTitle, photoImage, albumUUID, decryptKey, reloadPhotos);
    $scope.photoText        = "";
  };

  $scope.imageSelect = (imageType) => {
    $timeout(() => {
      document.getElementById(imageType).click();
    }, 100);
  };

  $scope.setFeedType = (feedType) => {
    $scope.myStatus.feedType = feedType;
  };


  $scope.setArticleId = (articleId) => {
    $scope.currentArticleId = articleId;
  };

  let updateComments = () => {
      // CODE HERE FOR AFTER COMMENTS HAVE BEEN SAVED
  };
  let newFeedMediaQty = 0;

  $scope.saveStatus = (articleText) => {
    if ( ! articleText ){
      alert('Please include some text');
      return false;
    }
    let mediaJSON  = feedService.buildMediaFeedJSON(newFeedMediaQty);
    let statusData = feedService.buildStatusFeedData(mediaJSON, articleText, newFeedMediaQty, 'newArticle');
    let newStatus  = feedService.buildNewStatusFeedData(mediaJSON, statusData);
    let statusJSON = feedService.buildStatusJSON(statusData, newStatus);

    if ( statusJSON.newStatus && $scope.statuses) {
      if (!$scope.statuses[0]) {
        $scope.statuses      = [];
        $scope.statuses[0]   = '';
      }
      $scope.statuses.push(statusJSON.newStatus);
    }

    feedService.sendStatus(statusJSON.feedJSON).then(() => {
      $scope.loadingFeed = false;
      feedService.sendStatusNotifications(statusJSON.feedJSON);
      init();
    });

    if (newFeedMediaQty !== 0) {
      imageService.deleteNewFeedImages(newFeedMediaQty);
      newFeedMediaQty = 0;
    }

    if (document.getElementById('articleId')){
      document.getElementById('articleId').value = "";
    }
  };

 $scope.saveComment = (articleId, commentText, decryptKey) => {
    $scope.myComments             = {};
    $scope.myComments.statusUUID  = articleId;
    let commentData               = feedService.buildCommentFeedData(articleId, commentText, decryptKey);
    for (let i=0; i < $scope.myStatus.length; i++) {
      if ($scope.myStatus[i].statusUUID === articleId) {
        $scope.myStatus[i].comments.push(commentData);
      }
    }
    feedService.saveMyComment(commentData);
  };

  $scope.toggleVideoForm = () => {
    let videoForm  = document.querySelector('#videoForm');
    toggleClass(videoForm,'hide-this');
    toggleClass(whatsNewShareButtons,'share-buttons-bottom-border');
  };

  $scope.processImage = (imageType) => {
    // TODO: make this much more dynamic and move to a service
    let aryFiles   = imageService.getFiles(imageType);
    let img        = document.createElement('img');
    if (aryFiles.length && aryFiles[0].type.match(/image.*/)) {
      img.src = window.URL.createObjectURL(aryFiles[0]);
      img.id  = 'tempImage';
      img.onload = () => {
        let src        = '';
        let canvas     = document.createElement('canvas');
        let dataUrl    = '';
        let arySize    = imageService.calculateSize(img.height, img.width);
        let aryReqSize = imageService.getReqSizes(imageType, img.height, img.width);
        canvas.width   = aryReqSize[0];
        canvas.height  = aryReqSize[1];
        canvas.getContext('2d').drawImage(img, 0, 0, arySize[0], arySize[1], 0, 0, aryReqSize[0], aryReqSize[1]);
        switch (imageType) {
          case 'coverImage':
            dataUrl = canvas.toDataURL('image/jpeg',0.7);
            document.getElementById(imageType).src = dataUrl;
            profileService.saveHeaderImage();
            break;
          case "profileImage":
            dataUrl = canvas.toDataURL('image/jpeg',0.7);
            document.getElementById(imageType).src = dataUrl;
            profileService.saveProfileImage();
            break;
          case "newAlbumImage":
            dataUrl = canvas.toDataURL('image/jpeg',0.7);
            document.getElementById(imageType).src = dataUrl;
            break;
          case "newPhotoImage":
            dataUrl = canvas.toDataURL('image/jpeg',0.7);
            document.getElementById(imageType).src = dataUrl;
            break;
          case "feedImage":
            newFeedMediaQty++;
            let mediaClass = ' class="feedImageThumbnail"';
            let mediaIcon  = ' data-mediaIcon="fa fa-fw fa-picture-o"';
            let mediaId    = ' id="newStatusImage_' + newFeedMediaQty + '"';
            let mediaType  = ' data-mediatype="image"';
            src            = canvas.toDataURL('image/jpeg',0.7);
            let mediaSrc   = ' src="' + src + '"';
            let mediaUrl   = ' data-mediaUrl="' + src + '"';
            let element    = '<img' + mediaClass + mediaIcon + mediaId + mediaSrc + mediaUrl + mediaType + '>';
            document.getElementById('addedFeedImages').insertAdjacentHTML('beforeEnd',element);
            break;
        }
      };
    }
  };

  // TESTING URL'S
  // https://www.youtube.com/watch?v=GnqrsrBH8HM
  // https://vimeo.com/13911208
  // http://www.dailymotion.com/video/x37s0sd_how-to-watch-sunday-s-supermoon-eclipse_news

  $scope.processVideo = () => {
    let   aryVideo  = [];
    const videoUrl  = document.querySelector('#videoInput').value;
    const videoForm = document.querySelector('#videoForm');
    if (videoUrl) {
      newFeedMediaQty++;
      aryVideo = imageService.getVideoData(videoUrl, newFeedMediaQty, $scope, $q);
      document.getElementById('addedFeedImages').insertAdjacentHTML('beforeEnd',aryVideo[3]);
      if (aryVideo[0] === 'vimeo') {
        imageFactory.fetchVimeoData(aryVideo[2]).success(
          (data) => {
            document.getElementById(aryVideo[4]).setAttribute('src', data[0].thumbnail_medium);
          }
        );
      }
      if (aryVideo[0] === 'dailymotion') {
        imageFactory.fetchDailyMotionData(aryVideo[2]).success(
          (data) => {
            document.getElementById(aryVideo[4]).setAttribute('src', data.thumbnail_medium_url);
          }
        );
      }
      $scope.videoInput = '';
      toggleClass(videoForm,'hide-this');
    }
  };

  $scope.openLightboxModal = (index) => {
    Lightbox.openModal($scope.myStatus.media, index);
  };

}]);