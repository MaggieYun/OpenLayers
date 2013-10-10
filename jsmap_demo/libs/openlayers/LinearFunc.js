/**
 * OpenLayers.LinearFunc类
 * @author 许照云
 * 2013.5
 */
OpenLayers.LinearFunc = OpenLayers.Class({
	
	EARTH_RADIUS : 6378.137,
	
	/**
     * Constructor: LinearFunc
     *
     * Parameters:
     * path:
     *
     * Returns:
     * {<OpenLayers.Projection>}
     */
    initialize: function(path, options) {
        OpenLayers.Util.extend(this, options);
        this.path = path;
        this._diss = null;  //每个vertex到起点的距离集合
    },
    
    /**
     * Method: get_diss
     * 获取每个vertex到起点的距离集合
     *
     * Returns:
     * {} 
     */
    get_diss: function(){
    	if(this._diss == null){
    		var pre_distance = 0;
    		var pre_vertex = this.path[0];
    		this._diss = [];
    		for(var i=0;i<this.path.length;i++){
    			var distance = OpenLayers.LinearFunc.get_distance(pre_vertex,this.path[i]);
    			pre_distance = pre_distance + distance;
    			this._diss.push(pre_distance);
    			pre_vertex = this.path[i];
    			
    		}
    	}
    	return this._diss;
    },
    
    /**
     * Method: get_sub_path
     * 根据长度获取子路径
     *
     * Parameters:
     * distance:
     * start：开始位置,默认为0,即起点
     * 
     * Returns:
     * {} 
     */
    get_sub_path: function(distance,start){
    	var diss = this.get_diss();
    	var size = diss.length;
    	
    	var pre = 0; //前一个vertex处的距离值
    	for(var i=0;i<size;i++){
    		var dic = diss[i];
    		if(dic > distance){  //如果某vertex处的距离值大于给定的distance
    			var diff = (dic - pre) - (dic - distance);
                var between_pnt = OpenLayers.LinearFunc.get_poi_between(this.path[i-1],this.path[i],diff)
                
                //有待验证 索引值
                var result = this.path.slice(0,i).concat([between_pnt]);
                return result;
    		}else{
    			pre = dic;
    		}
    	}
    	
    	if (distance >= pre){
    		return this.path;
    	}
    	
    },
    
    CLASS_NAME: "OpenLayers.LinearFunc" 
});


/**
 * APIMethod: get_distance
 * Parameters：
 * point1:<OpenLayers.Geometry.Point> 要求为地理坐标
 * point2:<OpenLayers.Geometry.Point>
 * return: s(米)
 * 
 */
OpenLayers.LinearFunc.get_distance = function(point1,point2){

	var EARTH_RADIUS = 6378.137;
	var x1 = point1.x;
	var y1 = point1.y;
	var x2 = point2.x;
	var y2 = point2.y;
	var radlat1 = OpenLayers.LinearFunc.degreeToRad(y1);
	var radlat2 = OpenLayers.LinearFunc.degreeToRad(y2);
	var a = radlat1 - radlat2;
	var b = OpenLayers.LinearFunc.degreeToRad(x1) - OpenLayers.LinearFunc.degreeToRad(x2);
	var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) 
            + Math.cos(radlat1)*Math.cos(radlat2)*Math.pow(Math.sin(b/2),2)));
	s = s * EARTH_RADIUS;
    s = Math.round(s * 10000)/10000;
    
    return s*1000;
    
		
},

/**
 * APIMethod: degreeToRad
 * Parameters:
 * d:度数
 * return：度数对应的弧度
 */
OpenLayers.LinearFunc.degreeToRad = function(d){
	return d * Math.PI/180.0;
},

/**
 * APIMethod: get_poi_between
 * 获取p1,p2间的点
 * Parameters:
 * p1:
 * p2:
 * distance；
 * return：
 */
OpenLayers.LinearFunc.get_poi_between = function(p1,p2,distance){
	var length = OpenLayers.LinearFunc.get_distance(p1,p2);
	var x1 = p1.x;
	var y1 = p1.y;
	var x2 = p2.x;
	var y2 = p2.y;

    var x = (x2 - x1) * distance / length + x1;
    var y = (y2 - y1) * distance / length + y1;

    return {
        x : x,
        y : y
    };
};


var a = 20037508.34;

/**
 * 地理坐标转投影坐标
 * 
 * @param {Number}
 *            x 经度
 * @param {Number}
 *            y 纬度
 * @return {Object} 投影坐标
 */
OpenLayers.LinearFunc.toMC = function(x, y) {
    return {
        x : x * a / 180,
        y : Math.log(Math.tan((90 + y) * Math.PI / 360))
                / (Math.PI / 180) * a / 180
    };
},

/**
 * 投影坐标转地理坐标
 * 
 * @param {Number}
 *            x 经度
 * @param {Number}
 *            y 纬度
 * @return {Object} 地理坐标
 */
OpenLayers.LinearFunc.toLL = function(x, y) {
    x = x / a * 180;
    y = y / a * 180;
    y = 180
            / Math.PI
            * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);
    return {
        x : x,
        y : y
    };
}