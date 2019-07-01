import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

const HierarchicalGraph = ({ data, currentCP, currentYear }) => {

    const frame = useRef( null );
    const bounds = useMemo( () => ({
        top: 20,
        left: 70,
        height: 450,
        width: 800
    }), []);

    useEffect( () => {

        if( !data ) return;

        const graph = d3.select( frame.current );
        const graphData = !currentCP ? Object.values( data ).map( datum => datum.counts[currentYear] ) : Object.values( currentCP.counts );


        drawStacks( graph, bounds, {
            barLabels: currentCP ? Object.keys( currentCP.counts ).map( year => "'" + year.slice( -2 ) ) : graphData.map( datum => datum.parent.start_junction.value + "-" + datum.parent.end_junction.value ),
            graphData: graphData.map( datum => datum.vehicle_counts )
        })

    }, [data, currentCP, currentYear, bounds])

    return (
        <div className="HierarchicalGraph">
            <svg className="StackedBar" viewBox="0 0 880 500" preserveAspectRatio="xMinYMin" ref={frame}>
                <rect className="StackedBar_BG" x="0" y="0" width="100%" height="100%" fill="#0000"/>
                <g className="StackedBar_Legend" transform="translate( 760, 100 )"/>
                <g className="StackedBar_Axes">
                    <g className="StackedBar_Axes--Left" transform={`translate( ${bounds.left}, 0 )`}/>
                    <g className="StackedBar_Axes--Bottom" transform={`translate( 0, ${bounds.height+bounds.top} )`}/>
                </g>
                <g className="StackedBar_Bars"/>
            </svg>
        </div>
    )
}


export default HierarchicalGraph;


const drawStacks = ( graph, bounds, { barLabels, graphData, lastIndex, route } ) => {

    //Navigation functions
    const drillDown = d => {

        if( d[0].data.children ){

            drawStacks( graph, bounds, {
                barLabels: barLabels,
                graphData: graphData.map( datum => datum.children.find( child => child.data.name === d.key ) ),
                lastIndex: d.index,
                route: "descent",
            })

        }

    }

    const goUp = d => {

        d3.event.preventDefault();

        if( graphData[0].parent ){

            drawStacks( graph, bounds, {
                barLabels: barLabels,
                graphData: graphData.map( datum => datum.parent ),
                lastIndex: d ? d.index : 0,
                route: "ascent"
            })

        }

    }

    graph.select( ".StackedBar_BG" ).on( "contextmenu click", goUp );

    //Animations
    const t = d3.transition()
        .duration( 500 )
    const t_fadeIn = selection => {
        selection
            .transition()
            .duration( 50 )
            .attr( "opacity", 1 )
    }
    const t_fadeOut = selection => {
        selection
            .transition()
            .duration( 100 )
            .attr( "opacity", 0.2 )
    }

    const { stackedData, subgroups, colour } = calculateStacks( graphData, lastIndex );
    const max = Math.max( ...graphData.map( datum => datum.value ) );

    //Scales
    const x = d3.scaleBand()
        .domain( barLabels )
        .range( [ bounds.left, bounds.width-bounds.left ] )
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
        d3.selectAll( ".current > g" ).filter( function(){ return this !== activeEl } ).call( t_fadeOut );

        d.key !== "value" && d3.selectAll( ".StackedBar_Legend > g" ).call( t_fadeOut );
        d3.select( `.StackedBar_Legend > [id="${d.key}"]` ).call( t_fadeIn );

    }
    const onOut = function(){

        const activeEl = this;
        d3.selectAll( ".current > g, .StackedBar_Legend > g" ).filter( function(){ return this !== activeEl } ).call( t_fadeIn );

    }

    //Clean up old groups if traversing quickly
    graph.selectAll( ".StackedBar_Bars > .last" ).remove();

    //Transition out old groups
    graph.select( ".current" ).attr( "class", "last" ).selectAll( "g" )
        .each( function( _d, i ){

            if( route === "descent" ){

                if( i === lastIndex ){

                    d3.select( this ).selectAll( "rect" )
                        .each( function( d ){ parentBounds.push( [ +d3.select( this ).attr( "y" ), +d3.select( this ).attr( "height" ) ] ) } )
                        .attr( "opacity", 0 )

                } else{

                    d3.select( this ).selectAll( "rect" )
                        .transition( t )
                        .attr( "y", d => i > lastIndex ? y( max*2 ) : y( -max ) )
                        .attr( "opacity", 0 )

                }

            } else if( route === "ascent" ){

                //When ascending, must determine position in parent's children for transition
                let indexInParent = stackedData.find( datum => datum.key === _d[0].data.data.name || datum.key === _d.key );

                if( !indexInParent ) return;

                indexInParent = indexInParent.index;

                d3.select( this ).selectAll( "rect" )
                    .transition( t )
                    .attr( "y", ( d, j ) => y( stackedData[indexInParent][j][1] - d[0] ) )
                    .attr( "height", d => y( d[0] ) - y( d[1] ) )
                    .attr( "opacity", 0 )

            } else{

                d3.select( this ).selectAll( "rect" )
                    .transition( t )
                    .attr( "y", 0 )
                    .attr( "height", 0 )
                    .attr( "opacity", 0 )

            }

        })

    setTimeout( () => graph.selectAll( ".last" ).remove(), 500 );

    //Add new stack groups
    graph.select( ".StackedBar_Bars" ).append( "g" ).attr( "class", "current" ).selectAll( "g" ).data( stackedData )
        .join( "g" )
            .attr( "class", d => d.key )
            .attr( "fill", d => colour( d.index ) )
            .on( "mousemove", onMove )
            .on( "mouseout", onOut )
            .on( "click", drillDown )
            .on( "contextmenu", goUp )

    //Bars
    const newStacks = graph.selectAll( ".StackedBar_Bars > g.current > g" ).selectAll( "rect" ).data( d => d )
        .join( "rect" )
            .attr( "x", ( d, i ) => x( barLabels[i] ) )
            .attr( "width", x.bandwidth() )
            .attr( "opacity", 1 )
            .attr( "y", ( d, i ) => y( 0 ) )

    //If descending, use parent rect for initial dimensions for transition
    if( route === "descent" ){

        newStacks
            .each( function( d, i ){

                //Get column max value for scale
                const tmpmax = Math.max( ...stackedData.map( series => series[i][1] ) );

                const tmp_y = d3.scaleLinear()
                    .domain( [ 0, tmpmax ] )
                    .range( [ parentBounds[i][0] + parentBounds[i][1], parentBounds[i][0] ] )

                d3.select( this )
                    .attr( "y", tmp_y( d[1] ) )
                    .attr( "height", tmp_y( d[0] ) - tmp_y( d[1] ) )

            })

    }

    newStacks
        .transition( t )
        .attr( "y", d => y( d[1] ) )
        .attr( "height", d => y( d[0] ) - y( d[1] ) )


    //Update legend
    drawLegend( graph, {
        seriesLabels: subgroups.map( ( group, i ) => ({ label: group, colour: colour( i ) }) ).reverse()
    })

    //Update Axes
    drawAxes( graph, x, y );

}

const drawLegend = ( graph, { seriesLabels } ) => {

    const frame = graph.select( ".StackedBar_Legend" );

    //Animations
    const t = d3.transition().duration( 200 )
    const t_slideIn = function( selection ){

        selection
            .attr( "x", 100 )
            .attr( "opacity", 0 )
            .transition( t )
            .attr( "x", 0 )
            .attr( "opacity", 1 )

    }
    const t_slideOut = function( selection ){

        selection
            .attr( "x", 0 )
            .attr( "opacity", 1 )
            .transition( t )
            .attr( "x", 100 )
            .attr( "opacity", 0 )
            .on( "end", () => selection.remove() )

    }

    //Event Handlers
    const triggerEvent = ( d, event ) => {
        d3.select( d3.selectAll( ".StackedBar_Legend > g" ).size() === 1 ? ".value" : `.current > [class="${d.label}"]` )
            .each( function( d, i ){
                d3.select( this ).on( event ).apply( this, [ d, i ] )
            })
    }
    const onMove = d => triggerEvent( d, "mousemove" );
    const onOut = d => triggerEvent( d, "mouseout" );
    const onClick = d => triggerEvent( d, "click" );
    const onContext = d => triggerEvent( d, "contextmenu" );

    //Enter, update, exit
    frame.selectAll( "g" ).data( seriesLabels, d => d.label ).join(
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
        update => {

            update.selectAll( "g" )
                .transition( t )
                .attr( "transform", ( d, i ) => `translate( 0, ${i*25} )` )

            update.select( "text" ).call( t_slideOut )

            update.append( "text" )
                .text( d => d.label )
                .attr( "fill", d => d.colour )
                .call( t_slideIn )

            update.select( "circle" )
                .call( t_slideIn )
                .transition( t )
                .attr( "fill", d => d.colour )

        },
        exit => {
            exit
                .selectAll( "text, circle" )
                .call( t_slideOut )
                .transition( t )
                .on( "end", () => exit.remove() )
        }
    )

}

const drawAxes = ( graph, x, y ) => {

    const frame = graph.select( ".StackedBar_Axes" )

    frame.select( ".StackedBar_Axes--Left" )
        .transition()
        .call( d3.axisLeft( y ).tickSize( -660 ) )

    frame.select( ".StackedBar_Axes--Bottom" )
        .transition()
        .call( d3.axisBottom( x ) )

}

const calculateStacks = ( data, lastIndex ) => {

    //Calculates stacks based on data descendants
    let subgroups, stack, colour;

    if( data[0].children ){

        subgroups = data[0].children.map( child => child.data.name );

        stack = d3.stack()
            .keys( subgroups )
            .value( ( d, key ) => d.children.find( child => child.data.name === key ).value )

        colour = d3.scaleOrdinal()
            .domain( d3.range( subgroups.length ) )
            .range( d3.schemeCategory10 )

    } else{

        subgroups = [data[0].data.name];

        stack = d3.stack()
            .keys( ["value"] )
            .value( ( d, key ) => d.value )

        colour = () => d3.schemeCategory10[lastIndex];

    }

    return { stackedData: stack( data ), subgroups: subgroups, colour: colour }

}
