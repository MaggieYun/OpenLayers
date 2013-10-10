var parall = function(path,val,toke){
	var geographic = new OpenLayers.Projection("EPSG:4326");
	var mercator =  new OpenLayers.Projection("EPSG:102113");
	if(MAP_SR == '4326'){
		for(var i =0;i<path.length;i++){
			path[i].transform(geographic,mercator);
		}
	}
	var p0 = null,p1 = null,p2 = null,line0,line1,parall0,parall1,pnt,pnt_temp,st_temp,ed_temp;
    if (val == 0){
        return {'path':path
//        	'attributes':token
        	};
    }
    var st = [];
    var ed = [];
    var paralls = [];
    if(path.length == 2){
        var line = getLineFormula(path[0],path[1]);
        st_temp = offPoint(path[0],line[0],val);
        ed_temp = offPoint(path[1],line[0],val);
        
        st = new OpenLayers.Geometry.Point(st_temp[0],st_temp[1]);
        ed = new OpenLayers.Geometry.Point(ed_temp[0],ed_temp[1]);
        
        return {'path':[st,ed]
//        	'attributes':token
        	};
    }
    for(var i=0;i<path.length-2;i++){
        p0 = path[i];
        p1 = path[i+1];
        p2 = path[i+2];
        line0 = getLineFormula(p0,p1);
        line1 = getLineFormula(p1,p2);
        parall0 = getBuffLine(line0,val);
        parall1 = getBuffLine(line1,val);
        pnt_temp = getLinesIntersection(parall0,parall1);
        pnt = new OpenLayers.Geometry.Point(pnt_temp[0],pnt_temp[1]);
        if(pnt != null){
            paralls.push(pnt);
        }else{
            continue;
        }  
    }
    var line_temp = null,line_temp2 = null;
    line_temp1 = getLineFormula(path[0],path[1]);
    line_temp2 = getLineFormula(path[path.length-2],path[path.length-1]);
    if(path[1].x - path[0].x < 0){
        st_temp = offPoint(path[0],line_temp1[0],-val);
    }else{
        st_temp = offPoint(path[0],line_temp1[0],val);
    }
    if(path[path.length-1].x - path[path.length-2].x < 0){
        ed_temp = offPoint(path[path.length-1],line_temp2[0],-val);
    }else{
    	ed_temp = offPoint(path[path.length-1],line_temp2[0],val);
    }
    st = new OpenLayers.Geometry.Point(st_temp[0],st_temp[1]);
    ed = new OpenLayers.Geometry.Point(ed_temp[0],ed_temp[1]);
    paralls.unshift(st);
    paralls.push(ed);
    if(MAP_SR == '4326'){
		for(var i =0;i<paralls.length;i++){
			paralls[i].transform(mercator,geographic);
		}
		for(var i =0;i<path.length;i++){
			path[i].transform(mercator,geographic);
		}
	}
    var result = null;
    result = {'path':paralls
//    			'attributes':token
    			};
    return result;
};

var getLineFormula = function(p0,p1){
	var k = null,b=null,xx =null;
	p0.x = parseFloat(p0.x);
	p0.y = parseFloat(p0.y);
	p1.x = parseFloat(p1.x);
	p1.y = parseFloat(p1.y);
	
    if(p0.x != p1.x){
        k = (p0.y - p1.y)/(p0.x - p1.x);
        b = p0.y - k * p0.x;
    }else{
        k = null;
        b = p0.x;
    }
    xx = [p1.x-p0.x,p1.y-p0.y];
    var line =null;
    line = [k,b,xx];
    return line;

};

var getBuffLine = function(line,bufVal){
	var k = null,b = null;
    if(line[2][0] > 0){
        bufVal = - bufVal;
    }
    k = line[0];

    if(k == null){
        b = line[1] + bufVal;
    }else{
        b = bufVal * Math.sqrt(1 + k * k) + line[1];
    }
    var result = null;
    result = [k,parseFloat(b)];
    return result;
};

var getLinesIntersection =function(line0,line1){
    if(line0[0] == null && line1[0] == null){
        return null;
    }else if(line0[0] == null){
        var x = line0[1];
        var y = line1[0] * x + line1[1];
        return [x,y];
    }else if(line1[0] == null){
        var x = line1[1];
        var y = line0[0] * x + line0[1];
        return [x,y];
    }else if(line0[0] == line1[0]){
        return null;
    }
    var x = (line1[1] - line0[1])/(line0[0] - line1[0]);
    var y = line1[0] * x + line1[1];
    var result = null;
    result = [x,y];
    return result;
};

var offPoint = function(pnt,k,val){
	var off_x = null;
	var off_y = null;
    val = 2 * val;
    if(k == null){
        off_x = val;
        off_y = 0;
    }else{
        off_x = k * val / Math.sqrt(1 + k*k);
        off_y = val/Math.sqrt(1 + k*k);
    }
    var result = null;
    result = [pnt.x+parseFloat(off_x)/2,pnt.y-parseFloat(off_y)/2];
    return result;
};
