import React, { useState, useCallback, useRef } from 'react'
import { Spring } from 'react-spring/renderprops'
import { useGesture } from 'react-use-gesture'
import * as d3 from 'd3'
import '../css/AppFrames.scss'

export const AppSidebar = ({ children }) => {
    return <div className="component-AppSidebar">{children}</div>
}

export const AppFrame = ({ children, helpText }) => {
    const [maximised, setMaximised] = useState(false)
    const [showHelp, setShowHelp] = useState(false)

    return (
        <div className={`component-AppFrame${maximised ? ' fullscreen' : ''}`}>
            <div id="layoutPlaceholder" style={{ width: '100%', height: '100%' }} />
            <div className="AppFrame_children">{children}</div>
            <div className={`Help${showHelp ? ' visible' : ''}`}>
                <p>{helpText}</p>
            </div>
            <MaximiseButton maximised={maximised} setMaximised={setMaximised} />
            <HelpButton showHelp={showHelp} setShowHelp={setShowHelp} />
        </div>
    )
}

const MaximiseButton = ({ maximised, setMaximised }) => {
    const [blend, setBlend] = useState(0)
    const path = useRef(null)

    const bind = useGesture({
        onHover: ({ hovering }) => {
            setBlend(hovering ? 1 : 0)
        },
        onDragStart: () => setMaximised(!maximised),
    })

    const pathInterp = useCallback(
        d3.interpolateString(
            `M -10 0 L 0 0 L 0 10 M 0 10 L 0 0 L 10 0 M 10 0 L 0 0 L 0 -10 M 0 -10 L 0 0 L -10 0`,
            `M -10 2 L -10 10 L -2 10 M 2 10 L 10 10 L 10 2 M 10 -2 L 10 -10 L 2 -10 M -2 -10 L -10 -10 L -10 -2`,
        ),
        [],
    )

    return (
        <div className="Maximise_Button">
            <svg viewBox="0 0 30 30">
                <rect x="0" y="0" width="100%" height="100%" {...bind()} />
                <Spring from={{ t: blend === 0 ? 1 : 0 }} to={{ t: blend }} config={{ tension: 360, friction: 24 }}>
                    {({ t }) => <path ref={path} d={pathInterp(t)} transform="translate(15,15)" />}
                </Spring>
            </svg>
        </div>
    )
}

const HelpButton = ({ showHelp, setShowHelp }) => {
    const [blend, setBlend] = useState(0)
    const path = useRef(null)

    const bind = useGesture({
        onHover: ({ hovering }) => {
            setBlend(hovering ? 1 : 0)
            setShowHelp(hovering)
        },
    })

    const pathInterp = useCallback(
        d3.interpolateString(
            `M -5 -10 c 17 -2 17 4 5 10 c 0 0 0 0 0 7 M -1 11 h 2`,
            `M -2 4 c -20 -21 24 -21 4 0 c 0 8 -4 8 -4 0 M -2 4 h 4`,
        ),
        [],
    )

    return (
        <div className="Help_Button">
            <svg viewBox="0 0 30 30">
                <rect x="0" y="0" width="100%" height="100%" {...bind()} />
                <Spring from={{ t: blend === 0 ? 1 : 0 }} to={{ t: blend }} config={{ tension: 360, friction: 24 }}>
                    {({ t }) => <path ref={path} d={pathInterp(t)} transform="translate(15,15)" />}
                </Spring>
            </svg>
        </div>
    )
}
