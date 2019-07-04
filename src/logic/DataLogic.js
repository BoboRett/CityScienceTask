import * as d3 from 'd3';

export const parseData = fetchResult => {

    let data = {};

    fetchResult.forEach( datum => {

        const countPoint = data[datum.count_point_id] || new CountPoint({
            road_name: datum.road_name,
            id: datum.count_point_id,
            road_type: datum.road_type,
            lat: +datum.latitude,
            lng: +datum.longitude,
            region_id: datum.region_id,
            authority_id: datum.local_authority_id,
            link_length: datum.link_length_km,
            start_junction: datum.start_junction_road_name,
            end_junction: datum.end_junction_road_name
        });

        data[datum.count_point_id] = countPoint;

        const vehicleCounts = {
            sum_vehicles: +datum.all_motor_vehicles + +datum.pedal_cycles,
            sum_goods: +datum.all_hgvs + +datum.lgvs,
            sum_hgvs: datum.all_hgvs,
            sum_bus_coach: datum.buses_and_coaches,
            sum_cars_taxis: datum.cars_and_taxis,
            sum_lgvs: datum.lgvs,
            sum_hgv_2_rigid: datum.hgvs_2_rigid_axle,
            sum_hgv_3_artic: datum.hgvs_3_or_4_articulated_axle,
            sum_hgv_3_rigid: datum.hgvs_3_rigid_axle,
            sum_hgv_4_rigid: datum.hgvs_4_or_more_rigid_axle,
            sum_hgv_5_artic: datum.hgvs_5_articulated_axle,
            sum_hgv_6_artic: datum.hgvs_6_articulated_axle,
            sum_push: datum.pedal_cycles,
            sum_motorbike: datum.two_wheeled_motor_vehicles,
        };

        const count = data[datum.count_point_id].counts[datum.year] || new Count(
            data[datum.count_point_id],
            datum.year,
            datum.estimation_method,
            datum.direction_of_travel,
        )

        data[datum.count_point_id].counts[datum.year] = count;

        count.addDirection( datum.direction_of_travel, vehicleCounts );

    })

    data = Object.values( data );
    return data

}

export const filterData = ( CPs, filters ) => {
    console.log( filters );
    return CPs.filter( CP => {
        return (
            ( Object.keys( filters ).length > 0 ? Object.entries( filters ).filter( filter => CP.hasOwnProperty( filter[0] ) ).every( ([ filter, value ]) => CP[filter] === value ) : true ) &&
            ( filters.distance ? latLngDistance( filters.distance.center, [CP.lng,CP.lat] ) < filters.distance.radius*1000 : true )
        )
    })
}

export const filterCounts = ( CP, filters ) => {

    let counts = Object.values( CP.counts );
    if( filters.year ) counts = counts.filter( count => count.year === filters.year );
    return counts.reduce( ( acc, year ) => acc.addCounts( filters.direction || "Total", year.vehicles.getCounts( filters.direction ) ), new VehicleCounts( CP ) ).hierarchy

}

export const sortAlphaNum = ( a, b ) => {

    a = a.toString();
    b = b.toString();

    const reA = /[^a-zA-Z]/g;
    const reN = /[^0-9]/g;
    const aA = a.replace( reA, "" );
    const bA = b.replace( reA, "" );

    if (aA === bA) {

        const aN = parseInt( a.replace( reN, "" ), 10 );
        const bN = parseInt( b.replace( reN, "" ), 10 );

        return aN === bN ? 0 : aN > bN ? 1 : -1;

    } else {

        return aA > bA ? 1 : -1;

    }

}

export const latLngDistance = ( a, b ) => {

    const d2r = d => d*Math.PI/180;
    const R = 6371e3; //Earth's radius
    const phi_a = d2r( a[1] );
    const phi_b = d2r( b[1]*Math.PI/180 );
    const del_phi = d2r( b[1] - a[1] );
    const del_lambda = d2r( b[0] - a[0] );

    const A = Math.pow( Math.sin( del_phi / 2 ), 2 ) + Math.cos( phi_a )*Math.cos( phi_b )*Math.pow( Math.sin( del_lambda / 2 ), 2 );
    const C = 2 * Math.atan2( Math.sqrt(A), Math.sqrt( 1 - A ) );

    return R * C

}

function CountPoint({ road_name, id, road_type, lat, lng, region_id, authority_id, link_length, start_junction, end_junction }) {

    this.road_name = road_name;
    this.id = id.toString();
    this.road_type = road_type;
    this.lat = lat;
    this.lng = lng;
    this.region_id = region_id.toString();
    this.authority_id = authority_id.toString();
    this.link_length = link_length;
    this.start_junction = start_junction;
    this.end_junction = end_junction;
    this.displayName = start_junction ? end_junction + "_" + start_junction : this.id;
    this.counts = {};

}

class Count{
    constructor( parent, year, method ){

        this.parent = parent;
        this.year = year.toString();
        this.isEstimated = method === "Estimated";
        this.vehicles = new VehicleCounts( this );

    }

    addDirection( direction, counts ){
        this.vehicles.addCounts( direction, counts );
        return this
    }

}

class VehicleCount{
    constructor( name, parent, children = {} ){
        this.name = name;
        this.values = {};
        this.subcounts = children;
        this.parent = parent;
    }

    addValue( name, val ){
        this.values[name] = this.values[name] ? this.values[name] + val : val;
        return this
    }

    get children(){
        return Object.values( this.subcounts )
    }

    get total(){
        return Object.values( this.values ).reduce( ( acc, val ) => acc + val, 0 )
    }

    flatten(){
        return { ...this.subcounts, ...this.children.reduce( ( acc, child ) => ({ ...acc, ...child.flatten() }), {} ) }
    }
}

class VehicleCounts extends VehicleCount{
    constructor( parent ){

        super( "Total Vehicles", parent, {
            sum_goods: new VehicleCount( "Goods", parent, {
                sum_hgvs: new VehicleCount( "HGVs", parent, {
                    sum_hgv_6_artic: new VehicleCount( "Six-axle Artic", parent ),
                    sum_hgv_5_artic: new VehicleCount( "Five-axle Artic", parent ),
                    sum_hgv_4_rigid: new VehicleCount( "Four-axle Rigid", parent ),
                    sum_hgv_3_rigid: new VehicleCount( "Three-axle Rigid", parent ),
                    sum_hgv_3_artic: new VehicleCount( "Three-axle Artic", parent ),
                    sum_hgv_2_rigid: new VehicleCount( "Two-axle Rigid", parent ),
                }),
                sum_lgvs: new VehicleCount( "LGVs", parent )
            }),
            sum_push: new VehicleCount( "Pedal Cycles", parent ),
            sum_motorbike: new VehicleCount( "Motorbikes", parent ),
            sum_bus_coach: new VehicleCount( "Buses and Coaches", parent ),
            sum_cars_taxis: new VehicleCount( "Cars and Taxis", parent ),
        })

    }

    getCounts( filter ){
        return Object.entries( this.flatten() ).reduce( ( acc, [ key, descendant ] ) => ({ ...acc, [key]: filter ? ( descendant.values[filter] || 0 ) : descendant.total }), { sum_vehicles: filter ? ( this.values[filter] || 0 ) : this.total } )
    }

    addCounts( name, vehicleCounts ){
        this.addValue( name, vehicleCounts.sum_vehicles );
        Object.entries( this.flatten() ).forEach( ([ key, descendant ]) => vehicleCounts[key] && descendant.addValue( name, +vehicleCounts[key] ) );

        return this
    }

    get hierarchy(){
        return d3.hierarchy( this )
            .each( node => node.value = node.data.total )
    }
}
