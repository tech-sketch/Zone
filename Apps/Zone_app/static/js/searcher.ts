/// <reference path="jquery.d.ts" />
/// <reference path="google.maps.d.ts"/>
/// <reference path="zone_map.ts"/>

class PlacesMaker{
	private placeList: Array<Place> = [];
	constructor(private zoneMap: ZoneMap){

	}

	getPlaceIdList(){
	    var placeIdList = [];
	    for(var i=0; i<this.placeList.length; i++){
	        placeIdList.push(this.placeList[i].getId());
	    }
	    return placeIdList;
	}

	updatePlaces(updatePlaceList=false){
    	if(updatePlaceList)this.placeList = [];
    	for(var i = 0; i < $("[id=name]").length; i++){
			var name: string = $($("[id=name]")[i]).attr("value");
			var lat: number = Number($($("[id=latitude]")[i]).attr("value"));
			var lng: number = Number($($("[id=longitude]")[i]).attr("value"));
			var placeId: number = Number($($("[id=place_id]")[i]).attr("value"));
			var locationCard: JQuery = $($("[class=location_card]")[i]);
			var place: Place = new Place(placeId, name, lat, lng, locationCard);
			this.zoneMap.setPlace(place);
			if(updatePlaceList)this.placeList.push(place);
		}
	}

	updatePage(response){
		this.zoneMap.clear();
    	$('#location_list').html('')
    	$('#location_list').append($(response).find('#location_list').children());
	}
}

class Searcher{
	private geocoder = new google.maps.Geocoder();
	constructor(private zoneMap: ZoneMap, private placesMaker: PlacesMaker){

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
	private codeAddress(){
		var address = $('#address_searched').val();
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
	private fetchPlaces(){
		var latlngBounds = this.zoneMap.getBounds();
    	var northeast = latlngBounds.getNorthEast();
    	var southwest = latlngBounds.getSouthWest();
    	var self: Searcher = this;
    	$.get("/search/", {northeast_lng: northeast.lng(), northeast_lat: northeast.lat(), southwest_lng: southwest.lng(),
                        southwest_lat: southwest.lat(), place_name: $('[name=place_name]').val()}, (response) => {
        	itemChecked = [];　//検索後は絞り込みダイアログのcheckboxのチェックを外す
        	self.placesMaker.updatePage(response);
        	self.placesMaker.updatePlaces(true);
    	});
	}
}

//ここからトップレベル

$('#loading').fadeOut("quick");
var defaultLatLng = new google.maps.LatLng(35.682323, 139.765955);　//東京駅
var defaultZoom = 15;
var defaultMapOptions = {
    center: defaultLatLng,
    zoom: defaultZoom
};
var markerImg: google.maps.MarkerImage = new google.maps.MarkerImage(
        "/static/images/man.png",  // マーカーの画像URL
        new google.maps.Size(32, 32),  // マーカーのサイズ
        new google.maps.Point(0, 0),  // 画像の基準位置
        new google.maps.Point(10, 24)  // Anchorポイント
);

var zoneMap: ZoneMap = new ZoneMap(defaultMapOptions, markerImg);
var placesMaker: PlacesMaker = new PlacesMaker(zoneMap);
var searcher: Searcher = new Searcher(zoneMap, placesMaker);

function startSearch(){
    searcher.searchPlaces();
}

function searchThisArea(){
    $('[name=address]').val("");
    startSearch();
}

zoneMap.addActionOnceBoundChanged(startSearch)
zoneMap.load();

var $function_list = $('#function-list')

$function_list.find('.btn-back').on('click', function(){
    zoneMap.panToCurrentCenter();
});

$function_list.find('.btn-search-here').on('click', function(){
    searchThisArea();
});

$function_list.find('.btn-recommend').on('click', function(){

});

$function_list.find('.btn-create-place').on('click', function(){

});
