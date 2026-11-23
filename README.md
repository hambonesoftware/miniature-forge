# Miniature Forge

Explore the outdoor 3D models at **https://hambonesoftware.github.io/miniature-forge/**.

Choose Danville Main Street or Riverton. Overview supports drag and zoom; Walk uses WASD and mouse/drag look. Shift moves faster; Escape releases the mouse. Fly uses Q/E for vertical movement. Touch movement controls are included.

Danville is an estimated, Moore Building-inspired architectural study, retaining historic forms with generic storefront labels. It is not a surveyed or complete reconstruction of Danville. Riverton is a fictional model train town. This edition explores streets and outdoor areas; building interiors remain closed.

The website contains optimized GLB exports, navigation data and the browser runtime. The editable Blender masters remain in the local Miniature Forge project. Browser materials approximate the native Cycles materials; this is an interactive inspection prototype, not a photographic-quality renderer.

## Sources and runtime

- Danville facade reference: [Warren LeMay's photograph, March 20, 2022](https://www.flickr.com/photos/warrenlemay/51999661632), CC BY-SA 2.0. The photograph is a modeling reference and is not used as a texture. Facade dimensions and rear elevations are estimated.
- [City historic design guidelines](https://www.boyleplanning.org/_files/ugd/a677db_f3f773d314c741698af3d5c6d96a4b0a.pdf).
- Three.js 0.187.0 is distributed with its MIT license in `vendor/three/LICENSE`; Draco decoder license notices remain in the bundled runtime.

The Pages workflow publishes the checked-in static site when `main` changes. No server, API key, CDN or account is required to use the viewer. Serve these files over HTTP rather than opening `index.html` with `file://`.
