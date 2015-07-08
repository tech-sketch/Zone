function showRecommend(html){
    bootbox.dialog({
        title: "あなたにお勧めの場所があります",
        message: html,
        size: "large",
    });
}
function startRecommend(){
    $.get('/recommend/', function(html){
        showRecommend(html);
    });
}
startRecommend();