//action when click tags for search
// ======================


var checkedStyle = "cursor: default; background-color: rgb(128, 138, 178); color: rgb(255, 255, 255);"
var checkbox

function dispPreference(html){
    bootbox.dialog({
        title: "こだわり条件で絞り込む",
        message: html,
        backdrop: false,
    });

    $('#preference_form input[type=checkbox]').click(function(){
        if($(this).is(':checked')){
            $(this).parent("label").attr('style', checkedStyle);
        }
        else{
            $(this).parent("label").attr('style', "");
        }

        var length = $('[name=category]:checked').length;
        var categories =[];
        for(var i=0; i<length; i++){
            categories.push($($('[name=category]:checked')[i]).val());
        }

        var length = $('[name=tool]:checked').length;
        var tools =[];
        for(var i=0; i<length; i++){
            tools.push($($('[name=tool]:checked')[i]).val());
        }
        $("#loading").fadeOut("quick");
        $.post("/preference_form/", {categories:categories, tools:tools}, loadPlaces);
});
}

$("#preference").on("click", function(){
    $.get('/preference_form/', function(html){
        dispPreference(html);
    });
});