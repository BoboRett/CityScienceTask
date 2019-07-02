import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { filterData, sortAlphaNum } from './DataLogic.js';
import '../css/DataControls.scss';

export const CPFilters = ({data, display, setDisplay}) => {

    const getCPOptions = key => data ? Array.from( new Set( data.map( CP => CP[key] ) ) ).sort( sortAlphaNum ) : ["NO DATA"];

    return(
        <div className="HierarchicalGraph_controls--filterBy">
            <h1>Filter Count Points:</h1>
            <FoldingDropdown title="CP" id="id" operation="Filter" options={getCPOptions( "id" )} display={display} setDisplay={setDisplay}/>
            <FoldingDropdown title="Road Name" id="road_name" operation="Filter" options={getCPOptions( "road_name" )} display={display} setDisplay={setDisplay}/>
            <FoldingDropdown title="Road Type" id="road_type" operation="Filter" options={getCPOptions( "road_type" )} display={display} setDisplay={setDisplay}/>
            <FoldingDropdown title="Road Category" id="road_cat" operation="Filter" options={getCPOptions( "road_cat" )} display={display} setDisplay={setDisplay}/>
        </div>
    )

}

export const DataControls = ({data, display, setDisplay}) => {

    const getCountOptions = key => data ? Array.from( new Set( data[0].counts.map( count => count[key].value ) ) ).sort( sortAlphaNum ) : ["NO DATA"];

    return (
        <div className="HierarchicalGraph_controls">

            <div className="HierarchicalGraph_controls--viewBy">
                <h1>Filter Counts:</h1>
                <FoldingDropdown title="Year" id="year" operation="Filter" options={Array.from( {length:19}, ( v, i ) => (2000 + i).toString() )} display={display} setDisplay={setDisplay}/>
                <FoldingDropdown title="Direction" id="direction" operation="Filter" options={["N","S","E","W"]} display={display} setDisplay={setDisplay}/>
            </div>

        </div>
    )

}

const FoldingDropdown = ({ title, id, operation, options, display, setDisplay }) => {

    let open = display.filters.hasOwnProperty( id );
    const props = useSpring( {from:{width:0, opacity:0}, to: {width: open ? 100 : 0, opacity: open ? 1 : 0}} );
    const setVal = val => {
        if( open ){
            setDisplay( { type: `add${operation}`, payload: [ id, val ] } );
        }else {
            setDisplay( { type: `remove${operation}`, payload: id } );
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
