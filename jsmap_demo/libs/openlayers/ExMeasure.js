//openlayers的方式
OpenLayers.Control.ExMeasure = OpenLayers.Class(OpenLayers.Control.Measure, {
    
    button1:$('<li>').html('量测长度').attr('id',1),
    button2:$('<li>').html('量测面积').attr('id',2),
    
    ul:null,

    autoSize: true,
    /**
     * APIProperty: types
     * {array} 该参数用来配置该控件实例包含的功能的种类数量，默认全部加载
     * 合法的值为1到2之间任意组合成的数组
     */
    
    types:[1,2],
    
    /**
     * APIProperty: persist
     * {Boolean} Keep the temporary measurement sketch drawn after the
     *     measurement is complete.  The geometry will persist until a new
     *     measurement is started, the control is deactivated, or <cancel> is
     *     called.
     */
    persist: true,
    
    /**
     * APIProperty: suffix
     * {string} 单位
     */
    suffix: '',
    
    /**
     * APIProperty: popupBgColor
     * {string} 用于设置弹出框的背景颜色
     */
    popupBgColor:"#BBBBBB",
    
    /**
     * APIProperty: popupOpacity
     * {float} 用于设置弹出框的透明度
     */
    popupOpacity:0.8,
    
    /**
     * APIProperty: handler
     * {string} 当前正被激活的handler
     */
    handler: null,
    
    /**
     * APIProperty: callback
     * {function} 特别注意，不同于callbacks，该回调函数用在结束测量时可以添加的逻辑
     * 后来修改后在量测中间也会触发
     */
    callback:null,
    
    measure_pop_array:[],//存储测量时所有弹出的popup
    
    //定义量测控件样式（测量时绘制出的点、线、面的样式）
    sketchSymbolizers: {
            "Point": {
                pointRadius: 4,
                graphicName: "circle",
                fillColor: "white",
                fillOpacity: 1,
                strokeWidth: 1,
                strokeOpacity: 1,
                strokeColor: "red"
            },
            "Line": {
                strokeWidth: 2,
                strokeOpacity: 1,
                strokeColor: "red",
                strokeDashstyle: "dash"
            },
            "Polygon": {
                strokeWidth: 2,
                strokeOpacity: 1,
                strokeColor: "red",
                fillColor: "orange",
                fillOpacity: 0.3
            }
    },
    
    styleMap:null,
    
    /**
     * APIProperty: handlerOptions
     * {Object} Used to set non-default properties on the control's handler
     */
    handlerOptions:null,
    
    /**
     * Constructor: OpenLayers.Control.ExMeasure
     * 
     * Parameters:
     * options - {Object} 
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        var style = new OpenLayers.Style();
        style.addRules([
            new OpenLayers.Rule({symbolizer: this.sketchSymbolizers})
        ]);
        this.styleMap = new OpenLayers.StyleMap({"default": style});
        
        this.handlerOptions = {
            layerOptions: {
                styleMap: this.styleMap
            }
        };
        
        
        var callbacks = {done: this.measureComplete,
            point: this.measurePartial};
        if (this.immediate){
            callbacks.modify = this.measureImmediate;
        }
        this.callbacks = OpenLayers.Util.extend(callbacks, this.callbacks);

        // let the handler options override, so old code that passes 'persist' 
        // directly to the handler does not need an update
        this.handlerOptions = OpenLayers.Util.extend(
            {persist: this.persist}, this.handlerOptions
        );
        
        this.pathHandler = new OpenLayers.Handler.Path(
                                this,this.callbacks, this.handlerOptions);
        this.polygonHandler = new OpenLayers.Handler.Polygon(
                                this,this.callbacks, this.handlerOptions);
    },
    
    
    
    /**
     * Method: activate
     * Activates the control.
     * Parameters:
     * 1或2
     * Returns:
     * {Boolean} The control was effectively activated.
     */
    activate: function (type) {
        OpenLayers.Control.Measure.prototype.activate.apply(this, arguments);
        
        this.deactivate();
        
        switch (type) {
            case 1:
                this.pathHandler.activate();
                this.handler = this.pathHandler;
                this.suffix = '';
                break;
            case 2:
                this.polygonHandler.activate();
                this.handler = this.polygonHandler;
                this.suffix = '2';//暂且表示平方
                break;

            default:
                this.pathHandler.activate();
                this.handler = this.pathHandler;
                this.suffix = '';
                break;
        }
        return OpenLayers.Control.prototype.activate.apply(
            this, arguments
        );
    },
    
    /**
     * APIMethod: deactivate
     */
    deactivate: function() {
        OpenLayers.Control.Measure.prototype.deactivate.apply(this, arguments);
        if (this.active) {
            this.pathHandler.deactivate();
            this.polygonHandler.deactivate();
        }
        
        var popup_len = this.measure_pop_array.length;  //以防有时popup来不及创建造成的错误
        for(var i = 0; i<popup_len; i++){
            this.map.removePopup(this.measure_pop_array[i]);
        };
        
        this.cancelDelay();
        return OpenLayers.Control.prototype.deactivate.apply(this, arguments);
    },
    
    setMap: function(map) {
         OpenLayers.Control.prototype.setMap.apply(this,arguments);
         //自定义
         this.pathHandler.setMap(map);
         this.polygonHandler.setMap(map);
    },
    
  
    measure:function(geometry, eventType){
//      OpenLayers.Control.Measure.prototype.measure.apply(this,arguments);
        
        var stat, order;
        if(geometry.CLASS_NAME.indexOf('LineString') > -1) {
            stat = this.getBestLength(geometry);
            order = 1;
        } else {
            stat = this.getBestArea(geometry);
            order = 2;
        }
        this.events.triggerEvent(eventType, {
            measure: stat[0],
            units: stat[1],
            order: order,
            geometry: geometry
        });
        
        var map = this.map;

        if(typeof this.callback === 'function'){
                this.callback.call(null,{
                            measure: stat[0],
                            units: stat[1],
                            order: order,
                            geometry: geometry
                });
            }
        
        if(eventType == "measure"){
            
            out = "总计: " + stat[0].toFixed(1) + " " + stat[1]+ this.suffix; 
            
            if (geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
                var points = geometry.components[0].components;
                var n = points.length - 1;
            }
            else if(geometry.CLASS_NAME == "OpenLayers.Geometry.LineString"){
                var points = geometry.components;
                var n = points.length;
            };
            
            
            var myself = this;
            popup1= new OpenLayers.Popup((n-1).toString(),
                new OpenLayers.LonLat(points[n-1].x, points[n-1].y),
                new OpenLayers.Size(120,15),
                out,
                true,
                function(){
                    for(var i = 0; i<popup_len; i++){
                        map.removePopup(myself.measure_pop_array[i]);
                    };
                    myself.handler.destroyPersistedFeature();
                    myself.measure_pop_array = [];//置空
                });
            popup1.contentDiv.style.overflow = "hidden";
            
        
        }else if(eventType == "measurepartial"){
            
            if (geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
                if(stat[0] == 0){
                    var popup_len = this.measure_pop_array.length;  //以防有时popup来不及创建造成的错误
                    for(var i = 0; i<popup_len; i++){
                        map.removePopup(this.measure_pop_array[i]);
                    };
                }
                var points = geometry.components[0].components;
                return;  //量测面积只需显示最终结果，不需中间显示
            }
            else if(geometry.CLASS_NAME == "OpenLayers.Geometry.LineString"){
                var points = geometry.components;
            };

            if(points.length == 2 && geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
                var n = points.length - 1;
            }else if(points.length > 2 && geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
                var n = points.length - 2;
            }else{
                var n = points.length;
            };
            
            if (stat[0] == 0){
                out = "起点";
                var popup_len = this.measure_pop_array.length;  //以防有时popup来不及创建造成的错误
                for(var i = 0; i<popup_len; i++){
                    map.removePopup(this.measure_pop_array[i]);
                };
                
                var popup1= new OpenLayers.Popup((n-1).toString(),
                new OpenLayers.LonLat(points[n-1].x, points[n-1].y),
                new OpenLayers.Size(50,15),
                out,
                false);
            }
            else{
                out = stat[0].toFixed(1) + " " + stat[1]+this.suffix;
                var popup1= new OpenLayers.Popup((n-1).toString(),
                new OpenLayers.LonLat(points[n-1].x, points[n-1].y),
                new OpenLayers.Size(80,15),
                out,
                false);                 
            }   
        }
        popup1.contentDiv.style.overflow = "hidden";  //用于处理google浏览器
        
//        popup1.setBorder("2px");
        
        popup1.setOpacity(this.popupOpacity);
        popup1.setBackgroundColor(this.popupBgColor);
        this.measure_pop_array.push(popup1);
        var popup_len = this.measure_pop_array.length;  //以防有时popup来不及创建造成的错误
        map.addPopup(popup1);
 
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
                    }
                }
            }
            
            $ctl.append(ul);   
            ul.hide();
            ul.delegate('li','click',function(){
                var action = $(this).addClass("activate").attr('id');
                $(this).siblings("li").removeClass("activate");        
                self.activate(parseInt($(this).attr('id')));    
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
    
    setStyle: function(style){
        this.sketchSymbolizers = style;
    },
    
    /**
     * Method: setPopupBackgroundColor  设置弹出框的背景颜色
     * parameters:color {string}  eg "#FFBBBB"
     */
    setPopupBackgroundColor:function(color){
        this.popupBgColor = color;
    },
    
    /**
     * Method: setPopupOpacity  设置弹出框的透明度
     * parameters:opacity {float}  0.0-1.0
     */
    setPopupOpacity:function(opacity){
        this.popupOpacity = opacity;
    },
    
    addCallback: function(callback){
//      this.callbacks = OpenLayers.Util.extend(callback, this.callbacks);
        this.callback = callback;
        
    },

    
    CLASS_NAME: "OpenLayers.Control.ExMeasure"
});

