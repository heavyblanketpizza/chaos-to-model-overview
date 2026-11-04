// Light and dark steps of one palette. Series hues passed the dataviz validator on these
// surfaces: all-pairs CVD separation >= 9.2 (light) and 9.4 (dark).
export const THEMES = {
  light: {
    surface: '#fbfaf6', border: '#e6e2d7', ink: '#0b0b0b', ink2: '#55524a', mut: '#8a8579',
    grid: '#ece8de', axis: '#cbc5b6', track: '#efebe1', pill: '#e8eeff', pillInk: '#1d47c4',
    c2m: '#2c63ff', uns: '#eb6834', cur: '#1baf7a', base: '#a39e91', soft: '#dcd7cb', hi: '#fff1c2',
  },
  dark: {
    surface: '#141414', border: '#2c2b28', ink: '#f4f1e8', ink2: '#c6c1b4', mut: '#8f8a7e',
    grid: '#242321', axis: '#3d3c37', track: '#22211f', pill: '#1b2547', pillInk: '#a9bdff',
    c2m: '#5b84ff', uns: '#d95926', cur: '#199e70', base: '#6f6b62', soft: '#34332f', hi: '#4a3d12',
  },
};

export function css(t) {
  return [
    `.bd{fill:${t.surface};stroke:${t.border};stroke-width:1}`,
    `.sf{fill:${t.surface}}.trk{fill:${t.track}}.soft{fill:${t.soft}}.hi{fill:${t.hi}}`,
    `.ink{fill:${t.ink}}.ink2{fill:${t.ink2}}.mut{fill:${t.mut}}`,
    `.pill{fill:${t.pill}}.pillInk{fill:${t.pillInk}}`,
    `.grid{stroke:${t.grid};stroke-width:1;fill:none}.axis{stroke:${t.axis};stroke-width:1;fill:none}`,
    `.c2m{fill:${t.c2m}}.uns{fill:${t.uns}}.cur{fill:${t.cur}}.base{fill:${t.base}}`,
    `.sc2m,.suns,.scur,.sbase,.smut,.sink{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}`,
    `.sc2m{stroke:${t.c2m}}.suns{stroke:${t.uns}}.scur{stroke:${t.cur}}.sbase{stroke:${t.base}}.smut{stroke:${t.mut}}.sink{stroke:${t.ink}}`,
    `.ring{stroke:${t.surface};stroke-width:2}.hollow{fill:${t.surface}}`,
  ].join('');
}

export const SERIES = [
  { key: 'c2m', cls: 'c2m', label: 'c2m', long: 'Chaos-to-Model' },
  { key: 'unsloth', cls: 'uns', label: 'Unsloth', long: 'Unsloth Data Recipes' },
  { key: 'curator', cls: 'cur', label: 'NeMo Curator', long: 'NeMo Curator' },
];
