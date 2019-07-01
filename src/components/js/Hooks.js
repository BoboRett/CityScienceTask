import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as d3 from 'd3';

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
        //map.addControl( new mapboxgl.FullscreenControl(), 'bottom-left' );

    }, [ accessToken, mapRef ])

    return mapbox

}

const useMap = ( mapbox, mapConfig, display, setDisplay ) => {

    const addMarker = function( CP ){

        const highlightCP = function(){

            setDisplay( 'setHoveredCP' );

            d3.select( this.parentNode )
                .transition()
                .duration( 200 )
                .attr( "transform", "translate( 0, -8.75 )scale( 1.5 )" )

        };
        const unhighlightCP = function(){

            setDisplay( 'clearHoveredCP' );

            d3.select( this.parentNode )
                .transition()
                .attr( "transform", "translate( 0, 0 )scale( 1 )" )

        };

        const pos = new mapboxgl.LngLat( CP.lng.value, CP.lat.value );

        const popup = new mapboxgl.Popup()
            .setHTML(`
                    <div class="MapPopup">
                        <h1>${CP.road_name.value}</h1>
                        <h2>${CP.start_junction.value} - ${CP.end_junction.value}</h2>
                        <button id="onBtn" class="btn btn-sm">
                            BeepBoop
                        </button>
                    </div>
                `)

        const marker = new mapboxgl.Marker()
            .setLngLat( pos )
            .setPopup( popup )
            .addTo( mapbox )

        //Add rect for input capture...default marker svg is messy for event handling
        d3.select( marker.getElement() ).select( "svg" )
            .append( "rect" )
            .attr( "x", 0 )
            .attr( "y", 0 )
            .attr( "width", "100%", )
            .attr( "height", "100%" )
            .attr( "fill", "#0000" )
            .on( "mouseenter", highlightCP )
            .on( "mouseout", unhighlightCP )

        popup.on( "open", ev => setDisplay( { type: 'setview', payload: ["CP", CP.id.value] } ) );

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
