function showDetail(detailTemplate){

    bootbox.dialog({
        title: "",
        message: detailTemplate,
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

$(document).on('click', '.bootbox', function (event) {
    if(event.target == this)bootbox.hideAll()
});