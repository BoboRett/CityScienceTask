import React, { useState, useRef, useEffect } from 'react';
import { filterData } from './DataLogic.js';
import { useMapbox, useMap } from './Hooks.js';
//import mapboxgl from 'mapbox-gl';

const Mapbox = ({ data, display, setDisplay }) => {

    const [ mapMarkers, setMapMarkers ] = useState( null );
    const map = useRef( null );

    const Map = useMapbox({
        accessToken: 'pk.eyJ1IjoianJpZGxleTI0NiIsImEiOiJjanhpMzYxdXcxbWliNDFsN2g2bGg3ODg2In0.qqSDB24vCq0mdKUCdY4zgw',
        mapRef: map,
    } );

    useMap( Map, mapMarkers, display, setDisplay );

    useEffect( () => {

        if( !data ) return;
        setMapMarkers( data )

    }, [ data, display.filters ])

    return (
        <div className="Mapbox" ref={map}/>
    )

}

export default Mapbox
