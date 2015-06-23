var checkedStyle = "cursor: default; background-color: rgb(128, 138, 178); color: rgb(255, 255, 255);"

$(':checkbox').click(function(){
    if($(this).is(':checked')){
        $(this).parent("label").attr('style', checkedStyle);

        var length = $('[name=categories]:checked').length
        var data =[];
        for(var i=0; i<length; i++){
            data.push($($('[name=categories]:checked')[i]).val());
        }

        $.post("/list/", {'categories': data});

    }
    else{
        $(this).parent("label").attr('style', "");

    }
})

function loadPlaces(){

}