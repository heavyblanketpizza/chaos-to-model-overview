# tools

Draws every chart and figure in `assets/` from the numbers in `data/benchmarks/`, and assembles the demo site.

```sh
cd tools
npm install
node charts.mjs     # benchmark charts → assets/charts/*-{light,dark}.svg
node figures.mjs    # banner, pipeline, timeline, "follow one number"
./build-site.sh     # GitHub Pages site → _site/
```

Text in the SVGs is set as glyph outlines, so a chart looks the same on every OS and inside GitHub's image sandbox, where web fonts cannot load. The fonts are [Pretendard](https://github.com/orioncactus/pretendard) (Regular, Medium, SemiBold, Bold) and [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) Bold, both under the SIL Open Font License. The scripts look for them in `tools/fonts/` and then in the system font folders.

Each figure is written twice, for GitHub's light and dark themes; the README picks one with `<picture>`. The series colours passed a colour-vision check on both backgrounds.
