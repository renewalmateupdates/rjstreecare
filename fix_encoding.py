import os, glob

path = r'C:/Users/jbost/TreeServiceDemo'
script_tag = '  <script defer src="/_vercel/insights/script.js"></script>\n'

# cp1252 maps 0x80-0x9F to special Unicode chars.
# The 5 undefined cp1252 bytes (81, 8D, 8F, 90, 9D) PowerShell passes through as U+00XX.
# Build a reverse map: Unicode codepoint -> original byte value
cp1252_reverse = {}
# First: all bytes 0x00-0xFF map via latin-1 (direct) for base fallback
for b in range(256):
    cp1252_reverse[b] = b  # identity for 0x00-0xFF range
# Override with cp1252 special mappings (0x80-0x9F block)
cp1252_specials = {
    0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
    0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
    0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
    0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
    0x9E: 0x017E, 0x9F: 0x0178,
}
# Invert: unicode -> byte
unicode_to_byte = {v: k for k, v in cp1252_specials.items()}
# Also add direct latin-1 mappings for 0x00-0xFF where not overridden
for b in range(256):
    uc = b  # latin-1: byte == codepoint for 0x00-0xFF
    if uc not in unicode_to_byte:
        unicode_to_byte[uc] = b

def reverse_mojibake(text):
    """Convert doubly-encoded UTF-8 back to original bytes, then decode as UTF-8."""
    result_bytes = bytearray()
    for ch in text:
        cp = ord(ch)
        if cp in unicode_to_byte:
            result_bytes.append(unicode_to_byte[cp])
        elif cp > 0xFF:
            # Multi-byte unicode char that shouldn't be here - encode as UTF-8
            result_bytes.extend(ch.encode('utf-8'))
        else:
            result_bytes.append(cp & 0xFF)
    return result_bytes.decode('utf-8')

for fpath in sorted(glob.glob(path + '/*.html')):
    fname = os.path.basename(fpath)

    with open(fpath, 'r', encoding='utf-8-sig') as f:
        text = f.read()

    if 'ðŸš¨' in text or 'ðŸŒ²' in text or 'â€"' in text or 'ðŸ"ž' in text:
        try:
            fixed = reverse_mojibake(text)
            text = fixed
            print('Fixed: ' + fname)
        except Exception as e:
            print('ERROR: ' + fname + ' - ' + str(e))
            continue
    else:
        print('OK:    ' + fname)

    if '/_vercel/insights/script.js' not in text:
        text = text.replace('</head>', script_tag + '</head>', 1)
        print('       + analytics tag added')

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)

print('\nDone.')
