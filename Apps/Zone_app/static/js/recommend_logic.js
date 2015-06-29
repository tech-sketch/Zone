var recommendPlaceId  = 0;


function showRecommendForm(html, placeId){
    recommendPlaceId = placeId;
    bootbox.dialog({
        title: "この場所をおすすめする",
        message: html,
        buttons: {
            success: {
                label: "Save",
                className: "btn-success",
                callback: saveRecommend
            }
        }
    });
}

function detailRecommend(){
    console.log("detailRecommend")
    console.log($("#user_auth").attr("value"))
    if($("#user_auth").attr("value") == "False"){
        location.href = "/new"
    }
    $.get("/recommend_form/", function(html){
        showRecommendForm(html, $("#detail_place_id").attr("value"))
    })

}

function saveRecommend() {
    var point = $("#point").val();
    console.log(point);
    moods = [];
    var answer = $("input[name='moods']:checked").each(function(index, element){
        moods.push($(element).val());
    });
    var place = $("#recommend").attr("value");

    console.log(recommendPlaceId)
    //console.log("place_id:" + recommendPlaceId)
    $.post("/save_recommend/",{point: point, moods: moods, place: recommendPlaceId}, function(data){
        $("#user_point").text("現在のpoint:" + data.split(",")[0])
        bootbox.alert("「" + data.split(',')[1] + "」" + "に" + point + "ポイントを入れました！")

    });
}