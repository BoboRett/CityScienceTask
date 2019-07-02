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

        const counts = {
            sum_vehicles: +datum.all_motor_vehicles + +datum.pedal_cycles,
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

        count.addDirection( datum.direction_of_travel, counts );

    })

    data = Object.values( data );
    return data

}

export const filterData = ( CPs=[], filters ) => {

    return CPs ? CPs.filter( CP => {
        return Object.values( filters ).length > 0 ? Object.entries( filters ).filter( filter => CP.hasOwnProperty( filter[0] ) ).every( ([ filter, value ]) => CP[filter] === value ) : true
    }) : null

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
    this.counts = new Counts();
}

class Counts{

    filterCounts( filters ){

        let counts;

        if( filters.year ){
            counts = this[filters.year] ? [this[filters.year]] : [];
        } else{
            counts = Object.values( this );
        }

        return counts.reduce( ( acc, year ) => acc.addCounts( "Total", year.vehicles.data.getCounts( filters.direction ) ), new VehicleCounts() )
    }

}

class Count{
    constructor( parent, year, method ){

        this.parent = parent;
        this.year = year.toString();
        this.isEstimated = method === "Estimated";
        this.vehicles = d3.hierarchy( new VehicleCounts() );

    }

    addDirection( direction, counts ){
        this.vehicles.data.addCounts( direction, counts );
        return this
    }

}

class VehicleCount{
    constructor( name, children = {} ){
        this.name = name;
        this.values = {};
        this.subcounts = children;
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
    constructor(){
        super( "Total Vehicles", {
            sum_hgvs: new VehicleCount( "HGVs", {
                sum_hgv_2_rigid: new VehicleCount( "Two-rigid axle HGVs" ),
                sum_hgv_3_artic: new VehicleCount( "Three-articulated axle HGVs" ),
                sum_hgv_3_rigid: new VehicleCount( "Three-rigid axle HGVs" ),
                sum_hgv_4_rigid: new VehicleCount( "Four-rigid axle HGVs" ),
                sum_hgv_5_artic: new VehicleCount( "Five-articulated axle HGVs" ),
                sum_hgv_6_artic: new VehicleCount( "Six-articulated axle HGVs" )
            }),
            sum_push: new VehicleCount( "Pedal Cycles" ),
            sum_motorbike: new VehicleCount( "Two-Wheeled Motor Vehicles" ),
            sum_bus_coach: new VehicleCount( "Buses and Coaches" ),
            sum_cars_taxis: new VehicleCount( "Cars and Taxis" ),
            sum_lgvs: new VehicleCount( "LGVs" )
        })
    }

    getCounts( filter ){
        return Object.entries( this.flatten() ).reduce( ( acc, [ key, descendant ] ) => ({ ...acc, [key]: filter ? descendant.values[filter] : descendant.total }) , { sum_vehicles: filter ? this.values[filter] : this.total } )
    }

    addCounts( name, counts ){
        this.addValue( name, counts.sum_vehicles );
        Object.entries( this.flatten() ).forEach( ([key, descendant]) => counts[key] && descendant.addValue( name, +counts[key] ) );
    }

}
