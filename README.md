# PoDiGG
_POpulation DIstribution-based Gtfs Generator_

[![npm version](https://badge.fury.io/js/podigg.svg)](https://www.npmjs.com/package/podigg)
[![Docker Automated Build](https://img.shields.io/docker/automated/podigg/podigg.svg)](https://hub.docker.com/r/podigg/podigg/)

A realistic public transport dataset generator, which is serialized as [GTFS](https://developers.google.com/transit/gtfs/).

It is based on five sub-generators:
* Region: A geographical area of cells where each cells contains a population value.
* Stops: Tagging of cells with stop or no stop.
* Edges: Adding transport edges between stops.
* Routes: Routes over one or more edges.
* Connections: Instantiation of routes at times.

# Install

This generator is a [Node.js](http://nodejs.org/) application that can be installed by running:
```bash
[sudo] npm install -g podigg
```

# Usage

## Command line

The easiest way to run the generator is using the command line tool:
```bash
podigg [output folder [path to a JSON config file]]
```
The default output folder is `output_data`.

This config file contains parameters for the generator, as explained below.
Example of a config file:
```json
{
    "seed": 1,
    "stops:stops": 100,
    "connections:connections": 3000
}
```

Alternatively, the generator can also be configured using environment variables, as explained below.
In that case, the generator must be called as follows:
```bash
podigg-env [output folder]
```

## From code

The generator can be included into your application as follows:
```js
const PodiggGenerator = require('podigg');
new PodiggGenerator({
    "seed": 1,
    "stops:stops": 100,
    "connections:connections": 3000
}).generate('output_data');
```

## Docker

Downloading and running the container from the Docker hub:
```bash
docker pull podigg/podigg
docker run --rm -it -v $(pwd)/docker-out:/output_data -e GTFS_GEN_SEED=100 podigg/podigg
```

Building and running the container from this repo:
```bash
git clone git@github.com:PoDiGG/podigg.git
cd podigg
docker build -t podigg .
docker run --rm -it -v $(pwd)/docker-out:/output_data -e GTFS_GEN_SEED=100 podigg
```

Parameters must be passed using environment variables.

# Parameters

All parameters are scoped by their generator name in lower-case, except for the general parameters.
For example, choosing a region's latitude offset is done with the parameter `region:lat_offset`. 

When configuring parameters via environment variables,
parameters should be defined with the prefix `GTFS_GEN_`,
followed by the generator name + `__` (or empty if general) and the parameter name.
The generator and parameter names can either be upper or lower case.
For example, choosing a region's latitude offset is done with the parameter `GTFS_GEN_REGION__LAT_OFFSET`,
and choosing the seed is done with `GTFS_GEN_SEED`.

## General

| Name          | Default Value | Description   |
| ------------- |-------------- | ------------- |
| seed          | `1`           | The random seed |

## Region

Several region generators exist which are explained hereafter, one of them needs to be selected.

Config prefix: `region:`

| Name             | Default Value | Description   |
| ---------------- |-------------- | ------------- |
| region_generator | `isolated`    | Name of a region generator. (isolated, noisy or region) |
| lat_offset       | `0`           | The value to add with all generated latitudes |
| lon_offset       | `0`           | The value to add with all generated longitudes |
| cells_per_latlon | `100`         | The precision of the cells, how many cells go in 1 latitude or 1 longitude.  |

### File

| Name             | Default Value | Description   |
| ---------------- |-------------- | ------------- |
| region_file_path | `null`        | Path to the cells in csv, this can also be a filename of an internal region file from the `data` directory, for example `region_BE.csv`. Expected columns (x:integer, y:integer, lat:float, long:float, density:float) |

### Noisy

A noise-based generator, where population values are influenced by nearby cells. 

| Name          | Default Value | Description   |
| ------------- |-------------- | ------------- |
| size_x        | `300`         | The width of the region in number of cells |
| size_y        | `300`         | The height of the region in number of cells |
| pop_average   | `0`           | The average population value for a cell |
| pop_deviation | `10`          | The standard deviation of the population value for a cell |

### Isolated

A generator that creates a given number of circular clusters of population.
The population density is high at the center of the cluster and decreases to zero when going to the border of the cluster.

| Name          | Default Value | Description   |
| ------------- |-------------- | ------------- |
| size_x        | `300`         | The width of the region in number of cells |
| size_y        | `300`         | The height of the region in number of cells |
| pop_average   | `0`           | The average population value for a cell |
| pop_deviation | `10`          | The standard deviation of the population value for a cell |
| pop_clusters  | `50`          | The number of clusters to generate.  |
| max_radius    | `50`          | The maximum cluster radius.  |

## Stops

The generation of stops

Config prefix: `stops:`

| Name                          | Default Value | Description   |
| ----------------------------- |-------------- | ------------- |
| stops                         | `600`         | How many stops should be generated |
| min_station_size              | `0.01`        | The minimum population value in a cell for a station to form |
| max_station_size              | `30`          | The maximum population value in a cell for a station to form |
| start_stop_choice_power       | `4`           | The power for selecting cells with a large population value as stops |
| min_interstop_distance        | `1`           | The minimum distance between stops in number of cells |
| factor_stops_post_edges       | `0.66`        | The factor of stops that should be generated after edge generation |
| edge_choice_power             | `2`           | The power for selecting longer edges to generate stops on |
| stop_around_edge_choice_power | `4`           | The power for selecting cells with a large population value around edges as stops |
| stop_around_edge_radius       | `2`           | The radius in number of cells around an edge to select points from |

## Edges

The generation of edges

Config prefix: `edges:`

| Name                                          | Default Value | Description   |
| --------------------------------------------- |-------------- | ------------- |
| max_intracluster_distance                     | `100`         | The maximum distance stops in one cluster can have from each other |
| max_intracluster_distance_growthfactor        | `0.1`         | The lower this value, the larger the chance that closer stops will be clustered first before further away stations |
| post_cluster_max_intracluster_distancefactor  | `1.5`         | The larger the value, the larger the chance that a stop will be connected to more stops |
| loosestations_neighbourcount                  | `3`           | The number of neighbours around a loose station that should define its area  |
| loosestations_max_range_factor                | `0.3`         | The maximum range to check around a loose station relative to the total region size |
| loosestations_max_iterations                  | `10`          | The max number of iterations to try to connect one loose station  |
| loosestations_search_radius_factor            | `0.5`         | The number to multiply with the loose station neighbourhood size to get the search radius for each step |

## Routes

The generation of trips and routes

Config prefix: `routes:`

| Name                       | Default Value | Description   |
| -------------------------- |-------------- | ------------- |
| routes                     | `1000`          | The number of routes to generate |
| largest_stations_fraction  | `0.05`          | The fraction of (largest) stops between which routes need to be formed |
| penalize_station_size_area | `10`            | The area in which stop sizes should be penalized |
| max_route_length           | `10`            | The maximum number of edges a route can have in the macro-step, the larger, the slower this generator |
| min_route_length           | `4`             | The minimum number of edges a route must have in the macro-step |

## Connections

The generation of connections

Config prefix: `connections:`

| Name                              | Default Value                                                                                                               | Description   |
| ----------------------------------|---------------------------------------------------------------------------------------------------------------------------- | ------------- |
| time_initial                      | `0`                                                                                                                         | The initial timestamp (ms) of trip starting times |
| time_final                        | `24 * 3600000`                                                                                                              | The final timestamp (ms) of trip starting times |
| connections                       | `30000`                                                                                                                     | The number of connections to generate |
| stop_wait_min                     | `60000`                                                                                                                     | The minimum waiting time per stop in milliseconds |
| stop_wait_size_factor             | `60000`                                                                                                                     | The factor in milliseconds of stop waiting time to add depending on the station size |
| route_choice_power                | `2`                                                                                                                         | The power for selecting longer routes for instantiating connections |
| vehicle_max_speed                 | `160`                                                                                                                       | The maximum speed of a vehicle in km/h, used to calculate the duration of a connection |
| vehicle_speedup                   | `1000`                                                                                                                      | The vehicle speedup in km/(h^2), used to calculate the duration of a connection |
| hourly_weekday_distribution       | `[0.05,0.01,0.01,0.48,2.46,5.64,7.13,6.23,5.44,5.43,5.41,5.49,5.42,5.41,5.57,6.70,6.96,6.21,5.40,4.95,4.33,3.31,1.56,0.42]` | The chance (percentage) for each hour to have a connection on a weekday |
| hourly_weekend_distribution       | `[0.09,0.01,0.01,0.08,0.98,3.56,5.23,5.79,5.82,5.89,5.84,5.91,5.88,5.95,5.87,5.95,5.89,5.96,5.92,5.94,5.62,4.61,2.45,0.76]` | The chance (percentage) for each hour to have a connection on a weekend day |
| delay_chance                      | `0`                                                                                                                         | The 0-1 chance that a connection will have a delay, 0 will not produce any delays (default) |
| delay_max                         | `3600000`                                                                                                                   | The maximum delay in milliseconds |
| delay_choice_power                | `1`                                                                                                                         | Higher values means higher chance on larger delays |
| delay_reasons                     | `{ 'td:DamagedVehicle': 0.4, 'td:Strike': 0.2, 'td:Accident': 0.2, 'td:BadWeather': 0.1, 'td:Obstruction': 0.1}`            | Default reasons for having delays with their respective chance. Keys must be prefixed with td: http://purl.org/td/transportdisruption# |
| delay_reduction_duration_fraction | `0.1`                                                                                                                       | The maximum fraction of connection duration that can be subtracted when there is a delay |

## Query Set

Optionally, PoDiGG can also generate realistic route planning query sets based on the generated dataset.
For this, the `queryset:generate` option must be set to `true`.

Config prefix: `queryset:`

| Name                        | Default Value                                                                                                               | Description   |
| --------------------------- |---------------------------------------------------------------------------------------------------------------------------- | ------------- |
| start_stop_choice_power     | `4`                                                                                                                         | Higher values means higher chance on larger stations when selecting starting stations |
| query_count                 | `100`                                                                                                                       | The number of queries that should be generated |
| time_initial                | `0`                                                                                                                         | The initial timestamp (ms) |
| time_final                  | `24 * 3600000`                                                                                                              | The final timestamp (ms) |
| max_time_before_departure   | `3600000`                                                                                                                   | The maximum time in ms that a query for a certain departure time must be queried |
| hourly_weekday_distribution | `[0.05,0.01,0.01,0.48,2.46,5.64,7.13,6.23,5.44,5.43,5.41,5.49,5.42,5.41,5.57,6.70,6.96,6.21,5.40,4.95,4.33,3.31,1.56,0.42]` | The chance (percentage) for each hour to have a connection on a weekday |
| hourly_weekend_distribution | `[0.09,0.01,0.01,0.08,0.98,3.56,5.23,5.79,5.82,5.89,5.84,5.91,5.88,5.95,5.87,5.95,5.89,5.96,5.92,5.94,5.62,4.61,2.45,0.76]` | The chance (percentage) for each hour to have a connection on a weekend day |

# License
The PoDiGG generator is written by [Ruben Taelman](http://rubensworks.net/).

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/)
and released under the [MIT license](http://opensource.org/licenses/MIT).
