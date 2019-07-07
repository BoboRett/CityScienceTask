import { useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import * as d3 from 'd3'

const useMapbox = ({ accessToken, mapRef }) => {
    const [mapbox, setMapbox] = useState(null)

    useEffect(() => {
        if (!mapRef.current) return

        mapboxgl.accessToken = accessToken

        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/jridley246/cjxi67z0i42vy1cldfj812u8x',
        })

        setMapbox(map)

        map.addControl(new mapboxgl.NavigationControl(), 'bottom-left')
        map.markers = []
    }, [accessToken, mapRef])

    return mapbox
}

const useMap = (mapbox, mapMarkers, setDisplay) => {
    useEffect(() => {
        if (!mapbox || !mapMarkers) return

        const bounds = new mapboxgl.LngLatBounds()

        //Remove old markers
        mapbox.markers.forEach(marker => {
            if (!mapMarkers.includes(marker.data)) {
                marker.data.marker = null
                marker.remove()
            } else {
                bounds.extend(marker.getLngLat())
            }
        })
        mapbox.markers = mapbox.markers.filter(marker => mapMarkers.includes(marker.data))

        //Add new markers
        mapMarkers.forEach(CP => !CP.marker && addMarker(CP, mapbox, bounds, setDisplay))
        //Fit map to markers
        bounds._ne &&
            mapbox.fitBounds(bounds, {
                padding: {
                    left: 50,
                    top: 50,
                    bottom: 50,
                    right: Math.max(window.innerWidth * 0.37, 650),
                },
                duration: 1000,
            })
    }, [mapbox, mapMarkers, setDisplay])
}

const useGeocoder = (map, searchBox, accessToken, setDisplay, radiusRef) => {
    const [geoCoder, setGeoCoder] = useState(null)

    useEffect(() => {
        if (!searchBox || !map) return

        const gc = new MapboxGeocoder({
            accessToken: accessToken,
            mapboxgl: mapboxgl,
            clearAndBlurOnEsc: false,
            flyTo: {
                padding: {
                    left: 50,
                    top: 50,
                    bottom: 50,
                    right: Math.max(window.innerWidth * 0.37, 650),
                },
            },
        })

        searchBox.current.appendChild(gc.onAdd(map))
        setGeoCoder(gc)

        gc.on('result', ev =>
            setDisplay({
                type: 'addFilter',
                payload: ['distance', { ...ev.result, radius: radiusRef.current.value }],
            }),
        )
        gc.on('clear', ev => setDisplay({ type: 'removeFilter', payload: 'distance' }))
    }, [map, searchBox, radiusRef, accessToken, setDisplay])

    return geoCoder
}

const useHoveredCP = hoveredCP => {
    const [lastMarker, setLastMarker] = useState(null)

    useEffect(() => {
        if (hoveredCP) {
            d3.selectAll(`.Graph rect:not([class="${hoveredCP}"])`)
                .transition('fadehovered')
                .duration(100)
                .attr('opacity', 0.2)

            const markerElement = d3
                .selectAll(`.mapboxgl-marker[id="${hoveredCP}"]`)
                .select('svg')
                .node()
            setLastMarker(markerElement)

            d3.select(markerElement)
                .transition()
                .duration(200)
                .attr('transform', 'translate( 0, -8.75 )scale( 1.5 )')
        } else {
            d3.selectAll(`.StackedBar > .Data > g > rect`)
                .transition('fadehovered')
                .duration(50)
                .attr('opacity', 1)

            d3.select(lastMarker)
                .transition()
                .attr('transform', 'translate( 0, 0 )scale( 1 )')
        }
    }, [hoveredCP, lastMarker])
}

export { useMap, useMapbox, useGeocoder, useHoveredCP }

const addMarker = (CP, mapbox, bounds, setDisplay) => {
    const highlightCP = function() {
        setDisplay({ type: 'setHoveredCP', payload: CP.id })
    }
    const unhighlightCP = function() {
        setDisplay('clearHoveredCP')
    }

    const pos = new mapboxgl.LngLat(CP.lng, CP.lat)

    const popup = new mapboxgl.Popup().setHTML(`
                <div class="MapPopup">
                    <h1>Road: ${CP.roadName}</h1>
                    <h2>ID: ${CP.id}</h2>
                    ${CP.startJunction ? `<h3>From: ${CP.startJunction}</h3>` : ''}
                    ${CP.endJunction ? `<h3>To: ${CP.endJunction}</h3>` : ''}
                    <button id="focus">
                        Set Focus
                    </button>
                </div>
            `)

    popup._content
        .querySelector('#focus')
        .addEventListener('click', () => setDisplay({ type: 'setFilter', payload: { id: CP.id } }))

    const marker = new mapboxgl.Marker()
        .setLngLat(pos)
        .setPopup(popup)
        .addTo(mapbox)

    marker.data = CP
    CP.marker = marker
    mapbox.markers.push(marker)

    //Add rect for input capture...default marker svg is messy for event handling
    d3.select(marker.getElement())
        .attr('id', CP.id)
        .select('svg')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', '#0000')
        .on('mouseenter', highlightCP)
        .on('mouseout', unhighlightCP)

    bounds.extend(pos)
}
