//action when click tags for search
// ======================

var checkedStyle = "cursor: default; background-color: rgb(128, 138, 178); color: rgb(255, 255, 255);";
var categoriesChecked = [];
var moodsChecked = [];
var toolsChecked = [];

function showPreference(html){
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
        categoriesChecked = [];
        for(var i=0; i<length; i++){
            categoriesChecked.push($($('[name=category]:checked')[i]).val());
        }
        var length = $('[name=mood]:checked').length;
        moodsChecked = [];
        for(var i=0; i<length; i++){
            moodsChecked.push($($('[name=mood]:checked')[i]).val());
        }
        var length = $('[name=tool]:checked').length;
        toolsChecked = [];
        for(var i=0; i<length; i++){
            toolsChecked.push($($('[name=tool]:checked')[i]).val());
        }
        $("#loading").fadeOut("quick");
        $.post("/preference_form/", {categories: categoriesChecked, moods: moodsChecked, tools: toolsChecked, place_id_list: placeIdList}, loadPlaces);
});
}

$("#preference").on("click", function(){
    $.get('/preference_form/', function(html){
        showPreference(html);
        $('#preference_form input[name=category]').each(function(i, thisCheckBox){
            rememberChecked(categoriesChecked, thisCheckBox);
        });
        $('#preference_form input[name=mood]').each(function(i, thisCheckBox){
            rememberChecked(moodsChecked, thisCheckBox);
        });
        $('#preference_form input[name=tool]').each(function(i, thisCheckBox){
            rememberChecked(toolsChecked, thisCheckBox);
        });
    });
});


function rememberChecked(checkedList, thisCheckBox){
    if(checkedList.some(function(element){
        return ($(thisCheckBox).val()==element);
    })){
        $(thisCheckBox).attr('checked', 'checked');
        $(thisCheckBox).parent("label").attr('style', checkedStyle);
    }
}