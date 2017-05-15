'use strict';
VultronixApp.controller('FeedController',['$scope',
  '$q',
  'Lightbox',
  '$timeout',
  'imageService',
  'imageFactory',
  'myDataService',
  '$routeParams',
  'feedService',
  'profileService',
  'socketsService',
  ($scope, $q, Lightbox, $timeout, imageService, imageFactory, myDataService, $routeParams, feedService, profileService, socketsService) => {
  let newFeedMediaQty       = 0;
  $scope.loadingFeed        = true;
  $scope.feedLoadingMessage = 'loading articles';
  $scope.currentArticleId   = '';
  $scope.Lightbox           = Lightbox;
  $scope.vimeoData          = {};
  $scope.profileMode        = 'feed';
  $scope.showStatusInput    = true;
  $scope.showMobileMenu     = true;
  $scope.showFeedMoreButton = true;

  profileService.getProfileImage().then((data) => {
    if (data.imageData){
      $scope.profileImage = data;
    }else if ( ! data.requestCount ){
      return profileService.decryptAndSetProfileImage(data);
    }
  }).then((data) => {
    $scope.profileImage = data;
  });

  profileService.getHeaderImage().then((data) => {
    // below if is when it's been cached, eg switching tabs on the persons profile
    if (data.imageData){
      /* below requestcount crap needs to be fixed up, it only exists when nothing found
         if nothing is found it exists and has a value of 0 */
    }else if ( data.requestCount === undefined ){
      return profileService.decryptAndSetHeaderImage(data);
    }
  });

  profileService.getHeaderImage();

  $scope.toggleVideoForm = () => {
    const videoForm  = document.querySelector('#videoForm');
    toggleClass(videoForm,'hide-this');
    toggleClass(whatsNewShareButtons,'share-buttons-bottom-border');
  };

  $scope.setArticleId = (articleId) => {
    $scope.currentArticleId = articleId;
  };

  let init = () => {
    const feedType     = 'feed';
    const myUUID       = myDataService.getMyData('userUUID');
    $scope.videoForm   = false;
    $scope.loadingFeed = true;
    if ( document.getElementById("articleId") !== null){
      document.getElementById("articleId").blur();
    }

    $scope.statusNotifications   = ( Array.isArray($scope.statusNotifications   )) ? $scope.statusNotifications   : [];
    $scope.$root.statusUUIDArray = ( Array.isArray($scope.$root.statusUUIDArray )) ? $scope.$root.statusUUIDArray : [];
    $scope.feedLoadingMessage    = 'Downloading statuses notifications...';

    if ( ! $scope.$root.feedStatus || ! $scope.$root.feedStatus.length ){
      $scope.$root.feedStatus = [];
    }
    let feedItemCount = $scope.$root.feedStatus.length;

    if ($scope.$root.feedStatus.length){
      $scope.$root.feedStatus.sort( (a, b) => {
        return new Date(b.statusData.postDate) - new Date(a.statusData.postDate);
      });
    }

    let feedStatus         = $scope.$root.feedStatus;
    const newestStatusTime = feedService.getNewestStatusTime($scope.$root.feedStatus);

    feedService.getStatusNotifications(myUUID,
                                       feedType,
                                       feedStatus,
                                       newestStatusTime,
                                       $scope.statusNotifications,
                                       $scope.$root.statusUUIDArray,
                                       feedItemCount).then((statusNotificationsData) => {
      $scope.feedLoadingMessage               = "Downloading and decrypting statuses...";
      $scope.$root.statusUUIDArray            = statusNotificationsData.statusUUIDArray;
      $scope.$root.feedArticlesDecryptionKeys = $scope.$root.feedArticlesDecryptionKeys || [];
      if (statusNotificationsData.statusNotifications.length){
        $scope.$root.feedArticlesDecryptionKeys = feedService.concatStatusArraysAndRemoveDupes($scope.$root.feedArticlesDecryptionKeys, statusNotificationsData.statusNotifications);
      }
      return feedService.getStatuses(statusNotificationsData);
    }).then((data) => {
      $scope.feedLoadingMessage = "Updating feed...";
      let feedStatus            = feedService.preventDuplicateStatuses(data.decryptedStatuses, $scope.$root.feedStatus);

      if ( feedStatus.updated ){
        feedStatus.feedStatus.sort( (a, b) => {
          return new Date(b.statusData.postDate) - new Date(a.statusData.postDate);
        });
        $scope.$root.feedStatus = feedStatus.feedStatus;
      }
      $scope.loadingFeed = false;
    });

    feedService.showHideNewFeedStatusIcon(false);
  };


  $scope.saveStatus = (articleText) => {
    if ( ! articleText ){
      alert('Please include some text');
      return false;
    }
    const mediaJSON           = feedService.buildMediaFeedJSON(newFeedMediaQty);
    const statusData          = feedService.buildStatusFeedData(mediaJSON, articleText, newFeedMediaQty, 'newArticle');
    const newStatus           = feedService.buildNewStatusFeedData(mediaJSON, statusData);
    $scope.feedLoadingMessage = 'Saving status...';
    $scope.loadingFeed        = true;
    const statusJSON          = feedService.buildStatusJSON(statusData, newStatus);
    // we don't optimistically update the dom, we simply wait for a response from the DB
    // TODO: optimistically update the dom, add it before it's saved, but remove if save fails etc
    // ensure it's updated with databases time so we can pull newer statuses from client without pulling it again.
    feedService.sendStatus(statusJSON.feedJSON).then(() => {
      $scope.loadingFeed = false;
      return feedService.sendStatusNotifications(statusJSON.feedJSON);
    }).then(() => {
      init();
      if (newFeedMediaQty !== 0) {
        imageService.deleteNewFeedImages(newFeedMediaQty);
        newFeedMediaQty = 0;
      }
    });

    if (document.getElementById('articleId')){
      document.getElementById('articleId').value = "";
    }
  };


  $scope.saveComment = (articleId, commentText, decryptKey) => {
    $scope.myComments            = {};
    $scope.myComments.statusUUID = articleId;
    let commentData              = feedService.buildCommentFeedData(articleId, commentText, decryptKey);
    for (var i=0; i < $scope.$root.feedStatus.length; i++) {
      if ($scope.$root.feedStatus[i].statusUUID === articleId) {
        $scope.$root.feedStatus[i].comments.push(commentData);
      }
    }
    feedService.saveMyComment(commentData);
  };

  // MAKE SURE THE STATUS BOX IS SHOWN ( THIS OVERIDES THE DEFAULT x-editable BEHAVIOUR )
  if ($scope.formStatus) {
    $scope.$watch('formStatus.$visible', () => {
      $scope.formStatus.$show();
    });
  }

  $scope.clearFeedForm = () => {
    return "";
  };

  $scope.imageSelect = (imageType) => {
    $timeout(() => {
      document.getElementById(imageType).click();
    }, 100);
  };

  $scope.processImage = (imageType) => {
    let aryFiles   = imageService.getFiles(imageType);
    let img        = document.createElement('img');
    if (aryFiles.length && aryFiles[0].type.match(/image.*/)) {
      img.src = window.URL.createObjectURL(aryFiles[0]);
      img.id  = 'tmpImage';
      img.onload = () => {
        newFeedMediaQty++;
        let src        = '';
        let mediaClass = ' class="feedImageThumbnail"';
        let mediaIcon  = ' data-mediaIcon="fa fa-fw fa-picture-o"';
        let mediaId    = ' id="newStatusImage_' + newFeedMediaQty + '"';
        let mediaSrc   = '';
        let mediaUrl   = '';
        let mediaType  = ' data-mediatype="image"';
        let canvas     = document.createElement('canvas');
        let element    = '';
        let aryReqSize = imageService.getReqSizes(imageType, img.height, img.width);
        canvas.width   = aryReqSize[0];
        canvas.height  = aryReqSize[1];
        canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, aryReqSize[0], aryReqSize[1]);
        src            = canvas.toDataURL('image/jpeg', 1);
        mediaSrc       = ' src="' + src + '"';
        mediaUrl       = ' data-mediaUrl="' + src + '"';
        element        = '<img' + mediaClass + mediaIcon + mediaId + mediaSrc + mediaUrl + mediaType + '>';
        document.getElementById('addedFeedImages').insertAdjacentHTML('beforeEnd',element);
      };
    }
  };

  // TESTING URL'S
  // https://www.youtube.com/watch?v=GnqrsrBH8HM
  // https://vimeo.com/13911208
  // http://www.dailymotion.com/video/x37s0sd_how-to-watch-sunday-s-supermoon-eclipse_news

  $scope.processVideo = () => {
    let aryVideo  = [];
    let videoUrl  = document.querySelector('#videoInput').value;
    let videoForm = document.querySelector('#videoForm');
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
    Lightbox.openModal($scope.$root.myStatus.media, index);
  };

  $scope.processMoreButton = () => {
    const myUUID                = myDataService.getMyData('userUUID');
    const feedType              = 'feed';
    let feedItemCount           = $scope.$root.feedStatus.length;
    const loadMoreButtonClicked = true;
    scrollFeedToBottom(3);
    $scope.loadingFeed          = true;
    $scope.feedLoadingMessage   = 'Downloading older statuses notifications...';
    $scope.$root.feedStatus.sort( (a, b) => {
      return new Date(b.statusData.postDate) - new Date(a.statusData.postDate);
    });

    let feedStatus         = $scope.$root.feedStatus;
    const newestStatusTime = feedService.getNewestStatusTime($scope.$root.feedStatus);

    feedService.getStatusNotifications(myUUID,
                                       feedType,
                                       feedStatus,
                                       newestStatusTime,
                                       $scope.statusNotifications,
                                       $scope.$root.statusUUIDArray,
                                       feedItemCount,
                                       loadMoreButtonClicked).then((statusNotificationsData) => {
      let rootDecryptionKeys  = $scope.$root.feedArticlesDecryptionKeys || [];
      let statusNotifications = statusNotificationsData.statusNotifications;
      $scope.$root.feedArticlesDecryptionKeys = feedService.concatStatusArraysAndRemoveDupes(rootDecryptionKeys, statusNotifications);
      $scope.feedLoadingMessage               = "Downloading and decrypting statuses...";
      return feedService.getStatuses(statusNotificationsData);
    }).then((data) => {
      $scope.feedLoadingMessage = "Updating feed...";

      data.decryptedStatuses.sort( (a, b) => {
        return new Date(b.statusData.postDate) - new Date(a.statusData.postDate);
      });

      feedStatus = feedService.preventDuplicateStatuses(data.decryptedStatuses, $scope.$root.feedStatus);
      if ( feedStatus.updated ){
        $scope.$root.feedStatus = feedStatus.feedStatus;
      }
      scrollFeedToBottom(data.decryptedStatuses.length);
      $timeout(() => {
        $scope.loadingFeed = false;
      }, 10);
    });
  };

  const scrollFeedToBottom = (feedLength) => {
    if ( feedLength !== 3 ) {
      // $scope.showFeedMoreButton = false;
    }
    $timeout( () => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 10);
  };

  init();

}]);

VultronixApp.controller('feedArticleController',['$scope', '$q', 'Lightbox', '$routeParams', 'feedService', 'myDataService',
  ($scope, $q, Lightbox, $routeParams, feedService, myDataService) => {
  $scope.loadingFeed        = true;
  $scope.feedLoadingMessage = 'loading article';
  $scope.currentArticleId   = $routeParams.articleID;
  $scope.currentTab         = 0;
  $scope.myInterval         = false;
  $scope.Lightbox           = Lightbox;

  let init = () => {
    const myUUID          = myDataService.getMyData('userUUID');
    const feedType        = 'singleArticle';
    $scope.loadingFeed    = true;
    const statusUUIDArray = [$routeParams.articleID];
    const statusNotificationData = {
      'statusUUIDArray'                  : statusUUIDArray,
      'decryptedStatusNotificationsData' : $scope.$root.feedArticlesDecryptionKeys,
      'myUUID'                           : myUUID,
      'feedType'                         : feedType
    };

    feedService.getStatuses(statusNotificationData).then((data) => {
      $scope.article     = data.decryptedStatuses[0];
      $scope.loadingFeed = false;
    });
  };

  init();

  $scope.showTab = (tab) => {
    $scope.currentTab = tab;
  };

  $scope.isActiveTab = (tabUrl) => {
    return tabUrl === $scope.currentTab;
  };

  $scope.openLightboxModal = (index) => {
    Lightbox.openModal($scope.article.media, index);
  };

  let updateComments = () => {
    // CODE HERE FOR AFTER COMMENTS HAVE BEEN SAVED
  };

  $scope.saveComment = (articleId, commentText, decryptKey) => {
    $scope.myComments             = {};
    $scope.myComments.statusUUID  = articleId;
    let commentData               = feedService.buildCommentFeedData(articleId, commentText, decryptKey);
    if ($scope.article.statusUUID === articleId) {
      $scope.article.comments.push(commentData);
    }
    feedService.saveMyComment(commentData);
  };

}]);