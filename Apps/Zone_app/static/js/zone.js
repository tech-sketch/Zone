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
    function ZoneMap(map, geocoder, currentPositionZoom, defaultMapOptions) {
        var _this = this;
        this.map = map;
        this.geocoder = geocoder;
        this.currentPositionZoom = currentPositionZoom;
        this.defaultMapOptions = defaultMapOptions;
        this.successCallback = function (position) {
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var mapOptions = {
                center: latLng,
                zoom: _this.currentPositionZoom
            };
            _this.initMap(mapOptions);
            _this.map.setCenter(latLng);
            _this.setUserMarker(latLng.lat(), latLng.lng());
        };
        this.errorCallback = function () {
            _this.initMap(_this.defaultMapOptions);
            alert('位置情報が取得できません。');
        };
        this.markerImg = new google.maps.MarkerImage(
        // マーカーの画像URL
        "/static/images/man.png", 
        // マーカーのサイズ
        new google.maps.Size(32, 32), 
        // 画像の基準位置
        new google.maps.Point(0, 0), 
        // Anchorポイント
        new google.maps.Point(10, 24));
        this.userMarker = null;
        this.overlayList = [];
    }
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
    ZoneMap.prototype.start = function () {
        if (!$('[name=address]').val()) {
            this.getLocation();
        }
    };
    ZoneMap.prototype.initMap = function (option) {
        if (!this.map) {
            this.map = new google.maps.Map($('#map-canvas').get(0), option);
            google.maps.event.addListenerOnce(this.map, 'bounds_changed', function () {
                searchPlaces();
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
        }
        $('#loading').fadeOut("quick");
    };
    ZoneMap.prototype.setCurrentCenter = function () {
        if (this.userMarker) {
            this.map.setCenter(this.userMarker.getPosition());
        }
        else {
            this.getLocation();
        }
    };
    ZoneMap.prototype.setPlace = function (place) {
        var placeMaker = new google.maps.Marker({
            position: new google.maps.LatLng(place.getLat(), place.getLng()),
            map: this.map,
            title: place.getName()
        });
        var placeInfoWindow = new google.maps.InfoWindow({
            maxWidth: 250,
            maxHeight: 250,
            content: place.getName()
        });
        this.addPlaceListener(placeMaker, placeInfoWindow, place);
        this.setOverlayText(name, place.getLat(), place.getLng());
    };
    ZoneMap.prototype.setOverlayText = function (name, lat, lng) {
        this.overlayList.push(new NameMarker(lat, lng, this.map));
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
        var position = place.getLocationCard().offset().top - place.getLocationCard().parent('div').offset().top;
        place.getLocationCard().on("click", function () {
            $("#loading").fadeIn("quick");
            $.get('/detail/' + this.placeId, function (html) {
                $("#loading").fadeOut("quick");
                showDetail(html);
            });
        });
        place.getLocationCard().hover(openInfoWindow, closeInfoWindow);
        google.maps.event.addListener(placeMarker, 'click', function () {
            $("#loading").fadeIn("quick");
            $.get('/detail/' + place.getId(), function (html) {
                $("#loading").fadeOut("quick");
                showDetail(html);
            });
        });
        google.maps.event.addListener(placeMarker, "mouseover", function () {
            openInfoWindow();
            place.getLocationCard().parent('div').animate({ scrollTop: position }, 'normal');
            place.getLocationCard().attr('style', 'background-color: #f5f5f5;');
        });
        google.maps.event.addListener(placeMarker, "mouseout", function () {
            closeInfoWindow();
            place.getLocationCard().attr('style', '');
        });
        /*
        if(placeIdList.indexOf(placeId) == -1){
            placeIdList.push(placeId);
        }*/
    };
    return ZoneMap;
})();
var NameMarker = (function (_super) {
    __extends(NameMarker, _super);
    function NameMarker(lat, lng, map) {
        _super.call(this);
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
        if (zoom_level > 14)
            this.div_.style.fontSize = this.map.getZoom() * this.map.getZoom() * 0.4 + "%";
        this.div_.innerHTML = name;
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
var Places = (function () {
    function Places() {
    }
    return Places;
})();
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
function searchPlaces() {
}
function showDetail(html) {
    bootbox.dialog({
        title: "",
        message: html,
        size: "large",
        buttons: {
            checkIn: {
                label: "チェックイン（10ポイントゲット）",
                className: "btn-primary",
                callback: detailCheckIn
            },
            recommend: {
                label: "この場所をおすすめする",
                className: "btn-primary",
                callback: detailRecommend
            },
        }
    });
}
var checkInPlaceId = 0;
function checkIn(placeId) {
    if (navigator.geolocation) {
        checkInPlaceId = placeId;
        navigator.geolocation.getCurrentPosition(checkSuccessCallback, checkErrorCallback);
    }
    else {
        alert('ブラウザが位置情報取得に対応しておりません');
    }
}
function detailCheckIn() {
    if ($("#user_auth").attr("value") == "False") {
        location.href = "/new";
    }
    checkIn($("#detail_place_id").attr("value"));
}
function addPoint() {
    $.get('/add_point', { place_id: checkInPlaceId }, function (data) {
        $("#user_point").text("現在のpoint:" + data.split(",")[0]);
        bootbox.alert(data.split(',')[1]);
    });
}
function checkSuccessCallback(position) {
    var placeX = $("#detail_lng").attr("value");
    var placeY = $("#detail_lat").attr("value");
    var userX = position.coords.longitude;
    var userY = position.coords.latitude;
    if (cal_length(placeX, placeY, userX, userY) < 50) {
        addPoint();
    }
    else {
        bootbox.alert("その場所にいません");
    }
}
function checkErrorCallback(error) {
    bootbox.alert("位置情報が取得できませんでした");
}
function cal_length(placeX, placeY, userX, userY) {
    placeX = placeX * Math.PI / 180.0;
    placeY = placeY * Math.PI / 180.0;
    userX = userX * Math.PI / 180.0;
    userY = userY * Math.PI / 180.0;
    var A = 6378137; // 地球の赤道半径(6378137m)
    var x = A * (userX - placeX) * Math.cos(placeY);
    var y = A * (userY - placeY);
    var L = Math.sqrt(x * x + y * y); // メートル単位の距離
    return L;
}
var recommendPlaceId = 0;
function showRecommendForm(html, placeId) {
    recommendPlaceId = placeId;
    bootbox.dialog({
        title: "この場所をおすすめする",
        message: html,
        buttons: {
            success: {
                label: "Save",
                className: "btn-success",
                callback: saveRecommend
            }
        }
    });
}
function detailRecommend() {
    if ($("#user_auth").attr("value") == "False") {
        location.href = "/new";
    }
    $.get("/recommend_form/", function (html) {
        showRecommendForm(html, $("#detail_place_id").attr("value"));
    });
}
function saveRecommend() {
    var point = $("#point").val();
    var moods = [];
    var answer = $("input[name='moods']:checked").each(function (index, element) {
        moods.push($(element).val());
    });
    var place = $("#recommend").attr("value");
    $.post("/save_recommend/", { point: point, moods: moods, place: recommendPlaceId }, function (data) {
        $("#user_point").text("現在のpoint:" + data.split(",")[1]);
        $("#total_point_" + recommendPlaceId).text("合計ポイント:" + data.split(",")[2] + "point");
        bootbox.alert(data.split(',')[0]);
    });
}
//# sourceMappingURL=map.js.map