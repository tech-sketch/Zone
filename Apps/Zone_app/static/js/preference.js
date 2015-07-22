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

        categoriesChecked = $('[name=category]:checked').map(function(){
            return $(this).val();
        }).get()
        moodsChecked = $('[name=mood]:checked').map(function(index, element){
            return $(this).val();
        }).get()
        console.log(moodsChecked)
        toolsChecked = $('[name=tool]:checked').map(function(index, element){
            return $(this).val();
        }).get()
        $("#loading").fadeOut("quick");
        $.post("/preference_form/", {categories: categoriesChecked, moods: moodsChecked, tools: toolsChecked, place_id_list: placeIdList}, loadPlaces);
});
}

$(".preference").on("click", function(){
    $("#loading").fadeIn("quick");
    $.get('/preference_form/', function(html){
        $("#loading").fadeOut("quick");
        showPreference(html);
        $('#preference_form input[name=category]').each(function(i, thisCheckBox){
            rememberChecked(thisCheckBox, categoriesChecked);
        });
        $('#preference_form input[name=mood]').each(function(i, thisCheckBox){
            rememberChecked(thisCheckBox, moodsChecked);
        });
        $('#preference_form input[name=tool]').each(function(i, thisCheckBox){
            rememberChecked(thisCheckBox, toolsChecked);
        });
    });
});


function rememberChecked(thisCheckBox, checkedList){
    if(checkedList.some(function(element){
        return ($(thisCheckBox).val()==element);
    })){
        $(thisCheckBox).attr('checked', 'checked');
        $(thisCheckBox).parent("label").attr('style', checkedStyle);
    }
}