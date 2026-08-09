javascript:(function(){
  // Title
  const titleEl = document.querySelector('.v-title');
  const title = titleEl ? titleEl.innerText.trim() : '';

  // Price
  const priceEl = document.querySelector('.dws-vdp-single-field-value-vehicleprice');
  const price = priceEl ? priceEl.innerText.trim() : '';

  // Vehicle fields (label/value pairs)
  const fieldItems = document.querySelectorAll('.dws-vehicle-fields-item');
  let fields = '';
  fieldItems.forEach(item => {
    const label = item.querySelector('.dws-vehicle-fields-label');
    const value = item.querySelector('.dws-vehicle-fields-value');
    if (label && value) {
      fields += label.innerText.trim() + ' ' + value.innerText.trim() + '\n';
    }
  });

  // Equipment list
  const equipEls = document.querySelectorAll('.dws-vehicle-detail-equipment-vertical-element span');
  let equip = '';
  equipEls.forEach(el => { equip += el.innerText.trim() + '\n'; });

  // Assemble output
  let out = '';
  if (title || price) out += (title + (price ? ' - ' + price : '')) + '\n';
  if (fields) out += fields;
  if (equip) out += 'Vehicle Equipment List\n' + equip;

  // Copy to clipboard
  navigator.clipboard.writeText(out.trim()).then(() => {
    alert('Vehicle info copied to clipboard!');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = out.trim();
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('Vehicle info copied to clipboard!');
  });
})();