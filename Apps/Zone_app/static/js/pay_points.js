//zoneMapクラスのaddPlaceListenerメソッドでリスナー登録される関数
function showRecommendForm(html){
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
    $.get("/pay_points/", {place_id: $('#detail_place_id').attr('value')},  function(html){
        showRecommendForm(html);
    });
}

function saveRecommend() {
    $.post("/pay_points/", $('#pay_points_form').serialize(), function(data){
        if(data.user_point && data.place_point){
            $("#user_point").text("現在のpoint:" + data.user_point);
            $("#total_point_" + $('#detail_place_id').attr('value')).text("合計ポイント:" + data.place_point + "point");
        }
        bootbox.alert(data.message);
    });
}