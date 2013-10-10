/* Copyright (c) 2002-2012 by Yhte*/

/**
 * @requires OpenLayers/Layer/XYZ.js
 */

/**
 * @class
 */
OpenLayers.Layer.PGisLayer = OpenLayers.Class(OpenLayers.Layer.XYZ, {
	/**
	 * pgis tile请求中的ZoomOffset参数
	 * @type Number
	 */
	zOffset:7,
	
	/**
	 * @type
	 */
	maxExtent:new OpenLayers.Bounds([0,0,180,90]),//必须
	
	resolutions: (function(t){
        var r = 1.562506355401464E-02,rs=[];
        for(var i = 0;i <= t;i++){
            rs.push(r/Math.pow(2,i));
        }
        return rs;
    })(11),
    
	/**
	 * 
	 * @type String
	 */
    urlTpl:"?Service=getImage&Type=RGB&" +
            "ZoomOffset=${f}&Col=${x}&Row=${y}&Zoom=${z}&V=0.3",
	
	/**
	 * @constructor
	 * @param {String} name
	 * @param {String} url
	 * @param {Object} options
	 */
	initialize:function(name,url,options){
		options = OpenLayers.Util.applyDefaults(options, 
		  {resolutions:this.resolutions.slice(options.zoomOffset^0)});
		
		OpenLayers.Layer.XYZ.prototype.initialize.apply(this,
		  [name,url,options]);
	},
	
	getURL: function (bounds) {
        var xyz = this.getXYZ(bounds);
        var url = this.url;
        if (OpenLayers.Util.isArray(url)) {
            var s = '' + xyz.x + xyz.y + xyz.z;
            url = this.selectUrl(s, url) + this.urlTpl;
        }
        
        return OpenLayers.String.format(url, xyz);
    },
	
	destory:function(){
	   this.zOffset = null;
	   this.urlTpl = null;
	   OpenLayers.Layer.XYZ.prototype.destroy.apply(this, arguments);
	},

	clone:function(obj){
		if(obj == null){
			obj = new OpenLayers.Layer.PGisLayer(this.name,this.url,
			 this.getOptions());
		}

		obj = OpenLayers.Layer.XYZ.prototype.clone.apply(this,[obj]);

		return obj;
	},

	getXYZ:function(bounds){
		var res = this.getServerResolution();
        var x = Math.round((bounds.left - this.maxExtent.left) /
           (res * this.tileSize.w));

        var y = Math.round((bounds.top - this.maxExtent.bottom) /
           (res * this.tileSize.h)) - 1;//-1!

        var z = this.getServerZoom();//继承自Grid

        if (this.wrapDateLine) {
            var limit = Math.pow(2, z);
            x = ((x % limit) + limit) % limit;
        }

        return {'x': x, 'y': y, 'z': z, 'f':this.zOffset};
	},

	CLASS_NAME: "OpenLayers.Layer.PGisLayer"
});