/// <reference path="jquery.d.ts" />
/// <reference path="google.maps.d.ts"/>
class Searcher{
	private geocoder = new google.maps.Geocoder();
	constructor(private zoneMap: ZoneMap){

	}
	searchPlaces(){
		$("#loading").fadeIn("quick");
        if($('[name=address]').val()){
            this.codeAddress();
        }else{
            this.fetchPlaces();
        }
        $("#loading").fadeOut("quick");
	}
	codeAddress(){
		var address = document.getElementById('address_searched').value;
    	var geocoder = new google.maps.Geocoder();
    	var self: Searcher = this;
    	geocoder.geocode( { 'address': address, 'region': 'JP'}, (results, status) => {
        	if (status == google.maps.GeocoderStatus.OK) {
            	self.zoneMap.setCenter(results[0].geometry.location);
            	if(results[0].geometry.bounds){
            		self.zoneMap.fitBounds(results[0].geometry.bounds);	
            	}
            	if(results[0].geometry.viewport){
            		self.zoneMap.fitBounds(results[0].geometry.viewport);
            	}
            	self.fetchPlaces();
        	} else {
            	alert('Geocode was not successful for the following reason: ' + status);
        	}
    	})
	}
	fetchPlaces(){
		var latlngBounds = this.zoneMap.getBounds();
    	var northeast = latlngBounds.getNorthEast();
    	var southwest = latlngBounds.getSouthWest();
    	var self: Searcher = this;
    	$.get("/search/", {northeast_lng: northeast.lng(), northeast_lat: northeast.lat(), southwest_lng: southwest.lng(),
                        southwest_lat: southwest.lat(), place_name: $('[name=place_name]').val()}, (response) => {
        	placeList = [];
        	itemChecked = [];　//検索後は絞り込みダイアログのcheckboxのチェックを外す
        	self.loadPlaces(response);
    	});
	}
	loadPlaces(response){
		this.zoneMap.clear();
    	$('#location_list').html('')
    	$('#location_list').append($(response).find('#location_list').children());
    	createPlaces(this.zoneMap);
	}
}

//ここからトップレベル
var seacher: Searcher = new Searcher(zoneMap);
function startSearch(){
    seacher.searchPlaces();
}
