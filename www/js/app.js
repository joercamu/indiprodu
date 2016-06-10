// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngResource','starter.controllers','starter.factories','angularMoment'])

.run(function($ionicPlatform, $location, $http, amMoment, apiServer, popupCustom) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    // confirmar que el token que existe sea valido y vigente
    if (localStorage.getItem("token")) {
      $http.get(apiServer+"session",{ params:{token:localStorage.getItem("token")} })
      .success(function(){
        console.log("* Token es valido.Confirmado desde API...");
      })
      .error(function(error){
        // eliminar token
        localStorage.removeItem("token");
        popupCustom.alert("* Token es invalido...", function(){
          // redireccion a login
          $location.path("login");
        });
      })
    }else{
      // redireccion a login
      $location.path("login");
    }
    /* 
      colocar el token en todas las peticiones por $http, este metodo tambien se ejecuta cuando 
      se hace login doLogin();
      $http.defaults.headers.common.Authorization
    */
    $http.defaults.headers.common.Authorization = 'Token token='+localStorage.getItem('token');
    // timeZone moment ES
    amMoment.changeLocale('es');
    
    // Initialize Firebase
      // var config = {
      //   apiKey: "AIzaSyCz8EBZoGYKAGOxElKAEHMrAX_6s4Kp0xU",
      //   authDomain: "chat-suprapak.firebaseapp.com",
      //   databaseURL: "https://chat-suprapak.firebaseio.com",
      //   storageBucket: "",
      // };
      // firebase.initializeApp(config);
  });
})
.config(function($stateProvider, $urlRouterProvider) {
  // function callback
  var functionBeforeAction = function($location,$http){
    console.log("* Ejecutando callback...");
    if (!localStorage.getItem("token")) {
      console.log("* No existe token... redirect to /login...");
      $location.path("login");
    }else{
      // insertar el token en todas la peticiones $http
      console.log("* Colocando token en peticiones http...");
      $http.defaults.headers.common.Authorization = 'Token token='+localStorage.getItem('token');
    }
  };
  $stateProvider
    .state('login',{
      url:'/login',
      templateUrl:'templates/login_home.html',
      controller: 'LoginCtrl'
    })
    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
  .state('app.config',{
    url:'/config',
    views:{
      'menuContent':{
      templateUrl:'templates/config.html',
      controller:'ConfigCtrl'
      }
    }
  })
  .state('app.home',{
    url:'/home',
    views:{
      'menuContent':{
        templateUrl:'templates/home.html',
        controller: 'ChatCtrl'
      }
    }
  })
  .state('app.subprocesses',{
    url: '/subprocesses',
    views:{
      'menuContent':{
        templateUrl:'templates/subprocesses.html',
        controller: 'SubprocessesCtrl',
        resolve:{
          "check": functionBeforeAction
        }
      }
    }
  })
  .state('app.subprocess',{
    url:'/subprocesses/:id',
    views:{
      'menuContent':{
        templateUrl:'templates/subprocess.html',
        controller:'SubprocessCtrl',
        resolve:{
          "check": functionBeforeAction
        }
      }
    }
  })
  .state('app.subprocessChild',{
    url:'/subprocesses/:subprocess_id/subprocess_children/:id',
    views:{
      'menuContent':{
        templateUrl:'templates/subprocess_child.html',
        controller:'SubprocessChildCtrl',
        resolve:{
          "check": functionBeforeAction
        }
      }
    }
  })
  .state('app.subprocessChildRecords',{
    url:'/subprocesses/:subprocess_id/subprocess_children/:id/records',
    views:{
      'menuContent':{
        templateUrl:'templates/subprocess_child_records.html',
        controller:'SubprocessChildRecordsCtrl',
        resolve:{
          "check": functionBeforeAction
        }
      }
    }
  })
  .state('app.subprocessChildWastes',{
    url:'/subprocesses/:subprocess_id/subprocess_children/:id/wastes',
    views:{
      'menuContent':{
        templateUrl:'templates/subprocess_child_wastes.html',
        controller:'SubprocessChildWastesCtrl',
        resolve:{
          "check": functionBeforeAction
        }
      }
    }
  })
  .state('app.mySubprocessChildren',{
    url:'/my_subprocess_children',
    views:{
      menuContent:{
        templateUrl:'templates/my_subprocess_children.html',
        controller:'SubprocessChildrenCtrl',
        resolve:{
          "check": functionBeforeAction
        }
      }
    }
  })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
