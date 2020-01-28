# Lora Data Decoder

A cli utility to help decoding of LoRa data packets to extract device address and some other data.

Starting from a tcpdump of UDP packets received from LoRa Gateways,
this tool can then read the LoRa json and decode the data packet.

_Note that this tool __cannot__ decode the actual payload since both the network key and application key are required for that._

## Installation

Clone this repo and install locally

```
git clone https://github.com/diversit/lora-data-decoder.git
cd lora-data-decoder
npm install -g
```

Check options:
`lora-data-decoder -h`

## Preparation

### Capture data
Before using this tool, UDP packets need to be captured or prepare data in a CSV.

Data can be captured using:

`> tcpdump -i lo udp port 2000 -c 10000 -U -w /var/log/tcpdump.out`

This will capture 10000 packets on UDP port 2000 and write them to file in PCAP format.

### Convert data to json

The PCAP file can be opened in [Wireshark](https://www.wireshark.org).
Use Wireshark to filter out unwanted packets. E.g. filter `data.len > 100` to remove some noise packets.

Then export the remaining packets using `File -> Export Packet Dissections -> AS JSON`.
Make sure to select packet range _Displayed_ to only export the filtered packets.

The resulting json file can now be used with this tool.

## Usage

`> lora-data-decoder` shows help

### Prepare

Command to prepare the export file from Wireshark to it can easily be processed.

`> lora-data-decoder prepare <wireshark-export.json>`

Output
- packets.json : contains the json packets only
- packets.csv : a csv file containing all fields of the PUSH_DATA packet as described on [packet forwarder protocol](https://github.com/Lora-net/packet_forwarder/blob/master/PROTOCOL.TXT). Contains fields:
  - protocol version
  - random token
  - push data identifier (0x00)
  - gateway identifier (MAC address)
  - json object
  
  This file can be used to replay to events to a (different) LoRa server using `send` command.

### Decode

Decode the packets to see the device address, port etc.
See `> lora-data-decoder decode -h` for all options.

Decode packets and split per device:

`> lora-data-decoder decode -d decoded.all -o out -s packets.json`

Output
- decoded.all : a csv with all records of all devices. (field see below))
- out/ : folder with output files per device.
- out/\<device-address>.json : contains the json packet only
- out/\<device-address>.csv : contains csv record with fields
  - protocol version
  - random token
  - push data identifier (0x00)
  - gateway identifier (MAC address)
  - json object
  - device address (hex format)
  - message type (e.g. 'Unconfirmed Data')
  - message direction
  - message frame count for the device
  - payload port
  - payload data (json)

### Send

`send` can send packets from the csv output from the `prepare` command.

`> lora-data-decoder send -t <host> -p <udp-port> -d <delay> <csv>`

## Thanks

Thanks to [Anthony Kirby](https://github.com/anthonykirby) for [lora-packet](https://github.com/anthonykirby/lora-packet) which is used by this tool.
