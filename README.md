# A32NX MCP Server

Model Context Protocol (MCP) server for controlling the FlyByWire A32NX aircraft in Microsoft Flight Simulator.

Warning: Early development

## Overview

This MCP server provides comprehensive control over the A32NX aircraft through a standardized API, including:

- **Direct Flight Controls**: Throttle levers, sidestick, rudder pedals, brake pedals
- **Autopilot System**: Altitude, heading, speed, vertical speed control
- **Flight Management**: Waypoints, flight plans, FMS commands
- **Aircraft Systems**: Electrical, hydraulic, pneumatic, lighting
- **Navigation**: Radios, transponder, ADIRS
- **Emergency Systems**: RAT, emergency generator, oxygen

## Installation

1. Install dependencies:
```bash
npm install @modelcontextprotocol/sdk
```

2. Run the server:
```bash
node a32nx-mcp-server.js
```

## Usage

The server runs on stdio transport and exposes 40+ tools for aircraft control. Example tools:

- `set_throttle_levers` - Control thrust levers directly
- `set_sidestick_input` - Pitch and roll control
- `set_autopilot_altitude` - Set autopilot target altitude
- `set_landing_gear` - Raise/lower landing gear
- `get_flight_status` - Get comprehensive aircraft status

## API Reference

Based on the official [A32NX API documentation](https://docs.flybywiresim.com/aircraft/a32nx/a32nx-api/).

## Requirements

- Microsoft Flight Simulator
- FlyByWire A32NX aircraft
- Node.js
- MCP-compatible client

## License

MIT