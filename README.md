# Polka World

A polka-dot 3D planet where an alien saucer flies over every stop of
**Angine de Poitrine's 2027 world tour**. The black, white and red polka dots
follow the band's look.

- The continents are drawn as polka dots on a black planet, built from Natural Earth land data.
- Each tour stop has a red marker. The saucer flies great-circle arcs between stops in tour order, then hovers over each city with a polka-dot tractor beam.
- The agenda panel lists every date. Click a stop to send the saucer there.
- Controls: drag to orbit, scroll to zoom. **Space** pauses or plays, and **← / →** go to the previous or next stop. **Follow** makes the camera track the saucer.

## Run it

It's a static site with no build step. The libraries are in `vendor/`, so it also works offline.

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

You need an HTTP server because ES modules and `fetch` don't work from `file://`.
The site can also be published as-is with GitHub Pages.

## Tour data

The agenda is in [`js/tour.js`](js/tour.js). It comes from the band's 2027 tour
announcement ([laylo.com/anginedepoitrine](https://laylo.com/anginedepoitrine)) as
reported in the press. Dates may change, so check the band's official channels.

## Third-party code (vendored)

- [three.js](https://threejs.org) r170 (MIT)
- [topojson-client](https://github.com/topojson/topojson-client) 3.1.0 (ISC)
- [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 `land-110m.json` (ISC, data from Natural Earth)
