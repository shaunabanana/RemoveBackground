document.addEventListener("DOMContentLoaded", function (event) {
    let container = document.getElementById("image-container");
    var div = document.getElementById("em");
    div.style.height = '1em';
    container.style.height = window.innerHeight - container.offsetTop - div.offsetHeight * 4 + "px";

    let dropArea = document.getElementById('upload');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false)
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);
});


window.addEventListener("resize", function () {
    let container = document.getElementById("image-container");
    var div = document.getElementById("em");
    div.style.height = '1em';
    container.style.height = window.innerHeight - container.offsetTop - div.offsetHeight * 4 + "px";
})

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

function highlight(e) {
    let dropArea = document.getElementById('upload');
    dropArea.classList.add('highlight')
}

function unhighlight(e) {
    let dropArea = document.getElementById('upload');
    dropArea.classList.remove('highlight')
}

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    let imgElement = document.getElementById("image")
    imgElement.src = URL.createObjectURL(files[0]);
}