from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path(__file__).parent / 'qa'
OUT.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:4174/'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE+'#app/business/results',wait_until='networkidle')
    page.get_by_text('Explorar el análisis avanzado',exact=True).click()
    panel=page.get_by_role('region',name='Motor financiero original')
    expect(panel).to_be_visible()
    expect(panel).to_contain_text('Sin consumo neto')
    panel.locator('.analysis-settings summary').click()
    for name,value in [('ar','2000'),('inventory','1000'),('ap','1000'),('shortDebt','1000'),('longDebt','500'),('equity','10000'),('revenueBudget','50000'),('marginTarget','20'),('ratioLimit','10')]:
        panel.locator(f'input[name="{name}"]').fill(value)
    panel.get_by_role('button',name='Guardar datos del análisis',exact=True).click()
    expect(panel).to_contain_text('variación 2.000')
    expect(panel.locator('.analysis-kpi').filter(has_text='Razón corriente')).to_contain_text('8,3')
    panel.get_by_role('button',name='Controles y propuestas',exact=True).click()
    expect(panel).to_contain_text('Revisar incumplimiento')
    panel.get_by_role('button',name='Marcar para seguimiento',exact=True).first.click()
    expect(panel).to_contain_text('Marcada para seguimiento')
    page.reload(wait_until='networkidle')
    page.get_by_text('Explorar el análisis avanzado',exact=True).click()
    panel.get_by_role('button',name='Controles y propuestas',exact=True).click()
    expect(panel).to_contain_text('Marcada para seguimiento')
    panel.get_by_role('button',name='Proyección y caja',exact=True).click()
    expect(panel).to_contain_text('2026-11')
    expect(panel).to_contain_text('El backtest necesita al menos ocho meses')
    original=panel.locator('.analysis-kpi').last.inner_text()
    panel.get_by_label('Cambio de ingresos (%)',exact=True).fill('-50')
    assert panel.locator('.analysis-kpi').last.inner_text()!=original
    panel.get_by_role('button',name='Metodología',exact=True).click()
    with page.expect_download() as download:
        panel.get_by_role('button',name='Exportar análisis con evidencia').click()
    import json
    evidence=json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
    assert evidence['analysis']['current']['totalRevenue']==52000
    assert evidence['parameters']['limits']['currentRatio']==10
    page.goto(BASE+'#app/advisor/results',wait_until='networkidle')
    page.get_by_text('Explorar el análisis avanzado',exact=True).click()
    expect(panel.locator('.analysis-kpi').filter(has_text='Razón corriente')).to_contain_text('N/D')
    expect(panel).not_to_contain_text('variación 2.000')
    page.goto(BASE+'#app/business/results',wait_until='networkidle')
    page.get_by_text('Explorar el análisis avanzado',exact=True).click()
    expect(panel.locator('.analysis-kpi').filter(has_text='Razón corriente')).to_contain_text('8,3')
    page.wait_for_timeout(600)
    page.screenshot(path=str(OUT/'integrated-results-desktop.png'),full_page=True)
    for width in [320,375,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':1000})
        for tab in ['Indicadores','Proyección y caja','Controles y propuestas','Metodología']:
            panel.get_by_role('button',name=tab,exact=True).click()
            assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'),f'Overflow at {width}, {tab}'
    page.set_viewport_size({'width':375,'height':1000})
    panel.get_by_role('button',name='Indicadores',exact=True).click()
    page.screenshot(path=str(OUT/'integrated-results-mobile.png'),full_page=True)
    assert not errors, errors
    browser.close()
    print('PASS: original engines, balances, controls, forecast, stress, evidence, decisions, entity isolation, responsive and persistence; no JS errors')
