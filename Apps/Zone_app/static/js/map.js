var geocoder;
var map;
function start(){
    getLocation();
}
function getLocation(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    }else{
        alert('ブラウザが位置情報取得に対応しておりません');
    }
}
function successCallback(position){
    initialize(position.coords.latitude, position.coords.longitude);
}
function errorCallback(error){
    alert('位置情報が取得できません');
}
function initialize(x, y) {
    geocoder = new google.maps.Geocoder();
    var myLatlng = new google.maps.LatLng(x,y);
    var mapOptions = {
        center: myLatlng,
        zoom: 17
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


    var userMarker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title:"Your position",
            icon: markerImg,
    });
    new google.maps.InfoWindow({
                content: "現在地"
              }).open(map, userMarker)
    makePlacePin();
}

function makePlacePin() {
    for(var i = 0; i < $("[id = name]").length; i++){
        var placeLatlng = new google.maps.LatLng( $($("[id = latitude]")[i]).attr("value"), $($("[id=longitude]")[i]).attr("value"));
        new google.maps.Marker({
            position: placeLatlng,
            map: map,
            title: $($("[id = name]")[i]).attr("value"),
    });
    }
    $("[id = name]").each(function(index,data){
        console.log($(data).attr("value"));
    });
    $("[id = longitude]").each(function(index,data){
        console.log($(data).attr("value"));
    });
    $("[id = latitude]").each(function(index,data){
        console.log($(data).attr("value"));
    });
}

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
}
google.maps.event.addDomListener(window, 'load', start);