# Gioyeimg.js

**Gioyeimg.js** is a CLI tool and Node.js library to encode and decode images using the custom `.gioyeimg` format — a simple and flexible format that supports both CSV and binary variations.

## ✨ Features

- Encode PNG images to `.gioyeimg` (CSV or binary)
- Decode `.gioyeimg` back into PNG or JPEG images
- Convert between CSV and binary formats
- Support for multiple bit depths (1, 8, 16, 24, 32)
- Auto-detection of format on decode
- CLI support with simple commands

## 📦 How To Use:

First, download git, then run:

```bash
git clone https://github.com/Gioye/gioyeimg.git
```

Then find the newest version In the "js" folder of the "text" Branch..

Find the gioyeimg.js file.

Move it to a folder (for example your home folder) To get it always ready.

## 🧪 Usage (2.0+)

### Encode (defaults to binary)

```bash
gioyeimg encode input.png -e 32 -o output.gioyeimg
```

### Encode as CSV

```bash
gioyeimg encodecsv input.png -e 24 -o output.csv
```

### Encode as Binary

```bash
gioyeimg encodebin input.png -e 24 -o output.gioyeimg
```

### Decode (auto detects format)

```bash
gioyeimg decode output.gioyeimg -d png -o restored.png
```

### Convert CSV ↔ BIN

```bash
gioyeimg csvtobin image.csv -o image.gioyeimg
gioyeimg bintocsv image.gioyeimg -o image.csv
```


## 📁 File Format

### CSV Header

```
XXYYYYZZZZ
```

- `XX` = bit depth (e.g., 08)
- `YYYY` = width (e.g., 0256)
- `ZZZZ` = height (e.g., 0256)

### Binary Header

```
BIN_XXYYYYZZZZ
```

- Same as CSV but prefixed with `BIN_`
- Followed by raw binary bytes for image data (e.g., RGBA bytes for 32-bit)

## 📂 Project Structure

```
js/         → Contains gioyeimg.js (core CLI tool)
sample/     → Example files (images, .gioyeimg, .csv)
```

## ⚖ License

Licensed under the MIT License. If possible, please credit the author.

---

Made with ❤️ by Gioyous (aka Gioye)
