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
        var name = $($("[id = name]")[i]).attr("value");
        var lat = $($("[id = latitude]")[i]).attr("value");
        var lng = $($("[id=longitude]")[i]).attr("value");
        var placeLatlng = new google.maps.LatLng(lat, lng);
        overlayText(name, lat, lng);

        new google.maps.Marker({
            position: placeLatlng,
            map: map,
            title: name,
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

function overlayText(name, lat, lng){
    function NameMarker(map, lat, lng){
        this.lat_ = lat;
        this.lng_ = lng;
        this.setMap(map);
    }
    NameMarker.prototype = new google.maps.OverlayView();

    NameMarker.prototype.draw = function() {
        // 何度も呼ばれる可能性があるので、div_が未設定の場合のみ要素生成
        if (!this.div_) {
            // 出力したい要素生成
            this.div_ = document.createElement( "div" );
            this.div_.style.position = "absolute";
            this.div_.style.fontSize = "200%";
            this.div_.innerHTML = name;
            // 要素を追加する子を取得
            var panes = this.getPanes();
            // 要素追加
            panes.overlayLayer.appendChild( this.div_ );
        }

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