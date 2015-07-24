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
        $("#user_point").text("現在のpoint:" + data.split(",")[1])
        $("#total_point_" + $('#detail_place_id').attr('value')).text("合計ポイント:" + data.split(",")[2] + "point")
        bootbox.alert(data.split(',')[0])
    });
}