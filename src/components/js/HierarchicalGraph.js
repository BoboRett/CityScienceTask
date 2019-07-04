import React, { useEffect, useState, useRef, useMemo } from 'react';
import { filterCounts } from '../../logic/DataLogic.js';
import * as d3 from 'd3';
import '../css/HierarchicalGraph.scss';

export default function HierarchicalGraph({ children, data, display, setDisplay }){

    const frame = useRef( null );
    const [ overloadWarn, setOverloadWarn ] = useState( false );
    const bounds = useMemo( () => ({
        top: 0,
        left: 90,
        height: 370,
        width: 600
    }), []);

    useEffect( () => {

        if( !data ) return;

        const graph = d3.select( frame.current );

        setOverloadWarn( data.length > 100 );
        if( data.length > 100 ) return;

        drawStacks( graph, bounds, display.view, setDisplay,
            data.reduce( ( acc, CP ) => {

                const graphNode = filterCounts( CP, display.filters ).descendants().find( descendant => descendant.data.name === display.view[1] );

                acc.barLabels.push( CP.id );
                acc.graphData.push( graphNode );
                acc.lastIndex = acc.lastIndex === undefined ? ( graphNode.parent ? graphNode.parent.children.indexOf( graphNode ) : 0 ) : acc.lastIndex;
                acc.route = acc.route === undefined || display.view[0]

                return acc

            }, { barLabels: [], graphData: [], lastIndex: undefined })
        )


    }, [data, display.filters, display.view, bounds, setDisplay])

    useEffect( () => {

        if( display.hoveredCP ){

            d3.selectAll( `.StackedBar_Bars > g > rect:not([class="${display.hoveredCP}"])` )
                .transition( "fade" )
                .duration( 100 )
                .attr( "opacity", 0.2 )

        } else{

            d3.selectAll( `.StackedBar_Bars > g > rect` )
                .transition( "fade" )
                .duration( 50 )
                .attr( "opacity", 1 )

        }


    }, [ display.hoveredCP ])

    return (
        <div className="HierarchicalGraph">
            <div className={`HierarchicalGraph_overloadWarning${ overloadWarn ? " overload" : ""}`}>
                <p>
                    Phew, that's a lot of data...{data ? data.length : 0} count points to be exact!
                    <br/>
                    Try applying more filters
                </p>
            </div>
            {children}
            <svg className="StackedBar" viewBox="0 0 880 500" preserveAspectRatio="xMidYMid" ref={frame}>
                <rect className="StackedBar_BG" x="0" y="0" width="100%" height="100%" fill="#0000"/>
                <text className="StackedBar_Title"></text>
                <g className="StackedBar_Legend" transform="translate( 720, 100 )"/>
                <g className="StackedBar_Axes">
                    <g className="StackedBar_Axes--Left" transform={`translate( ${bounds.left}, 0 )`}/>
                    <g className="StackedBar_Axes--Bottom" transform={`translate( 0, ${bounds.height+bounds.top} )`}/>
                </g>
                <g className="StackedBar_Bars"/>
            </svg>
        </div>
    )
}

const drawStacks = ( graph, bounds, [ route, title ] , setDisplay, { barLabels, graphData, lastIndex } ) => {

    //Navigation functions
    const drillDown = d => {

            d[0].data.children && setDisplay( { type: 'setView', payload: ["descent", d.key] } );

    }
    const goUp = d => {

        d3.event.preventDefault();
        graphData[0].parent && setDisplay( { type: 'setView', payload: ["ascent", graphData[0].parent.data.name] } );

    }

    graph.select( ".StackedBar_BG" ).on( "contextmenu click", goUp );

    //Animations
    const t = d3.transition().duration( 500 );
    const t_fadeIn = selection => {
        selection
            .transition( "fade" )
            .duration( 50 )
            .attr( "opacity", 1 )
    }
    const t_fadeOut = selection => {
        selection
            .transition( "fade" )
            .duration( 100 )
            .attr( "opacity", 0.2 )
    }

    const { stackedData, subgroups, colour } = calculateStacks( graphData );
    const max = Math.max( ...graphData.map( datum => datum.value ) );

    //Scales
    const x = d3.scaleBand()
        .domain( barLabels )
        .range( [ bounds.left, bounds.width+bounds.left ] )
        .padding( [0.2] )

    const y = d3.scaleLinear()
        .domain( [ 0, max*1.1 ] )
        .range( [ bounds.height+bounds.top, bounds.top ] )

    //If descending, initial [y0, y1] of parent rects for transition
    const parentBounds = [];

    //--------------------
    //Stacks

    //Event handlers
    const onMove = function( d ){

        const activeEl = this;
        d3.selectAll( ".StackedBar_Bars > g" ).filter( function(){ return this !== activeEl } ).call( t_fadeOut );
        d3.selectAll( `.StackedBar_Legend > g:not([id="${d.key}"])` ).call( t_fadeOut );

    }
    const onOut = function(){

        const activeEl = this;
        d3.selectAll( ".StackedBar_Bars > g, .StackedBar_Legend > g" ).filter( function(){ return this !== activeEl } ).call( t_fadeIn );

    }

    //Add new stack groups
    graph.select( ".StackedBar_Bars" ).selectAll( "g" ).data( stackedData, d => d.key )
        .join(
            enter => {

                const newGs = enter.append( "g" )
                    .attr( "class", d => d.key )
                    .attr( "fill", d => colour( d.key ) )

                return newGs

            },
            update => update,
            exit => {

                if( route === "descent" ){
                    //If drilling down, parent group is replaced, so need to store dimensions before removal
                    exit
                        .filter( ( d, i ) => i === lastIndex )
                        .selectAll( "rect" )
                        .each( function(){ parentBounds.push( [ +d3.select( this ).attr( "y" ), +d3.select( this ).attr( "height" ) ] ) } )

                }

                exit.remove()

            }
        )
        .on( "mousemove", onMove )
        .on( "mouseout", onOut )
        .on( "click", drillDown )
        .on( "contextmenu", goUp )
        //NEW RECTS
        .selectAll( "rect" ).data( d => d )
            .join(
                enter => {

                    enter = enter.append( "rect" );

                    //Use stored parent rect dimensions for smooth transition in descendant rects
                    if( route === "descent" ){

                        enter
                            .each( function( d, i ){

                                const tmpmax = Math.max( ...stackedData.map( series => series[i][1] ) );

                                const tmp_y = d3.scaleLinear()
                                    .domain( [ 0, tmpmax ] )
                                    .range( [ parentBounds[i][0] + parentBounds[i][1], parentBounds[i][0] ] )

                                d3.select( this )
                                    .attr( "y", tmp_y( d[1] ) )
                                    .attr( "height", tmp_y( d[0] ) - tmp_y( d[1] ) )

                            })

                    } else {

                        enter
                            .attr( "y", d => y( d[1] ) )
                            .attr( "height", 0 )

                    }

                    return enter

                }
            )
            .attr( "class", ( d, i ) => d.data.data.parent.id )
            .attr( "x", ( d, i ) => x( barLabels[i] ) )
            .attr( "width", x.bandwidth() )
            .transition( t )
            .attr( "y", d => y( d[1] ) )
            .attr( "height", d => y( d[0] ) - y( d[1] ) )


    //Update legend
    drawLegend( graph, {
        title: title,
        seriesLabels: subgroups.map( ( group, i ) => ({ label: group, colour: colour( group ) }) ).reverse()
    })

    //Update Axes
    drawAxes( graph, x, y );

}

const drawLegend = ( graph, { title, seriesLabels } ) => {
    //Draws linked legend with input event handlers
    //Animations
    const t_slideIn = function( selection ){

        selection
            .attr( "x", 100 )
            .attr( "opacity", 0 )
            .transition( "fade" )
            .duration( 200 )
            .attr( "x", 0 )
            .attr( "opacity", 1 )

    }

    //Event Handlers
    const triggerEvent = ( d, event ) => {
        d3.select( `[class="${d.label}"]` )
            .each( function( d, i ){
                d3.select( this ).on( event ).apply( this, [ d, i ] )
            })
    }
    const onMove = d => triggerEvent( d, "mousemove" );
    const onOut = d => triggerEvent( d, "mouseout" );
    const onClick = d => triggerEvent( d, "click" );
    const onContext = d => triggerEvent( d, "contextmenu" );

    //Enter, update, exit
    graph.select( ".StackedBar_Legend" ).selectAll( "g" ).data( seriesLabels, d => d.label ).join(
        enter => {

            const grp = enter.append( "g" )
                .attr( "class", "legend_entry" )
                .attr( "id", d => d.label )
                .attr( "transform", ( d, i ) => `translate( 0, ${i*25} )` )
                .on( "mousemove", onMove )
                .on( "mouseout", onOut )
                .on( "click", onClick )
                .on( "contextmenu", onContext )

            grp.append( "circle" )
                .attr( "cx", "-12" )
                .attr( "cy", -6 )
                .attr( "r", 10 )
                .attr( "fill", d => d.colour )
                .call( t_slideIn )

            grp.append( "text" )
                .text( d => d.label )
                .attr( "fill", d => d.colour )
                .call( t_slideIn )

        },
        update => {},
        exit => { exit.remove() }
    )

}

const drawAxes = ( graph, x, y ) => {
    //Draws axes on graph, smooth transitions
    const frame = graph.select( ".StackedBar_Axes" )

    frame.select( ".StackedBar_Axes--Left" )
        .transition()
        .call( d3.axisLeft( y ).tickSize( -600 ) )

    frame.select( ".StackedBar_Axes--Bottom" )
        .transition()
        .call( d3.axisBottom( x ).tickPadding([0]).tickSizeOuter([0]) )
        .selectAll( "text" )
        .attr( "y", 0 )
        .attr( "dx", -9 )

    frame.select( ".StackedBar_Axes--Bottom" )
        .selectAll( ".tick > text" )
        .attr( "transform", "rotate(-45)" )


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
