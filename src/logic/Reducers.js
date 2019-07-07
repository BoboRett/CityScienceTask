export const displayReducer = (state, action) => {
    const updateState = newState => ({ ...state, ...newState })

    const { type, payload } = action instanceof Object ? action : { type: action }

    switch (type) {
        case 'setMulti':
            return updateState(payload)
        case 'addFilter':
            return updateState({
                filters: { ...state.filters, [payload[0]]: payload[1] },
            })
        case 'setFilter':
            return updateState({ filters: payload })
        case 'setView':
            return updateState({ view: payload })
        case 'removeFilter':
            delete state.filters[payload]
            return updateState({ filters: { ...state.filters } })
        case 'clearFilters':
            return updateState({ filters: {} })
        case 'setHoveredCP':
            return updateState({ hoveredCP: payload })
        case 'clearHoveredCP':
            return updateState({ hoveredCP: null })
        default:
            throw new Error('Display state: Action not recognised')
    }
}
