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
    $.get("/recommend_form/", function(html){
        showRecommendForm(html, $("#detail_place_id").attr("value"))
    })
}

function saveRecommend() {
    var point = $("#point").val();
    moods = [];
    var answer = $("input[name='moods']:checked").each(function(index, element){
        moods.push($(element).val());
    });
    var place = $("#recommend").attr("value");
    $.post("/recommend_form/",{point: point, moods: moods, place: recommendPlaceId}, function(data){
        $("#user_point").text("現在のpoint:" + data.split(",")[1])
        $("#total_point_" + recommendPlaceId).text("合計ポイント:" + data.split(",")[2] + "point")
        bootbox.alert(data.split(',')[0])
    });
}