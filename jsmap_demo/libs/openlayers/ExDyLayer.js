/**
 * @author 许照云
 * 2013.6
 */
OpenLayers.Layer.ExDyLayer = OpenLayers.Class(OpenLayers.Layer.Grid,{
    
	singleTile: true,
    ratio: 1,
    wrapDateLine: true,
    
    visibility:false,
    jsonLoading:false,
    
    url:null,
    queryUrl:null,
    where:null,//是否有where条件用于export
    vLayerName:'附属矢量图层',

    inSR:'102113',
    outSR:'102113',
    
    initFeatures:true, //实例化该类时是否需要预先请求所有json数据
    
    /**
     * APIProperty: features
     * {array} 二维数组
     */
    features:[],
    
    
    vLayerStyleMap:new OpenLayers.StyleMap(OpenLayers.Feature.Vector.style),
	
	/**
     * APIProperty: vectorLayer
     * {OpenLayers.Layer.Vector} 附属的矢量图层
     */
    
    //注意：经过尝试，初步判断new时无法引用this
	vectorLayer:null,
	
	/**
     * APIProperty: mutiple
     * {boolean} 是否连续选择 主要用于其他选择方式与点选的结合
     */
	mutiple:false,
	
	/**
     * APIProperty: selectedFeatures
     * {boolean} 用于存放矢量图层上的所有要素
     */
	selectedFeatures:[],

	
	/**
     * Constructor: OpenLayers.Layer.ExDyLayer
     *
     * Parameters:
     * name - {String}
     * url - {String}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, options) {
    	OpenLayers.Layer.Grid.prototype.initialize.apply(this, [
            name || this.name, url || this.url, {}, options
        ]);	
    	
    	this.vectorLayer = new OpenLayers.Layer.Vector(this.vLayerName,{
    		styleMap : this.vLayerStyleMap,
    		displayInLayerSwitcher:false
    	});
    	this.features = [];
    	this.selectedFeatures = [];
    	
    	if(this.initFeatures){
    		this.query();
    	}
    	
    },
	
    destroy: function(){
    	OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments); 
    	this.vectorLayer = null;
    	this.features = null;
    	this.selectedFeatures = null;
    	this.vLayerStyleMap = null;
    },
    
    
    setWhere:function(where){
    	this.features = [];
    	this.where = where || this.where;
    	var prefix= this.queryUrl.split('&where=')[0];
    	if(this.where){		
    		this.queryUrl  = prefix +'&where='+this.where;
    	}else{
    		this.queryUrl  = prefix;
    	}
    	 
    	this.visibility = true;//有待进一步改进
    	this.redraw();
    },
    
	/**
     * Method: getURL
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     *
     * Returns:
     * {String} A string with the layer's url and parameters and also the
     *          passed-in bounds and appropriate tile size specified as
     *          parameters
     */
	getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var bbox = bounds.left + "," + bounds.bottom + "," + bounds.right + "," + bounds.top;
        var size = this.getImageSize();
        //疑问：坐标系问题？
        
        if(this.where){
        	//拼接从后台地图服务获取动态图片的url
             exportUrl = this.url + "export?bbox=" + bbox + "&size=" 
            					+ size.w + "," + size.h 
            					+ "&inSR=" + this.inSR + "&outSR=" + this.outSR + "&where="+ this.where;
        }else{
        	exportUrl = this.url + "export?bbox=" + bbox + "&size=" 
							+ size.w + "," + size.h 
							+ "&inSR=" + this.inSR + "&outSR=" + this.outSR;
        }
        
    	if(this.features.length == 0){//确保只请求一次数据     	
    		this.query();
    	}
        
        return exportUrl;
    },
    
    query:function(){
    	if(this.jsonLoading){
    		return;
    	}
    	
    	this.jsonLoading = true;
    	
    	this.features = [];
    	
    	$.ajax({
    	    url: this.queryUrl,
    	    dataType:'JSONP',
    	    context: this,
    	    success: function(data){
    	        this.jsonLoading = false;
                
                var fields = data.fields,
                type = data.type,
                records = data.features,
                len = records.length,
                i;

                for(i = 0;i < len;i++){
                    var record = records[i],
                        xy = record[0],
                        pnt = new OpenLayers.Geometry.Point(xy[0],xy[1]),
                        attributes = {};

                    if(xy[0] === 0 || xy[1] === 0){
                            continue;
                     }
                    
                    for(var j = 0;j < fields.length;j++){
                        var field = fields[j];
                        attributes[field] = record[j];
                    }

                    this.features.push([pnt,attributes]);
                }
                
                this.events.triggerEvent('loaded');
    	    }
    	});
    	
//    	$.getJSON(this.queryUrl,$.proxy(function(data){
//    		this.jsonLoading = false;
//    		
//    		var fields = data.fields,
//            type = data.type,
//            records = data.features,
//            len = records.length,
//            i;
//
//            for(i = 0;i < len;i++){
//                var record = records[i],
//                    xy = record[0],
//                    pnt = new OpenLayers.Geometry.Point(xy[0],xy[1]),
//                    attributes = {};
//
//                if(xy[0] === 0 || xy[1] === 0){
//                        continue;
//                 }
//                
//                for(var j = 0;j < fields.length;j++){
//                    var field = fields[j];
//                    attributes[field] = record[j];
//                }
//
//                this.features.push([pnt,attributes]);
//            }
//            
//            this.events.triggerEvent('loaded');
//            
//        },this));
    },
    
    /**
     * Method: selectFeatures（及query方法，查询该动态图层中在指定多边形内的点位）
     * 将查询出的点位添加到该动态图层的矢量图层上  addFeatures
     * Parameters:
     * polygon  {OpenLayers.Geometry.Polygon}
     */
    selectFeatures:function(ctl,isSelectByPoint,polygon,callback){
    	
    	if(!this.mutiple){//不允许多次选择,即只能多边形选择
    		ctl.unselectAll();
        	this.vectorLayer.removeAllFeatures();
        	this.selectedFeatures = [];
        	
    	}else{ //多边形选择结束后，进行点选
    		for(var i = 0;i<this.selectedFeatures.length;i++){
    			if(this.selectedFeatures[i].geometry){
    				if(polygon.containsPoint(this.selectedFeatures[i].geometry)){
        				//点选的是已选中的点，则去除该点
        				ctl.unselect(this.selectedFeatures[i]);
        				this.vectorLayer.removeFeatures([this.selectedFeatures[i]]);

        				this.selectedFeatures[i].destroy();    				
        				this.selectedFeatures.splice(i, 1);   				
        				return;
        			}
    			}
    		}
    	}

    	var ftNum = 0;
    	for(var i=0;i<this.features.length;i++){
    		if(polygon.containsPoint(this.features[i][0])){
    			
    			if(this.features[i][0]){//确保selectedFeatures的geometry不为null
    				var feature = new OpenLayers.Feature.Vector(this.features[i][0],this.features[i][1]);
        			feature.layer = this.vectorLayer;
        			this.vectorLayer.addFeatures([feature]);
        			callback(feature);
        			
        			ftNum = ftNum+1;
        			
        			this.selectedFeatures.push(feature);
        			if(isSelectByPoint){//如果是点选，则找到一个点后就立即返回
        				return;
        			}
    			}
	
    		}
//    		if(ftNum > 100){//控制渲染的点数
//    			alert("选择的点数超过100");
//    			return;
//    		}
    	}

    },
    
    addFeatures :function(features,ctl){
    	this.vectorLayer.addFeatures(features);
    	
    	for(var i=0;i<features.length;i++){//尤其针对通州预案编辑页面
    		if(features[i].geometry.CLASS_NAME == "OpenLayers.Geometry.Point"){
    			this.selectedFeatures.push(features[i]);
    		}
    	}
    	
    	if(ctl){   		
    		for(var i=0;i<features.length;i++){
    			ctl.select(features[i]);
    		}
    	}
    },
    
    setStyle:function(styleMap){
    	this.vectorLayer.styleMap = styleMap;
    },
    
    removeFeature:function(feature){
    	//所有的要素分别分布在矢量图层和动态图层上，两个图层上所有要素加起来才是总集合，两个图层上不应出现相同的要素
    	//暂且 vectorLayer上的所有要素即为this.selectedFeatures;
    	this.vectorLayer.removeFeatures([feature]);
    	for(var i=0;i<this.selectedFeatures.length;i++){
			if(feature == this.selectedFeatures[i]){
				this.selectedFeatures.splice(i, 1);
				return;
			}
    	}
    },
	
    getSelectedFeatures:function(){
    	return this.selectedFeatures;
    },
    
    clearVectorLayer:function(ctl){
    	if(ctl){
    		ctl.unselectAll();
    	}
    	this.vectorLayer.removeAllFeatures();
    	this.selectedFeatures = [];
    	
    },
	
	CLASS_NAME: "OpenLayers.Layer.ExDyLayer"
});
