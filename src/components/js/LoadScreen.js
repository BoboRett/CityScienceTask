import React, { useRef, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';
import * as d3 from 'd3';
import '../css/LoadScreen.scss';

export const LoadScreen = ({loading}) => {

    const props = useSpring( { from:{ opacity: loading ? 0 : 1 }, opacity: loading ? 1 : 0, delay: 1000 } );
    const carRef = useRef( null );

    useEffect( () => {

        if( !carRef.current ) return;

        const car = d3.select( carRef.current );

        (function wheelRotation(){

            if( props.opacity.value === 0 ) return;

            car.selectAll( "#load_car_wheel" )
                .attr( "transform", "rotate(0)" )
                .transition()
                .duration( 500 )
                .ease( d3.easeLinear )
                .attr( "transform", "rotate(180)" )
                .on( "end", wheelRotation )

        })();

        (function carBob(){

            if( props.opacity.value === 0 ) return;

            car.selectAll( "#load_car" )
                .attr( "transform", "translate( 160, 195 )" )
                .transition()
                .attr( "transform", "translate( 160, 193 )" )
                .on( "end", carBob )

        })();

        (function smoke(){

            if( props.opacity.value === 0 ) return;

            car.selectAll( "#load_car" )
                .transition( "smokeLoop" )
                .duration( 200 )
                .on( "end", smoke )

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

        })();

        function bushSlide(){

            if( props.opacity.value === 0 ) return;

            d3.select( this )
                .attr( "transform", "translate(700, 210)")
                .transition()
                .ease( d3.easeLinear )
                .duration( 4000*Math.random() + 2000 )
                .attr( "transform", "translate(-100, 210)")
                .on( "end", () => bushSlide.bind( this )() )

        }

        car.selectAll( "#load_bush > g" )
            .each( bushSlide )

    });

    return (
        <animated.div className="loadScreen" style={props}>
            <svg viewBox="0 0 600 214" ref={carRef}>
                <g id="load_road">
                    <rect x="0" y="210" width="100%" height="2%"/>
                    <g id="load_bush">
                        <g id="load_bush--1" transform="translate(50,210)">
                            <path d="M 0 0 a 30 30 0 0 1 0 -50 a 30 30 0 0 1 45 -10 v 60 Z" fill="#4CA134"/>
                            <path d="M 44 -60 a 30 30 0 0 1 30 15 a 30 30 0 0 1 10 45 h -40 Z" fill="#77BC1F"/>
                        </g>
                        <g id="load_bush--2" transform="translate(400,210)">
                            <path d="M 0 0 a 40 40 0 0 1 20 -50 a 40 40 0 0 1 40 -30 v 80 Z" fill="#7C8F29"/>
                            <path d="M 59 -80 a 40 40 0 0 1 30 50 a 40 40 0 0 1 10 30 h -39 Z" fill="#9BB53F"/>
                        </g>
                    </g>
                    <g id="load_cloud">
                        <line id="load_cloud--1" x1="200" x2="400" y1="30" y2="30"/>
                        <line id="load_cloud--2" x1="240" x2="500" y1="40" y2="40"/>
                    </g>
                </g>
                <g id="load_car_wheels" transform="translate(223,193)">
                    <g id="load_car_wheel">
                        <circle r="18" id="load_car_wheel_outer"/>
                        <circle r="10" id="load_car_wheel_inner"/>
                        <path d="M -10 0 h 20 M 0 -10 v 20"/>
                        <path d="M -8 0 h 16 M 0 -8 v 16" transform="rotate(45)"/>
                    </g>
                    <use href="#load_car_wheel" transform="translate(144,0)"/>
                </g>
                <g id="load_car">
                    <path d={`M10-10
                            q 5 -10 0 -27
                            l 42 -3
                            q 7 -1 5 -5 l -3 -17
                            q 55 -10 105 -5
                            q 3 0 17 25
                            l 63 5
                            q 5 5 0 20
                            q 8 5 2 16
                            h -13
                            a 22 22 0 1 0 -42 10
                            h -105
                            a 20 20 0 1 0 -38 -6
                            q -15 0 -20 -4
                            Z`}/>
                    <g id="load_car_windows">
                        <path d="M 67 -52 q -3 -4 4 -6 q 20 -3 30 -4 q 6 0 5 8 v 8 q 0 6 -5 6 h -20 q -5 0 -12 -10 Z" />
                        <path d="M 120 -62.5 l 28 0 v 22 h -33 q -2 0 -4 -5 v -13 q 0 -4 5 -4 Z"/>
                        <path d="M 148 -62.5 q 4 0 6 4 l 8 11 q 5 6 -1 7 h -13"/>
                    </g>
                    <path d="M 13 -19 q 20 -3 100 -5 q 100 -1 118 -2 l 8 -10" fill="none" stroke="silver"/>
                </g>

            </svg>
            <h1>Loading data...</h1>
        </animated.div>
    )

}
