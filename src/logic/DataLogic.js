import * as d3 from 'd3'

//data structure:
//[
//    CountPoint: [
//        Count:
//            VehicleCounts: [
//                VehicleCount,
//                VehicleCount,
//                ...
//            ],
//        Count:
//            VehicleCounts: [...],
//        ...
//    ],
//    CountPoint: ...
//]

export const parseData = fetchResult => {
    let data = {}

    fetchResult.forEach(datum => {
        if (!data[datum.count_point_id]) {
            data[datum.count_point_id] = new CountPoint({
                roadName: datum.road_name,
                id: datum.count_point_id,
                roadType: datum.road_type,
                lat: +datum.latitude,
                lng: +datum.longitude,
                regionID: datum.region_id,
                authorityID: datum.local_authority_id,
                linkLength: datum.link_length_km,
                startJunction: datum.start_junction_road_name,
                endJunction: datum.end_junction_road_name,
            })
        }

        const vehicleCounts = {
            sumVehicles: +datum.all_motor_vehicles + +datum.pedal_cycles,
            sumGoods: +datum.all_hgvs + +datum.lgvs,
            sumHGVs: datum.all_hgvs,
            sumBusCoach: datum.buses_and_coaches,
            sumCarsTaxis: datum.cars_and_taxis,
            sumLGVs: datum.lgvs,
            sumHGV2Rigid: datum.hgvs_2_rigid_axle,
            sumHGV3Artic: datum.hgvs_3_or_4_articulated_axle,
            sumHGV3Rigid: datum.hgvs_3_rigid_axle,
            sumHGV4Rigid: datum.hgvs_4_or_more_rigid_axle,
            sumHGV5Artic: datum.hgvs_5_articulated_axle,
            sumHGV6Artic: datum.hgvs_6_articulated_axle,
            sumPush: datum.pedal_cycles,
            sumMotorbike: datum.two_wheeled_motor_vehicles,
        }

        const count =
            data[datum.count_point_id].counts[datum.year] ||
            new Count(data[datum.count_point_id], datum.year, datum.estimation_method, datum.direction_of_travel)

        data[datum.count_point_id].counts[datum.year] = count

        count.addDirection(datum.direction_of_travel, vehicleCounts)
    })

    data = Object.values(data)
    return data
}

export const filterData = (CPs, filters) => CPs.filter(CP => CP.matchesFilters(filters))

export const filterCounts = (CP, filters) => {
    let counts = Object.values(CP.counts)

    if (filters.year) counts = counts.filter(count => count.year === filters.year)

    return counts.reduce(
        (acc, year) => acc.addCounts(filters.direction || 'Total', year.vehicles.getCounts(filters.direction)),
        new VehicleCounts(CP),
    )
}

export const sortAlphaNum = (a, b) => {
    a = a.toString()
    b = b.toString()

    const regExAlpha = /[^a-zA-Z]/g
    const regExNum = /[^0-9]/g
    const aAlpha = a.replace(regExAlpha, '')
    const bAlpha = b.replace(regExAlpha, '')

    if (aAlpha === bAlpha) {
        const aNum = parseInt(a.replace(regExNum, ''), 10)
        const bNum = parseInt(b.replace(regExNum, ''), 10)

        return aNum === bNum ? 0 : aNum > bNum ? 1 : -1
    } else {
        return aAlpha > bAlpha ? 1 : -1
    }
}

export const latLngDistance = (a, b) => {
    const deg2rad = d => (d * Math.PI) / 180
    const R = 6371e3 //Earth's radius
    const phiA = deg2rad(a[1])
    const phiB = deg2rad(b[1])
    const delPhi = deg2rad(b[1] - a[1])
    const delLambda = deg2rad(b[0] - a[0])

    const A = Math.pow(Math.sin(delPhi / 2), 2) + Math.cos(phiA) * Math.cos(phiB) * Math.pow(Math.sin(delLambda / 2), 2)
    const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A))

    return R * C
}

class CountPoint {
    constructor({ roadName, id, roadType, lat, lng, regionID, authorityID, linkLength, startJunction, endJunction }) {
        this.roadName = roadName
        this.id = id.toString()
        this.roadType = roadType
        this.lat = lat
        this.lng = lng
        this.regionID = regionID.toString()
        this.authorityID = authorityID.toString()
        this.linkLength = linkLength
        this.startJunction = startJunction
        this.endJunction = endJunction
        this.counts = {}
    }

    matchesFilters(filters) {
        return (
            (Object.keys(filters).length > 0
                ? Object.entries(filters)
                      .filter(filter => this.hasOwnProperty(filter[0]))
                      .every(([filter, value]) => this[filter] === value)
                : true) &&
            (filters.distance
                ? latLngDistance(filters.distance.center, [this.lng, this.lat]) < filters.distance.radius * 1000
                : true)
        )
    }
}

class Count {
    constructor(parent, year, method) {
        this.parent = parent
        this.year = year.toString()
        this.isEstimated = method === 'Estimated'
        this.vehicles = new VehicleCounts(this)
    }

    addDirection(direction, counts) {
        this.vehicles.addCounts(direction, counts)
        return this
    }
}

class VehicleCount {
    constructor(name, parent, children = {}) {
        this.name = name
        this.values = {}
        this.subcounts = children
        this.CP = parent
    }

    addValue(name, val) {
        this.values[name] = this.values[name] ? this.values[name] + val : val
        return this
    }

    get children() {
        return Object.values(this.subcounts)
    }

    get total() {
        return Object.values(this.values).reduce((acc, val) => acc + val, 0)
    }

    flatten() {
        return {
            ...this.subcounts,
            ...this.children.reduce((acc, child) => ({ ...acc, ...child.flatten() }), {}),
        }
    }
}

export class VehicleCounts {
    constructor(CP) {
        const structure = new VehicleCount('Total Vehicles', CP, {
            sumGoods: new VehicleCount('Goods', CP, {
                sumHGVs: new VehicleCount('HGVs', CP, {
                    sumHGV6Artic: new VehicleCount('Six-axle Artic', CP),
                    sumHGV5Artic: new VehicleCount('Five-axle Artic', CP),
                    sumHGV4Rigid: new VehicleCount('Four-axle Rigid', CP),
                    sumHGV3Rigid: new VehicleCount('Three-axle Rigid', CP),
                    sumHGV3Artic: new VehicleCount('Three-axle Artic', CP),
                    sumHGV2Rigid: new VehicleCount('Two-axle Rigid', CP),
                }),
                sumLGVs: new VehicleCount('LGVs', CP),
            }),
            sumPush: new VehicleCount('Pedal Cycles', CP),
            sumMotorbike: new VehicleCount('Motorbikes', CP),
            sumBusCoach: new VehicleCount('Buses and Coaches', CP),
            sumCarsTaxis: new VehicleCount('Cars and Taxis', CP),
        })

        Object.entries({
            sumVehicles: structure,
            ...structure.flatten(),
        }).forEach(([key, count]) => (this[key] = count))
    }

    getCounts(filter) {
        return Object.entries(this).reduce(
            (acc, [key, count]) => ({
                ...acc,
                [key]: filter ? count.values[filter] || 0 : count.total,
            }),
            {},
        )
    }

    addCounts(name, vehicleCounts) {
        Object.entries(this).forEach(([key, count]) => vehicleCounts[key] && count.addValue(name, +vehicleCounts[key]))
        return this
    }

    get hierarchy() {
        return d3.hierarchy(this.sumVehicles).each(node => (node.data.hierarchy = node))
    }
}
