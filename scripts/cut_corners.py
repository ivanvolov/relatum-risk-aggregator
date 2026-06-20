"""Apply an octagonal corner cut (transparent corners) to the relatum icon files
so the same cut-corner shape shows on both the page brand mark and the browser tab
favicon. Cut depth = 6/26 ≈ 23% of the side, matching the existing CSS clip-path."""
from PIL import Image, ImageDraw, ImageChops
import sys, os

CUT_RATIO = 6 / 26  # ~23%

def cut_corners(img, ratio=CUT_RATIO):
    img = img.convert('RGBA')
    w, h = img.size
    cut = max(1, int(round(min(w, h) * ratio)))

    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).polygon([
        (cut, 0), (w - cut, 0),
        (w, cut), (w, h - cut),
        (w - cut, h), (cut, h),
        (0, h - cut), (0, cut),
    ], fill=255)

    r, g, b, a = img.split()
    new_alpha = ImageChops.multiply(a, mask)
    return Image.merge('RGBA', (r, g, b, new_alpha))

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'

    # 1. Source 512x512 → cut, overwrite
    src = os.path.join(root, 'public', 'relatum-icon-512.png')
    big = cut_corners(Image.open(src))
    big.save(src, optimize=True)
    print(f'wrote {src} ({big.size})')

    # 2. 32x32 favicon → derive from cut 512 (sharper than re-cutting the existing 32)
    f32 = big.resize((32, 32), Image.LANCZOS)
    f32_path = os.path.join(root, 'public', 'favicon-32x32.png')
    f32.save(f32_path, optimize=True)
    print(f'wrote {f32_path}')

    # 3. .ico containing 16x16 + 32x32 + 48x48
    ico_path = os.path.join(root, 'public', 'favicon.ico')
    big.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f'wrote {ico_path}')

    print('done')
