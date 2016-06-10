angular.module('starter.controllers', [])
.controller('AppCtrl',function($scope, $location, $http, apiServer, popupCustom, $location){
  $scope.logOut = function(){
    localStorage.removeItem('token');
    $location.path('/login');
  };
  //metodo para colocar el token en todas peticiones $http
  $scope.setToken = function(){
    $http.defaults.headers.common.Authorization = 'Token token='+localStorage.getItem('token');
    console.log('token set!');
  }
  // consultar si hay un subprocess_child abierta
  $scope.loadSubprocessChildCurrent = function(){
    $http.get(apiServer+'subprocess_children/current')
    .success(function(res){
      var subprocess = res.data.relationships.subprocess.id
      var subprocess_child = res.data.id
      $location.path("app/subprocesses/"+subprocess+"/subprocess_children/"+subprocess_child);
    })
    .error(function(error){
      popupCustom.alert("No hay pedidos en curso.");
    })
  };
})
/*
  controlador para el inicio de session

*/
.controller('LoginCtrl', function($scope, $ionicModal, $timeout, $http, $location, $ionicLoading, apiServer,popupCustom) {

  // Form data for the login modal
  $scope.loginData = {
  //this remove after development
    operator:{
      user: 1234,
      password: 1234
    }
  };
  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
      $http.post(apiServer+'session',$scope.loginData).then(
        function(data){
          // se borran los errores para un proximo login
          $scope.errors = [];
          // mostrar pagina cargando...
          $ionicLoading.show({template:'cargando...'});
          // almacenar el token token
          var token = data.data.token;
          // insertar token en localStorage
          localStorage.setItem('token', token);
          // colocar el token en todas las peticiones por $http
          $http.defaults.headers.common.Authorization = 'Token token='+localStorage.getItem('token');
          // auth firebase
          // firebase.auth().signInAnonymously().catch(function(error) {
          //   // Handle Errors here.
          //   var errorCode = error.code;
          //   var errorMessage = error.message;
          //   // ...
          // });
          // cerrar modal de login
          $scope.closeLogin();
          // redirect subprocesses
          $location.path('app/subprocesses');
          // ocultar loading...
          $ionicLoading.hide();
        },function(error){
          if (error.status == 0) {
            $scope.errors = ["No hay conexion con el servidor"]
            popupCustom.alert($scope.errors);
          }else{
            popupCustom.alert(error.statusText+', status: '+error.status);
            $scope.errors = error.data.errors;  
          }
        }
        );
  };
})
/*
  controlador para configurar:
    machine_id
    procedure_id
  "se guardan en el localStorage"
*/
.controller('ConfigCtrl',function($scope,$location,popupCustom){
  $scope.errors = [];
  $scope.config = {
    machine_id: parseInt(localStorage.getItem('machine_id') ),
    procedure_id: parseInt(localStorage.getItem('procedure_id') )
  };
  $scope.saveConfig = function (){
    console.log($scope.config);
    if (!$scope.config.machine_id || !$scope.config.procedure_id){
      $scope.errors = ["por favor completar todos los campos"];
    } else {
      localStorage.setItem('machine_id', $scope.config.machine_id);
      localStorage.setItem('procedure_id', $scope.config.procedure_id);
      popupCustom.alert('Configuracion guardada correctamente',function(){
        $location.path('app/subprocesses');
      });
    }
  }

})
/*
  Controlador para la lista de subprocesos de una maquina, se debe enviar el machine_id en la URL
*/
.controller('SubprocessesCtrl',function($scope,$http,apiServer,popupCustom,$location,$ionicScrollDelegate, loadingCustom){
  // contenedor de subprocesos
  $scope.subprocesses = [];
  // opciones de busqueda de pedido
  $scope.search = {
    active:false, // indica si la busqueda fue ejecutada
    show:false, // indica si se muestra la barra
    input:'', // texto a buscar
    run: function(){ //ejecuta la consulta
      // buscar subprocesos
      var server = apiServer + '/machines/'+localStorage.getItem('machine_id')+'/subprocesses_by_order/'+this.input
      $http.get(server)
      .success(function(res){
        $scope.subprocesses = res.data;
        $scope.search.active = true;
      })
      .error(function(res){
        popupCustom.alert(res.errors.join());
      })
    },
    clear: function(){
      console.log(this.active + 'limpiando subprocesos');
      if(this.active){
        $scope.getSubprocesses(null,true);
        this.active = false;
        this.input = '';
        this.show = false;
      }
    }
  };

  $scope.validateIfExistsSubprocess = function(subprocess){
    //  valida que un item no exista en la lista de subprocesos
    var response = false;
    angular.forEach($scope.subprocesses,function(item){
      if(item.id == subprocess.id){
        response = true;
      }
    });
    return response;
  };//fin validateIfExistsSubprocess
  
  $scope.getSubprocesses = function(params,clear,callback){
    /*
    metodo que obtiene del API los subprocesos de una maquina
    recibe 2 parametros 
                        param = parametros para la URL (limit, after)
                        clear = si es verdadero se limpia el array de subprocesos
  */ 
    if (!localStorage.machine_id){
      popupCustom.confirm("No hay una configuracion valida.\n¿desea ir a configuracion?",function(){
        $location.path("app/config");
      });
      return;
    }
    loadingCustom.show('Cargando pedidos...');
    // construir la URL de consulta
    var server = apiServer+'/machines/'+localStorage.getItem('machine_id')+'/subprocesses';
    // limpiar el $scope
    if(clear){
      $scope.subprocesses = [];
    }
    // request
    $http.get(server,{params:params}).then(
      function(data){
        // console.log(data.data.data);
        // añadir informacion
        angular.forEach(data.data.data,function(item){
          if (!$scope.validateIfExistsSubprocess(item)){
            $scope.subprocesses.push(item);  
          }
        });  
        return data.data.data
        // $scope.$broadcast('scroll.infiniteScrollComplete');
        // $scope.subprocesses = data.data.data;
    },function(error){
      // si hay errores de conexion
      if (error.status == 0) {
        popupCustom.alert("Hay problemas con el servidor",function(){
          $location.path('app/home');
        });  
      }else{
        console.log(error);
        popupCustom.alert("Upps. error: "+error.status);
      }
    })
    .finally(function(){
      // ocultar "cargando..."
      loadingCustom.hide();
      if (typeof callback == "function"){
        callback();
      }
    })
  };// fin getSubprocess()
  $scope.getMoreSubprocesses = function(){
    // si hay elementos cargados
    if ($scope.subprocesses.length > 0){
      var last = $scope.subprocesses[$scope.subprocesses.length - 1].id;
      console.log('consultando viejos subprocesos');
      $scope.getSubprocesses({after:last});
    };
    $ionicScrollDelegate.scrollBy(0,-100,true);
    $scope.$broadcast('scroll.infiniteScrollComplete');
    
  };//fin getMoreSubprocesses()
  $scope.getNewSubprocesses = function(){
    console.log('consultando nuevos subprocesos');
    $scope.getSubprocesses(null,true,function(){
      $scope.$broadcast('scroll.refreshComplete');
    });
  };//fin getNewSubprocesses
  $scope.showHeaderSearch = function(){
    // subir scrioll al limite superior
    $ionicScrollDelegate.scrollTop();
    // chambia con un sw el esta de vision de la barra buscar
    $scope.search.show = !$scope.search.show;

  };//fin showHeaderSubprocess
  
})
/*
  Controlador para ver 1 subproceso detallado
*/
.controller('SubprocessCtrl',function($scope, $http, $location, apiServer, $stateParams, popupCustom, loadingCustom, subprocessChildren){
  
  $scope.subprocess = null;
  $scope.getSubprocess = function(){
    loadingCustom.show('Cargando...');
    var server = apiServer+'subprocesses/'+$stateParams.id;
    $http.get(server)
    .success(function(res){
      $scope.$broadcast('scroll.refreshComplete');
      $scope.subprocess = res.data;
      loadingCustom.hide();
    })
    .error(function(error){
      loadingCustom.hide();
      popupCustom.alert(error);
    })
  };
  $scope.startNewSubprocessChild = function(subprocess){
    console.log('starting new subprocess child');
    // Alerta de confirmacion
    popupCustom.confirm("Esta seguro que desea empezar el pedido K"+subprocess.relationships.order.attributes.order_number+"?",function(){
      // validar que el pedido no sea nulo
      if ($scope.subprocess != null){
        console.log('subprocess child started'); 
         // crear el subproceso hijo
        subprocessChildren.save({subprocess_id:$stateParams.id},function(res){
          // redireccionar al detalle de la vista
          $location.path('/app/subprocesses/'+subprocess.id+'/subprocess_children/'+res.data.id);
        });
      }else{
        popupCustom.alert('No encontramos el pedido.',function(){
          $location.path('app/subprocesses');
        });
        
      }
    });
  };
  $scope.translateState = function(state){
    switch (state){
      case "started":
        return "Empezado";
        break;
      case "finalized":
        return "Finalizado";
        break;
    }
  };
})
/*
  Controlador para ver el pedido en curso de 1 opeario, interfaz para registrar datos por parte del operador.
*/ 
.controller('SubprocessChildCtrl',function($stateParams, $scope, $http, $ionicModal, $location, subprocessChildren, blockTimes, apiServer, serverIP, popupCustom){
  // subproceso hijo actual
  $scope.subprocessChild = {};
  // cateogorias de paradas
  $scope.block_categories = [];
  // bloque de tiempo actual
  $scope.block_time = {};
  // indicador para saber si hay una parada en curso
  $scope.running = false;
  $scope.running_production = false;
  

  // Modal para ver las paradas 
  $ionicModal.fromTemplateUrl('templates/modals/block_times.html',{
    scope: $scope,
    animation:'slide-in-up'
  }).then(function(modal){
    $scope.modalBlockTimes = modal;
  });
  // obtener informacion de la orden hija
  $scope.getSubprocessChild = function(){
    $scope.subprocessChild = subprocessChildren.get({subprocess_id:$stateParams.subprocess_id,id:$stateParams.id},function(res){
      console.log(res);
      // valida que el subproceso hijo no este terminado
      if(res.data.attributes.state == "finalized"){
        // muestra un mensaje y lo redirije al pedido
        popupCustom.alert("Este pedido ya fue finalizado",function(){
          $location.path('app/subprocesses/'+res.data.relationships.subprocess.id);
        });
      }else{
        // obtener la parada actual
        $scope.getBlockTime();  
        // iniciar el counter de subproceso hijo
        $scope.initDateCountTimeSubprocessChild(res.data.attributes.started_at);
      }
    });
  };
  // terminar un subproceso
  $scope.finishSubprocessChild = function(){
    popupCustom.confirm("¿Quiere terminar el pedido?",function(){
      if ($scope.running == false){
        $scope.subprocessChild = subprocessChildren.update({
          subprocess_id:$stateParams.subprocess_id,
          id:$stateParams.id,
          finalize:true // se especifica que termine el pedido
        },function(res){
          $location.path('app/subprocesses/'+res.data.relationships.subprocess.id);
        });
      }else{
        popupCustom.alert("Termine la parada o la marcha en curso.");
      }
      
    });
  };
  // complemento TimerCicle
  $scope.timeCircle = {
    element: $("#DateCountdown"),
    create: function(date){
      this.element.attr('data-date',date);
      this.element.TimeCircles({
        "animation": "smooth",
        "bg_width": 0.5,
        "fg_width": 0.04,
        "circle_bg_color": "#EEEEEE",
        "time": {
            "Days": {
                "text": "Days",
                "color": "#CCCCCC",
                "show": false
            },
            "Hours": {
                "text": "Horas",
                "color": "#CCCCCC",
                "show": true
            },
            "Minutes": {
                "text": "Minutos",
                "color": "#CCCCCC",
                "show": true
            },
            "Seconds": {
                "text": "Segundos",
                "color": "#CCCCCC",
                "show": true
            }
        }
      });
    },
    destroy: function(){

      this.element.TimeCircles().destroy();
      this.element.remove();
      $('#containerInfoDate').append(this.element);
    },
    rebuild: function(){
      this.element.TimeCircles().rebuild();
    }
  };
  // obtiene los bloques de perdida
  $scope.getBlockTypes = function(){
    $http.get(apiServer+'procedures/'+localStorage.getItem('procedure_id')+'/block_categories/')
    .success(function(res){
      console.log(res.data);
      $scope.blocks = res.data;
      $scope.block_categories = res.data;
    })
    .error(function(error){
      popupCustom.alert("No se ha podido encontrar los tipos de paradas",function(){
        $location.path('app/config');
      });
    });
  };
  /*
    crea un bloque de tiempo
    recibe el id de parada y una funcion que se ejecuta si no hay errores
  */ 
  $scope.createBlockTime = function(block_type_id,callback){
    $scope.block_time = blockTimes.save({
      subprocess_id: $scope.subprocessChild.data.relationships.subprocess.id,
      subprocess_child_id: $scope.subprocessChild.data.id,
      block_time:{
        block_type_id:block_type_id
      }
    },function(res){
      console.log("Block time created successfully");
      $scope.timeCircle.create(res.data.attributes.started_at);
      $scope.timeCircle.rebuild();
      // ejecuta la funcion enviada
      callback();
    },function(error){
      // muestra los errores enviados por la API
      popupCustom.alert(error.data.errors.join("\n"));
    });
  };
  $scope.finalizeCurrentBlockTIme = function(){
    console.log('Terminando parada actual...');
      blockTimes.update({
        subprocess_id: $scope.subprocessChild.data.relationships.subprocess.id,
        subprocess_child_id: $scope.subprocessChild.data.id,
        id: $scope.block_time.data.id,
        finalize:true
      },function(res){
        $scope.block_time = {};
        $scope.timeCircle.destroy();
        $scope.running = false;
        $scope.running_production = false;
      });
  };
  // acccion para el boton parar en pantalla
  $scope.onClickStop = function(){
    if ($scope.running){
      // finalizar el bloque actual...
      $scope.finalizeCurrentBlockTIme();
    }else{
      console.log('Inciando una nueva parada...');
      // crear la parada
      $scope.createBlockTime(1,function(){
        // mostrar el modal
        $scope.modalBlockTimes.show();
        // cambia el estado de la aplicacion
        $scope.running = true;    
      });
      
    }
  };
  // accion para el boton de arrancar 
  $scope.onClickStart = function(){
    if ($scope.running){
      $scope.finalizeCurrentBlockTIme();
    }
    $scope.createBlockTime(2,function(){
      $scope.running = true;
      $scope.running_production = true;  
    });
    
  };
  // modifica el tipo de parada actual
  // se ejecuta cuando se selecciona una parada desde el modal
  $scope.setBlock = function(block){
    switch(block.type){
      case "block_categories":
        // show blocks hijos
        $scope.blocks = block.relationships.block_types
        break;
      case "block_types":
        // actualizar la parada actual con el ID del tipo de parada
          $scope.block_time = blockTimes.update({
            subprocess_id: $scope.subprocessChild.data.relationships.subprocess.id,
            subprocess_child_id: $scope.subprocessChild.data.id,
            id: $scope.block_time.data.id,
            block_time:{
              block_type_id:block.id
            }
        });
        // ocultar el modal
        $scope.modalBlockTimes.hide();
        break;
      default:
        console.log("press block unknow otherwise");
    }
  };
  // boton retroceder en la navegacion de bloques de tiempo
  $scope.backBlocks = function(){
    $scope.blocks = $scope.block_categories;
  };
  $scope.getBlockTime = function(){
    $http.get(apiServer+'subprocesses/'+$scope.subprocessChild.data.relationships.subprocess.id+'/subprocess_children/'+$scope.subprocessChild.data.id+'/block_times_last')
      .success(function(res){
        // si se encontraron datos
        if(res){
          // inserta la informacion de la parada en curso en el $scope
          $scope.block_time = res;
          // crea el reloj en pantalla con la hora de incio de la parada
          $scope.timeCircle.create(res.data.attributes.started_at);
          // cambia el estado de la aplicaciona a "corriendo"
          $scope.running = true;
          // si la parada es tipo "marcha" entonces cambia el estado de produccion
          if (res.data.attributes.block_type_id == 2){
            $scope.running_production = true;
          }
        }
      });  
  };
  $scope.viewData = function(){
    console.log($scope.block_time);
  };
  $scope.initDateCountTimeSubprocessChild = function(date){
    $('#DateCountTimeSubprocessChild')
    .attr('data-date',date)
    .TimeCircles({
        "animation": "smooth",
        "bg_width": 0.1,
        "fg_width": 0.0033333333333333335,
        "circle_bg_color": "#fff",
        "time": {
            "Days": {
                "text": "Dias",
                "color": "#fff",
                "show": false
            },
            "Hours": {
                "text": "Horas",
                "color": "#fff",
                "show": true
            },
            "Minutes": {
                "text": "Minutos",
                "color": "#fff",
                "show": true
            },
            "Seconds": {
                "text": "Segundos",
                "color": "#fff",
                "show": true
            }
        }
    });
  };
  $scope.refreshDate = function(){
    // destruye el timer
    $scope.timeCircle.destroy();
    // obtiene informacion del subproceso hijo
    $scope.getSubprocessChild();
    
  };
  $scope.goToRecords = function(){
    // ir a la vista que contiene los registros
    $location.path("app/subprocesses/"+$stateParams.subprocess_id+"/subprocess_children/"+$stateParams.id+"/records");
  };
  $scope.goToWastes = function(){
    // ir a la vista que contiene los registros
    $location.path("app/subprocesses/"+$stateParams.subprocess_id+"/subprocess_children/"+$stateParams.id+"/wastes");
  };
})
/*
  Controlador que administra los registros o formulario que control de proceso
*/ 
.controller('SubprocessChildRecordsCtrl',function($scope, $http, apiServer, $stateParams,popupCustom,loadingCustom, $ionicSlideBoxDelegate){
  $scope.records = [];
  $scope.options = {
    loop: false,
    effect: 'fade',
    speed: 500,
  }
  $scope.getRecordTypes = function(){
    $http.get(apiServer+"subprocesses/"+ $stateParams.subprocess_id +"/subprocess_children/"+ $stateParams.id +"/records")
    .success(function(res){
      angular.forEach(res.data,function(value,key){
        switch(value.relationships.record_type.attributes.field_type){
          case "number":
            value.attributes.value = parseInt(value.attributes.value);
            break;
          case "time":
            // "1970-01-01T18:59:00.000Z"
            value.attributes.value = Date.parse(value.attributes.value);
            break;
          default:
            console.log("default")
        }

       $scope.records.push(value); 
      })
      // $scope.records = res.data;
    })
    .error(function(error){
      popupCustom.alert(error);
    })
  };
  $scope.saveRecord = function(record){
    // si el campo es obligatorio y el valor es nulo, no lo deja seguir
    if(record.attributes.value == null && record.attributes.mandatory){
      popupCustom.alert("Este campo es obligatorio");
      return;
    }
    loadingCustom.show("Guardando...");
    $http.put(apiServer+"subprocesses/"+ $stateParams.subprocess_id +"/subprocess_children/"+ $stateParams.id +"/records/"+record.id,
     {"record": record.attributes} )
    .success(function(res){
      record.attributes = res;
      loadingCustom.hide();  
    })
    .error(function(error){
      popupCustom.alert(error,function(){
        loadingCustom.hide();  
      });
      
    })
    
  };
  $scope.nextSlide = function() {
    $ionicSlideBoxDelegate.next();
  }
  
})
.controller('SubprocessChildWastesCtrl',function($scope,$http,apiServer,$stateParams,popupCustom){
  // lista de desperdicios del subprocess child
  $scope.wastes = [];
  $scope.waste = {};
  $scope.procedures = [];//lista de procesos de la empresa, se van a utilizar para relacionar los desperdicios

  $scope.getWastes = function(){
    $http.get(apiServer+"subprocesses/"+ $stateParams.subprocess_id +"/subprocess_children/"+ $stateParams.id +"/wastes")
    .success(function(res){
      $scope.wastes = res.data;
    });
    $http.get(apiServer+"procedures")
    .success(function(res){
      $scope.procedures = res.data;
      console.log(res);
    });
  };
  $scope.createWaste = function(waste,form){
    // si el formulario es valido
    if (form.$valid) {
      $http.post(apiServer+"subprocesses/"+$stateParams.subprocess_id+"/subprocess_children/"+$stateParams.id+"/wastes",
        { waste:$scope.waste })
      .success(function(res){
        $scope.waste = {};
        $scope.wastes = res.data;
        popupCustom.alert("Desperdicio creado correctamente.");
        // reset formulario
        form.$setPristine();
        form.$setUntouched();
      })
      .error(function(error){
        console.log(error);
        popupCustom.alert(error.errors.join("<br>"));
      });  
    }
    
  };
})
/*
  Controlador para acciones sobre las ordenes hijas de los operadores
*/ 
.controller('SubprocessChildrenCtrl',function($http,apiServer, $scope){
  
  $scope.subprocess_children = [];
  // obtiene los ultimos subprocesos realizados por el operador logueado
  $scope.getMySubprocessChildren = function (){
    // peticion al servidor de los subprocesos hijos del operador actual.
    $http.get(apiServer+'subprocess_children/my')
    .success(function(res){
      $scope.subprocess_children = res.data;
    })
    .finally(function(){
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
})
.controller('ChatCtrl',function($scope){
  // firebase.database().ref('messages').on('value',function(snapshot){
  //   $scope.messages = snapshot.val();
  // });
  $scope.sendMessage = function (message){
    firebase.database().ref('/messages').push(message);  
  };
  
  
})
