"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ParserCsvLine = /** @class */ (function () {
    function ParserCsvLine(line) {
        var _this = this;
        this.protocol = function () { return _this.lineItems[0]; };
        this.randomToken = function () { return _this.lineItems[1]; };
        this.pushData = function () { return _this.lineItems[2]; };
        this.gatewayMac = function () { return _this.lineItems[3]; };
        this.json = function () { return _this.lineItems[4].endsWith(',') ? _this.lineItems[4].slice(0, -1) : _this.lineItems[4]; };
        this.lineItems = line.split(';');
    }
    ParserCsvLine.prototype.fromHexString = function (hexString) {
        var twoCharsArray = hexString.match(/.{1,2}/g);
        if (twoCharsArray == null) {
            throw new Error("hexString empty");
        }
        else {
            return new Uint8Array(twoCharsArray.map(function (byte) { return parseInt(byte, 16); }));
        }
    };
    ParserCsvLine.HEADER = 'protocol;randomToken;pushData;gatewayMac;json';
    return ParserCsvLine;
}());
exports.ParserCsvLine = ParserCsvLine;
var DecoderCsvLine = /** @class */ (function (_super) {
    __extends(DecoderCsvLine, _super);
    function DecoderCsvLine(line) {
        var _this = _super.call(this, line) || this;
        _this.deviceAddress = function () { return _this.lineItems[5]; };
        _this.messageType = function () { return _this.lineItems[6]; };
        _this.messageDirection = function () { return _this.lineItems[7]; };
        _this.messageFrameCount = function () { return _this.lineItems[8]; };
        _this.payloadPort = function () { return _this.lineItems[9]; };
        _this.payloadData = function () { return _this.lineItems[10]; };
        return _this;
    }
    DecoderCsvLine.HEADER = ParserCsvLine.HEADER + 'deviceAddress;messageType;messageDirection;messageFrameCount;payloadPort;payloadData';
    return DecoderCsvLine;
}(ParserCsvLine));
exports.DecoderCsvLine = DecoderCsvLine;
