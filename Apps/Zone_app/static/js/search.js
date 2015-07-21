var northeast
var southwest

//action when search places with search-form of top-var
// ======================
function searchPlaces(){
    $("#loading").fadeIn("quick");
    var ref = location.pathname;
    if(ref == "/map/"){
        var place_name = null;
        if($('[name=address]').val())codeAddress();
        if($('[name=place_name]').val())place_name = $('[name=place_name]').val();
        var latlngBounds = map.getBounds();
        northeast = latlngBounds.getNorthEast();
        southwest = latlngBounds.getSouthWest();
        $.get("/search/", {NE_lng: northeast.lng(), NE_lat: northeast.lat(), SW_lng: southwest.lng(),
         SW_lat: southwest.lat(), place_name: place_name}, function(response){
            placeIdList = [];
            categoriesChecked = [];
            moodsChecked = [];
            toolsChecked = [];
            loadPlaces(response);
         });
    } else{
        $('#search_form').submit();
    }
}

function loadPlaces(response){
    $("#loading").fadeOut("quick");
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
    if($(response).find('#location_lat').attr('value') && $(response).find('#zoom_level').attr('value')){
        map.setZoom(parseInt($(response).find('#zoom_level').attr('value')));
        map.panTo(new google.maps.LatLng($(response).find('#location_lat').attr('value'),
        $(response).find('#location_lng').attr('value')));
    }
}


function codeAddress() {
    var address = document.getElementById('address_searched').value;
    geocoder.geocode( { 'address': address, 'region': 'JP'}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            if(results[0].geometry.bounds)map.fitBounds(results[0].geometry.bounds);
            if(results[0].geometry.viewport)map.fitBounds(results[0].geometry.viewport);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}
