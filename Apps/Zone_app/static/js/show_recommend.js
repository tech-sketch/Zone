function showRecommend(html){
    bootbox.dialog({
        title: "あなたにお勧めの場所があります",
        message: html,
        size: "large",
        buttons: {
            checkIn: {
                label: "チェックイン（10ポイントゲット）",
                className: "btn-primary",
                callback: detailCheckIn
            },
            recommend: {
                label: "この場所をおすすめする",
                className: "btn-primary",
                callback: detailRecommend
            },
        }
    });
}
function startRecommend(){
    $.get('/recommend/', function(html){
        showRecommend(html);
    });
}
startRecommend();