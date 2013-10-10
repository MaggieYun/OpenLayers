/**
 * @author 刘荣涛
 * 2013.6.16
 */
OpenLayers.Layer.ExDyLayer2 = OpenLayers.Class(OpenLayers.Layer.Grid,{
    
	singleTile: true,
    ratio: 1,
    wrapDateLine: true,
    
    url:null,
    where:null,//是否有where条件用于export
    
    features:[],
    
    initialize: function(name, url, options) {
    	OpenLayers.Layer.Grid.prototype.initialize.apply(this, [
            name || this.name, url || this.url, {}, options
        ]);	
    	
        this.where = options['where']||'1=2';
        
    	this.exp = {
    	    where: this.where
    	};
    	this.features = [];
    },
	
    destroy: function(){
    	OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments); 
    	this.exp = null;
    	this.features = null;
    },
    
	getURL: function (value) {
	    if(!this.sr){
	        this.exp['inSR']  = this.map.projection.split(':')[1];
	        this.exp['outSR'] = this.exp['inSR'];
	    }
	    
        var bounds = this.adjustBounds(value);
        var bbox = bounds.left + "," + bounds.bottom + "," + bounds.right + "," + bounds.top;
        var size = this.getImageSize();
        
        this.exp['bbox'] = bbox;
        this.exp['size'] = size.w + "," + size.h;
       
        var url = this.url + "export?" + this.gen_get_param(this.exp);
        
        this.query();
        
        return url;
    },
    
    gen_get_param: function(data){
        var r = [];
        for(var key in data){
            var val = data[key];
            if(typeof val !== 'function' && typeof val !== 'object'){
                r.push(key + '=' + val);
            }
        }
        return r.join('&');
    },
    
    query:function(){
    	if(this.jsonLoading){
    		return;
    	}
    	
    	this.jsonLoading = true;
    	
    	this.features = [];
    	
    	var url = this.url + "query?" + this.gen_get_param(this.exp);
    	
    	$.ajax({
    	    url: url,
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

                    this.features.push({
                        geometry: pnt,
                        attributes: attributes
                    });
                }
                
                this.events.triggerEvent('featurtesloaded', {features: this.features});
    	    }
    	});
    },
	
    setWhere: function(val){
        this.where = val;
        this.exp['where'] = val;
        this.redraw();
    },
    
	CLASS_NAME: "OpenLayers.Layer.ExDyLayer2"
});
