#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG; // You need to install pngjs library for PNG handling
const jpeg = require('jpeg-js'); // You need to install jpeg-js for JPEG handling

const program = new Command();

// Function to encode image to Gioyeimg format
function encodeImage(file, bitDepth, outputFile) {
    console.log(`Encoding ${file} with bit depth ${bitDepth}`);

    // Read the image file
    const ext = path.extname(file).toLowerCase();
    if (ext === '.png') {
        fs.createReadStream(file)
            .pipe(new PNG({ filterType: 4 }))
            .on('parsed', function () {
                const width = this.width;
                const height = this.height;
                const pixelData = processImageToGioye(this.data, bitDepth, width, height);
                const header = `${String(bitDepth).padStart(2, '0')}${String(width).padStart(4, '0')}${String(height).padStart(4, '0')}`;
                const gioyeimgData = header + pixelData;
                const output = outputFile || path.basename(file, ext) + '.csv';

                fs.writeFileSync(output, gioyeimgData);
                console.log(`Image encoded and saved as ${output}`);
            });
    } else {
        console.error('Only PNG files are supported for encoding.');
    }
}

// Function to process image data and convert to Gioyeimg format based on bit depth
function processImageToGioye(imageData, bitDepth, width, height) {
    let pixelData = '';

    if (bitDepth === 1) {
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const grayscale = Math.round((r + g + b) / 3);
            pixelData += grayscale > 127 ? '1,' : '0,';
        }
    } else if (bitDepth === 8) {
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const grayscale = Math.round((r + g + b) / 3);
            pixelData += `${grayscale},`;
        }
    } else if (bitDepth === 16) {
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const grayscale = Math.round((r + g + b) / 3);
            const repeatCount = 1;
            pixelData += `${repeatCount} ${grayscale},`;
        }
    } else if (bitDepth === 24) {
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            pixelData += `${r} ${g} ${b},`;
        }
    } else if (bitDepth === 32) {
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];
            pixelData += `${r} ${g} ${b} ${a},`;
        }
    }

    return pixelData.slice(0, -1);
}

// Function to decode Gioyeimg format to an image
function decodeImage(file, format, outputFile) {
    console.log(`Decoding ${file} to ${format}`);

    const ext = path.extname(file).toLowerCase();
    if (ext === '.csv') {
        const gioyeimgData = fs.readFileSync(file, 'utf8');
        const header = gioyeimgData.substring(0, 10);
        const bitDepth = parseInt(header.substring(0, 2), 10);
        const width = parseInt(header.substring(2, 6), 10);
        const height = parseInt(header.substring(6, 10), 10);
        const pixelData = gioyeimgData.substring(10).split(',');

        const imageData = new Uint8ClampedArray(width * height * 4); 
        let index = 0;

        pixelData.forEach((pixel) => {
            const pixelValues = pixel.split(' ');
            if (bitDepth === 1) {
                const grayscale = pixelValues[0] === '1' ? 255 : 0;
                imageData[index++] = grayscale;
                imageData[index++] = grayscale;
                imageData[index++] = grayscale;
                imageData[index++] = 255;
            } else if (bitDepth === 8) {
                const grayscale = parseInt(pixelValues[0], 10);
                imageData[index++] = grayscale;
                imageData[index++] = grayscale;
                imageData[index++] = grayscale;
                imageData[index++] = 255;
            } else if (bitDepth === 16) {
                const repeatCount = parseInt(pixelValues[0], 10);
                const grayscale = parseInt(pixelValues[1], 10);
                for (let j = 0; j < repeatCount; j++) {
                    imageData[index++] = grayscale;
                    imageData[index++] = grayscale;
                    imageData[index++] = grayscale;
                    imageData[index++] = 255;
                }
            } else if (bitDepth === 24) {
                const r = parseInt(pixelValues[0], 10);
                const g = parseInt(pixelValues[1], 10);
                const b = parseInt(pixelValues[2], 10);
                imageData[index++] = r;
                imageData[index++] = g;
                imageData[index++] = b;
                imageData[index++] = 255;
            } else if (bitDepth === 32) {
                const r = parseInt(pixelValues[0], 10);
                const g = parseInt(pixelValues[1], 10);
                const b = parseInt(pixelValues[2], 10);
                const a = parseInt(pixelValues[3], 10);
                imageData[index++] = r;
                imageData[index++] = g;
                imageData[index++] = b;
                imageData[index++] = a;
            }
        });

        const imgData = new Uint8ClampedArray(imageData);
        const output = outputFile || path.basename(file, '.csv') + '.' + format;

        if (format === 'jpeg') {
            const jpegData = jpeg.encode({ width, height, data: imgData }, 90);
            fs.writeFileSync(output, jpegData.data);
            console.log('JPEG file created.');
        } else if (format === 'png') {
            const pngData = new PNG({ width, height });
            pngData.data = imgData;
            pngData.pack().pipe(fs.createWriteStream(output));
            console.log('PNG file created.');
        }
    } else {
        console.error('Only CSV files are supported for decoding.');
    }
}

// Command-line argument parsing
program
  .name('gioyeimg')
  .description('Convert between Gioyeimg formats')
  .version('1.0.0');

// Encode command
program
  .command('encode')
  .description('Encode an image into Gioyeimg format')
  .argument('<file>', 'input file to encode')
  .option('-e, --bitdepth <number>', 'set the bit depth (1, 8, 16, 24, 32)', parseInt, 32) // Set default bitdepth to 32
  .option('-o, --output <file>', 'output file name')
  .action((file, options) => {
    encodeImage(file, options.bitdepth, options.output);
  });

// Decode command
program
  .command('decode')
  .description('Decode a Gioyeimg file back to an image format')
  .argument('<file>', 'input Gioyeimg file to decode')
  .option('-d, --format <format>', 'output format (jpeg, png)', 'png') // Default to png
  .option('-o, --output <file>', 'output file name')
  .action((file, options) => {
    decodeImage(file, options.format, options.output);
  });

program.parse(process.argv);
