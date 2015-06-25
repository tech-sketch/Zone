$("#recommend").on("click", function(){
    showForm();
});
function saveRecommend() {
    var point = $("#point").val();
    console.log(point);
    moods = [];
    var answer = $("input[name='moods']:checked").each(function(index, element){
        moods.push($(element).val());
    });
    var place = $("#place_id").attr("value");
    //console.log(place)
    console.log(moods);
    $.post("/save_recommend/",{point: point, moods: moods, place: place}, function(data){
        console.log("request ok" + data);
    });
}