$("#recommend").on("click", function(){
    console.log("click");
    showForm();
});

function showForm(){
    bootbox.dialog({
        title: "このお店をおすすめする",
        message: {% include "recommend_form.html" %}
        buttons: {
            success: {
                label: "Save",
                className: "btn-success",
                callback: function () {
                    var name = $('#name').val();
                    var answer = $("input[name='awesomeness']:checked").val()
                    Example.show("Hello " + name + ". You've chosen <b>" + answer + "</b>");
                }
            }
        }
    });
}