import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as d3 from 'd3';

const useMapbox = ({ accessToken, mapRef }) => {

    const [ mapbox, setMapbox ] = useState( null );

    useEffect( () => {

        if( !mapRef.current ) return;

        mapboxgl.accessToken = accessToken;

        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/jridley246/cjxi67z0i42vy1cldfj812u8x',
        })

        setMapbox( map )

        map.addControl( new mapboxgl.NavigationControl(), 'bottom-left' );
        map.markers = [];
        //map.addControl( new mapboxgl.FullscreenControl(), 'bottom-left' );

    }, [ accessToken, mapRef ])

    return mapbox

}

const useMap = ( mapbox, mapMarkers, display, setDisplay ) => {

    useEffect( () => {

        if( !mapbox || !mapMarkers ) return

        const bounds = new mapboxgl.LngLatBounds();

        //Remove old markers
        mapbox.markers.filter( marker => !mapMarkers.includes( marker.data ) ).forEach( marker => { marker.data.marker = null; marker.remove() } );
        mapbox.markers = mapbox.markers.filter( marker => mapMarkers.includes( marker.data ) );

        //Add new markers
        mapMarkers.forEach( CP => !CP.marker && addMarker( CP, mapbox, bounds, setDisplay ) );
        //Fit map to markers
        bounds._ne && mapbox.fitBounds( bounds, {
            padding: { left: 50, top: 50, bottom: 50, right: 400 },
            duration: 1000
        });

    }, [ mapbox, mapMarkers, setDisplay ] )

}

const useGeocoder = ( searchBox, accessToken, setDisplay ) => {

    useEffect( () => {

        console.log( new MapboxGeocoder({
            accessToken: accessToken
        }))

    }, [accessToken])

}

export { useMap, useMapbox, useGeocoder };

const addMarker = ( CP, mapbox, bounds, setDisplay ) => {

    const highlightCP = function(){

        setDisplay( { type: 'setHoveredCP', payload: CP.id } );

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

    const pos = new mapboxgl.LngLat( CP.lng, CP.lat );

    const popup = new mapboxgl.Popup()
        .setHTML(`
                <div class="MapPopup">
                    <h1>${CP.road_name}</h1>
                    <h2>${CP.displayName}</h2>
                    <button id="onBtn" class="btn btn-sm">
                        BeepBoop
                    </button>
                </div>
            `)

    const marker = new mapboxgl.Marker()
        .setLngLat( pos )
        .setPopup( popup )
        .addTo( mapbox )

    marker.data = CP;
    CP.marker = marker;
    mapbox.markers.push( marker );

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

    popup.on( "open", ev => {});//SET FOCUSEDCP   setDisplay( { type: 'setFilter', payload: {id: CP.id} } ) );

    bounds.extend( pos );

}
