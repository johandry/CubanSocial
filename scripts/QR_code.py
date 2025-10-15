#!/usr/bin/env python3

import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

def create_qr_code_image(url, title, subtitle, filename_suffix="", logo_path=None):
    """Generate a QR code image with branding and optional center logo"""
    
    # Create QR code with higher error correction for logo embedding
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction for logo
        box_size=10,
        border=4,
    )
    
    # Add the URL
    qr.add_data(url)
    qr.make(fit=True)
    
    # Create QR code image
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Add logo to center of QR code if provided
    if logo_path and os.path.exists(logo_path):
        logo = Image.open(logo_path)
        
        # Calculate logo size (should be about 10-15% of QR code size)
        qr_width, qr_height = qr_img.size
        logo_size = min(qr_width, qr_height) // 5  # 20% of QR code size
        
        # Convert logo to RGBA if it has transparency, otherwise RGB
        if logo.mode == 'RGBA':
            # Create a white background for transparent images
            white_bg = Image.new('RGB', logo.size, (255, 255, 255))
            white_bg.paste(logo, mask=logo.split()[-1] if logo.mode == 'RGBA' else None)
            logo = white_bg
        elif logo.mode != 'RGB':
            logo = logo.convert('RGB')
        
        # Resize logo
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Create a larger white circular background
        circle_size = logo_size + 20
        circle_background = Image.new('RGB', (circle_size, circle_size), (255, 255, 255))
        
        # Create a circular mask for the white background
        mask = Image.new('L', (circle_size, circle_size), 0)
        draw_mask = ImageDraw.Draw(mask)
        draw_mask.ellipse((0, 0, circle_size, circle_size), fill=255)
        
        # Apply circular mask to create a white circle
        circle_background.putalpha(mask)
        
        # Paste the logo onto the white circular background
        logo_pos = (10, 10)  # Center with 10px padding
        circle_background.paste(logo, logo_pos)
        
        # Convert QR code to RGBA for transparency support
        qr_img = qr_img.convert('RGBA')
        
        # Calculate position to center the logo on QR code
        final_pos = ((qr_width - circle_size) // 2, (qr_height - circle_size) // 2)
        
        # Paste the logo with white background onto QR code
        qr_img.paste(circle_background, final_pos, circle_background)
        
        print(f"✨ Added logo with solid white circular background to QR code: {os.path.basename(logo_path)}")
    
    # Create a larger canvas for the final image
    canvas_width = 600
    canvas_height = 700
    canvas = Image.new('RGB', (canvas_width, canvas_height), 'white')
    
    # Resize QR code to fit nicely on canvas
    qr_size = 400
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    # Center the QR code on canvas
    qr_x = (canvas_width - qr_size) // 2
    qr_y = 100
    canvas.paste(qr_img, (qr_x, qr_y))
    
    # Add text
    draw = ImageDraw.Draw(canvas)
    
    # Try to use a nice font, fall back to default if not available
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        url_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
    except:
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            url_font = ImageFont.truetype("arial.ttf", 20)
            subtitle_font = ImageFont.truetype("arial.ttf", 18)
        except:
            title_font = ImageFont.load_default()
            url_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
    
    # Add title
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (canvas_width - title_width) // 2
    draw.text((title_x, 30), title, fill="black", font=title_font)
    
    # Add URL below QR code (shortened for display)
    display_url = url
    if len(display_url) > 35:
        display_url = display_url[:32] + "..."
    
    url_bbox = draw.textbbox((0, 0), display_url, font=url_font)
    url_width = url_bbox[2] - url_bbox[0]
    url_x = (canvas_width - url_width) // 2
    draw.text((url_x, qr_y + qr_size + 30), display_url, fill="black", font=url_font)
    
    # Add subtitle
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (canvas_width - subtitle_width) // 2
    draw.text((subtitle_x, qr_y + qr_size + 70), subtitle, fill="gray", font=subtitle_font)
    
    return canvas, filename_suffix

def main():
    """Generate and save QR code images for both website and app"""
    print("🎨 Generating QR codes for Cuban Social...")
    
    # Get the script directory and construct path to image directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up one level from scripts/
    output_dir = os.path.join(project_root, "image")
    
    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    print(f"📁 Output directory: {output_dir}")
    
    # Look for dancing couple logo in image directory
    logo_path = os.path.join(output_dir, "dancing_couple.png")
    if not os.path.exists(logo_path):
        # Try alternative names
        alternative_names = ["dancing.png", "dance.png", "couple.png", "logo.png"]
        for name in alternative_names:
            alt_path = os.path.join(output_dir, name)
            if os.path.exists(alt_path):
                logo_path = alt_path
                break
        else:
            logo_path = None
            print("⚠️  No dancing couple image found. Create 'image/dancing_couple.png' to add it to QR codes.")
            print("   Suggested names: dancing_couple.png, dancing.png, dance.png")
    else:
        print(f"🕺 Found dancing couple image: {logo_path}")
    
    # QR code configurations
    qr_configs = [
        {
            "url": "https://cubansocial.com",
            "title": "Cuban Social",
            "subtitle": "San Diego Cuban Dance Events",
            "filename": "cubansocial_qr_code"
        },
        {
            "url": "https://apps.apple.com/us/app/cuban-social/id6749600020",
            "title": "Cuban Social App",
            "subtitle": "Download on App Store",
            "filename": "cubansocial_app_qr_code"
        }
    ]
    
    # Generate QR codes
    for config in qr_configs:
        print(f"\n🎯 Creating QR code for: {config['title']}")
        
        # Create the image
        qr_image, _ = create_qr_code_image(
            config["url"], 
            config["title"], 
            config["subtitle"],
            logo_path=logo_path
        )
        
        # Save full size image
        output_path = os.path.join(output_dir, f"{config['filename']}.png")
        qr_image.save(output_path, "PNG", quality=95)
        
        print(f"✅ QR code image saved to: {output_path}")
        print(f"📱 Image size: {qr_image.size[0]}x{qr_image.size[1]} pixels")
        print(f"🔗 QR code links to: {config['url']}")
        
        # Create smaller version for web use
        web_size = (300, 350)
        web_image = qr_image.resize(web_size, Image.Resampling.LANCZOS)
        web_path = os.path.join(output_dir, f"{config['filename']}_web.png")
        web_image.save(web_path, "PNG", quality=95)
        
        print(f"🌐 Web version saved to: {web_path}")
        print(f"📱 Web image size: {web_image.size[0]}x{web_image.size[1]} pixels")
    
    # Print usage information
    print("\n📋 Usage:")
    print("🌐 Website QR Code:")
    print("  - Full size: image/cubansocial_qr_code.png")
    print("  - Web size: image/cubansocial_qr_code_web.png")
    print("  - Links to: https://cubansocial.com")
    print("\n📱 App Store QR Code:")
    print("  - Full size: image/cubansocial_app_qr_code.png")
    print("  - Web size: image/cubansocial_app_qr_code_web.png")
    print("  - Links to: App Store download page")
    print("\n🕺 To add dancing couple image:")
    print("  1. Find or create an image of people dancing (square format works best)")
    print("  2. Save it as 'image/dancing_couple.png'")
    print("  3. Re-run this script")
    print("\n💡 HTML Usage Examples:")
    print("  <img src='image/cubansocial_qr_code_web.png' alt='Cuban Social Website'>")
    print("  <img src='image/cubansocial_app_qr_code_web.png' alt='Cuban Social App'>")

if __name__ == "__main__":
    main()