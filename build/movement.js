"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const fs_1 = require("fs");
const sharedstreets_1 = require("sharedstreets");
const cliProgress = require('cli-progress');
const chalk = require('chalk');
class Movement extends command_1.Command {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const { args, flags } = this.parse(Movement);
            var content = fs_1.readFileSync(args.file);
            var polygon = JSON.parse(content.toLocaleString());
            if (flags.out)
                this.log(chalk.bold.keyword('green')('  🗄️  Loading SharedStreets tiles...'));
            var params = new sharedstreets_1.TilePathParams();
            params.source = flags['tile-source'];
            params.tileHierarchy = flags['tile-hierarchy'];
            var tilePathGroup = sharedstreets_1.TilePathGroup.fromPolygon(polygon, 0, params);
            tilePathGroup.addType(sharedstreets_1.TileType.METADATA);
            tilePathGroup.addType(sharedstreets_1.TileType.GEOMETRY);
            tilePathGroup.addType(sharedstreets_1.TileType.REFERENCE);
            tilePathGroup.addType(sharedstreets_1.TileType.INTERSECTION);
            var tileIndex = new sharedstreets_1.TileIndex();
            yield tileIndex.indexTilesByPathGroup(tilePathGroup);
            // this.log(chalk.bold.keyword('green')('  🗄️  Loading Movment segments...'));
            // if(!flags['movement-segments']) {
            //   this.log(chalk.bold.keyword('orange')('  required Movement segments file not specified... use --movement-segments to locate file'));
            //   return;
            // }
            // var movementSegementsToWayIds:Map<string,string> = new Map();
            // var segmentLines = readFileSync(flags['movement-segments']).toString().split("\n");
            // var firstLine = true;
            // for(var line of segmentLines) {
            //   if(!firstLine) {
            //     var parts = line.split(',');
            //     var segmentId = parts[0];
            //     var wayId = parts[1];
            //     if(tileIndex.osmWayIndex.has(wayId)) {
            //       movementSegementsToWayIds.set(segmentId, wayId);
            //     }
            //     else {
            //       //console.log('unable to find way: ' + wayId);
            //     }      
            //   }
            //   else 
            //     firstLine= false;
            // }
            // segmentLines = null;
            // console.log("     total segments:" + movementSegementsToWayIds.size);
            // if(!flags['movement-junctions']) {
            //   this.log(chalk.bold.keyword('orange')('  required Movement junctions file not specified... use --movement-junctions to locate file'));
            //   return;
            // }
            // this.log(chalk.bold.keyword('green')('  🗄️  Loading Movment junctions...'));
            // var movementJunctionsToNodeIds:Map<string,string> = new Map();
            // var junctionLines = readFileSync(flags['movement-junctions']).toString().split("\n");
            // var firstLine = true;
            // for(var line of junctionLines) {
            //   if(!firstLine) {
            //     var parts = line.split(',');
            //     var junctionId = parts[0];
            //     var nodeId = parts[1];
            //     if(tileIndex.osmNodeIndex.has(nodeId)) {
            //       movementJunctionsToNodeIds.set(junctionId , nodeId);
            //     }
            //     else {
            //       //console.log('unable to find way: ' + wayId);
            //     }      
            //   }
            //   else 
            //     firstLine= false;
            // }
            // junctionLines = null;
            // console.log("     total junctions:" + movementJunctionsToNodeIds.size);
            var speedLines = [];
            if (flags['movement-quarterly-speeds'])
                speedLines = fs_1.readFileSync(flags['movement-quarterly-speeds']).toString().split("\n");
            else if (flags['movement-hourly-speeds'])
                speedLines = fs_1.readFileSync(flags['movement-hourly-speeds']).toString().split("\n");
            else {
                this.log(chalk.bold.keyword('orange')('  required quarterly or hourly speed data not specified... use --movement-quarterly-speeds or --movement-hourly-speeds to locate file'));
                return;
            }
            var outFile = flags.out;
            if (!outFile && flags['movement-quarterly-speeds'])
                outFile = flags['movement-quarterly-speeds'] + '.out.geojson';
            else if (!outFile && flags['movement-hourly-speeds'])
                outFile = flags['movement-hourly-speeds'] + '.out.geojson';
            this.log(chalk.bold.keyword('green')('  🚦 Processing Uber Movement speed data into: ' + outFile));
            var outputStream = fs_1.createWriteStream(outFile);
            outputStream.write('{"type": "FeatureCollection","features": [\n');
            var firstLine = true;
            var matchedSegments = 0;
            var unmatchedSegments = 0;
            // var missingSegments = 0;
            const bar1 = new cliProgress.Bar({}, {
                format: chalk.keyword('blue')(' {bar}') + ' {percentage}% | {value}/{total} ',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591'
            });
            bar1.start(speedLines.length, 0);
            var offset = 4;
            if (flags['drive-left-side'])
                offset = -4;
            for (var line of speedLines) {
                bar1.increment();
                if (!firstLine) {
                    var parts = line.split(',');
                    if (flags['movement-quarterly-speeds']) {
                        // if(movementSegementsToWayIds.has(parts[3])) {
                        // if(flags['movement-quarterly-speeds'] && flags['movement-quarterly-speeds'] != parts[2])
                        //     continue;
                        var geom = yield tileIndex.geomFromOsm(parts[6], parts[7], parts[8], offset);
                        if (geom) {
                            geom.properties['segment'] = parts[3];
                            geom.properties['fromJunction'] = parts[4];
                            geom.properties['toJunction'] = parts[5];
                            geom.properties['wayId'] = parts[6];
                            geom.properties['fromNodeId'] = parts[7];
                            geom.properties['toNodeId'] = parts[8];
                            geom.properties['year'] = parseInt(parts[0]);
                            geom.properties['quarter'] = parseInt(parts[1]);
                            geom.properties['hour'] = parseInt(parts[2]);
                            geom.properties['mean'] = parseFloat(parts[9]);
                            geom.properties['meanStd'] = parseFloat(parts[10]);
                            geom.properties['p50'] = parseFloat(parts[11]);
                            geom.properties['p85'] = parseFloat(parts[12]);
                            if (matchedSegments > 0)
                                outputStream.write(',');
                            outputStream.write(JSON.stringify(geom) + '\n');
                            matchedSegments++;
                        }
                        else {
                            unmatchedSegments++;
                        }
                        // }
                        // else {
                        //     missingSegments++;
                        // }
                    }
                    else if (flags['movement-hourly-speeds']) {
                        // if(movementSegementsToWayIds.has(parts[3])) {
                        var geom = yield tileIndex.geomFromOsm(parts[8], parts[9], parts[10], offset);
                        if (geom) {
                            geom.properties['segment'] = parts[5];
                            geom.properties['fromJunction'] = parts[6];
                            geom.properties['toJunction'] = parts[7];
                            geom.properties['wayId'] = parts[8];
                            geom.properties['fromNodeId'] = parts[9];
                            geom.properties['toNodeId'] = parts[10];
                            geom.properties['year'] = parseInt(parts[0]);
                            geom.properties['month'] = parseInt(parts[1]);
                            geom.properties['day'] = parseInt(parts[2]);
                            geom.properties['hour'] = parseInt(parts[4]);
                            geom.properties['mean'] = parseFloat(parts[11]);
                            geom.properties['meanStd'] = parseFloat(parts[12]);
                            if (matchedSegments > 0)
                                outputStream.write(',');
                            outputStream.write(JSON.stringify(geom));
                            matchedSegments++;
                        }
                        else {
                            unmatchedSegments++;
                        }
                        // }
                        // else {
                        //     missingSegments++;
                        // }
                    }
                }
                else
                    firstLine = false;
            }
            bar1.stop();
            speedLines = null;
            tileIndex = null;
            outputStream.write(']}');
            yield outputStream.end();
            console.log("matched segments: " + matchedSegments);
            console.log("unmatched segments: " + unmatchedSegments);
            // console.log("filtered segments (outside polygon boundary): " +  missingSegments);
        });
    }
}
exports.default = Movement;
Movement.description = 'links Uber Movement data sets with SharedStreets';
Movement.examples = [
    `$ shst-speeds movement polygon.geojson --movement-quarterly-speeds=movement-speeds-quarterly-by-hod-new-york-2018-Q4.csv 
    `,
];
Movement.flags = {
    help: command_1.flags.help({ char: 'h' }),
    // flag with a value (-o, --out=FILE)
    out: command_1.flags.string({ char: 'o', description: 'output file' }),
    'tile-source': command_1.flags.string({ description: 'SharedStreets tile source', default: 'osm/planet-181224' }),
    'tile-hierarchy': command_1.flags.integer({ description: 'SharedStreets tile hierarchy', default: 6 }),
    'filter-day': command_1.flags.integer({ description: 'filter day of month (applies only to hourly timeseries data sets)' }),
    'filter-hour': command_1.flags.integer({ description: 'filter hour of day (applies to hourly and quarterly data sets)' }),
    'drive-left-side': command_1.flags.boolean({ description: 'offset road geometries for left-side driving' }),
    'movement-quarterly-speeds': command_1.flags.string({ description: 'Movement quarterly speed file (csv)' }),
    'movement-hourly-speeds': command_1.flags.string({ description: 'Movement hourly speed file (csv)' }),
    stats: command_1.flags.boolean({ char: 's' })
    // flag with no value (-f, --force)
    //force: flags.boolean({char: 'f'}),
};
Movement.args = [{ name: 'file' }];
