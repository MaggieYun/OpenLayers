/**
 * OpenLayers.Control.PathTrack 类
 * @author 许照云
 * 2013.5
 */

OpenLayers.Control.PathTrack = OpenLayers.Class(OpenLayers.Control,{
		
	button1:$('<li>').html('开始').attr('id',1),
	button2:$('<li>').html('暂停').attr('id',2),
	button3:$('<li>').html('继续').attr('id',3),
	button4:$('<li>').html('结束').attr('id',4),
	
	/**
     * APIProperty: ifSuspend 控制暂停和继续
     * {boolean} 默认值为false
     */
	ifSuspend:false,
	
	/**
     * APIProperty: ifHasTimer 判断是否存在定时器
     * {boolean} 默认值为false
     */
	ifHasTimer:false,
	
	/**
     * APIProperty: ifStop 是否结束轨迹运行
     * {boolean} 默认值为false
     */
	ifStop:false,
	/**
     * APIProperty: timeInterval 时间间隔
     * {integer}单位：毫秒 
     */
	timeInterval:2000,
	
	ul:null,
	
	/**
     * APIProperty: distance 轨迹已运行的距离
     * 主要用于保存已运行距离，便于暂停后再开始使用
     * {integer}单位：米  初始值为0
     */
	distance:0,
	/**
     * APIProperty: layer 图层
     * {Object} OpenLayers.Layer 
     */
	layer:null,
	/**
     * APIProperty: sourceData 原始数据
     * {array<object>}对象组成的数组 对象包含x,y属性，要求是地理坐标（小坐标） 
     */
	sourceData:[],
	
	/**
     * APIProperty: speed 速度
     * {number} 单位：米/秒
     */
	speed:10,
	
	/**
     * APIProperty: speedTimes
     * {integer} 模拟速度是实际速度的倍数
     */
	speedTimes:10,
	
	/**
     * APIProperty: trackStyle
     * {Object} 轨迹线样式
     */
	trackStyle: OpenLayers.Util.extend(
			OpenLayers.Util.extend({},
					OpenLayers.Feature.Vector.style['default']), 
			{
				fillOpacity: 1,  
				strokeColor: "red",
				strokeWidth: 4
			}),
			
	/**
	 * APIProperty: carStyle
	 * {Object} 轨迹头部样式（例如车辆）
	 */		
	carStyle:OpenLayers.Util.extend(
			OpenLayers.Util.extend({},
					OpenLayers.Feature.Vector.style['default']), 
			{
				fillOpacity: 1,  
				strokeColor: "green",
				strokeWidth: 2,
				fillColor:"green"
			}),
	
			
	/**
	 * APIProperty: track 当前已运行的轨迹
	 * {Object} OpenLayers.Feature.Vector 线要素
	 * 
	 */			
	track:null,
	
	/**
	 * APIProperty: car 当前车辆所在点位要素
	 * {Object} OpenLayers.Feature.Vector 点要素
	 */	
	car:null,
	
	/**
	 * APIProperty: linearFunc 
	 * {Object} OpenLayers.LinearFunc  
	 */
	linearFunc:null,
	
	/**
	 * APIProperty: diss 
	 * {array} 每个节点与起点距离的集合 
	 */
	diss:null,
	
	/**
	 * APIProperty: leftDiss 
	 * {array} 剩余未通过节点到起点距离的集合,为了轨迹在关键节点处停顿
	 */
	leftDiss:null,
	
	/**
     * APIProperty: afterForward
     * {Function} 轨迹每向前运动一次，调用一次该方法
     * 用户通过复写方法，实现每一次轨迹向前后需要执行的逻辑
     */
	afterForward: function() {},
	end:function(){},
	
	/**
     * APIProperty: events
     * {<OpenLayers.Events>} Events instance for listeners and triggering
     *     control specific events.
     */
	events: null,
	
	/**
	 * Constructor: OpenLayers.Control.PathTrack
	 * 
	 * Parameters:
	 * layer - {<OpenLayers.Layer.Vector>} 
	 */
	initialize: function(layer,options) {
	    OpenLayers.Control.prototype.initialize.apply(this, [options]);
	    this.layer = layer;
	    this.linearFunc = new OpenLayers.LinearFunc(this.sourceData);
	    this.diss = this.linearFunc.get_diss();//每个节点到起点的距离的集合
	    this.leftDiss = this.diss.slice(0);//剩余未通过节点到起点距离的集合
	    this.events = new OpenLayers.Events(this);
	    
	    this.every_s = this.speed * this.speedTimes * this.timeInterval/1000;  //s = v*t*倍率
	},
	
	
	
	/**
     * Method: activate
     * Activates the control.
     * Parameters:
     * 1到3之间的某个整数
     * Returns:
     * {Boolean} The control was effectively activated.
     */
    activate: function (type) {
        switch (type) {
	        case 1:
	        	this.start();
	        	break;
	        case 2:
	            this.suspend();
	            break;
	        case 3:
	            this.go_on();
	            break;
	        case 4:
	            this.stop();
	            break;
	        default:
//	        	this.start();
	            break;
	    }

        return OpenLayers.Control.prototype.activate.apply(
            this, arguments
        );
    },
    
    /**
     * Method: deactivate
     * Deactivates the control.
     * 
     * Returns:
     * {Boolean} The control was effectively deactivated.
     */
    deactivate: function () {   
    	
    	this.ifSuspend = true;
    	if(this.track){  //先前绘制的要素删除
			this.layer.removeFeatures([this.track]);
		}
		if(this.car){  //先前绘制的要素删除
			this.layer.removeFeatures([this.car]);
		}
		this.track = null;
		this.car = null;
		this.distance = 0;
		
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },
    
    
    
    deal:function(trackEndP,timer,vertexNum){
//    	console.log(this.distance);
    	var geographic = new OpenLayers.Projection("EPSG:4326");
    	var mercator =  new OpenLayers.Projection("EPSG:102113");
    	var originalEndP = this.sourceData[this.sourceData.length-1];//原始数据终点

		if(this.track){  //先前绘制的要素删除
			this.layer.removeFeatures([this.track]);
		}
		if(this.car){  //先前绘制的要素删除
			this.layer.removeFeatures([this.car]);
		}
		
		//newpts大部分情况下由已经过的原始子节点加一个计算出来的节点组成
		var newpts = this.linearFunc.get_sub_path(this.distance,0);//根据距离去算已运动轨迹点位
		trackEndP = newpts[newpts.length-1]; //用于判断是否到达终点
		
		var trackEndP_geo = new OpenLayers.Geometry.Point(trackEndP.x,trackEndP.y);
		if(MAP_SR == '102113'){
			trackEndP_geo.transform(geographic,mercator);
		}
		this.car = new OpenLayers.Feature.Vector(trackEndP_geo,{},this.carStyle);
		
		//以下对点位坐标和数据类型进行转换
		var llpts = [];
		for(var i=0;i<newpts.length;i++){
			var temp = new OpenLayers.Geometry.Point(newpts[i].x,newpts[i].y);
			llpts.push(temp);   //模拟轨迹点位
		}
		var line_geo = new OpenLayers.Geometry.LineString(llpts);
		if(MAP_SR == '102113'){
			line_geo.transform(geographic,mercator);
		}
		
		this.track = new OpenLayers.Feature.Vector(line_geo,{},this.trackStyle);
		
		this.layer.addFeatures([this.track]);
		this.layer.addFeatures([this.car]);

		//增加事件   输出坐标系为地图使用的坐标系 不一定与输入坐标系一致 
		//注意：不能使用 this.car.geometry.transform(mercator,geographic);
		//因为会导致在缩放地图时，轨迹暂时性消失（原因可能是要素显示但未保存）
		//如要转换坐标系       1、使用自己写的方法 2、clone要素后再transform
		
		//增加坐标转换，确保输出为地理坐标
		var car_clone = this.car.clone();
        var track_clone = this.track.clone();

		if(MAP_SR == '102113'){
			car_clone.geometry.transform(mercator,geographic);
			track_clone.geometry.transform(mercator,geographic);
		}
        
        this.afterForward(car_clone,track_clone,vertexNum);
        this.events.triggerEvent("afterForward",{
                        currentPosition : car_clone,currentPath:track_clone,vertexNum:vertexNum});
		
		if(trackEndP == originalEndP ){
			this.end();
			this.events.triggerEvent("end",{ifEnd:true});

			if(this.ifStop){
				clearInterval(timer);  //播放一遍
    			this.ifHasTimer = false;
    			this.leftDiss = this.diss.slice(0);		  			
			}else{
				trackEndP = null;  //循环播放
    			this.distance = 0;
    			this.leftDiss = this.diss.slice(0);
			} 			
		}
		
		return trackEndP;
		
    },
    
    
    /**
     * Method: assist,用于辅助绘制轨迹点位 定时循环运行
     */
    assist:function(){
    	if(this.sourceData.length == 0){
			this.ifHasTimer = false;
			this.leftDiss = this.diss.slice(0);
			return
    	}
    	
    	var originalEndP = this.sourceData[this.sourceData.length-1];//原始数据终点
    	var trackEndP = null;  //轨迹已运行的最后一个点   	
    	var self = this;
    	var drawTrack = function(self,timer){   //匿名函数包装，解决setInterval不能传递函数的问题
    		self.ifHasTimer = true;
    		
    		if(trackEndP != originalEndP){
    			
    			if(self.ifSuspend){ //暂停
        			clearInterval(timer);
        			self.ifHasTimer = false;
        			return;
        		}
    			
    			if(self.ifStop){//停止
    				trackEndP = self.deal(trackEndP,timer,self.diss.length);
    			}else{
    				if((self.leftDiss.length>1)&&(self.every_s > (self.leftDiss[0]-self.distance))){//确保不超过终点 				
        				
    					var leftDiss_distance_diffs = [];  //计算出剩余点距离当前位置的距离差
    					for(var i=0;i<self.leftDiss.length;i++){
    						var lefdDiss_distance = self.leftDiss[i]-self.distance;
    						leftDiss_distance_diffs.push(lefdDiss_distance);
    					}
    					var smalltimes = [];  //将一个时间interval内会经过的点，距离当前点距离的集合存入该变量
    					for(var i=0;i<leftDiss_distance_diffs.length;i++){
    						var temp = leftDiss_distance_diffs[i]; 
    						if(temp<self.every_s){
    							var smalltime = temp/(self.speed * self.speedTimes)*1000;
    							smalltimes.push(smalltime);
    						}   						
    					}
    					
						var timeout1 = setTimeout(function(){
							var predis = self.distance;
							
							self.distance = self.leftDiss[0];
	    					trackEndP = self.deal(trackEndP,timer,self.diss.length-self.leftDiss.length+1);	
	    					self.leftDiss.shift();	
	    					
	    					self.distance = predis + self.every_s;//是否需要加上步长every_s？

	    					
	    					if(smalltimes.length>1){
    	    					for(var i=1;i<smalltimes.length;i++){
    	    						var timeout2 = setTimeout(function(){
    	    							var predis = self.distance;
    	    							self.distance = self.leftDiss[0];
    	    	    					trackEndP = self.deal(trackEndP,timer,self.diss.length-self.leftDiss.length+1);	
    	    	    					self.leftDiss.shift();
    	    	    					//考虑终点的问题
    	    	    					
    	    	    					self.distance = predis + self.every_s;
    	    	    					
    	    						},smalltimes[i]-smalltimes[i-1]);
    	    					}	
	    					}
						},smalltimes[0])	
	    			}else{
	    				if(self.distance + self.every_s > self.diss[self.diss.length-1]){//确保不超过终点
	    					self.distance = self.diss[self.diss.length-1]
	    				}else{
	    					self.distance = self.distance + self.every_s;
	    				}
	    				
	    			}
    				if(self.distance == self.diss[self.diss.length-1]){
    					trackEndP = self.deal(trackEndP,timer,self.diss.length+1);
    				}else if(self.distance != 0 ){
    					trackEndP = self.deal(trackEndP,timer,0);
    				}
    					
    				
    			}
    				
    			
    			
    		}
	
    	};

    	var timer = setInterval(function(){	
    		drawTrack(self,timer);	
    	},this.timeInterval);
    },
    
    /**
     * Method: start,开始轨迹回放，从起始点开始运动 
     */
    start:function(){
    	this.ifStop = false;
    	this.ifSuspend = false;
    	
    	if(this.track){  //先前绘制的要素删除
			this.layer.removeFeatures([this.track]);
		}
		if(this.car){  //先前绘制的要素删除
			this.layer.removeFeatures([this.car]);
		}
		
		this.track = null;
		this.car = null;
		this.distance = 0;
		this.leftDiss = this.diss.slice(0);
		
    	if(!this.ifHasTimer ){
    		this.assist();
    	}
    	
    },
    
    /**
     * Method: suspend,暂停轨迹回放，已绘制路径依然保持
     */
    suspend:function(){
    	this.ifStop = false;
    	this.ifSuspend = true;
    },
    /**
     * Method: go_on,继续轨迹回放，一般用于暂停后继续
     */
    go_on:function(){
    	this.ifStop = false;
    	this.ifSuspend = false;
    	if(!this.ifHasTimer ){
    		this.assist();
    	}
    },
    /**
     * Method: stop,停止轨迹回放，已绘制的轨迹清除
     */
    stop:function(){
    	this.ifSuspend = false;
    	this.distance = this.diss[this.diss.length-1];
    	this.ifStop = true;
    	if(!this.ifHasTimer ){
    		this.assist();
    	}    	
    },
    
    
    /**
     * Method: draw
     *
     * Parameters:
     * px - {<OpenLayers.Pixel>} The top-left pixel position of the control
     *      or null.
     *
     * Returns:
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */
    draw: function (px) {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv(this.id);
            this.div.className = this.displayClass;
            if (!this.allowSelection) {
                this.div.className += " olControlNoSelect";
                this.div.setAttribute("unselectable", "on", 0);
                this.div.onselectstart = OpenLayers.Function.False; 
            }
            
            var $ctl = $(this.div), self = this;
            var ul = $('<ul>');
            this.ul = ul;
            ul.append(this.button1)
              .append(this.button2)
              .append(this.button3)
              .append(this.button4);
            
            $ctl.append(ul);   

            ul.hide();
            
            ul.delegate('li','click',function(){
    			var action = $(this).addClass("activate").attr('id');
    	        $(this).siblings("li").removeClass("activate");  	   
    			self.activate(parseInt($(this).attr('id')));	
    		})
            
    		
            if (this.title != "") {
                this.div.title = this.title;
            }
        }
        if (px != null) {
            this.position = px.clone();
        }
        this.moveTo(this.position);
        return this.div;
    },
    
    /**
     * Method: setSourceData，设置轨迹点位原始数据
     *
     * Parameters:
     * sourceData - {Array <object>} 对象组成的数组 对象包含x,y属性， 
     */
    setSourceData:function(sourceData){
    	this.sourceData = sourceData;
    	this.linearFunc = new OpenLayers.LinearFunc(this.sourceData);
	    this.diss = this.linearFunc.get_diss();//每个节点到起点的距离的集合
	    this.leftDiss = this.diss.slice(0);//剩余未通过节点到起点距离的集合
    },
    
    /**
     * Method: setTimeInterval，设置轨迹运动的时间间隔
     *
     * Parameters:
     * timeInterval - {integer}单位：毫秒  
     */
    setTimeInterval:function(timeInterval){
    	this.timeInterval = timeInterval;
    	this.every_s = this.speed * this.speedTimes * this.timeInterval/1000;  //s = v*t*倍率
    },
    
    /**
     * Method: setSpeedTimes，设置模拟运行速度是实际速度的多少倍
     *
     * Parameters:
     * speedTimes - {integer} 模拟速度是实际速度的倍数
     */
    setSpeedTimes:function(speedTimes){
    	this.speedTimes = speedTimes;
    	this.every_s = this.speed * this.speedTimes * this.timeInterval/1000;  //s = v*t*倍率
    },
    
    /**
     * Method: setSpeed，设置轨迹实际运行的速度
     *
     * Parameters:
     * speed - {number} 单位：米/秒
     */
    setSpeed:function(speed){
    	this.speed = speed;
    	this.every_s = this.speed * this.speedTimes * this.timeInterval/1000;  //s = v*t*倍率
    },
    
    /**
     * Method: setTrackStyle，设置轨迹样式
     *
     * Parameters:
     * trackStyle - {object} 样式对象
     */
    setTrackStyle:function(trackStyle){
    	this.trackStyle = trackStyle;
    },
    
    /**
     * Method: setCarStyle，设置轨迹头部样式
     *
     * Parameters:
     * carStyle - {object} 样式对象
     */
	setCarStyle:function(carStyle){
	    this.carStyle = carStyle;
	},
    
    
    
    
    CLASS_NAME: "OpenLayers.Control.PathTrack" 
	
});
	