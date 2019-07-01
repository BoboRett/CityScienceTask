export const displayReducer = ( state, action ) => {

    const updateState = newState => ({ ...state, ...newState });

    const { type, payload } = action instanceof Object ? action : { type: action };

    switch( type ){
        case 'setMulti':
            return updateState( payload )
        case 'setview':
            return updateState( { view: [ payload[0], payload[1] ] } )
        case 'setfilter':
            return updateState( { filter: [ payload[0], payload[1] ] })
        case 'setHoveredCP':
            return updateState( { hoveredCP: payload } )
        case 'clearHoveredCP':
            return updateState( { hoveredCP: null } )

        default:
            throw new Error( "Display state: Action not recognised" )
    }

}
