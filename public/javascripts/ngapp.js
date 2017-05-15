'use strict';
const VultronixApp = angular.module('VultronixApp', ['ngRoute','ui.bootstrap','bootstrapLightbox','videosharing-embed', 'btford.socket-io', 'monospaced.qrcode'])
.config(['$routeProvider', ($routeProvider) => {
    $routeProvider
        .when('/home',
            {
                controller: 'HomeController',
                templateUrl: 'app/home/home.html'
            })
        .when('/signup',
            {
                controller: 'SignupController',
                templateUrl: 'app/signup/signup.html'
            })
        .when('/login',
            {
                controller: 'LoginController',
                templateUrl: 'app/login/login.html'
            })
        .when('/feed/',
            {
                controller: 'FeedController',
                templateUrl: 'app/feed/feed.html'
            })
        .when('/feed/:feedType',
            {
                controller: 'FeedController',
                templateUrl: 'app/feed/feed.html'
            })
        .when('/feedArticle/:articleID',
            {
                controller: 'feedArticleController',
                templateUrl: 'app/feed/feedArticle.html'
            })
        .when('/fanpage/:fanpageUUID',
            {
                controller: 'FanpageController',
                templateUrl: 'app/fanpage/fanpage.html'
            })
        .when('/shops/',
            {
                controller: 'ShopsController',
                templateUrl: 'app/shops/shops.html'
            })
        .when('/fanpages/',
            {
                controller: 'FanpagesController',
                templateUrl: 'app/fanpages/fanpages.html'
            })
        .when('/myprofile',
            {
                controller: 'ProfileController',
                templateUrl: 'app/myprofile/profile.html'
            })
        .when('/myprofile/:profileMode',
            {
                controller: 'ProfileController',
                templateUrl: 'app/myprofile/profile.html'
            })
        .when('/myprofile/:profileMode/:albumUUID',
            {
                controller: 'ProfileController',
                templateUrl: 'app/myprofile/profile.html'
            })
        .when('/myfriends',
            {
                controller: 'friendsController',
                templateUrl: 'app/myfriends/friends.html'
            })
        .when('/friendsprofile/:friendUUID/:profileMode',
            {
                controller: 'friendsProfileController',
                templateUrl: 'app/friendsprofile/friendsProfile.html'
            })
        .when('/friendsprofile/:friendUUID/:profileMode/:albumUUID',
            {
                controller: 'friendsProfileController',
                templateUrl: 'app/friendsprofile/friendsProfile.html'
            })
        .when('/friendrequest',
            {
                controller: 'FriendRequestController',
                templateUrl: 'app/friendrequest/friendRequests.html'
            })
        .when('/createfriendrequest',
            {
                controller: 'createFriendRequestController',
                templateUrl: 'app/friendrequest/createFriendRequest.html'
            })
        .when('/grouppage/:groupID',
            {
                controller: 'GroupPageController',
                templateUrl: 'app/grouppage/groupPage.html'
            })
        .when('/groups',
            {
                controller: 'GroupsController',
                templateUrl: 'app/groups/groups.html'
            })
        .when('/inbox',
            {
                controller: 'InboxController',
                templateUrl: 'app/inbox/inbox.html'
            })
        .when('/inboxMessage',
            {
                controller: 'InboxController',
                templateUrl: 'app/inbox/inbox.html'
            })
        .when('/myprivacy',
            {
                templateUrl: 'app/myprivacy/privacy.html'
            })
        .when('/about',
            {
                templateUrl: 'app/about/about.html'
            })
        .when('/contact',
            {
                templateUrl: 'app/contact/contact.html'
            })
        .when('/donate',
            {
                templateUrl: 'app/donate/donate.html'
            })
        .when('/policy',
            {
                templateUrl: 'app/policy/policy.html'
            })
        .when('/logout',
            {
                controller: 'LogoutController',
                templateUrl: 'app/logout/logout.html'
            })
        .otherwise({ redirectTo: '/home' });
}]).factory('mySocket', ['socketFactory', (socketFactory) => {
    const mySocket = socketFactory();
    mySocket.forward('connection');
  return mySocket;
}]);

// simply some code for showing/hiding the navbar, for now it'll do
VultronixApp.run(['$rootScope', ($rootScope) => {
    $rootScope.$on("$routeChangeSuccess", (e, data) => {
        const template = data.templateUrl;

        switch(template) {
            case undefined:
                $rootScope.showSidebar        = false;
                $rootScope.showMobileMenu     = false;
                break;
            case 'app/home/home.html': case 'app/login/login.html': case 'app/signup/signup.html':
                $rootScope.showSidebar                                          = false;
                $rootScope.showMobileMenu                                       = false;
                document.getElementById('navList').style.display                = 'none';
                document.getElementById('navBarContainer').style.display        = 'none';
                document.getElementById('footer').style.display                 = 'none';
                if(document.getElementById('mobileNavDiv')) {
                    document.getElementById('mobileNavDiv').style.display       = 'none';
                }
                break;
            default:
                $rootScope.showSidebar                                          = true;
                $rootScope.showMobileMenu                                       = true;
                document.getElementById('navList').style.display                = 'block';
                document.getElementById('navBarContainer').style.display        = 'block';
                document.getElementById('footer').style.display                 = 'block';
                if(document.getElementById('mobileNavDiv')) {
                    document.getElementById('mobileNavDiv').style.display       = 'none';
                }
        }
    });

}]);
