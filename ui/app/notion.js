

// App.Pool = DS.Model.extend({
//   name: DS.attr('string'),
//   description: DS.attr('string'),
//   applicationEntityTitle: DS.attr('string'),
//   devices: DS.hasMany('device')
// });

// App.PoolSerializer = DS.RESTSerializer.extend({
//   serializeIntoHash: function(hash, type, record, options) {
//     console.log ( "serializeIntoHash")
//     var j = this.serialize(record, options);
//     console.log ( j )
//     $.each ( j, function (key, value) {
//       console.log ( "\t" + key + ": " + value)
//       hash[key] = value
//     })
//   }


// })

// Configuration for require.js
// foundation, xtk and dat.gui are loaded by default
require.config({
  // deps: ['./vex.dialog', "./vex"],
  baseURL: 'js',
  // Some packages do not provide require info, so we 'shim' them here
  shim: {
    'angular': { exports: 'angular'},
    'angular-route': ['angular'],
    'angular-ui-router' : ['angular'],
    'ui-ace' : ['angular'],
    // The angularAMD and ngload let us load a page and add angular apps later
    'angularAMD':['angular'],
    'ngload':['angularAMD'],
    'ui-bootstrap-tpls':['angular']
  }
})

// For Grater to work, the model, angular and angularAMD packages are required
require(['angular', 'angularAMD', "backbone", 'angular-ui-router', 'ui-bootstrap-tpls', 'ui-ace', 'ace/ace'], function(angular, angularAMD, Backbone ) {

  // Helper for shortening strings
  String.prototype.trunc = String.prototype.trunc ||
  function(n){
    return this.length>n ? this.substr(0,n-1)+'...' : this;
  };

  String.prototype.startsWith = String.prototype.startsWith ||
  function (str){
    return this.indexOf(str) == 0;
  };

  PoolModel = Backbone.Model.extend({
    idAttribute: "poolKey",
    // urlRoot: '/rest/pool',
  defaults: {
    'name' : null,
    'anonymize' : false,
    'applicationEntityTitle' : null,
    'description' : "This is a new Pool"
  }
});

PoolCollection = Backbone.Collection.extend({
  model: PoolModel,
  url: '/rest/pool',
  parse: function(response) {
    var m = [];
    for(var i = 0; i < response.pool.length; i++) {
      m.push(new PoolModel(response.pool[i]))
    }
    this.set ( m )
    return this.models;
  }
});

DeviceModel = Backbone.Model.extend({
  idAttribute: 'deviceKey',
  format: function() {
    return this.get('applicationEntityTitle') + "@" + this.get('hostName') + ":" + this.get('port')
  }
});
DeviceCollection = Backbone.Collection.extend({
  model: DeviceModel,
  url: function () { return this.urlRoot; },
  parse: function(response) {
    var m = [];
    for(var i = 0; i < response.device.length; i++) {
      m.push(new DeviceModel(response.device[i]))
    }
    this.set ( m )
    return this.models;
  }
});

CTPModel = Backbone.Model.extend();
QueryModel = Backbone.Model.extend({
  idAttribute: 'queryKey',
  url: function () {
    // return '/rest/pool/' + this.get('poolKey') + '/query/' + this.get('queryKey')
    return this.urlRoot;
  },
  parse: function(response) {
    // Sort the items
    response.items.sort ( function(a,b){
      return a.queryItemKey - b.queryItemKey
    });
    for ( var i = 0; i < response.items.length; i++ ) {
      response.items[i].items.sort ( function(a,b){
        return a.queryResultKey - b.queryResultKey;
      })
    }
    return response;
  }
});

ScriptModel = Backbone.Model.extend({
  idAttribute: 'scriptKey'
});
ScriptCollection = Backbone.Collection.extend({
  model: ScriptModel,
  url: function () { return this.urlRoot; },
  parse: function(response) {
    var m = [];
    for(var i = 0; i < response.script.length; i++) {
      m.push(new ScriptModel(response.script[i]))
    }
    this.set ( m )
    return this.models;
  }

});



notionApp = angular.module('notionApp', ['ui.router', 'ui.bootstrap', 'ui.ace']);

notionApp.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.when('', '/pools/index')
  $urlRouterProvider.otherwise('/pools/index')
  $stateProvider
  .state('pools', {
    abstract: true,
    url: "/pools",
    templateUrl: 'partials/pools.html',
    controller: 'PoolsController'
  })
  .state('pools.index', {
    url: "/index",
    templateUrl: 'partials/pools.index.html',
    controller: 'PoolsController'
  })
  .state('pools.pool', {
    url: "/:poolKey",
    templateUrl: 'partials/pool.detail.html',
    controller: 'PoolController'
  })
  .state('pools.studies', {
    url: "/:poolKey/studies",
    templateUrl: 'partials/pool.studies.html',
    controller: 'StudyController'
  })
  .state('pools.query', {
    url: "/:poolKey/query",
    templateUrl: 'partials/pool.query.html',
    controller: 'QueryController'
  })
});

// ['$routeProvider',
// function($routeProvider){
//   $routeProvider.
//   when('/', {
//     templateUrl: 'partials/pools.html',
//     controller: 'PoolsController'
//   });
// }]);

notionApp.controller ( 'PoolsController', function($scope,$timeout,$state,$modal) {
  $scope.poolCollection = new PoolCollection();
  // Make the first one syncrhonous
  $scope.poolCollection.fetch({remove:true, async:false})

  p = $scope.poolCollection;
  $scope.newPoolKey = false;

  $scope.refresh = function() {
    $scope.$apply (  $scope.poolCollection.fetch({remove:true, async:false}) );
  };


  $scope.newPool = function() {
    $modal.open ({
      templateUrl: 'partials/pool.edit.html',
      scope: $scope,
      controller: function($scope,$modalInstance) {
        $scope.pool = new PoolModel();
        $scope.model = $scope.pool.toJSON()
        $scope.title = "Create a new pool"
        $scope.hideAETitle = false
        $scope.save = function() {
          $scope.pool.set ( $scope.model )
          $scope.poolCollection.add( $scope.pool)
          $scope.pool.save ( $scope.model )
          $modalInstance.close()
          $scope.poolCollection.fetch({remove:true, async:false})
        };
        $scope.cancel = function() { $modalInstance.dismiss() };
      }
    });
  };

  (function tick() {
    $scope.poolCollection.fetch({remove: true});
    if ( $scope.newPoolKey ) {
      $state.transitionTo ( 'pools.pool', { poolKey: $scope.newPoolKey} )
      $scope.newPoolKey = false
    }
    $timeout(tick, 2000)
  })();
});

notionApp.controller ( 'PoolController', function($scope,$timeout,$stateParams, $state, $modal) {
  $scope.pool = $scope.$parent.poolCollection.get($stateParams.poolKey)
  console.log ( "PoolController for ", $stateParams.poolKey )
  console.log ( "Pool is: ", $scope.pool)
  $scope.model = $scope.pool.toJSON();

  // Grab the devices
  $scope.deviceCollection = new DeviceCollection();
  $scope.deviceCollection.urlRoot = '/rest/pool/' + $stateParams.poolKey + '/device';
  $scope.deviceCollection.fetch({async:false})
  console.log( $scope.deviceCollection )
  pool = $scope.pool
  devices = $scope.deviceCollection

  $scope.edit = function() {
    $modal.open ( {
      templateUrl: 'partials/pool.edit.html',
      scope: $scope,
      controller: function($scope, $modalInstance) {
        $scope.title = "Edit " + $scope.pool.get('name')
        $scope.hideAETitle = true
        $scope.save = function() {
          $scope.pool.save ( $scope.model )
          $modalInstance.close()
        };
        $scope.cancel = function() { $modalInstance.dismiss() };
      }
    });
  };

  // Devices
  $scope.editDevice = function(device) {
    console.log("EditDevice")
    var newDevice = !device
    if ( !device ) {
      console.log("Create new device")
      device = new DeviceModel()
    }
    $scope.device = device
    $scope.deviceModel = device.toJSON()
    $modal.open ( {
      templateUrl: 'partials/device.edit.html',
      scope: $scope,
      controller: function($scope, $modalInstance) {
        if ( newDevice ) {
          $scope.title = "Create a new device"
        } else {
          $scope.title = "Edit the device"
        }
        $scope.save = function(){
          device.set ( $scope.deviceModel )
          $scope.deviceCollection.add(device)
          device.save();
          $modalInstance.close();
        };
        $scope.cancel = function() { $modalInstance.dismiss() };
      }
    });
  };


  $scope.deleteDevice = function(device) {
    $scope.device = device
    $scope.deviceModel = device.toJSON()
    $modal.open ({
      templateUrl: 'partials/modal.html',
      controller: function($scope, $modalInstance) {
        $scope.title = "Delete device?"
        $scope.message = "Delete the device: " + device.format()
        $scope.ok = function(){
          device.destroy({
            success: function(model, response) {
              console.log("Dismissing modal")
              $modalInstance.dismiss();
              $scope.$apply();
            },
            error: function(model, response) {
              alert ( "Failed to delete Device: " + response.message )
            }
          })
        };
        $scope.cancel = function() { $modalInstance.dismiss() };
      }
    });
  };


  // CTP Configuration
  $scope.ctp = new CTPModel();
  $scope.ctp.urlRoot = '/rest/pool/' + $scope.pool.get('poolKey') + '/ctp';
  $scope.ctp.fetch({async:false})
  $scope.ctpScript = $scope.ctp.get("script")
  $scope.saveCTP = function() {
    $scope.ctp.set('script', $scope.ctpScript);
    $scope.ctp.sync("update", $scope.ctp)
  }

  // Scripts
  $scope.scriptCollection = new ScriptCollection();
  $scope.scriptCollection.urlRoot = '/rest/pool/' + $scope.pool.get('poolKey') + '/script';
  $scope.scriptCollection.fetch({async:false})

  $scope.deleteScript = function(script) {
    $scope.script = script
    $scope.scriptModel = script.toJSON()
    $modal.open ({
      templateUrl: 'partials/modal.html',
      controller: function($scope, $modalInstance) {
        $scope.title = "Delete script?"
        $scope.message = "Delete the script for " + script.get('tag')
        $scope.ok = function(){
          script.destroy({
            success: function(model, response) {
              console.log("Dismissing modal")
              $modalInstance.dismiss();
              $scope.$apply();
            },
            error: function(model, response) {
              alert ( "Failed to delete script: " + response.message )
            }
          })
        };
        $scope.cancel = function() { $modalInstance.dismiss() };
      }
    });
  }


  $scope.editScript = function(script) {
    var newScript = !script
    if ( newScript ) {
      script = new ScriptModel();
    }
    $modal.open ({
      templateUrl: 'partials/script.edit.html',
      scope: $scope,
      controller: function($scope, $modalInstance) {
        $scope.script = script
        $scope.scriptModel = script.toJSON()
        $scope.tryResult = ""
        if ( newScript ) {
          $scope.title = "Create a new script"
        } else {
          $scope.title = "Edit the script for " + script.get('tag')
          $scope.hideTag = true
        }
        $scope.save = function(){
          script.set ( $scope.scriptModel )
          $scope.scriptCollection.add(script)
          console.log ( "Saving script ", script)
          script.save();
          $modalInstance.close();
        };
        $scope.cancel = function() { $modalInstance.dismiss() };
        $scope.aceLoaded = function(editor) {
          console.log ( "Ace loaded" )
          editor.commands.addCommand({
            name: 'save',
            bindKey: {win: 'Ctrl-S', mac: 'Command-S'},
            exec: $scope.save
          });

          // Try
          editor.commands.addCommand({
            name: 'exec',
            bindKey: {win: 'Ctrl-Return', mac: 'Command-Return'},
            exec: $scope.try
          });
        };

        $scope.try = function() {
          // Cal the rest API and give it a go
          console.log ( "Trying script on the server")
          var url = "/rest/pool/" + $scope.pool.get('poolKey') + '/script/try'
          $.ajax ({
            contentType: 'application/json',
            type: 'PUT',
            url: url,
            data: JSON.stringify($scope.scriptModel),
            success: function ( data ) {
              console.log("Tried script, got back ", data)
              $scope.$apply ( function() {
                $scope.tryResult = data.result
              })
            }
          });
        }
      }
    })
  }

});

notionApp.controller ( 'StudyController', function($scope,$http,$timeout,$stateParams, $state, $modal) {
  $scope.pool = $scope.$parent.poolCollection.get($stateParams.poolKey)
  $scope.numberOfItems = 100;
  $scope.pageSize = 50;

  $scope.reload = function(){
    console.log("Page is " + $scope.currentPage)
    var start = 0;
    if ( $scope.currentPage ) {
      start = $scope.pageSize * $scope.currentPage;
    }
    $http.post('/rest/pool/' + $scope.pool.get('poolKey') + '/studies',
    {
      jtStartIndex: start,
      jtPageSize: $scope.pageSize
    }
    )
    .success(function(data,status,headers) {
      console.log("got ", data)
      $scope.studies = data
      $scope.numberOfItems = data.TotalRecordCount
    });
  };

    $scope.$watch('currentPage', $scope.reload);


    $scope.deleteStudy = function(study) {
      $scope.study = study
      $modal.open ({
        templateUrl: 'partials/modal.html',
        scope: $scope,
        controller: function($scope, $modalInstance) {
          $scope.title = "Delete study?"
          $scope.message = "Delete study " + study.StudyDescription + " for " + study.PatientName + " / " + study.PatientID + " / " + study.AccessionNumber
          $scope.ok = function(){
            $http.delete("/rest/pool/" + $scope.pool.get("poolKey") + "/studies/" + study.StudyKey)
            .success(function() {
              $scope.reload()
              $modalInstance.dismiss()
            })
          };
          $scope.cancel = function() { $modalInstance.dismiss() };
        }
      });
    };



});


notionApp.controller ( 'QueryController', function($scope,$timeout,$stateParams, $state, $modal) {
  $scope.pool = $scope.$parent.poolCollection.get($stateParams.poolKey)
  console.log ( "QueryController for ", $stateParams.poolKey )
  console.log ( "Pool is: ", $scope.pool)
  $scope.model = $scope.pool.toJSON();
  $scope.pools = $scope.$parent.poolCollection.toJSON()

  $scope.deviceCollection = new DeviceCollection();
  $scope.deviceCollection.urlRoot = '/rest/pool/' + $scope.pool.get('poolKey') + '/device';
  console.log( $scope.deviceCollection )
  $scope.deviceCollection.fetch({async:false})
  $scope.devices = $scope.deviceCollection.toJSON()

  // $.ajax({
  //   url: '/rest/pool/' + $scope.pool.get('poolKey') + '/query/1',
  //   type: 'GET',
  //   data: {},
  //   success: function(data) {
  //     $scope.$apply ( function(){
  //       $scope.query = new QueryModel(data);
  //       $scope.query.urlRoot = '/rest/pool/' + $scope.pool.get('poolKey') + '/query/1';
  //     })
  //   }
  // })

  query = $scope.query

  $scope.refresh = function(){
    console.log ( $scope.query )
    $scope.query.fetch({'async':false});
  };

  $scope.fetchAll = function(item){
    $.each(item.items, function(index,value){
      item.items[index].doFetch = true
    })
    $scope.query.save();
  };

  $scope.toggleFetch = function(item) {
    item.doFetch = !item.doFetch
    $scope.query.save();
  }

  $scope.submit = function() {
    console.log ( $('#queryFile')[0].files[0])
    var formData = new FormData();
    console.log ( formData )
    formData.append('file', $('#queryFile')[0].files[0] )
    formData.append('destinationPoolKey', $scope.receivingPool)
    formData.append('deviceKey', $scope.queryDevice)
    console.log ( formData )
    $.ajax({
      url: '/rest/pool/' + $scope.pool.get('poolKey') + '/query',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data) {
        $scope.$apply ( function(){
          $scope.query = new QueryModel(data);
          $scope.query.urlRoot = '/rest/pool/' + $scope.pool.get('poolKey') + '/query/' + $scope.query.get('queryKey');
        })
      },
      error: function(xhr, status, error) {
        alert ( "Query failed: " + xhr.responseText )
      }
    });
  };

  var queryTick = function(){
    if ( $scope.query ) {
      console.log("queryTick")
      $scope.query.fetch({'async':false}).done(function() {
        console.log ("queryTick completed")
        if ($scope.query.get('status').startsWith("Fetch Pending")) {
          $timeout(queryTick, 2000)
        }
      });
      // console.log("query done")
      // });
    }
  };


  $scope.fetch = function(){
    $.ajax({
      url: $scope.query.urlRoot + "/fetch",
      type: 'PUT',
      data: {},
      success: function(data){
        queryTick();
        console.log("started ticker")
        $scope.refresh();
      }
    });
  };

});

// Here is where the fun happens. angularAMD contains support for initializing an angular
// app after the page load.
angularAMD.bootstrap(notionApp);


console.log ("Build notion app")
})
