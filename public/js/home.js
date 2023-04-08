
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

function insertNewMovie(){
    $('#insert-entry-btn').on('click', function (e) {
        /* Override the default submit behavior and insert AJAX. */
        e.preventDefault();
    
        $.ajax({
            url: '/addEntry',
            type: 'POST',
            data: $('#my_form').serialize(),
            success: function (data) {
                /* Display data only if it the first character is a letter. */
                if (data[0].toUpperCase() != data[0].toLowerCase()) alert(data);
            }
        });
    });
}


