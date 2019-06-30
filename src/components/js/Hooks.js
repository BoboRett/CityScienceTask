import { useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

const useMapbox = ({ accessToken, mapRef, mapConfig }) => {

    const [ mapbox, setMapbox ] = useState( null );

    useEffect( () => {

        if( !mapRef.current ) return;

        mapboxgl.accessToken = accessToken;

        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/jridley246/cjxi67z0i42vy1cldfj812u8x',
        })

        setMapbox( map )

        map.addControl( new mapboxgl.NavigationControl(), 'top-left' );

    }, [ accessToken, mapRef ])

    return mapbox

}

const useMap = ( mapbox, mapConfig, setCP, setHoveredCP ) => {

    const addMarker = function( marker ){

        const pos = new mapboxgl.LngLat( marker.lng.value, marker.lat.value );

        const popup = new mapboxgl.Popup()
            .setHTML(`
                    <div class="MapPopup">
                        <h1>${marker.road_name.value}</h1>
                        <h2>${marker.start_junction.value} - ${marker.end_junction.value}</h2>
                        <button id="onBtn" class="btn btn-sm">
                            BeepBoop
                        </button>
                    </div>
                `)

        const _marker = new mapboxgl.Marker()
            .setLngLat( pos )
            .setPopup( popup )
            .addTo( mapbox )

        _marker._element.addEventListener( "mouseenter", () => setHoveredCP( marker ) );
        _marker._element.addEventListener( "mouseout", () => setHoveredCP( null ) );
        popup.on( "open", ev => console.log( ev ) || setCP( marker ) );

        this.extend( pos );

    }

    useEffect( () => {

        if( !mapbox || !mapConfig ) return

        const bounds = new mapboxgl.LngLatBounds();

        mapConfig.markers.forEach( addMarker, bounds );
        mapbox.fitBounds( bounds, {
            padding: 50,
            duration: 0
        });

    }, [ mapbox, mapConfig ] )

}

export { useMap, useMapbox };
