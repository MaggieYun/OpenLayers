(function($){
    var Ol = OpenLayers;//简化
    
    $.fn.iMap = function(options){
        var el = $(this), self = this, dom = el.get(0), map = null, layers = [],
            bases = options.bases || [], 
            extent =  options.extent ;
        
        for(var i = 0, size = bases.length; i < size; i++){
            var op = bases[i], url = null, layer = null;
            if(op.indexOf('pgis@') === 0){
                url = op.split('@');
                layer = new Ol.Layer.PGisLayer("pgis" + i,  [ url[1] ], {
                            zoomOffset : 4
                        });
            }else if(op.indexOf('gmap@') === 0){
                url = op.split('@');
                layer = new Ol.Layer.GMapLayer('gmap' + i, [url[1]]);
            }
            layers.push(layer);
        }
        
        //OpenLayers.Map对象引用
        this.map = map = new Ol.Map(dom, {
            layers: layers/*,
            projection: "EPSG:"+MAP_SR*/
        });
        
        map.zoomToExtent(extent); // 地图范围
        
        this.clientLayer = new Ol.Layer.Vector("client",{displayInLayerSwitcher:false});
        
        this.clientLayer.events.register('featureremoved', this, function(){
            el.trigger('feature:unselected',arguments);
        });
        
        this.clientLayer.events.register('featureadded', this, function(){
            el.trigger('feature:selected',arguments);
        });
        
        map.events.register('feature:click', this, function(){
            el.trigger('feature:click',arguments);
        });
        
        this.exSelector = new Ol.Control.ExSelectFeature2(this.clientLayer);
        
        var onChange = function(event){
            var val = parseInt($(this).val());
            self.exSelector.buffer = isNaN(val) ? this.buffer : val;
            
        };
        
        this.bufferInput = $('<input>').addClass('buffer-input').appendTo($(map.viewPortDiv)).keyup(onChange).click(function(event){
            self.exSelector.pathCtl.deactivate();
            self.exSelector.pathCtl.activate();
            setPOS($(this).get(0), 100);
        });
        
        var onActive = function(){
            this.bufferInput.show().val(this.exSelector.buffer);
        };
        
        this.exSelector.pathCtl.events.register('activate', this, onActive);
        
        var onDeactive = function(){
            this.bufferInput.hide();
        };
        
        this.exSelector.pathCtl.events.register('deactivate', this, onDeactive);
        
        map.addControls([this.exSelector, new Ol.Control.MousePosition()]);
        
        map.addLayer(this.clientLayer);
        
        this.addLayer = function(options){
            var layer = new Ol.Layer.ExDyLayer2('dylayer' + map.layers.length ,options.url,options);
            map.addLayer(layer);
            map.setLayerIndex(this.clientLayer,map.layers.length-1);
            
            if(!this.exSelector.targets){
                this.exSelector.targets = [];
            }
            var targets = this.exSelector.targets;
            targets.push(layer);
            
            this.exSelector.setTargets(targets);
            
            return layer;
        };
        
        var popup = null;
        
        this.showTip = function(feature, html){
            if(!html) return;
            if(popup){
                popup.destroy();
            }
            popup = new Ol.Popup.FramedCloud("popup",
                Ol.LonLat.fromString(feature.geometry.toShortString()),
                null,
                html,
                null,
                true
            );
            map.addPopup(popup);
        };
        
        this.centerAt = function(){
            map.setCenter.apply(map,arguments);
        };
        
        this.Vector = function(name, options){
            var client = new OpenLayers.Layer.Vector(name, options);
            map.addLayer(client);
            return client;
        };
        
        this.Feature = function(g, a, s){
            return new OpenLayers.Feature.Vector(g, a, s);
        };
        
        this.getWhereFromClientLayer = function(where, key){
            var ids = [], features  = this.clientLayer.features, len = features.length,where = where||'';
            
            if(len > 0){
                features.forEach(function(feature){
                    var val = feature.attributes[key];
                    if(val){
                        ids.push('\'' + val + '\'' );
                    }
                });
                
                if(ids.length > 0){
                    where = '(' + where + ') or ' + key +' = ' + ids.join(' or '+ key +' = ');
                }
            }
            return where;
        };
        
        return this;
    };
    
    $.fn.iMap.defaults = {
    };
    
    
    var OLFV = Ol.Feature.Vector;
    
    //用于被选中元素
    OLFV.style['SELECT'] = $.extend({}, OLFV.style['default'],
        {
            strokeColor: "#00FF00",
            fillOpacity: 0.4, 
            pointRadius: 8,
            strokeWidth: 2
        }
    );
    
    //用于量距
    OLFV.style['MEASURE'] = $.extend({}, OLFV.style['default'],
        {
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: "#666666",
            strokeDashstyle: "dash"
        }
    );
    
})(jQuery);

(function($){
    $.fn.layerToggle = function(map){
        var element = $(this), mp = map, layers = mp.layers, len = layers.length,bases = [], j = 0,
            onClick = function(){
                element.toggleClass('on-wx');
                j++;
                mp.setBaseLayer(bases[(bases.length + j)%bases.length]);
            };
            
        for(var i = 0; i < len; i++){
            var lyr = layers[i];
            if(lyr.isBaseLayer){
                bases.push(lyr);
            }
        }
//        i++;
        element.addClass('on-ditu').bind('click', onClick);
    };
})(jQuery);

Array.prototype.forEach = function(callback) {
    for( var i = 0; i < this.length; i++) {
        callback.call(this, this[i], i, this);
    }
};

function setPOS(ctrl, pos){//设置光标位置函数
    if(ctrl.setSelectionRange)
    {
        ctrl.focus();
        ctrl.setSelectionRange(pos,pos);
    }
    else if (ctrl.createTextRange) {
        var range = ctrl.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
};