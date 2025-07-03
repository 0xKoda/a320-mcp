#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} = require('@modelcontextprotocol/sdk/types');

class A32NXMCPServer {
  constructor() {
    this.server = new Server({
      name: "a32nx-flight-controller",
      version: "2.0.0"
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // AUTOPILOT CONTROLS
          {
            name: "set_autopilot_master",
            description: "Engage/disengage autopilot master",
            inputSchema: {
              type: "object",
              properties: {
                engaged: { type: "boolean", description: "Autopilot engagement state" }
              },
              required: ["engaged"]
            }
          },
          {
            name: "set_flight_director",
            description: "Control flight director engagement",
            inputSchema: {
              type: "object",
              properties: {
                captain: { type: "boolean", description: "Captain FD state" },
                first_officer: { type: "boolean", description: "First Officer FD state" }
              },
              required: ["captain", "first_officer"]
            }
          },
          {
            name: "set_autopilot_altitude",
            description: "Set autopilot target altitude",
            inputSchema: {
              type: "object",
              properties: {
                altitude: { type: "number", description: "Target altitude in feet", minimum: 0, maximum: 45000 }
              },
              required: ["altitude"]
            }
          },
          {
            name: "set_autopilot_heading",
            description: "Set autopilot target heading",
            inputSchema: {
              type: "object",
              properties: {
                heading: { type: "number", description: "Target heading in degrees", minimum: 0, maximum: 360 }
              },
              required: ["heading"]
            }
          },
          {
            name: "set_autopilot_speed",
            description: "Set autopilot target speed",
            inputSchema: {
              type: "object",
              properties: {
                speed: { type: "number", description: "Target speed in knots", minimum: 100, maximum: 400 },
                is_mach: { type: "boolean", description: "Whether speed is in Mach number", default: false }
              },
              required: ["speed"]
            }
          },
          {
            name: "set_autopilot_vertical_speed",
            description: "Set autopilot vertical speed",
            inputSchema: {
              type: "object",
              properties: {
                vertical_speed: { type: "number", description: "Vertical speed in feet per minute", minimum: -6000, maximum: 6000 }
              },
              required: ["vertical_speed"]
            }
          },
          {
            name: "set_autopilot_mode",
            description: "Set autopilot lateral/vertical modes",
            inputSchema: {
              type: "object",
              properties: {
                lateral_mode: { type: "string", enum: ["HDG", "NAV", "LOC", "APPR"], description: "Lateral mode" },
                vertical_mode: { type: "string", enum: ["ALT", "VS", "ILS", "APPR"], description: "Vertical mode" }
              }
            }
          },
          {
            name: "set_autothrust",
            description: "Control autothrust system",
            inputSchema: {
              type: "object",
              properties: {
                engaged: { type: "boolean", description: "Autothrust engagement state" },
                thrust_limit: { type: "string", enum: ["TOGA", "FLX", "CLB", "CRZ", "IDLE"], description: "Thrust limit mode" }
              },
              required: ["engaged"]
            }
          },

          // DIRECT FLIGHT CONTROLS (Primary Pilot Inputs)
          {
            name: "set_throttle_levers",
            description: "Control throttle/thrust levers directly",
            inputSchema: {
              type: "object",
              properties: {
                throttle_1: { type: "number", description: "Throttle 1 position (-16383 to 16384)", minimum: -16383, maximum: 16384 },
                throttle_2: { type: "number", description: "Throttle 2 position (-16383 to 16384)", minimum: -16383, maximum: 16384 }
              }
            }
          },
          {
            name: "set_sidestick_input",
            description: "Control sidestick/yoke inputs for pitch and roll",
            inputSchema: {
              type: "object",
              properties: {
                aileron_input: { type: "number", description: "Aileron input (-16383 to 16384)", minimum: -16383, maximum: 16384 },
                elevator_input: { type: "number", description: "Elevator input (-16383 to 16384)", minimum: -16383, maximum: 16384 }
              }
            }
          },
          {
            name: "set_rudder_pedals",
            description: "Control rudder pedal inputs",
            inputSchema: {
              type: "object",
              properties: {
                rudder_input: { type: "number", description: "Rudder input (-16383 to 16384)", minimum: -16383, maximum: 16384 }
              }
            }
          },
          {
            name: "set_brake_pedals",
            description: "Control brake pedal inputs",
            inputSchema: {
              type: "object",
              properties: {
                left_brake: { type: "number", description: "Left brake pedal input (0-100)", minimum: 0, maximum: 100 },
                right_brake: { type: "number", description: "Right brake pedal input (0-100)", minimum: 0, maximum: 100 }
              }
            }
          },
          {
            name: "set_nose_wheel_steering",
            description: "Control nose wheel steering tiller",
            inputSchema: {
              type: "object",
              properties: {
                tiller_input: { type: "number", description: "Tiller steering input (-1 to 1)", minimum: -1, maximum: 1 }
              }
            }
          },
          {
            name: "set_priority_takeover",
            description: "Execute priority takeover (disconnects autopilot)",
            inputSchema: {
              type: "object",
              properties: {
                pilot_side: { type: "integer", description: "Pilot side (1=Captain, 2=First Officer)", enum: [1, 2] }
              },
              required: ["pilot_side"]
            }
          },
          {
            name: "disconnect_autothrust",
            description: "Disconnect autothrust system",
            inputSchema: {
              type: "object",
              properties: {
                disconnect: { type: "boolean", description: "Disconnect autothrust", default: true }
              }
            }
          },

          // FLIGHT CONTROLS (Secondary)
          {
            name: "set_flight_controls",
            description: "Control primary flight surfaces",
            inputSchema: {
              type: "object",
              properties: {
                aileron: { type: "number", description: "Aileron deflection (-1 to 1)", minimum: -1, maximum: 1 },
                elevator: { type: "number", description: "Elevator deflection (-1 to 1)", minimum: -1, maximum: 1 },
                rudder: { type: "number", description: "Rudder deflection (-1 to 1)", minimum: -1, maximum: 1 }
              }
            }
          },
          {
            name: "set_flaps",
            description: "Control flap position",
            inputSchema: {
              type: "object",
              properties: {
                position: { type: "integer", description: "Flap position (0-5)", minimum: 0, maximum: 5 },
                percent: { type: "number", description: "Flap extension percentage", minimum: 0, maximum: 100 }
              }
            }
          },
          {
            name: "set_spoilers",
            description: "Control spoiler system",
            inputSchema: {
              type: "object",
              properties: {
                armed: { type: "boolean", description: "Ground spoilers armed" },
                position: { type: "number", description: "Spoiler position (0-1)", minimum: 0, maximum: 1 }
              }
            }
          },
          {
            name: "set_trim",
            description: "Control aircraft trim",
            inputSchema: {
              type: "object",
              properties: {
                elevator_trim: { type: "number", description: "Elevator trim position", minimum: -1, maximum: 1 },
                rudder_trim: { type: "number", description: "Rudder trim position", minimum: -1, maximum: 1 }
              }
            }
          },

          // ENGINE CONTROLS
          {
            name: "set_engine_power",
            description: "Control engine power/thrust",
            inputSchema: {
              type: "object",
              properties: {
                engine: { type: "integer", description: "Engine number (1 or 2)", enum: [1, 2] },
                thrust_percent: { type: "number", description: "Thrust percentage (0-100)", minimum: 0, maximum: 100 }
              },
              required: ["engine", "thrust_percent"]
            }
          },
          {
            name: "set_engine_start_stop",
            description: "Start or stop engines",
            inputSchema: {
              type: "object",
              properties: {
                engine: { type: "integer", description: "Engine number (1 or 2)", enum: [1, 2] },
                start: { type: "boolean", description: "Start engine if true, stop if false" }
              },
              required: ["engine", "start"]
            }
          },
          {
            name: "set_engine_ignition",
            description: "Control engine ignition system",
            inputSchema: {
              type: "object",
              properties: {
                engine: { type: "integer", description: "Engine number (1 or 2)", enum: [1, 2] },
                ignition: { type: "string", enum: ["OFF", "IGN_A", "IGN_B", "START"], description: "Ignition mode" }
              },
              required: ["engine", "ignition"]
            }
          },
          {
            name: "set_fuel_pumps",
            description: "Control fuel pump systems",
            inputSchema: {
              type: "object",
              properties: {
                tank: { type: "string", enum: ["LEFT", "RIGHT", "CENTER"], description: "Fuel tank" },
                pump_1: { type: "boolean", description: "Pump 1 state" },
                pump_2: { type: "boolean", description: "Pump 2 state" }
              },
              required: ["tank", "pump_1", "pump_2"]
            }
          },

          // LANDING GEAR
          {
            name: "set_landing_gear",
            description: "Control landing gear extension/retraction",
            inputSchema: {
              type: "object",
              properties: {
                gear_down: { type: "boolean", description: "Gear extended if true" },
                gear_bay_doors: { type: "boolean", description: "Gear bay doors open if true" }
              },
              required: ["gear_down"]
            }
          },
          {
            name: "set_wheel_brakes",
            description: "Control wheel brake system",
            inputSchema: {
              type: "object",
              properties: {
                left_brake: { type: "number", description: "Left brake pressure (0-1)", minimum: 0, maximum: 1 },
                right_brake: { type: "number", description: "Right brake pressure (0-1)", minimum: 0, maximum: 1 },
                parking_brake: { type: "boolean", description: "Parking brake engaged" }
              }
            }
          },

          // NAVIGATION AND COMMUNICATION
          {
            name: "set_nav_radio",
            description: "Configure navigation radio frequencies",
            inputSchema: {
              type: "object",
              properties: {
                radio: { type: "integer", description: "Radio number (1 or 2)", enum: [1, 2] },
                frequency: { type: "number", description: "Frequency in MHz", minimum: 108.0, maximum: 118.0 },
                course: { type: "number", description: "Course setting in degrees", minimum: 0, maximum: 360 }
              },
              required: ["radio", "frequency"]
            }
          },
          {
            name: "set_com_radio",
            description: "Configure communication radio frequencies",
            inputSchema: {
              type: "object",
              properties: {
                radio: { type: "integer", description: "Radio number (1 or 2)", enum: [1, 2] },
                frequency: { type: "number", description: "Frequency in MHz", minimum: 118.0, maximum: 137.0 },
                standby_frequency: { type: "number", description: "Standby frequency in MHz", minimum: 118.0, maximum: 137.0 }
              },
              required: ["radio", "frequency"]
            }
          },
          {
            name: "set_transponder",
            description: "Configure transponder settings",
            inputSchema: {
              type: "object",
              properties: {
                code: { type: "string", description: "4-digit transponder code", pattern: "^[0-7]{4}$" },
                mode: { type: "string", enum: ["STBY", "ON", "ALT"], description: "Transponder mode" }
              },
              required: ["code", "mode"]
            }
          },
          {
            name: "set_adirs",
            description: "Control ADIRS (Air Data Inertial Reference System)",
            inputSchema: {
              type: "object",
              properties: {
                adirs_1: { type: "string", enum: ["OFF", "NAV", "ATT"], description: "ADIRS 1 mode" },
                adirs_2: { type: "string", enum: ["OFF", "NAV", "ATT"], description: "ADIRS 2 mode" },
                adirs_3: { type: "string", enum: ["OFF", "NAV", "ATT"], description: "ADIRS 3 mode" }
              }
            }
          },

          // FLIGHT MANAGEMENT SYSTEM
          {
            name: "set_fms_waypoint",
            description: "Set FMS waypoint or route",
            inputSchema: {
              type: "object",
              properties: {
                waypoint_id: { type: "string", description: "Waypoint identifier" },
                latitude: { type: "number", description: "Latitude in degrees", minimum: -90, maximum: 90 },
                longitude: { type: "number", description: "Longitude in degrees", minimum: -180, maximum: 180 },
                altitude: { type: "number", description: "Altitude constraint in feet" },
                speed: { type: "number", description: "Speed constraint in knots" }
              },
              required: ["waypoint_id"]
            }
          },
          {
            name: "set_fms_flight_plan",
            description: "Load or modify flight plan",
            inputSchema: {
              type: "object",
              properties: {
                departure: { type: "string", description: "Departure airport ICAO code" },
                arrival: { type: "string", description: "Arrival airport ICAO code" },
                route: { type: "string", description: "Route string" },
                cruise_altitude: { type: "number", description: "Cruise altitude in feet" }
              }
            }
          },
          {
            name: "execute_fms_command",
            description: "Execute FMS commands",
            inputSchema: {
              type: "object",
              properties: {
                command: { type: "string", enum: ["EXEC", "CLR", "DIR_TO"], description: "FMS command" },
                parameter: { type: "string", description: "Command parameter if needed" }
              },
              required: ["command"]
            }
          },

          // SYSTEMS CONTROLS
          {
            name: "set_electrical_system",
            description: "Control electrical system components",
            inputSchema: {
              type: "object",
              properties: {
                battery_1: { type: "boolean", description: "Battery 1 state" },
                battery_2: { type: "boolean", description: "Battery 2 state" },
                generator_1: { type: "boolean", description: "Generator 1 state" },
                generator_2: { type: "boolean", description: "Generator 2 state" },
                apu_generator: { type: "boolean", description: "APU generator state" },
                external_power: { type: "boolean", description: "External power state" }
              }
            }
          },
          {
            name: "set_hydraulic_system",
            description: "Control hydraulic system components",
            inputSchema: {
              type: "object",
              properties: {
                green_system: { type: "boolean", description: "Green hydraulic system state" },
                blue_system: { type: "boolean", description: "Blue hydraulic system state" },
                yellow_system: { type: "boolean", description: "Yellow hydraulic system state" },
                engine_1_pump: { type: "boolean", description: "Engine 1 hydraulic pump" },
                engine_2_pump: { type: "boolean", description: "Engine 2 hydraulic pump" },
                electric_pump: { type: "boolean", description: "Electric hydraulic pump" }
              }
            }
          },
          {
            name: "set_pneumatic_system",
            description: "Control pneumatic system components",
            inputSchema: {
              type: "object",
              properties: {
                engine_1_bleed: { type: "boolean", description: "Engine 1 bleed air" },
                engine_2_bleed: { type: "boolean", description: "Engine 2 bleed air" },
                apu_bleed: { type: "boolean", description: "APU bleed air" },
                pack_1: { type: "boolean", description: "Pack 1 state" },
                pack_2: { type: "boolean", description: "Pack 2 state" },
                wing_anti_ice: { type: "boolean", description: "Wing anti-ice system" },
                engine_anti_ice: { type: "boolean", description: "Engine anti-ice system" }
              }
            }
          },
          {
            name: "set_lighting_system",
            description: "Control aircraft lighting systems",
            inputSchema: {
              type: "object",
              properties: {
                nav_lights: { type: "boolean", description: "Navigation lights" },
                beacon: { type: "boolean", description: "Beacon light" },
                strobe: { type: "boolean", description: "Strobe lights" },
                landing_lights: { type: "boolean", description: "Landing lights" },
                taxi_lights: { type: "boolean", description: "Taxi lights" },
                cabin_lights: { type: "number", description: "Cabin light intensity (0-1)", minimum: 0, maximum: 1 }
              }
            }
          },
          {
            name: "set_apu",
            description: "Control APU (Auxiliary Power Unit)",
            inputSchema: {
              type: "object",
              properties: {
                master_switch: { type: "boolean", description: "APU master switch" },
                start_switch: { type: "boolean", description: "APU start switch" },
                generator: { type: "boolean", description: "APU generator" },
                bleed_air: { type: "boolean", description: "APU bleed air" }
              }
            }
          },

          // WEATHER RADAR AND SYSTEMS
          {
            name: "set_weather_radar",
            description: "Control weather radar system",
            inputSchema: {
              type: "object",
              properties: {
                mode: { type: "string", enum: ["OFF", "STANDBY", "ON", "TEST"], description: "Radar mode" },
                range: { type: "number", description: "Radar range in nautical miles", enum: [10, 20, 40, 80, 160, 320] },
                tilt: { type: "number", description: "Radar tilt angle in degrees", minimum: -15, maximum: 15 },
                gain: { type: "number", description: "Radar gain setting", minimum: 0, maximum: 100 }
              }
            }
          },

          // CABIN CONTROLS
          {
            name: "set_cabin_systems",
            description: "Control cabin systems",
            inputSchema: {
              type: "object",
              properties: {
                cabin_altitude: { type: "number", description: "Target cabin altitude in feet" },
                cabin_pressure_mode: { type: "string", enum: ["AUTO", "MANUAL"], description: "Cabin pressure mode" },
                cabin_temperature: { type: "number", description: "Target cabin temperature in Celsius", minimum: 15, maximum: 30 },
                oxygen_system: { type: "boolean", description: "Oxygen system state" }
              }
            }
          },

          // STATUS AND MONITORING
          {
            name: "get_flight_status",
            description: "Get comprehensive flight status",
            inputSchema: {
              type: "object",
              properties: {
                category: { 
                  type: "string", 
                  enum: ["all", "autopilot", "engines", "flight_controls", "navigation", "systems", "fuel", "hydraulics", "electrical"], 
                  description: "Status category to retrieve" 
                }
              },
              required: ["category"]
            }
          },
          {
            name: "get_flight_data",
            description: "Get current flight data parameters",
            inputSchema: {
              type: "object",
              properties: {
                parameters: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["altitude", "speed", "heading", "vertical_speed", "position", "attitude", "engine_data", "fuel_quantity"]
                  },
                  description: "Flight data parameters to retrieve"
                }
              },
              required: ["parameters"]
            }
          },
          {
            name: "set_emergency_systems",
            description: "Control emergency systems",
            inputSchema: {
              type: "object",
              properties: {
                emergency_generator: { type: "boolean", description: "Emergency generator state" },
                ram_air_turbine: { type: "boolean", description: "RAT deployment" },
                emergency_lights: { type: "boolean", description: "Emergency lighting" },
                oxygen_masks: { type: "boolean", description: "Passenger oxygen masks" }
              }
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // AUTOPILOT
          case "set_autopilot_master":
            return await this.setAutopilotMaster(args.engaged);
          case "set_flight_director":
            return await this.setFlightDirector(args.captain, args.first_officer);
          case "set_autopilot_altitude":
            return await this.setAutopilotAltitude(args.altitude);
          case "set_autopilot_heading":
            return await this.setAutopilotHeading(args.heading);
          case "set_autopilot_speed":
            return await this.setAutopilotSpeed(args.speed, args.is_mach);
          case "set_autopilot_vertical_speed":
            return await this.setAutopilotVerticalSpeed(args.vertical_speed);
          case "set_autopilot_mode":
            return await this.setAutopilotMode(args.lateral_mode, args.vertical_mode);
          case "set_autothrust":
            return await this.setAutothrust(args.engaged, args.thrust_limit);

          // DIRECT FLIGHT CONTROLS
          case "set_throttle_levers":
            return await this.setThrottleLevers(args.throttle_1, args.throttle_2);
          case "set_sidestick_input":
            return await this.setSidestickInput(args.aileron_input, args.elevator_input);
          case "set_rudder_pedals":
            return await this.setRudderPedals(args.rudder_input);
          case "set_brake_pedals":
            return await this.setBrakePedals(args.left_brake, args.right_brake);
          case "set_nose_wheel_steering":
            return await this.setNoseWheelSteering(args.tiller_input);
          case "set_priority_takeover":
            return await this.setPriorityTakeover(args.pilot_side);
          case "disconnect_autothrust":
            return await this.disconnectAutothrust(args.disconnect);

          // FLIGHT CONTROLS
          case "set_flight_controls":
            return await this.setFlightControls(args.aileron, args.elevator, args.rudder);
          case "set_flaps":
            return await this.setFlaps(args.position, args.percent);
          case "set_spoilers":
            return await this.setSpoilers(args.armed, args.position);
          case "set_trim":
            return await this.setTrim(args.elevator_trim, args.rudder_trim);

          // ENGINES
          case "set_engine_power":
            return await this.setEnginePower(args.engine, args.thrust_percent);
          case "set_engine_start_stop":
            return await this.setEngineStartStop(args.engine, args.start);
          case "set_engine_ignition":
            return await this.setEngineIgnition(args.engine, args.ignition);
          case "set_fuel_pumps":
            return await this.setFuelPumps(args.tank, args.pump_1, args.pump_2);

          // LANDING GEAR
          case "set_landing_gear":
            return await this.setLandingGear(args.gear_down, args.gear_bay_doors);
          case "set_wheel_brakes":
            return await this.setWheelBrakes(args.left_brake, args.right_brake, args.parking_brake);

          // NAVIGATION
          case "set_nav_radio":
            return await this.setNavRadio(args.radio, args.frequency, args.course);
          case "set_com_radio":
            return await this.setComRadio(args.radio, args.frequency, args.standby_frequency);
          case "set_transponder":
            return await this.setTransponder(args.code, args.mode);
          case "set_adirs":
            return await this.setAdirs(args.adirs_1, args.adirs_2, args.adirs_3);

          // FMS
          case "set_fms_waypoint":
            return await this.setFmsWaypoint(args.waypoint_id, args.latitude, args.longitude, args.altitude, args.speed);
          case "set_fms_flight_plan":
            return await this.setFmsFlightPlan(args.departure, args.arrival, args.route, args.cruise_altitude);
          case "execute_fms_command":
            return await this.executeFmsCommand(args.command, args.parameter);

          // SYSTEMS
          case "set_electrical_system":
            return await this.setElectricalSystem(args);
          case "set_hydraulic_system":
            return await this.setHydraulicSystem(args);
          case "set_pneumatic_system":
            return await this.setPneumaticSystem(args);
          case "set_lighting_system":
            return await this.setLightingSystem(args);
          case "set_apu":
            return await this.setApu(args);
          case "set_weather_radar":
            return await this.setWeatherRadar(args.mode, args.range, args.tilt, args.gain);
          case "set_cabin_systems":
            return await this.setCabinSystems(args);
          case "set_emergency_systems":
            return await this.setEmergencySystems(args);

          // STATUS
          case "get_flight_status":
            return await this.getFlightStatus(args.category);
          case "get_flight_data":
            return await this.getFlightData(args.parameters);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "a32nx://flight/status",
            name: "Flight Status",
            description: "Complete flight status and aircraft state"
          },
          {
            uri: "a32nx://systems/autopilot",
            name: "Autopilot System",
            description: "Autopilot and flight management system status"
          },
          {
            uri: "a32nx://systems/engines",
            name: "Engine Systems",
            description: "Engine parameters and fuel system status"
          },
          {
            uri: "a32nx://systems/flight_controls",
            name: "Flight Controls",
            description: "Primary and secondary flight control status"
          },
          {
            uri: "a32nx://systems/navigation",
            name: "Navigation Systems",
            description: "Navigation, communication, and ADIRS status"
          },
          {
            uri: "a32nx://systems/aircraft_systems",
            name: "Aircraft Systems",
            description: "Electrical, hydraulic, pneumatic, and other systems"
          },
          {
            uri: "a32nx://checklist/normal",
            name: "Normal Checklists",
            description: "Standard operating procedures and checklists"
          },
          {
            uri: "a32nx://checklist/emergency",
            name: "Emergency Checklists",
            description: "Emergency and abnormal procedures"
          }
        ]
      };
    });

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case "a32nx://flight/status":
          return await this.getFlightStatusResource();
        case "a32nx://systems/autopilot":
          return await this.getAutopilotSystemResource();
        case "a32nx://systems/engines":
          return await this.getEngineSystemResource();
        case "a32nx://systems/flight_controls":
          return await this.getFlightControlsResource();
        case "a32nx://systems/navigation":
          return await this.getNavigationSystemResource();
        case "a32nx://systems/aircraft_systems":
          return await this.getAircraftSystemsResource();
        case "a32nx://checklist/normal":
          return await this.getNormalChecklistResource();
        case "a32nx://checklist/emergency":
          return await this.getEmergencyChecklistResource();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  // DIRECT FLIGHT CONTROL IMPLEMENTATIONS
  async setThrottleLevers(throttle1, throttle2) {
    if (throttle1 !== undefined) await this.setSimVar("THROTTLE1_AXIS_SET_EX1", throttle1);
    if (throttle2 !== undefined) await this.setSimVar("THROTTLE2_AXIS_SET_EX1", throttle2);
    return {
      content: [{ type: "text", text: `Throttle levers: 1=${throttle1}, 2=${throttle2}` }]
    };
  }

  async setSidestickInput(aileronInput, elevatorInput) {
    if (aileronInput !== undefined) await this.setSimVar("AILERON_SET", aileronInput);
    if (elevatorInput !== undefined) await this.setSimVar("ELEVATOR_SET", elevatorInput);
    return {
      content: [{ type: "text", text: `Sidestick input: Aileron=${aileronInput}, Elevator=${elevatorInput}` }]
    };
  }

  async setRudderPedals(rudderInput) {
    await this.setSimVar("RUDDER_SET", rudderInput);
    return {
      content: [{ type: "text", text: `Rudder pedals: ${rudderInput}` }]
    };
  }

  async setBrakePedals(leftBrake, rightBrake) {
    if (leftBrake !== undefined) await this.setSimVar("A32NX_LEFT_BRAKE_PEDAL_INPUT", leftBrake);
    if (rightBrake !== undefined) await this.setSimVar("A32NX_RIGHT_BRAKE_PEDAL_INPUT", rightBrake);
    return {
      content: [{ type: "text", text: `Brake pedals: Left=${leftBrake}, Right=${rightBrake}` }]
    };
  }

  async setNoseWheelSteering(tillerInput) {
    await this.setSimVar("A32NX_TILLER_HANDLE_POSITION", tillerInput);
    return {
      content: [{ type: "text", text: `Nose wheel steering: ${tillerInput}` }]
    };
  }

  async setPriorityTakeover(pilotSide) {
    await this.setSimVar(`A32NX_PRIORITY_TAKEOVER:${pilotSide}`, 1);
    return {
      content: [{ type: "text", text: `Priority takeover executed - Pilot ${pilotSide} (Autopilot disconnected)` }]
    };
  }

  async disconnectAutothrust(disconnect = true) {
    if (disconnect) await this.setSimVar("A32NX_AUTOTHRUST_DISCONNECT", 1);
    return {
      content: [{ type: "text", text: `Autothrust ${disconnect ? 'disconnected' : 'connected'}` }]
    };
  }

  // AUTOPILOT IMPLEMENTATIONS
  async setAutopilotMaster(engaged) {
    await this.setSimVar("A32NX_FMGC_AP_ENGAGED", engaged);
    return {
      content: [{ type: "text", text: `Autopilot ${engaged ? 'engaged' : 'disengaged'}` }]
    };
  }

  async setFlightDirector(captain, firstOfficer) {
    await this.setSimVar("A32NX_FMGC_1_FD_ENGAGED", captain);
    await this.setSimVar("A32NX_FMGC_2_FD_ENGAGED", firstOfficer);
    return {
      content: [{ type: "text", text: `Flight directors: Captain ${captain ? 'ON' : 'OFF'}, FO ${firstOfficer ? 'ON' : 'OFF'}` }]
    };
  }

  async setAutopilotAltitude(altitude) {
    await this.setSimVar("A32NX_FCU_ALT", altitude);
    return {
      content: [{ type: "text", text: `Autopilot altitude set to ${altitude} feet` }]
    };
  }

  async setAutopilotHeading(heading) {
    await this.setSimVar("A32NX_FCU_HDG", heading);
    return {
      content: [{ type: "text", text: `Autopilot heading set to ${heading} degrees` }]
    };
  }

  async setAutopilotSpeed(speed, isMach = false) {
    await this.setSimVar("A32NX_FCU_SPD", speed);
    await this.setSimVar("A32NX_FCU_SPD_IS_MACH", isMach);
    return {
      content: [{ type: "text", text: `Autopilot speed set to ${speed} ${isMach ? 'Mach' : 'knots'}` }]
    };
  }

  async setAutopilotVerticalSpeed(verticalSpeed) {
    await this.setSimVar("A32NX_FCU_VS", verticalSpeed);
    return {
      content: [{ type: "text", text: `Autopilot vertical speed set to ${verticalSpeed} fpm` }]
    };
  }

  async setAutopilotMode(lateralMode, verticalMode) {
    if (lateralMode) await this.setSimVar("A32NX_FMGC_LATERAL_MODE", lateralMode);
    if (verticalMode) await this.setSimVar("A32NX_FMGC_VERTICAL_MODE", verticalMode);
    return {
      content: [{ type: "text", text: `Autopilot modes: Lateral=${lateralMode}, Vertical=${verticalMode}` }]
    };
  }

  async setAutothrust(engaged, thrustLimit) {
    await this.setSimVar("A32NX_AUTOTHRUST_ENGAGED", engaged);
    if (thrustLimit) await this.setSimVar("A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE", thrustLimit);
    return {
      content: [{ type: "text", text: `Autothrust ${engaged ? 'engaged' : 'disengaged'}${thrustLimit ? ` with ${thrustLimit} limit` : ''}` }]
    };
  }

  // FLIGHT CONTROLS IMPLEMENTATIONS
  async setFlightControls(aileron, elevator, rudder) {
    if (aileron !== undefined) await this.setSimVar("A32NX_FLIGHT_CONTROLS_AILERON_INPUT", aileron);
    if (elevator !== undefined) await this.setSimVar("A32NX_FLIGHT_CONTROLS_ELEVATOR_INPUT", elevator);
    if (rudder !== undefined) await this.setSimVar("A32NX_FLIGHT_CONTROLS_RUDDER_INPUT", rudder);
    return {
      content: [{ type: "text", text: `Flight controls: Aileron=${aileron}, Elevator=${elevator}, Rudder=${rudder}` }]
    };
  }

  async setFlaps(position, percent) {
    if (position !== undefined) await this.setSimVar("A32NX_FLAPS_HANDLE_INDEX", position);
    if (percent !== undefined) await this.setSimVar("A32NX_FLAPS_HANDLE_PERCENT", percent);
    return {
      content: [{ type: "text", text: `Flaps set to ${position !== undefined ? `position ${position}` : `${percent}%`}` }]
    };
  }

  async setSpoilers(armed, position) {
    if (armed !== undefined) await this.setSimVar("A32NX_SPOILERS_ARMED", armed);
    if (position !== undefined) await this.setSimVar("A32NX_SPOILERS_HANDLE_POSITION", position);
    return {
      content: [{ type: "text", text: `Spoilers: Armed=${armed}, Position=${position}` }]
    };
  }

  async setTrim(elevatorTrim, rudderTrim) {
    if (elevatorTrim !== undefined) await this.setSimVar("A32NX_FLIGHT_CONTROLS_ELEVATOR_TRIM", elevatorTrim);
    if (rudderTrim !== undefined) await this.setSimVar("A32NX_FLIGHT_CONTROLS_RUDDER_TRIM", rudderTrim);
    return {
      content: [{ type: "text", text: `Trim: Elevator=${elevatorTrim}, Rudder=${rudderTrim}` }]
    };
  }

  // ENGINE IMPLEMENTATIONS
  async setEnginePower(engine, thrustPercent) {
    await this.setSimVar(`A32NX_ENGINE_${engine}_THRUST_PERCENT`, thrustPercent);
    return {
      content: [{ type: "text", text: `Engine ${engine} thrust set to ${thrustPercent}%` }]
    };
  }

  async setEngineStartStop(engine, start) {
    await this.setSimVar(`A32NX_ENGINE_${engine}_START_SWITCH`, start);
    return {
      content: [{ type: "text", text: `Engine ${engine} ${start ? 'starting' : 'stopping'}` }]
    };
  }

  async setEngineIgnition(engine, ignition) {
    await this.setSimVar(`A32NX_ENGINE_${engine}_IGNITION`, ignition);
    return {
      content: [{ type: "text", text: `Engine ${engine} ignition set to ${ignition}` }]
    };
  }

  async setFuelPumps(tank, pump1, pump2) {
    await this.setSimVar(`A32NX_FUEL_${tank}_PUMP_1`, pump1);
    await this.setSimVar(`A32NX_FUEL_${tank}_PUMP_2`, pump2);
    return {
      content: [{ type: "text", text: `${tank} tank fuel pumps: Pump1=${pump1}, Pump2=${pump2}` }]
    };
  }

  // LANDING GEAR IMPLEMENTATIONS
  async setLandingGear(gearDown, gearBayDoors) {
    await this.setSimVar("A32NX_GEAR_HANDLE_POSITION", gearDown);
    if (gearBayDoors !== undefined) await this.setSimVar("A32NX_GEAR_BAY_DOORS_OPEN", gearBayDoors);
    return {
      content: [{ type: "text", text: `Landing gear ${gearDown ? 'down' : 'up'}` }]
    };
  }

  async setWheelBrakes(leftBrake, rightBrake, parkingBrake) {
    if (leftBrake !== undefined) await this.setSimVar("A32NX_BRAKE_LEFT_PRESSURE", leftBrake);
    if (rightBrake !== undefined) await this.setSimVar("A32NX_BRAKE_RIGHT_PRESSURE", rightBrake);
    if (parkingBrake !== undefined) await this.setSimVar("A32NX_BRAKE_PARKING", parkingBrake);
    return {
      content: [{ type: "text", text: `Brakes: Left=${leftBrake}, Right=${rightBrake}, Parking=${parkingBrake}` }]
    };
  }

  // NAVIGATION IMPLEMENTATIONS
  async setNavRadio(radio, frequency, course) {
    await this.setSimVar(`A32NX_NAV_${radio}_FREQUENCY`, frequency);
    if (course !== undefined) await this.setSimVar(`A32NX_NAV_${radio}_COURSE`, course);
    return {
      content: [{ type: "text", text: `NAV${radio} frequency set to ${frequency} MHz${course ? `, course ${course}°` : ''}` }]
    };
  }

  async setComRadio(radio, frequency, standbyFrequency) {
    await this.setSimVar(`A32NX_COM_${radio}_FREQUENCY`, frequency);
    if (standbyFrequency !== undefined) await this.setSimVar(`A32NX_COM_${radio}_STANDBY_FREQUENCY`, standbyFrequency);
    return {
      content: [{ type: "text", text: `COM${radio} frequency set to ${frequency} MHz${standbyFrequency ? `, standby ${standbyFrequency} MHz` : ''}` }]
    };
  }

  async setTransponder(code, mode) {
    await this.setSimVar("A32NX_TRANSPONDER_CODE", code);
    await this.setSimVar("A32NX_TRANSPONDER_MODE", mode);
    return {
      content: [{ type: "text", text: `Transponder set to ${code} mode ${mode}` }]
    };
  }

  async setAdirs(adirs1, adirs2, adirs3) {
    if (adirs1) await this.setSimVar("A32NX_ADIRS_1_MODE", adirs1);
    if (adirs2) await this.setSimVar("A32NX_ADIRS_2_MODE", adirs2);
    if (adirs3) await this.setSimVar("A32NX_ADIRS_3_MODE", adirs3);
    return {
      content: [{ type: "text", text: `ADIRS: 1=${adirs1}, 2=${adirs2}, 3=${adirs3}` }]
    };
  }

  // FMS IMPLEMENTATIONS
  async setFmsWaypoint(waypointId, latitude, longitude, altitude, speed) {
    await this.setSimVar("A32NX_FMS_WAYPOINT_ID", waypointId);
    if (latitude !== undefined) await this.setSimVar("A32NX_FMS_WAYPOINT_LAT", latitude);
    if (longitude !== undefined) await this.setSimVar("A32NX_FMS_WAYPOINT_LON", longitude);
    if (altitude !== undefined) await this.setSimVar("A32NX_FMS_WAYPOINT_ALT", altitude);
    if (speed !== undefined) await this.setSimVar("A32NX_FMS_WAYPOINT_SPD", speed);
    return {
      content: [{ type: "text", text: `FMS waypoint ${waypointId} set` }]
    };
  }

  async setFmsFlightPlan(departure, arrival, route, cruiseAltitude) {
    if (departure) await this.setSimVar("A32NX_FMS_DEPARTURE", departure);
    if (arrival) await this.setSimVar("A32NX_FMS_ARRIVAL", arrival);
    if (route) await this.setSimVar("A32NX_FMS_ROUTE", route);
    if (cruiseAltitude) await this.setSimVar("A32NX_FMS_CRUISE_ALT", cruiseAltitude);
    return {
      content: [{ type: "text", text: `Flight plan: ${departure} to ${arrival}${cruiseAltitude ? ` at FL${Math.floor(cruiseAltitude/100)}` : ''}` }]
    };
  }

  async executeFmsCommand(command, parameter) {
    await this.setSimVar("A32NX_FMS_COMMAND", command);
    if (parameter) await this.setSimVar("A32NX_FMS_PARAMETER", parameter);
    return {
      content: [{ type: "text", text: `FMS command ${command} executed${parameter ? ` with parameter ${parameter}` : ''}` }]
    };
  }

  // SYSTEMS IMPLEMENTATIONS
  async setElectricalSystem(args) {
    const updates = [];
    if (args.battery_1 !== undefined) {
      await this.setSimVar("A32NX_ELEC_BAT_1", args.battery_1);
      updates.push(`Battery 1: ${args.battery_1 ? 'ON' : 'OFF'}`);
    }
    if (args.battery_2 !== undefined) {
      await this.setSimVar("A32NX_ELEC_BAT_2", args.battery_2);
      updates.push(`Battery 2: ${args.battery_2 ? 'ON' : 'OFF'}`);
    }
    if (args.generator_1 !== undefined) {
      await this.setSimVar("A32NX_ELEC_GEN_1", args.generator_1);
      updates.push(`Generator 1: ${args.generator_1 ? 'ON' : 'OFF'}`);
    }
    if (args.generator_2 !== undefined) {
      await this.setSimVar("A32NX_ELEC_GEN_2", args.generator_2);
      updates.push(`Generator 2: ${args.generator_2 ? 'ON' : 'OFF'}`);
    }
    if (args.apu_generator !== undefined) {
      await this.setSimVar("A32NX_ELEC_APU_GEN", args.apu_generator);
      updates.push(`APU Generator: ${args.apu_generator ? 'ON' : 'OFF'}`);
    }
    if (args.external_power !== undefined) {
      await this.setSimVar("A32NX_ELEC_EXT_PWR", args.external_power);
      updates.push(`External Power: ${args.external_power ? 'ON' : 'OFF'}`);
    }
    return {
      content: [{ type: "text", text: `Electrical system updated: ${updates.join(', ')}` }]
    };
  }

  async setHydraulicSystem(args) {
    const updates = [];
    if (args.green_system !== undefined) {
      await this.setSimVar("A32NX_HYD_GREEN_SYSTEM", args.green_system);
      updates.push(`Green: ${args.green_system ? 'ON' : 'OFF'}`);
    }
    if (args.blue_system !== undefined) {
      await this.setSimVar("A32NX_HYD_BLUE_SYSTEM", args.blue_system);
      updates.push(`Blue: ${args.blue_system ? 'ON' : 'OFF'}`);
    }
    if (args.yellow_system !== undefined) {
      await this.setSimVar("A32NX_HYD_YELLOW_SYSTEM", args.yellow_system);
      updates.push(`Yellow: ${args.yellow_system ? 'ON' : 'OFF'}`);
    }
    return {
      content: [{ type: "text", text: `Hydraulic system updated: ${updates.join(', ')}` }]
    };
  }

  async setPneumaticSystem(args) {
    const updates = [];
    if (args.engine_1_bleed !== undefined) {
      await this.setSimVar("A32NX_PNEU_ENG_1_BLEED", args.engine_1_bleed);
      updates.push(`Eng 1 Bleed: ${args.engine_1_bleed ? 'ON' : 'OFF'}`);
    }
    if (args.engine_2_bleed !== undefined) {
      await this.setSimVar("A32NX_PNEU_ENG_2_BLEED", args.engine_2_bleed);
      updates.push(`Eng 2 Bleed: ${args.engine_2_bleed ? 'ON' : 'OFF'}`);
    }
    if (args.wing_anti_ice !== undefined) {
      await this.setSimVar("A32NX_PNEU_WING_ANTI_ICE", args.wing_anti_ice);
      updates.push(`Wing Anti-Ice: ${args.wing_anti_ice ? 'ON' : 'OFF'}`);
    }
    return {
      content: [{ type: "text", text: `Pneumatic system updated: ${updates.join(', ')}` }]
    };
  }

  async setLightingSystem(args) {
    const updates = [];
    if (args.nav_lights !== undefined) {
      await this.setSimVar("A32NX_LIGHTS_NAV", args.nav_lights);
      updates.push(`Nav Lights: ${args.nav_lights ? 'ON' : 'OFF'}`);
    }
    if (args.beacon !== undefined) {
      await this.setSimVar("A32NX_LIGHTS_BEACON", args.beacon);
      updates.push(`Beacon: ${args.beacon ? 'ON' : 'OFF'}`);
    }
    if (args.strobe !== undefined) {
      await this.setSimVar("A32NX_LIGHTS_STROBE", args.strobe);
      updates.push(`Strobe: ${args.strobe ? 'ON' : 'OFF'}`);
    }
    if (args.landing_lights !== undefined) {
      await this.setSimVar("A32NX_LIGHTS_LANDING", args.landing_lights);
      updates.push(`Landing Lights: ${args.landing_lights ? 'ON' : 'OFF'}`);
    }
    return {
      content: [{ type: "text", text: `Lighting system updated: ${updates.join(', ')}` }]
    };
  }

  async setApu(args) {
    const updates = [];
    if (args.master_switch !== undefined) {
      await this.setSimVar("A32NX_APU_MASTER_SWITCH", args.master_switch);
      updates.push(`Master: ${args.master_switch ? 'ON' : 'OFF'}`);
    }
    if (args.start_switch !== undefined) {
      await this.setSimVar("A32NX_APU_START_SWITCH", args.start_switch);
      updates.push(`Start: ${args.start_switch ? 'ON' : 'OFF'}`);
    }
    return {
      content: [{ type: "text", text: `APU updated: ${updates.join(', ')}` }]
    };
  }

  async setWeatherRadar(mode, range, tilt, gain) {
    if (mode) await this.setSimVar("A32NX_WEATHER_RADAR_MODE", mode);
    if (range) await this.setSimVar("A32NX_WEATHER_RADAR_RANGE", range);
    if (tilt !== undefined) await this.setSimVar("A32NX_WEATHER_RADAR_TILT", tilt);
    if (gain !== undefined) await this.setSimVar("A32NX_WEATHER_RADAR_GAIN", gain);
    return {
      content: [{ type: "text", text: `Weather radar: Mode=${mode}, Range=${range}NM, Tilt=${tilt}°, Gain=${gain}%` }]
    };
  }

  async setCabinSystems(args) {
    const updates = [];
    if (args.cabin_altitude !== undefined) {
      await this.setSimVar("A32NX_CABIN_ALTITUDE", args.cabin_altitude);
      updates.push(`Cabin Alt: ${args.cabin_altitude}ft`);
    }
    if (args.cabin_temperature !== undefined) {
      await this.setSimVar("A32NX_CABIN_TEMPERATURE", args.cabin_temperature);
      updates.push(`Cabin Temp: ${args.cabin_temperature}°C`);
    }
    return {
      content: [{ type: "text", text: `Cabin systems updated: ${updates.join(', ')}` }]
    };
  }

  async setEmergencySystems(args) {
    const updates = [];
    if (args.emergency_generator !== undefined) {
      await this.setSimVar("A32NX_EMERGENCY_GENERATOR", args.emergency_generator);
      updates.push(`Emergency Gen: ${args.emergency_generator ? 'ON' : 'OFF'}`);
    }
    if (args.ram_air_turbine !== undefined) {
      await this.setSimVar("A32NX_RAT_DEPLOYED", args.ram_air_turbine);
      updates.push(`RAT: ${args.ram_air_turbine ? 'DEPLOYED' : 'STOWED'}`);
    }
    return {
      content: [{ type: "text", text: `Emergency systems updated: ${updates.join(', ')}` }]
    };
  }

  // STATUS IMPLEMENTATIONS
  async getFlightStatus(category) {
    const status = await this.getAllFlightStatus();
    let content = "";
    
    switch (category) {
      case "all":
        content = this.formatAllFlightStatus(status);
        break;
      case "autopilot":
        content = this.formatAutopilotStatus(status.autopilot);
        break;
      case "engines":
        content = this.formatEngineStatus(status.engines);
        break;
      case "flight_controls":
        content = this.formatFlightControlsStatus(status.flight_controls);
        break;
      case "navigation":
        content = this.formatNavigationStatus(status.navigation);
        break;
      case "systems":
        content = this.formatSystemsStatus(status.systems);
        break;
      default:
        content = this.formatAllFlightStatus(status);
    }
    
    return {
      content: [{ type: "text", text: content }]
    };
  }

  async getFlightData(parameters) {
    const data = {};
    
    for (const param of parameters) {
      switch (param) {
        case "altitude":
          data.altitude = await this.getSimVar("A32NX_ADIRS_ADR_1_ALTITUDE");
          break;
        case "speed":
          data.speed = await this.getSimVar("A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED");
          break;
        case "heading":
          data.heading = await this.getSimVar("A32NX_ADIRS_IR_1_HEADING");
          break;
        case "vertical_speed":
          data.vertical_speed = await this.getSimVar("A32NX_ADIRS_ADR_1_VERTICAL_SPEED");
          break;
        case "engine_data":
          data.engine_data = {
            engine_1_n1: await this.getSimVar("A32NX_ENGINE_N1:1"),
            engine_2_n1: await this.getSimVar("A32NX_ENGINE_N1:2"),
            engine_1_egt: await this.getSimVar("A32NX_ENGINE_EGT:1"),
            engine_2_egt: await this.getSimVar("A32NX_ENGINE_EGT:2")
          };
          break;
        case "fuel_quantity":
          data.fuel_quantity = {
            left_tank: await this.getSimVar("A32NX_FUEL_LEFT_QUANTITY"),
            right_tank: await this.getSimVar("A32NX_FUEL_RIGHT_QUANTITY"),
            center_tank: await this.getSimVar("A32NX_FUEL_CENTER_QUANTITY")
          };
          break;
      }
    }
    
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }

  // RESOURCE IMPLEMENTATIONS
  async getFlightStatusResource() {
    const status = await this.getAllFlightStatus();
    return {
      contents: [{
        uri: "a32nx://flight/status",
        mimeType: "application/json",
        text: JSON.stringify(status, null, 2)
      }]
    };
  }

  async getAutopilotSystemResource() {
    const autopilot = {
      ap_engaged: await this.getSimVar("A32NX_FMGC_AP_ENGAGED"),
      fd_1_engaged: await this.getSimVar("A32NX_FMGC_1_FD_ENGAGED"),
      fd_2_engaged: await this.getSimVar("A32NX_FMGC_2_FD_ENGAGED"),
      target_altitude: await this.getSimVar("A32NX_FCU_ALT"),
      target_heading: await this.getSimVar("A32NX_FCU_HDG"),
      target_speed: await this.getSimVar("A32NX_FCU_SPD"),
      vertical_speed: await this.getSimVar("A32NX_FCU_VS"),
      autothrust_engaged: await this.getSimVar("A32NX_AUTOTHRUST_ENGAGED"),
      timestamp: new Date().toISOString()
    };
    return {
      contents: [{
        uri: "a32nx://systems/autopilot",
        mimeType: "application/json",
        text: JSON.stringify(autopilot, null, 2)
      }]
    };
  }

  async getEngineSystemResource() {
    const engines = {
      engine_1: {
        n1: await this.getSimVar("A32NX_ENGINE_N1:1"),
        n2: await this.getSimVar("A32NX_ENGINE_N2:1"),
        egt: await this.getSimVar("A32NX_ENGINE_EGT:1"),
        fuel_flow: await this.getSimVar("A32NX_ENGINE_FF:1")
      },
      engine_2: {
        n1: await this.getSimVar("A32NX_ENGINE_N1:2"),
        n2: await this.getSimVar("A32NX_ENGINE_N2:2"),
        egt: await this.getSimVar("A32NX_ENGINE_EGT:2"),
        fuel_flow: await this.getSimVar("A32NX_ENGINE_FF:2")
      },
      fuel_system: {
        left_tank: await this.getSimVar("A32NX_FUEL_LEFT_QUANTITY"),
        right_tank: await this.getSimVar("A32NX_FUEL_RIGHT_QUANTITY"),
        center_tank: await this.getSimVar("A32NX_FUEL_CENTER_QUANTITY")
      },
      timestamp: new Date().toISOString()
    };
    return {
      contents: [{
        uri: "a32nx://systems/engines",
        mimeType: "application/json",
        text: JSON.stringify(engines, null, 2)
      }]
    };
  }

  async getFlightControlsResource() {
    const flightControls = {
      flaps_position: await this.getSimVar("A32NX_FLAPS_HANDLE_INDEX"),
      flaps_percent: await this.getSimVar("A32NX_FLAPS_HANDLE_PERCENT"),
      spoilers_armed: await this.getSimVar("A32NX_SPOILERS_ARMED"),
      elevator_trim: await this.getSimVar("A32NX_FLIGHT_CONTROLS_ELEVATOR_TRIM"),
      rudder_trim: await this.getSimVar("A32NX_FLIGHT_CONTROLS_RUDDER_TRIM"),
      timestamp: new Date().toISOString()
    };
    return {
      contents: [{
        uri: "a32nx://systems/flight_controls",
        mimeType: "application/json",
        text: JSON.stringify(flightControls, null, 2)
      }]
    };
  }

  async getNavigationSystemResource() {
    const navigation = {
      adirs_1_mode: await this.getSimVar("A32NX_ADIRS_1_MODE"),
      adirs_2_mode: await this.getSimVar("A32NX_ADIRS_2_MODE"),
      adirs_3_mode: await this.getSimVar("A32NX_ADIRS_3_MODE"),
      heading: await this.getSimVar("A32NX_ADIRS_IR_1_HEADING"),
      track: await this.getSimVar("A32NX_ADIRS_IR_1_TRACK"),
      nav_1_frequency: await this.getSimVar("A32NX_NAV_1_FREQUENCY"),
      nav_2_frequency: await this.getSimVar("A32NX_NAV_2_FREQUENCY"),
      com_1_frequency: await this.getSimVar("A32NX_COM_1_FREQUENCY"),
      com_2_frequency: await this.getSimVar("A32NX_COM_2_FREQUENCY"),
      transponder_code: await this.getSimVar("A32NX_TRANSPONDER_CODE"),
      timestamp: new Date().toISOString()
    };
    return {
      contents: [{
        uri: "a32nx://systems/navigation",
        mimeType: "application/json",
        text: JSON.stringify(navigation, null, 2)
      }]
    };
  }

  async getAircraftSystemsResource() {
    const systems = {
      electrical: {
        battery_1: await this.getSimVar("A32NX_ELEC_BAT_1"),
        battery_2: await this.getSimVar("A32NX_ELEC_BAT_2"),
        generator_1: await this.getSimVar("A32NX_ELEC_GEN_1"),
        generator_2: await this.getSimVar("A32NX_ELEC_GEN_2")
      },
      hydraulic: {
        green_pressure: await this.getSimVar("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE"),
        blue_pressure: await this.getSimVar("A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE"),
        yellow_pressure: await this.getSimVar("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE")
      },
      pneumatic: {
        engine_1_bleed: await this.getSimVar("A32NX_PNEU_ENG_1_BLEED"),
        engine_2_bleed: await this.getSimVar("A32NX_PNEU_ENG_2_BLEED"),
        pack_1: await this.getSimVar("A32NX_OVHD_COND_PACK_1_PB_IS_ON"),
        pack_2: await this.getSimVar("A32NX_OVHD_COND_PACK_2_PB_IS_ON")
      },
      timestamp: new Date().toISOString()
    };
    return {
      contents: [{
        uri: "a32nx://systems/aircraft_systems",
        mimeType: "application/json",
        text: JSON.stringify(systems, null, 2)
      }]
    };
  }

  async getNormalChecklistResource() {
    const checklists = {
      preflight: [
        "Battery switches - ON",
        "External power - CONNECT",
        "Fuel pumps - ON",
        "Navigation lights - ON",
        "Beacon - ON"
      ],
      engine_start: [
        "APU - START",
        "Engine mode selector - IGN/START",
        "Engine master switches - ON",
        "Monitor engine parameters"
      ],
      taxi: [
        "Taxi lights - ON",
        "Flight controls - CHECK",
        "Parking brake - RELEASE",
        "Taxi clearance - OBTAIN"
      ],
      takeoff: [
        "Flaps - SET",
        "Trim - SET",
        "Autopilot - OFF",
        "Autothrust - ARM",
        "Takeoff clearance - OBTAIN"
      ]
    };
    return {
      contents: [{
        uri: "a32nx://checklist/normal",
        mimeType: "application/json",
        text: JSON.stringify(checklists, null, 2)
      }]
    };
  }

  async getEmergencyChecklistResource() {
    const emergencyChecklists = {
      engine_failure: [
        "Autothrust - OFF",
        "Rudder - APPLY as needed",
        "Bank angle - LIMIT to 15°",
        "Altitude - MAINTAIN if possible",
        "Emergency descent - INITIATE if required"
      ],
      fire_engine: [
        "Autothrust - OFF",
        "Engine master switch - OFF",
        "Fire handle - PULL",
        "Agent - DISCHARGE",
        "Land as soon as possible"
      ],
      depressurization: [
        "Oxygen masks - DON",
        "Emergency descent - INITIATE",
        "Cabin altitude - MONITOR",
        "Nearest suitable airport - PROCEED"
      ]
    };
    return {
      contents: [{
        uri: "a32nx://checklist/emergency",
        mimeType: "application/json",
        text: JSON.stringify(emergencyChecklists, null, 2)
      }]
    };
  }

  // UTILITY METHODS
  async setSimVar(variable, value) {
    console.log(`Setting ${variable} to ${value}`);
    return true;
  }

  async getSimVar(variable) {
    console.log(`Getting ${variable}`);
    return Math.random() > 0.5 ? true : false;
  }

  async getAllFlightStatus() {
    return {
      autopilot: {
        ap_engaged: await this.getSimVar("A32NX_FMGC_AP_ENGAGED"),
        fd_1_engaged: await this.getSimVar("A32NX_FMGC_1_FD_ENGAGED"),
        target_altitude: await this.getSimVar("A32NX_FCU_ALT"),
        target_heading: await this.getSimVar("A32NX_FCU_HDG"),
        target_speed: await this.getSimVar("A32NX_FCU_SPD"),
        autothrust_engaged: await this.getSimVar("A32NX_AUTOTHRUST_ENGAGED")
      },
      engines: {
        engine_1_n1: await this.getSimVar("A32NX_ENGINE_N1:1"),
        engine_2_n1: await this.getSimVar("A32NX_ENGINE_N1:2"),
        engine_1_egt: await this.getSimVar("A32NX_ENGINE_EGT:1"),
        engine_2_egt: await this.getSimVar("A32NX_ENGINE_EGT:2")
      },
      flight_controls: {
        flaps_position: await this.getSimVar("A32NX_FLAPS_HANDLE_INDEX"),
        spoilers_armed: await this.getSimVar("A32NX_SPOILERS_ARMED"),
        gear_down: await this.getSimVar("A32NX_GEAR_HANDLE_POSITION")
      },
      navigation: {
        heading: await this.getSimVar("A32NX_ADIRS_IR_1_HEADING"),
        altitude: await this.getSimVar("A32NX_ADIRS_ADR_1_ALTITUDE"),
        speed: await this.getSimVar("A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED")
      },
      systems: {
        electrical: {
          battery_1: await this.getSimVar("A32NX_ELEC_BAT_1"),
          battery_2: await this.getSimVar("A32NX_ELEC_BAT_2"),
          generator_1: await this.getSimVar("A32NX_ELEC_GEN_1"),
          generator_2: await this.getSimVar("A32NX_ELEC_GEN_2")
        },
        hydraulic: {
          green_pressure: await this.getSimVar("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE"),
          blue_pressure: await this.getSimVar("A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE"),
          yellow_pressure: await this.getSimVar("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE")
        },
        pneumatic: {
          engine_1_bleed: await this.getSimVar("A32NX_PNEU_ENG_1_BLEED"),
          engine_2_bleed: await this.getSimVar("A32NX_PNEU_ENG_2_BLEED"),
          wing_anti_ice: await this.getSimVar("A32NX_PNEU_WING_ANTI_ICE")
        }
      }
    };
  }

  formatAllFlightStatus(status) {
    return `A32NX Flight Status:

AUTOPILOT:
  AP Engaged: ${status.autopilot.ap_engaged ? 'YES' : 'NO'}
  FD 1: ${status.autopilot.fd_1_engaged ? 'ON' : 'OFF'}
  Target Alt: ${status.autopilot.target_altitude}
  Target Hdg: ${status.autopilot.target_heading}
  Target Spd: ${status.autopilot.target_speed}
  A/THR: ${status.autopilot.autothrust_engaged ? 'ON' : 'OFF'}

ENGINES:
  Engine 1 N1: ${status.engines.engine_1_n1}%
  Engine 2 N1: ${status.engines.engine_2_n1}%
  Engine 1 EGT: ${status.engines.engine_1_egt}°C
  Engine 2 EGT: ${status.engines.engine_2_egt}°C

FLIGHT CONTROLS:
  Flaps: ${status.flight_controls.flaps_position}
  Spoilers Armed: ${status.flight_controls.spoilers_armed ? 'YES' : 'NO'}
  Gear: ${status.flight_controls.gear_down ? 'DOWN' : 'UP'}

NAVIGATION:
  Heading: ${status.navigation.heading}°
  Altitude: ${status.navigation.altitude} ft
  Speed: ${status.navigation.speed} kts

SYSTEMS:
  Electrical: BAT1=${status.systems.electrical.battery_1 ? 'ON' : 'OFF'}, BAT2=${status.systems.electrical.battery_2 ? 'ON' : 'OFF'}
  Hydraulic: GREEN=${status.systems.hydraulic.green_pressure}PSI, BLUE=${status.systems.hydraulic.blue_pressure}PSI
  Pneumatic: ENG1=${status.systems.pneumatic.engine_1_bleed ? 'ON' : 'OFF'}, ENG2=${status.systems.pneumatic.engine_2_bleed ? 'ON' : 'OFF'}`;
  }

  formatAutopilotStatus(autopilot) {
    return `Autopilot System:
  AP Engaged: ${autopilot.ap_engaged ? 'YES' : 'NO'}
  FD 1: ${autopilot.fd_1_engaged ? 'ON' : 'OFF'}
  Target Altitude: ${autopilot.target_altitude} ft
  Target Heading: ${autopilot.target_heading}°
  Target Speed: ${autopilot.target_speed} kts
  Autothrust: ${autopilot.autothrust_engaged ? 'ON' : 'OFF'}`;
  }

  formatEngineStatus(engines) {
    return `Engine System:
  Engine 1 N1: ${engines.engine_1_n1}%
  Engine 2 N1: ${engines.engine_2_n1}%
  Engine 1 EGT: ${engines.engine_1_egt}°C
  Engine 2 EGT: ${engines.engine_2_egt}°C`;
  }

  formatFlightControlsStatus(flightControls) {
    return `Flight Controls:
  Flaps Position: ${flightControls.flaps_position}
  Spoilers Armed: ${flightControls.spoilers_armed ? 'YES' : 'NO'}
  Landing Gear: ${flightControls.gear_down ? 'DOWN' : 'UP'}`;
  }

  formatNavigationStatus(navigation) {
    return `Navigation:
  Heading: ${navigation.heading}°
  Altitude: ${navigation.altitude} ft
  Speed: ${navigation.speed} kts`;
  }

  formatSystemsStatus(systems) {
    return `Aircraft Systems:
  Electrical: BAT1=${systems.electrical.battery_1 ? 'ON' : 'OFF'}, BAT2=${systems.electrical.battery_2 ? 'ON' : 'OFF'}
  Hydraulic: GREEN=${systems.hydraulic.green_pressure}PSI, BLUE=${systems.hydraulic.blue_pressure}PSI
  Pneumatic: ENG1=${systems.pneumatic.engine_1_bleed ? 'ON' : 'OFF'}, ENG2=${systems.pneumatic.engine_2_bleed ? 'ON' : 'OFF'}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("A32NX MCP Server v2.0 running on stdio");
  }
}

// Start the server
if (require.main === module) {
  const server = new A32NXMCPServer();
  server.run().catch(console.error);
}

module.exports = A32NXMCPServer;