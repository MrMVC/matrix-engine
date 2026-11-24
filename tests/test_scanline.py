"""Exercise the public CLI and parse each exported SVG as XML."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree

CLI = Path(__file__).resolve().parents[1] / 'build_mrmvc.py'
NS = {'s': 'http://www.w3.org/2000/svg'}


class ScanlineTests(unittest.TestCase):
    def render(self, *args):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'banner.svg'
            subprocess.run([sys.executable, str(CLI), '--output', str(output), *args],
                           check=True, capture_output=True)
            return ElementTree.parse(output).getroot()

    def test_default_geometry_colors_and_speed(self):
        for speed, duration in [(.25, '12.00s'), (.96, '3.13s'), (1, '3.00s'), (4, '0.75s')]:
            with self.subTest(speed=speed):
                root = self.render('--color', 'cyan', '--speed', str(speed))
                line = root.find('.//s:path', NS)
                self.assertEqual(line.get('stroke'), '#22d3ee')
                self.assertEqual(line.get('opacity'), '.2')
                self.assertEqual(line.get('d'), 'M0 316.0 H1500')
                stops = root.findall('.//s:linearGradient[@id="scanline"]/s:stop', NS)
                self.assertEqual([s.get('stop-color') for s in stops], ['#22d3ee', '#c0ffff', '#22d3ee'])
                pulse = root.find('.//s:rect[@fill="url(#scanline)"]', NS)
                self.assertEqual([float(pulse.get(k)) for k in ('x', 'y', 'width', 'height')], [-330, 315, 330, 2])
                movement = pulse.find('s:animate', NS)
                self.assertEqual(movement.get('attributeName'), 'x')
                self.assertEqual(float(movement.get('from')), -330)
                self.assertEqual(float(movement.get('to')), 1500)
                self.assertEqual(movement.get('dur'), duration)

    def test_independent_switches(self):
        for flag, visible in [('--no-scanline', False), ('--no-scanline-animation', True)]:
            with self.subTest(flag=flag):
                root = self.render(flag)
                self.assertEqual(root.find('.//s:path', NS) is not None, visible)
                self.assertIsNone(root.find('.//s:linearGradient[@id="scanline"]', NS))
                self.assertIsNone(root.find('.//s:rect[@fill="url(#scanline)"]', NS))
                self.assertIsNotNone(root.find('.//s:animateTransform', NS))
                self.assertIsNotNone(root.find('.//s:text/s:animate', NS))

    def test_global_static_and_hidden_precedence(self):
        for flags in [[], ['--no-scanline-animation'], ['--no-scanline', '--no-scanline-animation']]:
            with self.subTest(flags=flags):
                root = self.render('--no-animation', *flags)
                self.assertEqual(root.find('.//s:path', NS) is not None, '--no-scanline' not in flags)
                self.assertFalse(any(node.tag.split('}')[-1].startswith('animate') for node in root.iter()))

    def test_cli_help(self):
        help_text = subprocess.check_output([sys.executable, str(CLI), '--help'], text=True)
        for flag in ['--no-animation', '--no-scanline', '--no-scanline-animation']:
            self.assertIn(flag, help_text)
