'use strict';
VultronixApp.service('loginService', ['$location', function ($location) {

  this.loginValidate = (response) => {
  	// LTE 1 as it's not usually completely empty if someone closes their browser and comes back.
  	// We keep them logged in for a long time so as not to have them logged out if they're AFK for yonks.
  	// we could instead have the session die on browser close.
  	// issue with current fix is, if a user opens a new tab they'll be logged out.
  	// TODO: have login session die on browser close.
    const isSessionManagementEmpty = (sessionStorage.length <= 1) ? true : false;
    if(response.logoutStatus || isSessionManagementEmpty){
      sessionStorage.clear();
      $location.path('/home');
    }
  };

}]);