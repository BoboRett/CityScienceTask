import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import Mapbox from './components/js/Mapbox.js';
import { displayReducer } from './logic/Reducers.js';
import HierarchicalGraph from './components/js/HierarchicalGraph.js';
import StreamGraph from './components/js/StreamGraph.js';
import { filterData, parseData } from './logic/DataLogic.js';
import { CountFilters } from './components/js/DataControls.js';
import { AppSidebar, AppFrame } from './components/js/AppFrame.js';
import { LoadScreen } from './components/js/LoadScreen.js';
import * as d3 from 'd3';
import './App.scss';

export default function App() {

    const [ data, setData ] = useState( null );
    const [ loading, setLoading ] = useState( false );
    const [ display, setDisplay ] = useReducer( displayReducer,
        {
            filters: {},
            sort: ["",""],
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
                            filters: {},
                            sort: ["date","Ascending"],
                            view: ["","Total Vehicles"],
                            hoveredCP: null,
                            focusedCP: null,
                        }
                    })
                    setData( newData );
                    setLoading( false );

                }
            )


    }, [] )

    const filteredData = useMemo( () => data && filterData( data, display.filters ), [data, display.filters] );
    const countsFilter = useCallback( <CountFilters data={data} display={display} setDisplay={setDisplay}/>, [data, display.filters] );
    const memoMap = useCallback( <Mapbox data={data} filteredData={filteredData} display={display} setDisplay={setDisplay}/>, [filteredData, data] );
    const loadScreen = useCallback( <LoadScreen loading={loading}/>, [loading] );

    return (
        <div className="App">
            <header className="App_header">
                <h1>Devon Annual Average Daily Flows (AADFs)</h1>
            </header>
            <div className="page">
                {loadScreen}
                {memoMap}
                <AppSidebar>
                    <AppFrame>
                        <HierarchicalGraph data={filteredData} display={display} setDisplay={setDisplay}>
                            {countsFilter}
                        </HierarchicalGraph>
                    </AppFrame>
                    <AppFrame>
                        <StreamGraph data={filteredData} display={display} setDisplay={setDisplay}/>
                    </AppFrame>
                </AppSidebar>
            </div>
        </div>
    );
}
