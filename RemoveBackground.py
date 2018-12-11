#!/usr/bin/env python3
import sys
import argparse
import os.path
from math import tanh
import cv2
import numpy as np

parser = argparse.ArgumentParser(description='(Hopefully) removes single-colored background from images.')
parser.add_argument('-c', nargs=3, default=[255, 255, 255], help="RGB value of the background. Defaults to white.")
parser.add_argument('-e', default=1.0, type=float, help="If you want to crank up the alpha value, set to something greater than 1.0.")
parser.add_argument('-g', default=1.0, type=float, help="If the algorithm is eating up the edges, set a value higher than 1.0.")
parser.add_argument('image')

args = parser.parse_args(sys.argv[1:])

original = cv2.imread(args.image)
background = np.zeros_like(original)
background[..., 2] = int(args.c[0])
background[..., 1] = int(args.c[1])
background[..., 0] = int(args.c[2])

difference = np.maximum(original, background) - np.minimum(original, background)

alpha = np.maximum(difference[..., 0], difference[..., 1])
alpha = np.maximum(alpha, difference[..., 2])
alpha = alpha.astype(np.float64) / 255.0

# Now we use gradient to extract all edges in the image
gradient1 = np.abs(np.gradient(alpha)[0])
gradient2 = np.abs(np.gradient(alpha)[1])
gradient = np.maximum(gradient1, gradient2)
gradient *= args.g / np.max(gradient)
gradient[gradient > 1] = 1.0

enhance = np.abs(gradient - np.ones_like(gradient))
enhance *= args.e
enhance[enhance < 1.0] = 1.0

alpha = alpha * enhance
alpha[alpha > 1.0] = 1.0
alpha_old = alpha.copy()

alpha = cv2.dilate(alpha, kernel=np.ones((5,5),np.uint8)).astype(np.uint8)
alpha = cv2.erode(alpha, kernel=np.ones((5,5),np.uint8)).astype(np.uint8)

factor = tanh(args.e - 1)
alpha = factor * alpha + (1 - factor) * alpha_old

# now that we have estimated alpha, let's solve for the original colors
# we use the formula c_orig = (c_foregroud - (1 - alpha) * c_background) / alpha.
inverted_alpha = np.ones_like(alpha) - alpha

alpha_bgr = np.stack([alpha]*3, axis=2)
# print(np.min(alpha_bgr))
inverted_alpha_bgr = np.stack([inverted_alpha]*3, axis=2)
solved = np.divide(original - inverted_alpha_bgr * background + 1e-20, alpha_bgr + 1e-20)

error = abs(np.sum(solved[solved < 0])) + np.sum(solved[solved > 255])

while error > 10:#  and abs(last_error - error) > 1e-10:
    try:
        print(error, np.sum(alpha))
        mask1 = np.bitwise_or(solved[...,0] < 0, solved[...,1] < 0, solved[...,2] < 0)
        mask2 = np.bitwise_or(solved[...,0] > 255, solved[...,1] > 255, solved[...,2] > 255)
        mask = np.bitwise_or(mask1, mask2)
        alpha *= 1.05
        alpha[alpha > 1.0] = 1.0
        alpha_bgr = np.stack([alpha]*3, axis=2)
        inverted_alpha = np.ones_like(alpha) - alpha
        inverted_alpha_bgr = np.stack([inverted_alpha]*3, axis=2)
        solved = np.divide(original - inverted_alpha_bgr * background + 1e-20, alpha_bgr + 1e-20)
        last_error = error
        error = abs(np.sum(solved[solved < 0])) + np.sum(solved[solved > 255])
    except KeyboardInterrupt:
        cv2.imwrite(os.path.splitext(args.image)[0] + ".alpha.png", alpha * 255)
        sys.exit()


solved = solved.astype(np.uint8)


alpha = (alpha * 255).astype(np.uint8)
blue, green, red = cv2.split(solved)
final = cv2.merge([blue, green, red, alpha])

enhance_r = enhance / np.max(enhance) * 255
enhance_g = (1 - enhance / np.max(enhance)) * 255


cv2.imwrite(os.path.splitext(args.image)[0] + ".processed.png", final)
# cv2.imwrite(os.path.splitext(args.image)[0] + ".solved.png", solved)
# cv2.imwrite(os.path.splitext(args.image)[0] + ".alpha.png", alpha)
# cv2.imwrite(os.path.splitext(args.image)[0] + ".edges.png", gradient * 255)
# cv2.imwrite(os.path.splitext(args.image)[0] + ".enhance.png", cv2.merge([enhance_g, enhance_g, enhance_r]))