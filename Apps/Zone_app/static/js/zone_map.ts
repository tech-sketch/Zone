/// <reference path="jquery.d.ts" />
/// <reference path="google.maps.d.ts"/>
/// <reference path="bootbox.d.ts"/>
class ZoneMap{
    private static currentPositionZoom: number = 15;
	private successCallback = (position) => {
		var latLng: google.maps.LatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    	var mapOptions: {} = {
            center: latLng,
            zoom: ZoneMap.currentPositionZoom
    	};
    	this.initMap(mapOptions);
    	this.map.setCenter(latLng);
    	this.setUserMarker(latLng.lat(), latLng.lng());
	};
	private errorCallback = () => {
    	this.initMap(this.defaultMapOptions);
    	alert('位置情報が取得できません。');
	};
    private map: google.maps.Map;
    private userMarker: google.maps.Marker;
    private overlayList: google.maps.MVCArray = new google.maps.MVCArray();
    private markerList: google.maps.MVCArray = new google.maps.MVCArray();
    private currentInfoWindow;
    constructor(private defaultMapOptions: {}, private markerImg: google.maps.MarkerImage){}
    load(){
        if(!$('[name=address]').val()){
            this.getLocation();
        }else{
            this.initMap(this.defaultMapOptions);
        }
    }
    setUserMarker(lat: number, lng: number){
        this.userMarker = new google.maps.Marker({
                position: new google.maps.LatLng(lat, lng),
                map: this.map,
                title:"Your position",
                icon: this.markerImg,
        });
        new google.maps.InfoWindow({
                content: "現在地"
        }).open(this.map, this.userMarker);
    }
    private initMap(option: {}){
  		if(!this.map){
        	this.map = new google.maps.Map($('#map-canvas').get(0), option);
        	google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            	searchPlaces(this);
        	});
    	}
    }
    getLocation(){
    	$('#loading').fadeIn("quick");
    	if(navigator.geolocation){
        	navigator.geolocation.getCurrentPosition(this.successCallback, this.errorCallback);
    	}else{
        	this.initMap(this.defaultMapOptions)
        	alert('ブラウザが位置情報取得に対応しておりません。');
    	}
   		$('#loading').fadeOut("quick");
    }
    panToCurrentCenter(){
        if(this.userMarker){
            this.map.setCenter(this.userMarker.getPosition());
        }else{
            this.getLocation();
        }
    }
    setPlace(place: Place){
        var placeMarker = new google.maps.Marker({
                position: new google.maps.LatLng(place.getLat(), place.getLng()),
                map: this.map,
                title: place.getName()
            });
        var placeInfoWindow = new google.maps.InfoWindow({
                maxWidth: 250,
                maxHeight: 250,
                content: place.getName()
            });
        this.markerList.push(placeMarker)
        this.addPlaceListener(placeMarker, placeInfoWindow, place)
        this.setOverlayText(name, place.getLat(), place.getLng());
    }
    private setOverlayText(name, lat, lng){
        this.overlayList.push(new NameMarker(lat, lng, this.map));
    }
    clearOverlayList(){
        this.overlayList.clear();
    }
    clearMarkerList(){
        this.markerList.clear();
    }
    getOverlayList(): google.maps.MVCArray{
        //ディープコピーして返却
        return $.extend(true, new google.maps.MVCArray(), this.overlayList);
    }
    getMarkerList(): google.maps.MVCArray{
        //ディープコピーして返却
        return $.extend(true, new google.maps.MVCArray(), this.getMarkerList);
    }
    getBounds(){
        return this.map.getBounds();
    }
    setCenter(location){
        this.map.setCenter(location);
    }
    fitBounds(bounds){
        this.map.fitBounds(bounds);
    }
    addPlaceListener(placeMarker: google.maps.Marker, placeInfoWindow, place: Place){
        var openInfoWindow = () => {
            if(this.currentInfoWindow){
                this.currentInfoWindow.close();
            }
            placeInfoWindow.open(this.map, placeMarker);
            this.currentInfoWindow = placeInfoWindow;
        };
        var closeInfoWindow = () => {
            placeInfoWindow.close(this.map, placeMarker);
        };
        var loadDetail = () => {
            $("#loading").fadeIn("quick");
            $.get('/detail/' + place.getId(), (html) => {
                $("#loading").fadeOut("quick");
                showDetail(html);
            });
        }
        var position = place.getLocationCard().offset().top - place.getLocationCard().parent('div').offset().top;
        place.getLocationCard().on("click", loadDetail);
        place.getLocationCard().hover(openInfoWindow, closeInfoWindow);
        google.maps.event.addListener(placeMarker, 'click', loadDetail);
        google.maps.event.addListener(placeMarker, "mouseover", () => {
            openInfoWindow();
            place.getLocationCard().parent('div').animate({scrollTop: position}, 'normal');
            place.getLocationCard().attr('style', 'background-color: #f5f5f5;');
        });
        google.maps.event.addListener(placeMarker, "mouseout", () => {
            closeInfoWindow();
            place.getLocationCard().attr('style', '');
        });
        
    }


}

class NameMarker extends google.maps.OverlayView{
    private div_;
    constructor(private lat: number,private lng: number, private map: google.maps.Map){
        super();
        this.setMap(this.map);
    }
    draw() {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
        }
            // 出力したい要素生成
        this.div_ = document.createElement( "div" );
        this.div_.style.position = "absolute";
        var zoom_level = this.map.getZoom();
        if(zoom_level > 14){
            this.div_.style.fontSize = this.map.getZoom() * this.map.getZoom() * 0.4 + "%";
        }
        this.div_.innerHTML = name;
        // 要素を追加する子を取得
        var panes = this.getPanes();
        // 要素追加
        panes.overlayLayer.appendChild( this.div_ );
            // 緯度、軽度の情報を、Pixel（google.maps.Point）に変換
        var point = this.getProjection().fromLatLngToDivPixel( new google.maps.LatLng( this.lat, this.lng) );
            // 取得したPixel情報の座標に、要素の位置を設定
        this.div_.style.left = point.x + 'px';
        this.div_.style.top = point.y + 'px';
        this.div_.id = "overlay_text";
    }
         /* 削除処理の実装 */
    onRemove() {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
            this.div_ = null;
        }
    }
    toggleDOM() {
        if (this.getMap()) {
            // Note: setMap(null) calls OverlayView.onRemove()
            this.setMap(null);
        } else {
            this.setMap(this.map);
        }
    }
}


class Place{
    private placeMaker: google.maps.Marker;
    constructor(private id: number, private name: string, private lat: number, private lng: number, private locationCard: JQuery){

    }
    getLat(): number{
        return this.lat;
    }
    getLng(): number{
        return this.lng;
    }
    getName(): string{
        return this.name;
    }
    getId(): number{
        return this.id;
    }
    getLocationCard(): JQuery{
        return this.locationCard;
    }

}





//ここからトップレベル記述

$('#loading').fadeOut("quick");
var defaultLatLng = new google.maps.LatLng(35.682323, 139.765955);　//東京駅
var defaultZoom = 15;
var defaultMapOptions = {
    center: defaultLatLng,
    zoom: defaultZoom
};
var markerImg: google.maps.MarkerImage = new google.maps.MarkerImage(
        // マーカーの画像URL
        "/static/images/man.png",
        // マーカーのサイズ
        new google.maps.Size(32, 32),
        // 画像の基準位置
        new google.maps.Point(0, 0),
        // Anchorポイント
        new google.maps.Point(10, 24)
);

var zoneMap: ZoneMap = new ZoneMap(defaultMapOptions, markerImg);
zoneMap.load();
var placeList: Array<Place> = [];

function createPlaces(zoneMap: ZoneMap){
    var length = $("[id=name]").length;

    for(var i = 0; i < length; i++){
        var name: string = $($("[id=name]")[i]).attr("value");
        var lat: number = Number($($("[id=latitude]")[i]).attr("value"));
        var lng: number = Number($($("[id=longitude]")[i]).attr("value"));
        var placeId: number = Number($($("[id=place_id]")[i]).attr("value"));
        var locationCard: JQuery = $($("[class=location_card]")[i]);
        var place: Place = new Place(placeId, name, lat, lng, locationCard)
        placeList.push(place);
        zoneMap.setPlace(place);
    }
}
