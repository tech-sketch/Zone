var geocoder;
var map;
var userMarker;
var currentInfoWindow = null;
var defaultMapOptions = {
    center: new google.maps.LatLng(35.682323, 139.765955),　//東京駅
    zoom: 15
};
var markerList = new google.maps.MVCArray();
var overlayList = new google.maps.MVCArray();
var placeIdList = [];

function start(){
    getLocation();
}

function getLocation(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    }else{
        alert('ブラウザが位置情報取得に対応しておりません。');
    }
}

function successCallback(position){
   initialize(position.coords.latitude, position.coords.longitude);
   makePlacePin();
   if($('#location_lat').attr('value') && $('#location_lng').attr('value')){
        map.panTo(new google.maps.LatLng($('#location_lat').attr('value'),$('#location_lng').attr('value')));
   }
   else{
        new google.maps.InfoWindow({
                content: "現在地"
              }).open(map, userMarker);
   }
}

function errorCallback(error){
    alert('位置情報が取得できません。');
    var mapOptions;
    if($('#location_lat').attr('value') && $('#location_lng').attr('value')){
        mapOptions = {
            center: new google.maps.LatLng($('#location_lat').attr('value'), $('#location_lng').attr('value')),
            zoom: parseInt($('#zoom_level').attr('value'))
        };
    }
    else{
        mapOptions = defaultMapOptions;
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    makePlacePin();
}

function initialize(x, y) {
    geocoder = new google.maps.Geocoder();
    var myLatlng = new google.maps.LatLng(x, y);
    var zoom_level = parseInt($('#zoom_level').attr('value'))
    var mapOptions = {
            center: myLatlng,
            zoom: zoom_level
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    var markerImg = new google.maps.MarkerImage(
        // マーカーの画像URL
        "http://127.0.0.1:8000/static/images/man.png",
        // マーカーのサイズ
        new google.maps.Size(32, 32),
        // 画像の基準位置
        new google.maps.Point(0, 0),
        // Anchorポイント
        new google.maps.Point(10, 24)
    );

    userMarker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title:"Your position",
            icon: markerImg,
    });
}

function makePlacePin() {

    var length = $("[id = name]").length

    for(var i = 0; i < length; i++){
        var name = $($("[id=name]")[i]).attr("value");
        var lat = $($("[id=latitude]")[i]).attr("value");
        var lng = $($("[id=longitude]")[i]).attr("value");
        var placeId = $($("[id=place_id]")[i]).attr("value");
        var locationCard = $($("[class=location_card]")[i]);
        var placeLatlng = new google.maps.LatLng(lat, lng);
        var placeMarker = new google.maps.Marker({
            position: placeLatlng,
            map: map,
            title: name,
        });
        markerList.push(placeMarker);
        overlayText(name, lat, lng);
        addListener(placeMarker
        , new google.maps.InfoWindow({
                maxWidth: 250,
                maxHeight: 250,
                content: name
        }), locationCard, placeId)
    }
}

function addListener(placeMarker, placeInfoWindow, locationCard, placeId){
    if(placeIdList.indexOf(placeId) == -1){
        var openInfoWindow = function(){
            if(currentInfoWindow){
                currentInfoWindow.close();
            }
            placeInfoWindow.open(map, placeMarker);
            currentInfoWindow = placeInfoWindow;
        };
        var closeInfoWindow = function(){
            placeInfoWindow.close(map, placeMarker);
        };
        var position = locationCard.offset().top - locationCard.parent('div').offset().top;

        locationCard.on("click", function(){
            $.get('/detail/' + placeId, function(html){
                showDetail(html);
            });
        });
        locationCard.hover(openInfoWindow, closeInfoWindow);
        google.maps.event.addListener(placeMarker, 'click', function(){
            $.get('/detail/' + placeId, function(html){
                showDetail(html);
            });
        });
        google.maps.event.addListener(placeMarker, "mouseover", function(){
            openInfoWindow();
            locationCard.parent('div').animate({scrollTop: position}, 'normal');
            locationCard.attr('style', 'background-color: #f1f1f1; box-shadow: 0 0px 0px 0 #ddd;');
        });
        google.maps.event.addListener(placeMarker, "mouseout", function(){
            closeInfoWindow();
            locationCard.attr('style', '');
        });
        placeIdList.push(placeId);
    }
}

function overlayText(name, lat, lng){
    function NameMarker(map, lat, lng){
        this.lat_ = lat;
        this.lng_ = lng;
        this.setMap(map);
    }
    NameMarker.prototype = new google.maps.OverlayView();

    NameMarker.prototype.draw = function() {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
        }

        // 出力したい要素生成
        this.div_ = document.createElement( "div" );
        this.div_.style.position = "absolute";
        zoom_level = map.getZoom()
        if(zoom_level>14)this.div_.style.fontSize = map.getZoom() * map.getZoom() * 0.4 + "%";
        this.div_.innerHTML = name;
        // 要素を追加する子を取得
        var panes = this.getPanes();
        // 要素追加
        panes.overlayLayer.appendChild( this.div_ );

        // 緯度、軽度の情報を、Pixel（google.maps.Point）に変換
        var point = this.getProjection().fromLatLngToDivPixel( new google.maps.LatLng( this.lat_, this.lng_ ) );

        // 取得したPixel情報の座標に、要素の位置を設定
        this.div_.style.left = point.x + 'px';
        this.div_.style.top = point.y + 'px';
        this.div_.id = "overlay_text";
    }

      /* 削除処理の実装 */
    NameMarker.prototype.onRemove = function() {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
            this.div_ = null;
        }
    }
    NameMarker.prototype.toggleDOM = function() {
        if (this.getMap()) {
            // Note: setMap(null) calls OverlayView.onRemove()
            this.setMap(null);
        } else {
            this.setMap(this.map_);
        }
    };
    overlayList.push(new NameMarker(map, lat, lng));
}

$('#loading').fadeOut("quick");
google.maps.event.addDomListener(window, 'load', start);

/*
function codeAddress() {
    var address = document.getElementById('address').value;
    geocoder.geocode( { 'address': address, region: 'JP'}, function(results, status) {
        for(i in results){
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[i].geometry.location);
                var latlng = results[i].geometry.location;
                new google.maps.InfoWindow({
                    content: results[i].formatted_address + "<br>(Lat, Lng) = " + latlng.toString()
                }).open(map, new google.maps.Marker({
                    position: latlng,
                    map: map
                }));
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        }
    });
}*/
