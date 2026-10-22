# Polka World

A polka-dot 3D planet where an alien saucer flies over every stop of
**Angine de Poitrine's 2027 world tour**. The black, white and red polka dots
follow the band's look.

- The continents are drawn as polka dots on a black planet, built from Natural Earth land data.
- Each tour stop has a red marker. The saucer flies great-circle arcs between stops in tour order, then hovers over each city with a polka-dot tractor beam.
- The agenda panel lists every date. Click a stop to send the saucer there.
- Each event has a **Tickets** link to the destination supplied by the band, or an event-specific **RSVP** link for presale registration. The current stop also shows its link.
- Controls: drag to orbit, scroll to zoom. **Space** pauses or plays, and **← / →** go to the previous or next stop. **Follow** makes the camera track the saucer.

## Run it

It's a static site with no build step. The libraries are in `vendor/`, so it also works offline.

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

You need an HTTP server because ES modules and `fetch` don't work from `file://`.
The live site is published with GitHub Pages at
[brunoborges.github.io/polkaworld](https://brunoborges.github.io/polkaworld/).
Pages serves the repository root of the `gh-pages` branch. To publish an updated,
committed version, push that commit to `gh-pages` (without force-pushing).

## Tour data

The agenda is in [`js/tour.js`](js/tour.js). It comes from the band's 2027 tour
announcement ([official Laylo tour](https://laylo.com/anginedepoitrine/m/hewSLX)),
verified on **October 22, 2026**: 34 dated events, including separate entries and
RSVP links for each night in Calgary, Ottawa, Winnipeg, and London. Brooklyn
Steel is not listed in this source and is not included. Festival date ranges
are preserved; they do not imply a confirmed individual performance day.
The source's general city-signup form is not a concert and is excluded.
Dates and ticket availability may change, so check the official listing.

## Third-party code (vendored)

- [three.js](https://threejs.org) r170 (MIT)
- [topojson-client](https://github.com/topojson/topojson-client) 3.1.0 (ISC)
- [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 `land-110m.json` (ISC, data from Natural Earth)
