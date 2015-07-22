//action when search places with search-form of top-var
// ======================
function searchPlaces(){
    $("#loading").fadeIn("quick");
    var ref = location.pathname;
    if(ref == "/map/"){
        if($('[name=address]').val()){
            codeAddress();
        } else{
            fetchPlaces();
        }
    } else{
        $('#search_form').submit();
    }
    $("#loading").fadeOut("quick");
}


function codeAddress() {
    var address = document.getElementById('address_searched').value;
    geocoder.geocode( { 'address': address, 'region': 'JP'}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            if(results[0].geometry.bounds)map.fitBounds(results[0].geometry.bounds);
            if(results[0].geometry.viewport)map.fitBounds(results[0].geometry.viewport);
            fetchPlaces();
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}


function fetchPlaces(){
    var latlngBounds = map.getBounds();
    var northeast = latlngBounds.getNorthEast();
    var southwest = latlngBounds.getSouthWest();
    $.get("/search/", {northeast_lng: northeast.lng(), northeast_lat: northeast.lat(), southwest_lng: southwest.lng(),
                        southwest_lat: southwest.lat(), place_name: $('[name=place_name]').val()}, function(response){
        placeIdList = [];
        categoriesChecked = [];
        moodsChecked = [];
        toolsChecked = [];
        loadPlaces(response);
    });
}


function addListener(placeMarker, placeInfoWindow, locationCard, placeId){
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
        $("#loading").fadeIn("quick");
        $.get('/detail/' + placeId, function(html){
            $("#loading").fadeOut("quick");
            showDetail(html);
        });
    });
    locationCard.hover(openInfoWindow, closeInfoWindow);
    google.maps.event.addListener(placeMarker, 'click', function(){
        $("#loading").fadeIn("quick");
        $.get('/detail/' + placeId, function(html){
            $("#loading").fadeOut("quick");
            showDetail(html);
        });
    });
    google.maps.event.addListener(placeMarker, "mouseover", function(){
        openInfoWindow();
        locationCard.parent('div').animate({scrollTop: position}, 'normal');
        locationCard.attr('style', 'background-color: #f5f5f5;');
    });
    google.maps.event.addListener(placeMarker, "mouseout", function(){
        closeInfoWindow();
        locationCard.attr('style', '');
    });
    if(placeIdList.indexOf(placeId) == -1){
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
        zoom_level = map.getZoom();
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


function loadPlaces(response){
    markerList.forEach(function(marker){
        marker.setMap(null);
    });
    markerList.clear();
    overlayList.forEach(function(overlay){
        overlay.toggleDOM();
    });
    overlayList.clear();
    $('#location_list').html('')
    $('#location_list').append($(response).find('#location_list').children());
    makePlacePin();
}