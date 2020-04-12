# RemoveBackground

**UPDATE: [now it runs in your browser](https://seanabanana.github.io/RemoveBackground)!** There are memory limitations, though... Working on it!

For those who found a really nice free icon/illustration/etc., but sadly realized it's not RGBA. This quick and dirty script is for you. Below are some examples (I added grid in the background to show the transparent parts):

![](demo1.png)

![](demo2.png)

![](demo3.png)

**Requirements:**

NumPy, OpenCV

## Usage

Use the [web tool](https://seanabanana.github.io/RemoveBackground)

or

Download the script
```shell
usage: python3 RemoveBackground.py [-h] [-c C C C] [-e E] [-g G] image

(Hopefully) removes single-colored background from images.

positional arguments:
  image

optional arguments:
  -h, --help  show this help message and exit
  -c C C C    RGB value of the background. Defaults to white.
  -e E        If you want to crank up the alpha value, set to something
              greater than 1.0.
  -g G        If the algorithm is eating up the edges, set a value higher than
              1.0.
```

## How does it work?

Basically, if we want to get the original RGBA image, we're solving this equation shown below. In the equation, we use `ImageRGB` to represent our input image. `BackgroundRGB` is the constant color background we want to remove. `Alpha` and `OriginalRGB` are the two pieces of information we want to recover from the original image.

```
Alpha * OriginalRGB + (1 - Alpha) * BackgroundRGB = ImageRGB
```

However, this is one equation with two unknowns! In this case, we have to estimate one to get the other. Here, we try to estimate `Alpha`. Do some tweaking on the equation, and we get the following:

```
OriginalRGB = ImageRGB - BackgroundRGB / Alpha + BackgroundRGB
```

As we can see, if we pretend that we know `Alpha`, we can easily solve for `OriginalRGB`. Now let's see how we can estimate `Alpha`. One way often used by designers when it comes to removing black background, is to use the brightness of the image as alpha. Here we learn from this approach. The first step is to transform our problem (arbitrary background color) to a black background problem. We do this by simply subtracting background from foreground and taking the absolute value of the result:

```
Alpha = maxInRGB( BlackBackgroundImage ) = maxInRGB( abs(Image - Background) )
```

Here `maxInRGB` denotes a pixel-wise operation that select the largest number among the R, G, and B values. 

However, the `Alpha` we get this way is often very dark, and therefore makes the whole image somewhat transparent. One way to solve this problem is to crank up the value by multiplying with some constant. However, in this process we often lose some fine anti-aliased edges. One obvious solution is to protect the edges by masking them from the multiplication. Gradients work pretty well for this purpose. 

```
EdgesMask = max( HorizontalGradient(Alpha), VerticalGradient(Alpha) )
EnhancerImage = (1 - EdgesMask) * e  //This is the e in the script parameters!
Alpha = Alpha .* EnhancerImage  //Elementwise multiplication.
```

One problem with this is that the gradient mask sometimes mask places that should be enhanced, therefore leaving tiny cracks with low alpha. We get rid of these by applying a 3 * 3 max filter and a 3 * 3 min filter. 

One final problem is that our EnhancerImage might not be enough. When finally solving for the original colors (OriginalRGB), we sometimes see values greater than 255 or less than 0. We measure can measure this error by calculating the sum of values less than 0 (absolute value, of course), and those greater than 255. We loop repeatedly to enhance Alpha until this error reaches 0. 

Voila! You get your clean RGBA image.

## Sidenote

This is a very naive method to unmix colors. It is prone to noise and does not work very well with photos. For a "proper" way of unmixing colors, see this amazing work published by Disney Research Zürich and  ETH Zürich: [Interactive High-Quality Green-Screen Keying via Color Unmixing](https://s3-us-west-1.amazonaws.com/disneyresearch/wp-content/uploads/20160816162952/Interactive-High-Quality-Green-Screen-Keying-via-Color-Unmixing-Paper.pdf)
