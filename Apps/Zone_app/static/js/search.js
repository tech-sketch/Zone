
// For CSRF
// ======================
jQuery(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});


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

}