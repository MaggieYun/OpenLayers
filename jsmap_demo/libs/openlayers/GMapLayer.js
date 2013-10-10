/* Copyright (c) 2002-2012 by Yhte*/

/**
 * @requires OpenLayers/Layer/XYZ.js
 */

/**
 * @class
 */
OpenLayers.Layer.GMapLayer = OpenLayers.Class(OpenLayers.Layer.XYZ, {
    wrapDateLine:true,
    sphericalMercator:true,
    
    urlTpl:"/L${z}/R${y}/C${x}.png",
    
    /**
     * @constructor
     * @param {String} name
     * @param {String} url
     * @param {Object} options
     */
    initialize:function(name,url,options){
        options = OpenLayers.Util.applyDefaults({}, 
          options);
        
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this,
          [name,url,options]);
    },
    
    getURL: function (bounds) {
        var xyz = this.getXYZ(bounds),
            url = this.url;
        
        if (OpenLayers.Util.isArray(url)) {
            var s = '' + xyz.x + xyz.y + xyz.z;
            url = this.selectUrl(s, url) + this.urlTpl;
        }
        xyz.x = xyz.x.toString(16);
        xyz.y = xyz.y.toString(16);
        return OpenLayers.String.format(url, xyz);
    },
    
    destory:function(){
       this.sphericalMercator = null;
       this.urlTpl = null;
       OpenLayers.Layer.XYZ.prototype.destroy.apply(this, arguments);
    },

    clone:function(obj){
        if(obj == null){
            obj = new OpenLayers.Layer.GMapLayer(this.name,this.url,
                this.getOptions());
        }

        obj = OpenLayers.Layer.XYZ.prototype.clone.apply(this,[obj]);

        return obj;
    },

    getXYZ:function(bounds){
        var res = this.getServerResolution(),
            x = Math.round((bounds.left - this.maxExtent.left) /
                (res * this.tileSize.w)),
            y = Math.round((this.maxExtent.top - bounds.top) /
                (res * this.tileSize.h)),
            z = this.getServerZoom();//继承自Grid

        if (this.wrapDateLine) {
            var limit = Math.pow(2, z);
            x = ((x % limit) + limit) % limit;
        }

        return {'x': x, 'y': y, 'z': z};
    },

    CLASS_NAME: "OpenLayers.Layer.GMapLayer"
});