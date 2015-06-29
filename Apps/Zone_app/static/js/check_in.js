var checkInPlaceId = 0;
function checkIn(placeId){
    if(navigator.geolocation){
        checkInPlaceId = placeId
        navigator.geolocation.getCurrentPosition(checkSuccessCallback, checkErrorCallback);
    }else{
        alert('ブラウザが位置情報取得に対応しておりません');
    }
}

function detailCheckIn(){
    if($("#user_auth").attr("value") == "False"){
        location.href = "/new"
    }
    checkIn($("#detail_place_id").attr("value"));
}

function addPoint(){
    console.log("addpoint")
    console.log(checkInPlaceId)
    $.get('/add_point', {place_id: checkInPlaceId}, function(data){
        console.log("success")
        $("#user_point").text("現在のpoint:" + data.split(",")[0]);
        console.log("change point")
        bootbox.alert(data.split(',')[1]);
    });
}
function checkSuccessCallback(position){
    var placeX = $("#longitude").attr("value");
    var placeY = $("#latitude").attr("value");
    var userX = position.coords.longitude;
    var userY = position.coords.latitude;
    if(collision(placeX, placeY, userX, userY, 1)){
        addPoint();
    }else{
        bootbox.alert("お店にいません");
    }
}

function checkErrorCallback(error){
    bootbox.alert("位置情報が取得できませんでした");
}

function collision(placeX, placeY, userX, userY, range){
    var margin = range / 2;
    placeX = placeX - margin;
    placeY = placeY - margin;
    return placeX < userX && placeX + range > userX && placeY < userY && placeY + range > userY;
}
