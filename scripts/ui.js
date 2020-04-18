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
    let imgElement = document.getElementById("image");
    let realImgElement = document.getElementById("real-image");
    imgElement.src = URL.createObjectURL(files[0]);
    realImgElement.src = URL.createObjectURL(files[0]);
}


function setProgress(percentage) {
    let progress = document.getElementById("progress-fill");
    percentage = percentage < 0.05 ? 0.05: percentage;
    progress.style.width = percentage * 100 + "%";
}


function showProgress(show) {
    let progress = document.getElementById("progress");
    progress.style.display = show ? "block" : "none";
    
}


function showUpload(show) {
    let upload = document.getElementById("upload");
    upload.style.display = show ? "block" : "none";
}


/**
 * Return the location of the element (x,y) being relative to the document.
 * 
 * @param {Element} obj Element to be located
 */
function getElementPosition(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}



/** 
 * return the location of the click (or another mouse event) relative to the given element (to increase accuracy).
 * @param {DOM Object} element A dom element (button,canvas,input etc)
 * @param {DOM Event} event An event generate by an event listener.
 */
function getEventLocation(element,event){
    // Relies on the getElementPosition function.
    var pos = element.getBoundingClientRect()
    
    return {
    	x: (event.pageX - pos.x),
      	y: (event.pageY - pos.y)
    };
}