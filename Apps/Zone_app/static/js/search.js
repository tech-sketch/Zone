//action when search places with search-form of top-var
// ======================
function searchPlaces(){
    var ref = location.pathname;
    if(ref == "/maps/"){
        $("#loading").fadeIn("quick");
        $.post("/search/", {address: $('[name=address]').val(), place_name:  $('[name=place_name]').val(),
         zoom_level: map.getZoom(), referrer: '/maps/' }, loadPlaces);
    }else{
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
    listenerList = [];
    $('#select').html('')
    $('#select').append($(response).find('#select').children());
    makePlacePin();
    if($(response).find('#location_lat').attr('value') && $(response).find('#zoom_level').attr('value')){
        map.setZoom(parseInt($(response).find('#zoom_level').attr('value')));
        map.panTo(new google.maps.LatLng($(response).find('#location_lat').attr('value'),
        $(response).find('#location_lng').attr('value')));
    }
}
