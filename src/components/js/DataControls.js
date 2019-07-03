import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { filterData, sortAlphaNum } from './DataLogic.js';
import '../css/DataControls.scss';

export const CPFilters = ({data, display, setDisplay}) => {

    const getCPOptions = key => data ? Array.from( new Set( data.map( CP => CP[key] ) ) ).sort( sortAlphaNum ) : ["NO DATA"];

    return(
        <div className="HierarchicalGraph_controls--filterBy">
            <h1>Filter Count Points:</h1>
            <FilterDropdown title="CP" id="id" options={getCPOptions( "id" )} display={display} setDisplay={setDisplay}/>
            <FilterDropdown title="Road Name" id="road_name" options={getCPOptions( "road_name" )} display={display} setDisplay={setDisplay}/>
            <FilterDropdown title="Road Type" id="road_type" options={getCPOptions( "road_type" )} display={display} setDisplay={setDisplay}/>
            <FilterDropdown title="Road Category" id="road_cat" options={getCPOptions( "road_cat" )} display={display} setDisplay={setDisplay}/>
        </div>
    )

}

export const DataControls = ({data, display, setDisplay}) => {

    const getCountOptions = key => data ? Array.from( new Set( data[0].counts.map( count => count[key].value ) ) ).sort( sortAlphaNum ) : ["NO DATA"];

    return (
        <div className="HierarchicalGraph_controls">

            <div className="HierarchicalGraph_controls--viewBy">
                <h1>Filter Counts:</h1>
                <FilterDropdown title="Year" id="year" options={Array.from( {length:19}, ( v, i ) => (2000 + i).toString() )} display={display} setDisplay={setDisplay}/>
                <FilterDropdown title="Direction" id="direction" options={["N","S","E","W"]} display={display} setDisplay={setDisplay}/>
            </div>

        </div>
    )

}

//<FoldingDropdown title="Direction" id="direction" operation="View" options={["Total Vehicles", "Goods", "Pedal Cycles", "Buses and Coaches", "Cars and Taxis"]} display={display} setDisplay={setDisplay}/>
const FilterDropdown = ({ title, id, options, display, setDisplay }) => {

    let open = display.filters.hasOwnProperty( id );
    const props = useSpring( {from:{width:0, opacity:0}, to: {width: open ? 100 : 0, opacity: open ? 1 : 0}} );
    const setVal = val => {
        if( open ){
            setDisplay( { type: `addFilter`, payload: [ id, val ] } );
        }else {
            setDisplay( { type: `removeFilter`, payload: id } );
        }
    }

    return (
        <button className={`HierarchicalGraph_controls--Dropdown${ open ? " active" : ""}`}>
            <h1 onClick={() => { open = !open; setVal( options[0] ) }}>{title}</h1>
            <animated.select style={props} onChange={ev => setVal( ev.target.value )} value={display.filters[id]||""}>
                {options.map( option => <option key={option} value={option}>{option}</option> )}
            </animated.select>
        </button>
    )

}
