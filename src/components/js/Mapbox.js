import React, { useState, useRef, useEffect } from 'react';
import { useMapbox, useMap } from '../../logic/Hooks.js';
import { CPFilters } from './DataControls.js';
import '../css/Mapbox.scss';

const Mapbox = ({ children, data, filteredData, display, setDisplay }) => {

    const [ mapMarkers, setMapMarkers ] = useState( null );
    const map = useRef( null );

    const Map = useMapbox({
        accessToken: 'pk.eyJ1IjoianJpZGxleTI0NiIsImEiOiJjanhpMzYxdXcxbWliNDFsN2g2bGg3ODg2In0.qqSDB24vCq0mdKUCdY4zgw',
        mapRef: map,
    } );

    useMap( Map, mapMarkers, display, setDisplay );

    useEffect( () => {

        if( !filteredData ) return;
        setMapMarkers( filteredData )

    }, [ filteredData, display.filters ])

    return (
        <div className="Mapbox" ref={map}>
            <CPFilters data={data} map={Map} display={display} setDisplay={setDisplay}/>
        </div>
    )

}

export default Mapbox
