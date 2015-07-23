//action when search places with search-form of top-var
// ======================

function searchPlaces(map){
   $("#loading").fadeIn("quick");
   if($('[name=address]').val()){
       codeAddress(map);
   } else{
       fetchPlaces(map);
   }
   $("#loading").fadeOut("quick");
}

var geocoder = new google.maps.Geocoder();

function codeAddress() {
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
    map.clearMarkerList();
    map.clearOverlayList();
    $('#location_list').html('')
    $('#location_list').append($(response).find('#location_list').children());
    createPlaces(map);
}