//action when click tags for search
// ======================

var checkedStyle = "cursor: default; background-color: rgb(128, 138, 178); color: rgb(255, 255, 255);"

$(':checkbox').click(function(){
    if($(this).is(':checked')){
        $(this).parent("label").attr('style', checkedStyle);
    }
    else{
        $(this).parent("label").attr('style', "");
    }

    var length = $('[name=category]:checked').length;
    var categories =[];
    for(var i=0; i<length; i++){
        categories.push($($('[name=category]:checked')[i]).val());
    }

    var length = $('[name=tool]:checked').length;
    var tools =[];
    for(var i=0; i<length; i++){
        tools.push($($('[name=tool]:checked')[i]).val());
    }

    $.post("/list/", {categories:categories, tools:tools}, loadPlaces);

})


/*
function loadPlaces(data){
    var places = $.parseJSON(data);
    $('div.search-result').html("");
    for(i in places){
        var str = ''
        str += '<div class="entry" style="float:left;width:306px;height:300px;margin-bottom:28px; "><div id="entries"><div style="width:270px;height:180px;">';
        str += '<a href="/detail/'+ places[i].id + '"> <img src="' + places[i].picture + '" alt='+ places[i].name + ' width="270" height="180"></a></div>';
        str += '<div id="entrytitle"><a href="/detail/' + places[i].id + '">' + places[i].name + '</a></div>';
        str += '<div style="width:230px;height:43px;margin:9px 16px 10px 20px;line-height:22px;"><span style="font-size:12px;">wi-fi:';
        if(places[i].wifi_softbank)str += " softbank";
        if(places[i].wifi_free)str += " free";
        str += '</span></div><div style="float:right;font-size:11px;margin:0px 13px 9px 0px;">東京・西新宿</div></div></div>';
        $('div.search-result').append(str);
    }

}*/

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
    map.setZoom(parseInt($(response).find('#zoom_level').attr('value')));
    $('#select').html('')
    $('#select').append($(response).find('#select').children());
    makePlacePin();
    if($(response).find('#location_lat').attr('value') != null){
        map.panTo(new google.maps.LatLng($(response).find('#location_lat').attr('value'),
        $(response).find('#location_lng').attr('value')));
    }
}



function dispPreference(){
    bootbox.dialog({
        title: "こだわり条件で絞り込む",
        message: '',
    });
}
