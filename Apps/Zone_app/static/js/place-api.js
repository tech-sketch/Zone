function connect(){
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=35.691638,139.704616&radius=50000&keyword=cafe|foo&sensor=false&language=ja&key=AIzaSyAqx3ox6iSZ3599nPe314NQNkbxfg-aXC0";
    //$.get(url, success)
    data = {
        types: ['cafe', 'food']
    }
    $.get("/places_api", success);
}

function success(data){
    console.log(data);
}
//connect();