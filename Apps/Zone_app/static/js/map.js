var geocoder;
var map;
var centerLatlng;
var userMarker;
var currentInfoWindow = null;

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
    if($('#location_lat').attr('value') && $('#location_lng').attr('value')){
        centerLatlng = new google.maps.LatLng($('#location_lat').attr('value'),$('#location_lng').attr('value'));
    }
    else{
        new google.maps.InfoWindow({
                content: "現在地"
              }).open(map, userMarker);
        centerLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    }
    map.panTo(centerLatlng);
}
function errorCallback(error){
    alert('位置情報が取得できません');
}
function initialize(x, y) {
    geocoder = new google.maps.Geocoder();
    var myLatlng = new google.maps.LatLng(x, y);

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

    userMarker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title:"Your position",
            icon: markerImg,
    });

    makePlacePin();
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


        overlayText(name, lat, lng);

        addListener( new google.maps.Marker({
            position: placeLatlng,
            map: map,
            title: name,
        }), new google.maps.InfoWindow({
                maxWidth: 250,
                maxHeight: 250,
                content: name + '<br/><button type="button" id="check_in" class="btn-success" name="check_in" value="' + placeId + '">現在この店にいる</button>' +
                                '<button type="button" id="recommend"  class="btn-success" name="recommend" value="' + placeId + '">このお店をおすすめする</button>'
        }), locationCard, placeId)
        //console.log($("#check_in").attr("value"))

    }

}
addListenerList = [];

function addListener(placeMarker, placeInfoWindow, locationCard, placeId){
    var openInfoWindow = function(){
        if(currentInfoWindow){
            currentInfoWindow.close();
        }
        placeInfoWindow.open(map, placeMarker);
        currentInfoWindow = placeInfoWindow;

        if(addListenerList.indexOf(placeId) == -1){
            $($("button[value=" + placeId + "]")[0]).on("click", function(){
                checkIn(placeId);
            });
            $($("button[value=" + placeId + "]")[1]).on("click", function(){
                showForm(placeId);
            });
            addListenerList.push(placeId);
        }
    };
    var closeInfoWindow = function(){
        placeInfoWindow.close(map, placeMarker);
    };


    locationCard.on("click", function(){
        $.get('/detail/' + placeId, function(data){
            showDetail(data);
            console.log(data);
        });
    });

    locationCard.hover(openInfoWindow, closeInfoWindow);
    google.maps.event.addListener(placeMarker, 'click',closeInfoWindow);
    google.maps.event.addListener(placeMarker, "mouseover", openInfoWindow);
    //google.maps.event.addListener(placeMarker, "mouseout", closeInfoWindow);
}

function showDetail(data){
    bootbox.dialog({
        title: "",
        message: data,
        buttons: {
            checkIn: {
                label: "現在この場所にいる（10ポイントゲット）",
                className: "btn-primary",
                callback: detailCheckIn
            },
            recommend: {
                label: "このお店をおすすめする",
                className: "btn-primary",
                callback: detailRecommend
            },
            success: {
                label: "閉じる",
                className: "btn-success",
            }
        }
    });
}

function overlayText(name, lat, lng){
    function NameMarker(map, lat, lng){
        this.lat_ = lat;
        this.lng_ = lng;
        this.setMap(map);
    }
    NameMarker.prototype = new google.maps.OverlayView();

    NameMarker.prototype.draw = function() {
        console.log("draw")
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
        }

        // 出力したい要素生成
        this.div_ = document.createElement( "div" );
        this.div_.style.position = "absolute";
        this.div_.style.fontSize = map.getZoom() * 12 + "%";
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
    NameMarker.prototype.remove = function() {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
            this.div_ = null;
        }
    }
    new NameMarker(map, lat, lng);
}

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

google.maps.event.addDomListener(window, 'load', start);