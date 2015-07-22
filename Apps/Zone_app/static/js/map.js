var geocoder;
var defaultLatLng = new google.maps.LatLng(35.682323, 139.765955);　//東京駅
var defaultZoom = 15;
var defaultMapOptions = {
    center: defaultLatLng,
    zoom: defaultZoom
};
var currentPositionZoom = 17;
var map;
var userMarker = null;
var markerImg = new google.maps.MarkerImage(
        // マーカーの画像URL
        "/static/images/man.png",
        // マーカーのサイズ
        new google.maps.Size(32, 32),
        // 画像の基準位置
        new google.maps.Point(0, 0),
        // Anchorポイント
        new google.maps.Point(10, 24)
    );
var currentInfoWindow = null;

var markerList = new google.maps.MVCArray();
var overlayList = new google.maps.MVCArray();
var placeIdList = [];

function start(){
    if(!$('[name=address]').val())getLocation();
    if(!map)map = new google.maps.Map($('#map-canvas').get(0), defaultMapOptions);
    geocoder = new google.maps.Geocoder();
    google.maps.event.addListenerOnce(map, 'bounds_changed', function(){
        searchPlaces();
    });
}

function getLocation(){
    $('#loading').fadeIn("quick");
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    }else{
        alert('ブラウザが位置情報取得に対応しておりません。');
    }
    $('#loading').fadeOut("quick");
}

function successCallback(position){
    var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    if(!map){
        var mapOptions = {
            center: latLng,
            zoom: currentPositionZoom
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }
    map.setCenter(latLng);
    setUserMarker(latLng.lat(), latLng.lng());
}

function errorCallback(error){
    alert('位置情報が取得できません。');
}

function setUserMarker(lat, lng) {
    userMarker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: map,
            title:"Your position",
            icon: markerImg,
    });
    new google.maps.InfoWindow({
                content: "現在地"
              }).open(map, userMarker);
}

function makePlacePin() {
    var length = $("[id = name]").length;

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
        }), locationCard, placeId);
    }
}


function setCurrentPosition(){
    if(userMarker){
        map.setCenter(userMarker.getPosition());
    }else{
        getLocation();
    }
}



$('#loading').fadeOut("quick");
google.maps.event.addDomListener(window, 'load', start);



