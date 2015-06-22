var onStyle = "color: rgb(73, 76, 89); background-color: rgb(255, 255, 255);"

$("[name=genres]").click(function(){
    if($(this).is(':checked')){
        console.log("checked")

    }
    else{
        $(this).style = ""
    }
})

function setBtnColor(btn){
    if(btn.checked){
        console.log("checked");
    }
    else {
        btn.style = "";
        console.log("un");
    }
}