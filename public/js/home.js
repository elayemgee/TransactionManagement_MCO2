function insertNewMovie(){
    /*
    $('#insert-entry-btn').on('click', function (e) {
        e.preventDefault();
    
        $.ajax({
            url: '/insertRecord',
            type: 'POST',
            data: $('#my_form').serialize(),
            success: function (data) {
                if (data[0].toUpperCase() != data[0].toLowerCase()) alert(data);
            }
        });
    });
    */
}

/*
$(document).ready(function () {
    //$('#insert-entry-btn').on('click', function (e) {
    $('#insert-entry-btn').on('click', function (e) {
        console.log('here');
        e.preventDefault();

        
        $.ajax({
            url: '/insertRecord',
            type: 'POST',
            data: $('#my_form').serialize(),
            success: function (data) {
                if (data[0].toUpperCase() != data[0].toLowerCase()) alert(data);
            }
        });
    });
})
*/

function clearUpdateInputs() {
    document.getElementById("movieId").value = '';
    document.getElementById("director").value = '';
    document.getElementById("movietitle").value = '';
    document.getElementById("actor1").value = '';
    document.getElementById("actor2").value = '';
    document.getElementById("year").value = '';
    document.getElementById("genre").value = '';
}

function clearInsertInputs() {
    document.getElementById("director").value = '';
    document.getElementById("movietitle").value = '';
    document.getElementById("actor1").value = '';
    document.getElementById("actor2").value = '';
    document.getElementById("year").value = '';
    document.getElementById("genre").value = '';
}