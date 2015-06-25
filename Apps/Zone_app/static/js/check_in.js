$("#check_in").click(function(){
    console.log("click")
    checkIn()
});

function checkIn(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(checkSuccessCallback, checkErrorCallback);
    }else{
        alert('ブラウザが位置情報取得に対応しておりません');
    }
}
function addPoint(){
    console.log("addpoint")
    $.get('/add_point', {place_id: $("#check_in").attr("value")}, function(data){
        $("#user_point").text(data.split(",")[0]);
        alert(data.split(",")[1]);
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
        alert("お店にいません");
    }
}

function checkErrorCallback(error){
    alert("位置情報が取得できませんでした");
}

function collision(placeX, placeY, userX, userY, range){
    var margin = range / 2;
    placeX = placeX - margin;
    placeY = placeY - margin;
    return placeX < userX && placeX + range > userX && placeY < userY && placeY + range > userY;
}

$("#place_id").attr("value")