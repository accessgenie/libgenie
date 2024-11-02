"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapBinaryValue = mapBinaryValue;
function mapBinaryValue(input, values) {
    const normalizedInput = input === null || input === void 0 ? void 0 : input.trim().toLowerCase();
    if (normalizedInput === 'y' || normalizedInput === 'yes' || normalizedInput === '1' || normalizedInput === 'true') {
        return values[0];
    }
    if (normalizedInput === 'n' || normalizedInput === 'no' || normalizedInput === '0' || normalizedInput === 'false') {
        return values[1];
    }
    return normalizedInput ? values[0] : values[1];
}
