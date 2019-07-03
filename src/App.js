import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import TransitionGroup from 'react-transition-group/TransitionGroup';
import Mapbox from './components/js/Mapbox.js';
import { displayReducer } from './components/js/Reducers.js';
import HierarchicalGraph from './components/js/HierarchicalGraph.js';
import { filterData } from './components/js/DataLogic.js';
import { AppSidebar, AppFrame } from './components/js/AppFrame.js';
import { LoadScreen } from './components/js/LoadScreen.js';
import { parseData } from './components/js/DataLogic.js';
import * as d3 from 'd3';
import './App.scss';

export default function App() {

    const [ data, setData ] = useState( null );
    const [ loading, setLoading ] = useState( false );
    const [ display, setDisplay ] = useReducer( displayReducer,
        {
            filters: {},
            sort: ["",""], //date, distancefrom(maybe), name
            hoveredCP: null,
        }
    )

    useEffect( () => {

        setLoading( true );
        d3.csv( './devon.csv' )
            .then( result => {

                    const newData = parseData( result );
                    setDisplay({
                        type: 'setMulti',
                        payload: {
                            filters: {"direction":"N"},
                            sort: ["date","Ascending"],
                            view: ["","Total Vehicles"],
                            hoveredCP: null
                        }
                    })
                    setData( newData );

                }
            )


    }, [] )

    const filteredData = useMemo( () => data && filterData( data, display.filters ), [ data, display.filters ] );
    const memoMap = useCallback( <Mapbox data={filteredData} display={display} setDisplay={setDisplay}/>, [filteredData] );
    const loadScreen = useCallback( <LoadScreen loading={loading}/>, [loading] );

    useEffect( () => setLoading( false ) );

    return (
        <div className="App">
            <header className="App_header">
                <h1>Devon Annual Average Daily Flows (AADFs)</h1>
                <button>Upload Data...</button>
            </header>
            <div className="page">
                <TransitionGroup>
                    {loadScreen}
                </TransitionGroup>
                {memoMap}
                <AppSidebar>
                    <AppFrame>
                        <HierarchicalGraph data={filteredData} display={display} setDisplay={setDisplay}/>
                    </AppFrame>
                    <AppFrame>
                        <LineChart data={filteredData}/>
                    </AppFrame>
                </AppSidebar>
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
