/// <reference path="jquery.d.ts"/>
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
    private actionOnceBoundChanged:() => void = () => {};
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
            var self = this;
            this.map = new google.maps.Map($('#map-canvas').get(0), option);
            google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
                this.actionOnceBoundChanged()
            });
        }
    }

    addActionOnceBoundChanged(func:()=>void){
        this.actionOnceBoundChanged = func;
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
        this.setOverlayText(place.getName(), place.getLat(), place.getLng());
    }
    private setOverlayText(name, lat, lng){
        this.overlayList.push(new NameMarker(name, lat, lng, this.map));
    }
    clearOverlayList(){
        this.overlayList.clear();
    }
    clearMarkerList(){
        this.markerList.clear();
    }
    getOverlayList(){
        //ディープコピーして返却
        return $.extend(true, new google.maps.MVCArray(), this.overlayList);
    }
    getMarkerList(){
        //ディープコピーして返却
        return $.extend(true, new google.maps.MVCArray(), this.markerList);
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
    clear(){
        this.getMarkerList().forEach(function(marker){
            marker.setMap(null);
        });
        this.clearMarkerList();
        this.getOverlayList().forEach(function(overlay){
            overlay.toggleDOM();
        });
        this.clearOverlayList();
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
    constructor(private placeName: string, private lat: number,private lng: number, private map: google.maps.Map){
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
        this.div_.innerHTML = this.placeName;
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
