import cv2
import numpy as np

def image_similarity(img1_path, img2_path):
    try:
        img1 = cv2.imread(img1_path)
        img2 = cv2.imread(img2_path)

        if img1 is None or img2 is None:
            return 0

        img1 = cv2.resize(img1, (256, 256))
        img2 = cv2.resize(img2, (256, 256))

        hist1 = cv2.calcHist([img1], [0,1,2], None, [8,8,8], [0,256]*3)
        hist2 = cv2.calcHist([img2], [0,1,2], None, [8,8,8], [0,256]*3)

        cv2.normalize(hist1, hist1)
        cv2.normalize(hist2, hist2)

        score = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

        return max(0, min(100, int(score * 100)))

    except Exception as e:
        print("IMAGE MATCH ERROR:", e)
        return 0
