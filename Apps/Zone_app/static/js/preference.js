//action when click tags for search
// ======================

var checkedStyle = "cursor: default; background-color: rgb(128, 138, 178); color: rgb(255, 255, 255);";
var itemChecked =[];

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

        itemChecked = $('#preference_form input[type=checkbox]:checked').map(function(){
            return $(this).attr("id");
        }).get()
        $("#loading").fadeOut("quick");
        $.post("/preference_form/", $('#narrow_down').serialize());
});
}

$(".preference").on("click", function(){
    $("#loading").fadeIn("quick");
    $.get('/preference_form/', function(html){
        $("#loading").fadeOut("quick");
        showPreference(html);

        $('#preference_form input[type=checkbox]').each(function(i, thisCheckBox){
            rememberChecked(thisCheckBox, itemChecked);
        });
    });
});


function rememberChecked(thisCheckBox, checkedList){
    if(checkedList.some(function(element){
        return ($(thisCheckBox).attr("id")==element);
    })){
        $(thisCheckBox).attr('checked', 'checked');
        $(thisCheckBox).parent("label").attr('style', checkedStyle);
    }
}