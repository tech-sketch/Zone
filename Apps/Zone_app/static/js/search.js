var geocoder = new google.maps.Geocoder();
var $functions = $('#function-list')

$functions.find('.btn-back').on('click', function(){
    zoneMap.panToCurrentCenter();
});

$functions.find('.btn-search-here').on('click', function(){
    searchThisArea();
});

$functions.find('.btn-recommend').on('click', function(){

});

$functions.find('.btn-create-place').on('click', function(){

});


function codeAddress(map) {
    var address = document.getElementById('address_searched').value;
    geocoder.geocode( { 'address': address, 'region': 'JP'}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            if(results[0].geometry.bounds)map.fitBounds(results[0].geometry.bounds);
            if(results[0].geometry.viewport)map.fitBounds(results[0].geometry.viewport);
            fetchPlaces(map);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}


function fetchPlaces(map){
    var latlngBounds = map.getBounds();
    var northeast = latlngBounds.getNorthEast();
    var southwest = latlngBounds.getSouthWest();
    $.get("/search/", {northeast_lng: northeast.lng(), northeast_lat: northeast.lat(), southwest_lng: southwest.lng(),
                        southwest_lat: southwest.lat(), place_name: $('[name=place_name]').val()}, function(response){
        placeIdList = [];
        itemChecked = [];　//検索後は絞り込みダイアログのcheckboxのチェックを外す
        loadPlaces(response, map);
    });
}


function loadPlaces(response, map){
    map.getMarkerList().forEach(function(marker){
        marker.setMap(null);
    });
    map.clearMarkerList();
    map.getOverlayList().forEach(function(overlay){
        overlay.toggleDOM();
    });
    map.clearOverlayList();
    $('#location_list').html('')
    $('#location_list').append($(response).find('#location_list').children());
    createPlaces(map);
}

function searchThisArea(){
    $('[name=address]').val("");
    startSearch();
}