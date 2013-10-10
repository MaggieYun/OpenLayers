/**
 * OpenLayers.Control.ExSelectFeature类
 * @author 许照云
 * 2013.5
 */


/**
 * 特殊说明：
 * 1、当使用map直接加载该控件时，由于列表项（ul）默认隐藏，所以需要用户手动显示
 * 示例代码： 
 * var sfc = new OpenLayers.Control.ExSelectFeature();
 * map.addControl(sfc);
 * sfc.ul.show();  
 * 当把该控件加入一个panel时，不需要此处理

 */

OpenLayers.Control.ExSelectFeature = OpenLayers.Class(OpenLayers.Control.SelectFeature,{
    
	button1:$('<li>').html('点选').attr('id',-1),
	button2:$('<li>').html('矩形选择').attr('id',0),
	button3:$('<li>').html('多边形选择').attr('id',1),
	button4:$('<li>').html('圆形选择').attr('id',2),
	button5:$('<li>').html('线缓冲').attr('id',3),
	button6:$('<li>').html('环形缓冲').attr('id',4),
	button7:$('<li>').html('点缓冲').attr('id',5),
	input1:$('<input>').attr('type','text'), //用于输入线缓冲距离
	input2:$('<input>').attr('type','text'),//用于输入环形缓冲距离
	input3:$('<input>').attr('type','text'),//用于输入点缓冲距离
	
	/**
     * APIProperty: selectPoint
     * {Boolean} 控制点选的机制
     */
	
	selectPointByClick:true,
	
	ul:null,
	/**
     * APIProperty: types
     * {array} 该参数用来配置该控件实例包含的功能的种类数量，默认全部加载
     * 合法的值为-1到5之间任意组合成的数组
     */
	
	types:[-1,0,1,2,3,4,5],
	/**
     * APIProperty: sides
     * {integer} 圆的精度
     */
    sides:40, 
    
//    radius:null,
//    origin:null,
    
    /**
     * Property: multipleKey
     * {String} An event modifier ('altKey' or 'shiftKey') that temporarily sets
     *     the <multiple> property to true.  Default is null.
     *     按住shift键，临时设置multiple值为true.
     */
    multipleKey: 'altKey',
    
    /**
     * APIProperty: persist
     * {Boolean} 绘制完成后绘制内容是否保留(保留到下次绘制前).
     */
    persist:false,
    
    
    /**
     * APIProperty: continuous
     * {Boolean} 是否连续选择
     * true:多个handler是依次被激活进行选择，selector为数组，存放所有绘制的用于选择要素的要素
     *      一个handler进行一次选择后即默认进入点选状态，如需和其他handler结合则激活其他handler
     * false:只有一个handler起作用，selector只存放一个handler对应的绘制的用于选择要素的要素
     */
    continuous:  false,
    
    /**
     * APIProperty: selectType
     * {Number} 默认 -1. 点选, 可选值: 0(矩形),1(多边形),2(正多边形),3(线缓冲),4(环形缓冲)，5（点缓冲）
     */
    selectType: -1,
    
    /**
     * APIProperty: selector
     * {OpenLayers.Feature.Vector,<Array>} 
     * 用于存放该控件绘制的要素，该要素用于选择其他要素
     * 可能只存放一种geometry，也可能存放多种geometry的组合
     */
    selector: null,
    
    /**
     * APIProperty: buffer
     * {Integer} 只有当path或者linearRing为true，该参数发挥作用，缓冲分析的距离.
     */
    pathBuffer:1000,
    linearRingBuffer:1000,
    pointBuffer:5000,//相当于圆的半径radius
    /**
     * APIProperty: bufferArea
     * {<array>feature} 缓冲线（环）、线（环形）缓冲的区域（保存线缓冲的要素（1、绘制的线要素2、由线要素引申的多边形））
     * 
     */
    bufferArea:null,
    
    /**
     * APIProperty: boxArea
     * {feature} 单独用于存放拉框选择的矩形
     * 
     */
    boxArea :null,
    /**
     * APIProperty: boxArea
     * {feature} 单独用于存放点缓冲的圆
     * 
     */
    pointArea:null,
    /**
     * APIProperty: onPathDone
     * {Function} 可选参数，线绘制结束
     *     The function should expect to be called with a feature.
     */
    onPathDone:null,
    /**
     * APIProperty: onPolygonDone
     * {Function} 可选参数，多边形绘制结束后可调用的方法
     * （说明：无onLinearRingDone参数，其可认为是onPolygonDone的分支，需要的参数可通过onPolygonDone获取）
     */
    onPolygonDone:null,
    /**
     * APIProperty: onRegularPolygonDone
     * {Function} 可选参数，圆绘制结束
     *     The function should expect to be called with a feature.
     */
    onRegularPolygonDone:null,
    
    /**
     * APIProperty: onLinearRingDone
     * {Function} 可选参数，环绘制结束后可调用的方法
     */
    onLinearRingDone:null,
    /**
     * APIProperty: onPointDone
     * {Function} 可选参数，点缓冲完成后可调用的方法
     */
    onPointDone:null,
    /**
     * APIProperty: onSquareDone
     * {Function} 可选参数,动态图层点选结束后调用的方法
     */
    onSquareDone:null,

    /**
     * Constructor: MySelectFeature
     * Create a new control for selecting features.
     *
     * Parameters:
     * layers - {<OpenLayers.Layer.Vector>}, or an array of vector layers. The
     *     layer(s) this control will select features from.
     * options - {Object} 
     */
    initialize: function(layers, options) {
        OpenLayers.Control.SelectFeature.prototype.initialize.apply(this, arguments);
        
        //自定义方法（画线）
        this.handlers.path = new OpenLayers.Handler.Path(
            this, {done: this.selectPath},
            {
                persist:this.persist,
                freehandToggle: null}
        ); 
        //自定义方法（绘制正多边形/圆）
        this.handlers.regularPolygon = new OpenLayers.Handler.RegularPolygon(
                this, {done: this.selectRegularPolygon},
                {
                    sides: this.sides,
                    radius:this.radius,
                    persist:this.persist,
                    fixedRadius:this.fixedRadius}
            ); 
        
        var temp_style = OpenLayers.Util.extend({},
                OpenLayers.Feature.Vector.style['default']);
        var linearRing_style = OpenLayers.Util.extend(temp_style, {
        	fillOpacity: 0  //画多边形时无填充样式，再将多边形进行转变
        });
        this.handlers.linearRing = new OpenLayers.Handler.Polygon(
                this, {done: this.selectPath},
                {
                    persist:this.persist,
                    style:linearRing_style
                    }
            );
        
        this.handlers.polygon = new OpenLayers.Handler.Polygon(
                this, {done: this.selectPolygon},
                {
                    persist:this.persist}
            );
        
        this.handlers.box = new OpenLayers.Handler.Box(
                this, {done: this.selectBox},
                {
                	persist : this.persist,
                	boxDivClassName: "olHandlerBoxSelectFeature"}
            );
        
        var point_temp_style = OpenLayers.Util.extend({},
                OpenLayers.Feature.Vector.style['default']);
        var point_style = OpenLayers.Util.extend(point_temp_style, {
        	fillOpacity: 0,  //画多边形时无填充样式，再将多边形进行转变
        	strokeColor: "red",
        	strokeWidth: 4
        });//控制绘制的圆心的样式
        
        
        
        this.handlers.point = new OpenLayers.Handler.Point(
                this, {done: this.selectPoint},
                {
                	persist : this.persist,
                	style:point_style}
            ); 
        
        this.handlers.square = new OpenLayers.Handler.Point(
                this, {done: this.selectSquare}
            ); 
    },

    /**
     * Method: activate
     * Activates the control.
     * Parameters:
     * -1到5之间的某个整数
     * Returns:
     * {Boolean} The control was effectively activated.
     */
    activate: function (type) {
        this.deactivate();
        //handlers始终存在，因此当deactivate时，临时图层不会被destroy??
        //handlers一旦被激活即全部存在，handlers对应的layer的生命周期？？
        if(!this.continuous && this.selector){
        	this.temLayer.removeFeatures(this.selector);
        }
        
        if(this.layers) {
            this.map.addLayer(this.layer);
        }
        
        if(this.selectPointByClick){
        	this.handlers.feature.activate();
        }else{
        	this.handlers.square.activate();
        }
        
        this.selectType = type;
        
        switch (this.selectType) {
            case -1:
//            	this.handlers.feature.activate();
            	break;
            case 0:
            	this.handlers.square.deactivate();
                this.handlers.box.activate();
                break;
            case 1:
            	this.handlers.square.deactivate();
                this.handlers.polygon.activate();
                break;
            case 2:
            	this.handlers.square.deactivate();
                this.handlers.regularPolygon.activate();
                break;
            case 3:
            	this.handlers.square.deactivate();
                this.handlers.path.activate();
                break;
            case 4:
            	this.handlers.square.deactivate();
            	this.handlers.linearRing.activate();
                break;    
            case 5:	
            	this.handlers.square.deactivate();
            	this.handlers.point.activate();
            	break;
            default:
//            	this.handlers.feature.activate();
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
    	//deactivate时将temLayer destroy掉再重新创建是否更高效？
    	if(!this.continuous && this.bufferArea){
    		this.temLayer.removeFeatures(this.bufferArea[1]);
        } 
    	if(!this.continuous && this.pointArea){
    		this.temLayer.removeFeatures(this.pointArea);
        }
    	
        if (this.active) {
        	this.handlers.square.deactivate();
            this.handlers.feature.deactivate();
            //自定义
	        this.handlers.box.deactivate();
	        this.handlers.path.deactivate();
	        this.handlers.polygon.deactivate();
	        this.handlers.regularPolygon.deactivate();
	        this.handlers.linearRing.deactivate();
	        this.handlers.point.deactivate();
            if(this.layers) {
                this.map.removeLayer(this.layer);
            }
        }
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },

    /**
     * Method: setMap
     */
    setMap: function(map){
        OpenLayers.Control.SelectFeature.prototype.setMap.apply(this,arguments);
        //自定义
        this.handlers.box.setMap(map);//修改box的实现机制
        this.handlers.path.setMap(map);
        this.handlers.polygon.setMap(map);
        this.handlers.regularPolygon.setMap(map);
        this.handlers.linearRing.setMap(map);
        this.handlers.point.setMap(map);
        this.handlers.square.setMap(map);
        
        //为该控件创建一个临时图层
        var options = {
            displayInLayerSwitcher: false,
            calculateInRange: OpenLayers.Function.True,
            wrapDateLine: false
        };
        this.temLayer = new OpenLayers.Layer.Vector(this.CLASS_NAME, options);
        map.addLayer(this.temLayer);
    },
    
    _whenContinuous: function(position){
        //是否连续选择
    	
        if(this.continuous){
        	this.multiple = true;
        	
            this.activate();
            this.selector = [];           
            if(this.bufferArea){ //如果是线缓冲，则为了控制缓冲要素样式用如下方法赋值
            	this.selector.push(this.bufferArea[1]);
            	this.selector.push(this.bufferArea[0]); 
            	this.bufferArea = null;
            }else if(this.pointArea){
            	this.selector.push(this.pointArea[1]);
            	this.selector.push(this.pointArea[0]); 
            	this.pointArea = null;
            }else{
            	this.selector.push(new OpenLayers.Feature.Vector(position));
            }
            //handler的layer参数是临时图层，control的layer或layers参数表示所作用的图层，无临时图层
            this.temLayer.addFeatures(this.selector, {silent: true});
        }
    },
    
    /**
     * Method: selectBox
     * Callback from the handlers.box set up when <box> selection is true
     *     on.
     *
     * Parameters:
     * position - {<OpenLayers.Bounds> || <OpenLayers.Pixel> }  
     */    
    selectBox: function(position) {
    	if(!this.continuous && this.boxArea){
    		//从临时图层删除要素
    		this.temLayer.removeFeatures(this.boxArea);
        } 
    	
    	OpenLayers.Control.SelectFeature.prototype.selectBox.apply(this,arguments);    	
    	var geometry = null;
//    	this.boxArea =null;
    	if(position.CLASS_NAME == "OpenLayers.Pixel"){ //box太小，返回一个像素值
//    		alert("绘制的box太小,请重新绘制");
    		this.activate(0);    				
    	}else{
    		geometry =this.boundsToPolygon(position); 
    		this.boxArea = new OpenLayers.Feature.Vector(geometry);
    		if(!this.continuous && this.persist){
    			//将绘制的内容加载临时图层上
    			this.temLayer.addFeatures(this.boxArea);
            } 
        	this._whenContinuous(geometry);
    	}
    },
    
    /**
     * Method: selectPath
     * Callback from the handlers.Path set up when <path> selection is true
     *     on.
     *
     * Parameters:
     * position - {<OpenLayers.Geometry.Path> }  
     */
    selectPath: function(position) {
    	if(!this.continuous && this.bufferArea){
    		//删除临时图层上的该要素
    		this.temLayer.removeFeatures(this.bufferArea[1]); 		
        } 
    	
    	var linearRing_geom = null;   
    	if(position.CLASS_NAME == 'OpenLayers.Geometry.Polygon'){//环形缓冲
    		//环形线最后一个点即第一个点，为了避免地理坐标下求平行线进行坐标转换时，第一个被进行连续两次转换，做以下处理
    		if(position.components[0].components.length < 4){
    			//当用户非法操作，只绘制两点时，直接忽略，再次激活。
    			//this.temLayer.addFeatures(new OpenLayers.Feature.Vector(position));
    			this.handlers.linearRing.activate();
    		}else{
    			var line_points = position.components[0].components.slice(0,-1);
        		var clone_point = position.components[0].components[0].clone();
        		line_points.push(clone_point);
     
        		position = new OpenLayers.Geometry.LineString(line_points);
        		var paralls = [parall(position.components,this.linearRingBuffer),parall(position.components,-this.linearRingBuffer)]; 
        		linearRing_geom = [new OpenLayers.Geometry.LinearRing(
        									paralls[1].path),
        								new OpenLayers.Geometry.LinearRing(
        										paralls[0].path)]; 
    		}
    		
            
    	}else{
    		var paralls = [parall(position.components,this.pathBuffer),parall(position.components,-this.pathBuffer)];
    	      
            var all_bufffer_points = [];
            all_bufffer_points = paralls[0].path.concat(paralls[1].path.reverse());

            linearRing_geom = [new OpenLayers.Geometry.LinearRing(all_bufffer_points)];       
    	}
    	
        var polygon_geom = new OpenLayers.Geometry.Polygon(linearRing_geom);
        
        var temp_style = OpenLayers.Util.extend({},
                OpenLayers.Feature.Vector.style['default']);
        var buffer_style = OpenLayers.Util.extend(temp_style, {
        	strokeDashstyle: "longdash"
        });

        var buffer_ft = new OpenLayers.Feature.Vector(polygon_geom,null,buffer_style);        

        var line_ft = new OpenLayers.Feature.Vector(position);//原始缓冲线  

        this.bufferArea = [line_ft,buffer_ft];//保存线缓冲的要素（1、绘制的线要素2、由线要素引申的多边形）
        
        //将新计算出来的缓冲区域polygon赋值给position，覆盖其原来的值
        position = polygon_geom;
        if(typeof this.onPathDone === 'function'){
            this.onPathDone.call(this,position);
        }
        
        if(typeof this.onLinearRingDone === 'function'){
            this.onLinearRingDone.call(this,position);
        }
        
        if (position instanceof OpenLayers.Geometry.Polygon) {
            if (!this.multipleSelect()) {
                this.unselectAll();
            }           
            var prevMultiple = this.multiple;
            this.multiple = true;
            var layers = this.layers || [this.layer];
            this.events.triggerEvent("pathselectionstart", {layers: layers}); 
            var layer;
            for(var l=0; l<layers.length; ++l) {
                layer = layers[l];
                for(var i=0, len = layer.features.length; i<len; ++i) {
                    var feature = layer.features[i];
                    if (!feature.getVisibility()) {
                        continue;
                    }
                    if (this.geometryTypes == null || OpenLayers.Util.indexOf(
                            this.geometryTypes, feature.geometry.CLASS_NAME) > -1) {
                        if (position.intersects(feature.geometry)) {
                            if (OpenLayers.Util.indexOf(layer.selectedFeatures, feature) == -1) {
                                this.select(feature);
                            }
                        }
                    }
                }
            }
            this.multiple = prevMultiple;
            this.events.triggerEvent("pathselectionend", {layers: layers,position:position});
            
        }
        this.input1.attr("disabled", "disabled");//绘制结束后将缓冲距离的input属性设置为不能被修改   
        this.input2.attr("disabled", "disabled");
        if(!this.continuous){
        	//加在临时图层上
        	this.temLayer.addFeatures(this.bufferArea[1]);
        }        
        
        this._whenContinuous(position);
    },
    
    /**
     * Method: selectPolygon
     * Callback from the handlers.Polygon set up when <polygon> selection is true
     *     on.
     *
     * Parameters:
     * position - {<OpenLayers.Geometry.Polygon> }  
     */
    selectPolygon: function(position) {     	
        if(typeof this.onPolygonDone === 'function'){
            this.onPolygonDone.call(this,position);
        }
             
        if (position instanceof OpenLayers.Geometry.Polygon) {
            if (!this.multipleSelect()) {
                this.unselectAll();
            }
            
            var prevMultiple = this.multiple;
            this.multiple = true;
            var layers = this.layers || [this.layer];
            this.events.triggerEvent("polygonselectionstart", {layers: layers}); 
            var layer;
            for(var l=0; l<layers.length; ++l) {
                layer = layers[l];
                for(var i=0, len = layer.features.length; i<len; ++i) {
                    var feature = layer.features[i];
                    if (!feature.getVisibility()) {
                        continue;
                    }
                    if (this.geometryTypes == null || OpenLayers.Util.indexOf(
                            this.geometryTypes, feature.geometry.CLASS_NAME) > -1) {
                        if (position.intersects(feature.geometry)) {
                            if (OpenLayers.Util.indexOf(layer.selectedFeatures, feature) == -1) {
                                this.select(feature);
                            }
                        }
                    }
                }
            }
            this.multiple = prevMultiple;
            this.events.triggerEvent("polygonselectionend", {layers: layers,position:position}); 
            
            this._whenContinuous(position);
        }
    },
    
    /**
     * Method: selectRugularPolygon
     * Callback from the handlers.RegularPolygon set up when <path> selection is true
     *     on.
     *
     * Parameters:
     * position - {<OpenLayers.Geometry.Polygon> }  
     */
    selectRegularPolygon: function(position) {  
    	
    	//判断坐标系  转换
    	
        this.onRegularPolygonDone.call(this,position);
        this.selectPolygon(position);  
    },
    
    /**
     * Method: selectSquare,主要应用于动态图层的点选机制，传递一个非常小的矩形，不用绘制
     * 为了提高点选的灵敏度，通过固定的像素值来控制square的大小，而非使用固定的地理长度
     * 
     * Parameters:
     * position - {<OpenLayers.Geometry.Point> }  
     */
    selectSquare:function(position){
    	var x = position.x;
    	var y = position.y;
    	
//    	var lonlat = new OpenLayers.LonLat(x,y);
    	
    	var radius = 100;
    	var scale = null;
    	if(this.handlers.square.map){
    		scale  = this.handlers.square.map.getScale();
    	}
    	if(scale){
    		radius = 0.01*scale;
    	}

    	var isMercator = true;
        if(x < 181 && y < 91){//地理坐标转为投影坐标
        	position.transform("EPSG:4326", "EPSG:102113");
            isMercator = false;
        }
    	position = OpenLayers.Geometry.Polygon.createRegularPolygon(position,radius,4);
    	
    	if(!isMercator){//投影坐标转回地理坐标
    		position.transform("EPSG:102113", "EPSG:4326");
    	}
    	
    	if(typeof this.onSquareDone === 'function'){
            this.onSquareDone.call(this,position);
        }
    },
    
    
    /**
     * Method: selectPoint,用于点缓冲（绘制圆心，根据给定的半径进行缓冲分析）
     *
     * Parameters:
     * position - {<OpenLayers.Geometry.Point> }  
     */
    selectPoint:function(position){
    	
    	if(!this.continuous && this.pointArea){
    		this.temLayer.removeFeatures(this.pointArea);
        }
    	
    	var point_temp_style = OpenLayers.Util.extend({},
                OpenLayers.Feature.Vector.style['default']);
        var point_style = OpenLayers.Util.extend(point_temp_style, {
        	fillOpacity: 0,  //画多边形时无填充样式，再将多边形进行转变
        	strokeColor: "red",
        	strokeWidth: 4
        });//控制绘制的圆心的样式
    	point_ft = new OpenLayers.Feature.Vector(position,{},point_style);
    	
    	
    	var geographic = new OpenLayers.Projection("EPSG:4326");
    	var mercator =  new OpenLayers.Projection("EPSG:102113");
    	
    	var x = position.x;
    	var y = position.y;
    	var isMercator = true;
        if(x < 181 && y < 91){//地理坐标转为投影坐标
        	position.transform(geographic,mercator);
            isMercator = false;
        }
    	position = OpenLayers.Geometry.Polygon.createRegularPolygon(position,this.pointBuffer,this.sides);
    	
    	if(!isMercator){//投影坐标转回地理坐标
    		position.transform(mercator,geographic);
    	}
    	
		point_buffer_ft = new OpenLayers.Feature.Vector(position);

    	this.pointArea = [point_buffer_ft,point_ft];
    	
    	
    	if(typeof this.onPointDone === 'function'){
            this.onLinearRingDone.call(this,position[0]);
        }
    	
    	//以下逻辑基本上与多边形选择逻辑相同
    	if (position instanceof OpenLayers.Geometry.Polygon) {
            if (!this.multipleSelect()) {
                this.unselectAll();
            }
            
            var prevMultiple = this.multiple;
            this.multiple = true;
            var layers = this.layers || [this.layer];
            this.events.triggerEvent("pointselectionstart", {layers: layers}); 
            var layer;
            for(var l=0; l<layers.length; ++l) {
                layer = layers[l];
                for(var i=0, len = layer.features.length; i<len; ++i) {
                    var feature = layer.features[i];
                    if (!feature.getVisibility()) {
                        continue;
                    }
                    if (this.geometryTypes == null || OpenLayers.Util.indexOf(
                            this.geometryTypes, feature.geometry.CLASS_NAME) > -1) {
                        if (position.intersects(feature.geometry)) {
                            if (OpenLayers.Util.indexOf(layer.selectedFeatures, feature) == -1) {
                                this.select(feature);
                            }
                        }
                    }
                }
            }
            this.multiple = prevMultiple;
            this.events.triggerEvent("pointselectionend", {layers: layers,position:position}); 
            
            if(this.persist){
            	this.temLayer.addFeatures(this.pointArea);
            }
            
            this._whenContinuous(position);
        }
    	
    	this.input3.attr("disabled", "disabled");
    },
    
    
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
            if(this.types instanceof(Array)){
            	for(var i =0;i<this.types.length;i++){
            		if(this.types[i] == -1){
            			ul.append(this.button1);
            		}else if(this.types[i] == 0){
            			ul.append(this.button2);
            		}else if(this.types[i] == 1){
            			ul.append(this.button3);
            		}else if(this.types[i] == 2){
            			ul.append(this.button4);
            		}else if(this.types[i] == 3){
            			ul.append(this.button5.append(this.input1));
            		}else if(this.types[i] == 4){
            			ul.append(this.button6.append(this.input2));
            		}else if(this.types[i] == 5){
            			ul.append(this.button7.append(this.input3));
            		}
            	}
            }
            
            $ctl.append(ul);   
            ul.hide();
            ul.delegate('li','click',function(){
    			var action = $(this).addClass("activate").attr('id');
    	        $(this).siblings("li").removeClass("activate"); 
    	        
    	        $('.olControlExSelectFeature input').hide();
    	        $('#'+action+' input').show('fast',function(){
    	        	$(this).focus();
    	        }).removeAttr("disabled");
    	        
    			self.activate(parseInt($(this).attr('id')));	
    		});
            
            // 监听缓冲距离input的change(回车)事件，获取其值
            this.input1.keyup(function() {
                self.setPathBuffer($(this).val());
            });           
            this.input2.keyup(function() {
                self.setLinearRingBuffer($(this).val());
            });
            this.input3.keyup(function() {
                self.setPointBuffer($(this).val());
            });
            
            // 页面初始化时缓冲距离的input框显示默认距离
            this.input1.val(self.pathBuffer);
            this.input2.val(self.linearRingBuffer);
            this.input3.val(self.pointBuffer);
             
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
     * Method: setPathBuffer
     * 给线缓冲的缓冲距离设一个值
     */
    setPathBuffer: function(buffer){
    	this.pathBuffer = buffer;
    },
    
    /**
     * Method: setLinearRingBuffer
     * 给环形选择的缓冲距离设一个值
     */
    setLinearRingBuffer: function(buffer){
    	this.linearRingBuffer = buffer;
    },
    /**
     * Method: setPointBuffer
     * 给点缓冲的缓冲距离设一个值
     */
    setPointBuffer: function(buffer){
    	this.pointBuffer = buffer;
    },
    
    /**
     * Method: degreeToRad
     * Parameters:
     * d:度数
     * return：度数对应的弧度
     */
    degreeToRad: function(d){
    	return d * Math.PI/180.0;
    },
    
    /**
     * Method: getDistance
     * Parameters：
     * point1:<OpenLayers.Geometry.Point> 要求为地理坐标
     * point2:<OpenLayers.Geometry.Point>
     * return: s(米)
     * 
     */
    getDistance: function(point1,point2){
    	EARTH_RADIUS = 6378.137;
    	var x1 = point1.x;
    	var y1 = point1.y;
    	var x2 = point2.x;
    	var y2 = point2.y;
    	var radlat1 = this.degreeToRad(y1);
    	var radlat2 = this.degreeToRad(y2);
    	var a = radlat1 - radlat2;
    	var b = this.degreeToRad(x1) - this.degreeToRad(x2);
    	var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) 
                + Math.cos(radlat1)*Math.cos(radlat2)*Math.pow(Math.sin(b/2),2)));
    	s = s * EARTH_RADIUS;
        s = Math.round(s * 10000)/10000;
        return s*1000;
    		
    },
    
    /**
     * Method: boundsToPolygon
     * Parameters：
     * point1:<OpenLayers.Bounds> 
     * return: <OpenLayers.Geometry.Polygon> 
     * 
     */
    boundsToPolygon: function(bounds){
    	var lonlat1 = this.map.getLonLatFromPixel(
    			new OpenLayers.Pixel(bounds.left,bounds.top));
    	var lonlat2 = this.map.getLonLatFromPixel(
    			new OpenLayers.Pixel(bounds.right,bounds.top));
    	var lonlat3 = this.map.getLonLatFromPixel(
    			new OpenLayers.Pixel(bounds.right,bounds.bottom));
    	var lonlat4 = this.map.getLonLatFromPixel(
    			new OpenLayers.Pixel(bounds.left,bounds.bottom));
    	var p1 = new OpenLayers.Geometry.Point(lonlat1.lon,lonlat1.lat);
    	var p2 = new OpenLayers.Geometry.Point(lonlat2.lon,lonlat2.lat);
    	var p3 = new OpenLayers.Geometry.Point(lonlat3.lon,lonlat3.lat);
    	var p4 = new OpenLayers.Geometry.Point(lonlat4.lon,lonlat4.lat);
    	var linearRing = new OpenLayers.Geometry.LinearRing([p1,p2,p3,p4]);
    	var boxGeometry = new OpenLayers.Geometry.Polygon([linearRing]);
    	return boxGeometry;
    	
    },
    
    
    /**
     * Method: setPersist
     * Parameters：
     * persist:<Boolean> 
     * 
     */
    setPersist:function(persist){
    	this.persist = persist;
    	this.handlers.box.persist = this.persist;
        this.handlers.path.persist= this.persist;
        this.handlers.polygon.persist = this.persist;
        this.handlers.regularPolygon.persist = this.persist;
        this.handlers.linearRing.persist = this.persist;
        this.handlers.point.persist = this.persist;
    },
    /**
     * Method: setContinous
     * Parameters：
     * persist:<Boolean> 
     * 
     */
    setContinous:function(continuous){
    	this.continuous = continuous;
    	this.multiple = true;
    },
    /**
     * Method: setMultiple
     * Parameters：
     * persist:<Boolean> 
     * 
     */
    setMultiple:function(multiple){
    	this.multiple = multiple;
    },
    
    CLASS_NAME: "OpenLayers.Control.ExSelectFeature"
});


