/**
 * OpenLayers.Control.GetCoordinate 类
 * @author 许照云
 * 2013.5
 */
OpenLayers.Control.GetCoordinate = OpenLayers.Class(OpenLayers.Control,{
	
	button1:$('<li>').html('获取点坐标').attr('id',1),
	button2:$('<li>').html('获取线坐标').attr('id',2),
	button3:$('<li>').html('获取面坐标').attr('id',3),
	
	ul:null,
	/**
     * APIProperty: types
     * {array} 该参数用来配置该控件实例包含的功能的种类数量，默认全部加载
     * 合法的值为1到3之间任意组合成的数组
     */
	types:[1,2,3],
	selectType:1,
	layer:null,
//	feature:null,//用于存放该控件绘制的要素            传递无法实现
	
	persist:true,//新增自定义属性，用于控制绘制后要素是否持续显示
	
	callback:null,
		
	/**
	 * Constructor: OpenLayers.Control.GetCoordinate
	 * 
	 * Parameters:
	 * layer - {<OpenLayers.Layer.Vector>} 
	 */
	initialize: function(layer, options) {
	    OpenLayers.Control.prototype.initialize.apply(this, [options]);
	    this.layer = layer;
    	// 增加绘制点要素的控件
    	this.drawPointCtl =
    	    new OpenLayers.Control.DrawFeature(layer,
    	        OpenLayers.Handler.Point, {  	    
    	    		persist:this.persist,
    	            featureAdded : this.onFeatureAdded
    	        });
    	//增加绘制线要素的控件
    	this.drawLineCtl =
    	    new OpenLayers.Control.DrawFeature(layer,
    	        OpenLayers.Handler.Path, {
    	    		persist:this.persist,
    	            featureAdded : this.onFeatureAdded
    	        });
    	//增加绘制多边形要素的控件
    	this.drawPolygonCtl =
    	    new OpenLayers.Control.DrawFeature(layer,
    	        OpenLayers.Handler.Polygon, {
    	    		persist:this.persist,
    	            featureAdded : this.onFeatureAdded
    	        });
    	
    	this.drawPointCtl.parent = this;
    	this.drawLineCtl.parent = this;
    	this.drawPolygonCtl.parent = this;
	},


	
    
    activate: function (type) {
    	this.deactivate();
    	this.selectType = type;
    	switch (this.selectType) {
	        case 1:
	            this.drawPointCtl.activate();
	            break;
	        case 2:
	            this.drawLineCtl.activate();
	            break;
	        case 3:
	            this.drawPolygonCtl.activate();
	            break;
	        default:
	        	this.drawPointCtl.activate();
	            break;
    	}
    	return OpenLayers.Control.prototype.activate.apply(
                this, arguments
        );
    },
    
    deactivate: function () {
    	
    	if(this.drawPointCtl.feature){
    		this.layer.removeFeatures([this.drawPointCtl.feature]);
    	}
    	if(this.drawLineCtl.feature){
    		this.layer.removeFeatures([this.drawLineCtl.feature]);
    	}
    	if(this.drawPolygonCtl.feature){
    		this.layer.removeFeatures([this.drawPolygonCtl.feature]);
    	}

        if (this.active) {
        	this.drawPointCtl.deactivate();
        	this.drawLineCtl.deactivate();
        	this.drawPolygonCtl.deactivate();
        }
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },
    
    /**
     * Method: setMap
     */
    setMap: function(map){
        OpenLayers.Control.prototype.setMap.apply(this,arguments);
        //自定义
        this.drawPointCtl.handler.setMap(map);
    	this.drawLineCtl.handler.setMap(map);
    	this.drawPolygonCtl.handler.setMap(map);
    },
    
    
    onFeatureAdded: function(feature) {
    	//注意这里的this指的是对应的drawFeature控件，而非GetCoordinate控件本身
		if(this.feature){
			this.layer.removeFeatures([this.feature]);
		}
		
		var geometry = feature.geometry;//以下逻辑用于控制绘制要素的样式(区别于默认样式)
		this.layer.removeFeatures([feature]);
		
		
		if(this.persist){
			var point_temp_style = OpenLayers.Util.extend({},
		            OpenLayers.Feature.Vector.style['default']);
			var ftStyle = OpenLayers.Util.extend(point_temp_style, {
		    	fillOpacity: 0.2,  
		    	strokeColor: "red",
		    	strokeWidth: 2,
		    });
			var newFeature = new OpenLayers.Feature.Vector(geometry,{},ftStyle);
			this.layer.addFeatures([newFeature]);
			this.feature = newFeature;   //drawFeature控件增加一个feature属性，该属性不属于GetCoordinate类
		}
		
		
		if(typeof this.parent.callback === 'function'){
			this.parent.callback.call(null,geometry);
		}

	},
    
	addCallback:function(callback){
		this.callback = callback;
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
            		if(this.types[i] == 1){
            			ul.append(this.button1);
            		}else if(this.types[i] == 2){
            			ul.append(this.button2);
            		}else if(this.types[i] == 3){
            			ul.append(this.button3);
            		}
            	}
            }
            
            $ctl.append(ul);   
            ul.hide();
            ul.delegate('li','click',function(){
    			var action = $(this).addClass("activate").attr('id');
    	        $(this).siblings("li").removeClass("activate");  	   
    			self.activate(parseInt($(this).attr('id')));	
//    			self.stopBubble(this);
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
    
    CLASS_NAME: "OpenLayers.Control.GetCoordinate"
    
});