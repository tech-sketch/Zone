function connect(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            $.get("/weather_api",{lat:position.coords.latitude, lng:position.coords.longitude}, success);
        }, function(error){
            alert('位置情報が取得できません');
        });
    }else{
        alert('ブラウザが位置情報取得に対応しておりません');
    }
}

function success(data){
    console.log(data);
}
connect();