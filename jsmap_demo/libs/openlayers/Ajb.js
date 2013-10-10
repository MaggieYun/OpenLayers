(function($){
    $.fn.Ajb = function(callback, options){
        if($.fn.Ajb.exist){
            alert(1);
            return;
        }
        
        $.fn.Ajb.exist = true;
        
        var element = $(this), self = this;
        
        (function(self){
            var scripts = document.getElementsByTagName("script");
            for(var i=0;i<scripts.length;i++){
                var src = scripts[i].src;
                var re = /Ajb.js$/;
                var search = src.match(re);
                if(search){
                    self.baseurl = src.replace(re,"");
                    break;
                }
            }
        })(this);
        
        (function(self){
            var swfHTML;
            if(navigator.appName === "Microsoft Internet Explorer"){
                swfHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="5" height="5" id="AJB">'+
                        '<param name="movie" value="{swf}" />';
            }else{
                swfHTML =  '<object  type="application/x-shockwave-flash" data="{swf}" width="5" height="5" id="AJB">';
            }
            swfHTML += '<param name="quality" value="high" />'+
                        '<param name="bgcolor" value="#ffffff" />'+
                        '<param name="wmode" value="opaque" />'+
                        '<param name="allowScriptAccess" value="always" />'+
                        '<param name="allowFullScreen" value="true" />'+
                        '</object>';
            
            element.append(swfHTML.replace(/{swf}/g,self.baseurl+"Ajb.swf"));
        })(this);
        
        //全局方法 Ajb.swf加载完成后，会调用此方法，进而触发用户传入callback函数
        __Ajb = function(){
            element.trigger('loaded');  
            callback.call(self);
        };
        
        return this;
    };
    
    $.fn.Ajb.exist = false;
    
})(jQuery);


/**
 * Socket类
 * @class
 */
Socket = function(args) {
    /**
     * 主机地址
     * 
     * @type String
     * @default null
     */
    this.host = Ao.attr(args, "host");
    /**
     * 端口
     * 
     * @type Number
     * @default 0
     */
    this.port = Ao.attr(args, "port", 0);
    /**
     * socket
     */
    this.socket = Ao.$("flash.net.Socket");
    /**
     * 接受到数据后的回调
     * 
     * @type Function
     */
    this.databack = Ao.attr(args, "databack");
    /**
     * line数据
     * @type Function
     */
    this.lineback = Ao.attr(args,"lineback");
    /**
     * 数据分割符,默认为"\r\n"
     * @type String
     */
    this.lineSuffix = Ao.attr(args,"lineSuffix","\r\n");
    /**
     * 数据分割符,默认为"utf-8"
     * @type String
     */
    this.charSet = Ao.attr(args,"charSet","utf-8");
    /**
     * 连接错误回调包括ioError和securityError
     * 
     * @type Function
     */
    this.errback = Ao.attr(args, "errback");
    /**
     * 连接成功后的回调
     * 
     * @type Function
     */
    this.connback = Ao.attr(args, "connback");
    /**
     * 连接关闭后的回调
     * 
     * @type Function
     */
    this.closeback = Ao.attr(args, "closeback");
};
/**
 * 建立连接
 * 
 * @return void
 */
Socket.prototype.connect = function() {
    
    var buffer = "";
    var onEvent = function(e) {
        console.log(e)
    };
    
    if(this.closeback)
        this.socket.addEventListener("close", this.closeback);
    if(this.connback)
        this.socket.addEventListener("connect", this.connback);
    if(this.errback){
        this.socket.addEventListener("ioError", this.errback);
        this.socket.addEventListener("securityError", this.errback);
    }
    
    var self = this;
    this.socket.addEventListener("socketData", function(e) {
                while (this.attr("bytesAvailable")) {
                    var aMsg = [];
                    while (this.attr("bytesAvailable")) {
                        aMsg.push(this.readMultiByte(this
                                        .attr("bytesAvailable"), self.charSet));
                    }
                    if(self.databack){
                        self.databack.call(null,aMsg.join(""));
                    }
                    if(self.lineback){
                        buffer += aMsg.join("");
                        var a = buffer.split(new RegExp(self.lineSuffix,"g"));
                        var len = a.length;
                        buffer =  a.splice(len-1);
                        for(var i=0;i<a.length;i++){
                            self.lineback.call(null,a[i]);
                        }
                    }
                }
            });
    this.socket.connect(this.host, this.port);
};
/**
 * 关闭连接
 * 
 * @return void
 */
Socket.prototype.close = function(args) {
    this.socket.close();
};
/**
 * 发送数据
 * 
 * @return void
 */
Socket.prototype.send = function(args) {
    var bMsg = Ao.$("flash.utils.ByteArray");
    bMsg.writeUTFBytes(args);
    this.socket.writeBytes(bMsg);
    this.socket.flush();
};