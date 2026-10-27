# Lucky Garden

A pixel-art miniature garden with an interactive prize wheel. Built with vanilla JavaScript and locally bundled Three.js r169. No build step or external CDN is required.

## Run locally

Requires Python 3 and a modern browser with WebGL.

```sh
python3 -m http.server 4337 --bind 127.0.0.1
```

Open http://127.0.0.1:4337 . Serve this folder over HTTP; opening index.html directly will prevent browser module imports.

## Features

- 2–32 participants with editable names and an automatically updated participant count.
- The supplied 23 first names are preloaded. Later edits persist in browser local storage.
- Equal-probability selection using the browser's cryptographic random generator. Draws are independent; previous winners remain eligible.
- Idle walking and chatting animations, a slowly rotating wheel, decelerating draws, and winner celebrations.
- An angled opening view followed by a close-up of the winning name.
- Responsive single-screen layout with an independently scrolling participant list.
- Respects the system's reduced-motion preference.

## Files

- `index.html`: interface and entry point
- `style.css`: layout and visual styling
- `app.js`: scene, animation, camera, participant management, and draw logic
- `vendor/three.module.js`: bundled Three.js r169

## License

Lucky Garden is available under the [MIT License](LICENSE). You may use it at your meetings, modify it, and share your own version, including commercially, while retaining the license and copyright notice.

## Third-party software

Three.js is copyright 2010–2024 Three.js Authors, distributed under the MIT license. See `vendor/THREE-LICENSE.txt`.

## Validation

JavaScript syntax checks and draw-angle calculations have been checked. Camera centering was checked mathematically across multiple aspect ratios. The interface has been iterated from screenshots; automated browser end-to-end tests are not included.
