let imgElement = document.getElementById("image")
let inputElement = document.getElementById("file");
let canvasElement = document.getElementById("canvas");
let original = null;

inputElement.addEventListener("change", (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);


function addValue(image, value) {
    //let add = image.clone();
    let adder = new cv.Mat(image.rows, image.cols, image.type());
    adder.setTo(new cv.Scalar(value, value, value, 0));
    cv.add(image, adder, image);
    adder.delete();
}


function multiplyValue(image, value) {
    let mult = image.clone();
    mult.setTo(new cv.Scalar(value, value, value, 1));
    cv.multiply(image, mult, image);
    mult.delete();
}


//Clip the values of an image. Remove the parts that are smaller than min and larget than max.
function clipValues(image, min, max) {
    maxClip = image.clone();
    minClip = image.clone();
    maxClip.setTo(new cv.Scalar(max))
    minClip.setTo(new cv.Scalar(min))
    cv.min(image, maxClip, image);
    cv.max(image, minClip, image);
    maxClip.delete();
    minClip.delete();
}


//Extract both X and Y gradients from an image, and merge them together. Basically edge extraction.
function extractEdges(image, gradient) {
    let gradientX1 = new cv.Mat();
    let gradientX2 = new cv.Mat();
    let gradientY1 = new cv.Mat();
    let gradientY2 = new cv.Mat();
    cv.Sobel(image, gradientX1, cv.CV_8U, 1, 0, 1, 1, 0, cv.BORDER_DEFAULT);
    cv.flip(image, image, 1);
    cv.Sobel(image, gradientX2, cv.CV_8U, 1, 0, 1, 1, 0, cv.BORDER_DEFAULT);
    cv.flip(image, image, 1);
    cv.flip(gradientX2, gradientX2, 1);

    cv.Sobel(image, gradientY1, cv.CV_8U, 0, 1, 1, 1, 0, cv.BORDER_DEFAULT);
    cv.flip(image, image, 0);
    cv.Sobel(image, gradientY2, cv.CV_8U, 0, 1, 1, 1, 0, cv.BORDER_DEFAULT);
    cv.flip(image, image, 0);
    cv.flip(gradientY2, gradientY2, 0);

    let gradientX = new cv.Mat();
    let gradientY = new cv.Mat();
    cv.max(gradientX1, gradientX2, gradientX);
    cv.max(gradientY1, gradientY2, gradientY);
    gradientX1.delete();
    gradientX2.delete();
    gradientY1.delete();
    gradientY2.delete();
    cv.max(gradientX, gradientY, gradient);
    gradientX.delete();
    gradientY.delete();
}


// Estimate the alpha of an image with a black background using the maximum brightness among its channels
function estimateAlpha(image, alpha) {
    let rgbaPlanes = new cv.MatVector();
    cv.split(image, rgbaPlanes);
    
    cv.max(rgbaPlanes.get(0), rgbaPlanes.get(1), alpha);
    cv.max(rgbaPlanes.get(2), alpha, alpha);
    rgbaPlanes.delete();

    let gradient = new cv.Mat();
    extractEdges(alpha, gradient);
    gradient.convertTo(gradient, cv.CV_32F);

    //convert to 0-1 and multiply by grandient enhancement param at the same time
    multiplyValue(gradient, g / 255.0); 
    clipValues(gradient, 0.0, 1.0);

    //create enhancer image
    enhance = gradient.clone();
    enhance.setTo(new cv.Scalar(1.0));
    cv.absdiff(gradient, enhance, enhance);
    multiplyValue(enhance, e); 
    clipValues(enhance, 1.0, 1024.0);
    gradient.delete();

    //multiply alpha by enhancer
    alpha.convertTo(alpha, cv.CV_32F);
    cv.multiply(alpha, enhance, alpha);
    clipValues(alpha, 0.0, 255.0);
    multiplyValue(alpha, 1 / 255.0); 
    enhance.delete();

    alphaOld = alpha.clone();
    alpha.convertTo(alpha, cv.CV_8U);

    //apply dilate and erode
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    cv.dilate(alpha, alpha, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    cv.erode(alpha, alpha, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    M.delete();

    //mix enhanced alpha with original alpha
    let factor = Math.tanh(e - 1.0);
    alpha.convertTo(alpha, cv.CV_32F);
    cv.addWeighted(alpha, factor, alphaOld, 1.0 - factor, 0.0, alpha);
    alphaOld.delete();
}


// expand a single Mat into a multi-channel image by stacking them
function explode(image, channels, dest) {
    let channelsVector = new cv.MatVector();
    for (var i = 0; i < channels; i++) {
        channelsVector.push_back(image.clone());
    }
    cv.merge(channelsVector, dest);
    channelsVector.delete();
}


//solve for colors
function solveColor(original, background, alpha, solved) {
    let invertedAlpha = alpha.clone();
    invertedAlpha.setTo(new cv.Scalar(1.0));
    //invertedAlpha.convertTo(invertedAlpha, cv.CV_32F);
    cv.subtract(invertedAlpha, alpha, invertedAlpha);

    let alphaRGB = new cv.Mat();
    explode(alpha, 3, alphaRGB);
    let invertedAlphaRGB = new cv.Mat();
    explode(invertedAlpha, 3, invertedAlphaRGB);

    background.convertTo(solved, cv.CV_32F);
    cv.multiply(solved, invertedAlphaRGB, solved);
    
    let temp = new cv.Mat();
    original.convertTo(temp, cv.CV_32F);

    cv.subtract(temp, solved, solved);
    addValue(alphaRGB, 1e-20, false); 
    addValue(solved, 1e-20, false); 
    cv.divide(solved, alphaRGB, solved);

    invertedAlpha.delete();
    alphaRGB.delete();
    invertedAlphaRGB.delete();
    temp.delete();
}


function calculateError(solved) {
    let image = solved.clone();
    //solved.convertTo(image, cv.CV_8U);

    let error = new cv.Mat();
    let errorValue = 0;
    
    // console.log(error.data);
    //errorValue += error.data.reduce(function(pv, cv) { return pv + cv; }, 0);

    cv.threshold(image, error, 0, 0, cv.THRESH_TRUNC);

    let temp = new cv.MatVector();
    cv.split(error, temp);
    for (var i = 0; i < error.channels(); i++) {
        let im = temp.get(i);
        errorValue += cv.countNonZero(im);
        im.delete();
    }
    temp.delete();
    error.delete();

    error = new cv.Mat();
    addValue(image, -255);
    multiplyValue(image, -1);
    cv.threshold(image, error, 0, 0, cv.THRESH_TRUNC);
    multiplyValue(error, -1);
    image.delete();
    
    temp = new cv.MatVector();
    cv.split(error, temp);
    for (var i = 0; i < error.channels(); i++) {
        let im = temp.get(i);
        errorValue += cv.countNonZero(im);
        im.delete();
    }
    temp.delete();
    error.delete();
    
    return errorValue;
}



let g = 1.0; 
let e = 1.0; 

imgElement.onload = function() {
    //Load image and remove alpha channel
    original = cv.imread(imgElement);
    let originalChannels = new cv.MatVector();
    cv.split(original, originalChannels);
    let tempChannels = new cv.MatVector();
    tempChannels.push_back(originalChannels.get(0));
    tempChannels.push_back(originalChannels.get(1));
    tempChannels.push_back(originalChannels.get(2));
    cv.merge(tempChannels, original);
    tempChannels.delete();
    originalChannels.delete();

    //Create background image
    let r = original.data[0], g = original.data[1], b = original.data[2];
    let background = original.clone();
    background.setTo(new cv.Scalar(r, g, b));

    //Subtract background from original, to create an image with black background
    let difference = new cv.Mat();
    cv.absdiff(original, background, difference);

    //Estimate alpha
    let alpha = new cv.Mat();
    estimateAlpha(difference, alpha);
    //alpha.convertTo(alpha, cv.CV_32F);
    //multiplyValue(alpha, 1.0 / 255.0);

    //now that we have estimated alpha, let's solve for the original colors
    //we use the formula c_orig = (c_foregroud - (1 - alpha) * c_background) / alpha.
    let solved = new cv.Mat();
    solveColor(original, background, alpha, solved);
    
    //calculate error
    //multiplyValue(alpha, 1.0 / cv.minMaxLoc(alpha).maxVal);
    let error = calculateError(solved);
    let lastError = Number.MAX_VALUE;
    let firstError = error;
    
    clip = alpha.clone();
    clip.setTo(new cv.Scalar(1.0));

    let count = 0;
    while(error > 1 && count < 25) {
        multiplyValue(alpha, 1.05);
        cv.min(alpha, clip, alpha);
        solveColor(original, background, alpha, solved);
        lastError = error;

        error = calculateError(solved);
        count ++;
    }
    clip.delete();
    background.delete();
    

    solved.convertTo(solved, cv.CV_8U);
    let solvedChannels = new cv.MatVector();
    cv.split(solved, solvedChannels);

    multiplyValue(alpha, 255);
    alpha.convertTo(alpha, cv.CV_8U);
    solvedChannels.push_back(alpha);
    cv.merge(solvedChannels, solved);

    cv.imshow("canvas", solved);

    downloadURI(canvasElement.toDataURL(), 'result.png');

    solvedChannels.delete();
    solved.delete();
    alpha.delete();
    original.delete();
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