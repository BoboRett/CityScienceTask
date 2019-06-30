import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGesture } from 'react-use-gesture';
import Mapbox from './components/js/Mapbox.js';
import HierarchicalGraph from './components/js/HierarchicalGraph.js';
import { parseData } from './components/js/DataLogic.js';
import { useSpring, animated, config } from 'react-spring';
import { Spring } from 'react-spring/renderprops';
import * as d3 from 'd3';
import './App.scss';

export default function App() {

    const [ data, setData ] = useState( null );
    const [ currentCP, setCP ] = useState( null );
    const [ hoveredCP, setHoveredCP ] = useState( null );
    const [ currentYear, setYear ] = useState( 2000 );

    useEffect( () => {

        d3.json( './devon.json' )
            .then( result => {
                    const newData = parseData( result );
                    setData( newData );
                    setYear( 2000 );
                    setCP( null )//Object.values( newData )[0] );
                }
            )

    }, [] )

    const memoMap = useCallback( <Mapbox data={data} setHoveredCP={setHoveredCP} setCP={setCP}/>, [data] );

    return (
        <div className="App">
            <header className="App_header">
                <h1>Devon Annual Average Daily Flows (AADFs)</h1>
            </header>
            <div className="App_frames">
                <AppFrame vspan={2}>
                    {memoMap}
                </AppFrame>
                <AppFrame>
                    <HierarchicalGraph data={data} currentCP={currentCP} currentYear={currentYear} setHoveredCP={setHoveredCP}/>
                </AppFrame>
                <AppFrame>
                    <Readout data={data}/>
                </AppFrame>
            </div>
        </div>
    );
}

const AppFrame = ({ children, vspan = 1, hspan = 1 }) => {

    const [ width, setWidth ] = useState( 50 );
    const [ maximised, _setMaximised ] = useState( false );
    const [ style, setStyle ] = useSpring( () => ({ left: 0, top: 0, position: "absolute", config: config.stiff }) );

    const onResize = () => {
        setWidth( window.innerWidth < 800 ? 100 : 50 );
    }

    const childrenRef = useRef( null )

    useEffect( () => {
        window.addEventListener( "resize", onResize );
        return () => window.removeEventListener( "resize", onResize )
    }, [] )

    const setMaximised = val => {

        _setMaximised( val );
        const { left, top } = childrenRef.current.parentNode.getBoundingClientRect();
        console.log( val )
        setStyle({
            from:{
                left: val ? left : 0,
                top: val ? top : 0,
                position: "fixed"
            },
            to: {
                left: val ? 0 : left,
                top: val ? 0 : top,
            },
            onRest: () => style.position.value = val ? "fixed" : "absolute"

        })



    }

    return (
        <div className="App_frame" style={{minWidth: "400px", height: 50*vspan + "%", width: width + "%"}}>
            <div id="layoutPlaceholder" style={{width: "100%", height: "100%"}}/>
            <animated.div ref={childrenRef} className={`App_frame_children${ maximised ? ' fullscreen' : ''}`} style={style}>
                {children}
            </animated.div>
            <MaximiseButton maximised={maximised} setMaximised={setMaximised}/>
        </div>
    )
}

const MaximiseButton = ({ maximised, setMaximised }) => {

    const [ blend, setBlend ] = useState( 0 );
    const path = useRef( null );

    const bind = useGesture( {
        onHover: ({hovering}) => { setBlend( hovering ? 1 : 0 ) },
        onDragStart: () => setMaximised( !maximised )
    })

    const pathInterp = useCallback(
        d3.interpolateString( `
            M -10 0
            L 0 0
            L 0 10
            M 0 10
            L 0 0
            L 10 0
            M 10 0
            L 0 0
            L 0 -10
            M 0 -10
            L 0 0
            L -10 0
            `,
            `
            M -10 2
            L -10 10
            L -2 10
            M 2 10
            L 10 10
            L 10 2
            M 10 -2
            L 10 -10
            L 2 -10
            M -2 -10
            L -10 -10
            L -10 -2
        `)
    , [] )

    return (
        <div className="Maximise_Button">
            <svg viewBox="0 0 30 30">
                <rect x="0" y="0" width="100%" height="100%" {...bind()}/>
                <Spring from={{ t: blend === 0 ? 1 : 0 }} to={{ t: blend }} config={{ tension: 360, friction: 24 }}>
                    {({ t }) => <path ref={path} d={pathInterp( t )} transform="translate(15,15)"/>}
                </Spring>
            </svg>
        </div>
    )

}

const Readout = ({ data }) => {

    useEffect( () => {
    }, [data])

    return (
        <div className="Readout">

        </div>
    )
}
