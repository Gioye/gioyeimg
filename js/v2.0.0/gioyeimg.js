#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const jpeg = require('jpeg-js');

const program = new Command();

function processImageToGioye(imageData, bitDepth, width, height) {
    let pixelData = [];
    for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (bitDepth === 1) {
            const grayscale = Math.round((r + g + b) / 3);
            pixelData.push(grayscale > 127 ? '1' : '0');
        } else if (bitDepth === 8) {
            const grayscale = Math.round((r + g + b) / 3);
            pixelData.push(grayscale.toString());
        } else if (bitDepth === 16) {
            const grayscale = Math.round((r + g + b) / 3);
            pixelData.push(`1 ${grayscale}`);
        } else if (bitDepth === 24) {
            pixelData.push(`${r} ${g} ${b}`);
        } else if (bitDepth === 32) {
            pixelData.push(`${r} ${g} ${b} ${a}`);
        }
    }
    return pixelData;
}

function encodeCSV(file, bitDepth, outputFile) {
    const ext = path.extname(file).toLowerCase();
    if (ext !== '.png') return console.error('Only PNG files are supported.');
    fs.createReadStream(file)
        .pipe(new PNG({ filterType: 4 }))
        .on('parsed', function () {
            const width = this.width;
            const height = this.height;
            const header = `${String(bitDepth).padStart(2, '0')}${String(width).padStart(4, '0')}${String(height).padStart(4, '0')}`;
            const pixelData = processImageToGioye(this.data, bitDepth, width, height);
            const gioyeimgData = header + pixelData.join(',');
            const output = outputFile || path.basename(file, ext) + '.csv';
            fs.writeFileSync(output, gioyeimgData);
            console.log(`CSV Gioyeimg saved to ${output}`);
        });
}

function encodeBinary(file, bitDepth, outputFile) {
    const ext = path.extname(file).toLowerCase();
    if (ext !== '.png') return console.error('Only PNG files are supported.');
    fs.createReadStream(file)
        .pipe(new PNG({ filterType: 4 }))
        .on('parsed', function () {
            const width = this.width;
            const height = this.height;
            const header = `BIN_${String(bitDepth).padStart(2, '0')}${String(width).padStart(4, '0')}${String(height).padStart(4, '0')}`;
            const pixelData = processImageToGioye(this.data, bitDepth, width, height);
            const flat = [];
            for (const pixel of pixelData) {
                for (const val of pixel.split(' ')) {
                    flat.push(Number(val));
                }
            }
            const output = outputFile || path.basename(file, ext) + '.gioyeimg';
            const buffer = Buffer.concat([Buffer.from(header), Buffer.from(flat)]);
            fs.writeFileSync(output, buffer);
            console.log(`Binary Gioyeimg saved to ${output}`);
        });
}

function decodeImage(file, format, outputFile) {
    const buffer = fs.readFileSync(file);
    const isBinary = buffer.slice(0, 4).toString() === 'BIN_';
    let header, bitDepth, width, height, pixels;
    if (isBinary) {
        header = buffer.slice(4, 14).toString();
        bitDepth = parseInt(header.slice(0, 2), 10);
        width = parseInt(header.slice(2, 6), 10);
        height = parseInt(header.slice(6, 10), 10);
        const pixelBytes = buffer.slice(14);
        const bytesPerPixel = { 1: 1, 8: 1, 16: 2, 24: 3, 32: 4 }[bitDepth];
        const count = pixelBytes.length / bytesPerPixel;
        pixels = [];
        for (let i = 0; i < count; i++) {
            const pixel = [];
            for (let j = 0; j < bytesPerPixel; j++) {
                pixel.push(pixelBytes[i * bytesPerPixel + j]);
            }
            pixels.push(pixel);
        }
    } else {
        const content = buffer.toString();
        header = content.slice(0, 10);
        bitDepth = parseInt(header.slice(0, 2), 10);
        width = parseInt(header.slice(2, 6), 10);
        height = parseInt(header.slice(6, 10), 10);
        pixels = content.slice(10).split(',').map(p => p.split(' ').map(Number));
    }
    const imageData = new Uint8ClampedArray(width * height * 4);
    let idx = 0;
    for (const pixel of pixels) {
        let r = 0, g = 0, b = 0, a = 255;
        if (bitDepth === 1) {
            r = g = b = pixel[0] === 1 ? 255 : 0;
        } else if (bitDepth === 8) {
            r = g = b = pixel[0];
        } else if (bitDepth === 16) {
            const repeat = pixel[0], val = pixel[1];
            for (let i = 0; i < repeat; i++) {
                imageData.set([val, val, val, 255], idx);
                idx += 4;
            }
            continue;
        } else if (bitDepth === 24) {
            [r, g, b] = pixel;
        } else if (bitDepth === 32) {
            [r, g, b, a] = pixel;
        }
        imageData.set([r, g, b, a], idx);
        idx += 4;
    }
    const output = outputFile || path.basename(file).split('.')[0] + '.' + format;
    if (format === 'jpeg') {
        const jpegData = jpeg.encode({ width, height, data: imageData }, 90);
        fs.writeFileSync(output, jpegData.data);
    } else if (format === 'png') {
        const png = new PNG({ width, height });
        png.data = imageData;
        png.pack().pipe(fs.createWriteStream(output));
    }
    console.log(`Decoded image saved to ${output}`);
}

program
    .name('gioyeimg')
    .description('Convert between Gioyeimg formats')
    .version('2.0.0');

program
    .command('encodecsv')
    .description('Encode PNG to Gioyeimg CSV format')
    .argument('<file>')
    .option('-e, --bitdepth <number>', '', parseInt, 32)
    .option('-o, --output <file>')
    .action((file, options) => encodeCSV(file, options.bitdepth, options.output));

program
    .command('encodebin')
    .description('Encode PNG to Gioyeimg binary format')
    .argument('<file>')
    .option('-e, --bitdepth <number>', '', parseInt, 32)
    .option('-o, --output <file>')
    .action((file, options) => encodeBinary(file, options.bitdepth, options.output));

program
    .command('encode')
    .description('Default encode to binary Gioyeimg format')
    .argument('<file>')
    .option('-e, --bitdepth <number>', '', parseInt, 32)
    .option('-o, --output <file>')
    .action((file, options) => encodeBinary(file, options.bitdepth, options.output));

program
    .command('decode')
    .description('Decode a Gioyeimg (CSV or Binary) to image')
    .argument('<file>')
    .option('-d, --format <format>', '', 'png')
    .option('-o, --output <file>')
    .action((file, options) => decodeImage(file, options.format, options.output));

program.parse(process.argv);
