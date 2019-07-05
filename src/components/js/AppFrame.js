import React, { useState, useCallback, useRef } from 'react';
import { Spring } from 'react-spring/renderprops';
import { useGesture } from 'react-use-gesture';
import { useSpring, animated, config } from 'react-spring';
import * as d3 from 'd3';
import '../css/AppFrames.scss';

export const AppSidebar = ({children}) => {

    return(
        <div className="App_sidebar">
            {children}
        </div>
    )

}

export const AppFrame = ({ children, vspan = 1, hspan = 1 }) => {

    const [ maximised, _setMaximised ] = useState( false );
    const [ showHelp, setShowHelp ] = useState( false );
    const [ style, setStyle ] = useSpring( () => ({ left: 0, top: 0, position: "absolute", config: config.stiff }) );
    const childrenRef = useRef( null );

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
        <div className="App_sidebar_frame">
            <div id="layoutPlaceholder" style={{width: "100%", height: "100%"}}/>
            <animated.div ref={childrenRef} className={`App_frame_children${ maximised ? ' fullscreen' : ''}`} style={style}>
                {children}
            </animated.div>
            <MaximiseButton maximised={maximised} setMaximised={setMaximised}/>
            <HelpButton showHelp={showHelp} setShowHelp={setShowHelp}/>
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
                    {({ t }) => <animated.path ref={path} d={pathInterp( t )} transform="translate(15,15)"/>}
                </Spring>
            </svg>
        </div>
    )

}

const HelpButton = ({ showHelp, setShowHelp }) => {

    const bind = useGesture( {
        onDragStart: () => setShowHelp( !showHelp )
    })

    return (
        <div className="Help_Button">
            <svg viewBox="0 0 30 30">
                <rect x="0" y="0" width="100%" height="100%" {...bind()}/>
                <path d="M -5 -10 q 20 2 5 10 v 7 M -2 11 h 4" transform="translate(15,15)"/>
            </svg>
        </div>
    )

}
