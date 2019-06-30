import * as d3 from 'd3';

export const parseData = fetchResult => {

    const data = {};

    fetchResult.data.forEach( datum => {

        const countPoint = data[datum.count_point_id] || new CountPoint({
            road_name: datum.road_name,
            id: datum.count_point_id,
            road_cat: datum.road_category,
            lat: +datum.latitude,
            lng: +datum.longitude,
            region_id: datum.region_id,
            authority_id: +datum.local_authority_id,
            link_length: +datum.link_length_km,
            start_junction: datum.start_junction_road_name,
            end_junction: datum.end_junction_road_name
        });

        data[datum.count_point_id] = countPoint;

        data[datum.count_point_id].counts[datum.year] = new Count({
            parent: data[datum.count_point_id],
            year: datum.year,
            method: datum.estimation_method,
            sum_motor_vehicles: datum.all_motor_vehicles,
            sum_hgvs: datum.all_hgvs,
            sum_bus_coach: datum.buses_and_coaches,
            sum_cars_taxis: datum.cars_and_taxis,
            sum_lgvs: datum.lgvs,
            hgvs: {
                sum_hgv_2_rigid: datum.hgvs_2_rigid_axle,
                sum_hgv_3_artic: datum.hgvs_3_or_4_articulated_axle,
                sum_hgv_3_rigid: datum.hgvs_3_rigid_axle,
                sum_hgv_4_rigid: datum.hgvs_4_or_more_rigid_axle,
                sum_hgv_5_artic: datum.hgvs_5_articulated_axle,
                sum_hgv_6_artic: datum.hgvs_6_articulated_axle,
            },
            twowheels: {
                push: datum.pedal_cycles,
                motor: datum.two_wheeled_motor_vehicles,
            }
        })

    })

    return data

}

function CountPoint({ road_name, id, road_type, road_cat, lat, lng, region_id, authority_id, link_length, start_junction, end_junction }) {
    this.road_name = new Property( "Road Name", "Name of the road", road_name );
    this.id = new Property( "Count Point ID", "", id );
    this.road_cat = new Property( "Road Category", "Classification of the road type", road_cat );
    this.lat = new Property( "Latitude", "Latitude of the Count Point", lat );
    this.lng = new Property( "Longitude", "Longitude of the Count Point", lng );
    this.region_id = new Property( "Region ID", "", region_id );
    this.authority_id = new Property( "Local Authority ID", "", authority_id );
    this.link_length = new Property( "Link Length", "Total length of the network road link for this Count Point", link_length );
    this.start_junction = new Property( "Start Junction Name", "The road name of the start junction of the link", start_junction );
    this.end_junction = new Property( "End Junction Name", "The road name of the end junction of the link", end_junction );
    this.counts = {};
}

function Count({ parent, year, method, sum_motor_vehicles, sum_hgvs, sum_bus_coach, sum_cars_taxis, sum_lgvs, hgvs: { sum_hgv_2_rigid, sum_hgv_3_artic, sum_hgv_3_rigid, sum_hgv_4_rigid, sum_hgv_5_artic, sum_hgv_6_artic }, twowheels: { push, motor } }) {
    this.parent = parent;
    this.year = new Property( "AADF Year", "AADFs are shown for each year from 2000 onwards", year );
    this.isEstimated = new Property( "Is Estimated?", "Sometimes the vehicle count is estimated", method === "Estimated" );
    this.vehicle_counts = d3.hierarchy( {
        name: "Total Vehicles",
        value: sum_motor_vehicles,
        children: [
            new Property( "HGVs", "", sum_hgvs, [
                new Property( "Two-rigid axle HGVs", "", sum_hgv_2_rigid ),
                new Property( "Three-articulated axle HGVs", "", sum_hgv_3_artic ),
                new Property( "Three-rigid axle HGVs", "", sum_hgv_3_rigid ),
                new Property( "Four-rigid axle HGVs", "", sum_hgv_4_rigid ),
                new Property( "Five-articulated axle HGVs", "", sum_hgv_5_artic ),
                new Property( "Six-articulated axle HGVs", "", sum_hgv_6_artic ),
            ]),
            new Property( "Two-Wheeled Vehicles", "", push + motor, [
                new Property( "Pedal Cycles", "", push ),
                new Property( "Two-Wheeled Motor Vehicles", "", motor ),
            ]),
            new Property( "Buses and Coaches", "", sum_bus_coach ),
            new Property( "Cars and Taxis", "", sum_cars_taxis ),
            new Property( "LGVs", "", sum_lgvs )
        ]
    })
}

function Property( name, description, value, children = [] ){
    this.name = name;
    this.description = description;
    this.value = value;
    this.children = children;
}
