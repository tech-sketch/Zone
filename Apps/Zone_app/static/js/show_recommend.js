function showRecommend(html){
    bootbox.dialog({
        title: "あなたにお勧めの場所があります",
        message: html,
        buttons: {
            checkIn: {
                label: "現在この場所にいる（10ポイントゲット）",
                className: "btn-primary",
                callback: detailCheckIn
            },
            recommend: {
                label: "このおみせをおすすめする",
                className: "btn-primary",
                callback: detailRecommend
            },
            success: {
                label: "閉じる",
                className: "btn-success",
            }
        }
    });
}
function startRecommend(){
    $.get('/recommend/', function(html){
        showRecommend(html);
    });
}
startRecommend();