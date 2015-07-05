function showDetail(html){

    bootbox.dialog({
        title: "",
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