let imgElement = document.getElementById("image");
let realImgElement = document.getElementById("real-image");
let inputElement = document.getElementById("file");
let canvasElement = document.getElementById("canvas");
let realCanvasElement = document.getElementById("real-canvas");
let eyedropperElement = document.getElementById("eyedropper");
let downloadElement = document.getElementById("download");

let original = null;
let percentage = 0;
let bgcolor = [255, 255, 255];


inputElement.addEventListener("change", (e) => {
    showUpload(false);
    imgElement.src = URL.createObjectURL(e.target.files[0]);
    // realImgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);


function eyedropperClicked() {
    console.log("eyedropper");
    if (this.canPickColor) {
        this.pickingColor = true;
        eyedropperElement.classList.add("active");

        let context = canvasElement.getContext("2d");
        context.imageSmoothingEnabled = false;
        context.drawImage(realImgElement, 0, 0, canvasElement.width, canvasElement.height);
    }
}


function downloadClicked() {
    console.log("download");
}


canvasElement.addEventListener("click", function (event) {
    let elementPos = this.getBoundingClientRect();
    let scaleFactor = this.width / Number(this.style.width.slice(0, -2));
    let x = Math.ceil( (event.pageX - elementPos.x) * scaleFactor );
    let y = Math.ceil( (event.pageY - elementPos.y) * scaleFactor );

    // Get the data of the pixel according to the location generate by the getEventLocation function
    let context = this.getContext('2d');
    let pixelData = context.getImageData(x, y, 1, 1).data; 
    // console.log("canvas", x, y, pixelData);
    if (pixelData[4] != 0) {
        bgcolor = pixelData.slice(0, 3);
        realImgElement.src = imgElement.src;
    }
});


function downloadResult() {
    downloadURI(realCanvasElement.toDataURL(), 'result.png');

    showProgress(false);
    showUpload(true);
    canvasElement.style.display = 'none';
    let containerElement = document.querySelector(".image-container");
    containerElement.style.width = null;

    setTimeout(function () {
        location.reload();
    }, 2000);
}

realImgElement.onload = function () {
    canPickColor = false;
    canDownload = false;
    
    showProgress(true);
    processImage(realImgElement, 'real-canvas', bgcolor, function () {
        
        setTimeout(function () {
            showProgress(false);
        }, 100);

        imgElement.src = realCanvasElement.toDataURL();

        document.getElementById('tip').style.display = 'none';
        document.getElementById('tip-download').style.display = 'inline-block';
        
    });
}

imgElement.onload = function () {
    //Show progress bar
    percentage = 0;
    setProgress(0.0);
    canvasElement.style.display = 'block';
    document.getElementById('tip').innerHTML = "now click on the background color you want to remove!";
    // imgElement.style.display = 'block';

    
    let containerElement = document.querySelector(".image-container");
    //let containerWidth = Number(containerElement.style.width.slice(0, -2));
    let containerHeight = Number(containerElement.style.height.slice(0, -2));

    // imgElement.style.maxWidth = containerWidth;
    canvasElement.height = imgElement.height;
    canvasElement.width = imgElement.width;
    let aspectRatio = imgElement.width / imgElement.height;

    let newHeight = containerHeight - 20;
    let newWidth = aspectRatio * containerHeight - 20;
    if (newWidth > window.innerWidth * 0.8) {
        newWidth = window.innerWidth * 0.8 - 20;
        newHeight = newWidth / aspectRatio;
    }

    imgElement.style.maxWidth = newWidth + "px";
    imgElement.style.maxHeight = newHeight + "px";
    canvasElement.style.width = imgElement.style.maxWidth;
    canvasElement.style.height = imgElement.style.maxHeight;
    containerElement.style.width = newWidth + 20 + "px";

    
    let context = canvasElement.getContext("2d");
    context.drawImage(imgElement, 0, 0, canvasElement.width, canvasElement.height);
    canvasElement.style.opacity = 1;
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