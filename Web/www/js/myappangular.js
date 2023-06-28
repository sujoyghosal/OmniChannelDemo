var app = angular.module("myApp", [
  "ngRoute",
  "ui.bootstrap",
  "ui.directives",
  "ui.filters",
  "ui-notification",
]);
app.config([
  "$routeProvider",
  function ($routeProvider) {
    $routeProvider
      .when("/login", {
        templateUrl: "Login.html",
        //templateUrl: "Login.html",
        controller: "DashboardCtrl",
        isLogin: true,
      })
      .when("/home", {
        templateUrl: "CreatePayment.html",
        controller: "DashboardCtrl",
      })
      .when("/register_payee", {
        templateUrl: "CreatePayment.html",
        controller: "DashboardCtrl",
      })
      .when("/updateuser", {
        templateUrl: "UpdateProfile.html",
        controller: "DashboardCtrl",
      })
      .when("/updatepassword", {
        templateUrl: "UpdateProfile.html",
        controller: "DashboardCtrl",
      })
      .when("/signup", {
        templateUrl: "Register.html",
        controller: "DashboardCtrl",
      })
      .when("/notification", {
        //templateUrl: "/Notification.html",
        templateUrl: "Notification.html",
        controller: "DashboardCtrl",
      })
      .when("/settings", {
        templateUrl: "settings.html",
        controller: "DashboardCtrl",
      })
      .when("/subscribe", {
        templateUrl: "Subscribe2.html",
        controller: "DashboardCtrl",
      })
      .when("/sendnotification", {
        templateUrl: "SendPush.html",
        controller: "DashboardCtrl",
      })
      .when("/notifications", {
        templateUrl: "Notifications.html",
        controller: "DashboardCtrl",
      })
      .when("/resetpw", {
        templateUrl: "ResetPassword.html",
        controller: "DashboardCtrl",
      })
      .when("/index", {
        templateUrl: "index.html",
        controller: "DashboardCtrl",
      })
      .when("/contactus", {
        templateUrl: "ContactUs.html",
        controller: "DashboardCtrl",
      })
      .otherwise({
        redirectTo: "/login",
      });
  },
]);
app.service("DataService", function () {
  var stringConstructor = "test".constructor;
  var arrayConstructor = [].constructor;
  var objectConstructor = {}.constructor;
  var response = "";

  function whatIsIt(object) {
    if (object === null) {
      response = "null";
      return response;
    } else if (object === undefined) {
      response = "undefined";
      return response;
    } else if (object.constructor === stringConstructor) {
      response = "String";
      return response;
    } else if (object.constructor === arrayConstructor) {
      response = "Array";
      return response;
    } else if (object.constructor === objectConstructor) {
      response = "Object";
      return response;
    } else {
      response = "don't know";
      return response;
    }
  }

  function isValidArray(object) {
    whatIsIt(object);
    if (response === "Array") return true;
    else return false;
  }

  function isValidObject(object) {
    whatIsIt(object);
    if (response === "Object") return true;
    else return false;
  }

  function isNull(object) {
    whatIsIt(object);
    if (response === "null") return true;
    else return false;
  }

  function isString(object) {
    whatIsIt(object);
    if (response === "String") return true;
    else return false;
  }

  function isUnDefined(object) {
    whatIsIt(object);
    if (response === "don't know" || response === "undefined") return true;
    else return false;
  }
  return {
    whatIsIt: whatIsIt,
    isValidArray: isValidArray,
    isValidObject: isValidObject,
    isNull: isNull,
    isString: isString,
    isUnDefined: isUnDefined,
  };
});

app.service("UserService", function () {
  var loggedinUser = {};
  var isLoggedIn = false;
  var setLoggedIn = function (newObj) {
    loggedinUser = newObj;
    //       console.log("New User = " + JSON.stringify(loggedinUser));
  };

  var getLoggedIn = function () {
    return loggedinUser;
  };

  var setLoggedInStatus = function (state) {
    isLoggedIn = state;
  };
  var getLoggedInStatus = function () {
    return isLoggedIn;
  };
  return {
    setLoggedIn: setLoggedIn,
    getLoggedIn: getLoggedIn,
    setLoggedInStatus: setLoggedInStatus,
    getLoggedInStatus: getLoggedInStatus,
  };
});

var BASEURL_LOCAL = "http://localhost:8080";
var BASEURL_VM = "http://pcf-ocf-mig.d3m0s4ndb0x.com:8080";
var BASEURL_OS =
  "https://pcf-to-os-api-concession-kiosk.pcf-to-ocp-migration-c6c44da74def18a795b07cc32856e138-0000.us-south.containers.appdomain.cloud";

var BASEURL = BASEURL_LOCAL;
var BASEURL_SHELL = BASEURL_LOCAL;
var socket = null;
var GEOCODEURL =
  "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyAwQOPx91fjj06kDNq7hjkT-ZSxkQFtJPA";
//"http://api.positionstack.com/v1/forward?access_key=cff8960a5b6a7fde5eac5d20b3d16295";

app.controller(
  "DashboardCtrl",
  function (
    $scope,
    $rootScope,
    $http,
    $filter,
    $location,
    $route,
    $window,
    Notification,
    UserService,
    DataService
  ) {
    $scope.spinner = false;
    $scope.alldonations = false;
    $scope.allneeds = false;
    $rootScope.username = UserService.getLoggedIn().name;
    $scope.citydonations = "";
    $scope.cancel = false;
    $scope.uuid = UserService.getLoggedIn()._id;
    $scope.ID = "blue";
    $scope.settings = adjustsettings(UserService.getLoggedIn().settings);
    $scope.selectedto = undefined;
    $scope.selectedfrom = undefined;
    $scope.login_email = UserService.getLoggedIn().email;
    $scope.login_fullname = UserService.getLoggedIn().name;
    $scope.login_phone = UserService.getLoggedIn().phone;
    $scope.found = "";
    $scope.result = "";
    $rootScope.payee = {};
    $scope.groupusers = [];
    $rootScope.chatArray = [];
    $rootScope.myText = null;
    $scope.SpeakButtonLabe = "Click to Speak";
    $scope.reverseSort = false;
    $rootScope.showScanResults = false;
    $rootScope.loggedinUsers = [];
    $scope.synth = window.speechSynthesis;
    $rootScope.payee.name = "";
    $rootScope.payee.phone = "";
    $rootScope.payee.email = "";
    $rootScope.payee.ifsc = "";
    $rootScope.payee.account_number = "";
    $rootScope.payee.bank_name = "";

    $scope.rate = 1;
    $scope.pitch = "1";
    $scope.targetLang = "hi-IN";
    $rootScope.scanData = "";
    $rootScope.transactionsData = [];
    $rootScope.current_account_balance = 5603.73;
    $rootScope.savings_account_balance = 14569.25;
    $rootScope.credit_card_balance = 2306.23;

    //$rootScope.eventsCount = 0;
    $rootScope.mobileDevice = false;
    $scope.events = [];
    var today = new Date().toISOString().slice(0, 10);
    $rootScope.lastUUID = "";
    $scope.today = {
      value: today,
    };
    $scope.maxDate = {
      value: new Date(2015, 12, 31, 14, 57),
    };
    $scope.isMobileDevice = function () {};
    $rootSocket = null;
    $scope.isVisible = function () {
      /*return ("/login" !== $location.path() && "/signup" !== $location.path() &&
            "/resetpw" !== $location.path() && "/updatepassword" !== $location.path());*/
      return true;
    };

    $rootScope.$on("CallGetEventsMethod", function () {
      $scope.GetEventsForUser(true);
    });
    $rootScope.$on("CallSetupWebSocketsMethod", function () {
      $scope.setupWebSockets("init", null);
    });
    $rootScope.$on("CallCreateRoomsMethod", function () {
      createRooms();
    });
    $rootScope.$on("$routeChangeStart", function (event, next) {
      if (
        !UserService.getLoggedInStatus() &&
        "/signup" != $location.path() &&
        "/resetpw" != $location.path()
        /*&&
        ("/offerdonation" === $location.path() ||
          "/subscribe" === $location.path() ||
          "/notifications" === $location.path() ||
          "/updatepassword" === $location.path() ||
          "/createneed" === $location.path() ||
          "/createemergency" === $location.path() ||
          "/offershistory" === $location.path())*/
      ) {
        //console.log("User not logged in for access to " + $location.path());
        /* You can save the user's location to take him back to the same page after he has logged-in */
        //$rootScope.savedLocation = $location.path();
        $location.path("/login");
        return;
      }
      if (UserService.getLoggedInStatus() && "/login" == $location.path()) {
        $location.path("/home");
        return;
      }
    });
    $scope.events = [];
    $scope.ExecuteNewScan = function () {
      $scope.spinner = true;
      //var getURL = BASEURL_SHELL + "/runShellScript?command=../PCFToOS-Scripts/dependenciesNodeJS.sh";
      var getURL =
        BASEURL_SHELL +
        "/runShellScript?command=dependenciesNodeJS.sh&id=" +
        socket.id;
      getURL = encodeURI(getURL);
      $http({
        method: "GET",
        url: getURL,
      }).then(
        function successCallback(response) {
          $scope.spinner = false;
          //$rootScope.context_scan_id = response.data[0].scan_id;
          console.log("Triggered new scan in backend!!");
        },
        function errorCallback(error) {
          console.log("Error doing top level scan - " + error);
          $scope.spinner = false;
        }
      );
    };
    $scope.setupWebSockets = function (purpose, arg) {
      $scope.initDone = false;
      socket = io(BASEURL, {
        withCredentials: true,
        extraHeaders: {
          "my-custom-header": "abcd",
        },
      });
      socket.on("connect", () => {
        console.log("Connected to WebSocket server..socket id " + socket.id); // x8WIv7-mJelg7on_ALbx
        /*console.log(
          "Creating rooms for subscribed events: " +
            JSON.stringify($rootScope.subscribed_events)
        );*/
        createRoom($scope.login_email);
        /*socket.emit("send-transactions", {
          email: "sujoy.ghosal@gmail.com"
        });*/
        checkForActiveJourney();
      });
      socket.on("init-event", (data) => {
        $scope.initDone = true;
        console.log("Got account balances " + JSON.stringify(data));
      });
      socket.on("loggedin-users", (data) => {
        $rootScope.loggedinUsers = data.currentUsers;
        //$route.reload();
      });
      socket.on("new-login-with-active-journey", (data) => {
        //confirm("You have an active journey. Would you like to complete it?");
        Notification.success({
          message: "You have an active journey.",
          positionY: "top",
          positionX: "center",
        });
        $rootScope.currentJourney = data;
        console.log(
          "Got new login with active journey " +
            JSON.stringify(data.user[0].form_data)
        );
        $rootScope.payee.name = data.user[0].form_data.name;
        $rootScope.payee.phone = data.user[0].form_data.phone;
        $rootScope.payee.email = data.user[0].form_data.email;
        $rootScope.payee.ifsc = data.user[0].form_data.ifsc;
        $rootScope.payee.account_number = data.user[0].form_data.account_number;
        $rootScope.payee.bank_name = data.user[0].form_data.bank_name;
        //$rootScope.nameText = "Testing";
        console.log("Payee = " + JSON.stringify($scope.payee));
        $location.path("/home");
        $scope.$apply();
      });
      //var socket = io("http://localhost:5555");
      socket.on("recent-transactions", (data) => {
        $rootScope.transactionsData = data;
        console.log(JSON.stringify(data));
      });
      socket.on("new-transaction", (data) => {
        //$rootScope.showScanResults = true;
        $scope.spinner = false;
        Notification.success({
          message:
            "New Transaction at " +
            data.eventDetails.merchant_name +
            " for " +
            data.eventDetails.transaction_currency +
            " " +
            data.eventDetails.transaction_amount,
          positionY: "top",
          positionX: "center",
        });
        console.log("Event received from server : " + JSON.stringify(data));
        $rootScope.transactionsData.push(data.eventDetails);
        $rootScope.current_account_balance = Number(
          (
            $rootScope.current_account_balance -
            data.eventDetails.transaction_amount
          ).toFixed(2)
        );
      });

      socket.on("disconnect", () => {
        socket.removeAllListeners();
        console.log("Disconnected socket...."); // undefined
        console.log(
          "Detected server close event, reconnecting to server in 5 seconds"
        );
        setTimeout(function () {
          $scope.setupWebSockets("init", null);
        }, 5000);
      });
    };
    $scope.ShowMessage = function () {
      var data = $scope.events[0];
      var message =
        "A new event of your interest has just been created!! City - " +
        data.eventDetails.city +
        ", Event type - " +
        data.eventDetails.event_name +
        " , Event Posted By - " +
        data.eventDetails.postedby +
        ", Email - " +
        data.eventDetails.email +
        ", Phone - " +
        data.eventDetails.phone_number +
        ", Address - " +
        data.eventDetails.address +
        ", Item Type - " +
        data.eventDetails.itemtype +
        ", Item - " +
        data.eventDetails.items;
      Notification.info({
        message: message,
        title: "New Event",
        positionY: "top",
        positionX: "center",
        delay: 12000,
      });
      $scope.events = [];
    };
    function createRoom(email) {
      if (socket) {
        socket.emit("create-room", {
          channel: $scope.login_email, //email,
        });
      } else {
        console.log(
          "createRooms function saw null socket...calling setupWebsockets"
        );
        $scope.setupWebSockets("init", null);
      }
    }
    function checkForActiveJourney() {
      if (socket) {
        //alert("Checking for active journey");
        socket.emit("check-for-active-journey", {
          email: $scope.login_email, //email,
        });
      } else {
        console.log(
          "createRooms function saw null socket...calling setupWebsockets"
        );
        $scope.setupWebSockets("init", null);
      }
    }
    function storeFormData(context) {
      if (socket) {
        socket.emit("store-form-data", {
          channel: socket.id, //email,
          email: $scope.login_email,
          postedby: $scope.login_fullname,
          context: context,
        });
      } else {
        console.log(
          "createRooms function saw null socket...calling setupWebsockets"
        );
        $scope.setupWebSockets("init", null);
      }
    }

    $scope.CreateEvent = function (event, group_uuid, group_name) {
      $scope.loginResult = "";
      var now = new Date();
      var postURL = BASEURL + "/createevent";
      var reqObj = {
        email: $scope.login_email,
        postedby: $scope.login_fullname,
        time: now,
        phone_number: event.phone,
        address: event.address,
        city: event.city,
        items: event.items,
        itemtype: event.itemtype,
        latitude: $scope.lat,
        longitude: $scope.lng,
        fa_icon: $scope.GetFontAwesomeIconsForCategory(event.itemtype),
        group_uuid: group_uuid,
        group_name: group_name,
      };
      postURL = encodeURI(postURL);
      console.log("#######CreateEvent URL=" + postURL);
      $http.post(postURL, JSON.stringify(reqObj)).then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.loginResult = "Success";
          $scope.spinner = false;
          $scope.status = response.statusText;
          // Connect event uuid with group name
          //$scope.ConnectEntities(group, response.data._data.uuid);
        },
        function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.loginResult =
            "Error Received from Server.." + error.toString();
          Notification.error({
            message: "Error processing this request. Please try again later!",
            positionY: "bottom",
            positionX: "center",
          });
          $scope.spinner = false;
          $scope.status = error.statusText;
        }
      );
    };
    $scope.RegisterPayee = function (payee) {
      $scope.loginResult = "";
      var now = new Date();
      var postURL = BASEURL + "/createpayee";
      var reqObj = {
        email: $scope.login_email,
        postedby: $scope.login_fullname,
        time: now,
        payee: {
          name: payee.name,
          //create payee object
          phone_number: payee.phone,
          email: payee.email,
          ifsc: payee.ifsc,
          account_number: payee.account_number,
          account_type: payee.account_type,
          bank_name: payee.bank_name,
          branch_name: payee.branch_name,
        },
      };
      postURL = encodeURI(postURL);
      console.log("#######CreateEvent URL=" + postURL);
      $http.post(postURL, JSON.stringify(reqObj)).then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.loginResult = "Success";
          $scope.spinner = false;
          $scope.status = response.statusText;
          // Connect event uuid with group name
          //$scope.ConnectEntities(group, response.data._data.uuid);
        },
        function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.loginResult =
            "Error Received from Server.." + error.toString();
          Notification.error({
            message: "Error processing this request. Please try again later!",
            positionY: "bottom",
            positionX: "center",
          });
          $scope.spinner = false;
          $scope.status = error.statusText;
        }
      );
    };
    $scope.FetchEvents = function () {
      $scope.spinner = true;
      var getURL = BASEURL + "/fetchevents";
      getURL = encodeURI(getURL);
      $http({
        method: "GET",
        url: getURL,
      }).then(
        function successCallback(response) {
          $scope.spinner = false;
          console.log(
            "received response for scan: " + JSON.stringify(response)
          );
          $rootScope.scanData = response.data;
        },
        function errorCallback(error) {
          console.log("Error doing top level scan - " + error);
          $scope.spinner = false;
        }
      );
    };
    $scope.GetRecentTransactions = function () {
      $scope.spinner = true;
      var getURL = BASEURL + "/transactions?email=sujoy.ghosal@gmail.com";
      getURL = encodeURI(getURL);
      $http({
        method: "GET",
        url: getURL,
      }).then(
        function successCallback(response) {
          console.log("Last few transaactions: " + JSON.stringify(response));
          $scope.spinner = false;
          $rootScope.transactionsData = response.data;
        },
        function errorCallback(error) {
          console.log("Error doing top level scan - " + error);
          $scope.spinner = false;
        }
      );
    };
    $scope.GetRecentTransactions();
    $scope.GetScanExcel = function (context) {
      if (!context || context.length == 0) {
        context = "fullscan";
      }
      var getURL = BASEURL;
      if (context == "fullscan") {
        getURL +=
          "/topscan?scan_id=" + $rootScope.context_scan_id + "&type=excel";
      } else if (context == "veryhighinstances") {
        getURL +=
          "/getEventsForInstances?type=vh&scan_id=" +
          $rootScope.context_scan_id;
      } else if (context == "highinstances") {
        getURL +=
          "/getEventsForInstances?type=h&scan_id=" + $rootScope.context_scan_id;
      } else if (context == "mediumhighinstances") {
        getURL +=
          "/getEventsForInstances?type=mh&scan_id=" +
          $rootScope.context_scan_id;
      } else if (context == "normalinstances") {
        getURL +=
          "/getEventsForInstances?type=n&scan_id=" + $rootScope.context_scan_id;
      } else if (context == "veryhighmemory") {
        getURL +=
          "/getEventsForMemory?type=vh&scan_id=" + $rootScope.context_scan_id;
      } else if (context == "highmemory") {
        getURL +=
          "/getEventsForMemory?type=h&scan_id=" + $rootScope.context_scan_id;
      } else if (context == "mediumhighmemory") {
        getURL +=
          "/getEventsForMemory?type=mh&scan_id=" + $rootScope.context_scan_id;
      } else if (context == "normalmemory") {
        getURL +=
          "/getEventsForMemory?type=n&scan_id=" + $rootScope.context_scan_id;
      }

      $http({
        url: getURL,
        method: "GET",
        //data: json, //this is your json data string
        headers: {
          "Content-type": "application/json",
        },
        responseType: "arraybuffer",
      })
        .success(function (data, status, headers, config) {
          $scope.spinner = false;
          var blob = new Blob([data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          var objectUrl = URL.createObjectURL(blob);
          window.open(objectUrl);
        })
        .error(function (data, status, headers, config) {
          //upload failed
          console.log("Error downloading file.");
        });
    };
    $scope.getIconForFileType = function (type) {
      if (!type || type.length < 2) return;
      type = type.toLowerCase();
      if (type === "javascript" || type === "yml")
        return "https://img.icons8.com/color/48/null/javascript--v1.png";
      if (type === "java")
        return "https://img.icons8.com/nolan/64/java-coffee-cup-logo.png";
      if (type === "python")
        return "https://img.icons8.com/fluency/48/null/python.png";
      if (type === "ruby")
        return "https://img.icons8.com/fluency/48/null/ruby-programming-language.png";
      if (type === "pom.xml")
        return "https://img.icons8.com/nolan/64/java-coffee-cup-logo.png";
      if (type === "package.json")
        return "https://img.icons8.com/color/48/null/javascript--v1.png";
      if (type === "php")
        return "https://img.icons8.com/arcade/64/null/php.png";
      if (type === "go")
        return "https://img.icons8.com/ios-filled/50/null/go.png";
      return "https://img.icons8.com/nolan/64/java-coffee-cup-logo.png";
    };
    $scope.StoreFormData = function () {
      $scope.spinner = true;
      var journey_context = {
        email: $scope.login_email,
        username: $scope.login_fullname,
        journey_id: "RegisterPayee",
        journey_name: "RegisterPayee",
        journey_type: "Payment",
        journey_description: "Register a new payee",
        journey_status: "Started",
        jouney_last_modified: new Date(),
        screen_name: "RegisterPayee",
        screen_type: "Form",
        screen_description: "Register a new payee",
        screen_status: "Started",
        screen_last_modified: new Date(),
        form_name: "RegisterPayee",
        form_type: "Form",
        form_data: $scope.payee,
      };
      //alert(JSON.stringify(journey_context));
      var postURL = BASEURL + "/journeydata";
      $http
        .post(postURL, JSON.stringify(journey_context))
        .then(function successCallback(response) {
          $scope.spinner = false;
          $scope.loginResult = "Success";
          $scope.status = response.statusText;
        });
      console.log("Sending partial form data to server via WebSocket.. ");
      //storeFormData(journey_context);
    };
    $scope.Login2 = function (login) {
      $scope.spinner = true;
      var getURL =
        BASEURL +
        "/login?email=" +
        login.email.trim() +
        "&password=" +
        login.password.trim();

      getURL = encodeURI(getURL);
      $http({
        method: "GET",
        url: getURL,
      }).then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          //      $scope.loginResult = response.data;
          $scope.spinner = false;
          if (
            angular.isObject(response) &&
            response.data.toString() === "Authentication Error"
          ) {
            Notification.error({
              message: "Invalid Password!",
              title: "Error",
              positionY: "bottom",
              positionX: "center",
              delay: 4000,
            });
            return;
          } else {
            console.log("Login Success!");
            var obj = response.data;
            UserService.setLoggedIn(obj);
            UserService.setLoggedInStatus(true);
            $scope.loginResult = obj.name;
            $scope.name = obj.name;
            $scope.login_email = obj.email;
            $scope.login_fullname = obj.name;
            $scope.login_phone = obj.phone;
            $rootScope.username = obj.name;
            $rootScope.subscribed_events = obj.subscribed_events;
            $rootScope.event_receive_location = obj.event_receive_location;
            $rootScope.event_receive_max_distance =
              obj.event_receive_max_distance;
            $rootScope.loggedIn = true;
            $location.path("/home");
            //$rootScope.$emit("CallSetupWebSocketsMethod", {});
            //$rootScope.$emit("CallCreateRoomsMethod", {});
            //$location.path($rootScope.savedLocation);
            $scope.setupWebSockets("init", null);
            //$rootScope.$emit("CallGetEventsMethod", {});
            return;
          }
        },
        function errorCallback(error) {
          console.log("Login Failed: " + JSON.stringify(error));
          if (angular.isObject(error) && error.status === 400) {
            $scope.loginResult = "Id Not Found";

            if (
              confirm(
                "Email ID not found in App database. Would you like to create an account with this id?"
              ) == true
            ) {
              $location.path("/signup");
              return;
            }
          }
          $scope.spinner = false;
          $scope.loginResult = "Login Failed";
        }
      );
    };

    function adjustsettings(settingsObject) {
      if (!settingsObject) return true;

      var start = new Date(settingsObject.pushstarttime);
      var stop = new Date(settingsObject.pushstoptime);
      var timenow = new Date();
      start.setFullYear(
        timenow.getFullYear(),
        timenow.getMonth(),
        timenow.getDate()
      );
      stop.setFullYear(
        timenow.getFullYear(),
        timenow.getMonth(),
        timenow.getDate()
      );
      if (stop < start) stop.setDate(timenow.getDate() + 1);
      settingsObject.pushstarttime = start;
      settingsObject.pushstoptime = stop;
      return settingsObject;
    }

    $scope.SendSettings = function (settings) {
      $scope.result = "";
      $scope.spinner = true;
      var starttimehrs = new Date(settings.fromtime).getHours();
      var starttimemin = new Date(settings.fromtime).getMinutes();
      var stoptimehrs = new Date(settings.totime).getHours();
      var stoptimemin = new Date(settings.totime).getMinutes();

      $scope.spinner = true;
      var getURL =
        BASEURL +
        "/updateusersettings?uuid=" +
        $scope.uuid +
        "&starttimehrs=" +
        starttimehrs +
        "&starttimemin=" +
        starttimemin +
        "&stoptimehrs=" +
        stoptimehrs +
        "&stoptimemin=" +
        stoptimemin +
        "&pushon=" +
        settings.pushon;
      getURL = encodeURI(getURL);
      $http({
        method: "GET",
        url: getURL,
      }).then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.spinner = false;
          $scope.result = "SUCCESS SAVING YOUR SETTINGS ";
          // $scope.found  = "Active donation offers for " + param_name;
        },
        function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.spinner = false;
          $scope.result = "ERROR ADDING SUBSCRIPTION TO PUSH MESSAGES ";
          $scope.alldonations = false;
        }
      );
    };

    $scope.Logout = function () {
      $scope.login_email = "";
      UserService.setLoggedIn({});
      UserService.setLoggedInStatus(false);
      $rootScope.loggedIn = false;
      $rootScope.eventsCount = 0;
      $location.path("/home");
      console.log(
        "Logout: Set logged in status = " + UserService.getLoggedInStatus()
      );
      return;
    };
    $scope.spinner = false;
    //$scope.login_fullname = UserService.getLoggedIn().fullname;
    //$scope.login_email = UserService.getLoggedIn().email;
    //    $scope.login_phone = UserService.getLoggedIn().phone;
    //    $scope.login_address = UserService.getLoggedIn().address;
    $scope.CreateUser = function (user) {
      $scope.spinner = true;
      var getURL = BASEURL + "/users/insert";
      var reqObj = {
        email: user.email.trim(),
        name: user.name.trim(),
        password: user.password.trim(),
        phone: user.phone,
        organisation: user.org,
        ngo: user.ngo,
      };
      getURL = encodeURI(getURL);
      console.log("ContactUs URL=" + getURL);
      $http.post(getURL, JSON.stringify(reqObj)).then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.spinner = false;
          console.log("CreateUser Success: " + JSON.stringify(response));
          if (
            angular.isObject(response) &&
            response.status.toString() === "201"
          ) {
            Notification.success({
              message: "Account Created with id " + user.email,
              positionY: "bottom",
              positionX: "center",
            });
            $location.path("/login");
            return;
          } else {
            $scope.result = "Error creating id. Email already in use.";
            Notification.error({
              message: "Could not create user id, might be existing!",
              positionY: "bottom",
              positionX: "center",
            });
            //        $location.path("/login");
            return;
          }
        },
        function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.spinner = false;
          $scope.loginResult = "Could not submit request.." + error;
          Notification.error({
            message: "Error processing this request. Please try again later!",
            positionY: "bottom",
            positionX: "center",
          });
        }
      );
    };
    $scope.UpdateUser = function (user) {
      if ($scope.login_email && (!user || (!user.phone && !user.address))) {
        Notification.error({
          message: "Please enter values to update",
          positionY: "bottom",
          positionX: "center",
        });
        $scope.spinner = false;
        return;
      } else if (
        !$scope.login_email &&
        (!user || !user.email || !user.password)
      ) {
        Notification.error({
          message: "Please Enter Email and Password",
          positionY: "bottom",
          positionX: "center",
        });
        return;
      }
      $scope.spinner = true;
      var email = "";
      if ($scope.login_email) email = $scope.login_email;
      else email = user.email;
      var getURL = BASEURL + "/updateuser?name=" + email;
      /*if (user && user.phone)
            getURL += "&phone=" + user.phone.trim();
        else
            getURL += "&phone=" + UserService.getLoggedIn().phone;
        if (user && user.address)
            getURL += "&address=" + user.address.trim();
        else
            getURL += "&address=" + UserService.getLoggedIn().address;*/
      if (user && user.password) getURL += "&password=" + user.password.trim();
      getURL = encodeURI(getURL);
      console.log("Update URL=" + getURL);
      $http({
        method: "GET",
        url: getURL,
      }).then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.spinner = false;
          if (angular.isObject(response)) {
            console.log("UpdateUSer response: " + JSON.stringify(response));

            if (!$scope.login_email) {
              Notification.success({
                message: "Password Update Successful!",
                positionY: "top",
                positionX: "center",
                delay: 4000,
              });
              $scope.result = "Password Update Sucessful.";
              $location.path("/login");
              return;
            } else {
              Notification.success({
                message: "Successfully updated your info!",
                positionY: "top",
                positionX: "center",
                delay: 4000,
              });
              $scope.result = "Account Update Sucessful.";
              if (
                DataService.isValidObject(response) &&
                DataService.isValidObject(response.data) &&
                DataService.isValidObject(response.data._data)
              ) {
                UserService.setLoggedIn(response.data._data);
              }
              return;
            }
          } else {
            $scope.result = "Could not update profile";
            Notification.error({
              message: "Could not update profile!",
              positionY: "top",
              positionX: "center",
              delay: 4000,
            });
            //        $location.path("/login");
            return;
          }
        },
        function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.spinner = false;
          $scope.loginResult = "Could not submit request.." + error;
        }
      );
    };
    $scope.SendResetPasswordRequest = function (email) {
      if (!email || email.length < 4) {
        Notification.info({
          message: "Please enter valid email!",
          positionY: "top",
          positionX: "center",
          delay: 4000,
        });
        return;
      }
      var getURL = BASEURL + "/sendresetpwmail?email=" + email.trim();
      getURL = encodeURI(getURL);
      console.log("Create URL=" + getURL);
      $http({
        method: "GET",
        url: getURL,
      }).then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.spinner = false;
          console.log(
            "SendResetPasswordRequest response: " + JSON.stringify(response)
          );
          if (
            DataService.isValidObject(response) &&
            response.data &&
            response.data == "Email Not Found"
          ) {
            Notification.error({
              message:
                "Error processing this request. Please check the email address!",
              positionY: "bottom",
              positionX: "center",
            });
          } else {
            Notification.success({
              message: "An email has been sent with the password reset link.",
              positionY: "bottom",
              positionX: "center",
            });
          }
        },
        function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.spinner = false;
          $scope.loginResult = "Could not submit request.." + error;
          Notification.error({
            message: "Error processing this request. Please try again later!",
            positionY: "bottom",
            positionX: "center",
          });
        }
      );
    };
    $scope.Back = function () {
      $window.history.back();
    };
  }
);
