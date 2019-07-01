import React, { useState, useEffect, useReducer, useCallback } from 'react';
import Mapbox from './components/js/Mapbox.js';
import { displayReducer } from './components/js/Reducers.js';
import HierarchicalGraph from './components/js/HierarchicalGraph.js';
import { AppFrame } from './components/js/AppFrame.js';
import { parseData } from './components/js/DataLogic.js';
import * as d3 from 'd3';
import './App.scss';

export default function App() {

    const [ data, setData ] = useState( null );
    const [ display, setDisplay ] = useReducer( displayReducer,
        {
            filters: {},
            sort: ["",""], //date, distancefrom(maybe), name
            hoveredCP: null,
        }
    )

    useEffect( () => {

        d3.json( './devon.json' )
            .then( result => {
                    const newData = parseData( result );
                    setDisplay({
                        type: 'setMulti',
                        payload: {
                            filters: {},
                            sort: ["date","Ascending"],
                            hoveredCP: null
                        }
                    })
                    setData( newData );
                }
            )

    }, [] )

    const memoMap = useCallback( <Mapbox data={data} display={display} setDisplay={setDisplay}/>, [data, display.filters] );

    return (
        <div className="App">
            <header className="App_header">
                <h1>Devon Annual Average Daily Flows (AADFs)</h1>
                <button>Upload Data...</button>
            </header>
            <div className="App_frames">
                <AppFrame vspan={2}>
                    {memoMap}
                </AppFrame>
                <AppFrame>
                    <HierarchicalGraph data={data} display={display} setDisplay={setDisplay}/>
                </AppFrame>
                <AppFrame>
                    <LineChart data={data}/>
                </AppFrame>
            </div>
        </div>
    );
}

const LineChart = ({ data }) => {

    useEffect( () => {
    }, [data])

    return (
        <div className="LineChart">
            Graph of CP data by year, following the focused data from stacked bars
        </div>
    )
}
