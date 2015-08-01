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
    $.get('/add_point', {place_id: checkInPlaceId}, function(data){
        if(data.user_point){
            $("#user_point").text("現在のpoint:" + data.user_point);
        }
        bootbox.alert(data.message);
    });
}
function checkSuccessCallback(position){
    var placeX = $("#detail_lng").attr("value");
    var placeY = $("#detail_lat").attr("value");
    var userX = position.coords.longitude;
    var userY = position.coords.latitude;
    if(cal_length(placeX, placeY, userX, userY) < 50){
        addPoint();
    }else{
        bootbox.alert("その場所にいません");
    }
}

function checkErrorCallback(error){
    bootbox.alert("位置情報が取得できませんでした");
}

function cal_length(placeX, placeY, userX, userY){
    placeX = placeX * Math.PI / 180.0;
    placeY = placeY * Math.PI / 180.0;
    userX = userX * Math.PI / 180.0;
    userY = userY * Math.PI / 180.0;
    A = 6378137; // 地球の赤道半径(6378137m)
    x = A * (userX-placeX) * Math.cos( placeY );
    y = A * (userY-placeY);
    L = Math.sqrt(x*x + y*y);	// メートル単位の距離
    return  L;
}
