'use strict';
VultronixApp.factory("imageFactory", ['$http',function($http){

  let obj = {};

  obj.fetchVimeoData = (videoId)=> {
    return $http.get('http://vimeo.com/api/v2/video/' + videoId + '.json');
  };

  obj.fetchDailyMotionData = (videoId)=> {
    return $http.get('https://api.dailymotion.com/video/' + videoId + '?fields=thumbnail_medium_url');
  };

  return obj;

}]);
