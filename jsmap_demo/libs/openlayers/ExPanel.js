/**
 * OpenLayers.Control.ExPanel类
 * @author 许照云
 * 2013.5
 */
OpenLayers.Control.ExPanel = OpenLayers.Class(OpenLayers.Control.Panel,{  
    /**
     * Method: onButtonClick
    *
    * Parameters:
    * evt - {Event}
    */
   onButtonClick: function (evt) {
	   OpenLayers.Control.Panel.prototype.onButtonClick.apply(this,arguments);
	   
	   var controls = this.controls,
       button = evt.buttonElement;
	   
	   //查找该panel上的控件是否有ul属性
	   var ctlsHasUl = [];
	   for (var i=controls.length-1; i>=0; --i) {
		   if(controls[i].ul){ //若该控件存在ul属性
			   ctlsHasUl.push(controls[i]);
		   }
	   }
	   
	   //以下逻辑用于判断panel上被激活的控件是否有ul属性，有则显示ul
	   for (var i=controls.length-1; i>=0; --i) {
		   if (controls[i].panel_div === button) {
			   if(controls[i].ul){
				   controls[i].ul.show();
			   }

			   for(var j=ctlsHasUl.length-1; j>=0; --j){
				   if(ctlsHasUl[j] != controls[i]){
					   ctlsHasUl[j].ul.hide();
				   }
			   }			   
			   break;
	       }
	   } 
	   

   }
});