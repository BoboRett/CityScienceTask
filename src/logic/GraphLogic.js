import * as d3 from 'd3';

//Animations
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

//Mouse Event handlers
const onMouseMove = function( d ){

    d3.selectAll( `.Graph .Data > *:not([class="${d.key}"])` ).call( t_fadeOut );
    d3.selectAll( `.Graph .Legend > g:not([id="${d.key}"])` ).call( t_fadeOut );

}
const onMouseOut = function(){

    d3.selectAll( ".Graph .Data > *, .Graph .Legend > g" ).call( t_fadeIn );

}

const triggerEvent = ( d, event ) => {
    d3.select( `[class="${d.label}"]` )
        .each( function( d, i ){
            d3.select( this ).on( event ).apply( this, [d, i] )
        })
}

const colours = ["#527243", "#E6BD40", "#4B8783", "#CF8576", "#C1C4E3", "#A078F4"];

export const drawLegend = ( frame, { title, seriesLabels } ) => {
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
    const onMouseMove = d => triggerEvent( d, "mousemove" );
    const onMouseOut = d => triggerEvent( d, "mouseout" );
    const onClick = d => triggerEvent( d, "click" );
    const onContext = d => triggerEvent( d, "contextmenu" );

    //Enter, update, exit
    frame.selectAll( "g" ).data( seriesLabels, d => d.label ).join(
        enter => {

            const grp = enter.append( "g" )
                .attr( "class", "legend_entry" )
                .attr( "id", d => d.label )
                .attr( "transform", ( d, i ) => `translate( 0, ${i*25} )` )
                .on( "mousemove", onMouseMove )
                .on( "mouseout", onMouseOut )
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

        }
    )

}

export const drawAxes = ( frame, x, y, hoverable, setDisplay ) => {
    //Draws axes on graph, smooth transitions

    y && frame.select( ".LeftAxis" )
        .transition()
        .call( d3.axisLeft( y ).tickSize( -600 ) )

    x && frame.select( ".BottomAxis" )
        .transition()
        .call( d3.axisBottom( x ).tickPadding([0]).tickSizeOuter([0]).tickFormat( d3.format( "d" ) ) )

    frame.select( ".BottomAxis" )
        .selectAll( "text" )
        .attr( "y", 0 )
        .attr( "dx", -9 )
        .on( "mouseover", ( d, i ) => hoverable && setDisplay( { type: 'setHoveredCP', payload: x.domain()[i] } ) )
        .on( "mouseout", ( d, i ) => hoverable && setDisplay( 'clearHoveredCP' ) )

    frame.select( ".BottomAxis" )
        .selectAll( ".tick > text" )
        .attr( "transform", "rotate(-45)" )


}

export const calculateStacks = ( data, offset = d3.stackOffsetNone ) => {
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
            .offset( offset )
            .value( ( d, key ) => d.children.find( child => child.data.name === key ).data.total )

    } else{

        subgroups = [data[0].data.name];

        stack = d3.stack()
            .keys( subgroups )
            .offset( offset )
            .value( ( d, key ) => d.data.total )

    }
    colour = d3.scaleOrdinal()
        .domain( subgroups )
        .range( colours )

    return { stackedData: stack( data ), subgroups: subgroups, colour: colour }

}

export const drawStackedBars = ( graph, bounds, [ route, title ] , setDisplay, { barLabels, graphData, lastIndex } ) => {

    //Navigation functions
    const drillDown = d => {

        d[0].data.children && setDisplay( { type: 'setView', payload: ["descent", d.key] } );

    }
    const goUp = d => {

        d3.event.preventDefault();
        graphData[0].parent && setDisplay( { type: 'setView', payload: ["ascent", graphData[0].parent.data.name] } );

    }

    graph.select( ".BG" ).on( "contextmenu click", goUp );

    const { stackedData, subgroups, colour } = calculateStacks( graphData );
    const max = Math.max( ...graphData.map( datum => datum.data.total ) );

    //Scales
    const x = d3.scaleBand()
        .domain( barLabels )
        .range( [ bounds.left, bounds.width+bounds.left ] )
        .padding( [0.2] )

    const y = d3.scaleLinear()
        .domain( [ 0, max ] )
        .range( [ bounds.height+bounds.top, bounds.top ] )
        .nice()

    //If descending, initial [y0, y1] of parent rects for transition
    const parentBounds = [];

    //--------------------
    //Stacks

    //Add new stack groups
    graph.select( ".Data" ).selectAll( "g" ).data( stackedData, d => d.key )
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
        .on( "mousemove", onMouseMove )
        .on( "mouseout", onMouseOut )
        .on( "click", drillDown )
        .on( "contextmenu", goUp )
        //NEW RECTS
        .selectAll( "rect" ).data( d => d )
            .join(
                enter => {

                    enter = enter.append( "rect" );

                    //Use stored parent rect dimensions for smooth transition in descendant rects
                    if( route === "descent" && parentBounds[0] ){

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
            .attr( "class", ( d, i ) => d.data.data.CP.id )
            .attr( "x", ( d, i ) => x( barLabels[i] ) )
            .attr( "width", x.bandwidth() )
            .transition( "rectUpdate" )
            .duration( 500 )
            .attr( "y", d => y( d[1] ) )
            .attr( "height", d => y( d[0] ) - y( d[1] ) )


    //Update legend
    drawLegend( graph.select( ".Legend" ), {
        title: title,
        seriesLabels: subgroups.map( ( group, i ) => ({ label: group, colour: colour( group ) }) ).reverse()
    })

    //Update Axes
    drawAxes( graph.select( ".Axes" ), x, y, true, setDisplay );

}

export const drawAreaStacks = ( graph, bounds, [ route, title ] , setDisplay, { xLabels, graphData, lastIndex } ) => {

    //Navigation functions
    const drillDown = d => {

        d[0].data.children && setDisplay( { type: 'setView', payload: ["descent", d.key] } );

    }
    const goUp = d => {

        d3.event.preventDefault();
        graphData[0].parent && setDisplay( { type: 'setView', payload: ["ascent", graphData[0].parent.data.name] } );

    }

    graph.select( ".BG" ).on( "contextmenu click", goUp );

    const { stackedData, subgroups, colour } = calculateStacks( graphData );
    const max = Math.max( ...graphData.map( datum => datum.data.total ) );

    //Scales
    const x = d3.scaleLinear()
        .domain( [2000, 2018] )
        .range( [bounds.left, bounds.width+bounds.left] )

    x.clamp( true );

    const y = d3.scaleLinear()
        .domain( [0, max] )
        .nice()
        .range( [bounds.height+bounds.top, bounds.top] )

    //Cursor
    graph.on( "mousemove.cursor", function(){

        const x0 = Math.round( x.invert( d3.mouse(this)[0] ) );
        const data = graphData[0].children ? graphData[x0-2000].children.map( child => child.data.total ) : [graphData[x0-2000].data.total] ;

        graph.select( ".Cursor > line" )
            .attr( "x1", x( x0 ) )
            .attr( "x2", x( x0 ) )

        graph.select( ".Cursor_title" ).text( x0 );

        graph.select( ".Cursor > g" ).selectAll( "text" ).data( subgroups )
            .join( "text" )
            .attr( "y", ( d, i ) => i*25 )
            .text( ( d, i ) => d + ": " + data[i] )

    });

    //Draw areas
    graph.select( ".Data" ).selectAll( "path" )
        .data( stackedData, d => d.key )
        .join(
            enter => {
                const newAreas = enter.append( "path" )
                    .attr( "class", d => d.key )
                    .style( "fill", d => colour( d.key ) )

                return newAreas
            }
        )
        .on( "mousemove", onMouseMove )
        .on( "mouseout", onMouseOut )
        .on( "click", drillDown )
        .on( "contextmenu", goUp )
        .transition()
        .duration( 500 )
        .attr( "d",
            d3.area()
                .curve( d3.curveMonotoneX )
                .x( ( d, i ) => x( xLabels[i] ) )
                .y0( d => y( d[0] ) )
                .y1( d => y( d[1] ) )
        )


    drawAxes( graph.select( ".Axes" ), x, y );

    drawLegend( graph.select( ".Legend" ), { title: "", seriesLabels: subgroups.map( ( group, i ) => ({ label: group, colour: colour( group ) }) ).reverse() } );

}
