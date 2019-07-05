import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VehicleCounts, filterCounts } from '../../logic/DataLogic.js';
import * as d3 from 'd3';

export default function StreamGraph({ children, data, display, setDisplay }){

    const frame = useRef( null );
    const [ overloadWarn, setOverloadWarn ] = useState( false );
    const [ byVehicleType, setByVehicleType ] = useState( true );
    const bounds = useMemo( () => ({
        top: 10,
        left: 100,
        height: 370,
        width: 590
    }), []);

    useEffect( () => {

        if( !data ) return;

        const graph = d3.select( frame.current );

        const sumData = data.reduce( ( acc, CP ) => acc.addCounts( "Total", filterCounts( CP, display.filters ).getCounts( display.filters.direction ) ), new VehicleCounts() ).hierarchy;

        drawStacks( graph, bounds, display.view, setDisplay, {
            graphData: sumData,
            lastIndex: sumData.parent ? sumData.parent.children.indexOf( sumData ) : 0,
        })


    }, [data, display.filters, display.view, bounds, setDisplay])

    return (
        <div className="StreamGraph">
            {children}
            <svg className="StackedStream" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid" ref={frame}>
                <rect className="StackedStream_BG" x="0" y="0" width="100%" height="100%" fill="#0000"/>
                <text className="StackedStream_Title"></text>
                <g className="StackedStream_Legend" transform={`translate( ${bounds.left+bounds.width + 50}, 100 )`}/>
                <g className="StackedStream_Axes">
                    <g className="StackedStream_Axes--Left" transform={`translate( ${bounds.left}, 0 )`}/>
                    <g className="StackedStream_Axes--Bottom" transform={`translate( 0, ${bounds.height+bounds.top} )`}/>
                </g>
                <g className="StackedStream_Bars"/>
            </svg>
        </div>
    )
}

const drawStacks = ( graph, bounds, [ route, title ] , setDisplay, { graphData, lastIndex } ) => {

    //Navigation functions
    const drillDown = d => {

        d[0].data.children && setDisplay( { type: 'setView', payload: ["descent", d.key] } );

    }
    const goUp = d => {

        d3.event.preventDefault();
        graphData[0].parent && setDisplay( { type: 'setView', payload: ["ascent", graphData[0].parent.data.name] } );

    }

    console.log( graphData )

}

const calculateStacks = ( data, lastIndex ) => {
    //Calculates stacks based on data descendants, return array of subgroup names, stack data for plotting, and colour function
    let subgroups, stack, colour;

    if( data.length === 0 ){
        return {
            stackedData: [],
            subgroups: [],
            colour: () => {}
        }
    }

    if( data[0].children ){

        subgroups = data[0].children.map( child => child.data.name );

        stack = d3.stack()
            .keys( subgroups )
            .value( ( d, key ) => d.children.find( child => child.data.name === key ).value )

    } else{

        subgroups = [data[0].data.name];

        stack = d3.stack()
            .keys( subgroups )
            .value( ( d, key ) => d.value )

    }

    colour = d3.scaleOrdinal()
        .domain( subgroups )
        .range( d3.schemeCategory10 )

    return { stackedData: stack( data ), subgroups: subgroups, colour: colour }

}
