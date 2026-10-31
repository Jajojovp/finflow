from playwright.sync_api import sync_playwright, expect
from pathlib import Path

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.goto('http://127.0.0.1:4174/#app/business/results',wait_until='networkidle')
    expect(page.get_by_role('region',name='Motor financiero original')).not_to_be_visible()
    expect(page.locator('.report-stats')).to_be_visible()
    page.get_by_text('Explorar el análisis avanzado',exact=True).click()
    expect(page.get_by_role('region',name='Motor financiero original')).to_be_visible()
    page.get_by_text('Explorar el análisis avanzado',exact=True).click()
    expect(page.get_by_role('region',name='Motor financiero original')).not_to_be_visible()
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--blue').trim()")=='#3478ee'
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()")=='#f7f9fb'
    assert page.evaluate("document.fonts.check('16px \"DM Sans\"')")
    page.screenshot(path=str(Path(__file__).parent/'qa'/'restored-light-results.png'),full_page=True)
    browser.close()
    print('PASS: approved light palette, local DM Sans, original result hierarchy and progressive advanced analysis')
