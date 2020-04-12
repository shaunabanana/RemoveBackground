let imgElement = document.getElementById("image");
let realImgElement = document.getElementById("real-image");
let inputElement = document.getElementById("file");
let canvasElement = document.getElementById("canvas");
let original = null;
let percentage = 0;

inputElement.addEventListener("change", (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
    realImgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);


let g = 1.0; 
let e = 1.0; 

realImgElement.onload = function() {
    processImage(realImgElement, function () {
        downloadURI(canvasElement.toDataURL(), 'result.png');
        showUpload();
        let containerElement = document.querySelector(".image-container");
        containerElement.style.width = null;
        imgElement.style.display = 'none';
        setTimeout(function () {
            location.reload();
        }, 500);
    });
}

imgElement.onload = function() {
    //Show progress bar
    showProgress();
    percentage = 0;
    setProgress(0.0);
    imgElement.style.display = 'block';

    let containerElement = document.querySelector(".image-container");
    let containerHeight = Number(containerElement.style.height.slice(0, -2));
    console.log(imgElement.height, containerHeight);
    if (imgElement.height >= containerHeight) {
        imgElement.style.height = containerHeight - 20 + "px";
    }
    
    containerElement.style.width = imgElement.width + 20 + "px";
}


function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}