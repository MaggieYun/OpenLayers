/**
 * GeoSetup坐标设置单例类
 * 
 * @namespace
 * @author zhangxiaoying
 *@example
 *          GeoSetup.setLocation("SZ","GMAP");
 *          GeoSetup.getExtent();
 *          GeoSetup.getCenter();
 */
var GeoSetup = (function() {
    /**
     * @private 私有静态变量 存储所有投影 GMAP
     */
    var store = {
        "320200" : [13374569, 3698392, 13410953, 3715361],// 无锡
        "320683" : [13460179, 3763368, 13496563, 3780337],// 南通通州
        "469005" : [12317368, 2209898, 12353752, 2226867],// 海南文昌
        "320500" : [13414558, 3664736, 13440031, 3676201],// 苏州
        "BS" : [12183009, 2180851, 12185283, 2181911],// 海南白沙
        "321100" : [13278719, 3779552, 13315103, 3796521],// 镇江
        "321000" : [13268229, 3801210, 13321314, 3828154],// 扬州
        "320282" : [13327477, 3673111, 13349090, 3686832],// 宜兴
        "FX" : [13509627, 3614728, 13536170, 3628200],// 上海奉贤
        "JL" : [14063692, 5429331, 14116777, 5456275]// 吉林市

    };
    /**
     * @private 地理坐标，经度范围[-180,180]，纬度范围：[-90,90]；
     */
    var pgis = "PGIS";
    /**
     * @private 投影坐标，经度范围：[-20037508.342787 ,20037508.342787 ]，
     *          纬度范围：[-20037508.342787 ,20037508.342787 ]；
     */
    var gmap = "GMAP";
    /**
     * @private 坐标系统
     */
    var corSystem = null;
    /**
     * @private 地区名
     */
    var location;
    /**
     * @private 
     */
    var a = 20037508.34;
    /**
     * @private 私有静态变量 地理范围坐标
     */
    var extent = null;
    /**
     * @private 私有静态变量 地理中心
     */
    var center = null;
    /**
     * @private 检查参数
     */
    var checkArgs = function(args) {
        // 如果参数数量不足
        if (args.length !== 2) {
            alert("参数不符合要求" + '参数形式应该如：("SZ","GMAP")');
            return false;
        }
        if (args.length === 2) {
            // 如果不存在传入地区的数据
            if (!store.hasOwnProperty(args[0])) {
                alert("不存在该地区信息");
                return false;
            }
            return true;
        }
    };
    return {
        /**
         * 获取当前坐标系
         * @return {int} 
         */
        getSR: function(text){
            if(text){
                return (corSystem === pgis) ? 'PGIS' : 'GMAP';
            }
            return (corSystem === pgis) ? '4326' : '102113';
        },
        /**
         * 设定坐标系统 
         * @param {String} cordSystem 坐标系统
         */
        setSR : function(sr) {
            // 如果参数数量不对
            if (arguments.length !== 1) {
                alert("setSR()方法传函数输错误");
                return false;
            }
            // 如果坐标类型不是pgis 也不是gmap
            if (sr !== pgis && sr !== gmap) {
                alert("不存在坐标类型，请检查是否输入错误");
                return false;
            }

            corSystem = sr;
            extent = store[location];
            center = [0.5 * (extent[0] + extent[2]),
                    0.5 * (extent[1] + extent[3])];
            if (corSystem === pgis) {
                // GMAP转换为PGIS
                var a = this.toLL(extent[0], extent[1]);
                var b = this.toLL(extent[2], extent[3]);
                extent = [a.x, a.y, b.x, b.y];
                center = [0.5 * (extent[0] + extent[2]),
                        0.5 * (extent[1] + extent[3])];
            }
        },
        /**
         * 设定地区
         * 
         * @param {String}
         *            locatn 地区
         * @param {String}coordSystem 坐标系统
         *            cordSystem 坐标系 已存在的地区及其名称简写 无锡--"WX" 南通通州--"TZ"
         *            海南文昌--"HNWC" 苏州--"SZ" 海南白沙--"BS" 上海奉贤--"FX" 镇江--"ZJ"
         *            扬州--"YZ" 吉林--"JL"
         */
        setLocation : function(locatn, sr) {
            if (!checkArgs(arguments)) {
                return;
            }
            location = locatn;
            this.setSR(sr);
            return this;
        },
        /**
         * 获得范围
         * 
         * @return {Array} extent 地理范围
         */
        getExtent : function() {
            return extent;
        },
        /**
         * 获得中心点
         * 
         * @return {Array} center 中心点坐标
         */
        getCenter : function() {
            return center;
        },
        /**
         * 地理坐标转投影坐标
         * 
         * @param {Number}
         *            x 经度
         * @param {Number}
         *            y 纬度
         * @return {Object} 投影坐标
         */
        toMC : function(x, y) {
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
        toLL : function(x, y) {
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
    };
})();
