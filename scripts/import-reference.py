import base64
import hashlib
import html
import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zlib
from pathlib import Path


source = Path(sys.argv[1]).read_bytes()
document = ET.fromstring(source)
file = ET.fromstring(document.attrib['content'])
diagram = file.find('diagram')
model = ET.fromstring(urllib.parse.unquote(zlib.decompress(base64.b64decode(diagram.text), -15).decode()))
nodes = {}
edges = []
for item in model.find('root'):
    cell = item if item.tag == 'mxCell' else item.find('mxCell')
    attributes = {**cell.attrib, **item.attrib}
    geometry = cell.find('mxGeometry')
    title = ' '.join(html.unescape(re.sub('<[^>]+>', ' ', attributes.get('label', attributes.get('value', '')))).split())
    if attributes.get('vertex') == '1' and title:
        style = attributes.get('style', '')
        styles = dict(part.split('=', 1) for part in style.split(';') if '=' in part)
        shape = styles.get('shape')
        category = 'audio-drama' if style.startswith('ellipse;') else 'graphic-novel' if shape == 'hexagon' else 'exclusive-story' if shape == 'note' else 'story' if shape == 'card' else 'book'
        nodes[attributes['id']] = {
            'id': attributes['id'],
            'title': title,
            'bounds': [float(geometry.get(key, 0)) for key in ('x', 'y', 'width', 'height')],
            'fill': styles.get('fillColor', '#FFFFFF'),
            'stroke': styles.get('strokeColor', '#000000'),
            'category': category,
            **({'sourceLink': attributes['link']} if attributes.get('link') else {}),
        }
    if attributes.get('edge') == '1' and 'endArrow=none' not in attributes.get('style', ''):
        edges.append((attributes, geometry))


def endpoint(attributes, geometry, side):
    if attributes.get(side) in nodes:
        return attributes[side]
    point = geometry.find(f'mxPoint[@as="{side}Point"]')
    if point is None:
        return None
    x, y = float(point.get('x')), float(point.get('y'))
    hits = []
    for node in nodes.values():
        left, top, width, height = node['bounds']
        if left - 2 <= x <= left + width + 2 and top - 2 <= y <= top + height + 2:
            hits.append(node['id'])
    return hits[0] if len(hits) == 1 else None


connections = []
unresolved = []
for attributes, geometry in edges:
    start = endpoint(attributes, geometry, 'source')
    end = endpoint(attributes, geometry, 'target')
    record = {'id': attributes['id'], 'from': start, 'to': end}
    if start and end:
        connections.append(record)
    else:
        unresolved.append(record)

used = {node_id for edge in connections + unresolved for node_id in (edge['from'], edge['to']) if node_id}
snapshot = {
    'url': 'https://www.kylebb.com/HH/HHSeriesOrder.svg',
    'version': '0.9',
    'modified': file.get('modified'),
    'retrieved': sys.argv[3],
    'sha256': hashlib.sha256(source).hexdigest(),
    'nodes': [{key: value for key, value in node.items() if key != 'bounds'} for node in nodes.values() if node['id'] in used],
    'connections': connections,
    'unresolved': unresolved,
}
lines = ['{']
for key, value in snapshot.items():
    if isinstance(value, list):
        lines.append(f'  "{key}": [')
        lines.extend('    ' + json.dumps(record, ensure_ascii=False) + (',' if index < len(value) - 1 else '') for index, record in enumerate(value))
        lines.append('  ]' + (',' if key != 'unresolved' else ''))
    else:
        lines.append(f'  "{key}": {json.dumps(value)},')
lines.append('}')
Path(sys.argv[2]).write_text('\n'.join(lines) + '\n')
print(f'{len(snapshot["nodes"])} source nodes, {len(connections)} connections, {len(unresolved)} unresolved endpoints')
