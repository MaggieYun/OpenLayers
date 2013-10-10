OpenLayers.Control.DyLayerSelect = OpenLayers.Class(
    OpenLayers.Control.Button, 
    {
        type: OpenLayers.Control.TYPE_TOOL,
        
        _t: null,
        
        initialize: function (layer, options) {
            OpenLayers.Util.extend(this, options);
            
            OpenLayers.Control.prototype.initialize.apply(this,[options]);
            
            this.layer = layer;
            
            if(!this.targets){
                this.targets = [];
            }
            
            if (!(OpenLayers.Util.isArray(this.targets))) {
                this.targets = [this.targets];
            }
            
        },
        
        setMap: function(map) {
            OpenLayers.Control.prototype.setMap.apply(this,arguments);
            this.initTip();
        },
        
        initTip: function(){
            this.tip = OpenLayers.Util.createDiv(this.id);
            this.tip.className = 'feature-tip';
            this.tip.setAttribute("unselectable", "on", 0);
            this.tip.onselectstart = OpenLayers.Function.False;
            this.map.viewPortDiv.appendChild(this.tip);
        },
        
        hover: function(){
            var arg = arguments, self = this;
            self.currentFeature = null;
            self.tip.style.display = 'none';
            this.map.viewPortDiv.style.cursor = 'default';
            clearTimeout(this._t);
            this._t = setTimeout(function(){
                for(var j=0,l = self.targets.length; j < l; j++){
                    var layer = self.targets[j];
                    for(var i =0,size = layer.features.length;i<size;i++){
                        var feature = layer.features[i], geom = feature.geometry;
                        if(!feature.lonlat){
                            feature.lonlat = new OpenLayers.LonLat([geom.x, geom.y]);
                        }
                        var pixel = self.map.getPixelFromLonLat(feature.lonlat);
                        var m = arg[0].xy;
                        if(Math.abs(pixel.x - m.x) > 5 || Math.abs(pixel.y - m.y) > 5){
                            continue;
                        }
                        self.map.viewPortDiv.style.cursor = 'pointer';
                        
                        self.currentFeature = new OpenLayers.Feature.Vector(feature.geometry,feature.attributes);
                        self.currentFeature.style = OpenLayers.Feature.Vector.style['SELECT'];
                        self.currentFeature.guid = feature.geometry.x + '-' + feature.geometry.y;
                        self.tip.style.left = (pixel.x + 10) + 'px';
                        self.tip.style.top = (pixel.y - 10) + 'px';
                        self.tip.innerHTML = feature.attributes.TIP||'空';
                        self.tip.style.display = 'block';
                    }
                }
            },200);
        },
        
        click: function(){
            var ft = this.currentFeature;
            
            if(!ft) return;
            
            this.map.events.triggerEvent('feature:click', {feature: ft});
            
            var guid = ft.geometry.x + '-' + ft.geometry.y;
            
            var exsit = this.layer.getFeatureBy('guid',guid);
            
            if(exsit){
                this.layer.removeFeatures([exsit]);
                return;
            }
            
            if(ft){
                this.layer.addFeatures([ft]);
            }
        },
        
        activate: function(){
            OpenLayers.Control.prototype.activate.apply(this);
            this.map.events.register('mousemove', this, this.hover);
            this.map.events.register('click', this, this.click);
        },
        
        deactivate: function(){
            OpenLayers.Control.prototype.deactivate.apply(this);
            this.map.events.unregister('mousemove', this, this.hover);
            this.map.events.unregister('click', this, this.click);
        },
        
        setTargets: function(targets){
            this.targets = targets;
        },
        
        CLASS_NAME: "OpenLayers.Control.DyLayerSelect"
    }
);

OpenLayers.Control.ExSelectFeature2 = OpenLayers.Class(
    OpenLayers.Control.Panel, {
    
    buffer: 100,
    initialize: function(layer, options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
        
        this.resultLayer =  layer;
        
        var layer = this.vector = new OpenLayers.Layer.Vector("edit",{displayInLayerSwitcher:false});
        
        var reader = new jsts.io.WKTReader();
        var parser = new jsts.io.OpenLayersParser();
        
        var onFeatureadded = function(event){
            
            this.activateControl(this.dySelCtl);
            
            //删除结果图层上的数据
            this.resultLayer.removeAllFeatures();
            layer.removeAllFeatures();
            layer.addFeatures([event.feature],{silent:true});
            
            var filter = reader.read(event.feature.geometry.toString()),features=[],buffer=null;
            
            if(filter.CLASS_NAME !== 'jsts.geom.Polygon'){
                filter = filter.buffer(0.0000106 * this.buffer);
                buffer = new OpenLayers.Feature.Vector(parser.write(filter));
                layer.addFeatures([buffer],{silent:true});
            }
            
            this.targets.forEach(function(layer){
                for(var i = 0, size = layer.features.length; i < size; i++){
                    var ft = layer.features[i];
                    if(filter.contains(reader.read(ft.geometry.toString()))){
                        var feature = new OpenLayers.Feature.Vector(ft.geometry,ft.attributes);
                        feature.style = OpenLayers.Feature.Vector.style['SELECT'];
                        feature.guid = ft.geometry.x + '-' + ft.geometry.y;
                        features.push(feature);
                    }
                }
            });
            
            this.resultLayer.addFeatures(features);
        };
        
        layer.events.register('featureadded', this, onFeatureadded);
        
//        this.addControls(
//          [ new OpenLayers.Control.Navigation() ]
//        ); 
        
        this.dySelCtl =  new OpenLayers.Control.DyLayerSelect(this.resultLayer,{
            displayClass: 'olControlDrawFeaturePoint'
        });
        
        this.pathCtl = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Path, {
            displayClass: 'olControlDrawFeaturePath',
            handlerOptions: {citeCompliant: this.citeCompliant}
        });
        
        this.polygonCtl = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Polygon, {
            displayClass: 'olControlDrawFeaturePolygon',
            handlerOptions: {citeCompliant: this.citeCompliant}
        });
        
        var controls = [
            this.dySelCtl,
            this.pathCtl,
            this.polygonCtl
//            ,new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.RegularPolygon, {
//                displayClass: 'olControlDrawFeatureRegularPolygon',
//                handlerOptions: {citeCompliant: this.citeCompliant,sides: 4}
//            })
        ];
        
        this.addControls(controls);
    },
    
    setTargets: function(targets){
        this.targets = targets;
        this.dySelCtl.setTargets(targets);
    },
    
    setMap: function(map){
        OpenLayers.Control.Panel.prototype.setMap.apply(this, arguments);
        map.addLayer(this.vector);
        map.setLayerIndex(this.vector, 0);
    },
    
    draw: function() {
        var div = OpenLayers.Control.Panel.prototype.draw.apply(this, arguments);
        if (this.defaultControl === null) {
            this.defaultControl = this.controls[0];
        }
        return div;
    },

    CLASS_NAME: "OpenLayers.Control.EditingToolbar"
});    
