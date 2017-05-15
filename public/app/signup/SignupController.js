'use strict';
VultronixApp.controller('SignupController', ['$scope',
 '$location',
 'hashAndKeyGeneratorService',
 'vaultService',
 'signupService',
 'myDataService',
 'imageService',
 'socketsService',
 ($scope, $location, hashAndKeyGeneratorService, vaultService, signupService, myDataService, imageService, socketsService)=> {
  $scope.credentials          = {};
  $scope.credentials.email    = "";
  $scope.credentials.password = "";
  $scope.credentials.words    = "";
  $scope.credentials.nickname = "";
  $scope.credentials.name     = "";
  $scope.loginStatus          = "";
  $scope.signupStatus         = "";
  $scope.signupForm           = true;
  $scope.signupDisclaimer     = true;
  $scope.signupPleasewaitDiv  = false;
  $scope.vLogo                = imageService.logo();

  $scope.signup = () => {
    $scope.signupStatus        = "Generating encryption keys, please wait...";
    myDataService.deleteCredentials();
    const credentialsToHash    = $scope.credentials.email + $scope.credentials.password + $scope.credentials.words;
    const hashStruct           = hashAndKeyGeneratorService.getHashStruct(credentialsToHash);
    const passphrase           = hashStruct.hashOne.toString();
    const encryptionKey        = hashStruct.hashTwo.toString();
    const loginHash            = hashStruct.hashThree.toString();
    vaultService.setEncryptionKeys(hashStruct);
    $scope.signupForm          = false;
    $scope.signupPleasewaitDiv = true;
    $scope.signupDisclaimer    = false;
    // TODO: add some error handling
    signupService.getSignupCredentials(passphrase, encryptionKey, loginHash).then((credentials) => {
      $scope.signupStatus   = "Keys generated, now Signing you up!";
      vaultService.setCredentials(credentials.myCredentials);
      return signupService.signup(credentials.myCredentials.UUID, credentials.signupCredentials, $scope.credentials.name, $scope.credentials.nickname);
    }).then((response) => {
      if( response.loginStatus === 'success' ) {
        $scope.showMobileMenu      = true;
      }else{
        $scope.loginStatus         = response.loginStatus;
        $scope.signupDisclaimer    = true;
        $scope.signupForm          = true;
        $scope.signupPleasewaitDiv = false;
      }
    });

  };
}]);
