javascript:(function () {
    var cards = document.querySelectorAll('.product-card');

    if (!cards.length) {
        alert('No .product-card found: ' + document.querySelectorAll('a').length + ' links on page');
        return;
    }

    // Collapse whitespace and trim
    function clean(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    // Escape a value for safe CSV output
    function csvEscape(val) {
        val = (val === null || val === undefined) ? '' : String(val);
        if (/[",\n]/.test(val)) {
            val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
    }

    // Extract just the numeric part of a percentage string (e.g. "92% OFF" -> "92")
    function pct(text) {
        var match = clean(text).match(/(\d+(\.\d+)?)/);
        return match ? match[1] : '';
    }

    // Normalize price strings, fixing "$31,99" -> "$31.99" while leaving
    // thousands-separator commas like "$1,234.99" alone
    function fixPrice(text) {
        text = clean(text);
        var match = text.match(/\$?\s*([\d.,]+)/);
        if (!match) return text;

        var num = match[1];
        if (/,\d{2}$/.test(num) && !/\.\d{2}$/.test(num)) {
            // Comma is acting as a decimal separator
            num = num.replace(/,(\d{2})$/, '.$1');
            num = num.replace(/,/g, '');
        } else {
            // Comma is a thousands separator
            num = num.replace(/,/g, '');
        }
        return '$' + num;
    }

    // Unwrap affiliate/tracking links like:
    // https://www.jdoqocy.com/click-XXXX?url=<encoded target>&cjsku=...
    // into just the decoded target URL. Falls back to the raw href if no
    // "url" query param is present.
    function realUrl(href) {
        try {
            var u = new URL(href);
            var target = u.searchParams.get('url');
            if (target) {
                return decodeURIComponent(target);
            }
            return href;
        } catch (e) {
            return href;
        }
    }

    var rows = [[
        'Perfume Name',
        'Clone Name',
        'Similarity %',
        'Percent Off',
        'Price',
        'Original Price',
        'Deal Link'
    ]];

    var skipped = 0;

    cards.forEach(function (card) {
        var rawHref = card.getAttribute('href') || '';

        // Skip cards with no real link (empty or "#")
        if (rawHref === '' || rawHref === '#') {
            skipped++;
            return;
        }

        var nameEl = card.querySelector('.product-name');
        var cloneEl = card.querySelector('.product-name-clone');
        var offEl = card.querySelector('.off');
        var priceEl = card.querySelector('.newprice');
        var ogPriceEl = card.querySelector('.ogprice');
        var reviewEl = card.querySelector('.review');

        var perfumeName = clean(nameEl ? nameEl.textContent : '');
        // Strip a leading 'Clone of "X"' wrapper down to just X
        var m = perfumeName.match(/^Clone of\s*"(.+)"$/i);
        if (m) perfumeName = m[1];

        var cloneName   = clean(cloneEl ? cloneEl.textContent : '');
        var percentOff  = pct(offEl ? offEl.textContent : '');
        var price       = fixPrice(priceEl ? priceEl.textContent : '');
        var ogPrice     = fixPrice(ogPriceEl ? ogPriceEl.textContent : '');
        var similarity  = pct(reviewEl ? reviewEl.textContent : '');
        var link        = realUrl(card.href);

        rows.push([perfumeName, cloneName, similarity, percentOff, price, ogPrice, link]);
    });

    var csvContent = rows.map(function (r) {
        return r.map(csvEscape).join(',');
    }).join('\n');

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'perfume_deals.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Scraped ' + (rows.length - 1) + ' cards (' + skipped + ' skipped for no link). CSV downloaded.');
})();