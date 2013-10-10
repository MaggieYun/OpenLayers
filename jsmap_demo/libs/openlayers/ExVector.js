OpenLayers.Layer.ExVector = OpenLayers.Class(OpenLayers.Layer.Vector,{
    initialize: function(name,options){
        OpenLayers.Layer.Vector.prototype.initialize.apply(
            this, [name,options]);
        this.vectors = [];
    },

    afterAdd: function(){
        OpenLayers.Layer.Vector.prototype.afterAdd.apply(
            this, arguments);
        
        this.fetch();
    },

    moveend: function(){
        this.fetch();
    },

    fetch: function(url){
        url = url || this.url;
        $.getJSON(url,$.proxy(this.onFetch,this));
        return this;
    },

    onFetch:function(data){
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
            //过滤JKLX！='ZAJK'
            if(attributes['JKLX'] != 'ZAJK'){
                continue;
            }
                
            var vector = new OpenLayers.Feature.Vector(pnt,attributes);
            this.vectors.push(vector);
        }
        
        this.removeAllFeatures();
        this.events.triggerEvent('loaded');
    },
    
    exAddFeatures:function(){
    	this.addFeatures(this.vectors);
    }
    
});