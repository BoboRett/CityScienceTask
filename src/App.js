import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import Mapbox from './components/js/Mapbox.js';
import { displayReducer } from './components/js/Reducers.js';
import HierarchicalGraph from './components/js/HierarchicalGraph.js';
import { filterData } from './components/js/DataLogic.js';
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

        d3.csv( './devon.csv' )
            .then( result => {
                    const newData = parseData( result );
                    setDisplay({
                        type: 'setMulti',
                        payload: {
                            filters: {"road_name":"M5","year":"2000","direction":"N"},
                            sort: ["date","Ascending"],
                            hoveredCP: null
                        }
                    })
                    setData( newData );
                }
            )

    }, [] )

    const filteredData = useMemo( () => filterData( data, display.filters ), [ data, display.filters ] );
    console.log( filteredData );
    const memoMap = useCallback( <Mapbox data={filteredData} display={display} setDisplay={setDisplay}/>, [filteredData] );

    return (
        <div className="App">
            <header className="App_header">
                <h1>Devon Annual Average Daily Flows (AADFs)</h1>
                <button>Upload Data...</button>
            </header>
            <div className="page">
                {memoMap}
                <div className="App_frames">
                    <AppFrame>
                        <HierarchicalGraph data={filteredData} display={display} setDisplay={setDisplay}/>
                    </AppFrame>
                    <AppFrame>
                        <LineChart data={filteredData}/>
                    </AppFrame>
                </div>
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
