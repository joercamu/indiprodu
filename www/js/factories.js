angular.module('starter.factories',[])
.factory('apiServer',function(){
	return 'http://192.168.1.247:3333/api/production_indicators/v1/'
})
.factory('serverIP',function(){
	return 'http://192.168.1.247:3333/'
})
.factory('popupCustom',function($ionicPopup,$location){
	return {
		title:"IndiProdu",
		alert:function(message,callback){
			var alert = $ionicPopup.alert({
				title: this.title,
				template:message
			});
			if (typeof callback == "function"){
				alert.then(function(){
					callback();
				});
			}
			
		},
		confirm:function(message,callback){
			var confirm = $ionicPopup.confirm({
				title:this.title,
				template:message
			});
			confirm.then(function(res){
				if(res){
					callback();
				}
			});

		}
	}
})
.factory('loadingCustom',function($ionicLoading){
	return {
		show:function(template){
			$ionicLoading.show({
				template:template
			})
		},
		hide:function(){
			$ionicLoading.hide();
		}
	}
})
.factory('subprocessChildren',function(apiServer,$resource){
	return $resource(apiServer+'subprocesses/:subprocess_id/subprocess_children/:id',{subprocess_id: '@subprocess_id',id: '@id'},{
		query: { method: 'GET', isArray: false },
		update: { method: 'PUT' }
	});
})
.factory('blockTimes',function(apiServer,$resource){
	return $resource(apiServer+'/subprocesses/:subprocess_id/subprocess_children/:subprocess_child_id/block_times/:id',{
		subprocess_id: '@subprocess_id',subprocess_child_id: '@subprocess_child_id', id: '@id'
	},{
		query: { method: 'GET', isArray: false },
		update: { method: 'PUT' }
	})
})