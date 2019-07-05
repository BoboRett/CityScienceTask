import React, { useEffect, useState, useRef, useMemo } from 'react';
import { filterCounts } from '../../logic/DataLogic.js';
import { drawStackedBars } from '../../logic/GraphLogic.js';
import * as d3 from 'd3';
import '../css/Graphs.scss';

export default function HierarchicalGraph({ children, data, display, setDisplay }){

    const frame = useRef( null );
    const [ overloadWarn, setOverloadWarn ] = useState( false );
    const bounds = useMemo( () => ({
        top: 20,
        left: 110,
        height: 360,
        width: 590
    }), []);

    useEffect( () => {

        if( !data ) return;

        const graph = d3.select( frame.current );

        setOverloadWarn( data.length > 25 );
        if( data.length > 25 ){

            graph.selectAll( ".StackedBar > .Data > g" ).remove();
            return;
        }

        drawStackedBars( graph, bounds, display.view, setDisplay,
            data.reduce( ( acc, CP ) => {

                const graphNode = filterCounts( CP, display.filters ).hierarchy.descendants().find( descendant => descendant.data.name === display.view[1] );

                acc.barLabels.push( CP.id );
                acc.graphData.push( graphNode );
                acc.lastIndex = acc.lastIndex === undefined ? ( graphNode.parent ? graphNode.parent.children.indexOf( graphNode ) : 0 ) : acc.lastIndex;

                return acc

            }, { barLabels: [], graphData: [], lastIndex: undefined })
        )


    }, [data, display.filters, display.view, bounds, setDisplay])

    return (
        <div className="Graph HierarchicalGraph">
            <div className={`OverloadWarning${overloadWarn ? " overload" : ""}`}>
                <p>
                    Phew, that's a lot of data...{data ? data.length : 0} Count Points to be exact!
                    <br/>
                    Try applying more filters
                </p>
            </div>
            {children}
            <svg className="StackedBar" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid" ref={frame}>
                <rect className="BG" x="0" y="0" width="100%" height="100%" fill="#0000"/>
                <text className="Title" transform={`translate(${bounds.left+bounds.width/2})`}>Filtered Count Points Overview</text>
                <g className="Legend" transform={`translate( ${bounds.left+bounds.width + 40}, 100 )`}/>
                <g className="Axes">
                    <text transform={`translate(25,${bounds.top+bounds.height/2})rotate(-90)`}>Total Vehicles</text>
                    <text transform={`translate(${bounds.left+bounds.width/2},${bounds.top+bounds.height+80})`}>Count Point ID</text>
                    <g className="LeftAxis" transform={`translate( ${bounds.left}, 0 )`}/>
                    <g className="BottomAxis" transform={`translate( 0, ${bounds.height+bounds.top} )`}/>
                </g>
                <g className="Data"/>
            </svg>
        </div>
    )
}
