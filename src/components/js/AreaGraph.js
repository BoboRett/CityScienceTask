import React, { useEffect, useRef, useMemo } from 'react'
import { VehicleCounts, filterCounts } from '../../logic/DataLogic.js'
import { drawAreaStacks } from '../../logic/GraphLogic.js'
import * as d3 from 'd3'
import '../css/Graphs.scss'

export default function AreaGraph({ children, data, display, setDisplay }) {
    const frame = useRef(null)
    const bounds = useMemo(
        () => ({
            top: 20,
            left: 110,
            width: 590,
            height: 360,
        }),
        [],
    )

    const sumDataMemo = useMemo(
        () =>
            data
                ? Array.from({ length: 19 }, (v, i) => 2000 + i).map(year => {
                      return data.reduce(
                          (acc, CP) =>
                              acc.addCounts(
                                  'Total',
                                  filterCounts(CP, {
                                      year: year.toString(),
                                      direction: display.filters.direction,
                                  }).getCounts(),
                              ),
                          new VehicleCounts(),
                      ).hierarchy
                  })
                : null,
        [data, display.filters.direction],
    )

    useEffect(() => {
        if (!sumDataMemo) return

        const graph = d3.select(frame.current)
        const years = Array.from({ length: 19 }, (v, i) => 2000 + i)
        const sumData = sumDataMemo.map(node =>
            node.descendants().find(descendant => descendant.data.name === display.view[1]),
        )

        drawAreaStacks(graph, bounds, display.view, setDisplay, {
            xLabels: years,
            graphData: sumData,
            lastIndex: sumData.parent ? sumData.parent.children.indexOf(sumData) : 0,
        })
    }, [sumDataMemo, display.filters.direction, display.view, bounds, setDisplay])

    return (
        <div className="Graph AreaGraph">
            {children}
            <svg className="StackedArea" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid" ref={frame}>
                <rect className="BG" x="0" y="0" width="100%" height="100%" fill="#0000" />
                <text className="Title" transform={`translate(${bounds.left + bounds.width / 2})`}>
                    Filtered Count Points over Time
                </text>
                <g className="Legend" transform={`translate( ${bounds.left + bounds.width + 40}, 100 )`} />
                <g className="Axes">
                    <text transform={`translate(22,${bounds.top + bounds.height / 2})rotate(-90)`}>Total Vehicles</text>
                    <text transform={`translate(${bounds.left + bounds.width / 2},${bounds.top + bounds.height + 80})`}>
                        Year
                    </text>
                    <g className="LeftAxis" transform={`translate( ${bounds.left}, 0 )`} />
                    <g className="BottomAxis" transform={`translate( 0, ${bounds.height + bounds.top} )`} />
                </g>
                <g className="Data" />
                <g className="Cursor">
                    <line x1={bounds.left} x2={bounds.left} y1={bounds.top} y2={bounds.top + bounds.height} />
                    <text className="Cursor_title" transform={`translate( ${bounds.left + bounds.width + 20}, 275 )`} />
                    <g transform={`translate( ${bounds.left + bounds.width + 20}, 300 )`} />
                </g>
            </svg>
        </div>
    )
}
