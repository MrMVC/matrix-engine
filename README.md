 <div align="center">

<img src="./mrmvc-matrix.svg" alt="Matrix Engine" width="100%" />

# MATRIX ENGINE

**Animated SVG Banner Generator**

Create your own digital identity through code.

![Python](https://img.shields.io/badge/Python-3.11+-A855F7?style=for-the-badge&logo=python&logoColor=white)
![SVG](https://img.shields.io/badge/Format-SVG-9333EA?style=for-the-badge&logo=svg&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-D946EF?style=for-the-badge)
[![Release](https://img.shields.io/github/v/release/MrMVC/matrix-engine?style=for-the-badge&color=7C3AED)](https://github.com/MrMVC/matrix-engine/releases/latest)
[![Matrix Engine CI](https://github.com/MrMVC/matrix-engine/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MrMVC/matrix-engine/actions/workflows/ci.yml)

</div>

---

## 01 / Overview

Matrix Engine is a Python-based SVG banner generator 
inspired by digital rain and futuristic typography.

It transforms custom text into animated numerical 
patterns, combining procedural graphics with 
lightweight SVG animations.

Designed for GitHub profiles, developer portfolios 
and personal branding.

## 02 / Features

- Animated digital rain
- Custom text rendering
- Configurable banner dimensions
- Custom font support
- Procedural number generation
- Reproducible output through random seeds
- Lightweight SVG export
- No JavaScript required for animation
- Command-line interface
- Six color presets: Purple, Green, Blue, Red, Cyan and Mono
- Automatic text scaling
- Adjustable animation speed
- Static SVG generation mode
- Cross-platform CI testing
- Automated dependency updates

## 03 / Preview

<div align="center">

<img src="./mrmvc-preview.png" alt="Matrix Engine Preview" width="100%" />

</div>

## 04 / Installation

### Requirements

- Python 3.11 or newer
- Pillow
- Git
- A compatible TrueType font

### Clone the repository

```bash
git clone https://github.com/MrMVC/matrix-engine.git
cd matrix-engine
```

### Install dependencies

```bash
python -m pip install -r requirements.txt
```

## 05 / Usage

Generate a default banner:

```bash
python build_mrmvc.py
```

Generate a personalized banner:

```bash
python build_mrmvc.py --text "YourName"
```

Customize the dimensions:

```bash
python build_mrmvc.py --text "MrMVC" --width 1500 --height 400
```

Specify an output file:

```bash
python build_mrmvc.py --output output/banner.svg
```

## 06 / Configuration

| Parameter | Default | Description |
|---|---|---|
| --text | MrMVC | Banner text |
| --width | 1500 | SVG width |
| --height | 400 | SVG height |
| --font-size | 218 | Text size |
| --font-path | Automatic | Custom TrueType font |
| --seed | 42 | Random generation seed |
| --output | output/matrix-banner.svg | Output file |
| --color | purple | Color preset |
| --speed | 1.0 | Animation speed multiplier |
| --no-animation | Disabled | Generate a static SVG |
| --no-scanline | Disabled | Hide both the underline and its moving light impulse |
| --no-scanline-animation | Disabled | Keep the underline still while rain and digits animate |

The scanline is visible and animated by default. Its impulse crosses the banner every three seconds at 1× speed. A static export keeps the visible underline and removes all animation.

```sh
python build_mrmvc.py --text Studio --no-scanline
python build_mrmvc.py --text Studio --no-scanline-animation
python build_mrmvc.py --text Studio --color cyan --speed 2
```

## 07 / GitHub Integration

Upload your generated SVG to your GitHub 
profile repository and reference it in your README.

```html
<img src="./matrix-banner.svg" alt="Profile Banner" width="100%" />
```

Animation support may vary depending on the 
browser and SVG rendering environment.

## Matrix Engine Web

The studio opens in English on the first visit. Select **EN** or **DE** in the navigation to save your language on this device. **Show scanline** controls the entire underline. **Animate scanline** controls its light impulse. Reduced motion keeps the preview still. Downloads follow the selected animation settings.

The browser studio in `web/` generates animated or static SVG banners locally. It includes the six CLI palettes, custom HEX colors, seeded generation, local fonts, a live preview, SVG download and Markdown copy/download.

With Node.js 24 LTS or newer, run these commands from the repository root. On Windows use `npm.cmd`.

```powershell
cd web
npm.cmd ci
npm.cmd run dev
```

Open the local address printed by Vite, including `/matrix-engine/`. Download `matrix-banner.svg`, place it beside the README in your own repository and paste the Markdown from the export menu. GitHub supports relative image paths. Its repository file viewer has restrictions on SVG animation. Use a static export when a fixed appearance is required. [GitHub image syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#images) · [GitHub file viewer](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files#viewing-images)

### GitHub Pages

1. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Enable Actions for the repository.
2. If deployment branch restrictions are enabled for the `github-pages` environment, allow `main`.
3. The **Matrix Engine Web** workflow tests the feature branch and pull requests. On an eligible push to `main`, or a manual run on `main`, it tests, builds and deploys only `web/dist/`. The deployment job requests `pages: write` and `id-token: write`.

After deployment the project site is served at `https://mrmvc.github.io/matrix-engine/`. Local build instructions, generator parity and browser test coverage are documented in the [web implementation notes](./web/PORTIERUNG.md). [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 08 / Roadmap

- [x] SVG generation
- [x] Animated digital rain
- [x] Custom text rendering
- [x] Command-line interface
- [x] Six CLI color presets
- [x] Configurable animation speed
- [x] Automatic text scaling
- [x] Static SVG generation
- [x] Automated cross-platform testing
- [x] Automated dependency updates
- [x] CodeQL security scanning
- [ ] PNG and GIF export
- [x] Interactive web-based generator
- [ ] Custom color palette editor
- [ ] PyPI package distribution

## 09 / Contributing

Contributions, suggestions and bug reports are welcome.

Feel free to open an issue or submit a pull request.

## 10 / License

Distributed under the MIT License.

See [LICENSE](./LICENSE) for more information.

---

<div align="center">

**MrMVC**

`BUILD. INNOVATE. EVOLVE.`

[GitHub Profile](https://github.com/MrMVC)

</div>
