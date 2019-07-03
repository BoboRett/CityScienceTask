import React, { useRef, useState, useEffect } from 'react';
import { useSpring, animated, config } from 'react-spring';
import * as d3 from 'd3';
import '../css/LoadScreen.scss';

export const LoadScreen = ({loading}) => {

    const props = useSpring( { from:{ opacity: loading ? 0 : 1 }, opacity: loading ? 1 : 0, delay: 1000 } );
    const carRef = useRef( null );

    useEffect( () => {

        if( !carRef.current ) return;

        const car = d3.select( carRef.current );
        console.log( car );
        (function wheelRotation(){

            car.selectAll( "#load_car_wheel" )
            .attr( "transform", "rotate(0)" )
            .transition()
            .duration( 500 )
            .ease( d3.easeLinear )
            .attr( "transform", "rotate(180)" )
            .on( "end", wheelRotation )

        })();

        (function carBob(){

            car.selectAll( "#load_car" )
                .attr( "transform", "translate( 160, 195 )" )
                .transition()
                .attr( "transform", "translate( 160, 193 )" )
                .on( "end", carBob )

        })();

        function smoke(){

            car.selectAll( "#load_car" )
                .append( "circle" )
                .attr( "id", "load_car_smoke" )
                .attr( "cx", 10 )
                .attr( "cy", 0 )
                .attr( "r", 5 )
                .attr( "opacity", 1 )
                .transition()
                .duration( 1000 )
                .attr( "cx", -50*Math.random() - 50 )
                .attr( "cy", -30*Math.random() - 30 )
                .attr( "r", 50 )
                .attr( "opacity", 0 )
                .remove()

        };

        const smokeInterval = setInterval( smoke, 200 );

        return () => clearInterval( smokeInterval );

    }, [carRef] );

    return (
        <animated.div className="loadScreen" style={props}>
            <svg viewBox="0 0 600 300" ref={carRef}>
                <g id="load_progress">
                    <g id="load_car">
                        <path d="M5 -10 q 0 -15 -2 -27 q 5 -4 44 -5 q 7 -1 5 -5 l -5 -17 q 90 -10 110 0 q 3 0 15 20 l 70 10 q 5 5 0 20 q 8 5 2 16 h -13 a 24 24 0 0 0 -48 3 h -105 a 23 23 0 0 0 -46 -6 q -15 0 -20 -4 Z"/>
                        <g id="load_car_windows">
                            <path d="M 60 -60 q 30 -2 41 -3 v 19 h -20 q -15 0 -22 -15 Z"/>
                            <path d="M 107 -63 q 35 -1 40 2 q 2 0 6 5 l 9 13 l -54 -1 Z"/>
                        </g>
                        <path d="M 9 -38 q 3 3 5 10 h 180 q 43 2 46 -6" fill="none" stroke="silver"/>
                    </g>
                    <g id="load_car_wheels" transform="translate(215.5,193)">
                        <g id="load_car_wheel">
                            <circle r="18" id="load_car_wheel_outer"/>
                            <circle r="10" id="load_car_wheel_inner" fill="grey"/>
                            <path d="M -10 0 h 20 M 0 -10 v 20"/>
                            <path d="M -8 0 h 16 M 0 -8 v 16" transform="rotate(45)"/>
                        </g>
                        <use href="#load_car_wheel" transform="translate(151,0)"/>
                    </g>
                </g>
                <g id="load_road">
                    <rect x="0" y="70%" width="100%" height="2%"/>
                </g>
            </svg>
            <h1>Loading data...</h1>
        </animated.div>
    )

}
