'use strict';
VultronixApp.service('myDataService',[ function () {

  this.getMyData = (value)=> {
    let valueFromStorage = sessionStorage.getItem(value);
    return valueFromStorage;
  };

  this.setMyData = (item, value)=> {
    sessionStorage.setItem(item, value);
  };

  this.deleteCredentials = ()=> {
    sessionStorage.clear();
  };

}]);