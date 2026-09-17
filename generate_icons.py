import os
from PIL import Image, ImageDraw

def create_icons():
    logo_path = 'logo.png'
    if not os.path.exists(logo_path):
        print("Logo not found!")
        return

    logo = Image.open(logo_path).convert('RGBA')
    res_dir = 'android/app/src/main/res'

    densities = {
        'mipmap-mdpi': (48, 108),
        'mipmap-hdpi': (72, 162),
        'mipmap-xhdpi': (96, 216),
        'mipmap-xxhdpi': (144, 324),
        'mipmap-xxxhdpi': (192, 432),
    }

    bg_color = (255, 255, 255, 255) # Pure clean white

    for folder, (icon_size, fg_size) in densities.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)

        # 1. Foreground icon (Adaptive icon layer: fg_size x fg_size)
        # Safe zone is roughly the inner 60-66% of fg_size
        safe_size = int(fg_size * 0.65)
        # Resize logo keeping aspect ratio to fit inside safe_size
        logo_aspect = logo.width / logo.height
        if logo_aspect > 1:
            w = safe_size
            h = int(w / logo_aspect)
        else:
            h = safe_size
            w = int(h * logo_aspect)

        resized_logo = logo.resize((w, h), Image.Resampling.LANCZOS)
        fg_img = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        offset_x = (fg_size - w) // 2
        offset_y = (fg_size - h) // 2
        fg_img.paste(resized_logo, (offset_x, offset_y), resized_logo)
        fg_img.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')

        # 2. Legacy square/squircle icon (icon_size x icon_size)
        square_img = Image.new('RGBA', (icon_size, icon_size), bg_color)
        target_size = int(icon_size * 0.82)
        if logo_aspect > 1:
            w_sq = target_size
            h_sq = int(w_sq / logo_aspect)
        else:
            h_sq = target_size
            w_sq = int(h_sq * logo_aspect)
        resized_sq = logo.resize((w_sq, h_sq), Image.Resampling.LANCZOS)
        square_img.paste(resized_sq, ((icon_size - w_sq) // 2, (icon_size - h_sq) // 2), resized_sq)
        square_img.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')

        # 3. Round icon (icon_size x icon_size)
        round_img = Image.new('RGBA', (icon_size, icon_size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(round_img)
        draw.ellipse((0, 0, icon_size - 1, icon_size - 1), fill=bg_color)
        round_img.paste(resized_sq, ((icon_size - w_sq) // 2, (icon_size - h_sq) // 2), resized_sq)
        round_img.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')

        print(f"Generated icons for {folder}: {icon_size}x{icon_size} (fg: {fg_size}x{fg_size})")

    # Splash screens with center logo on luxury dark navy (#0D1333)
    splash_bg_color = (13, 19, 51, 255) # #0D1333

    splash_sizes = {
        'drawable': (480, 800),
        'drawable-port-mdpi': (320, 480),
        'drawable-port-hdpi': (480, 800),
        'drawable-port-xhdpi': (720, 1280),
        'drawable-port-xxhdpi': (960, 1600),
        'drawable-port-xxxhdpi': (1280, 1920),
        'drawable-land-mdpi': (480, 320),
        'drawable-land-hdpi': (800, 480),
        'drawable-land-xhdpi': (1280, 720),
        'drawable-land-xxhdpi': (1600, 960),
        'drawable-land-xxxhdpi': (1920, 1280),
    }

    for folder, (sw, sh) in splash_sizes.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        splash_img = Image.new('RGBA', (sw, sh), splash_bg_color)

        # Logo max size is min(sw, sh) * 0.45
        max_dim = int(min(sw, sh) * 0.45)
        if logo_aspect > 1:
            lw = max_dim
            lh = int(lw / logo_aspect)
        else:
            lh = max_dim
            lw = int(lh * logo_aspect)

        splash_logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        splash_img.paste(splash_logo, ((sw - lw) // 2, (sh - lh) // 2), splash_logo)
        splash_img.save(os.path.join(folder_path, 'splash.png'), 'PNG')
        print(f"Generated splash for {folder}: {sw}x{sh}")

if __name__ == '__main__':
    create_icons()
