var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="jquery.d.ts" />
/// <reference path="google.maps.d.ts"/>
/// <reference path="bootbox.d.ts"/>
var ZoneMap = (function () {
    function ZoneMap(defaultMapOptions, markerImg) {
        var _this = this;
        this.defaultMapOptions = defaultMapOptions;
        this.markerImg = markerImg;
        this.successCallback = function (position) {
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var mapOptions = {
                center: latLng,
                zoom: ZoneMap.currentPositionZoom
            };
            _this.initMap(mapOptions);
            _this.map.setCenter(latLng);
            _this.setUserMarker(latLng.lat(), latLng.lng());
            $('#loading').fadeOut("quick");
        };
        this.errorCallback = function () {
            _this.initMap(_this.defaultMapOptions);
            alert('位置情報が取得できません。');
            $('#loading').fadeOut("quick");
        };
        this.overlayList = new google.maps.MVCArray();
        this.markerList = new google.maps.MVCArray();
    }
    ZoneMap.prototype.load = function () {
        if (!$('[name=address]').val()) {
            this.getLocation();
        }
        else {
            this.initMap(this.defaultMapOptions);
        }
    };
    ZoneMap.prototype.setUserMarker = function (lat, lng) {
        this.userMarker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: this.map,
            title: "Your position",
            icon: this.markerImg,
        });
        new google.maps.InfoWindow({
            content: "現在地"
        }).open(this.map, this.userMarker);
    };
    ZoneMap.prototype.searchPlaces = function () {
        $("#loading").fadeIn("quick");
        if ($('[name=address]').val()) {
            codeAddress(this);
        }
        else {
            fetchPlaces(this);
        }
        $("#loading").fadeOut("quick");
    };
    ZoneMap.prototype.initMap = function (option) {
        if (!this.map) {
            var self = this;
            this.map = new google.maps.Map($('#map-canvas').get(0), option);
            google.maps.event.addListenerOnce(this.map, 'bounds_changed', function () {
                self.searchPlaces();
            });
        }
    };
    ZoneMap.prototype.getLocation = function () {
        $('#loading').fadeIn("quick");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.successCallback, this.errorCallback);
        }
        else {
            this.initMap(this.defaultMapOptions);
            alert('ブラウザが位置情報取得に対応しておりません。');
            $('#loading').fadeOut("quick");
        }
    };
    ZoneMap.prototype.panToCurrentCenter = function () {
        if (this.userMarker) {
            this.map.setCenter(this.userMarker.getPosition());
        }
        else {
            this.getLocation();
        }
    };
    ZoneMap.prototype.setPlace = function (place) {
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
        this.markerList.push(placeMarker);
        this.addPlaceListener(placeMarker, placeInfoWindow, place);
        this.setOverlayText(place.getName(), place.getLat(), place.getLng());
    };
    ZoneMap.prototype.setOverlayText = function (name, lat, lng) {
        this.overlayList.push(new NameMarker(name, lat, lng, this.map));
    };
    ZoneMap.prototype.clearOverlayList = function () {
        this.overlayList.clear();
    };
    ZoneMap.prototype.clearMarkerList = function () {
        this.markerList.clear();
    };
    ZoneMap.prototype.getOverlayList = function () {
        //ディープコピーして返却
        return $.extend(true, new google.maps.MVCArray(), this.overlayList);
    };
    ZoneMap.prototype.getMarkerList = function () {
        //ディープコピーして返却
        return $.extend(true, new google.maps.MVCArray(), this.markerList);
    };
    ZoneMap.prototype.getBounds = function () {
        return this.map.getBounds();
    };
    ZoneMap.prototype.setCenter = function (location) {
        this.map.setCenter(location);
    };
    ZoneMap.prototype.fitBounds = function (bounds) {
        this.map.fitBounds(bounds);
    };
    ZoneMap.prototype.clear = function () {
        this.getMarkerList().forEach(function (marker) {
            marker.setMap(null);
        });
        this.clearMarkerList();
        this.getOverlayList().forEach(function (overlay) {
            overlay.toggleDOM();
        });
        this.clearOverlayList();
    };
    ZoneMap.prototype.addPlaceListener = function (placeMarker, placeInfoWindow, place) {
        var _this = this;
        var openInfoWindow = function () {
            if (_this.currentInfoWindow) {
                _this.currentInfoWindow.close();
            }
            placeInfoWindow.open(_this.map, placeMarker);
            _this.currentInfoWindow = placeInfoWindow;
        };
        var closeInfoWindow = function () {
            placeInfoWindow.close(_this.map, placeMarker);
        };
        var loadDetail = function () {
            $("#loading").fadeIn("quick");
            $.get('/detail/' + place.getId(), function (html) {
                $("#loading").fadeOut("quick");
                showDetail(html);
            });
        };
        var position = place.getLocationCard().offset().top - place.getLocationCard().parent('div').offset().top;
        place.getLocationCard().on("click", loadDetail);
        place.getLocationCard().hover(openInfoWindow, closeInfoWindow);
        google.maps.event.addListener(placeMarker, 'click', loadDetail);
        google.maps.event.addListener(placeMarker, "mouseover", function () {
            openInfoWindow();
            place.getLocationCard().parent('div').animate({ scrollTop: position }, 'normal');
            place.getLocationCard().attr('style', 'background-color: #f5f5f5;');
        });
        google.maps.event.addListener(placeMarker, "mouseout", function () {
            closeInfoWindow();
            place.getLocationCard().attr('style', '');
        });
    };
    ZoneMap.currentPositionZoom = 15;
    return ZoneMap;
})();
var NameMarker = (function (_super) {
    __extends(NameMarker, _super);
    function NameMarker(placeName, lat, lng, map) {
        _super.call(this);
        this.placeName = placeName;
        this.lat = lat;
        this.lng = lng;
        this.map = map;
        this.setMap(this.map);
    }
    NameMarker.prototype.draw = function () {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
        }
        // 出力したい要素生成
        this.div_ = document.createElement("div");
        this.div_.style.position = "absolute";
        var zoom_level = this.map.getZoom();
        if (zoom_level > 14) {
            this.div_.style.fontSize = this.map.getZoom() * this.map.getZoom() * 0.4 + "%";
        }
        this.div_.innerHTML = this.placeName;
        // 要素を追加する子を取得
        var panes = this.getPanes();
        // 要素追加
        panes.overlayLayer.appendChild(this.div_);
        // 緯度、軽度の情報を、Pixel（google.maps.Point）に変換
        var point = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(this.lat, this.lng));
        // 取得したPixel情報の座標に、要素の位置を設定
        this.div_.style.left = point.x + 'px';
        this.div_.style.top = point.y + 'px';
        this.div_.id = "overlay_text";
    };
    /* 削除処理の実装 */
    NameMarker.prototype.onRemove = function () {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
            this.div_ = null;
        }
    };
    NameMarker.prototype.toggleDOM = function () {
        if (this.getMap()) {
            // Note: setMap(null) calls OverlayView.onRemove()
            this.setMap(null);
        }
        else {
            this.setMap(this.map);
        }
    };
    return NameMarker;
})(google.maps.OverlayView);
var Place = (function () {
    function Place(id, name, lat, lng, locationCard) {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lng = lng;
        this.locationCard = locationCard;
    }
    Place.prototype.getLat = function () {
        return this.lat;
    };
    Place.prototype.getLng = function () {
        return this.lng;
    };
    Place.prototype.getName = function () {
        return this.name;
    };
    Place.prototype.getId = function () {
        return this.id;
    };
    Place.prototype.getLocationCard = function () {
        return this.locationCard;
    };
    return Place;
})();
//ここからトップレベル記述
var defaultLatLng = new google.maps.LatLng(35.682323, 139.765955); //東京駅
var defaultZoom = 15;
var defaultMapOptions = {
    center: defaultLatLng,
    zoom: defaultZoom
};
var markerImg = new google.maps.MarkerImage(
// マーカーの画像URL
"/static/images/man.png", 
// マーカーのサイズ
new google.maps.Size(32, 32), 
// 画像の基準位置
new google.maps.Point(0, 0), 
// Anchorポイント
new google.maps.Point(10, 24));
var zoneMap = new ZoneMap(defaultMapOptions, markerImg);
zoneMap.load();
var placeList = [];
function createPlaces(zoneMap) {
    var length = $("[id=name]").length;
    for (var i = 0; i < length; i++) {
        var name = $($("[id=name]")[i]).attr("value");
        var lat = Number($($("[id=latitude]")[i]).attr("value"));
        var lng = Number($($("[id=longitude]")[i]).attr("value"));
        var placeId = Number($($("[id=place_id]")[i]).attr("value"));
        var locationCard = $($("[class=location_card]")[i]);
        var place = new Place(placeId, name, lat, lng, locationCard);
        placeList.push(place);
        zoneMap.setPlace(place);
    }
}

