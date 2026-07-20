import os, sys, math
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = "file://" + os.path.join(HERE, "title.html")
FPS = 30
OUT = os.path.join(HERE, "frames")
os.makedirs(OUT, exist_ok=True)

cards = sys.argv[1:] or ["title","scale","office","race","final","champion","tagline","prize","signoff"]

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        args=["--no-sandbox","--disable-gpu","--force-color-profile=srgb","--hide-scrollbars"])
    page = browser.new_page(viewport={"width":1080,"height":1920}, device_scale_factor=1)
    for card in cards:
        page.goto(f"{URL}?card={card}")
        page.evaluate("() => document.fonts.ready")
        page.wait_for_timeout(120)
        dur = page.evaluate("window.CARD_DUR")
        n = round(dur*FPS)
        d = os.path.join(OUT, card)
        os.makedirs(d, exist_ok=True)
        for i in range(n):
            t = i/FPS
            page.evaluate(f"window.seek({t})")
            page.screenshot(path=os.path.join(d, f"f{i:05d}.png"), omit_background=True)
        print(f"{card}: dur={dur}s frames={n} -> {d}", flush=True)
    browser.close()
print("DONE")
