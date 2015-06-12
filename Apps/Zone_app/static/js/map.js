var geocoder;
var map;
function initialize() {
    geocoder = new google.maps.Geocoder();
    var mapOptions = {
        center: { lat: -34.397, lng: 150.644},
        zoom: 8
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}
function codeAddress() {
    var address = document.getElementById('address').value;
    geocoder.geocode( { 'address': address, region: 'JP'}, function(results, status) {
        for(i in results){
            if (status == google.maps.GeocoderStatus.OK) {
              map.setCenter(results[i].geometry.location);
              var latlng = results[i].geometry.location;
              new google.maps.InfoWindow({
                content: results[i].formatted_address + "<br>(Lat, Lng) = " + latlng.toString()
              }).open(map, new google.maps.Marker({
                position: latlng,
                map: map
              }));
            } else {
              alert('Geocode was not successful for the following reason: ' + status);
            }
        }
    });
}
google.maps.event.addDomListener(window, 'load', initialize);