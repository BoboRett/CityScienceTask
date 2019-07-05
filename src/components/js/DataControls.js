import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sortAlphaNum } from '../../logic/DataLogic.js';
import { useGeocoder } from '../../logic/Hooks.js';
import '../css/DataControls.scss';

const FilterHolder = ({children, id}) => {

    return (
        <div className="component-filterHolder" id={id}>
            <div>
                <svg viewBox="0 0 100 100">
                    <g style={{transform: "translate(50%,50%)"}}>
                        <path d="M -7 -10 l -30 -30 h 74 l -30 30 l -5 45 l -6 5 Z"/>
                    </g>
                </svg>
                <h1>Filters</h1>
            </div>
            {children}
        </div>
    )
}

export const CPFilters = ({data, map, display, setDisplay}) => {

    const getCPOptions = key => data ? Array.from( new Set( data.map( CP => CP[key] ) ) ).sort( sortAlphaNum ) : ["NO DATA"];

    return(
        <FilterHolder id="countPointFilters">
            <FilterDropdown title="Count Point" id="id" options={getCPOptions( "id" )} filters={display.filters} setDisplay={setDisplay}>
                <path id="icon_marker" d="M -25 0 a 30 30 0 1 1 50 0 l -25 40 l -25 -40 M -12.5 -15 a 12.5 12.5 0 0 0 25 0 a 12.5 12.5 0 0 0 -25 0"/>
            </FilterDropdown>
            <GeocoderFilter filters={display.filters} map={map} setDisplay={setDisplay}>
                <path id="icon_marker" d="M -25 0 a 30 30 0 1 1 50 0 l -25 40 l -25 -40 M -12.5 -15 a 12.5 12.5 0 0 0 25 0 a 12.5 12.5 0 0 0 -25 0" transform="translate(-15)"/>
                <line x1="-15" x2="25" y1="40" y2="10" strokeWidth="5" strokeDasharray="6"/>
                <use href="#icon_marker" transform="translate(25,-10)scale(0.6)" opacity="0.6"/>
            </GeocoderFilter>
            <FilterDropdown title="Road Name" id="road_name" options={getCPOptions( "road_name" )} filters={display.filters} setDisplay={setDisplay}>
                <line x1="-20" x2="-20" y1="35" y2="15" strokeWidth="5"/>
                <line x1="20" x2="20" y1="35" y2="15" strokeWidth="5"/>
                <rect x="-40" y="-35" width="80" height="50"/>
                <text x="0" y="2">A66</text>
            </FilterDropdown>
            <FilterDropdown title="Road Type" id="road_type" options={getCPOptions( "road_type" )} filters={display.filters} setDisplay={setDisplay}>
                <path d="M -10 -40 h 7 l -1 20 h -8 Z"/>
                <path d="M 10 -40 h -7 l 1 20 h 8 Z"/>
                <path d="M -13 0 h 9 l -2 40 h -11 Z"/>
                <path d="M 13 0 h -9 l 2 40 h 11 Z"/>
                <path d="M -40 -15 h 80 v 10 h -7 q -3 0 -3 3 v 7 h -7 l -3 -7 q 0 -3 -3 -3 h -34 q -3 0 -3 3 l -3 7 h -7 v -7 q 0 -3 -3 -3 h -7 v -10"/>
            </FilterDropdown>
        </FilterHolder>
    )

}

export const CountFilters = ({showDate = true, showDirection = true, data, display, setDisplay}) => {

    const date = useCallback(
        <FilterDropdown title="Year" id="year" options={Array.from( {length:19}, ( v, i ) => (2000 + i).toString() )} filters={display.filters} setDisplay={setDisplay}>
            <path d={`M -30 -30 q -10 0 -10 10 v 50 q 0 10 10 10 h 60 q 10 0 10 -10 v -50 q 0 -10 -10 -10 h -5 a 10 10 0 0 0 -20 0 h -10 a 10 10 0 0 0 -20 0 h -5
                      M -29 -14 h  13 v  12 h -13 v -12
                      M -14 -14 h  13 v  12 h -13 v -12
                      M  1  -14 h  13 v  12 h -13 v -12
                      M  16 -14 h  13 v  12 h -13 v -12
                      M -29  2  h  13 v  12 h -13 v -12
                      M -14  2  h  13 v  12 h -13 v -12
                      M  1   2  h  13 v  12 h -13 v -12
                      M  16  2  h  13 v  12 h -13 v -12
                      M -29  18 h  13 v  12 h -13 v -12
                      M -14  18 h  13 v  12 h -13 v -12`
                  }/>
        </FilterDropdown>
        , [ display.filters, setDisplay ] );

    const direction = useCallback(
        <FilterDropdown title="Direction" id="direction" options={["N","S","E","W"]} filters={display.filters} setDisplay={setDisplay}>
            <path d={`M -45 0 a 45 45 0 0 0 90 0 a 45 45 0 0 0 -90 0 M 35 0 a 35 35 0 0 1 -70 0 a 35 35 0 0 1 70 0`}/>
            <path d={`M 0 34 l -10 -32 a 20 20 0 0 0 20 0 l -10 32`} transform="rotate(20)"/>
            <path d={`M 0 34 l -10 -32 a 20 20 0 0 0 20 0 l -10 32`} transform="rotate(200)"/>
        </FilterDropdown>
        , [ display.filters, setDisplay ] );

    return (
        <FilterHolder id="countFilters">
            { showDate ?
                date
            : null }
            { showDirection ?
                direction
            : null }
        </FilterHolder>
    )

}

const FilterDropdown = ({ children: icon, title, id, options, filters, setDisplay }) => {

    let active = filters.hasOwnProperty( id );
    const setVal = val => {
        if( active ){
            setDisplay( { type: `addFilter`, payload: [ id, val ] } );
        }else {
            setDisplay( { type: `removeFilter`, payload: id } );
        }
    }

    return (
        <div className={`component-filterDropdown${ active ? " active" : ""}`}>
            <div className="header" onClick={() => { active = !active; setVal( options[0] ) }}>
                <svg viewBox="0 0 100 100">
                    <g style={{transform: "translate(50%,50%)"}}>
                        {icon}
                    </g>
                </svg>
            </div>
            <select onChange={ev => setVal( ev.target.value )} value={filters[id]||""}>
                {options.map( option => <option key={option} value={option}>{option}</option> )}
            </select>
            <div className="header_text" onClick={() => { active = !active; setVal( options[0] ) }}>
                <h1 className="title">{title}</h1>
                <h1 className="currentFilter">{filters[id]}</h1>
            </div>
        </div>
    )

}

const GeocoderFilter = ({children: icon, map, filters, setDisplay}) => {

        let active = filters.hasOwnProperty( "distance" );
        const searchBox = useRef( null );
        const radiusRef = useRef( null );
        const geoCoder = useGeocoder( map, searchBox, 'pk.eyJ1IjoianJpZGxleTI0NiIsImEiOiJjanhpMzYxdXcxbWliNDFsN2g2bGg3ODg2In0.qqSDB24vCq0mdKUCdY4zgw', setDisplay, radiusRef );

        const setVal = val => {
            if( active ){
                setDisplay( { type: `addFilter`, payload: [ "distance", filters.distance ? { ...filters.distance, radius: val } : null ] } );
            }else {
                geoCoder.clear()
            }
        }

        return (
            <div className={`component-geoCoder${ active ? " active" : ""}`}>
                <div className="header" onClick={() => { active = !active; setVal( 5 ) }}>
                    <svg viewBox="0 0 100 100">
                        <g style={{transform: "translate(50%,50%)"}}>
                            {icon}
                        </g>
                    </svg>
                </div>
                <div className="geoCoder" ref={searchBox}>
                    <select ref={radiusRef} onChange={ev => setVal( ev.target.value )} value={filters.distance ? filters.distance.radius : "5"}>
                        <option value="5">&lt;5km</option>
                        <option value="10">&lt;10km</option>
                        <option value="15">&lt;15km</option>
                    </select>
                </div>
                <div className="header_text" onClick={() => { active = !active; setVal( 5 ) }}>
                    <h1 className="title">Distance</h1>
                    <h1 className="currentFilter">{filters.distance ? filters.distance.text : ""}</h1>
                </div>
            </div>
        )

}
