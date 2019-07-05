import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import Mapbox from './components/js/Mapbox.js';
import HierarchicalGraph from './components/js/HierarchicalGraph.js';
import AreaGraph from './components/js/AreaGraph.js';
import { CountFilters } from './components/js/DataControls.js';
import { AppSidebar, AppFrame } from './components/js/AppFrame.js';
import { LoadScreen } from './components/js/LoadScreen.js';
import { filterData, parseData } from './logic/DataLogic.js';
import { displayReducer } from './logic/Reducers.js';
import { useHoveredCP } from './logic/Hooks.js';
import * as d3 from 'd3';
import './App.scss';

export default function App() {

    const [ data, setData ] = useState( null );
    const [ loading, setLoading ] = useState( false );
    const [ display, setDisplay ] = useReducer( displayReducer, { filters: {} } );

    useEffect( () => {

        setLoading( true );
        d3.csv( './devon.csv' )
            .then( result => {

                    const newData = parseData( result );
                    setDisplay({
                        type: 'setMulti',
                        payload: {
                            filters: {road_name:"A30", direction: "E"},
                            view: ["","HGVs"],
                            hoveredCP: null,
                        }
                    })
                    setData( newData );
                    setLoading( false );

                }
            )


    }, [] )

    useHoveredCP( display.hoveredCP );

    const filteredData = useMemo( () => data && filterData( data, display.filters ), [data, display.filters] );
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
                    <AppFrame helpText="This is an overview of all the Count Points visible on the map. You can click any of the stacked elements or the legend keys to drill down into the data. Right click or just click an empty space to traverse back up again.">
                        <HierarchicalGraph data={filteredData} display={display} setDisplay={setDisplay}>
                            <CountFilters data={data} display={display} setDisplay={setDisplay}/>
                        </HierarchicalGraph>
                    </AppFrame>
                    <AppFrame helpText="This shows the evolution of vehicle counts over time, summed over all currently visible Count Points. Like the Overview, you can click elements to navigate in and out of the data. You can use the cursor to see the values for a specific year.">
                        <AreaGraph data={filteredData} display={display} setDisplay={setDisplay}>
                            <CountFilters showDate={false} data={data} display={display} setDisplay={setDisplay}/>
                        </AreaGraph>
                    </AppFrame>
                </AppSidebar>
            </div>
        </div>
    );
}
