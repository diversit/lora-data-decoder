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

## Thanks

Thanks to [Anthony Kirby](https://github.com/anthonykirby) for [lora-packet](https://github.com/anthonykirby/lora-packet) which is used by this tool.
