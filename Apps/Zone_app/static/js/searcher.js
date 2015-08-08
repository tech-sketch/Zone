/// <reference path="jquery.d.ts" />
/// <reference path="google.maps.d.ts"/>
/// <reference path="zone_map.ts"/>
var PlacesMaker = (function () {
    function PlacesMaker(zoneMap) {
        this.zoneMap = zoneMap;
        this.placeList = [];
    }
    PlacesMaker.prototype.getPlaceIdList = function () {
        var placeIdList = [];
        for (var i = 0; i < this.placeList.length; i++) {
            placeIdList.push(this.placeList[i].getId());
        }
        return placeIdList;
    };
    PlacesMaker.prototype.updatePlaces = function (updatePlaceList) {
        if (updatePlaceList === void 0) { updatePlaceList = false; }
        if (updatePlaceList)
            this.placeList = [];
        for (var i = 0; i < $("[id=name]").length; i++) {
            var name = $($("[id=name]")[i]).attr("value");
            var lat = Number($($("[id=latitude]")[i]).attr("value"));
            var lng = Number($($("[id=longitude]")[i]).attr("value"));
            var placeId = Number($($("[id=place_id]")[i]).attr("value"));
            var locationCard = $($("[class=location_card]")[i]);
            var place = new Place(placeId, name, lat, lng, locationCard);
            this.zoneMap.setPlace(place);
            if (updatePlaceList)
                this.placeList.push(place);
        }
    };
    PlacesMaker.prototype.updatePage = function (response) {
        this.zoneMap.clear();
        $('#location_list').html('');
        $('#location_list').append($(response).find('#location_list').children());
    };
    return PlacesMaker;
})();
var Searcher = (function () {
    function Searcher(zoneMap, placesMaker) {
        this.zoneMap = zoneMap;
        this.placesMaker = placesMaker;
        this.geocoder = new google.maps.Geocoder();
    }
    Searcher.prototype.searchPlaces = function () {
        $("#loading").fadeIn("quick");
        if ($('[name=address]').val()) {
            this.codeAddress();
        }
        else {
            this.fetchPlaces();
        }
        $("#loading").fadeOut("quick");
    };
    Searcher.prototype.codeAddress = function () {
        var address = $('#address_searched').val();
        var geocoder = new google.maps.Geocoder();
        var self = this;
        geocoder.geocode({ 'address': address, 'region': 'JP' }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                self.zoneMap.setCenter(results[0].geometry.location);
                if (results[0].geometry.bounds) {
                    self.zoneMap.fitBounds(results[0].geometry.bounds);
                }
                if (results[0].geometry.viewport) {
                    self.zoneMap.fitBounds(results[0].geometry.viewport);
                }
                self.fetchPlaces();
            }
            else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    };
    Searcher.prototype.fetchPlaces = function () {
        var latlngBounds = this.zoneMap.getBounds();
        var northeast = latlngBounds.getNorthEast();
        var southwest = latlngBounds.getSouthWest();
        var self = this;
        $.get("/search/", { northeast_lng: northeast.lng(), northeast_lat: northeast.lat(), southwest_lng: southwest.lng(),
            southwest_lat: southwest.lat(), place_name: $('[name=place_name]').val() }, function (response) {
            itemChecked = []; //検索後は絞り込みダイアログのcheckboxのチェックを外す
            self.placesMaker.updatePage(response);
            self.placesMaker.updatePlaces(true);
        });
    };
    return Searcher;
})();
//ここからトップレベル
$('#loading').fadeOut("quick");
var defaultLatLng = new google.maps.LatLng(35.682323, 139.765955); //東京駅
var defaultZoom = 15;
var defaultMapOptions = {
    center: defaultLatLng,
    zoom: defaultZoom
};
var markerImg = new google.maps.MarkerImage("/static/images/man.png", new google.maps.Size(32, 32), new google.maps.Point(0, 0), new google.maps.Point(10, 24) // Anchorポイント
);
var zoneMap = new ZoneMap(defaultMapOptions, markerImg);
var placesMaker = new PlacesMaker(zoneMap);
var searcher = new Searcher(zoneMap, placesMaker);
function startSearch() {
    searcher.searchPlaces();
}
function searchThisArea() {
    $('[name=address]').val("");
    startSearch();
}
zoneMap.addActionOnceBoundChanged(startSearch);
zoneMap.load();
var $function_list = $('#function-list');
$function_list.find('.btn-back').on('click', function () {
    zoneMap.panToCurrentCenter();
});
$function_list.find('.btn-search-here').on('click', function () {
    searchThisArea();
});
$function_list.find('.btn-recommend').on('click', function () {
});
$function_list.find('.btn-create-place').on('click', function () {
});
